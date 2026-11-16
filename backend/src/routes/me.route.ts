import { getAuth } from "@clerk/express";
import { Router } from "express";
import { getLocalUser } from "../lib/users.js";

const router = Router();

router.get("/", async (req, res, next) => {
  try {
    const { userId, isAuthenticated } = getAuth(req);

    if (!isAuthenticated || !userId) {
      return res.status(401).json({
        success: false,
        message: "User is not authenticated please log in first....",
      });
    }

    const user = await getLocalUser(userId);

    return res.status(200).json({
      success: true,
      user,
    });
  } catch (error) {
    console.log("error while fetching me", error);
    next(error);
  }
});

export default router;
