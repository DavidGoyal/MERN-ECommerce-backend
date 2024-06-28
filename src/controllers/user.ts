import { NextFunction, Request, Response } from "express";
import { User } from "../models/user.js";
import { NewUserRequestBody } from "../types/types.js";
import { TryCatch } from "../middlewares/error.js";
import ErrorHandler from "../utils/utility.js";
import { InvalidateCache } from "../utils/features.js";

export const registerUser=TryCatch(async(req:Request<{},{},NewUserRequestBody>,res:Response,next:NextFunction)=>{
    const {name,email,photo,_id,gender,dob} =req.body;

    let user=await User.findById(_id);

    if(user){
        return res.status(200).json({
            success:true,
            message:`Welcome, ${user.name}`
        })
    }

    if(!_id||!name||!email||!photo||!gender||!dob){
        return next(new ErrorHandler(400,"Please Enter All Fields"));
    }

    user=await User.create({
        _id,name,email,photo,gender,dob:new Date(dob)
    });

    InvalidateCache({admin:true})

    return res.status(201).json({
        success:true,
        message:`Welcome, ${user.name}`
    })
})



export const getAllUsers=TryCatch(async(req:Request, res:Response, next:NextFunction)=>{
    const users=await User.find();

    res.status(200).json({
        success:true,
        users
    })
})


export const getUser=TryCatch(async(req:Request, res:Response, next:NextFunction)=>{
    const id=req.params.id;

    const user=await User.findById(id);

    if(!user){
        return next(new ErrorHandler(404, "User Not Found"));
    }

    res.status(200).json({
        success:true,
        user
    })
})


export const deleteUser=TryCatch(async(req:Request, res:Response, next:NextFunction)=>{
    const id=req.params.id;

    const user=await User.findById(id);

    if(!user){
        return next(new ErrorHandler(404, "User Not Found"));
    }

    await user.deleteOne();

    InvalidateCache({admin:true})

    res.status(200).json({
        success:true,
        message:"User Deleted Successfully"
    })
})