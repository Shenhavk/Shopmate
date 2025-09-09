from selenium import webdriver
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.common.by import By
import requests
import gzip
import xml.etree.ElementTree as ET
from io import BytesIO
import json
import time
import zipfile


# === CONFIG ===
PAGE_URL = "https://shefabirkathashem.binaprojects.com/Main.aspx"  # this loads the form and runs JS
STORE_NAME='shefabirkathashem'
OUTPUT_JSON = "shefabirkathashem.json"

# === SETUP SELENIUM HEADLESS CHROME ===
def setup_browser():
    options = Options()
    options.headless = True
    options.add_argument("--disable-gpu")
    options.add_argument("--no-sandbox")
    driver = webdriver.Chrome(options=options)
    return driver

# === EXTRACT LINKS FROM RENDERED PAGE ===
def get_file_links():
    driver = setup_browser()
    driver.get(PAGE_URL)

    # Wait for JS to populate the table
    time.sleep(5)  # increase if your network is slow

    rows = driver.find_elements(By.CSS_SELECTOR, "#myTable tbody tr")
    file_info = []

    for row in rows:
        cols = row.find_elements(By.TAG_NAME, "td")
        if len(cols) >= 6:
            filename = cols[0].text.strip()
            branch = cols[1].text.strip()
            # get download function call argument
            btn = cols[5].find_element(By.TAG_NAME, "button")
            onclick_attr = btn.get_attribute("onclick")
            if "Download('" in onclick_attr:
                file_param = onclick_attr.split("Download('")[1].split("'")[0]
                file_info.append({
                    "filename": file_param,
                    "branch": branch
                })

    driver.quit()
    return file_info

# === GET DOWNLOAD PATH FOR A FILE ===
def get_download_url(filename):
    resp = requests.post(f"https://{STORE_NAME}.binaprojects.com/Download.aspx?FileNm={filename}")
    resp.raise_for_status()
    data = resp.json()
    if data and "SPath" in data[0]:
        return data[0]["SPath"].lstrip("/")
    return None

# === PARSE XML TO JSON ===
def parse_xml_to_json(xml_data, branch):
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

def download_and_parse_file(url, branch):
    print(f"Downloading: {url}")
    r = requests.get(url)
    r.raise_for_status()
    content = BytesIO(r.content)

    # Check file header: first 2 bytes
    signature = content.read(2)
    content.seek(0)

    if signature == b'\x1f\x8b':  # GZIP magic number
        with gzip.open(content, 'rt', encoding='utf-8') as f:
            xml_data = f.read()
    elif signature == b'PK':  # ZIP magic number
        with zipfile.ZipFile(content) as zipf:
            # Use first file inside the ZIP
            name = zipf.namelist()[0]
            with zipf.open(name) as f:
                xml_data = f.read().decode('utf-8')
    else:
        raise ValueError("Unsupported file type (not .gz or .zip)")

    return parse_xml_to_json(xml_data, branch)

# === MAIN ===
def main():
    file_entries = get_file_links()
    store_data = {
        "store": STORE_NAME,
        "chains": []
    }
    # print(file_entries)

    for entry in file_entries[:1]:
        try:
            dl_url = get_download_url(entry["filename"])
            print('dl_url',dl_url)
            if dl_url:
                chain_data = download_and_parse_file(dl_url, entry["branch"])
                store_data["chains"].append(chain_data)
                print(chain_data)
        except Exception as e:
            print(f"❌ Error processing {entry['filename']}: {e}")

    with open(OUTPUT_JSON, "w", encoding="utf-8") as f:
        json.dump(store_data, f, ensure_ascii=False, indent=2)

    print(f"✅ Done. Saved {len(store_data['chains'])} chains to {OUTPUT_JSON}")

if __name__ == "__main__":
    main()
