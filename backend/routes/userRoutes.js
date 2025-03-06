import express from "express";
import {
	followUnFollowUser,
	getUserProfile,
	loginUser,
	logoutUser,
	signupUser,
	updateUser,
	getSuggestedUsers,
	freezeAccount,
} from "../controllers/userController.js";
import protectRoute from "../middlewares/protectRoute.js";

// Create a new router instance for the user routes
const router = express.Router();

// Get the user profile by username route with the userId from the request user object
router.get("/profile/:query", getUserProfile);

// Get the suggested users route with the userId from the request user object
router.get("/suggested", protectRoute, getSuggestedUsers);

// Signup a new user route with the userId from the request user object
router.post("/signup", signupUser);

// Login a user route with the userId from the request user object
router.post("/login", loginUser);


router.post("/logout", logoutUser);


router.post("/follow/:id", protectRoute, followUnFollowUser); // Toggle state(follow/unfollow)


router.put("/update/:id", protectRoute, updateUser);


router.put("/freeze", protectRoute, freezeAccount);

export default router;
