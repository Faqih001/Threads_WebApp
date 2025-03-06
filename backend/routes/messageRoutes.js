import express from "express";
import protectRoute from "../middlewares/protectRoute.js";
import { getMessages, sendMessage, getConversations } from "../controllers/messageController.js";

// Create a new router instance
const router = express.Router();

// Conversation Routes with the userId from the request user object
router.get("/conversations", protectRoute, getConversations);

// Message Routes with the userId from the request user object
router.get("/:otherUserId", protectRoute, getMessages);


router.post("/", protectRoute, sendMessage);

export default router;
