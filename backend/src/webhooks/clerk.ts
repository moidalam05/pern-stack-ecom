import type { Request, Response } from "express";
import { verifyWebhook } from "@clerk/backend/webhooks";
import { getEnv } from "../lib/env.js";
import { parseRole } from "../lib/roles.js";
import { db } from "../db/index.js";
import { users } from "../db/schema.js";
import { eq } from "drizzle-orm";

export const clerkWebhookHandler = async (req: Request, res: Response) => {
  const env = getEnv();

  try {
    // webhook verification needs a shared secret
    // without it we cannot trust incoming POSTs.
    if (!env.CLERK_WEBHOOK_SECRET) {
      return res.status(503).json({
        success: false,
        message: "Webhook secret is not configured",
      });
    }

    // clerk's verifier expects a web request with the raw body
    // express may give buffer or string body, so we need to parse it
    const payload =
      req.body instanceof Buffer ? req.body.toString("utf8") : String(req.body);

    const request = new Request("http://internal/webhooks/clerk", {
      method: "POST",
      headers: new Headers(req.headers as HeadersInit),
      body: payload,
    });

    // throws if signature is wrong or body was tempered with
    // only then we trust event.
    const event = await verifyWebhook(request, {
      signingSecret: env.CLERK_WEBHOOK_SECRET,
    });

    if (event.type === "user.created" || event.type === "user.updated") {
      const user = event.data;

      const email =
        user.email_addresses?.find(
          (e) => e.id === user.primary_email_address_id,
        )?.email_address ?? user.email_addresses?.[0]?.email_address;

      const displayName =
        [user.first_name, user.last_name].filter(Boolean).join(" ") ||
        user.username ||
        null;

      const role = parseRole(user.public_metadata?.role);

      await db
        .insert(users)
        .values({
          clerkUserId: user.id,
          email,
          displayName,
          role,
        })
        .onConflictDoUpdate({
          target: users.clerkUserId,
          set: { email, displayName, role, updatedAt: new Date() },
        });
    }

    if (event.type === "user.deleted") {
      const id = event.data.id;
      if (id) {
        await db.delete(users).where(eq(users.clerkUserId, id));
      }
    }

    return res.json({
      success: true,
      ok: true,
    });
  } catch (error) {
    // Bad signature, malformed payload, or DB error
    // do not leak details to the client.
    console.error("Clerk webhook error", error);
    res.status(400).json({ error: "Invalid webhook" });
  }
};
