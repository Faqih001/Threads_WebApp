import Post from "../models/postModel.js";
import User from "../models/userModel.js";
import { v2 as cloudinary } from "cloudinary";

// Create a new post API endpoint (create a new post) 
const createPost = async (req, res) => {
	// Try to create a new post with the postedBy, text, and img from the request body
	try {
		// Get the postedBy, text, and img from the request body
		const { postedBy, text } = req.body;
		let { img } = req.body;

		// If the postedBy or text doesn't exist, return an error response
		if (!postedBy || !text) {
			return res.status(400).json({ error: "Postedby and text fields are required" });
		}

		// Find the user that has the postedBy id from the request body
		const user = await User.findById(postedBy);

		// If the user doesn't exist, return an error response
		if (!user) {
			return res.status(404).json({ error: "User not found" });
		}

		// If the user id from the user object doesn't match the user id from the request user object, return an error response
		if (user._id.toString() !== req.user._id.toString()) {
			return res.status(401).json({ error: "Unauthorized to create post" });
		}

		// If the text length is greater than 500 characters, return an error response
		const maxLength = 500;
		if (text.length > maxLength) {
			return res.status(400).json({ error: `Text must be less than ${maxLength} characters` });
		}

		// If the img exists, upload the img to Cloudinary and get the img URL
		if (img) {
			const uploadedResponse = await cloudinary.uploader.upload(img);
			img = uploadedResponse.secure_url;
		}

		// Create a new post with the postedBy, text, and img
		const newPost = new Post({ postedBy, text, img });

		// Save the new post
		await newPost.save();

		res.status(201).json(newPost);
	} catch (err) {
		res.status(500).json({ error: err.message });
		console.log(err);
	}
};

// Get a post API endpoint (get a post by id)
const getPost = async (req, res) => {
	// Try to get a post by id from the request params
	try {
		// Find the post by id from the request params
		const post = await Post.findById(req.params.id);

		// If the post doesn't exist, return an error response
		if (!post) {
			return res.status(404).json({ error: "Post not found" });
		}

		// Return the post if it exists
		res.status(200).json(post);
	} catch (err) {
		res.status(500).json({ error: err.message });
	}
};

// Delete a post API endpoint (delete a post by id)
const deletePost = async (req, res) => {
	// Try to delete a post by id from the request params
	try {
		// Find the post by id from the request params
		const post = await Post.findById(req.params.id);
		if (!post) {
			return res.status(404).json({ error: "Post not found" });
		}

		// If the postedBy id from the post object doesn't match the user id from the request user object, return an error response
		if (post.postedBy.toString() !== req.user._id.toString()) {
			return res.status(401).json({ error: "Unauthorized to delete post" });
		}

		// If the img exists, destroy the img from Cloudinary 
		if (post.img) {
			const imgId = post.img.split("/").pop().split(".")[0];
			await cloudinary.uploader.destroy(imgId);
		}

		// Delete the post by id from the request params
		await Post.findByIdAndDelete(req.params.id);

		// Return a success response if the post is deleted successfully
		res.status(200).json({ message: "Post deleted successfully" });
	} catch (err) {
		res.status(500).json({ error: err.message });
	}
};

// Like or unlike a post API endpoint (like or unlike a post by id)
const likeUnlikePost = async (req, res) => {
	// Try to like or unlike a post by id from the request params
	try {
		// Get the post id from the request params and the user id from the request user object
		const { id: postId } = req.params;
		const userId = req.user._id;

		// Find the post by id from the request params and check if the user id from the request user object is in the likes array
		const post = await Post.findById(postId);

		// If the post doesn't exist, return an error response
		if (!post) {
			return res.status(404).json({ error: "Post not found" });
		}

		// Check if the user id from the request user object is in the likes array
		const userLikedPost = post.likes.includes(userId);
 
		// If the user id from the request user object is in the likes array, unlike the post
		if (userLikedPost) {
			// Unlike post
			await Post.updateOne({ _id: postId }, { $pull: { likes: userId } });
			res.status(200).json({ message: "Post unliked successfully" });
		} else {
			// Like post
			post.likes.push(userId);
			await post.save();
			res.status(200).json({ message: "Post liked successfully" });
		}
	} catch (err) {
		res.status(500).json({ error: err.message });
	}
};

// Reply to a post API endpoint (reply to a post by id) 
const replyToPost = async (req, res) => {
	// Try to reply to a post by id from the request params
	try {
		// Get the text, post id, user id, user profile pic, and username from the request body
		const { text } = req.body;
		const postId = req.params.id;
		const userId = req.user._id;
		const userProfilePic = req.user.profilePic;
		const username = req.user.username;

		// If the text doesn't exist, return an error response
		if (!text) {
			return res.status(400).json({ error: "Text field is required" });
		}

		// Find the post by id from the request params
		const post = await Post.findById(postId);
		if (!post) {
			return res.status(404).json({ error: "Post not found" });
		}

		// Create a new reply with the user id, text, user profile pic, and username
		const reply = { userId, text, userProfilePic, username };

		// Add the reply to the replies array in the post
		post.replies.push(reply);
		await post.save();

		// Return the reply
		res.status(200).json(reply);
	} catch (err) {
		res.status(500).json({ error: err.message });
	}
};

// Get feed posts API endpoint (get all posts from users that the current user is following)
const getFeedPosts = async (req, res) => {
	// Try to get all posts from users that the current user is following
	try {
		// Get the user id from the request user object
		const userId = req.user._id;
		const user = await User.findById(userId);
		
		// If the user doesn't exist, return an error response
		if (!user) {
			return res.status(404).json({ error: "User not found" });
		}

		// Get the following array from the user object
		const following = user.following;

		// Find all posts from users in the following array and sort by createdAt
		const feedPosts = await Post.find({ postedBy: { $in: following } }).sort({ createdAt: -1 });

		// Return the feed posts
		res.status(200).json(feedPosts);
	} catch (err) {
		res.status(500).json({ error: err.message });
	}
};

// Get user posts API endpoint (get all posts from a user by username)
const getUserPosts = async (req, res) => {
	// User username from the request params
	const { username } = req.params;

	// Try to get all posts from a user by username
	try {
		// Find the user by username
		const user = await User.findOne({ username });

		// If the user doesn't exist, return an error response
		if (!user) {
			return res.status(404).json({ error: "User not found" });
		}

		// Find all posts from the user and sort by createdAt
		const posts = await Post.find({ postedBy: user._id }).sort({ createdAt: -1 });

		// Return the posts
		res.status(200).json(posts);
	} catch (error) {
		res.status(500).json({ error: error.message });
	}
};

export { createPost, getPost, deletePost, likeUnlikePost, replyToPost, getFeedPosts, getUserPosts };
