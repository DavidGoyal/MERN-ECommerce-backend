import mongoose from "mongoose";
import validator from "validator"

interface IUser extends Document{
    _id:string;
    photo:string;
    name:string;
    email:string;
    role:"admin"|"user";
    gender:"male"|"female";
    dob:Date;
    age:number;
    createdAt:Date;
    updatedAt:Date;
}

const schema=new mongoose.Schema(
    {
        _id:{
            type:String,
            required:[true,"Please Enter ID"],
        },
        photo:{
            type:String,
            required:[true,"Please add photo"],
        },
        name:{
            type:String,
            required:[true,"Please enter name"],
        },
        email:{
            type:String,
            unique:[true,"Email already exists"],
            required:[true,"Please enter email"],
            validate:validator.default.isEmail,
        },
        role:{
            type:String,
            enum:["user","admin"],
            default:"user"
        },
        gender:{
            type:String,
            enum:["male","female"],
            required:[true,"Please enter gender"],
        },
        dob:{
            type:Date,
            required:[true,"Please enter Date of Birth"]
        },
    },
    {
    timestamps:true,
    }
);


schema.virtual("age").get(function (){
    const today=new Date();
    const birthDate:Date=this.dob;
    let age=today.getFullYear()-birthDate.getFullYear();
    if(today.getMonth()<birthDate.getMonth() || (today.getMonth()===birthDate.getMonth() && today.getDate()<birthDate.getDate())){
        age--;
    }
    return age;
});


export const User=mongoose.model<IUser>("User",schema);