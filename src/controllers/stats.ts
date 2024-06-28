import { NextFunction, Request, Response } from "express";
import { TryCatch } from "../middlewares/error.js";
import { Coupon } from "../models/coupon.js";
import ErrorHandler from "../utils/utility.js";
import { myCache } from "../app.js";
import { Product } from "../models/product.js";
import { User } from "../models/user.js";
import { Order } from "../models/order.js";
import { calculatePercentage, lastNMonthsDataCalculator } from "../utils/features.js";



export const getDashboardStats=TryCatch(async(req:Request,res:Response,next:NextFunction)=>{
    let stats;

    if(myCache.has("admin-stats")){
        stats=JSON.parse(myCache.get("admin-stats") as string);
    }
    else{
        const today=new Date();
        const sixMonthsAgo=new Date();
        sixMonthsAgo.setMonth(sixMonthsAgo.getMonth()-6)

        const startOfMonth=new Date(today.getFullYear(), today.getMonth(), 1);

        const startOfLastMonth=new Date(today.getFullYear(), today.getMonth()-1, 1);

        const endOfLastMonth=new Date(today.getFullYear(), today.getMonth(), 0);

        const thisMonthProductsPromise=Product.find({createdAt:{
            $gte:startOfMonth,
            $lte:today
        }})

        const lastMonthProductsPromise=Product.find({createdAt:{
            $gte:startOfLastMonth,
            $lte:endOfLastMonth
        }})

        const thisMonthUsersPromise=User.find({createdAt:{
            $gte:startOfMonth,
            $lte:today
        }})

        const lastMonthUsersPromise=User.find({createdAt:{
            $gte:startOfLastMonth,
            $lte:endOfLastMonth
        }})

        const thisMonthOrdersPromise=Order.find({createdAt:{
            $gte:startOfMonth,
            $lte:today
        }})

        const lastMonthOrdersPromise=Order.find({createdAt:{
            $gte:startOfLastMonth,
            $lte:endOfLastMonth
        }})

        const lastSixMonthsOrdersPromise=Order.find({createdAt:{
            $gte:sixMonthsAgo,
            $lte:today
        }})

        const latestTransactionsPromise=Order.find().select(["orderItems","discount","total","status"]).sort({createdAt:-1}).limit(4)

        const [
				thisMonthProducts,
				lastMonthProducts,
				thisMonthUsers,
				lastMonthUsers,
				thisMonthOrders,
				lastMonthOrders,
				usersCount,
				productsCount,
				orders,
                lastSixMonthsOrders,
                categories,
                male,
                latestTransactions
			] = await Promise.all([
					thisMonthProductsPromise,
					lastMonthProductsPromise,
					thisMonthUsersPromise,
					lastMonthUsersPromise,
					thisMonthOrdersPromise,
					lastMonthOrdersPromise,
					User.countDocuments(),
					Product.countDocuments(),
					Order.find().select("total"),
                    lastSixMonthsOrdersPromise,
                    Product.distinct("category"),
                    User.countDocuments({gender:"male"}),
                    latestTransactionsPromise
				]);

        const thisMonthRevenue=thisMonthOrders.reduce((acc,order)=>acc+order.total,0)
        const lastMonthRevenue=lastMonthOrders.reduce((acc, order)=>acc+order.total, 0)
        const totalRevenue=orders.reduce((acc, order)=>acc+order.total, 0)


        const userChangePercentage=calculatePercentage(thisMonthUsers.length, lastMonthUsers.length);
        const productChangePercentage=calculatePercentage(thisMonthProducts.length, lastMonthProducts.length);
        const orderChangePercentage=calculatePercentage(thisMonthOrders.length, lastMonthOrders.length);
        const revenueChangePercentage=calculatePercentage(thisMonthRevenue, lastMonthRevenue);


        const orderMonthsCount=new Array(6).fill(0);
        const orderMonthlyRevenue=new Array(6).fill(0);

        lastSixMonthsOrders.forEach((order)=>{
            const creationDate=order.createdAt;
            const monthDiff=(today.getMonth()-creationDate.getMonth()+12)%12;

            if(monthDiff<6){
                orderMonthsCount[5-monthDiff]++;
                orderMonthlyRevenue[5-monthDiff]+=order.total;
            }
        })


        const categoriesCountPromise=categories.map((category)=>Product.countDocuments({category}));

        const categoriesCount=await Promise.all(categoriesCountPromise);

        const categoryCount:Record<string,number>[]=[]

        categories.forEach((category, index)=>{
            categoryCount.push({
                [category]:Math.round((categoriesCount[index]/productsCount)*100)
            })
        })

        const modifiedLatestTransaction=latestTransactions.map((i)=>({
            _id:i._id,
            discount:i.discount,
            amount:i.total,
            quantity:i.orderItems.length,
            status:i.status
        }))

        stats={
            users:{
                count:usersCount,
                percentage:userChangePercentage
            },
            products:{
                count:productsCount,
                percentage:productChangePercentage
            },
            orders:{
                count:orders.length,
                percentage:orderChangePercentage
            },
            revenue:{
                count:totalRevenue,
                percentage:revenueChangePercentage
            },
            chart:{
                order:orderMonthsCount,
                revenue:orderMonthlyRevenue
            },
            categoryCount,
            userRatio:{
                male,
                female:usersCount-male
            },
            latestTransactions:modifiedLatestTransaction
        }

        myCache.set("admin-stats", JSON.stringify(stats))
    }

    return res.status(200).json({
        success:true,
        stats
    })
})



