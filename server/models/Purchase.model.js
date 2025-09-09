const mongoose = require('mongoose');

const PurchaseSchema = new mongoose.Schema({
  householdId: { type: mongoose.Schema.Types.ObjectId, ref: 'Household', required: true },
  shoppingListId: { type: mongoose.Schema.Types.ObjectId, ref: 'ShoppingList' },
  itemName: { type: String, required: true },
  quantity: { type: Number, default: 1 },
  storeName: String,
  branch: String,
  purchasedAt: { type: Date, required: true },
}, { timestamps: true });

module.exports = mongoose.model('Purchase', PurchaseSchema);
