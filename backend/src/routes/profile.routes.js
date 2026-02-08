import {
  submitAnswersAndGenerateProfile,
  homePageContent,notificationsPanel, findPerfectMatches
} from "../controllers/profile.controllers.js";
import { Router } from "express";
import { verifyjwt } from "../middlewares/auth.middlewares.js";

const router = Router();

router.post("/submit-answers", verifyjwt, submitAnswersAndGenerateProfile);
router.get("/home-content", verifyjwt, homePageContent);
router.get("/my-notifications", verifyjwt, notificationsPanel);
router.get("/perfect-matches", verifyjwt, findPerfectMatches);

export default router;
