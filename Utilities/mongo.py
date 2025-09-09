from pymongo import MongoClient
from pymongo.errors import ConnectionFailure
from dotenv import load_dotenv
import os
import pandas as pd
load_dotenv()

username = os.getenv('MONGO_URI_DEV_USERNAME')
password = os.getenv('MONGO_URI_DEV_PASSWORD')
connection_endpoint = os.getenv('MONGO_URI_DEV_CONNECTION_ENDPOINT')
connectionString = os.getenv('MONGO_URI_DEV_LOCAL') or f"mongodb+srv://{username}:{password}@{connection_endpoint}"

def fetch_purchases():
    try:
        # Try connecting to MongoDB
        client = MongoClient(connectionString, serverSelectionTimeoutMS=5000)  # 5 sec timeout
        client.admin.command('ping')  # Force connection check

        db = client["dev"]       # database
        collection = db["purchases"]  # collection

        purchases = list(collection.find({}, {"_id": 0}))
        print("Loaded purchases from MongoDB", len(purchases))
        # df = pd.DataFrame(purchases)
        # return df
        if not purchases:
            return pd.DataFrame()

        df = pd.DataFrame(purchases)
        return df

    except ConnectionFailure as e:
        print(f"Could not connect to MongoDB: {e}")
        print("Falling back to local purchases.csv")
        df = pd.read_csv("purchases.csv")
        return df

    except Exception as e:
        print(f"Unexpected error: {e}")
        print("Falling back to local purchases.csv")
        df = pd.read_csv("purchases.csv")
        return df
