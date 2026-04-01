import express from "express";
import { ActivityLogControllers } from "./activityLog.controller";

const router = express.Router();

router.get("/", ActivityLogControllers.getActivityLogs);

export const ActivityLogRoutes = router;
