import mongoose from "mongoose";

// Connect to the database using the MONGO_URI from the .env file
const connectDB = async () => {
	// Try to connect to the database
	try {
		// Connect to the database using the MONGO_URI from the .env file
		const conn = await mongoose.connect(process.env.MONGO_URI, {
			// To avoid warnings in the console
			useNewUrlParser: true,
			useUnifiedTopology: true,
		});

		// Log the connection host in the console
		console.log(`MongoDB Connected: ${conn.connection.host}`);
	} catch (error) {
		console.error(`Error: ${error.message}`);
		process.exit(1);
	}
};

export default connectDB;
