import express from "express";
import { AdminOnly } from "../middlewares/auth.js";
import { allOrders, deleteOrder, getSingleOrder, myOrders, newOrder, processOrder } from "../controllers/order.js";



const app=express.Router();

app.post("/new",newOrder);

app.get("/my",myOrders);

app.get("/all",AdminOnly,allOrders);

app.route("/:id").get(getSingleOrder).put(AdminOnly,processOrder).delete(AdminOnly,deleteOrder);


export default app;