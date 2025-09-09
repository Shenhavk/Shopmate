const { faker } = require('@faker-js/faker');
const bcrypt = require('bcryptjs');

// Import your existing models or define them here if needed
const User = require('./models/user.model.js');
const Household = require('./models/household.model.js');
const ShoppingList = require('./models/shoppingList.model.js');
const db = require("./config/database.js");
const dotenv = require("dotenv");

// Load environment variables from .env file
dotenv.config();
// initialize the db
db.connect();

const NUM_HOUSEHOLDS = 100;
const LISTS_PER_HOUSEHOLD = 50;

function pickRandomUser() {
  const idx = Math.floor(Math.random() * userSeedList.length);
  return userSeedList[idx];
}

async function seedDb() {
  try {
    await User.deleteMany({});
    await Household.deleteMany({});
    await ShoppingList.deleteMany({});

    const allUsers = [];

    for (let i = 0; i < NUM_HOUSEHOLDS; i++) {
      const household = new Household({ name: `Household_${i}` });
      await household.save();

      // Create 2 to 5 users per household
      const householdUsers = [];

      const numUsers = faker.number.int({ min: 2, max: 5 });
      for (let j = 0; j < numUsers; j++) {
        const { firstName, lastName, email } = pickRandomUser();
        const fullName = `${firstName} ${lastName}`; 
        const uniqueEmail = email.replace('@', `.${j}${household._id.toString().slice(-3)}@`);
        const user = new User({
          email: uniqueEmail,
          passwordHash : 'password123',
          name: fullName,
          householdId: household._id,
          preferences: {
            prediction_opt_in: faker.datatype.boolean(),
            preferred_brands: faker.helpers.arrayElements(
              ['תנובה', 'אוסם', 'שטראוס', 'קוקה קולה', 'אסם'], 2
            )
          }
        });

        await user.save();
        householdUsers.push(user._id);
        allUsers.push(user);
      }

      household.members = householdUsers;
      await household.save();

      // Create 50 shopping lists per household
      for (let k = 0; k < LISTS_PER_HOUSEHOLD; k++) {
        const createdByUser = faker.helpers.arrayElement(householdUsers);

        const shoppingList = new ShoppingList({
          name: `List_${k}_H${i}`,
          description: faker.lorem.sentence(),
          householdId: household._id,
          createdBy: createdByUser,
          items: Array.from({ length: faker.number.int({ min: 10, max: 20 }) }).map(() => {
            const modifyingUser = faker.helpers.arrayElement(householdUsers);
            const seedItem = faker.helpers.arrayElement(seedItemArr);
            return {
                name: seedItem.ItemNm ?? faker.commerce.productName(),
                quantity: faker.number.int({ min: 1, max: 5 }),
                status: faker.helpers.arrayElement(['pending', 'purchased']),
                lastModifiedBy: modifyingUser,
                priceInfo: {
                    storeName: seedItem.store.name ?? faker.company.name(),
                    price: seedItem.ItemPrice ?? parseFloat(faker.commerce.price()),
                    currency: 'ILS',
                    lastChecked: faker.date.recent(),
                },
                history: [
                    {
                    action: faker.helpers.arrayElement(['add', 'edit', 'delete', 'purchase']),
                    timestamp: faker.date.recent(),
                    userId: modifyingUser,
                    },
                ],
            };
          }),
        });

        await shoppingList.save();
      }

      console.log(`✅ Household ${i + 1} with users and lists created`);
    }

    console.log('🎉 Mock data generation complete!');
  } catch (error) {
    console.error('Error generating mock data:', error);
  }
};

module.exports = seedDb;

const userSeedList = [
  { "firstName": "dana", "lastName": "levi", "email": "dana.levi@gmail.com" },
  { "firstName": "yossi", "lastName": "cohen", "email": "yossi.cohen@gmail.com" },
  { "firstName": "noa", "lastName": "mizrahi", "email": "noa.mizrahi@gmail.com" },
  { "firstName": "roi", "lastName": "peretz", "email": "roi.peretz@gmail.com" },
  { "firstName": "maya", "lastName": "biton", "email": "maya.biton@gmail.com" },
  { "firstName": "uri", "lastName": "malka", "email": "uri.malka@gmail.com" },
  { "firstName": "shira", "lastName": "dayan", "email": "shira.dayan@gmail.com" },
  { "firstName": "ido", "lastName": "elbaz", "email": "ido.elbaz@gmail.com" },
  { "firstName": "hadar", "lastName": "ohayon", "email": "hadar.ohayon@gmail.com" },
  { "firstName": "tomer", "lastName": "shmueli", "email": "tomer.shmueli@gmail.com" },
  { "firstName": "anat", "lastName": "dahan", "email": "anat.dahan@gmail.com" },
  { "firstName": "gil", "lastName": "tserfati", "email": "gil.tserfati@gmail.com" },
  { "firstName": "lior", "lastName": "lugasi", "email": "lior.lugasi@gmail.com" },
  { "firstName": "roni", "lastName": "sabag", "email": "roni.sabag@gmail.com" },
  { "firstName": "rotem", "lastName": "gueta", "email": "rotem.gueta@gmail.com" },
  { "firstName": "adam", "lastName": "hadad", "email": "adam.hadad@gmail.com" },
  { "firstName": "sharon", "lastName": "hazan", "email": "sharon.hazan@gmail.com" },
  { "firstName": "bar", "lastName": "azulay", "email": "bar.azulay@gmail.com" },
  { "firstName": "guy", "lastName": "abergel", "email": "guy.abergel@gmail.com" },
  { "firstName": "ella", "lastName": "cohen shimon", "email": "ella.cohenshimon@gmail.com" },
  { "firstName": "alon", "lastName": "suissa", "email": "alon.suissa@gmail.com" },
  { "firstName": "neta", "lastName": "ben shoshan", "email": "neta.benshoshan@gmail.com" },
  { "firstName": "itay", "lastName": "edri", "email": "itay.edri@gmail.com" },
  { "firstName": "michal", "lastName": "nahum", "email": "michal.nahum@gmail.com" },
  { "firstName": "yaniv", "lastName": "levi maman", "email": "yaniv.levimaman@gmail.com" },
  { "firstName": "tal", "lastName": "bouzaglo", "email": "tal.bouzaglo@gmail.com" },
  { "firstName": "yael", "lastName": "gabay", "email": "yael.gabay@gmail.com" },
  { "firstName": "lian", "lastName": "maymon", "email": "lian.maymon@gmail.com" },
  { "firstName": "raz", "lastName": "nachmani", "email": "raz.nachmani@gmail.com" },
  { "firstName": "shaked", "lastName": "baruch", "email": "shaked.baruch@gmail.com" },
  { "firstName": "aviv", "lastName": "lugasi", "email": "aviv.lugasi@gmail.com" },
  { "firstName": "lia", "lastName": "chanuka", "email": "lia.chanuka@gmail.com" },
  { "firstName": "niv", "lastName": "saban", "email": "niv.saban@gmail.com" },
  { "firstName": "ilan", "lastName": "dadlon", "email": "ilan.fadlon@gmail.com" },
  { "firstName": "hadas", "lastName": "amar", "email": "hadas.amar@gmail.com" }
]


