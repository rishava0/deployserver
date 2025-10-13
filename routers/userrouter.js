const router = require ('express').Router();
const SuggestionService = require("../services/suggestion.service")
const { createTodo } = require('../controller/todoController');
const UserController = require('../controller/user_controller');
const Todo = require('../model/todoModel');

const categories=[
{name:'All'},
{name:'PAPIS'},
{name:'BECU'},
{name:'TCMS'},
{name:'TIC'},
{name:'AUX'},
{name:'DCU'},
];


router.post('/api/',createTodo);
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
const {page =1, limit =10, Item} = req.query;
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

module.exports = router;