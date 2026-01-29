import express from "express";
import dotenv from "dotenv";
import connectDB from "./config/db.js";
import userRoute from "./routes/user.route.js";
import attendanceRoute from "./routes/attendance.route.js";
import productRoute from "./routes/produt.route.js"
dotenv.config();

const app = express();

app.use(express.json());

// api endpoints
app.use("/api", userRoute);
app.use("/api", attendanceRoute);
app.use("/api", productRoute);

connectDB();
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log("Server is running on PORT", PORT);
})