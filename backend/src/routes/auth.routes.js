import {
  loginUser,
  verifyEmail,
  getMe,
  logoutUser,
  googleCallback,
} from "../controllers/auth.controllers.js";
import { Router } from "express";
import passport from "passport";

const router = Router();

router.post("/login", loginUser);

router.get(
  "/google",
  passport.authenticate("google", { scope: ["profile", "email"] }),
);

router.get("/google/callback", (req, res, next) => {
  passport.authenticate("google", { session: false }, (err, user, info) => {
    if (err || !user) {
      const errorCode = info?.message || "auth_failed";
      return res.redirect(
        `${process.env.CORS_ORIGIN}/login?error=${errorCode}`,
      );
    }

    req.user = user; // pass user to your controller
    return googleCallback(req, res);
  })(req, res, next);
});

router.get("/verify-email/:token", verifyEmail);
router.get("/me", getMe);
router.get("/logout", logoutUser);

export default router;
