import "dotenv/config";
import express from "express";
import cors from "cors";

import fs from "node:fs";
import path from "node:path";

import * as Sentry from "@sentry/node";

import { clerkMiddleware } from "@clerk/express";
import { clerkWebhookHandler } from "./webhooks/clerk.js";
import { getEnv } from "./lib/env.js";
import keepAliveCronJob from "./lib/cron.js";

import meRouter from "./routes/me.route.js";
import productRouter from "./routes/product.route.js";
import streamRouter from "./routes/stream.route.js";
import checkoutRouter from "./routes/checkout.route.js";
import { polarWebhookHandler } from "./webhooks/polar.js";
import { sentryClerkUserMiddleware } from "./middlewares/sentryClerkUser.js";

const env = getEnv();
const app = express();

app.use(cors());

const rawJson = express.raw({ type: "application/json", limit: "1mb" });

// It's important that you don't parse the webhook event data, it should be in raw format
// so that you can use the raw body in the webhook handler
app.post("/webhooks/clerk", rawJson, (req, res) => {
  void clerkWebhookHandler(req, res);
});

app.post("/webhooks/polar", rawJson, (req, res) => {
  void polarWebhookHandler(req, res);
});

app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: true, limit: "1mb" }));

app.use(clerkMiddleware());
app.use(sentryClerkUserMiddleware);

app.get("/health", (_req, res) => {
  return res.status(200).json({
    success: true,
    ok: true,
  });
});

app.use("/api/me", meRouter);
app.use("/api/products", productRouter);
app.use("/api/stream", streamRouter);
app.use("/api/checkout", checkoutRouter);

const publicDir = path.join(process.cwd(), "public");
if (fs.existsSync(publicDir)) {
  app.use(express.static(publicDir));
  app.get("/{*splat}", (req, res, next) => {
    if (req.method !== "GET" && req.method !== "HEAD") {
      return next();
    }

    if (req.path.startsWith("/api") || req.path.startsWith("/webhooks")) {
      return next();
    }

    res.sendFile(path.join(publicDir, "index.html"), (error) => next(error));
  });
}

// Sentry will be attached to the response object
Sentry.setupExpressErrorHandler(app);
app.use(
  (
    _err: unknown,
    _req: express.Request,
    res: express.Response,
    _next: express.NextFunction,
  ) => {
    const sentryId = (res as express.Response & { sentry?: string }).sentry;

    return res.status(500).json({
      error: "Internal server error",
      ...(sentryId !== undefined && { sentryId }),
    });
  },
);

const PORT = env.PORT;

app.listen(PORT || 3000, () => {
  console.log(`🚀 Server is running at http://localhost:${PORT || 3000}`);
  if (env.NODE_ENV === "production") {
    keepAliveCronJob.start();
  }
});
