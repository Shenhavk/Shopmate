const ShoppingList = require('../models/shoppingList.model.js');
const Purchase = require('../models/Purchase.model.js');

async function extractPurchasedItems() {
  try {
    const purchasedItems = await ShoppingList.aggregate([
      { $match: { isDeleted: false } },
      { $unwind: "$items" },
      { $match: { "items.status": "purchased" } },
      {
        $addFields: {
          lastPurchaseEvent: {
            $filter: {
              input: "$items.history",
              as: "event",
              cond: { $eq: ["$$event.action", "purchase"] }
            }
          }
        }
      },
      {
        $addFields: {
          latestPurchase: { $arrayElemAt: ["$lastPurchaseEvent", -1] }
        }
      },
      {
        $project: {
          householdId: 1,
          itemName: "$items.name",
          quantity: "$items.quantity",
          shoppingListId: "$_id",
          storeName: 1,
          branch: 1,
          purchasedAt: {
            $ifNull: ["$latestPurchase.timestamp", "$updatedAt"]
          }
        }
      }
    ]);

    return purchasedItems;
  } catch (err) {
    console.error("Error extracting purchased items:", err);
    throw err;
  }
}

async function extractAndSavePurchasedItems() {
  const items = await extractPurchasedItems();

  const purchasesToInsert = items.map(item => ({
    householdId: item.householdId,
    shoppingListId: item.shoppingListId,
    itemName: item.itemName,
    quantity: item.quantity || 1,
    storeName: item.storeName || '',
    branch: item.branch || '',
    purchasedAt: item.purchasedAt,
  }));

  // Optionally clear existing records to avoid duplicates
  await Purchase.deleteMany({});

  // Insert all
  await Purchase.insertMany(purchasesToInsert);

  console.log(`${purchasesToInsert.length} purchases saved.`);
  return;
}

async function getTopNFrequentItems(householdId, topN = 10) {
  const match = householdId ? { householdId } : {};

  const topItems = await Purchase.aggregate([
    { $match: match },
    { $group: { _id: "$itemName", count: { $sum: 1 } } },
    { $sort: { count: -1 } },
    { $limit: topN },
    { $project: { itemName: "$_id", count: 1, _id: 0 } }
  ]);

  return topItems;
}

module.exports = {
  extractPurchasedItems,
  extractAndSavePurchasedItems
};
