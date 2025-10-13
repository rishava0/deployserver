const mongoose = require ('mongoose');
const db = require ('../config/db');
const { Schema } = mongoose;
const userSchema = new Schema({
    email:{
        type: String,
        lowercase:true,
        required: true,
        unique:true
    },
    password:{
        type:String,
        required:true
    }
});



userSchema.methods.comparePassword= async function(userPassword){
    try{
        return userPassword == this.password;
    }catch(error){
        throw error;
    }
};

const UserModel = mongoose.model("user",userSchema);
module.exports = UserModel;
