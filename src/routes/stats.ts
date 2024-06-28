import express from "express";
import { AdminOnly } from "../middlewares/auth.js";
import { getBarChartDetails, getDashboardStats, getLineChartDetails, getPieChartDetails } from "../controllers/stats.js";



const app=express.Router();

app.use(AdminOnly);

app.get("/stats",getDashboardStats);

app.get("/pie",getPieChartDetails);

app.get("/bar",getBarChartDetails);

app.get("/line",getLineChartDetails);

export default app;