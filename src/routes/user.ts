import express from "express";
import { deleteUser, getAllUsers, getUser, registerUser } from "../controllers/user.js";
import { AdminOnly } from "../middlewares/auth.js";



const app=express.Router();

app.post("/new",registerUser);




app.get("/all",AdminOnly,getAllUsers);
app.route("/:id").get(getUser).delete(AdminOnly,deleteUser);




export default app;