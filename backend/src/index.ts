import "dotenv/config";
import express from "express";
import cors from "cors";
import { clerkMiddleware } from "@clerk/express";
import { clerkWebhookHandler } from "./webhooks/clerk.js";
import { getEnv } from "./lib/env.js";

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

const PORT = env.PORT;

app.listen(PORT || 3000, () => {
  console.log(`🚀 Server is running at http://localhost:${PORT || 3000}`);
});
