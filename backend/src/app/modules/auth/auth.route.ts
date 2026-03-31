import express from "express";
import { AuthControllers } from "./auth.controller.js";

const router = express.Router();

router.post("/signup", AuthControllers.signupUser);

export const AuthRoutes = router;
