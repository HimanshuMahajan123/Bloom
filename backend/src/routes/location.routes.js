import {
  checkLiveSignals,
  updateLocation,
  getSignalScore,
} from "../controllers/location.controller.js";
import { Router } from "express";
import { verifyjwt } from "../middlewares/auth.middlewares.js";
const router = Router();

router.post("/update", verifyjwt, updateLocation);
router.get("/signal/check", verifyjwt, checkLiveSignals);
router.get("/signal/score/:otherUserId", verifyjwt, getSignalScore);
export default router;
