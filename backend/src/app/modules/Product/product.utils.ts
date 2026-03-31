import type { TProductStatus } from "./product.interface";

interface TStockAwareDocument {
  stockQuantity: number;
  minimumStockThreshold: number;
  toObject: () => Record<string, unknown>;
}

export const getProductStatus = (stockQuantity: number): TProductStatus => {
  return stockQuantity === 0 ? "Out of Stock" : "Active";
};

export const getIsLowStock = (
  stockQuantity: number,
  minimumStockThreshold: number,
) => {
  return stockQuantity > 0 && stockQuantity <= minimumStockThreshold;
};

export const attachProductStockInfo = <T extends TStockAwareDocument>(product: T) => {
  const productObject = product.toObject();

  return {
    ...productObject,
    isLowStock: getIsLowStock(product.stockQuantity, product.minimumStockThreshold),
  };
};
