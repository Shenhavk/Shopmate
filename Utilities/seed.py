#!/usr/bin/env python3
# seed.py

from app import app
from models import db, StoreLink, Store, Chain, Item
from scraper import Scraper

with app.app_context():
    # Delete all rows in tables
    StoreLink.query.delete()
    Store.query.delete()
    Chain.query.delete()
    Item.query.delete()

    links = [
        'https://citymarketkiryatgat.binaprojects.com/Main.aspx',
        'https://goodpharm.binaprojects.com/Main.aspx',
        'https://kingstore.binaprojects.com/Main.aspx',
        'https://ktshivuk.binaprojects.com/Main.aspx',
        'https://maayan2000.binaprojects.com/Main.aspx',
        'https://shefabirkathashem.binaprojects.com/Main.aspx',
        'https://shuk-hayir.binaprojects.com/Main.aspx',
        'https://superbareket.binaprojects.com/Main.aspx',
        'https://zolvebegadol.binaprojects.com/Main.aspx'
    ]

    stored_links = []

    # Add links instances to database
    for link in links:
        stored_link = StoreLink(link=link)
        stored_links.append(stored_link)

    db.session.add_all(stored_links)
    db.session.commit()

    # scrape data
    for link in stored_links:
        l1 = Scraper(link.link, link.name)
        l1.scrape_and_save()