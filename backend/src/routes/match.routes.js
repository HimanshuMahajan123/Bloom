import { Router } from "express";
import { rightSwipe ,leftSwipe } from "../controllers/match.controllers";
import { verifyjwt } from "../middlewares/auth.middlewares";
const router = Router();

router.post("/right-swipe", verifyjwt, rightSwipe);
router.post("/left-swipe", verifyjwt, leftSwipe);

export default router;