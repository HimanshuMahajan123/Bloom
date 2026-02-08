import { Router } from "express";
import { rightSwipe ,leftSwipe } from "../controllers/match.controllers.js";
import { verifyjwt } from "../middlewares/auth.middlewares.js";
const router = Router();

router.post("/right-swipe", verifyjwt, rightSwipe);
router.post("/left-swipe", verifyjwt, leftSwipe);

export default router;