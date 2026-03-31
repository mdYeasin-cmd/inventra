import express from "express";
import { AuthControllers } from "./auth.controller.js";
import validateRequest from "../../middlewares/validateRequest.js";
import { AuthValidations } from "./auth.validation.js";

const router = express.Router();

router.post(
  "/signup",
  validateRequest(AuthValidations.signupValidationSchema),
  AuthControllers.signupUser,
);

export const AuthRoutes = router;
