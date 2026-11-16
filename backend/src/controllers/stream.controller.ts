import type { Request, Response, NextFunction } from "express";
import { getAuth, clerkClient } from "@clerk/express";
import { getLocalUser } from "../lib/users.js";
import {
  getStreamChatServer,
  streamChatDisplayName,
  streamUserId,
} from "../lib/stream.js";
import { getEnv } from "../lib/env.js";

const env = getEnv();

export const createStreamToken = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { userId, isAuthenticated } = getAuth(req);

    if (!isAuthenticated || !userId) {
      return res.status(401).json({
        success: false,
        message: "User not authenticated please log in first....",
      });
    }

    const localUser = await getLocalUser(userId);

    if (!localUser) {
      return res.status(400).json({
        success: false,
        message: "Account not synced yet",
      });
    }

    const server = getStreamChatServer(env);

    const clerkUser = await clerkClient.users.getUser(userId);

    const combined =
      [clerkUser.firstName, clerkUser.lastName].filter(Boolean).join(" ") ||
      null;

    const name = streamChatDisplayName(
      localUser.role,
      localUser.displayName ?? combined ?? clerkUser.username,
      localUser.email,
    );

    const image = clerkUser.imageUrl || undefined;
    const sid = streamUserId(userId);

    await server.upsertUser({ id: sid, name, image });

    const token = server.createToken(sid);

    return res.status(201).json({
      success: true,
      message: "Stream token created successfully",
      token,
      apiKey: env.STREAM_API_KEY,
      userId: sid,
    });
  } catch (error) {
    console.log("error while creating stream token", error);
    next(error);
  }
};
