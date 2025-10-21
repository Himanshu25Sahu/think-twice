import { app } from "./app.js";
import dotenv from 'dotenv'
import { connectDB } from "./database/connection.js";
dotenv.config();


const PORT=process.env.PORT

app.listen(PORT,async()=>{
    console.log(`Server running on port ${PORT}`);
    try {
        console.log("connecting to mongodb!");
        await connectDB();
        console.log("✅ MongoDB connected");
    } catch (err) {
        console.error("❌ MongoDB connection failed:", err.message);
    }
})

