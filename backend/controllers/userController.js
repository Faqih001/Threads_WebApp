import User from "../models/userModel.js";
import Post from "../models/postModel.js";
import bcrypt from "bcryptjs";
import generateTokenAndSetCookie from "../utils/helpers/generateTokenAndSetCookie.js";
import { v2 as cloudinary } from "cloudinary";
import mongoose from "mongoose";

// Get user profile by username or userId (public route)
const getUserProfile = async (req, res) => {
	// We will fetch user profile either with username or userId
	// query is either username or userId
	const { query } = req.params;

	// Try to find user by userId or username and exclude password and updatedAt fields
	try {
		let user;

		// query is userId
		if (mongoose.Types.ObjectId.isValid(query)) {
			user = await User.findOne({ _id: query }).select("-password").select("-updatedAt");
		} else {
			// query is username
			user = await User.findOne({ username: query }).select("-password").select("-updatedAt");
		}

		// If user not found, return error
		if (!user) return res.status(404).json({ error: "User not found" });

		// If user found, return user profile
		res.status(200).json(user);
	} catch (err) {
		res.status(500).json({ error: err.message });
		console.log("Error in getUserProfile: ", err.message);
	}
};

// Sign up user (public route) - create new user in database
const signupUser = async (req, res) => {
	// Try to find user by email or username
	try {
		// Destructure name, email, username, password from request body
		const { name, email, username, password } = req.body;

		// UFind user by email or username in database
		const user = await User.findOne({ $or: [{ email }, { username }] });

		// If user already exists, return error
		if (user) {
			return res.status(400).json({ error: "User already exists" });
		}

		//  Hash password and create new user in database with hashed password
		const salt = await bcrypt.genSalt(10);
		const hashedPassword = await bcrypt.hash(password, salt);

		// Create new user in database with hashed password
		const newUser = new User({
			name,
			email,
			username,
			password: hashedPassword,
		});
		await newUser.save();

		// If user created successfully, generate token and set cookie and return user profile
		if (newUser) {
			// Generate token and set cookie
			generateTokenAndSetCookie(newUser._id, res);

			// Return user profile
			res.status(201).json({
				_id: newUser._id,
				name: newUser.name,
				email: newUser.email,
				username: newUser.username,
				bio: newUser.bio,
				profilePic: newUser.profilePic,
			});
		} else {
			res.status(400).json({ error: "Invalid user data" });
		}
	} catch (err) {
		res.status(500).json({ error: err.message });
		console.log("Error in signupUser: ", err.message);
	}
};

// Login user (public route) - find user by username and compare password
const loginUser = async (req, res) => {
	// Try to find user by username and compare password
	try {
		// Destructure username and password from request body
		const { username, password } = req.body;

		// Find user by username in database
		const user = await User.findOne({ username });

		// isPasswordCorrect is true if password is correct
		const isPasswordCorrect = await bcrypt.compare(password, user?.password || "");

		// If user not found or password is incorrect, return error
		if (!user || !isPasswordCorrect) return res.status(400).json({ error: "Invalid username or password" });

		// If user is frozen, unfreeze the account
		if (user.isFrozen) {
			user.isFrozen = false;
			await user.save();
		}

		// If user found and password is correct, generate token and set cookie and return user profile
		generateTokenAndSetCookie(user._id, res);

		// Return user profile
		res.status(200).json({
			_id: user._id,
			name: user.name,
			email: user.email,
			username: user.username,
			bio: user.bio,
			profilePic: user.profilePic,
		});
	} catch (error) {
		res.status(500).json({ error: error.message });
		console.log("Error in loginUser: ", error.message);
	}
};

// Logout user (protected route) - clear cookie with jwt token
const logoutUser = (req, res) => {
	// try to clear cookie with jwt token
	try {
		// Clear cookie with jwt token and return success message
		res.cookie("jwt", "", { maxAge: 1 });
		res.status(200).json({ message: "User logged out successfully" });
	} catch (err) {
		// If error, return error message
		res.status(500).json({ error: err.message });
		console.log("Error in signupUser: ", err.message);
	}
};

