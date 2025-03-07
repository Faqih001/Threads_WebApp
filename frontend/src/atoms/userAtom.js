import { atom } from "recoil";

// This atom stores the user's threads
const userAtom = atom({
	key: "userAtom",
	default: JSON.parse(localStorage.getItem("user-threads")),
});

export default userAtom;