const seedItemArr = [
  {
    "ItemPrice": 2.5,
    "ItemCode": "1",
    "store": {
      "name": "goodpharm"
    },
    "AllowDiscount": false,
    "chain": {
      "branch": "970 ר\"מ ביאליק 64- גוד יצחקי"
    },
    "id": 1457,
    "ItemNm": "GOOD PHARM - שקית אל בד גדול",
    "ItemStatus": false
  },
  {
    "ItemPrice": 43.9,
    "ItemCode": "30095151",
    "store": {
      "name": "goodpharm"
    },
    "AllowDiscount": false,
    "chain": {
      "branch": "970 ר\"מ ביאליק 64- גוד יצחקי"
    },
    "id": 1458,
    "ItemNm": "אססי - לק גוון 13",
    "ItemStatus": false
  },
  {
    "ItemPrice": 45,
    "ItemCode": "30161467",
    "store": {
      "name": "goodpharm"
    },
    "AllowDiscount": false,
    "chain": {
      "branch": "970 ר\"מ ביאליק 64- גוד יצחקי"
    },
    "id": 1459,
    "ItemNm": "מייבלין - מסקרה פולסיס סוריל",
    "ItemStatus": false
  },
  {
    "ItemPrice": 6.9,
    "ItemCode": "40058153",
    "store": {
      "name": "goodpharm"
    },
    "AllowDiscount": false,
    "chain": {
      "branch": "970 ר\"מ ביאליק 64- גוד יצחקי"
    },
    "id": 1460,
    "ItemNm": "ניוואה - קרם רב שימושי 30 מ\"ל",
    "ItemStatus": false
  },
  {
    "ItemPrice": 6.5,
    "ItemCode": "40084107",
    "store": {
      "name": "goodpharm"
    },
    "AllowDiscount": false,
    "chain": {
      "branch": "970 ר\"מ ביאליק 64- גוד יצחקי"
    },
    "id": 1461,
    "ItemNm": "קינדר - ביצת הפתעה 20 גרם",
    "ItemStatus": false
  },
  {
    "ItemPrice": 4.9,
    "ItemCode": "72917329",
    "store": {
      "name": "goodpharm"
    },
    "AllowDiscount": false,
    "chain": {
      "branch": "970 ר\"מ ביאליק 64- גוד יצחקי"
    },
    "id": 1462,
    "ItemNm": "עלית - אגוזי 45 גרם",
    "ItemStatus": false
  },
  {
    "ItemPrice": 4.9,
    "ItemCode": "72991008",
    "store": {
      "name": "goodpharm"
    },
    "AllowDiscount": false,
    "chain": {
      "branch": "970 ר\"מ ביאליק 64- גוד יצחקי"
    },
    "id": 1463,
    "ItemNm": "עלית - פסק זמן חטיף 45 גרם",
    "ItemStatus": false
  },
  {
    "ItemPrice": 15.9,
    "ItemCode": "80136194",
    "store": {
      "name": "goodpharm"
    },
    "AllowDiscount": false,
    "chain": {
      "branch": "970 ר\"מ ביאליק 64- גוד יצחקי"
    },
    "id": 1464,
    "ItemNm": "קינדר - הפי היפו אגוזי לוז 20.7 גרם חמישייה",
    "ItemStatus": false
  },
  {
    "ItemPrice": 7.9,
    "ItemCode": "80831402",
    "store": {
      "name": "goodpharm"
    },
    "AllowDiscount": false,
    "chain": {
      "branch": "970 ר\"מ ביאליק 64- גוד יצחקי"
    },
    "id": 1465,
    "ItemNm": "מנטוס - סוכריות קלין ברט בטעם מנטה עדינה ללא סוכר 21 גרם",
    "ItemStatus": false
  },
  {
    "ItemPrice": 7.9,
    "ItemCode": "80854753",
    "store": {
      "name": "goodpharm"
    },
    "AllowDiscount": false,
    "chain": {
      "branch": "970 ר\"מ ביאליק 64- גוד יצחקי"
    },
    "id": 1466,
    "ItemNm": "מנטוס - סוכריות קלין ברט בטעם מנטה ללא סוכר 21 גרם",
    "ItemStatus": false
  },
  {
    "ItemPrice": 10.9,
    "ItemCode": "80896081",
    "store": {
      "name": "goodpharm"
    },
    "AllowDiscount": false,
    "chain": {
      "branch": "970 ר\"מ ביאליק 64- גוד יצחקי"
    },
    "id": 1467,
    "ItemNm": "מנטוס - פיור בטעם אבטיח ללא סוכר 60 גרם",
    "ItemStatus": false
  },
  {
    "ItemPrice": 10.9,
    "ItemCode": "80979128",
    "store": {
      "name": "goodpharm"
    },
    "AllowDiscount": false,
    "chain": {
      "branch": "970 ר\"מ ביאליק 64- גוד יצחקי"
    },
    "id": 1468,
    "ItemNm": "מנטוס - פיור בטעם דובדבן ללא סוכר 60 גרם",
    "ItemStatus": false
  },
  {
    "ItemPrice": 16.9,
    "ItemCode": "22200000307",
    "store": {
      "name": "goodpharm"
    },
    "AllowDiscount": false,
    "chain": {
      "branch": "970 ר\"מ ביאליק 64- גוד יצחקי"
    },
    "id": 1469,
    "ItemNm": "ליידי ספיד סטיק - דאודורנט ג'ל 65 גרם לאישה פרש פיוזן 65 גרם",
    "ItemStatus": false
  },
  {
    "ItemPrice": 7.9,
    "ItemCode": "38000232169",
    "store": {
      "name": "goodpharm"
    },
    "AllowDiscount": false,
    "chain": {
      "branch": "970 ר\"מ ביאליק 64- גוד יצחקי"
    },
    "id": 1470,
    "ItemNm": "פרינגלס - מידי אורגינל 67 גרם",
    "ItemStatus": false
  },
  {
    "ItemPrice": 34.9,
    "ItemCode": "50000084500",
    "store": {
      "name": "goodpharm"
    },
    "AllowDiscount": false,
    "chain": {
      "branch": "970 ר\"מ ביאליק 64- גוד יצחקי"
    },
    "id": 1471,
    "ItemNm": "פורינה - פריסקיז מזון לחתול 1.43 ק\"ג",
    "ItemStatus": false
  },
  {
    "ItemPrice": 34.9,
    "ItemCode": "50000100347",
    "store": {
      "name": "goodpharm"
    },
    "AllowDiscount": false,
    "chain": {
      "branch": "970 ר\"מ ביאליק 64- גוד יצחקי"
    },
    "id": 1472,
    "ItemNm": "פורינה - פריסקיז מזון לחתול מועשר בחלב 1.43 ק\"ג",
    "ItemStatus": false
  },
  {
    "ItemPrice": 6.9,
    "ItemCode": "50000543533",
    "store": {
      "name": "goodpharm"
    },
    "AllowDiscount": false,
    "chain": {
      "branch": "970 ר\"מ ביאליק 64- גוד יצחקי"
    },
    "id": 1473,
    "ItemNm": "פורינה - פריסקיז פטה סלמון 156 גרם",
    "ItemStatus": false
  },
  {
    "ItemPrice": 39.9,
    "ItemCode": "302340010030",
    "store": {
      "name": "goodpharm"
    },
    "AllowDiscount": false,
    "chain": {
      "branch": "970 ר\"מ ביאליק 64- גוד יצחקי"
    },
    "id": 1474,
    "ItemNm": "דורקס - קונדומים דקים אקסטרה סנסיטיב גזרה רחבה 12 יח'",
    "ItemStatus": false
  },
  {
    "ItemPrice": 10.9,
    "ItemCode": "651080647519",
    "store": {
      "name": "goodpharm"
    },
    "AllowDiscount": false,
    "chain": {
      "branch": "970 ר\"מ ביאליק 64- גוד יצחקי"
    },
    "id": 1475,
    "ItemNm": "פלאקרס - קיסם עם חוט דנטלי מנטה 36 יח'",
    "ItemStatus": false
  },
  {
    "ItemPrice": 12.9,
    "ItemCode": "693493104876",
    "store": {
      "name": "goodpharm"
    },
    "AllowDiscount": false,
    "chain": {
      "branch": "970 ר\"מ ביאליק 64- גוד יצחקי"
    },
    "id": 1476,
    "ItemNm": "GOOD PHARM - מרפדי גאזה 7.5*7.5 ס\"מ",
    "ItemStatus": false
  },
  {
    "ItemPrice": 14.9,
    "ItemCode": "693493104951",
    "store": {
      "name": "goodpharm"
    },
    "AllowDiscount": false,
    "chain": {
      "branch": "970 ר\"מ ביאליק 64- גוד יצחקי"
    },
    "id": 1477,
    "ItemNm": "GOOD PHARM - פדים להסרת איפור 80 יח' * שלישייה",
    "ItemStatus": false
  },
  {
    "ItemPrice": 10,
    "ItemCode": "693493105101",
    "store": {
      "name": "goodpharm"
    },
    "AllowDiscount": false,
    "chain": {
      "branch": "970 ר\"מ ביאליק 64- גוד יצחקי"
    },
    "id": 1478,
    "ItemNm": "GOOD PHARM - סכיני גילוח שקית 10 יח'",
    "ItemStatus": false
  },
  {
    "ItemPrice": 10,
    "ItemCode": "693493105118",
    "store": {
      "name": "goodpharm"
    },
    "AllowDiscount": false,
    "chain": {
      "branch": "970 ר\"מ ביאליק 64- גוד יצחקי"
    },
    "id": 1479,
    "ItemNm": "GOOD PHARM - סכיני גילוח בליסטר 5 יח'",
    "ItemStatus": false
  },
  {
    "ItemPrice": 10,
    "ItemCode": "693493105255",
    "store": {
      "name": "goodpharm"
    },
    "AllowDiscount": false,
    "chain": {
      "branch": "970 ר\"מ ביאליק 64- גוד יצחקי"
    },
    "id": 1480,
    "ItemNm": "GOOD PHARM - כדוריות סבון לאסלה בריח לימון רענן 3 יח'",
    "ItemStatus": false
  },
  {
    "ItemPrice": 3.9,
    "ItemCode": "693493105422",
    "store": {
      "name": "goodpharm"
    },
    "AllowDiscount": false,
    "chain": {
      "branch": "970 ר\"מ ביאליק 64- גוד יצחקי"
    },
    "id": 1481,
    "ItemNm": "GOOD PHARM - מחית פרי פאוץ תפוחי עץ 100 גרם",
    "ItemStatus": false
  },
  {
    "ItemPrice": 99.9,
    "ItemCode": "719346065405",
    "store": {
      "name": "goodpharm"
    },
    "AllowDiscount": false,
    "chain": {
      "branch": "970 ר\"מ ביאליק 64- גוד יצחקי"
    },
    "id": 1482,
    "ItemNm": "בריטני ספירס - fantasy א.ד.פ לאישה 100 מ\"ל",
    "ItemStatus": false
  },
  {
    "ItemPrice": 5.9,
    "ItemCode": "3179730011024",
    "store": {
      "name": "goodpharm"
    },
    "AllowDiscount": false,
    "chain": {
      "branch": "970 ר\"מ ביאליק 64- גוד יצחקי"
    },
    "id": 1483,
    "ItemNm": "פרייה - מים מוגזים 330 מ\"ל בודד",
    "ItemStatus": false
  },
  {
    "ItemPrice": 27.9,
    "ItemCode": "3355991005129",
    "store": {
      "name": "goodpharm"
    },
    "AllowDiscount": false,
    "chain": {
      "branch": "970 ר\"מ ביאליק 64- גוד יצחקי"
    },
    "id": 1484,
    "ItemNm": "סילבר סנט - דאודורנט ספריי לגבר אינטנס 200 מ\"ל",
    "ItemStatus": false
  },
  {
    "ItemPrice": 249,
    "ItemCode": "3423474891856",
    "store": {
      "name": "goodpharm"
    },
    "AllowDiscount": false,
    "chain": {
      "branch": "970 ר\"מ ביאליק 64- גוד יצחקי"
    },
    "id": 1485,
    "ItemNm": "זאדיג - This Is Her א.ד.פ לאישה 100 מ\"ל",
    "ItemStatus": false
  },
  {
    "ItemPrice": 11.9,
    "ItemCode": "3574661552576",
    "store": {
      "name": "goodpharm"
    },
    "AllowDiscount": false,
    "chain": {
      "branch": "970 ר\"מ ביאליק 64- גוד יצחקי"
    },
    "id": 1486,
    "ItemNm": "קרפרי - קוטון מגן תחתון רגיל טנגה 56 יח'",
    "ItemStatus": false
  },
  {
    "ItemPrice": 11.9,
    "ItemCode": "3574661554877",
    "store": {
      "name": "goodpharm"
    },
    "AllowDiscount": false,
    "chain": {
      "branch": "970 ר\"מ ביאליק 64- גוד יצחקי"
    },
    "id": 1487,
    "ItemNm": "קרפרי - קוטון מגן תחתון מבושם 56 יח'",
    "ItemStatus": false
  },
  {
    "ItemPrice": 17.9,
    "ItemCode": "3574661561226",
    "store": {
      "name": "goodpharm"
    },
    "AllowDiscount": false,
    "chain": {
      "branch": "970 ר\"מ ביאליק 64- גוד יצחקי"
    },
    "id": 1488,
    "ItemNm": "ליסטרין - מי פה אדוונס 600 מ\"ל",
    "ItemStatus": false
  },
  {
    "ItemPrice": 99.9,
    "ItemCode": "3600522251750",
    "store": {
      "name": "goodpharm"
    },
    "AllowDiscount": false,
    "chain": {
      "branch": "970 ר\"מ ביאליק 64- גוד יצחקי"
    },
    "id": 1489,
    "ItemNm": "לוריאל - רויטליפט לייזר קרם עיניים 15 מ\"ל",
    "ItemStatus": false
  },
  {
    "ItemPrice": 18.9,
    "ItemCode": "3600524163075",
    "store": {
      "name": "goodpharm"
    },
    "AllowDiscount": false,
    "chain": {
      "branch": "970 ר\"מ ביאליק 64- גוד יצחקי"
    },
    "id": 1490,
    "ItemNm": "לוריאל - אלביב שמפו Hydra Hyaluronic ממלא בלחות עד 72 שעות 500 מ\"ל",
    "ItemStatus": false
  },
  {
    "ItemPrice": 18.9,
    "ItemCode": "3600524163099",
    "store": {
      "name": "goodpharm"
    },
    "AllowDiscount": false,
    "chain": {
      "branch": "970 ר\"מ ביאליק 64- גוד יצחקי"
    },
    "id": 1491,
    "ItemNm": "לוריאל - אלביב שמפו Dream Long משקם 500 מ\"ל",
    "ItemStatus": false
  },
  {
    "ItemPrice": 18.9,
    "ItemCode": "3600524167134",
    "store": {
      "name": "goodpharm"
    },
    "AllowDiscount": false,
    "chain": {
      "branch": "970 ר\"מ ביאליק 64- גוד יצחקי"
    },
    "id": 1492,
    "ItemNm": "לוריאל - אלביב מרכך Hydra Pure מעשיר בלחות עד 72 שעות 500 מ\"ל",
    "ItemStatus": false
  },
  {
    "ItemPrice": 34.9,
    "ItemCode": "3600541382930",
    "store": {
      "name": "goodpharm"
    },
    "AllowDiscount": false,
    "chain": {
      "branch": "970 ר\"מ ביאליק 64- גוד יצחקי"
    },
    "id": 1493,
    "ItemNm": "גרנייה - מים מיסלרים לכל סוגי העור 400 מ\"ל",
    "ItemStatus": false
  },
  {
    "ItemPrice": 12.9,
    "ItemCode": "3600541402270",
    "store": {
      "name": "goodpharm"
    },
    "AllowDiscount": false,
    "chain": {
      "branch": "970 ר\"מ ביאליק 64- גוד יצחקי"
    },
    "id": 1494,
    "ItemNm": "גרנייה - מינרל דאודורנט ספריי אינביזיבל פרוטקשן 150 מ\"ל",
    "ItemStatus": false
  },
  {
    "ItemPrice": 34.9,
    "ItemCode": "3600541928275",
    "store": {
      "name": "goodpharm"
    },
    "AllowDiscount": false,
    "chain": {
      "branch": "970 ר\"מ ביאליק 64- גוד יצחקי"
    },
    "id": 1495,
    "ItemNm": "גרנייה - מים מיסלרים דו פאזי 400 מ\"ל",
    "ItemStatus": false
  },
  {
    "ItemPrice": 32.9,
    "ItemCode": "3600541937475",
    "store": {
      "name": "goodpharm"
    },
    "AllowDiscount": false,
    "chain": {
      "branch": "970 ר\"מ ביאליק 64- גוד יצחקי"
    },
    "id": 1496,
    "ItemNm": "גרנייה - פיור אקטיב סבון פנים חימר 3 ב-1 150 מ\"ל",
    "ItemStatus": false
  },
  {
    "ItemPrice": 19.9,
    "ItemCode": "3600542431835",
    "store": {
      "name": "goodpharm"
    },
    "AllowDiscount": false,
    "chain": {
      "branch": "970 ר\"מ ביאליק 64- גוד יצחקי"
    },
    "id": 1497,
    "ItemNm": "גרנייה - קולור נטורלס 3 חום כהה מאוד",
    "ItemStatus": false
  },
  {
    "ItemPrice": 19.9,
    "ItemCode": "3600542431989",
    "store": {
      "name": "goodpharm"
    },
    "AllowDiscount": false,
    "chain": {
      "branch": "970 ר\"מ ביאליק 64- גוד יצחקי"
    },
    "id": 1498,
    "ItemNm": "גרנייה - קולור נטורלס 6.34 חום שוקולד",
    "ItemStatus": false
  },
  {
    "ItemPrice": 19.9,
    "ItemCode": "3838824127286",
    "store": {
      "name": "goodpharm"
    },
    "AllowDiscount": false,
    "chain": {
      "branch": "970 ר\"מ ביאליק 64- גוד יצחקי"
    },
    "id": 1499,
    "ItemNm": "פאלטה - אינטנסיב 7-0 בלונד בינוני",
    "ItemStatus": false
  },
  {
    "ItemPrice": 11.9,
    "ItemCode": "4005808366392",
    "store": {
      "name": "goodpharm"
    },
    "AllowDiscount": false,
    "chain": {
      "branch": "970 ר\"מ ביאליק 64- גוד יצחקי"
    },
    "id": 1500,
    "ItemNm": "לבלו - שפתון כחול בליסטר",
    "ItemStatus": false
  },
  {
    "ItemPrice": 16.9,
    "ItemCode": "4005900036483",
    "store": {
      "name": "goodpharm"
    },
    "AllowDiscount": false,
    "chain": {
      "branch": "970 ר\"מ ביאליק 64- גוד יצחקי"
    },
    "id": 1501,
    "ItemNm": "ניוואה - דאודורנט ספריי לגבר שקוף בלק אנד וויט 150 מ\"ל",
    "ItemStatus": false
  },
  {
    "ItemPrice": 11.9,
    "ItemCode": "4005900388513",
    "store": {
      "name": "goodpharm"
    },
    "AllowDiscount": false,
    "chain": {
      "branch": "970 ר\"מ ביאליק 64- גוד יצחקי"
    },
    "id": 1502,
    "ItemNm": "ניוואה - דאודורנט רול און לאישה יבש 50 מ\"ל",
    "ItemStatus": false
  },
  {
    "ItemPrice": 16.9,
    "ItemCode": "4005900513045",
    "store": {
      "name": "goodpharm"
    },
    "AllowDiscount": false,
    "chain": {
      "branch": "970 ר\"מ ביאליק 64- גוד יצחקי"
    },
    "id": 1503,
    "ItemNm": "ניוואה - דאודורנט ספריי לגבר דיפ 150 מ\"ל",
    "ItemStatus": false
  },
  {
    "ItemPrice": 16.9,
    "ItemCode": "4005900547316",
    "store": {
      "name": "goodpharm"
    },
    "AllowDiscount": false,
    "chain": {
      "branch": "970 ר\"מ ביאליק 64- גוד יצחקי"
    },
    "id": 1504,
    "ItemNm": "ניוואה - דאודורנט ספריי לאישה סילקי מוד בלק אנד וויט 150 מ\"ל",
    "ItemStatus": false
  },
  {
    "ItemPrice": 59.9,
    "ItemCode": "4005900999191",
    "store": {
      "name": "goodpharm"
    },
    "AllowDiscount": false,
    "chain": {
      "branch": "970 ר\"מ ביאליק 64- גוד יצחקי"
    },
    "id": 1505,
    "ItemNm": "ניוואה - סאן פרוטקט אנד היידרית' ספריי למבוגרים 200 מ\"ל +SPF50",
    "ItemStatus": false
  },
  {
    "ItemPrice": 199.9,
    "ItemCode": "4006387135973",
    "store": {
      "name": "goodpharm"
    },
    "AllowDiscount": false,
    "chain": {
      "branch": "970 ר\"מ ביאליק 64- גוד יצחקי"
    },
    "id": 1506,
    "ItemNm": "בריטה - סטייל קנקן + פילטר אול אין וואן",
    "ItemStatus": false
  },
  {
    "ItemPrice": 19.9,
    "ItemCode": "4008400170428",
    "store": {
      "name": "goodpharm"
    },
    "AllowDiscount": false,
    "chain": {
      "branch": "970 ר\"מ ביאליק 64- גוד יצחקי"
    },
    "id": 1507,
    "ItemNm": "פררו - בונבוניירה לב 125 גרם",
    "ItemStatus": false
  },
  {
    "ItemPrice": 49.9,
    "ItemCode": "4008666215079",
    "store": {
      "name": "goodpharm"
    },
    "AllowDiscount": false,
    "chain": {
      "branch": "970 ר\"מ ביאליק 64- גוד יצחקי"
    },
    "id": 1508,
    "ItemNm": "אלפסין - שמפו קפאין 250 מ\"ל",
    "ItemStatus": false
  },
  {
    "ItemPrice": 10.9,
    "ItemCode": "4009900531122",
    "store": {
      "name": "goodpharm"
    },
    "AllowDiscount": false,
    "chain": {
      "branch": "970 ר\"מ ביאליק 64- גוד יצחקי"
    },
    "id": 1509,
    "ItemNm": "אורביט - פרופשיונל ספירמינט בקבוקון 64 גרם",
    "ItemStatus": false
  },
  {
    "ItemPrice": 11.9,
    "ItemCode": "4009900536257",
    "store": {
      "name": "goodpharm"
    },
    "AllowDiscount": false,
    "chain": {
      "branch": "970 ר\"מ ביאליק 64- גוד יצחקי"
    },
    "id": 1510,
    "ItemNm": "אורביט - רפרשרס מנטה ללא סוכר 67 גרם",
    "ItemStatus": false
  },
  {
    "ItemPrice": 11.9,
    "ItemCode": "4013162036110",
    "store": {
      "name": "goodpharm"
    },
    "AllowDiscount": false,
    "chain": {
      "branch": "970 ר\"מ ביאליק 64- גוד יצחקי"
    },
    "id": 1511,
    "ItemNm": "יעקבי - fit סבון כלים מרוכז אוריגינל 750 מ\"ל",
    "ItemStatus": false
  },
  {
    "ItemPrice": 11.9,
    "ItemCode": "4013162036158",
    "store": {
      "name": "goodpharm"
    },
    "AllowDiscount": false,
    "chain": {
      "branch": "970 ר\"מ ביאליק 64- גוד יצחקי"
    },
    "id": 1512,
    "ItemNm": "יעקבי - fit סבון כלים מרוכז אלוורה 750 מ\"ל",
    "ItemStatus": false
  },
  {
    "ItemPrice": 15.9,
    "ItemCode": "4045787068320",
    "store": {
      "name": "goodpharm"
    },
    "AllowDiscount": false,
    "chain": {
      "branch": "970 ר\"מ ביאליק 64- גוד יצחקי"
    },
    "id": 1513,
    "ItemNm": "אינדולה - פרוטאין צבע 5 חום",
    "ItemStatus": false
  },
  {
    "ItemPrice": 24.9,
    "ItemCode": "4053700292455",
    "store": {
      "name": "goodpharm"
    },
    "AllowDiscount": false,
    "chain": {
      "branch": "970 ר\"מ ביאליק 64- גוד יצחקי"
    },
    "id": 1514,
    "ItemNm": "ויט - רצועות שעווה תמצית צמחים 12 יח'",
    "ItemStatus": false
  },
  {
    "ItemPrice": 10,
    "ItemCode": "4059729393685",
    "store": {
      "name": "goodpharm"
    },
    "AllowDiscount": false,
    "chain": {
      "branch": "970 ר\"מ ביאליק 64- גוד יצחקי"
    },
    "id": 1515,
    "ItemNm": "קטריס - מחדד עפרונות 2 גדלים",
    "ItemStatus": false
  },
  {
    "ItemPrice": 17,
    "ItemCode": "4059729401229",
    "store": {
      "name": "goodpharm"
    },
    "AllowDiscount": false,
    "chain": {
      "branch": "970 ר\"מ ביאליק 64- גוד יצחקי"
    },
    "id": 1516,
    "ItemNm": "Catr. Intense Matte Lip Pen 020",
    "ItemStatus": false
  },
  {
    "ItemPrice": 56.9,
    "ItemCode": "4640018993398",
    "store": {
      "name": "goodpharm"
    },
    "AllowDiscount": false,
    "chain": {
      "branch": "970 ר\"מ ביאליק 64- גוד יצחקי"
    },
    "id": 1517,
    "ItemNm": "פיניש - קוואנטום קפסולות למדיח 60 יח'",
    "ItemStatus": false
  },
  {
    "ItemPrice": 13.9,
    "ItemCode": "4800888221872",
    "store": {
      "name": "goodpharm"
    },
    "AllowDiscount": false,
    "chain": {
      "branch": "970 ר\"מ ביאליק 64- גוד יצחקי"
    },
    "id": 1518,
    "ItemNm": "דאב - דאודורנט סטיק לאישה אורגינל 40 גרם",
    "ItemStatus": false
  },
  {
    "ItemPrice": 24.9,
    "ItemCode": "4860020002400",
    "store": {
      "name": "goodpharm"
    },
    "AllowDiscount": false,
    "chain": {
      "branch": "970 ר\"מ ביאליק 64- גוד יצחקי"
    },
    "id": 1519,
    "ItemNm": "קוקה קולה - מארז פחיות קולה 150 מ\"ל תריסר",
    "ItemStatus": false
  },
  {
    "ItemPrice": 37.9,
    "ItemCode": "4987176150455",
    "store": {
      "name": "goodpharm"
    },
    "AllowDiscount": false,
    "chain": {
      "branch": "970 ר\"מ ביאליק 64- גוד יצחקי"
    },
    "id": 1520,
    "ItemNm": "ג'ילט - מאך 3 סכיני גילוח 4 יח'",
    "ItemStatus": false
  },
  {
    "ItemPrice": 39.9,
    "ItemCode": "4987176179173",
    "store": {
      "name": "goodpharm"
    },
    "AllowDiscount": false,
    "chain": {
      "branch": "970 ר\"מ ביאליק 64- גוד יצחקי"
    },
    "id": 1521,
    "ItemNm": "ג'ילט - ונוס אלוורה סמוט סכיני גילוח רב פעמי לנשים רביעייה",
    "ItemStatus": false
  },
  {
    "ItemPrice": 14.9,
    "ItemCode": "4987176231543",
    "store": {
      "name": "goodpharm"
    },
    "AllowDiscount": false,
    "chain": {
      "branch": "970 ר\"מ ביאליק 64- גוד יצחקי"
    },
    "id": 1522,
    "ItemNm": "אורל בי - מברשת שיניים קלאסיק סופט 6 יח'",
    "ItemStatus": false
  },
  {
    "ItemPrice": 5.9,
    "ItemCode": "5000159558792",
    "store": {
      "name": "goodpharm"
    },
    "AllowDiscount": false,
    "chain": {
      "branch": "970 ר\"מ ביאליק 64- גוד יצחקי"
    },
    "id": 1523,
    "ItemNm": "מרס - חטיף 51 גרם",
    "ItemStatus": false
  },
  {
    "ItemPrice": 14.9,
    "ItemCode": "5000159560498",
    "store": {
      "name": "goodpharm"
    },
    "AllowDiscount": false,
    "chain": {
      "branch": "970 ר\"מ ביאליק 64- גוד יצחקי"
    },
    "id": 1524,
    "ItemNm": "סניקרס - מארז חמישייה 250 גרם",
    "ItemStatus": false
  },
  {
    "ItemPrice": 10,
    "ItemCode": "5010622005029",
    "store": {
      "name": "goodpharm"
    },
    "AllowDiscount": false,
    "chain": {
      "branch": "970 ר\"מ ביאליק 64- גוד יצחקי"
    },
    "id": 1525,
    "ItemNm": "אורל בי - חוט דנטלי עם שעווה מנטה 50 מטר",
    "ItemStatus": false
  },
  {
    "ItemPrice": 10,
    "ItemCode": "5010622017947",
    "store": {
      "name": "goodpharm"
    },
    "AllowDiscount": false,
    "chain": {
      "branch": "970 ר\"מ ביאליק 64- גוד יצחקי"
    },
    "id": 1526,
    "ItemNm": "אורל בי - חוט דנטלי סאטין מנטה 25 מטר",
    "ItemStatus": false
  },
  {
    "ItemPrice": 49.9,
    "ItemCode": "5011417576908",
    "store": {
      "name": "goodpharm"
    },
    "AllowDiscount": false,
    "chain": {
      "branch": "970 ר\"מ ביאליק 64- גוד יצחקי"
    },
    "id": 1527,
    "ItemNm": "דורקס ג'ל סיכוך בטעם דובדבן 100 מ\"ל",
    "ItemStatus": false
  },
  {
    "ItemPrice": 19.9,
    "ItemCode": "5029053510811",
    "store": {
      "name": "goodpharm"
    },
    "AllowDiscount": false,
    "chain": {
      "branch": "970 ר\"מ ביאליק 64- גוד יצחקי"
    },
    "id": 1528,
    "ItemNm": "קוטקס - תחבושות נורמל 30 יח'",
    "ItemStatus": false
  },
  {
    "ItemPrice": 11.9,
    "ItemCode": "5060152826663",
    "store": {
      "name": "goodpharm"
    },
    "AllowDiscount": false,
    "chain": {
      "branch": "970 ר\"מ ביאליק 64- גוד יצחקי"
    },
    "id": 1529,
    "ItemNm": "טריקלמון - סבון ידיים רימונים וחבצלת מים 500 מ\"ל",
    "ItemStatus": false
  },
  {
    "ItemPrice": 11.9,
    "ItemCode": "5060152826687",
    "store": {
      "name": "goodpharm"
    },
    "AllowDiscount": false,
    "chain": {
      "branch": "970 ר\"מ ביאליק 64- גוד יצחקי"
    },
    "id": 1530,
    "ItemNm": "טריקלמון - סבון ידיים פריחת ליים ומנדרינה 500 מ\"ל",
    "ItemStatus": false
  },
  {
    "ItemPrice": 13.9,
    "ItemCode": "5413149655522",
    "store": {
      "name": "goodpharm"
    },
    "AllowDiscount": false,
    "chain": {
      "branch": "970 ר\"מ ביאליק 64- גוד יצחקי"
    },
    "id": 1531,
    "ItemNm": "אריאל - אבקת כביסה שושן צחור 1.25 ק\"ג",
    "ItemStatus": false
  },
  {
    "ItemPrice": 15.9,
    "ItemCode": "5413548280189",
    "store": {
      "name": "goodpharm"
    },
    "AllowDiscount": false,
    "chain": {
      "branch": "970 ר\"מ ביאליק 64- גוד יצחקי"
    },
    "id": 1532,
    "ItemNm": "קינדר - שוקובונס 125 גרם",
    "ItemStatus": false
  },
  {
    "ItemPrice": 11.9,
    "ItemCode": "5900020018908",
    "store": {
      "name": "goodpharm"
    },
    "AllowDiscount": false,
    "chain": {
      "branch": "970 ר\"מ ביאליק 64- גוד יצחקי"
    },
    "id": 1533,
    "ItemNm": "פיטנס - חטיף דגנים עוגיות שוקולד 6 יח'",
    "ItemStatus": false
  },
  {
    "ItemPrice": 10,
    "ItemCode": "5900020020710",
    "store": {
      "name": "goodpharm"
    },
    "AllowDiscount": false,
    "chain": {
      "branch": "970 ר\"מ ביאליק 64- גוד יצחקי"
    },
    "id": 1534,
    "ItemNm": "נסטלה - קראנץ' שוקו וניל חטיף דגנים 25 גרם * 6 יח'",
    "ItemStatus": false
  },
  {
    "ItemPrice": 11.9,
    "ItemCode": "5900020025647",
    "store": {
      "name": "goodpharm"
    },
    "AllowDiscount": false,
    "chain": {
      "branch": "970 ר\"מ ביאליק 64- גוד יצחקי"
    },
    "id": 1535,
    "ItemNm": "פיטנס - דליס חטיף דגנים שוקולד חלב 6 יח'",
    "ItemStatus": false
  },
  {
    "ItemPrice": 5.9,
    "ItemCode": "5900951310379",
    "store": {
      "name": "goodpharm"
    },
    "AllowDiscount": false,
    "chain": {
      "branch": "970 ר\"מ ביאליק 64- גוד יצחקי"
    },
    "id": 1536,
    "ItemNm": "סניקרס - קרימי חטיף 50 גרם",
    "ItemStatus": false
  },
  {
    "ItemPrice": 15.9,
    "ItemCode": "5900951316227",
    "store": {
      "name": "goodpharm"
    },
    "AllowDiscount": false,
    "chain": {
      "branch": "970 ר\"מ ביאליק 64- גוד יצחקי"
    },
    "id": 1537,
    "ItemNm": "M&M's - שוקולד 150 גרם",
    "ItemStatus": false
  },
  {
    "ItemPrice": 4.5,
    "ItemCode": "5902198160403",
    "store": {
      "name": "goodpharm"
    },
    "AllowDiscount": false,
    "chain": {
      "branch": "970 ר\"מ ביאליק 64- גוד יצחקי"
    },
    "id": 1538,
    "ItemNm": "אקסל טן - משקה אנרגיה 250 מ\"ל",
    "ItemStatus": false
  },
  {
    "ItemPrice": 12.9,
    "ItemCode": "777261",
    "store": {
      "name": "kingstore"
    },
    "AllowDiscount": false,
    "chain": {
      "branch": "339 יפו תלאביב מכללה"
    },
    "id": 4521,
    "ItemNm": "אננס יח'",
    "ItemStatus": false
  },
  {
    "ItemPrice": 11.9,
    "ItemCode": "777311",
    "store": {
      "name": "kingstore"
    },
    "AllowDiscount": false,
    "chain": {
      "branch": "339 יפו תלאביב מכללה"
    },
    "id": 4522,
    "ItemNm": "תפוח יבוא",
    "ItemStatus": false
  },
  {
    "ItemPrice": 14.9,
    "ItemCode": "777570",
    "store": {
      "name": "kingstore"
    },
    "AllowDiscount": false,
    "chain": {
      "branch": "339 יפו תלאביב מכללה"
    },
    "id": 4523,
    "ItemNm": "אפרסמון קרמבו",
    "ItemStatus": false
  },
  {
    "ItemPrice": 8.9,
    "ItemCode": "999893",
    "store": {
      "name": "kingstore"
    },
    "AllowDiscount": false,
    "chain": {
      "branch": "339 יפו תלאביב מכללה"
    },
    "id": 4524,
    "ItemNm": "סנדוויץ עובד",
    "ItemStatus": false
  },
  {
    "ItemPrice": 5,
    "ItemCode": "7771002",
    "store": {
      "name": "kingstore"
    },
    "AllowDiscount": false,
    "chain": {
      "branch": "339 יפו תלאביב מכללה"
    },
    "id": 4525,
    "ItemNm": "אבקת סודה קופסא",
    "ItemStatus": false
  },
  {
    "ItemPrice": 10,
    "ItemCode": "7771003",
    "store": {
      "name": "kingstore"
    },
    "AllowDiscount": false,
    "chain": {
      "branch": "339 יפו תלאביב מכללה"
    },
    "id": 4526,
    "ItemNm": "אבקת שום קופסא",
    "ItemStatus": false
  },
  {
    "ItemPrice": 5,
    "ItemCode": "7771041",
    "store": {
      "name": "kingstore"
    },
    "AllowDiscount": false,
    "chain": {
      "branch": "339 יפו תלאביב מכללה"
    },
    "id": 4527,
    "ItemNm": "160ג' גרעיני כיתאן קופסא",
    "ItemStatus": false
  },
  {
    "ItemPrice": 22,
    "ItemCode": "7771044",
    "store": {
      "name": "kingstore"
    },
    "AllowDiscount": false,
    "chain": {
      "branch": "339 יפו תלאביב מכללה"
    },
    "id": 4528,
    "ItemNm": "היל טחון קופסא",
    "ItemStatus": false
  },
  {
    "ItemPrice": 20,
    "ItemCode": "7771045",
    "store": {
      "name": "kingstore"
    },
    "AllowDiscount": false,
    "chain": {
      "branch": "339 יפו תלאביב מכללה"
    },
    "id": 4529,
    "ItemNm": "היל שלם קופסא",
    "ItemStatus": false
  },
  {
    "ItemPrice": 10,
    "ItemCode": "7771073",
    "store": {
      "name": "kingstore"
    },
    "AllowDiscount": false,
    "chain": {
      "branch": "339 יפו תלאביב מכללה"
    },
    "id": 4530,
    "ItemNm": "כורכום טחון קופסא",
    "ItemStatus": false
  },
  {
    "ItemPrice": 10,
    "ItemCode": "7771075",
    "store": {
      "name": "kingstore"
    },
    "AllowDiscount": false,
    "chain": {
      "branch": "339 יפו תלאביב מכללה"
    },
    "id": 4531,
    "ItemNm": "כמון טחון קופסא",
    "ItemStatus": false
  },
  {
    "ItemPrice": 10,
    "ItemCode": "7771082",
    "store": {
      "name": "kingstore"
    },
    "AllowDiscount": false,
    "chain": {
      "branch": "339 יפו תלאביב מכללה"
    },
    "id": 4532,
    "ItemNm": "מלח לימון קופסא 280 ג'",
    "ItemStatus": false
  },
  {
    "ItemPrice": 10,
    "ItemCode": "7771090",
    "store": {
      "name": "kingstore"
    },
    "AllowDiscount": false,
    "chain": {
      "branch": "339 יפו תלאביב מכללה"
    },
    "id": 4533,
    "ItemNm": "סומאק קופסא",
    "ItemStatus": false
  },
  {
    "ItemPrice": 12,
    "ItemCode": "7771111",
    "store": {
      "name": "kingstore"
    },
    "AllowDiscount": false,
    "chain": {
      "branch": "339 יפו תלאביב מכללה"
    },
    "id": 4534,
    "ItemNm": "פלפל אנגלי טחון קופסא",
    "ItemStatus": false
  },
  {
    "ItemPrice": 12,
    "ItemCode": "7771114",
    "store": {
      "name": "kingstore"
    },
    "AllowDiscount": false,
    "chain": {
      "branch": "339 יפו תלאביב מכללה"
    },
    "id": 4535,
    "ItemNm": "פלפל שחור גרוס קופסא",
    "ItemStatus": false
  },
  {
    "ItemPrice": 14,
    "ItemCode": "7771115",
    "store": {
      "name": "kingstore"
    },
    "AllowDiscount": false,
    "chain": {
      "branch": "339 יפו תלאביב מכללה"
    },
    "id": 4536,
    "ItemNm": "פלפל שחור טחון קופסא",
    "ItemStatus": false
  },
  {
    "ItemPrice": 10,
    "ItemCode": "7771128",
    "store": {
      "name": "kingstore"
    },
    "AllowDiscount": false,
    "chain": {
      "branch": "339 יפו תלאביב מכללה"
    },
    "id": 4537,
    "ItemNm": "ציאה קופסא",
    "ItemStatus": false
  },
  {
    "ItemPrice": 10,
    "ItemCode": "7771144",
    "store": {
      "name": "kingstore"
    },
    "AllowDiscount": false,
    "chain": {
      "branch": "339 יפו תלאביב מכללה"
    },
    "id": 4538,
    "ItemNm": "קנמון טחון קופסא",
    "ItemStatus": false
  },
  {
    "ItemPrice": 12,
    "ItemCode": "7771182",
    "store": {
      "name": "kingstore"
    },
    "AllowDiscount": false,
    "chain": {
      "branch": "339 יפו תלאביב מכללה"
    },
    "id": 4539,
    "ItemNm": "תבלין בהרט קופסא",
    "ItemStatus": false
  },
  {
    "ItemPrice": 10,
    "ItemCode": "7771186",
    "store": {
      "name": "kingstore"
    },
    "AllowDiscount": false,
    "chain": {
      "branch": "339 יפו תלאביב מכללה"
    },
    "id": 4540,
    "ItemNm": "תבלין דג קופסא",
    "ItemStatus": false
  },
  {
    "ItemPrice": 12,
    "ItemCode": "7771196",
    "store": {
      "name": "kingstore"
    },
    "AllowDiscount": false,
    "chain": {
      "branch": "339 יפו תלאביב מכללה"
    },
    "id": 4541,
    "ItemNm": "תבלין מעורב קופסא",
    "ItemStatus": false
  },
  {
    "ItemPrice": 8.9,
    "ItemCode": "5",
    "store": {
      "name": "ktshivuk"
    },
    "AllowDiscount": false,
    "chain": {
      "branch": "4 קיי טיי מרקט חריש"
    },
    "id": 12338,
    "ItemNm": "עגבניה",
    "ItemStatus": false
  },
  {
    "ItemPrice": 6.9,
    "ItemCode": "9",
    "store": {
      "name": "ktshivuk"
    },
    "AllowDiscount": false,
    "chain": {
      "branch": "4 קיי טיי מרקט חריש"
    },
    "id": 12339,
    "ItemNm": "חציל",
    "ItemStatus": false
  },
  {
    "ItemPrice": 6.9,
    "ItemCode": "10",
    "store": {
      "name": "ktshivuk"
    },
    "AllowDiscount": false,
    "chain": {
      "branch": "4 קיי טיי מרקט חריש"
    },
    "id": 12340,
    "ItemNm": "קישוא",
    "ItemStatus": false
  },
  {
    "ItemPrice": 9.9,
    "ItemCode": "11",
    "store": {
      "name": "ktshivuk"
    },
    "AllowDiscount": false,
    "chain": {
      "branch": "4 קיי טיי מרקט חריש"
    },
    "id": 12341,
    "ItemNm": "בטטה",
    "ItemStatus": false
  },
  {
    "ItemPrice": 7.9,
    "ItemCode": "12",
    "store": {
      "name": "ktshivuk"
    },
    "AllowDiscount": false,
    "chain": {
      "branch": "4 קיי טיי מרקט חריש"
    },
    "id": 12342,
    "ItemNm": "דלורית",
    "ItemStatus": false
  },
  {
    "ItemPrice": 14.9,
    "ItemCode": "13",
    "store": {
      "name": "ktshivuk"
    },
    "AllowDiscount": false,
    "chain": {
      "branch": "4 קיי טיי מרקט חריש"
    },
    "id": 12343,
    "ItemNm": "בננה",
    "ItemStatus": false
  },
  {
    "ItemPrice": 4.9,
    "ItemCode": "14",
    "store": {
      "name": "ktshivuk"
    },
    "AllowDiscount": false,
    "chain": {
      "branch": "4 קיי טיי מרקט חריש"
    },
    "id": 12344,
    "ItemNm": "סלק",
    "ItemStatus": false
  },
  {
    "ItemPrice": 3.9,
    "ItemCode": "17",
    "store": {
      "name": "ktshivuk"
    },
    "AllowDiscount": false,
    "chain": {
      "branch": "4 קיי טיי מרקט חריש"
    },
    "id": 12345,
    "ItemNm": "אבטיח",
    "ItemStatus": false
  },
  {
    "ItemPrice": 12.9,
    "ItemCode": "21",
    "store": {
      "name": "ktshivuk"
    },
    "AllowDiscount": false,
    "chain": {
      "branch": "4 קיי טיי מרקט חריש"
    },
    "id": 12346,
    "ItemNm": "תפוח עץ אדום",
    "ItemStatus": false
  },
  {
    "ItemPrice": 12.9,
    "ItemCode": "23",
    "store": {
      "name": "ktshivuk"
    },
    "AllowDiscount": false,
    "chain": {
      "branch": "4 קיי טיי מרקט חריש"
    },
    "id": 12347,
    "ItemNm": "תפוח עץ גרנד",
    "ItemStatus": false
  },
  {
    "ItemPrice": 24.9,
    "ItemCode": "31",
    "store": {
      "name": "ktshivuk"
    },
    "AllowDiscount": false,
    "chain": {
      "branch": "4 קיי טיי מרקט חריש"
    },
    "id": 12348,
    "ItemNm": "ענבים אדום",
    "ItemStatus": false
  },
  {
    "ItemPrice": 19.9,
    "ItemCode": "32",
    "store": {
      "name": "ktshivuk"
    },
    "AllowDiscount": false,
    "chain": {
      "branch": "4 קיי טיי מרקט חריש"
    },
    "id": 12349,
    "ItemNm": "ענבים לבן",
    "ItemStatus": false
  },
  {
    "ItemPrice": 16.9,
    "ItemCode": "34",
    "store": {
      "name": "ktshivuk"
    },
    "AllowDiscount": false,
    "chain": {
      "branch": "4 קיי טיי מרקט חריש"
    },
    "id": 12350,
    "ItemNm": "שזיף אדום",
    "ItemStatus": false
  },
  {
    "ItemPrice": 17.9,
    "ItemCode": "57",
    "store": {
      "name": "maayan2000"
    },
    "AllowDiscount": false,
    "chain": {
      "branch": "63 מורדות גילה"
    },
    "id": 18893,
    "ItemNm": "אפרסק",
    "ItemStatus": false
  },
  {
    "ItemPrice": 3.9,
    "ItemCode": "71",
    "store": {
      "name": "maayan2000"
    },
    "AllowDiscount": false,
    "chain": {
      "branch": "63 מורדות גילה"
    },
    "id": 18894,
    "ItemNm": "אבטיח",
    "ItemStatus": false
  },
  {
    "ItemPrice": 5.9,
    "ItemCode": "102",
    "store": {
      "name": "maayan2000"
    },
    "AllowDiscount": false,
    "chain": {
      "branch": "63 מורדות גילה"
    },
    "id": 18895,
    "ItemNm": "מלפפון",
    "ItemStatus": false
  },
  {
    "ItemPrice": 7.9,
    "ItemCode": "107",
    "store": {
      "name": "maayan2000"
    },
    "AllowDiscount": false,
    "chain": {
      "branch": "63 מורדות גילה"
    },
    "id": 18896,
    "ItemNm": "פלפל אדום",
    "ItemStatus": false
  },
  {
    "ItemPrice": 6.9,
    "ItemCode": "112",
    "store": {
      "name": "maayan2000"
    },
    "AllowDiscount": false,
    "chain": {
      "branch": "63 מורדות גילה"
    },
    "id": 18897,
    "ItemNm": "סלק אדום",
    "ItemStatus": false
  },
  {
    "ItemPrice": 4.9,
    "ItemCode": "116",
    "store": {
      "name": "maayan2000"
    },
    "AllowDiscount": false,
    "chain": {
      "branch": "63 מורדות גילה"
    },
    "id": 18898,
    "ItemNm": "תפו\"א לבן ארוז",
    "ItemStatus": false
  },
  {
    "ItemPrice": 3.9,
    "ItemCode": "117",
    "store": {
      "name": "maayan2000"
    },
    "AllowDiscount": false,
    "chain": {
      "branch": "63 מורדות גילה"
    },
    "id": 18899,
    "ItemNm": "בצל יבש",
    "ItemStatus": false
  },
  {
    "ItemPrice": 7.9,
    "ItemCode": "121",
    "store": {
      "name": "maayan2000"
    },
    "AllowDiscount": false,
    "chain": {
      "branch": "63 מורדות גילה"
    },
    "id": 18900,
    "ItemNm": "פלפל חריף",
    "ItemStatus": false
  },
  {
    "ItemPrice": 12.9,
    "ItemCode": "141",
    "store": {
      "name": "maayan2000"
    },
    "AllowDiscount": false,
    "chain": {
      "branch": "63 מורדות גילה"
    },
    "id": 18901,
    "ItemNm": "בטטה",
    "ItemStatus": false
  },
  {
    "ItemPrice": 14.9,
    "ItemCode": "152",
    "store": {
      "name": "maayan2000"
    },
    "AllowDiscount": false,
    "chain": {
      "branch": "63 מורדות גילה"
    },
    "id": 18902,
    "ItemNm": "עגבניות שרי",
    "ItemStatus": false
  },
  {
    "ItemPrice": 4.9,
    "ItemCode": "162",
    "store": {
      "name": "maayan2000"
    },
    "AllowDiscount": false,
    "chain": {
      "branch": "63 מורדות גילה"
    },
    "id": 18903,
    "ItemNm": "בצל אדום",
    "ItemStatus": false
  },
  {
    "ItemPrice": 12.9,
    "ItemCode": "164",
    "store": {
      "name": "maayan2000"
    },
    "AllowDiscount": false,
    "chain": {
      "branch": "63 מורדות גילה"
    },
    "id": 18904,
    "ItemNm": "לימון",
    "ItemStatus": false
  },
  {
    "ItemPrice": 26.9,
    "ItemCode": "166",
    "store": {
      "name": "maayan2000"
    },
    "AllowDiscount": false,
    "chain": {
      "branch": "63 מורדות גילה"
    },
    "id": 18905,
    "ItemNm": "שזיף אדום",
    "ItemStatus": false
  },
  {
    "ItemPrice": 16.9,
    "ItemCode": "169",
    "store": {
      "name": "maayan2000"
    },
    "AllowDiscount": false,
    "chain": {
      "branch": "63 מורדות גילה"
    },
    "id": 18906,
    "ItemNm": "ענבים ירוקים",
    "ItemStatus": false
  },
  {
    "ItemPrice": 19.9,
    "ItemCode": "173",
    "store": {
      "name": "maayan2000"
    },
    "AllowDiscount": false,
    "chain": {
      "branch": "63 מורדות גילה"
    },
    "id": 18907,
    "ItemNm": "סברס",
    "ItemStatus": false
  },
  {
    "ItemPrice": 19.9,
    "ItemCode": "174",
    "store": {
      "name": "maayan2000"
    },
    "AllowDiscount": false,
    "chain": {
      "branch": "63 מורדות גילה"
    },
    "id": 18908,
    "ItemNm": "תפו\"ע פינק",
    "ItemStatus": false
  },
  {
    "ItemPrice": 12.9,
    "ItemCode": "189",
    "store": {
      "name": "maayan2000"
    },
    "AllowDiscount": false,
    "chain": {
      "branch": "63 מורדות גילה"
    },
    "id": 18909,
    "ItemNm": "בננה",
    "ItemStatus": false
  },
  {
    "ItemPrice": 8.9,
    "ItemCode": "393",
    "store": {
      "name": "maayan2000"
    },
    "AllowDiscount": false,
    "chain": {
      "branch": "63 מורדות גילה"
    },
    "id": 18910,
    "ItemNm": "חלה  מיני",
    "ItemStatus": false
  },
    {
    "ItemPrice": 59.9,
    "ItemCode": "194826",
    "store": {
      "name": "shefabirkathashem"
    },
    "AllowDiscount": false,
    "chain": {
      "branch": "42 אופקים"
    },
    "id": 20239,
    "ItemNm": "שניצל פרימיום דק דק טרי מחפוד ארוז",
    "ItemStatus": false
  },
  {
    "ItemPrice": 50,
    "ItemCode": "208403",
    "store": {
      "name": "shefabirkathashem"
    },
    "AllowDiscount": false,
    "chain": {
      "branch": "42 אופקים"
    },
    "id": 20240,
    "ItemNm": "חמצוצים / ליקריץ במשקל",
    "ItemStatus": false
  },
  {
    "ItemPrice": 89.9,
    "ItemCode": "225959",
    "store": {
      "name": "shefabirkathashem"
    },
    "AllowDiscount": false,
    "chain": {
      "branch": "42 אופקים"
    },
    "id": 20241,
    "ItemNm": "שווארמה הודו טרי מחפוד",
    "ItemStatus": false
  },
  {
    "ItemPrice": 35.3,
    "ItemCode": "225966",
    "store": {
      "name": "shefabirkathashem"
    },
    "AllowDiscount": false,
    "chain": {
      "branch": "42 אופקים"
    },
    "id": 20242,
    "ItemNm": "שוקיים הודו טרי ארוז מחפוד",
    "ItemStatus": false
  },
    {
    "ItemPrice": 12.9,
    "ItemCode": "148362",
    "store": {
      "name": "shefabirkathashem"
    },
    "AllowDiscount": false,
    "chain": {
      "branch": "42 אופקים"
    },
    "id": 20233,
    "ItemNm": "כרוב אדום מהדרין",
    "ItemStatus": false
  },
  {
    "ItemPrice": 28.9,
    "ItemCode": "194529",
    "store": {
      "name": "shefabirkathashem"
    },
    "AllowDiscount": false,
    "chain": {
      "branch": "42 אופקים"
    },
    "id": 20234,
    "ItemNm": "עוף שלם טרי מחפוד ארוז",
    "ItemStatus": false
  },
  {
    "ItemPrice": 44.9,
    "ItemCode": "194536",
    "store": {
      "name": "shefabirkathashem"
    },
    "AllowDiscount": false,
    "chain": {
      "branch": "42 אופקים"
    },
    "id": 20235,
    "ItemNm": "חזה עוף טרי מחפוד ארוז",
    "ItemStatus": false
  },
  {
    "ItemPrice": 39.9,
    "ItemCode": "194543",
    "store": {
      "name": "shefabirkathashem"
    },
    "AllowDiscount": false,
    "chain": {
      "branch": "42 אופקים"
    },
    "id": 20236,
    "ItemNm": "כרעיים עוף טרי מחפוד ארוז",
    "ItemStatus": false
  },
  {
    "ItemPrice": 16.9,
    "ItemCode": "194550",
    "store": {
      "name": "shefabirkathashem"
    },
    "AllowDiscount": false,
    "chain": {
      "branch": "42 אופקים"
    },
    "id": 20237,
    "ItemNm": "כנפיים עוף טרי מחפוד ארוז",
    "ItemStatus": false
  },
  {
    "ItemPrice": 19.9,
    "ItemCode": "434",
    "store": {
      "name": "shuk-hayir"
    },
    "AllowDiscount": false,
    "chain": {
      "branch": "319 אונליין - אור ים"
    },
    "id": 27272,
    "ItemNm": "שזיף אדום",
    "ItemStatus": false
  },
  {
    "ItemPrice": 34.9,
    "ItemCode": "566",
    "store": {
      "name": "shuk-hayir"
    },
    "AllowDiscount": false,
    "chain": {
      "branch": "319 אונליין - אור ים"
    },
    "id": 27273,
    "ItemNm": "ענב אדום",
    "ItemStatus": false
  },
  {
    "ItemPrice": 6.9,
    "ItemCode": "606",
    "store": {
      "name": "shuk-hayir"
    },
    "AllowDiscount": false,
    "chain": {
      "branch": "319 אונליין - אור ים"
    },
    "id": 27274,
    "ItemNm": "בצל אדום",
    "ItemStatus": false
  },
  {
    "ItemPrice": 5.9,
    "ItemCode": "615",
    "store": {
      "name": "shuk-hayir"
    },
    "AllowDiscount": false,
    "chain": {
      "branch": "319 אונליין - אור ים"
    },
    "id": 27275,
    "ItemNm": "גזר ארוז",
    "ItemStatus": false
  },
  {
    "ItemPrice": 7.9,
    "ItemCode": "690",
    "store": {
      "name": "shuk-hayir"
    },
    "AllowDiscount": false,
    "chain": {
      "branch": "319 אונליין - אור ים"
    },
    "id": 27276,
    "ItemNm": "שומר",
    "ItemStatus": false
  },
  {
    "ItemPrice": 35.9,
    "ItemCode": "194239",
    "store": {
      "name": "shuk-hayir"
    },
    "AllowDiscount": false,
    "chain": {
      "branch": "319 אונליין - אור ים"
    },
    "id": 27277,
    "ItemNm": "חזה עוף קפוא מחפוד",
    "ItemStatus": false
  },
  {
    "ItemPrice": 6.62,
    "ItemCode": "584113",
    "store": {
      "name": "shuk-hayir"
    },
    "AllowDiscount": false,
    "chain": {
      "branch": "319 אונליין - אור ים"
    },
    "id": 27278,
    "ItemNm": "חלה רגילה",
    "ItemStatus": false
  },
  {
    "ItemPrice": 5.9,
    "ItemCode": "610059",
    "store": {
      "name": "shuk-hayir"
    },
    "AllowDiscount": false,
    "chain": {
      "branch": "319 אונליין - אור ים"
    },
    "id": 27279,
    "ItemNm": "תפו\"א לבן ארוז",
    "ItemStatus": false
  },
  {
    "ItemPrice": 18.9,
    "ItemCode": "610267",
    "store": {
      "name": "shuk-hayir"
    },
    "AllowDiscount": false,
    "chain": {
      "branch": "319 אונליין - אור ים"
    },
    "id": 27280,
    "ItemNm": "לבבות עוף קפוא חתם סופר",
    "ItemStatus": false
  },
  {
    "ItemPrice": 3,
    "ItemCode": "72940761",
    "store": {
      "name": "shuk-hayir"
    },
    "AllowDiscount": false,
    "chain": {
      "branch": "319 אונליין - אור ים"
    },
    "id": 27281,
    "ItemNm": "מילקי בטעם שוקולד 170 גרם",
    "ItemStatus": false
  },
  {
    "ItemPrice": 22.2,
    "ItemCode": "16000548404",
    "store": {
      "name": "shuk-hayir"
    },
    "AllowDiscount": false,
    "chain": {
      "branch": "319 אונליין - אור ים"
    },
    "id": 27282,
    "ItemNm": "חטיף שיבולת שועל עם דבש נייטשר ואלי 210 גרם",
    "ItemStatus": false
  },
  {
    "ItemPrice": 19.1,
    "ItemCode": "856591000918",
    "store": {
      "name": "shuk-hayir"
    },
    "AllowDiscount": false,
    "chain": {
      "branch": "319 אונליין - אור ים"
    },
    "id": 27283,
    "ItemNm": "עוגיות מזרחיות בטעם טבעי עבאדי 8 * 40 גרם",
    "ItemStatus": false
  },
  {
    "ItemPrice": 9.9,
    "ItemCode": "2",
    "store": {
      "name": "citymarketkiryatgat"
    },
    "AllowDiscount": false,
    "chain": {
      "branch": "46 רמלה יעקב דורי"
    },
    "id": 1,
    "ItemNm": "מלפפון פרימיום",
    "ItemStatus": false
  },
  {
    "ItemPrice": 9.9,
    "ItemCode": "3",
    "store": {
      "name": "citymarketkiryatgat"
    },
    "AllowDiscount": false,
    "chain": {
      "branch": "46 רמלה יעקב דורי"
    },
    "id": 2,
    "ItemNm": "עגבניה פרימיום",
    "ItemStatus": false
  },
  {
    "ItemPrice": 19.9,
    "ItemCode": "4",
    "store": {
      "name": "citymarketkiryatgat"
    },
    "AllowDiscount": false,
    "chain": {
      "branch": "46 רמלה יעקב דורי"
    },
    "id": 3,
    "ItemNm": "תפוח פינק ליידי",
    "ItemStatus": false
  },
  {
    "ItemPrice": 10.9,
    "ItemCode": "5",
    "store": {
      "name": "citymarketkiryatgat"
    },
    "AllowDiscount": false,
    "chain": {
      "branch": "46 רמלה יעקב דורי"
    },
    "id": 4,
    "ItemNm": "קישוא פרימיום",
    "ItemStatus": false
  },
  {
    "ItemPrice": 13.9,
    "ItemCode": "8",
    "store": {
      "name": "citymarketkiryatgat"
    },
    "AllowDiscount": false,
    "chain": {
      "branch": "46 רמלה יעקב דורי"
    },
    "id": 5,
    "ItemNm": "פלפל ירוק",
    "ItemStatus": false
  },
  {
    "ItemPrice": 12.9,
    "ItemCode": "9",
    "store": {
      "name": "citymarketkiryatgat"
    },
    "AllowDiscount": false,
    "chain": {
      "branch": "46 רמלה יעקב דורי"
    },
    "id": 6,
    "ItemNm": "פלפל אדום פרימיום",
    "ItemStatus": false
  },
  {
    "ItemPrice": 12.9,
    "ItemCode": "11",
    "store": {
      "name": "citymarketkiryatgat"
    },
    "AllowDiscount": false,
    "chain": {
      "branch": "46 רמלה יעקב דורי"
    },
    "id": 7,
    "ItemNm": "פלפל כתום",
    "ItemStatus": false
  },
  {
    "ItemPrice": 13.9,
    "ItemCode": "13",
    "store": {
      "name": "citymarketkiryatgat"
    },
    "AllowDiscount": false,
    "chain": {
      "branch": "46 רמלה יעקב דורי"
    },
    "id": 8,
    "ItemNm": "פלפל חריף",
    "ItemStatus": false
  },
  {
    "ItemPrice": 8.9,
    "ItemCode": "15",
    "store": {
      "name": "citymarketkiryatgat"
    },
    "AllowDiscount": false,
    "chain": {
      "branch": "46 רמלה יעקב דורי"
    },
    "id": 9,
    "ItemNm": "בצל אדום",
    "ItemStatus": false
  },
  {
    "ItemPrice": 4.9,
    "ItemCode": "16",
    "store": {
      "name": "citymarketkiryatgat"
    },
    "AllowDiscount": false,
    "chain": {
      "branch": "46 רמלה יעקב דורי"
    },
    "id": 10,
    "ItemNm": "בצל יבש",
    "ItemStatus": false
  },
  {
    "ItemPrice": 12.9,
    "ItemCode": "17",
    "store": {
      "name": "citymarketkiryatgat"
    },
    "AllowDiscount": false,
    "chain": {
      "branch": "46 רמלה יעקב דורי"
    },
    "id": 11,
    "ItemNm": "לימון פרימיום",
    "ItemStatus": false
  },
  {
    "ItemPrice": 6.9,
    "ItemCode": "18",
    "store": {
      "name": "citymarketkiryatgat"
    },
    "AllowDiscount": false,
    "chain": {
      "branch": "46 רמלה יעקב דורי"
    },
    "id": 12,
    "ItemNm": "תפו\"א לבן",
    "ItemStatus": false
  },
  {
    "ItemPrice": 5.9,
    "ItemCode": "19",
    "store": {
      "name": "citymarketkiryatgat"
    },
    "AllowDiscount": false,
    "chain": {
      "branch": "46 רמלה יעקב דורי"
    },
    "id": 13,
    "ItemNm": "תפו\"א אדום",
    "ItemStatus": false
  },
  {
    "ItemPrice": 5.9,
    "ItemCode": "23",
    "store": {
      "name": "citymarketkiryatgat"
    },
    "AllowDiscount": false,
    "chain": {
      "branch": "46 רמלה יעקב דורי"
    },
    "id": 14,
    "ItemNm": "כרוב אדום",
    "ItemStatus": false
  },
  {
    "ItemPrice": 5.9,
    "ItemCode": "24",
    "store": {
      "name": "citymarketkiryatgat"
    },
    "AllowDiscount": false,
    "chain": {
      "branch": "46 רמלה יעקב דורי"
    },
    "id": 15,
    "ItemNm": "כרוב לבן",
    "ItemStatus": false
  },
  {
    "ItemPrice": 9.9,
    "ItemCode": "26",
    "store": {
      "name": "citymarketkiryatgat"
    },
    "AllowDiscount": false,
    "chain": {
      "branch": "46 רמלה יעקב דורי"
    },
    "id": 16,
    "ItemNm": "חצילים פרימיום",
    "ItemStatus": false
  },
]