// Follow or unfollow user (protected route) - follow or unfollow user by id
const followUnFollowUser = async (req, res) => {
	// Try to follow or unfollow user by id
	try {
		// Id is user id to follow or unfollow
		const { id } = req.params;

		// Find user to follow or unfollow and current user
		const userToModify = await User.findById(id);
		const currentUser = await User.findById(req.user._id);

		// If user to follow or unfollow or current user not found, return error
		if (id === req.user._id.toString())
			return res.status(400).json({ error: "You cannot follow/unfollow yourself" });

		// If user is not found, return error message "User not found"
		if (!userToModify || !currentUser) return res.status(400).json({ error: "User not found" });

		// If user is already following, unfollow user
		const isFollowing = currentUser.following.includes(id);

		// If user is following, unfollow user, else follow user
		if (isFollowing) {
			// Unfollow user
			await User.findByIdAndUpdate(id, { $pull: { followers: req.user._id } });
			await User.findByIdAndUpdate(req.user._id, { $pull: { following: id } });
			res.status(200).json({ message: "User unfollowed successfully" });
		} else {
			// Follow user
			await User.findByIdAndUpdate(id, { $push: { followers: req.user._id } });
			await User.findByIdAndUpdate(req.user._id, { $push: { following: id } });
			res.status(200).json({ message: "User followed successfully" });
		}
	} catch (err) {
		res.status(500).json({ error: err.message });
		console.log("Error in followUnFollowUser: ", err.message);
	}
};

// Update user profile (protected route) - update user profile by id
const updateUser = async (req, res) => {
	// Name, email, username, password, bio, profilePic from request body
	const { name, email, username, password, bio } = req.body;

	// Profile pic from request body
	let { profilePic } = req.body;

	// User id from request params
	const userId = req.user._id;

	// Try to update user profile by id
	try {
		// Find user by id in database
		let user = await User.findById(userId);

		// If user not found, return error message "User not found"
		if (!user) return res.status(400).json({ error: "User not found" });

		// If user id in request params is not equal to user id in database, return error message "You cannot update other user's profile"
		if (req.params.id !== userId.toString())
			return res.status(400).json({ error: "You cannot update other user's profile" });

		// If password is provided, hash password and update user password
		if (password) {
			const salt = await bcrypt.genSalt(10);
			const hashedPassword = await bcrypt.hash(password, salt);
			user.password = hashedPassword;
		}

		// If profile pic is provided, upload profile pic to cloudinary and update user profile pic
		if (profilePic) {
			if (user.profilePic) {
				await cloudinary.uploader.destroy(user.profilePic.split("/").pop().split(".")[0]);
			}

			// Upload profile pic to cloudinary and get secure url
			const uploadedResponse = await cloudinary.uploader.upload(profilePic);
			profilePic = uploadedResponse.secure_url;
		}

		// Update user name, email, username, profilePic, bio
		user.name = name || user.name;
		user.email = email || user.email;
		user.username = username || user.username;
		user.profilePic = profilePic || user.profilePic;
		user.bio = bio || user.bio;

		// Save user in database
		user = await user.save();

		// Find all posts that this user replied and update username and userProfilePic fields
		await Post.updateMany(
			{ "replies.userId": userId },
			{
				$set: {
					"replies.$[reply].username": user.username,
					"replies.$[reply].userProfilePic": user.profilePic,
				},
			},
			{ arrayFilters: [{ "reply.userId": userId }] }
		);

		// password should be null in response
		user.password = null;

		res.status(200).json(user);
	} catch (err) {
		res.status(500).json({ error: err.message });
		console.log("Error in updateUser: ", err.message);
	}
};

// Get suggested users (protected route) - get suggested users for current user
const getSuggestedUsers = async (req, res) => {
	try {
		// exclude the current user from suggested users array and exclude users that current user is already following
		const userId = req.user._id;

		// Find users followed by current user
		const usersFollowedByYou = await User.findById(userId).select("following");

		// Find 10 random users and exclude current user and users followed by current user
		const users = await User.aggregate([
			{
				$match: {
					_id: { $ne: userId },
				},
			},
			{
				$sample: { size: 10 },
			},
		]);

		// Filter users that current user is already following
		const filteredUsers = users.filter((user) => !usersFollowedByYou.following.includes(user._id));

		// Return first 4 users as suggested users
		const suggestedUsers = filteredUsers.slice(0, 4);

		// Suggested users password should be null in response object array
		suggestedUsers.forEach((user) => (user.password = null));

		// Return suggested users in response object array
		res.status(200).json(suggestedUsers);
	} catch (error) {
		res.status(500).json({ error: error.message });
	}
};

// Freeze account (protected route) - freeze account of current user by setting isFrozen to true
const freezeAccount = async (req, res) => {
	// Try to freeze account of current user
	try {
		// Find user by id in database and set isFrozen to true
		const user = await User.findById(req.user._id);

		// If user not found, return error message "User not found"
		if (!user) {
			return res.status(400).json({ error: "User not found" });
		}

		user.isFrozen = true;
		await user.save();

		res.status(200).json({ success: true });
	} catch (error) {
		res.status(500).json({ error: error.message });
	}
};

export {
	signupUser,
	loginUser,
	logoutUser,
	followUnFollowUser,
	updateUser,
	getUserProfile,
	getSuggestedUsers,
	freezeAccount,
};
