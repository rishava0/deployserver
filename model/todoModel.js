const mongoose = require ('mongoose');
const UserModel = require("../model/user.model");
const { Schema } = mongoose;

const todoSchema = new mongoose.Schema({
    userId: {
        type: Schema.Types.ObjectId, 
        ref:UserModel.modelName,
    },
    Item: {
        type: String,
    },
        SubItem: {
        type: String,
    },
    Rake_No: {
        type: String,
    },
    Coach_No: {
        type: String,
    }, 
    LoweredSN: {
       type: String,
    }, 
    FittedSN: {
        type: String,
    }, 
     NatureOfProblem: {
        type: String,
    }, 
},{timestamps:true});

const Todo = mongoose.model('Todo',todoSchema);

module.exports = Todo;
