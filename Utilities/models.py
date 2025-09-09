from flask_sqlalchemy import SQLAlchemy
from sqlalchemy import MetaData
from datetime import datetime
from sqlalchemy_serializer import SerializerMixin
from sqlalchemy.orm import validates
import re

metadata = MetaData(naming_convention={
    "fk": "fk_%(table_name)s_%(column_0_name)s_%(referred_table_name)s",
})

db = SQLAlchemy(metadata=metadata)

class StoreLink(db.Model, SerializerMixin):
    __tablename__='storelinks'

    id=db.Column(db.Integer, primary_key=True)
    link=db.Column(db.String(255), nullable=False,unique=True)
    name = db.Column(db.String(255), nullable=False, unique=True)
    created_at = db.Column(db.DateTime, default=datetime.now)

    def __repr__(self):
        return f'<Store Link id={self.id} link={self.link}>'
    
    @validates('link')
    def validate_link(self, key, value):
        pattern = r"^https://([a-zA-Z0-9\-]+)\.binaprojects\.com/Main\.aspx$"
        match = re.match(pattern, value)
        if not match:
            raise ValueError(f"Invalid store link format: {value}")
        # Automatically set the store name from the link
        self.name = match.group(1)
        return value

class Store(db.Model, SerializerMixin):
    __tablename__='stores'

    id=db.Column(db.Integer, primary_key=True)
    name=db.Column(db.String, nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.now)

    serialize_rules = ('-items.store', '-chains.stores')

    items=db.relationship('Item',back_populates='store', cascade='all, delete-orphan')
    chains = db.relationship(
        'Chain',
        secondary='items',
        primaryjoin='Store.id == Item.store_id',
        secondaryjoin='Chain.id == Item.chain_id',
        viewonly=True,
        backref='stores'
    )

    def __repr__(self):
        return f'<Store id={self.id} name={self.name}>'
    
class Chain(db.Model, SerializerMixin):
    __tablename__='chains'

    id=db.Column(db.Integer, primary_key=True)
    chainId=db.Column(db.String)
    subChainId=db.Column(db.String)
    storeId=db.Column(db.String)
    bikoretNo=db.Column(db.String)
    branch=db.Column(db.String, nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.now)

    serialize_rules = ('-items.chain', '-stores.chains')

    items=db.relationship('Item',back_populates='chain', cascade='all, delete-orphan')

    def __repr__(self):
        return (
            f"<Chain\n"
            f"  id={self.id}\n"
            f"  chainId={self.chainId}\n"
            f"  subChainId={self.subChainId}\n"
            f"  storeId={self.storeId}\n"
            f"  bikoretNo={self.bikoretNo}\n"
            f"  branch={self.branch}\n"
            f"  created_at={self.created_at}\n"
            f">"
        )
    
class Item(db.Model,SerializerMixin):
    __tablename__ = 'items'

    id=db.Column(db.Integer, primary_key=True)
    ItemCode=db.Column(db.String)
    ItemNm=db.Column(db.String, nullable=False)
    ManufacturerName=db.Column(db.String)
    Quantity=db.Column(db.Float)
    QtyInPackage=db.Column(db.Float)
    ItemPrice=db.Column(db.Float, nullable=False)
    AllowDiscount=db.Column(db.Boolean)
    ItemStatus=db.Column(db.Boolean)
    chain_id=db.Column(db.Integer, db.ForeignKey('chains.id'), nullable=False)
    store_id=db.Column(db.Integer, db.ForeignKey('stores.id'), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.now)

    store=db.relationship('Store',back_populates='items')
    chain=db.relationship('Chain',back_populates='items')

    serialize_rules = ('-store.items', '-chain.items')

    def __repr__(self):
        return (
            f"<Item\n"
            f"  id={self.id}\n"
            f"  chainRefId={self.chain_id}\n"
            f"  storeRefId={self.store_id}\n"
            f"  ItemCode={self.ItemCode}\n"
            f"  ItemNm={self.ItemNm}\n"
            f"  ManufacturerName={self.ManufacturerName}\n"
            f"  Quantity={self.Quantity}\n"
            f"  QtyInPackage={self.QtyInPackage}\n"
            f"  ItemPrice={self.ItemPrice}\n"
            f"  AllowDiscount={self.AllowDiscount}\n"
            f"  ItemStatus={self.ItemStatus}\n"
            f">"
        )