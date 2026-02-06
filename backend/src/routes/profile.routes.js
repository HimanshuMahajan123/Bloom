import { submitAnswersAndGenerateProfile } from "../controllers/profile.controllers.js";
import { Router } from "express";
import { verifyjwt } from "../middlewares/auth.middlewares.js";

const router = Router();

router.post("/submit-answers", verifyjwt, submitAnswersAndGenerateProfile); 

export default router;
