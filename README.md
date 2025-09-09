# Price extraction and comparison documentation

## Overview
This project is a location-aware shopping basket price comparison system for retail chains.
It automatically scrapes official retail chain price data, stores it in a database, and lets users compare the total cost of their shopping cart across nearby branches.

## Features
- Automated Scraping
Uses selenium with a headless Chrome browser to fetch product files from official retailer websites.
Supports .gz and .zip compressed XML formats.

- Data Parsing & Storage
Extracts Store, Chain, and Item details from XML files.
Stores data in a structured database (SQLAlchemy ORM).

- Shopping Cart Price Comparison
Users provide a list of items.
The system computes basket costs across chains.
Returns the five cheapest branches closest to the user’s location.

- REST API
`GET /compare_list` → Returns price comparison for a predefined item list.
`POST /compare_list` → Accepts a JSON body with custom items.
Response includes store name, branch, distance, and basket cost.

## How to seed
1. cd utilities
2. pipenv shell
3. pipenv install
6. pipenv run dbinit (Run only when migrations folder does not exist)
7. pipenv run dbmigrate
8. pipenv run dbupgrade
9. pipenv run seed (to scrape data)
10. pipenv run start

## Data Flow
1. Scraping
Scraper visits each retailer link (Main.aspx).
Extracts downloadable XML/ZIP/GZIP product files.
Parses them into structured JSON.

2. Storage
Saves data into tables:
Store → Chain name.
Chain → Branch info.
Item → Product details.

3. Comparison
User’s shopping list is matched against items in the DB.
System calculates basket cost per branch.
Returns sorted list (cheapest first, filtered by distance).

## Example Requests
`GET /compare_list`
Returns prices for predefined items:

`POST /compare_list`

Send custom items list:
Response example:
```json
  [
    {
      "storeName": "Kingstore",
      "branch": "ראשון לציון",
      "items": [
        {
          "code": "12345",
          "name": "מלפפון פרימיום",
          "price": 4.5,
          "unit": 1,
          "AllowDiscount": true
        }
      ]
    }
  ]
```

# Prediction Model Documentation

## Overview

The Purchase Prediction Model is designed to forecast household shopping needs based on historical transaction data stored in MongoDB. It leverages pandas for data manipulation and implements a scoring system that balances recency and frequency of purchases to determine the likelihood of an item being needed again soon.

## Contents
1. Overview
2. Data Source
3. Model Logic
4. Example
5. Implementation Highlights
6. Benefits

## Data Source
- Database: MongoDB

- Collection: purchases

- Structure: Each purchase document typically contains fields such as:
```json
  {
    "household_id": "684d3028dab5df14d3285146",
    "shoppingListId": "684d3029dab5df14d328514f",
    "itemName": "Milk",
    "quantity": 2,
    "purchasedAt": "2025-08-05",
    ...
  }
```
- Data is loaded into a pandas DataFrame for preprocessing:
```py
  purchases = list(collection.find({}, {"_id": 0}))
  df = pd.DataFrame(purchases)
```

## Model Logic
The prediction system assigns a likelihood score to each item a household has purchased in the past. This score is computed from two key signals:

1. Recency Factor
  - Measures how recently an item was purchased.

  - Recent purchases indicate a shorter expected time before the next purchase.

  - Formula:
  ```python
    recency_days = (today - last_purchase_date).days
    recency_score = max(0, 1 - recency_days / 30)
    boost += 0.6 * recency_score
  ```
  Scaled to 0 → 1 (items bought today = high score; items not bought in >30 days = low score).

  Weighted 60% of total score.

2. Frequency Factor

  - Measures how often an item is purchased historically.

  - Items purchased frequently are more likely to be repeat buys.

  - Formula:
  ```python
    freq_score = purchase_counts.get(item, 0) / max_freq
    boost += 0.4 * freq_score
  ```
  Normalized by dividing item frequency by the most frequently purchased item.

  Scaled to 0 → 1.

  Weighted 40% of total score.

3. Final Scoring

  The overall likelihood score is a weighted combination:

  ```python
    score = 0.6 * recency_score + 0.4 * freq_score
  ```
  Items are then ranked by this score to generate predicted shopping lists.

## Example
Suppose a household purchase history contains:
| Item  | Last Purchase | Purchase Count |
| ----- | ------------- | -------------- |
| Milk  | 1 day ago     | 50             |
| Bread | 7 days ago    | 30             |
| Eggs  | 20 days ago   | 15             |
| Sugar | 60 days ago   | 5              |

Milk: Very recent + very frequent → High score

Bread: Moderate recency + high frequency → High-mid score

Eggs: Older purchase but moderately frequent → Mid score

Sugar: Very old + low frequency → Low score

The model would recommend Milk, Bread, and Eggs, but not Sugar.

## Implementation Highlights

1. MongoDB Connection
1. Connects with credentials, checks connection with ping.
1. DataFrame Creation
1. Converts MongoDB results into pandas DataFrame.
1. Purchase Analysis
1. Groups by item to calculate purchase counts and last purchase dates.
1. Scoring System
1. Applies recency and frequency boosts.
1. Prediction Output
1. Returns ranked items as predictions.

## Benefits
1. Lightweight: No heavy ML training needed; purely satistical scoring.
1. Dynamic: Works in real-time with live MongoDB data.
1. Customizable: Weights (recency vs frequency) can be tuned per household.