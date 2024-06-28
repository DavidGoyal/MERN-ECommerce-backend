import express from "express"
import dotenv from "dotenv"
import morgan from "morgan";
import { connectDB } from "./utils/features.js";
import { errorMiddleware } from "./middlewares/error.js";
import NodeCache from "node-cache";
import Stripe from "stripe";
import cors from "cors"


import userRoutes from "./routes/user.js"
import productRoutes from "./routes/product.js"
import orderRoutes from "./routes/order.js"
import paymentRoutes from "./routes/payment.js"
import dashboardRoutes from "./routes/stats.js"


dotenv.config({
    path:".env"
});

const port=process.env.PORT || 3000;
const stripeKey=process.env.STRIPE_KEY || "";

connectDB();

export const stripe=new Stripe(stripeKey);
export const myCache=new NodeCache();

const app=express();

app.use(express.json());
app.use(morgan("dev"));
app.use(cors({
    origin:["http://localhost:5173","http://localhost:5174",process.env.FRONTEND_URL as string],
}));


app.use("/api/v1/user",userRoutes);
app.use("/api/v1/product",productRoutes);
app.use("/api/v1/order", orderRoutes);
app.use("/api/v1/payment", paymentRoutes);
app.use("/api/v1/dashboard", dashboardRoutes);

app.use("/uploads",express.static("uploads"));
app.use(errorMiddleware);


app.listen(3000,()=>{
    console.log(`Server is running on http://localhost:${port}`);
});