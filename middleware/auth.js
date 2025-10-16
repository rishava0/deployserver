const jwt = require("jsonwebtoken");
const User = require("../model/user.model");

const authMiddleware = async (req, res, next) => {
  try {
    const authHeader = req.header("Authorization");
    if (!authHeader)
      return res.status(401).json({ message: "Authorization header missing" });

    const token = authHeader.replace("Bearer ", "");
    const decoded = jwt.verify(token, "secretKey");

    const user = await User.findById(decoded._id);
    if (!user)
      return res.status(401).json({ message: "Invalid or expired token" });

    req.user = user; // attach logged-in user to request
    next();
  } catch (error) {
    res.status(401).json({ message: "Unauthorized", error: error.message });
  }
};

module.exports = authMiddleware;
