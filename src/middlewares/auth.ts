import { User } from "../models/user.js";
import ErrorHandler from "../utils/utility.js";
import { TryCatch } from "./error.js";

export const AdminOnly=TryCatch(async(req,res,next)=>{
    const {id}=req.query;

    if(!id){
        return next(new ErrorHandler(401, "Only Logged in users can access this service"));
    }

    const user=await User.findById(id);

    if(!user){
        return next(new ErrorHandler(404, "User Not Found"));
    }

    if(user.role!=="admin"){
        return next(new ErrorHandler(403,"You are not allowed to perform this action"));
    }

    next();
})