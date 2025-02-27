import Conversation from "../models/conversationModel.js";
import Message from "../models/messageModel.js";
import { getRecipientSocketId, io } from "../socket/socket.js";
import { v2 as cloudinary } from "cloudinary";
import Actions from '../../frontend/src/components/Actions';

// Send Message to a user or group of users API endpoint (create a new conversation if it doesn't exist)
async function sendMessage(req, res) {
	// Try to send a message to a user or group of users and create a new conversation if it doesn't exist
	try {
		// Get the recipientId, message, and img from the request body
		const { recipientId, message } = req.body;

		// Get the img from the request user object
		let { img } = req.body;

		// Get the senderId from the request user object
		const senderId = req.user._id;

		// Find a conversation that has the senderId and recipientId in the participants array
		let conversation = await Conversation.findOne({
			participants: { $all: [senderId, recipientId] },
		});

		// If the conversation doesn't exist, create a new conversation with the senderId and recipientId
		if (!conversation) {
			// Create a new conversation
			conversation = new Conversation({
				participants: [senderId, recipientId],
				lastMessage: {
					text: message,
					sender: senderId,
				},
			});
			await conversation.save();
		}

		// If the img exists, upload the img to Cloudinary and get the img URL
		if (img) {
			// Upload the img to Cloudinary
			const uploadedResponse = await cloudinary.uploader.upload(img);

			// Get the img URL from the uploadedResponse
			img = uploadedResponse.secure_url;
		}

		// Create a new message with the conversationId, senderId, message, and img
		const newMessage = new Message({
			conversationId: conversation._id,
			sender: senderId,
			text: message,
			img: img || "",
		});

		// Save the new message and update the lastMessage in the conversation
		await Promise.all([
			newMessage.save(),
			conversation.updateOne({
				lastMessage: {
					text: message,
					sender: senderId,
				},
			}),
		]);

		// Emit a newMessage event to the recipientSocketId
		const recipientSocketId = getRecipientSocketId(recipientId);

		// If the recipientSocketId exists, emit a newMessage event to the recipientSocketId
		if (recipientSocketId) {
			io.to(recipientSocketId).emit("newMessage", newMessage);
		}

		// Return the new message
		res.status(201).json(newMessage);
	} catch (error) {
		res.status(500).json({ error: error.message });
	}
}

// Get Messages API endpoint (get all messages in a conversation) by conversationId API endpoint
async function getMessages(req, res) {
	// Other user id from the request params and user id from the request user object
	const { otherUserId } = req.params;
	const userId = req.user._id;

	// Try to get all messages in a conversation by conversationId and sort by createdAt
	try {
		// Conversation that has the userId and otherUserId in the participants array
		const conversation = await Conversation.findOne({
			participants: { $all: [userId, otherUserId] },
		});

		// If the conversation doesn't exist, return a 404 error
		if (!conversation) {
			return res.status(404).json({ error: "Conversation not found" });
		}

		// Messages in the conversation sorted by createdAt
		const messages = await Message.find({
			conversationId: conversation._id,
		}).sort({ createdAt: 1 });

		// Return the messages in the conversation
		res.status(200).json(messages);
	} catch (error) {
		res.status(500).json({ error: error.message });
	}
}

// Get Conversations API endpoint (get all conversations of a user) by userId API endpoint
async function getConversations(req, res) {
	// User id from the request user object
	const userId = req.user._id;

	// Try to get all conversations of a user by userId and populate the participants array
	try {
		// Conversations that have the userId in the participants array
		const conversations = await Conversation.find({ participants: userId }).populate({
			path: "participants",
			select: "username profilePic",
		});

		// remove the current user from the participants array
		conversations.forEach((conversation) => {
			conversation.participants = conversation.participants.filter(
				(participant) => participant._id.toString() !== userId.toString()
			);
		});
		res.status(200).json(conversations);
	} catch (error) {
		res.status(500).json({ error: error.message });
	}
}

export { sendMessage, getMessages, getConversations };
