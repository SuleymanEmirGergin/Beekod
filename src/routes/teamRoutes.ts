import { Router } from "express";
import { z } from "zod";
import { requireJsonBody } from "../middleware/requireJsonBody.js";
import { validateBody } from "../validation.js";
import { logger } from "../logger.js";
import { getAllTeamMembers, inviteMember, updateMemberRole, removeMember } from "../services/teamService.js";

const router = Router();

router.use(requireJsonBody);

const inviteSchema = z.object({
  email: z.string().email(),
  role: z.enum(["Admin", "Member", "Viewer"]),
});

const roleSchema = z.object({
  role: z.enum(["Admin", "Member", "Viewer"]),
});

// GET /api/team
router.get("/team", async (req, res) => {
  try {
    const members = await getAllTeamMembers();
    res.json(members);
  } catch (error) {
    logger.error("team.list_failed", { err: error });
    res.status(500).json({ error: "Failed to list team members" });
  }
});

// POST /api/team/invite
router.post("/team/invite", validateBody(inviteSchema), async (req, res) => {
  try {
    const member = await inviteMember({ email: req.body.email, role: req.body.role });
    res.json(member);
  } catch (error: any) {
    logger.error("team.invite_failed", { err: error });
    if (error.message === "User already exists") {
      return res.status(409).json({ error: "User already exists" });
    }
    res.status(500).json({ error: "Failed to invite member" });
  }
});

// PUT /api/team/:id/role
router.put("/team/:id/role", validateBody(roleSchema), async (req, res) => {
  try {
    const member = await updateMemberRole(Number(req.params.id), req.body.role);
    res.json(member);
  } catch (error) {
    logger.error("team.update_role_failed", { err: error });
    res.status(500).json({ error: "Failed to update member role" });
  }
});

// DELETE /api/team/:id
router.delete("/team/:id", async (req, res) => {
  try {
    await removeMember(Number(req.params.id));
    res.json({ success: true });
  } catch (error: any) {
    logger.error("team.delete_failed", { err: error });
    if (error.message === "Cannot remove the Owner") {
      return res.status(403).json({ error: "Cannot remove the Owner" });
    }
    res.status(500).json({ error: "Failed to remove member" });
  }
});

export { router as teamRouter };
