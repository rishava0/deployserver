const router = require ('express').Router();
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
    const todo = new Todo({
      userId: req.user.email,
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

router.get("/api/getTodosByLoweredSN", async (req, res) => {
  try {
    const loweredSN = req.query.loweredSN; // ?loweredSN=1001
    if (!loweredSN) {
      return res.status(400).json({ error: "LoweredSN is required" });
    }

    const todos = await Todo.find({$or:[{ LoweredSN: loweredSN },{FittedSN: loweredSN}]}).populate('userId', 'email');
    res.status(200).json(todos);
  } catch (err) {
    console.error(err);
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
  const { query } = req.query; // the search text
  if (!query) {
    return res.status(400).json({ success: false, message: "Query parameter is required" });
  }

  try {
    let searchFilter;

    // Detect keyword prefixes
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
      // Default: search in all fields
      searchFilter = {
        $or: [
          { Item: { $regex: query, $options: "i" } },
          { SubItem: { $regex: query, $options: "i" } },
          { Rake_No: { $regex: query, $options: "i" } },
          { Coach_No: { $regex: query, $options: "i" } },
          { LoweredSN: { $regex: query, $options: "i" } },
          { FittedSN: { $regex: query, $options: "i" } },
          { NatureOfProblem: { $regex: query, $options: "i" } },
        ]
      };
    }

    const results = await Todo.find(searchFilter).sort({ createdAt: -1 });

    res.json({
      success: true,
      data: results,
      total: results.length,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});



module.exports = router;