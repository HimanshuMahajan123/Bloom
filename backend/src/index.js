import "dotenv/config";
import app from "./app.js";
import prisma from "./db/prisma.js";
const PORT = process.env.PORT || 3000;
const connectDB = async () => {
  try {
    // Test the database connection
    await prisma.$connect();
    console.log("Database connected successfully");
  } catch (error) {
    console.error("Database connection failed", error);
    throw error; // Rethrow the error to be caught in the main block
  }
};
connectDB()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`Server is running on port http://localhost:${PORT}`);
    });
  })
  .catch((error) => {
    console.error("Failed to connect to the database", error);
    process.exit(1);
  });
