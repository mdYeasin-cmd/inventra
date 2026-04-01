import express from "express";
import { DashboardControllers } from "./dashboard.controller";

const router = express.Router();

router.get("/", DashboardControllers.getDashboardOverview);

export const DashboardRoutes = router;
