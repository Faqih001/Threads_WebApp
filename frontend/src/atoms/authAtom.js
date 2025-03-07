import { atom } from "recoil";

// This atom is used to store the current screen of the auth page
const authScreenAtom = atom({
	key: "authScreenAtom",
	default: "login",
});

export default authScreenAtom;
