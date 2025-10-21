const router = require ('express').Router();
const moment = require('moment');
const SuggestionService = require("../services/suggestion.service")
const { createTodo } = require('../controller/todoController');
const UserController = require('../controller/user_controller');
const Todo = require('../model/todoModel');
const authMiddleware = require('../middleware/auth');

const XLSX = require("xlsx");
const fs = require("fs");


const categories=[
{name:'All'},
{name:'PAPIS'},
{name:'BECU'},
{name:'TCMS'},
{name:'TIC'},
{name:'AUX'},
{name:'DCU'},
];


//router.post('/api/',createTodo);

router.post('/api/', authMiddleware,async (req, res) =>{
try{
   if (!req.user || !req.user._id) {
      return res.status(401).json({ message: "Unauthorized: User info missing" });
    }
    const todo = new Todo({
      userId: req.user._id,
      mail:req.user.email,
      Item: req.body.Item,
      SubItem: req.body.SubItem,
      Rake_No: req.body.Rake_No,
      Coach_No: req.body.Coach_No,
      LoweredSN: req.body.LoweredSN,
      FittedSN: req.body.FittedSN,
      NatureOfProblem: req.body.NatureOfProblem,
    });
    const savedTodo = await todo.save();
    res.status(201).json(savedTodo);
}catch(error){
    res.status(400).json({message:error.message});
};
});



router.post('/api/login',UserController.login);
router.post("/api/updatePassword", UserController.updatePassword);

router.get('/', (req, res)=>{
    res.send('Welcome to Electronics Section work')
    });

router.get('/api/categories', (req, res)=>{
    res.json({
        success:true,
        data:categories
    })
    });

router.get('/api/news', async(req, res)=> {
const {page =1, limit =25, Item} = req.query;
const query={};
if (Item) query.Item= Item;
try{
        const news = await Todo.find(query)
        .sort ({createdAt: -1})
        .skip((page -1)* limit)
        .limit(parseInt(limit));
        const total = await Todo.countDocuments(query);
        res.json({
            success: true,
            data: news,
            currentpage: parseInt(page),
            totalPages: Math.ceil(total/limit),
            totalArticles: total
        });
    } catch (error){
        res.status(500).json({success: false, message:error.message});
    }
});

