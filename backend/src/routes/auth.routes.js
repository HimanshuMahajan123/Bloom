import {
  loginUser,
  verifyEmail,
  getMe,
  logoutUser,
} from "../controllers/auth.controllers.js";
import { Router } from "express";

const router = Router();

router.post("/login", loginUser);
router.get("/verify-email/:token", verifyEmail);
router.get("/me", getMe);
router.get("/logout", logoutUser);
export default router;
