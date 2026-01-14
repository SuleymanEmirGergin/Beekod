/**
 * Product Module Barrel Export
 * @module modules/products
 */

// Types
export * from "./product.types.js";

// Validation
export * from "./product.validation.js";

// Service (re-export from existing location)
export {
  getProductByBarcode,
  searchProductsByEmbedding,
  searchProductsByName,
  getAllProducts,
  getLowStockProducts,
  upsertProduct,
  updatePrice,
  updateStock,
  setStock,
  getProductNames,
  deleteProduct,
  bulkDeleteProducts,
  generateQRCode,
  updateProduct,
  addProductPrice,
  getProductPrices,
  deleteProductPrice,
} from "../../services/product/productService.js";

// Routes (re-export from existing location)
export { productRouter } from "../../routes/productRoutes.js";

