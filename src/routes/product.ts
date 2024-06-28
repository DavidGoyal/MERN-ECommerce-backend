import express from "express";
import { AdminOnly } from "../middlewares/auth.js";
import { singleUpload } from "../middlewares/multer.js";
import { deleteProduct, getAllAdminProducts, getAllCategories, getAllProducts, getLatestProducts, getSingleProduct, newProduct, updateProduct } from "../controllers/product.js";



const app=express.Router();


app.post("/new",AdminOnly,singleUpload,newProduct);
app.get("/latest",getLatestProducts);
app.get("/categories",getAllCategories);
app.get("/all",getAllProducts);


app.get("/admin-products",AdminOnly,getAllAdminProducts);

app.route("/:id").get(getSingleProduct).put(AdminOnly,singleUpload,updateProduct).delete(AdminOnly,deleteProduct);

export default app;