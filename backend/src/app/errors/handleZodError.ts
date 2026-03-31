import { ZodError, ZodIssue } from "zod";
import { IGenericErrorResponse, TErrorSources } from "../interfaces/error";

const handleZodError = (err: ZodError): IGenericErrorResponse => {
  const statusCode = 400;

  const errorSources: TErrorSources = err.issues.map((issue: ZodIssue) => {
    return {
      path: issue?.path[issue.path.length - 1],
      message: issue.message,
    };
  });

  return {
    statusCode,
    message: "Validation error!",
    errorSources,
  };
};

export default handleZodError;
