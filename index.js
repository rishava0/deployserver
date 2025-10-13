const express = require ('express');
const body_parser = require ('body-parser');
const connectDB = require ('./config/db');
const userRouter = require('./routers/userrouter');

const app = express();
app.use(body_parser.json());
app.use('/',userRouter);

app.get('/api/l', (req, res)=>{
    res.send('Welfcome to Electronics Section')
    //http://localhost:3000/api/l
    });

const PORT = 3000;

app.listen(PORT,()=>{
    console.log(`Server running on: ${PORT}`)
});
connectDB();
