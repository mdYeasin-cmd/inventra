import mongoose from "mongoose";
import { TErrorSources, IGenericErrorResponse } from "../interfaces/error";

const handleValidationError = (
  err: mongoose.Error.ValidationError,
): IGenericErrorResponse => {
  const statusCode = 400;

  const errorSources: TErrorSources = Object.values(err.errors).map(
    (value: mongoose.Error.ValidatorError | mongoose.Error.CastError) => {
      return {
        path: value?.path,
        message: value?.message,
      };
    },
  );

  return {
    statusCode,
    message: "Validation error!",
    errorSources,
  };
};

export default handleValidationError;
