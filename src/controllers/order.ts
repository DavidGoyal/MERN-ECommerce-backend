import { NextFunction, Request, Response } from "express";
import { myCache } from "../app.js";
import { TryCatch } from "../middlewares/error.js";
import { Order } from "../models/order.js";
import { NewOrderRequestBody } from "../types/types.js";
import { InvalidateCache, reduceStock } from "../utils/features.js";
import ErrorHandler from "../utils/utility.js";


export const newOrder=TryCatch(async(req:Request<{},{},NewOrderRequestBody>,res:Response,next:NextFunction)=>{
    const {shippingInfo,orderItems,user,subTotal,tax,shippingCharges,discount,total}=req.body;

    if(!shippingInfo||!orderItems||!user||!subTotal||!tax||!total){
        return next(new ErrorHandler(400,"Please Fill All Fields"));
    }


    const order=await Order.create({
        shippingInfo,
        orderItems,
        user,
        subTotal,
        tax,
        shippingCharges,
        discount,
        total
    })

    await reduceStock(orderItems);

    InvalidateCache({product:true,order:true,admin:true,userId:user,productId:order.orderItems.map((i)=>String(i.productId))})

    return res.status(201).json({
        success:true,
        message:"Order Placed Successfully"
    })
});



export const myOrders=TryCatch(async(req:Request, res:Response, next:NextFunction)=>{
    const {id}=req.query;

    let orders=[];

    if(myCache.has(`my-orders-${id}`)){
        orders=JSON.parse(myCache.get(`my-orders-${id}`) as string);
    }
    else{
        orders=await Order.find({user:id});
        myCache.set(`my-orders-${id}`, JSON.stringify(orders));
    }

    return res.status(200).json({
        success:true,
        orders
    })
});



export const allOrders=TryCatch(async(req:Request, res:Response, next:NextFunction)=>{
    let orders=[];

    if(myCache.has(`all-orders`)){
        orders=JSON.parse(myCache.get(`all-orders`) as string);
    }
    else{
        orders=await Order.find().populate("user","name");
        myCache.set(`all-orders`, JSON.stringify(orders));
    }

    return res.status(200).json({
        success:true,
        orders
    })
});



export const getSingleOrder=TryCatch(async(req:Request, res:Response, next:NextFunction)=>{
    const id=req.params.id;
    let order;

    if(myCache.has(`single-order-${id}`)){
        order=JSON.parse(myCache.get(`single-order-${id}`) as string);
    }
    else{
        order=await Order.findById(id).populate("user","name");
        if(!order){
            return next(new ErrorHandler(404, "Order not found"));
        }
        myCache.set(`single-order-${id}`, JSON.stringify(order));
    }

    return res.status(200).json({
        success:true,
        order
    })
});



export const processOrder=TryCatch(async(req:Request, res:Response, next:NextFunction)=>{
    const id=req.params.id;
    
    const order=await Order.findById(id);

    if(!order){
        return next(new ErrorHandler(404,"Order not found"));
    }

    if(order.status==="Delivered"){
        return next(new ErrorHandler(404,"Order already delivered"));
    }
    else if(order.status==="Processing"){
        order.status="Shipped";
    }
    else if(order.status==="Shipped"){
        order.status="Delivered";
    }

    await order.save();

    InvalidateCache({product:false,order:true,admin:true,userId:order.user,orderId:String(order._id)})

    return res.status(200).json({
        success:true,
        message:"Order Status Updated Successfully"
    })
});



export const deleteOrder=TryCatch(async(req:Request, res:Response, next:NextFunction)=>{
    const id=req.params.id;
    
    const order=await Order.findById(id);

    if(!order){
        return next(new ErrorHandler(404,"Order not found"));
    }

    await order.deleteOne();

    InvalidateCache({product:false,order:true,admin:true,userId:order.user,orderId:String(order._id)})

    return res.status(200).json({
        success:true,
        message:"Order Deleted Successfully"
    })
});