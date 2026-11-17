import type { Request, Response, NextFunction } from "express";
import { getEnv } from "../lib/env.js";
import { z } from "zod";
import { getAuth } from "@clerk/express";
import { getLocalUser } from "../lib/users.js";
import { db } from "../db/index.js";
import {
  CheckoutSessionLine,
  checkoutSessions,
  products,
} from "../db/schema.js";
import { and, eq, inArray } from "drizzle-orm";
import { polarCreateCheckout } from "../lib/polar.js";

const env = getEnv();

const cartSchema = z.object({
  items: z
    .array(
      z.object({
        productId: z.string(),
        quantity: z.number().int().positive(),
      }),
    )
    .min(1),
});

export const createCheckout = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    // only signed-in users can start checkout
    const { userId, isAuthenticated } = getAuth(req);

    if (!userId || !isAuthenticated) {
      return res.status(401).json({
        success: false,
        message: "You are not authenticated please log in first....",
      });
    }

    const parsed = cartSchema.safeParse(req.body);

    if (!parsed.success) {
      return res.status(400).json({
        success: false,
        message: `Invalid cart ${parsed.error.flatten()}`,
      });
    }

    if (!env.POLAR_ACCESS_TOKEN) {
      return res.status(404).json({
        success: false,
        message: "Payments are not configured",
      });
    }

    const localUser = await getLocalUser(userId);

    if (!localUser) {
      return res.status(404).json({
        success: false,
        message: "Account not synced yet",
      });
    }

    const ids = parsed.data.items.map((i) => i.productId);

    // load every cart product that exists, is active, and matches the Ids we asked for.
    const prodRows = await db
      .select()
      .from(products)
      .where(and(inArray(products.id, ids), eq(products.active, true)));

    if (prodRows.length !== ids.length) {
      return res.status(400).json({
        success: false,
        message: "One or more products are invalid",
      });
    }

    const byId = new Map(prodRows.map((p) => [p.id, p]));
    let totalCents = 0;
    const lines: CheckoutSessionLine[] = [];

    for (const line of parsed.data.items) {
      const p = byId.get(line.productId)!;
      totalCents += p.priceCent * line.quantity;

      lines.push({
        productId: p.id,
        quantity: line.quantity,
        unitPriceCent: p.priceCent,
      });
    }

    if (totalCents < 10) {
      return res.status(400).json({
        success: false,
        message:
          "Total below polar minimum (e.g. USD requires at least 10 cents)",
      });
    }

    const [session] = await db
      .insert(checkoutSessions)
      .values({
        userId: localUser.id,
        lines,
        totalCents,
        currency: "usd",
      })
      .returning();

    const successUrl = `${env.FRONTEND_URL}/checkout/return?checkout_id={CHECKOUT_ID}`;
    const returnUrl = `${env.FRONTEND_URL}/cart`;

    const checkout = await polarCreateCheckout(env, {
      products: [env.POLAR_CHECKOUT_PRODUCT_ID],
      prices: {
        [env.POLAR_CHECKOUT_PRODUCT_ID]: [
          {
            amount_type: "fixed",
            price_currency: "usd",
            price_amount: totalCents,
          },
        ],
      },
      success_url: successUrl,
      return_url: returnUrl,
      external_customer_id: userId,
      metadata: { checkout_session_id: session.id },
    });

    await db
      .update(checkoutSessions)
      .set({ polarCheckoutId: checkout.id })
      .where(eq(checkoutSessions.id, session.id));

    return res.status(200).json({
      success: true,
      message: "checkout created successfully",
      checkoutUrl: checkout.url,
    });
  } catch (error) {
    console.log("error while creating checkout", error);
    next(error);
  }
};
