import express from "express";
import { AdminOnly } from "../middlewares/auth.js";
import { allCoupons, applyDiscount, createPaymentIntent, deleteCoupon, newCoupon } from "../controllers/payment.js";



const app=express.Router();

app.post("/coupon/new",AdminOnly,newCoupon);

app.get("/discount",applyDiscount);

app.get("/coupon/all",AdminOnly,allCoupons);

app.delete("/coupon/:id", AdminOnly, deleteCoupon);

app.post("/create",createPaymentIntent);


export default app;