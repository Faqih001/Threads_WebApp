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

		if (!conversation) {
			conversation = new Conversation({
				participants: [senderId, recipientId],
				lastMessage: {
					text: message,
					sender: senderId,
				},
			});
			await conversation.save();
		}

		if (img) {
			const uploadedResponse = await cloudinary.uploader.upload(img);
			img = uploadedResponse.secure_url;
		}

		const newMessage = new Message({
			conversationId: conversation._id,
			sender: senderId,
			text: message,
			img: img || "",
		});

		await Promise.all([
			newMessage.save(),
			conversation.updateOne({
				lastMessage: {
					text: message,
					sender: senderId,
				},
			}),
		]);

		const recipientSocketId = getRecipientSocketId(recipientId);
		if (recipientSocketId) {
			io.to(recipientSocketId).emit("newMessage", newMessage);
		}

		res.status(201).json(newMessage);
	} catch (error) {
		res.status(500).json({ error: error.message });
	}
}

async function getMessages(req, res) {
	const { otherUserId } = req.params;
	const userId = req.user._id;
	try {
		const conversation = await Conversation.findOne({
			participants: { $all: [userId, otherUserId] },
		});

		if (!conversation) {
			return res.status(404).json({ error: "Conversation not found" });
		}

		const messages = await Message.find({
			conversationId: conversation._id,
		}).sort({ createdAt: 1 });

		res.status(200).json(messages);
	} catch (error) {
		res.status(500).json({ error: error.message });
	}
}

async function getConversations(req, res) {
	const userId = req.user._id;
	try {
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
