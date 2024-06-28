import { NextFunction, Request, Response } from "express";
import { TryCatch } from "../middlewares/error.js";
import ErrorHandler from "../utils/utility.js";
import { BaseQueryType, NewProductRequestBody, SearchRequestQuery } from "../types/types.js";
import { Product } from "../models/product.js";
import { rm } from "fs";
import { myCache } from "../app.js";
import { InvalidateCache } from "../utils/features.js";



export const newProduct=TryCatch(async(req:Request<{},{},NewProductRequestBody>,res:Response,next:NextFunction)=>{
    const {name,price,category,stock,}=req.body;
    const photo=req.file;

    if(!photo){
        return next(new ErrorHandler(400, "Please provide a photo"));
    }

    if(!name || !price || !stock || !category){
        rm(photo.path,()=>{console.log("Deleted");})
        return next(new ErrorHandler(400,"Please provide all fields"));
    }

    await Product.create({
        name,
        price,
        category:category.toLowerCase(),
        stock,
        photo:photo.path
    })

    InvalidateCache({product:true,admin:true});

    return res.status(201).json({
        success:true,
        message:"Product created successfully"
    })
})


export const getLatestProducts=TryCatch(async(req:Request, res:Response, next:NextFunction)=>{
    let products=[];

    if(myCache.has("latest-products")){
        products=JSON.parse(myCache.get("latest-products")!);
    }
    else{
        products=await Product.find().sort({createdAt:-1}).limit(5);
        myCache.set("latest-products",JSON.stringify(products));
    }

    return res.status(200).json({
        success:true,
        products
    })
})



export const getAllCategories=TryCatch(async(req:Request, res:Response, next:NextFunction)=>{
    let categories=[];

    if(myCache.has("categories")){
        categories=JSON.parse(myCache.get("categories")!);
    }
    else{
        categories=await Product.distinct("category");
        myCache.set("categories", JSON.stringify(categories));
    }

    return res.status(200).json({
        success:true,
        categories
    })
})


export const getAllAdminProducts=TryCatch(async(req:Request, res:Response, next:NextFunction)=>{
    let products=[];

    if(myCache.has("admin-products")){
        products=JSON.parse(myCache.get("admin-products")!);
    }
    else{
        products=await Product.find();
        myCache.set("admin-products", JSON.stringify(products));
    }

    return res.status(200).json({
        success:true,
        products
    })
})


export const getSingleProduct=TryCatch(async(req:Request, res:Response, next:NextFunction)=>{
    let product;

    if(myCache.has(`product-${req.params.id}`)){
        product=JSON.parse(myCache.get(`product-${req.params.id}`)!);
    }
    else{
        product=await Product.findById(req.params.id);
        if(!product){
            return next(new ErrorHandler(404, "Product not found"));
        }
        myCache.set(`product-${req.params.id}`, JSON.stringify(product));
    }

    return res.status(200).json({
        success:true,
        product
    })
})



export const updateProduct=TryCatch(async(req:Request,res:Response,next:NextFunction)=>{
    const id=req.params.id;

    const {name,price,category,stock}=req.body;
    const photo=req.file;

    const product=await Product.findById(id);

    if(!product){
        return next(new ErrorHandler(404, "Product not found"));
    }

    if(photo){
        rm(product.photo, ()=>{console.log("Old Photo Deleted");})
        product.photo=photo.path;
    }

    if(name){
        product.name=name;
    }

    if(price){
        product.price=price;
    }

    if(stock){
        product.stock=stock;
    }

    if(category){
        product.category=category.toLowerCase();
    }

    await product.save();

    InvalidateCache({product:true,productId:String(product._id),admin:true});

    return res.status(200).json({
        success:true,
        message:"Product updated successfully"
    })
})


export const deleteProduct=TryCatch(async(req:Request, res:Response, next:NextFunction)=>{
    const product=await Product.findById(req.params.id);

    if(!product){
        return next(new ErrorHandler(404, "Product not found"));
    }

    rm(product.photo, ()=>{console.log("Photo Deleted");})
    await product.deleteOne();

    InvalidateCache({product:true,productId:String(product._id),admin:true});

    return res.status(200).json({
        success:true,
        message:"Product deleted successfully"
    })
})



export const getAllProducts=TryCatch(async(req:Request<{},{},{},SearchRequestQuery>,res:Response,next:NextFunction)=>{
    const {search,sort,price,category}=req.query;

    const page=Number(req.query.page) || 1;
    const limit=Number(process.env.PRODUCT_PER_PAGE) || 8;
    const skip=(page-1)*limit;

    const baseQuery:BaseQueryType={};

    if(search){
        baseQuery.name={
            $regex:search,$options:"i"
        }
    }

    if(price){
        baseQuery.price={
            $lte:Number(price)
        }
    }

    if(category){
        baseQuery.category=category;
    }

    const [products,filteredOnlyProducts]=await Promise.all([
        Product.find(baseQuery)
        .sort(sort && {price:sort==="asc"?1:-1})
        .skip(skip)
        .limit(limit),
        Product.find(baseQuery)
    ])

    const totalPage=Math.ceil(filteredOnlyProducts.length/limit);

    return res.status(200).json({
        success:true,
        products,
        totalPage
    })
})