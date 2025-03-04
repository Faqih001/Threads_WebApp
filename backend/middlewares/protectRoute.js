import User from "../models/userModel.js";
import jwt from "jsonwebtoken";

// Protect route middleware to check if user is authenticated
const protectRoute = async (req, res, next) => {
	// Try to verify the token and get the user
	try {
		// Get the token from the cookies
		const token = req.cookies.jwt;

		// If there is no token, return an error
		if (!token) return res.status(401).json({ message: "Unauthorized" });

		// Verify the token using the JWT_SECRET from the .env file
		const decoded = jwt.verify(token, process.env.JWT_SECRET);

		const user = await User.findById(decoded.userId).select("-password");

		req.user = user;

		next();
	} catch (err) {
		res.status(500).json({ message: err.message });
		console.log("Error in signupUser: ", err.message);
	}
};

export default protectRoute;
