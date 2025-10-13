const UserService = require("../services/user_services.js");
exports.login = async(req, res, next)=>{
    try{
        const {email, password}= req.body;
        const user = await UserService.checkuser(email);
        if (!user){
            throw new Error('User doesnt exist');
        }
        const isMatch = await user.comparePassword(password);
        if(isMatch == false){
            throw new Error('Password InValid');
        }
         let tokenData = {_id:user._id,email:user.email};
         const token = await UserService.generateToken(tokenData,"secretKey",'1h');
         res.status(200).json({status:true,token:token});

    }catch(error){
        throw error
    }
}