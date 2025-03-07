import { atom } from "recoil";

// Atoms are used to store the state of the application
export const conversationsAtom = atom({
	key: "conversationsAtom",
	default: [],
});

export const selectedConversationAtom = atom({
	key: "selectedConversationAtom",
	default: {
		_id: "",
		userId: "",
		username: "",
		userProfilePic: "",
	},
});
