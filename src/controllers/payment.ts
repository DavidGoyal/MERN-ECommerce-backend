import { NextFunction, Request, Response } from "express";
import { TryCatch } from "../middlewares/error.js";
import { Coupon } from "../models/coupon.js";
import ErrorHandler from "../utils/utility.js";
import { stripe } from "../app.js";



export const newCoupon=TryCatch(async(req:Request,res:Response,next:NextFunction)=>{
    const {coupon,amount}=req.body;

    if(!coupon || !amount){
        return next(new ErrorHandler(400,"Please Enter All Fields"));
    }

    await Coupon.create({coupon,amount});

    return res.status(201).json({
        success:true,
        message:`Coupon ${coupon} Created Successfully`
    })
})



export const applyDiscount=TryCatch(async(req:Request, res:Response, next:NextFunction)=>{
    const {coupon}=req.query;

    if(!coupon){
        return next(new ErrorHandler(400, "Please Enter Coupon Code"));
    }

    const validCoupon=await Coupon.findOne({coupon});

    if(!validCoupon){
        return next(new ErrorHandler(400, "Invalid Coupon Code"));
    }

    return res.status(200).json({
        success:true,
        message:`Coupon ${coupon} Applied Successfully`,
        discount:validCoupon.amount
    })
})


export const allCoupons=TryCatch(async(req:Request, res:Response, next:NextFunction)=>{
    const coupons=await Coupon.find();

    return res.status(200).json({
        success:true,
        coupons
    })
})


export const deleteCoupon=TryCatch(async(req:Request, res:Response, next:NextFunction)=>{
    const {id}=req.params;

    const coupon=await Coupon.findById(id);

    if(!coupon){
        return next(new ErrorHandler(400, "Invalid Coupon Id"));
    }

    await coupon.deleteOne();

    return res.status(200).json({
        success:true,
        message:`Coupon ${coupon.coupon} Deleted Successfully`
    })
})



export const createPaymentIntent=TryCatch(async(req:Request, res:Response, next:NextFunction)=>{
    const {amount}=req.body;

    if(!amount){
        return next(new ErrorHandler(400, "Please Enter Amount"));
    }

    const paymentIntent=await stripe.paymentIntents.create({
        amount:Number(amount*100),
        currency:"inr",
    });

    return res.status(200).json({
        success:true,
        client_secret:paymentIntent.client_secret
    })
})