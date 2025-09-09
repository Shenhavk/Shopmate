# server/app.py
#!/usr/bin/env python3

from flask import Flask,make_response, jsonify, request, Response
from flask_migrate import Migrate
from flask_restful import Resource,Api
from flask_cors import CORS
from sqlalchemy.orm import joinedload
import json
import pickle
from predictor import get_top_n, train_model
from models import db, Store, Chain, Item

app = Flask(__name__)
app.config["SQLALCHEMY_DATABASE_URI"] = "sqlite:///app.db"
app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False
app.json.compact = False
app.json.compact=False
CORS(app, supports_credentials=True)

migrate = Migrate(app, db)
db.init_app(app)
api=Api(app)

class Items(Resource):
    def get(self):
        name = request.args.get('name')
        store = request.args.get('store')
        branch = request.args.get('branch')

        # Start base query
        query = Item.query.options(
            joinedload(Item.chain),
            joinedload(Item.store)
        )

        if name:
            query = query.filter(Item.ItemNm.ilike(f"%{name}%"))
        
        if store:
            query = query.join(Item.store).filter(Store.name == store)

        if branch:
            query = query.join(Item.chain).filter(Chain.branch == branch)

        # Limit results
        items = query.limit(100).all()

        # Serialize data
        data = [
            item.to_dict(only=(
                'id', 'ItemNm', 'ItemPrice', 'ItemCode',
                'AllowDiscount', 'ItemStatus',
                'chain.branch', 'store.name'
            ))
            for item in items
        ]

        return Response(json.dumps(data, ensure_ascii=False), content_type='application/json')

# class Item_By_Id(Resource):
#     pass

class Stores(Resource):
    def get(self):
        name = request.args.get('name')
        
        query = Store.query
        if name:
            query = query.filter(Store.name.ilike(f"%{name}%"))

        stores = query.all()

        data = [
            store.to_dict(only=('id', 'name','chains'))
            for store in stores
        ]

        return Response(json.dumps(data, ensure_ascii=False), content_type='application/json')

# class Store_By_Id(Resource):
#     pass

class Chains(Resource):
    def get(self):
        branch = request.args.get('branch')
        store = request.args.get('store')

        query = Chain.query

        if branch:
            query = query.filter(Chain.branch.ilike(f"%{branch}%"))
        if store:
            query = query.join(Chain.items).join(Item.store).filter(Store.name.ilike(f"%{store}%"))

        chains = query.all()

        data = [
            {
               "id": chain.id,
               "branch": chain.branch,
               "storeId": chain.storeId,
               "chainId": chain.chainId,
               "stores": [store.name for store in chain.stores]           
            }
            for chain in chains
        ]
        return Response(json.dumps(data, ensure_ascii=False), content_type='application/json')

class Compare_List(Resource):
    def get(self):
        items_from_list = [
            "מלפפון פרימיום",
            "תפוח פינק ליידי",
            "גבינת עמק 28% במשקל תנובה",
            "פסק זמן חלב מגדים 45 ג'",
            "יוגורט אפרסק 3% שומן 150 ג' יופלה"
        ]
        # I will pass the Items to find price later
        # Add filters to narrow search say closest branch around me later
        # Get cost per branch for items
        chains = Chain.query.all()
        result = []
        for chain in chains:
            chain_dict = {}
            chain_dict['storeName']=chain.stores[0].name
            chain_dict['branch']=chain.branch
            chain_dict['items']=[{"code":item.ItemCode,"name":item.ItemNm, "price":item.ItemPrice,'unit':item.QtyInPackage,'AllowDiscount':item.AllowDiscount} for item in chain.items[:10] if item.ItemNm in items_from_list]
            result.append(chain_dict)
        # Return in Json same to server model
        sorted_data = sorted(
            [entry for entry in result if entry['items']],
            key=lambda x: len(x['items']),
            reverse=True  # Set to False for ascending
        )
        return Response(json.dumps(sorted_data, ensure_ascii=False), content_type='application/json')
    
    def post(self):
        try:
            # Get JSON data from the request
            data = request.get_json()

            # Expecting a key "items" with a list of item names
            items_from_list = data.get("items", [])
            # print(items_from_list)
            if not items_from_list or not isinstance(items_from_list, list):
                return {"error": "Missing or invalid 'items' list in request body."}, 400

            # Placeholder for results
            chains = Chain.query.all()
            result = []

            for chain in chains:
                # print(chain.stores[0].name)
                chain_dict = {}
                chain_dict['storeName'] = chain.stores[0].name
                chain_dict['branch'] = chain.branch
                chain_dict['items'] = [
                    {
                        "code": item.ItemCode,
                        "name": item.ItemNm,
                        "price": item.ItemPrice,
                        'unit': item.QtyInPackage,
                        'AllowDiscount': item.AllowDiscount
                    }
                    # for item in chain.items[:10] if item.ItemNm in items_from_list
                    for item in chain.items if item.ItemNm in items_from_list
                ]
                result.append(chain_dict)

            # Sort branches by number of matched items
            sorted_data = sorted(
                [entry for entry in result if entry['items']],
                key=lambda x: len(x['items']),
                reverse=True
            )

            return Response(json.dumps(sorted_data, ensure_ascii=False), content_type='application/json')
        
        except Exception as e:
            return {"error": str(e)}, 500


class Prediction_List(Resource):
    def post(self,id):
        # print(id)
        if id:
            with open("model.pkl", "rb") as f:
                model = pickle.load(f)
                predicted_items = get_top_n(model, id,20)
                return Response(json.dumps(predicted_items, ensure_ascii=False), content_type='application/json')
        return make_response('No household found',400)

class Prediction_Model(Resource):
    def get(self):
        try:
            response = train_model()
            return make_response(response,200)
        except:
            return make_response('An error occured training the model',500)


@app.route('/')
def index():
    return make_response('Oh yes, It is our app',200)

api.add_resource(Items,'/api/items')
api.add_resource(Compare_List,'/api/list/compare')
api.add_resource(Stores, '/api/stores')
api.add_resource(Chains, '/api/chains')
api.add_resource(Prediction_List, '/api/prediction/<string:id>')
api.add_resource(Prediction_Model, '/api/prediction/model/train')


if __name__ == "__main__":
    app.run(host='0.0.0.0', port=5000, debug=True)