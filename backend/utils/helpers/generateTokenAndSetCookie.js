import jwt from "jsonwebtoken";

// Generate JWT token and set it in a cookie for the user
const generateTokenAndSetCookie = (userId, res) => {
	// Generate a JWT token with the user id and the JWT secret
	const token = jwt.sign({ userId }, process.env.JWT_SECRET, {
		expiresIn: "15d",
	});

	// Set the JWT token in a cookie with the HttpOnly flag, max age, and same site attribute
	res.cookie("jwt", token, {
		httpOnly: true, // more secure
		maxAge: 15 * 24 * 60 * 60 * 1000, // 15 days
		sameSite: "strict", // CSRF
	});

	// Return the JWT token
	return token;
};

export default generateTokenAndSetCookie;
