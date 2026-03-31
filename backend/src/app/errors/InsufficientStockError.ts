class InsufficientStockError extends Error {
  public statusCode: number;
  public productId: string;
  public productName: string;
  public requestedQuantity: number;
  public availableQuantity: number;
  public itemIndex?: number;

  constructor(
    productId: string,
    productName: string,
    requestedQuantity: number,
    availableQuantity: number,
    itemIndex?: number,
    stack = "",
  ) {
    super("Insufficient stock");
    this.statusCode = 400;
    this.productId = productId;
    this.productName = productName;
    this.requestedQuantity = requestedQuantity;
    this.availableQuantity = availableQuantity;
    this.itemIndex = itemIndex;

    if (stack) {
      this.stack = stack;
    } else {
      Error.captureStackTrace(this, this.constructor);
    }
  }
}

export default InsufficientStockError;