export const getPieChartDetails=TryCatch(async(req:Request, res:Response, next:NextFunction)=>{
    let charts;

    if(myCache.has("admin-pie-charts")){
        charts=JSON.parse(myCache.get("admin-pie-charts") as string);
    }
    else{
        const allOrdersPromise=Order.find().select(["total","subTotal","tax","shippingCharges","discount"]);

        const [processedOrders,shippedOrders,deliveredOrders,categories,productsCount,outOfStock,allOrders,allUsers,admin,customer]=await Promise.all([
            Order.countDocuments({status:"Processing"}),
            Order.countDocuments({status:"Shipped"}),
            Order.countDocuments({status:"Delivered"}),
            Product.distinct("category"),
            Product.countDocuments(),
            Product.countDocuments({stock:0}),
            allOrdersPromise,
            User.find().select("dob"),
            User.countDocuments({role:"admin"}),
            User.countDocuments({role:"user"})
        ])

        const orderFullfillment={
            processing:processedOrders,
            shipped:shippedOrders,
            delivered:deliveredOrders
        }

        const categoriesCountPromise=categories.map((category)=>Product.countDocuments({category}));

        const categoriesCount=await Promise.all(categoriesCountPromise);

        const categoryCount:Record<string,number>[]=[]

        categories.forEach((category, index)=>{
            categoryCount.push({
                [category]:categoriesCount[index]
            })
        })

        const stockAvailability={
            inStock:productsCount-outOfStock,
            outOfStock
        }

        const grossIncome=allOrders.reduce((acc, order)=>acc+order.total, 0)

        const discount=allOrders.reduce((acc, order)=>acc+order.discount, 0)

        const productionCost=allOrders.reduce((acc, order)=>acc+order.shippingCharges, 0)

        const burnt=allOrders.reduce((acc, order)=>acc+order.tax, 0)

        const marketingCost= Math.round(grossIncome*0.3)

        const netMargin=grossIncome-(discount+productionCost+burnt+marketingCost)

        const revenueDistribution={
            netMargin,
            discount,
            productionCost,
            burnt,
            marketingCost
        }

        const usersAgeGroup={
            teen:allUsers.filter((i)=>i.age<20).length,
            adult:allUsers.filter((i)=>i.age>=20 && i.age<40).length,
            old:allUsers.filter((i)=>i.age>=40).length
        }

        const adminCustomers={
            admin,
            customer
        }

        charts={
            orderFullfillment,
            productCategories:categoryCount,
            stockAvailability,
            revenueDistribution,
            usersAgeGroup,
            adminCustomers
        }

        myCache.set("admin-pie-charts", JSON.stringify(charts))
    }

    return res.status(200).json({
        success:true,
        charts
    })
})


export const getBarChartDetails=TryCatch(async(req:Request, res:Response, next:NextFunction)=>{
    let charts;

    if(myCache.has("admin-bar-charts")){
        charts=JSON.parse(myCache.get("admin-bar-charts") as string);
    }
    else{
        const today=new Date();

        const sixMonthsAgo=new Date();
        sixMonthsAgo.setMonth(sixMonthsAgo.getMonth()-6)

        const twelveMonthsAgo=new Date();
        twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth()-12)

        const [products,users,orders]=await Promise.all([
            Product.find({createdAt:{
                $gte:sixMonthsAgo,
                $lte:today
            }}).select("createdAt"),
            User.find({createdAt:{
                $gte:sixMonthsAgo,
                $lte:today
            }}).select("createdAt"),
            Order.find({createdAt:{
                $gte:twelveMonthsAgo,
                $lte:today
            }}).select("createdAt")
        ])


        const productsCount=lastNMonthsDataCalculator({length:6,docArr:products,today});
        const usersCount=lastNMonthsDataCalculator({length:6, docArr:users,today});
        const ordersCount=lastNMonthsDataCalculator({length:12, docArr:orders,today});

        charts={
            users:usersCount,
            products:productsCount,
            orders:ordersCount
        }

        myCache.set("admin-bar-charts", JSON.stringify(charts))
    }

    return res.status(200).json({
        success:true,
        charts
    })
})



export const getLineChartDetails=TryCatch(async(req:Request,res:Response,next:NextFunction)=>{
    let charts;

    if(myCache.has("admin-line-charts")){
        charts=JSON.parse(myCache.get("admin-line-charts") as string);
    }
    else{
        const today=new Date();

        const twelveMonthsAgo=new Date();
        twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth()-12)

        const [products,users,orders]=await Promise.all([
            Product.find({createdAt:{
                $gte:twelveMonthsAgo,
                $lte:today
            }}).select("createdAt"),
            User.find({createdAt:{
                $gte:twelveMonthsAgo,
                $lte:today
            }}).select("createdAt"),
            Order.find({createdAt:{
                $gte:twelveMonthsAgo,
                $lte:today
            }}).select(["createdAt","discount","total"])
        ])


        const productsCount=lastNMonthsDataCalculator({length:12,docArr:products,today});
        const usersCount=lastNMonthsDataCalculator({length:12, docArr:users,today});
        const discount=lastNMonthsDataCalculator({length:12, docArr:orders,today,property:"discount"});
        const revenue=lastNMonthsDataCalculator({length:12, docArr:orders, today, property:"total"});

        charts={
            users:usersCount,
            products:productsCount,
            discount,
            revenue
        }

        myCache.set("admin-line-charts", JSON.stringify(charts))
    }

    return res.status(200).json({
        success:true,
        charts
    })
})