/* eslint-disable @typescript-eslint/no-explicit-any */
import httpStatus from "http-status";
import { TErrorSources, IGenericErrorResponse } from "../interfaces/error";

const handleDuplicateError = (err: any): IGenericErrorResponse => {
  const statusCode = httpStatus.BAD_REQUEST;

  // Extract value within double quotes using regex
  const match = err.message.match(/"([^"]*)"/);

  // The extracted value will be in the first capturing group
  const extractedMessage = match && match[1];

  const errorSources: TErrorSources = [
    {
      path: "",
      message: `${extractedMessage} is already exists`,
    },
  ];

  return {
    statusCode,
    message: "Duplicate value!",
    errorSources,
  };
};

export default handleDuplicateError;
