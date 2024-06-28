import mongoose from "mongoose";


const schema=new mongoose.Schema({
    name:{
        type:String,
        required:[true,"Please Enter Product Name"]
    },
    price:{
        type:Number,
        required:[true,"Please Enter Product Price"]
    },
    stock:{
        type:Number,
        required:[true,"Please Enter Product Stock"]
    },
    photo:{
        type:String,
        required:[true,"Please Add Product Image"]
    },
    category:{
        type:String,
        required:[true,"Please Add Product Category"],
        trim:true
    }
},{timestamps:true})


export const Product=mongoose.model("Product",schema)