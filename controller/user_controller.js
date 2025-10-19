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

exports.updatePassword = async (req, res, next) => {
  try {
    const { email, oldPassword, newPassword } = req.body;

    if (!email || !oldPassword || !newPassword) {
      return res.status(400).json({ status: false, message: "All fields are required" });
    }

    // Check if user exists
    const user = await UserService.checkuser(email);
    if (!user) {
      return res.status(404).json({ status: false, message: "User does not exist" });
    }

    // Check old password (your UserModel has comparePassword)
    const isMatch = await user.comparePassword(oldPassword);
    if (!isMatch) {
      return res.status(401).json({ status: false, message: "Old password is incorrect" });
    }

    // Update password (4-digit numeric)
    user.password = newPassword;
    await user.save();

    res.status(200).json({ status: true, message: "Password updated successfully" });

  } catch (error) {
    console.error("Error updating password:", error);
    res.status(500).json({ status: false, message: "Server error" });
  }
};