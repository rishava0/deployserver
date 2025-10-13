const jwt = require ('jsonwebtoken');
const UserModel = require ("../model/user.model");

class UserService{
    static async checkuser(email){
        try{
return await UserModel.findOne({email});
        }catch(error){
            throw error;
        }
    }

static async generateToken(tokenData,secretKey,jwt_expire){
    return jwt.sign(tokenData,secretKey,{expiresIn:jwt_expire});
}

}
module.exports=UserService;