const { raw } = require('express');
const Todo = require ('../model/todoModel');

const getTodos = async (req, res)=>{
    try{
        const todos = await Todo.find();
        res.status(200).json(todos);
    } catch (error){
        res.status(500).json({message:error.message});
    }
};

const createTodo = async (req, res)=>{
try{
    const todo = new Todo({
        userId: req.body.userId,
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
}
};

const updateTodo = async (req, res)=>{
try{
    const updateTodo = await Todo.findByIdAndUpdate(req.params.id, req.body,{
        new: true,
        runValidators: true,
    });
    if (!updateTodo) return res.status(400).json({message: "Todo not found"});
    res.status(200).json(updateTodo);
}catch(error){
    res.status(400).json({message:error.message});
}
};
const deleteTodo = async (req, res)=>{
try{
    const deleteTodo = await Todo.findByIdAndDelete(req.params.id);
    if(!deleteTodo) return res.status(404).json({message: "Todo not found"});
    res.status(200).json({message:"Todo deleted"});
}catch(error){
    res.status(500).json({message: error.message});
}
};
module.exports={
    getTodos,
    createTodo,
    updateTodo,
    deleteTodo,
};
