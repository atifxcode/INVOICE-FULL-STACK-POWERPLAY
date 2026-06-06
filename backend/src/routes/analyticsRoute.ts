import { Router } from "express";
import { customerAnalytics, globalAnalytics } from "../controllers/analyticsController";

const router = Router();


router.get('/global', globalAnalytics);
router.get('/customer/:id', customerAnalytics);


export default router;
