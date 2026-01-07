import express from "express";
import { logger } from "../logger.js";
import { getCurrentUser, updateTeamMemberById } from "../services/teamService.js";

const router = express.Router();

router.get("/api/profile/me", async (req, res, next) => {
  try {
    const user = await getCurrentUser();
    if (!user) return res.status(404).json({ message: "User not found" });
    return res.json(user);
  } catch (error) {
    next(error);
  }
});

router.put("/api/profile/me", async (req, res, next) => {
  try {
    const user = await getCurrentUser();
    if (!user) return res.status(404).json({ message: "User not found" });

    const { name, email, phone, location, position, bio, company } = req.body ?? {};

    const updated = await updateTeamMemberById(user.id, {
      name,
      email,
      phone,
      location,
      position,
      bio,
      company, // DB'de company kolonu yoksa burada da kaldır
    });

    if (!updated) return res.status(404).json({ message: "User not found" });

    logger.info(`Profile updated for user ${updated.id}`);
    return res.json(updated);
  } catch (error) {
    next(error);
  }
});

export { router as profileRouter };
