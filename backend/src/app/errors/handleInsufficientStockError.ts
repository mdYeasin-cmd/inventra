import type { IGenericErrorResponse, TErrorSources } from "../interfaces/error";
import InsufficientStockError from "./InsufficientStockError";

const handleInsufficientStockError = (
  err: InsufficientStockError,
): IGenericErrorResponse => {
  const errorSources: TErrorSources = [
    {
      path:
        typeof err.itemIndex === "number"
          ? `products.${err.itemIndex}.quantity`
          : "quantity",
      message: `Only ${err.availableQuantity} items available in stock for ${err.productName}`,
    },
  ];

  return {
    statusCode: err.statusCode,
    message: err.message,
    errorSources,
  };
};

export default handleInsufficientStockError;
