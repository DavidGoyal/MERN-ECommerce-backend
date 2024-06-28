import mongoose from "mongoose";
import { myCache } from "../app.js";
import { Product } from "../models/product.js";
import { InvalidateCacheProps, OrderItemsType } from "../types/types.js";
import ErrorHandler from "./utility.js";
import { Document } from "mongoose";

export const connectDB=()=>{
    mongoose.connect(process.env.MONGODB_URI as string,{
        dbName:"ECommerce_TS"
    }).then(c=>console.log(`DB connected to ${c.connection.host}`))
    .catch(e=>console.log(e));
}



export const InvalidateCache=({product,order,admin,userId,orderId,productId}:InvalidateCacheProps)=>{
    if(product){
        const productKeys:string[]=["latest-products","categories","admin-products"]

        if(typeof productId==="string") productKeys.push(`product-${productId}`);

        if(typeof productId==="object") productId.forEach((i)=>productKeys.push(`product-${i}`)) 

        myCache.del(productKeys);
    }

    if(order){
        const orderKeys:string[]=["all-orders",`my-orders-${userId}`,`single-order-${orderId}`]

        myCache.del(orderKeys);
    }

    if(admin){
        const adminKeys:string[]=["admin-stats","admin-pie-charts","admin-bar-charts","admin-line-charts"]

        myCache.del(adminKeys);
    }
}


export const reduceStock=async(orderItems:OrderItemsType[])=>{
    orderItems.forEach(async(i)=>{
        const product=await Product.findById(i.productId);
        if(!product) throw new ErrorHandler(404,"Product not found");
        product.stock-=i.quantity;
        await product.save();
    })
}


export const calculatePercentage=(curr:number, prev:number):number=>{
    if(prev===0) return curr*100;
    return Math.round((curr/prev)*100);
}


interface MyDoc extends Document{
    createdAt:Date,
    discount?:number,
    total?:number
}


export const lastNMonthsDataCalculator=({length,docArr,today,property}:{length:number,docArr:MyDoc[],today:Date,property?:"discount"|"total"})=>{
    const data:number[]=new Array(length).fill(0);

    docArr.forEach((doc)=>{
        const creationDate=doc.createdAt;
        const monthDiff=(today.getMonth()-creationDate.getMonth()+12)%12;

        if(monthDiff<length){
            data[length-1-monthDiff]+=property?doc[property]!:1;
        }
    })

    return data;
}