import mongoose from "mongoose";
import { IGenericErrorResponse, TErrorSources } from "../interfaces/error";
import httpStatus from "http-status";

const handleCastError = (
  err: mongoose.Error.CastError,
): IGenericErrorResponse => {
  const statusCode = httpStatus.BAD_REQUEST;

  const errorSources: TErrorSources = [
    {
      path: err?.path,
      message: err?.message,
    },
  ];

  return {
    statusCode,
    message: "Invalid ID!",
    errorSources,
  };
};

export default handleCastError;
