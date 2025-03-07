import { atom } from "recoil";

// Atoms are used to store the state of the application
const postsAtom = atom({
	key: "postsAtom",
	default: [],
});

export default postsAtom;
