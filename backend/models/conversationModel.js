import mongoose from "mongoose";

// Conversation Schema to store the participants of the conversation and the last message sent in the conversation
const conversationSchema = new mongoose.Schema(
	{
		participants: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
		lastMessage: {
			text: String,
			sender: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
			seen: {
				type: Boolean,
				default: false,
			},
		},
	},
	{ timestamps: true }
);

const Conversation = mongoose.model("Conversation", conversationSchema);

export default Conversation;
