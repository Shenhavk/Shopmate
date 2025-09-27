# Shopmate

Shopmate is a smart household shopping management application designed to simplify how families and roommates handle their shopping lists.
It enables collaborative list management, predicts products that may soon be needed using purchase history, and compares basket prices across multiple stores to ensure cost-effective shopping.

---

## Features

**Shared Shopping List:** Each household member can create, update, or delete items. All changes are tracked with full history (who updated what and when), with undo support for mistaken actions.

**Purchase Prediction:** A recommendation engine analyzes purchase frequency and recency to suggest items likely needed again soon.

**Price Comparison:** Automatically scrapes official retailer price files, parses them, and calculates basket costs across stores. Stores are ranked based on basket completeness: first appear stores where all items are available, followed by stores with one missing item, then two, and so on. This helps users identify the store that best matches their shopping list while comparing basket prices.

**Mobile-Friendly UI:** Built with React Native + Expo, providing simple navigation, shopping list view, recommendations, and price comparison results.  

---

## Technologies Used

### Frontend (Mobile App - Expo, React Native)

**Core Framework:** React, react-native, react-native-web, Expo

**Navigation & State:** expo-router, @react-navigation/native, @react-native-async-storage/async-storage

**UI & Animations:** react-native-safe-area-context, react-native-reanimated

**Utilities:** Moment (date parsing/formatting), Axios (API calls)

**App Lifecycle & Styling:** expo-splash-screen, expo-font, expo-web-browser

### Backend - Main Server (Node.js, Express.js)

**Core Framework & API:** Express, axios

**Auth & Security:** JWT (jsonwebtoken) for authentication, bcryptjs (password hashing)

**Database:** Mongoose (MongoDB models)

**Configuration & Middleware:** CORS, dotenv

**Development & Utilities:** nodemon (development auto-restart), Winston/Logtail (logging), Faker.js / faker (test data seeding)

### Backend - Utilities Server (Flask, Python)

**Core Framework & API:** Flask, Flask-RESTful (REST endpoints for price comparison & predictions), Flask-CORS (cross-origin support)

**Database & Migrations:** Flask-SQLAlchemy (SQLite ORM for items/chains/stores), Flask-Migrate (schema migrations), Pymongo (reading purchases from MongoDB)

**Scraping & Data Retrieval:** Selenium (scraper with headless Chrome), Requests (downloading XML/ZIP/GZIP files)

**Configuration:** python-dotenv (environment configs)

**Predictions & Data Processing:** Pandas (data wrangling), Surprise (SVD recommender for predictions)

---

## Getting Started

### Clone the repository

```bash
git clone https://github.com/Shenhavk/Shopmate.git
cd shopmate
```

---

### Main Server (Node.js)

#### Install Dependencies

```bash
cd server
npm install
```

#### Create `.env` under `/server`

```
PORT=3000
MONGO_URI=
MONGO_URI_DEV_USERNAME=<your_mongo_username>
MONGO_URI_DEV_PASSWORD=<your_mongo_password>
MONGO_URI_DEV_CONNECTION_ENDPOINT=<your_mongo_connection_endpoint>

MONGO_URI_DEV_LOCAL=mongodb://localhost:27017/
JWT_SECRET=<your_jwt_secret>
```

#### Run the server

```bash
npm run dev
```

#### Seeding & Purchase History
##### To create 50 households with shopping lists, open in browser
```
http://localhost:3000/api/seed
```
##### After seeding, generate purchase history for model preparation (do this frequently)
```
http://localhost:3000/api/predictionModel
```

---

### Client (React Native + Expo)

#### Install Dependencies

```bash
cd client
npm install
```

#### Configure your computer's IP address inside `/constants/config.js`

```
export const IP_ADDR = "<Your IP address>";
export const API_URL = `http://${IP_ADDR}:3000`;
```

#### Run the app

```bash
npm start
```

#### Use Expo Go on a mobile device, or launch on Android/iOS simulator.

---

### Utilities Server (Python + Flask)

#### Install Dependencies

```bash
cd utilities
pipenv shell
pipenv install
```

#### Create `.env` under `/utilities`

```
FLASK_APP=app.py
FLASK_RUN_PORT=5000
MONGO_URI_DEV_USERNAME=<your_mongo_username>
MONGO_URI_DEV_PASSWORD=<your_mongo_password>
MONGO_URI_DEV_CONNECTION_ENDPOINT=<your_mongo_connection_endpoint>

MONGO_URI_DEV_LOCAL=mongodb://127.0.0.1:27017/
MONGO_DB_NAME=<your_db_name>
```

#### Initialize database and scrape data

```bash
pipenv run dbinit      # only if first run
pipenv run dbmigrate
pipenv run dbupgrade
pipenv run seed        # downloads and parses retailer price data
```

#### Run the service

```bash
pipenv run start
```

#### Model Training
##### To train the model (should be done frequently), open in browser
```
http://<ipaddr>:5000/api/prediction/model/train
```
##### This takes purchase history from MongoDB, preprocesses it, and trains the recommendation model.

---

## Project Structure

**/client/:** React Native mobile app (Expo)

**/server/:** Node.js backend (authentication, households, shopping lists, purchases)

**/utilities/:** Python Flask utilities service (scraper, price comparison, predictions)

**README.md:** Project documentation

```
Shopmate/
│
├── client/           # React Native frontend
├── server/           # Node.js main server
├── utilities/        # Python Flask utilities server
└── README.md         # Documentation
```