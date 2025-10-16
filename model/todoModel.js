const mongoose = require ('mongoose');
const UserModel = require("../model/user.model");
const { Schema } = mongoose;

const todoSchema = new mongoose.Schema({
    userId: {
        //type: Schema.Types.ObjectId, 
        type: String,
        ref:UserModel.modelName,
    },
    Item: {
        type: String,
        required: true,
    },
        SubItem: {
        type: String,
        required: true,
    },
    Rake_No: {
        type: String,
        required: true,
    },
    Coach_No: {
        type: String,
        required: true,
    }, 
    LoweredSN: {
       type: String,
       required: true,
    }, 
    FittedSN: {
        type: String,
        required: true,
    }, 
     NatureOfProblem: {
        type: String,
        required: true,
    }, 
},{timestamps:true});

const Todo = mongoose.model('Todo',todoSchema);

module.exports = Todo;
