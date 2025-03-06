import express from "express";
import {
	createPost,
	deletePost,
	getPost,
	likeUnlikePost,
	replyToPost,
	getFeedPosts,
	getUserPosts,
} from "../controllers/postController.js";
import protectRoute from "../middlewares/protectRoute.js";

// Create a new router instance for the post routes
const router = express.Router();

// Get the feed posts route with the userId from the request user object
router.get("/feed", protectRoute, getFeedPosts);

// Get the post by id route with the userId from the request user object
router.get("/:id", getPost);

// Get the user posts by username route with the userId from the request user object
router.get("/user/:username", getUserPosts);

// Create a new post route with the userId from the request user object
router.post("/create", protectRoute, createPost);

// Delete a post route with the userId from the request user object
router.delete("/:id", protectRoute, deletePost);


router.put("/like/:id", protectRoute, likeUnlikePost);


router.put("/reply/:id", protectRoute, replyToPost);

export default router;
