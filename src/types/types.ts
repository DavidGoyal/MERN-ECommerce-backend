import { NextFunction, Request, Response } from "express";

export interface NewUserRequestBody{
    _id:string;
    photo:string;
    name:string;
    email:string;
    gender:"male"|"female";
    dob:Date;
}


export interface NewProductRequestBody{
    name:string;
    stock:number,
    price:number,
    category:string
}


export type ControllerType=(req: Request, res: Response, next: NextFunction) => Promise<void | Response<any, Record<string, any>>>


export type SearchRequestQuery={
    search?:string,
    price?:string,
    category?:string,
    sort?:string,
    page?:string,
}

export interface BaseQueryType{
    name?:{
        $regex:string,
        $options:"i"
    },
    category?:string,
    price?:{
        $lte:number
    }
}


export type InvalidateCacheProps={
    product?:boolean,
    order?:boolean,
    admin?:boolean,
    userId?:string,
    orderId?:string,
    productId?:string | string[],
}

export type ShippingInfoType={
    address:string,
    city:string,
    state:string,
    country:string,
    pinCode:number
}

export type OrderItemsType={
    name:string,
    price:number,
    quantity:number,
    photo:string,
    productId:string
}

export interface NewOrderRequestBody{
    shippingInfo:ShippingInfoType,
    orderItems:OrderItemsType[],
    user:string,
    subTotal:number,
    tax:number,
    shippingCharges:number,
    discount:number,
    total:number
}