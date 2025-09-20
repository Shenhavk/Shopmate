import pandas as pd
from surprise import SVD, Dataset, Reader
from surprise.model_selection import train_test_split
from surprise import accuracy
import pickle
import random
from datetime import datetime
from mongo import fetch_purchases

def get_top_n(model, household_id='', N=20, boost_days=30, boost_value=0.05):
    df = fetch_purchases()
    all_items = df['itemName'].unique()

    # Get last purchase dates from real purchases only
    last_purchase = (
        df[df['householdId'].astype(str) == str(household_id)]
        .groupby('itemName')['purchasedAt']
        .max()
        .to_dict()
    )

    purchase_counts = (
        df[df['householdId'].astype(str) == str(household_id)]
        .groupby('itemName')
        .size()
        .to_dict()
    )
    
    today = datetime.today()
    results = []

    max_freq = max(purchase_counts.values()) if purchase_counts else 1

    for item in all_items:
        base_score = model.predict(household_id, item).est
        boost = 0
        
        # If they bought this item before, check recency
        if item in last_purchase and pd.notnull(last_purchase[item]):
            days_since = (today - last_purchase[item]).days
            recency_score = max(0, 1 - days_since / boost_days)
            boost += 0.6 * recency_score
            # if days_since >= boost_days:
            #     boost = boost_value  # boost old favourites due for repeat

        # Frequency boost (scaled 0–1)
        freq_score = purchase_counts.get(item, 0) / max_freq
        boost += 0.4 * freq_score
            
        final_score = base_score + boost
        results.append((item, final_score))
    
    # Sort by final score
    results.sort(key=lambda x: x[1], reverse=True)
    
    return results[:N]

# Example usage
# top_items = get_top_n(model, df, '684d3028dab5df14d3285146', 20)
# print("Top recommendations:", top_items)

def train_model():
    try:
        df = fetch_purchases()
        if df is None or df.empty:
            raise ValueError("df is None or empty")
            
        print(df.head())
        # Treat each purchase as a "rating" of 1 (implicit feedback)
        df['rating'] = 1

        # Ensure purchasedAt is datetime
        df['purchasedAt'] = pd.to_datetime(df['purchasedAt'], errors='coerce').dt.tz_localize(None)

        # Get all unique households and items
        households = df['householdId'].unique()
        items = df['itemName'].unique()

        # Create negative samples
        negatives = []
        for h in households:
            purchased = df[df['householdId'].astype(str) == h]['itemName'].tolist()
            candidates = list(set(items) - set(purchased))
            sampled = random.sample(candidates, min(20, len(candidates)))
            for i in sampled:
                negatives.append({
                    'householdId': h, 
                    'itemName': i, 
                    'rating': 0, 
                    'purchasedAt': None  # no purchase date for negatives
                })

        # Combine with original
        df_full = pd.concat([df, pd.DataFrame(negatives)], ignore_index=True)

        # Drop duplicates from combined dataset (in case any item is duplicated)
        df_full = df_full.drop_duplicates(subset=['householdId', 'itemName'])

        # Convert to Surprise dataset format
        reader = Reader(rating_scale=(0, 1))
        data = Dataset.load_from_df(df_full[['householdId', 'itemName', 'rating']], reader)

        # Train-test split
        trainset, testset = train_test_split(data, test_size=0.2)

        # Train model
        model = SVD()
        model.fit(trainset)

        # Evaluate (optional)
        predictions = model.test(testset)
        print("RMSE:", accuracy.rmse(predictions))

        # Save model
        with open("model.pkl", "wb") as f:
            pickle.dump(model, f)
        
        return ("Model Trained and updated, ready for use")    
    except Exception as err:
        print(f"Unexpected {err=}, {type(err)=}")
        # raise
    