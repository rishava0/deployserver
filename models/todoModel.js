const mongoose = require ('mongoose');

const todoSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true,
    },
    body: {
        type: String,
        required: true,
    },
    Completed: {
        type: Boolean,
        default: false,
    }, 
},{timestamps:true});

const Todo = mongoose.model('Todo',todoSchema);

module.exports = Todo;