import { Server } from "socket.io";
import http from "http";
import express from "express";
import Message from "../models/messageModel.js";
import Conversation from "../models/conversationModel.js";

// Create a new Express app and HTTP server
const app = express();

// Create a new HTTP server with the Express app
const server = http.createServer(app);

// Create a new Socket.IO server with the HTTP server
const io = new Server(server, {
	cors: {
		origin: "http://localhost:3000",
		methods: ["GET", "POST"],
	},
});

// Get the recipient socket id from the user id
export const getRecipientSocketId = (recipientId) => {
	return userSocketMap[recipientId];
};

// Create a new object to store the user socket map
const userSocketMap = {}; // userId: socketId

// Listen for new connections
io.on("connection", (socket) => {
	// Get the user id from the query parameters of the socket connection
	console.log("user connected", socket.id);
	const userId = socket.handshake.query.userId;

	// If the user id is not undefined, add the user id and socket id to the user socket map
	if (userId != "undefined") userSocketMap[userId] = socket.id;
	io.emit("getOnlineUsers", Object.keys(userSocketMap));

	// Listen for new messages and emit the message to the recipient
	socket.on("markMessagesAsSeen", async ({ conversationId, userId }) => {
		// Try to update the messages as seen and emit the messagesSeen event to the recipient
		try {
			await Message.updateMany({ conversationId: conversationId, seen: false }, { $set: { seen: true } });
			await Conversation.updateOne({ _id: conversationId }, { $set: { "lastMessage.seen": true } });
			io.to(userSocketMap[userId]).emit("messagesSeen", { conversationId });
		} catch (error) {
			console.log(error);
		}
	});

	socket.on("disconnect", () => {
		console.log("user disconnected");
		delete userSocketMap[userId];
		io.emit("getOnlineUsers", Object.keys(userSocketMap));
	});
});

export { io, server, app };
