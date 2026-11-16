import "dotenv/config";
import express from "express";
import cors from "cors";

import fs from "node:fs";
import path from "node:path";

import { clerkMiddleware } from "@clerk/express";
import { clerkWebhookHandler } from "./webhooks/clerk.js";
import { getEnv } from "./lib/env.js";
import keepAliveCronJob from "./lib/cron.js";

import meRouter from "./routes/me.route.js";
import productRouter from "./routes/product.route.js";
import streamRouter from "./routes/stream.route.js";

const env = getEnv();
const app = express();

app.use(cors());

const rawJson = express.raw({ type: "application/json", limit: "1mb" });

// It's important that you don't parse the webhook event data, it should be in raw format
// so that you can use the raw body in the webhook handler
app.post("/webhooks/clerk", rawJson, (req, res) => {
  void clerkWebhookHandler(req, res);
});

app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: true, limit: "1mb" }));

app.use(clerkMiddleware());

app.get("/health", (_req, res) => {
  return res.status(200).json({
    success: true,
    ok: true,
  });
});

app.use("/api/me", meRouter);
app.use("/api/products", productRouter);
app.use("/api/stream", streamRouter);

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

const PORT = env.PORT;

app.listen(PORT || 3000, () => {
  console.log(`🚀 Server is running at http://localhost:${PORT || 3000}`);
  if (env.NODE_ENV === "production") {
    keepAliveCronJob.start();
  }
});
