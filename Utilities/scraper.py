from selenium import webdriver
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.common.by import By
import requests
import xml.etree.ElementTree as ET
from io import BytesIO
import gzip
import zipfile
import time
import re
from models import db, Store, Chain, Item

class Scraper:
    def __init__(self, link, store_name):
        self._link = None
        self._store_name = None
        self.link = link
        self.store_name = store_name

    @property
    def link(self):
        return self._link

    @link.setter
    def link(self, value):
        if not self.is_valid_link(value):
            raise ValueError(f"Invalid store link format: {value}")
        self._link = value

    @property
    def store_name(self):
        return self._store_name

    @store_name.setter
    def store_name(self, value):
        if not isinstance(value, str):
            raise ValueError(f"Invalid store name format: {value}")
        self._store_name = value

    @staticmethod
    def is_valid_link(link: str) -> bool:
        pattern = r"^https://([a-zA-Z0-9\-]+)\.binaprojects\.com/Main\.aspx$"
        return re.match(pattern, link) is not None

    # === SETUP SELENIUM HEADLESS CHROME ===
    def setup_browser(self):
        options = Options()
        options.headless = True
        options.add_argument("--disable-gpu")
        options.add_argument("--no-sandbox")
        return webdriver.Chrome(options=options)

    # === EXTRACT LINKS FROM RENDERED PAGE ===
    def get_file_links(self):
        driver = self.setup_browser()
        driver.get(self._link)
        time.sleep(5)  # wait for JS

        rows = driver.find_elements(By.CSS_SELECTOR, "#myTable tbody tr")
        file_info = []

        for row in rows:
            cols = row.find_elements(By.TAG_NAME, "td")
            if len(cols) >= 6:
                filename = cols[0].text.strip()
                branch = cols[1].text.strip()
                try:
                    btn = cols[5].find_element(By.TAG_NAME, "button")
                    onclick_attr = btn.get_attribute("onclick")
                    if "Download('" in onclick_attr:
                        file_param = onclick_attr.split("Download('")[1].split("'")[0]
                        file_info.append({
                            "filename": file_param,
                            "branch": branch
                        })
                except Exception as e:
                    print(f"⚠️ Could not process row: {e}")
        driver.quit()
        return file_info

    # === GET DOWNLOAD PATH FOR A FILE ===
    def get_download_url(self, filename):
        if filename.startswith("PromoFull"):
            return None  # Skip promo files

        url = f"https://{self._store_name}.binaprojects.com/Download.aspx?FileNm={filename}"
        resp = requests.post(url)
        resp.raise_for_status()
        data = resp.json()
        if data and "SPath" in data[0]:
            return data[0]["SPath"].lstrip("/")
        return None

    # === PARSE XML TO JSON ===
    def parse_xml_to_json(self, xml_data, branch):
        root = ET.fromstring(xml_data)
        return {
            "chainId": root.findtext("ChainId"),
            "subChainId": root.findtext("SubChainId"),
            "storeId": root.findtext("StoreId"),
            "bikoretNo": root.findtext("BikoretNo"),
            "branch": branch,
            "items": [
                {child.tag: child.text for child in item}
                for item in root.find("Items").findall("Item")
            ]
        }

    # === DOWNLOAD FILE AND PARSE XML ===
    def download_and_parse_file(self, url, branch):
        print(f"📥 Downloading: {url}")
        r = requests.get(url)
        r.raise_for_status()
        content = BytesIO(r.content)

        signature = content.read(2)
        content.seek(0)

        if signature == b'\x1f\x8b':  # GZIP
            with gzip.open(content, 'rt', encoding='utf-8') as f:
                xml_data = f.read()
        elif signature == b'PK':  # ZIP
            with zipfile.ZipFile(content) as zipf:
                name = zipf.namelist()[0]
                with zipf.open(name) as f:
                    xml_data = f.read().decode('utf-8')
        else:
            raise ValueError("Unsupported file type (not .gz or .zip)")

        return self.parse_xml_to_json(xml_data, branch)

    # === MAIN SCRAPE FUNCTION ===
    def scrape_and_save(self):
        # Save store and get ID
        store = Store(name=self._store_name)
        db.session.add(store)
        db.session.commit()

        file_entries = self.get_file_links()
        for entry in file_entries[:6]:  # change slice to process more files
        #for entry in file_entries:  # change slice to process more files
            try:
                dl_url = self.get_download_url(entry["filename"])
                print('✅ Download URL:', dl_url)
                if dl_url:
                    chain_data = self.download_and_parse_file(dl_url, entry["branch"])
                    chain = Chain(
                        chainId=chain_data["chainId"],
                        subChainId=chain_data["subChainId"],
                        storeId=chain_data["storeId"],
                        bikoretNo=chain_data["bikoretNo"],
                        branch=chain_data["branch"]
                    )
                    db.session.add(chain)
                    db.session.commit()

                    for item_data in chain_data["items"]:
                        item = Item(
                            ItemCode=item_data.get("ItemCode"),
                            ItemNm=item_data.get("ItemNm"),
                            ManufacturerName=item_data.get("ManufacturerName"),
                            Quantity=float(item_data.get("Quantity") or 0),
                            QtyInPackage=float(item_data.get("QtyInPackage") or 0),
                            ItemPrice=float(item_data.get("ItemPrice") or 0),
                            AllowDiscount=item_data.get("AllowDiscount") == "true",
                            ItemStatus=item_data.get("ItemStatus") == "true",
                            chain_id=chain.id,
                            store_id=store.id
                        )
                        db.session.add(item)
                    db.session.commit()
            except Exception as e:
                print(f"❌ Error processing {entry['filename']}: {e}")