router.get("/api/suggestion", async (req, res) => {
  try {
    const query = req.query.q || "";
    const results = await SuggestionService.getSuggestions(query);
    res.json(results);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

router.get("/api/getTodosByLoweredSN1", async (req, res) => {
  try {
    const loweredSN = req.query.loweredSN; // ?loweredSN=1001
    if (!loweredSN) {
      return res.status(400).json({ error: "LoweredSN is required" });
    }

    const todos = await Todo.find({$or:[{ LoweredSN: loweredSN },{FittedSN: loweredSN}]}).sort({ createdAt: -1 }); //.populate('userId', 'email');
        if (todos.length === 0) {
      return res.status(404).json({ message: "No records found" });
    }
    res.status(200).json(todos);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

router.get("/api/getTodosByLoweredSN", async (req, res) => {
  try {
    const { item, subitem, loweredSN } = req.query; // ?item=PAPIS&subitem=CCIMS&loweredSN=1234

    if (!item || !subitem || !loweredSN) {
      return res
        .status(400)
        .json({ error: "Item, SubItem, and LoweredSN are required" });
    }

    // Find all records with same Item/SubItem and matching serial number (Lowered or Fitted)
    const todos = await Todo.find({
      Item: item,
      SubItem: subitem,
      $or: [{ LoweredSN: loweredSN }, { FittedSN: loweredSN }],
    }).sort({ createdAt: -1 });

    if (todos.length === 0) {
      return res.status(404).json({ message: "No records found" });
    }

    res.status(200).json(todos);
  } catch (err) {
    console.error("Server error:", err);
    res.status(500).json({ error: "Server error" });
  }
});


router.get("/api/downloadExcel", async (req, res) => {

 const news = await Todo.find().lean();
  
      // Convert JSON → Excel workbook
  const worksheet = XLSX.utils.json_to_sheet(news);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Sheet1");

  // Save Excel to temp file
  const filePath = "./data.xlsx";
  XLSX.writeFile(workbook, filePath);

  // Send file as download
  res.download(filePath, "data.xlsx", (err) => {
    if (err) {
      console.error("Error sending file:", err);
    }
    fs.unlinkSync(filePath); // delete temp file
  });
});

router.get('/api/search', async (req, res) => {
  try {
    const { query, rakeNo, coachNo, item, subItem, startDate, endDate } = req.query;

    let searchFilter = {};

    // Prefix-based search for single query
    if (query) {
      if (query.startsWith("CN:")) {
        const value = query.replace("CN:", "").trim();
        searchFilter = { Coach_No: { $regex: value, $options: "i" } };
      } else if (query.startsWith("LOW:")) {
        const value = query.replace("LOW:", "").trim();
        searchFilter = { LoweredSN: { $regex: value, $options: "i" } };
      } else if (query.startsWith("FIT:")) {
        const value = query.replace("FIT:", "").trim();
        searchFilter = { FittedSN: { $regex: value, $options: "i" } };
      } else if (query.startsWith("RN:")) {
        const value = query.replace("RN:", "").trim();
        searchFilter = { Rake_No: { $regex: value, $options: "i" } };
      } else {
        searchFilter = {
          $or: [
            { Item: { $regex: query, $options: "i" } },
            { SubItem: { $regex: query, $options: "i" } },
            { Rake_No: { $regex: query, $options: "i" } },
            { Coach_No: { $regex: query, $options: "i" } },
            { LoweredSN: { $regex: query, $options: "i" } },
            { FittedSN: { $regex: query, $options: "i" } },
            { NatureOfProblem: { $regex: query, $options: "i" } },
          ],
        };
      }
    } else {
      // Advanced search filters
      if (rakeNo) searchFilter.Rake_No = { $regex: rakeNo, $options: "i" };
      if (coachNo) searchFilter.Coach_No = { $regex: coachNo, $options: "i" };
      if (item) searchFilter.Item = { $regex: item, $options: "i" };
      if (subItem) searchFilter.SubItem = { $regex: subItem, $options: "i" };
      if (startDate || endDate) {
        searchFilter.createdAt = {};
    if (startDate) {
      const start = moment(startDate, 'YYYY-MM-DD').startOf('day').toDate();
      searchFilter.createdAt = { ...searchFilter.createdAt, $gte: start };
    }
    if (endDate) {
      const end = moment(endDate, 'YYYY-MM-DD').endOf('day').toDate();
      searchFilter.createdAt = { ...searchFilter.createdAt, $lte: end };
    }

        //if (startDate) searchFilter.createdAt.$gte = new Date(startDate);
       // if (endDate) searchFilter.createdAt.$lte = new Date(endDate);
      }
    }

    const results = await Todo.find(searchFilter).sort({ createdAt: -1 });

    res.json({
      success: true,
      data: results,
      total: results.length,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: error.message });
  }
});


router.delete('/api/deleteTodo/:id', async (req, res) => {
  const { id } = req.params;

  try {
    const deletedTodo = await Todo.findByIdAndDelete(id);

    if (!deletedTodo) {
      return res.status(404).json({ status: false, message: 'Todo not found' });
    }

    res.status(200).json({ status: true, message: 'Todo deleted successfully' });
  } catch (error) {
    console.error('Delete error:', error);
    res.status(500).json({ status: false, message: 'Internal server error' });
  }
});

router.get('/api/unitStatus', async (req, res) => {
  try {
    // Fetch all entries sorted by creation time
    const todos = await Todo.find().sort({ createdAt: 1 });

    const newItems = [];
    const repairedItems = [];
    const defectiveItems = [];

    for (const t of todos) {
      const LoweredSN = t.LoweredSN;
      const FittedSN = t.FittedSN;

      // ---------- NEW ----------
  if (LoweredSN && FittedSN && LoweredSN === FittedSN && t.Coach_No === 'NEW ISSUE') {
  // Check if any previous entry has this LoweredSN or FittedSN
  const hasEarlier = todos.some(
    (x) =>
      x.createdAt < t.createdAt &&
      (x.LoweredSN === LoweredSN || x.FittedSN === LoweredSN)
  );

  // Check if any later entry has this LoweredSN or FittedSN
  const hasLater = todos.some(
    (x) =>
      x.createdAt > t.createdAt &&
      (x.LoweredSN === LoweredSN || x.FittedSN === LoweredSN)
  );

  if (!hasEarlier && !hasLater) {
    newItems.push({
      Item: t.Item,
      SubItem: t.SubItem,
      LoweredSN,
      FittedSN,
      Coach_No: t.Coach_No,
    });
  }
}

      // ---------- REPAIRED ----------
      else if (LoweredSN && FittedSN && LoweredSN === FittedSN && t.Coach_No === 'REPAIRED') {
        const hasLater = todos.some(
          (x) =>
            (x.LoweredSN === LoweredSN || x.FittedSN === LoweredSN) &&
            x.createdAt > t.createdAt
        );
        if (!hasLater) {
          repairedItems.push({
            Item: t.Item,
            SubItem: t.SubItem,
            LoweredSN,
            FittedSN,
            Coach_No: t.Coach_No,
          });
        }
      }

      // ---------- DEFECTIVE ----------
      else if (LoweredSN) {
        // Check if this serial is not later NEW ISSUE or REPAIRED
        const hasLaterNewOrRepaired = todos.some(
          (x) =>
            x.createdAt > t.createdAt &&
            x.LoweredSN === LoweredSN &&
            ((x.FittedSN === x.LoweredSN && x.Coach_No === 'NEW ISSUE') ||
             (x.FittedSN === x.LoweredSN && x.Coach_No === 'REPAIRED'))
        );

        // Also check if there is a later fitting
        const hasFittedLater = todos.some(
          (x) =>
            x.createdAt > t.createdAt &&
            x.FittedSN === LoweredSN
        );

        if (!hasLaterNewOrRepaired && !hasFittedLater) {
          defectiveItems.push({
            Item: t.Item,
            SubItem: t.SubItem,
            LoweredSN,
            Coach_No: t.Coach_No,
          });
        }
      }
    }

    res.json({
      success: true,
      data: {
        new: newItems,
        repaired: repairedItems,
        defective: defectiveItems,
      },
    });
  } catch (error) {
    console.error('Error in /unitStatus:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});


// routes/advancedSearch.js
router.get('/api/unitStatusSummary', async (req, res) => {
  try {
    const todos = await Todo.find().sort({ createdAt: 1 });

    const summaryMap = {}; // { SubItem: { new: [], repaired: [], defective: [] } }

    for (const t of todos) {
      const LoweredSN = t.LoweredSN;
      const FittedSN = t.FittedSN;
      const sub = t.SubItem;

      if (!summaryMap[sub]) summaryMap[sub] = { new: [], repaired: [], defective: [] };

      // NEW
      if (LoweredSN && FittedSN && LoweredSN === FittedSN && t.Coach_No === 'NEW ISSUE') {
        const hasEarlier = todos.some(x => x.createdAt < t.createdAt && (x.LoweredSN === LoweredSN || x.FittedSN === LoweredSN));
        const hasLater = todos.some(x => x.createdAt > t.createdAt && (x.LoweredSN === LoweredSN || x.FittedSN === LoweredSN));
        if (!hasEarlier && !hasLater) summaryMap[sub].new.push(LoweredSN);
      }

      // REPAIRED
      else if (LoweredSN && FittedSN && LoweredSN === FittedSN && t.Coach_No === 'REPAIRED') {
        const hasLater = todos.some(x => (x.LoweredSN === LoweredSN || x.FittedSN === LoweredSN) && x.createdAt > t.createdAt);
        if (!hasLater) summaryMap[sub].repaired.push(LoweredSN);
      }

      // DEFECTIVE
      else if (LoweredSN) {
        const hasLaterNewOrRepaired = todos.some(
          x => x.createdAt > t.createdAt &&
               x.LoweredSN === LoweredSN &&
               ((x.FittedSN === x.LoweredSN && (x.Coach_No === 'NEW ISSUE' || x.Coach_No === 'REPAIRED')))
        );
        const hasFittedLater = todos.some(x => x.createdAt > t.createdAt && x.FittedSN === LoweredSN);
        if (!hasLaterNewOrRepaired && !hasFittedLater) summaryMap[sub].defective.push(LoweredSN);
      }
    }

    // Prepare response with counts
    const response = Object.entries(summaryMap).map(([subItem, lists]) => ({
      SubItem: subItem,
      counts: {
        new: lists.new.length,
        repaired: lists.repaired.length,
        defective: lists.defective.length,
      },
      LoweredSNs: lists // keep arrays if needed later
    }));

    res.json({ success: true, data: response });

  } catch (error) {
    console.error('Error in /unitStatusSummary:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Example route: /api/unitStatusCount
router.get('/api/unitStatusCount1', async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    if (!startDate || !endDate) {
      return res.status(400).json({ success: false, message: "Provide startDate and endDate in YYYY-MM-DD format" });
    }

    const start = new Date(startDate);
    const end = new Date(endDate);
    end.setHours(23, 59, 59, 999); // include entire end day

    const counts = await Todo.aggregate([
      {
        $match: {
          Coach_No: { $nin: ["NEW ISSUE", "REPAIRED"] },
          createdAt: { $gte: start, $lte: end }
        }
      },
      {
        $group: {
          _id: "$SubItem",
          count: { $sum: 1 }
        }
      },
      {
        $project: {
          _id: 0,
          SubItem: "$_id",
          count: 1
        }
      }
    ]);

    res.json({ success: true, data: counts });
  } catch (error) {
    console.error("Error in /unitStatusCount:", error);
    res.status(500).json({ success: false, message: error.message });
  }
});

router.get('/api/unitStatusCount', async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    if (!startDate || !endDate) {
      return res.status(400).json({ 
        success: false, 
        message: "Provide startDate and endDate in YYYY-MM-DD format" 
      });
    }

    const start = new Date(startDate);
    const end = new Date(endDate);
    if (isNaN(start) || isNaN(end)) {
      return res.status(400).json({ 
        success: false, 
        message: "Invalid date format. Use YYYY-MM-DD." 
      });
    }
    end.setHours(23, 59, 59, 999);

    const summary = await Todo.aggregate([
      {
        $facet: {
          // 1️⃣ Lifetime total NEW counts
          totalNew: [
            { $match: { Coach_No: "NEW ISSUE" } },
            { $group: { _id: "$SubItem", totalNewCount: { $sum: 1 } } }
          ],

          // 2️⃣ New Used count in selected range
          newUsedInRange: [
            {
              $match: { Coach_No: "NEW ISSUE", createdAt: { $gte: start, $lte: end } }
            },
            {
              $lookup: {
                from: "todos",
                let: { lowered: "$LoweredSN", fitted: "$FittedSN", selfId: "$_id" },
                pipeline: [
                  {
                    $match: {
                      $expr: {
                        $and: [
                          { $ne: ["$_id", "$$selfId"] },
                          { $or: [
                              { $eq: ["$LoweredSN", "$$lowered"] },
                              { $eq: ["$FittedSN", "$$fitted"] }
                            ] 
                          }
                        ]
                      }
                    }
                  }
                ],
                as: "history"
              }
            },
            { $match: { history: { $ne: [] } } },
            { $group: { _id: "$SubItem", newUsedCount: { $sum: 1 } } }
          ],

          // 3️⃣ Repaired Used count in selected range
          repairedUsedInRange: [
            {
              $match: { Coach_No: "REPAIRED", createdAt: { $gte: start, $lte: end } }
            },
            {
              $lookup: {
                from: "todos",
                let: { lowered: "$LoweredSN", fitted: "$FittedSN", repairedDate: "$createdAt" },
                pipeline: [
                  {
                    $match: {
                      $expr: {
                        $and: [
                          { $gt: ["$createdAt", "$$repairedDate"] },
                          { $or: [
                              { $eq: ["$LoweredSN", "$$lowered"] },
                              { $eq: ["$FittedSN", "$$fitted"] }
                            ] 
                          }
                        ]
                      }
                    }
                  },
                  { $sort: { createdAt: 1 } },
                  { $limit: 1 } // only immediate entry after repair
                ],
                as: "nextEntry"
              }
            },
            { $match: { nextEntry: { $ne: [] } } },
            { $group: { _id: "$SubItem", repairedUsedCount: { $sum: 1 } } }
          ],

          // 4️⃣ Failure count in selected range
          failedInRange: [
            {
              $match: { 
                Coach_No: { $nin: ["NEW ISSUE", "REPAIRED"] },
                createdAt: { $gte: start, $lte: end } 
              }
            },
            { $group: { _id: "$SubItem", failureCount: { $sum: 1 } } }
          ]
        }
      },

      // Combine all four facets
      {
        $project: {
          combined: {
            $setUnion: [
              "$totalNew",
              "$newUsedInRange",
              "$repairedUsedInRange",
              "$failedInRange"
            ]
          }
        }
      },
      { $unwind: "$combined" },
      { $replaceRoot: { newRoot: "$combined" } },

      // Merge counts by SubItem
      {
        $group: {
          _id: "$_id",
          totalNewCount: { $sum: "$totalNewCount" },
          newUsedCount: { $sum: "$newUsedCount" },
          repairedUsedCount: { $sum: "$repairedUsedCount" },
          failureCount: { $sum: "$failureCount" }
        }
      },
      {
        $project: {
          _id: 0,
          SubItem: "$_id",
          totalNewCount: { $ifNull: ["$totalNewCount", 0] },
          newUsedCount: { $ifNull: ["$newUsedCount", 0] },
          repairedUsedCount: { $ifNull: ["$repairedUsedCount", 0] },
          failureCount: { $ifNull: ["$failureCount", 0] }
        }
      },
      { $sort: { SubItem: 1 } }
    ]);

    res.json({ success: true, data: summary });

  } catch (error) {
    console.error("Error in /unitStatusCount:", error);
    res.status(500).json({ success: false, message: error.message });
  }
});






module.exports = router;