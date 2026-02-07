import { checkLiveSignals, updateLocation, getSignalScore} from "../controllers/location.controller";
import { Router } from "express";
import { verifyjwt } from "../middlewares/auth.middlewares";
const router = Router();

router.post("/update" ,verifyjwt, updateLocation); 
router.get("/signal/check", verifyjwt, checkLiveSignals);
router.get("/signal/score/:otherUserId", verifyjwt, getSignalScore);
export default router;