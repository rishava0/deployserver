const express =  require('express');
const connectDB = require('./config/db.js');
const todoRoutes = require ('./routes/todoRouters.js');

connectDB();

const app = express();
app.use (express.json());

app.use('/api/todos', todoRoutes);

const PORT = 5000;
app.listen(PORT, ()=>{
    console.log(`Server running on port ${PORT}`);
})