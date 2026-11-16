import { Router } from "express";
import {
  getCategories,
  getProductBySlug,
  listProduct,
} from "../controllers/product.controller.js";

const router = Router();

router.get("/", listProduct);
router.get("/categories", getCategories);
router.get("/:slug", getProductBySlug);

export default router;
