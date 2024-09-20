import { NextFunction, Request, Response } from "express";
import ErrorHandler from "../utils/utility.js";
import { ControllerType } from "../types/types.js";

export const errorMiddleware = (
	err: ErrorHandler,
	req: Request,
	res: Response,
	next: NextFunction
) => {
	err.message = err.message || "Internal Server Error";
	err.statusCode = err.statusCode || 500;

	if (err.name === "CastError") {
		err.message = `Invalid format of id`;
		err.statusCode = 400;
	}

	res.status(err.statusCode).json({
		success: false,
		message: err.message,
	});
};

export const TryCatch =
	(controller: ControllerType) =>
	async (req: Request, res: Response, next: NextFunction) => {
		try {
			await controller(req, res, next);
		} catch (error) {
			next(error);
		}
	};
