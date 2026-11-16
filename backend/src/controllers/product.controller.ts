import type { Request, Response, NextFunction } from "express";
import { db } from "../db/index.js";
import { products } from "../db/schema.js";
import { and, desc, eq } from "drizzle-orm";

export const listProduct = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const category =
      typeof req.query.category === "string" ? req.query.category.trim() : "";

    const activeOnly = eq(products.active, true);
    const whereClause = category
      ? and(activeOnly, eq(products.category, category))
      : activeOnly;

    const rows = await db
      .select()
      .from(products)
      .where(whereClause)
      .orderBy(desc(products.createdAt));

    return res.status(200).json({
      success: true,
      message: "All active products fetched successfully",
      products: rows,
    });
  } catch (error) {
    console.log("error while listing products", error);
    next(error);
  }
};

export const getCategories = async (
  _req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const rows = await db
      .select({ category: products.category })
      .from(products)
      .where(eq(products.active, true));

    const categories = [...new Set(rows.map((r) => r.category))].sort((a, b) =>
      a.localeCompare(b),
    );

    return res.status(200).json({
      success: true,
      message: "All categories fetched successfully",
      categories,
    });
  } catch (error) {
    console.log("error while fetching categories", error);
    next(error);
  }
};

export const getProductBySlug = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const [row] = await db
      .select()
      .from(products)
      .where(eq(products.slug, req.params.slug as string))
      .limit(1);

    if (!row || !row.active) {
      return res.status(404).json({
        success: false,
        message: "Product not found or inactive",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Product fetched successfully by slug",
      product: row,
    });
  } catch (error) {
    console.log("error while fetching product by slug", error);
    next(error);
  }
};
