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

router.post(
  "/login",
  validateRequest(AuthValidations.loginValidationSchema),
  AuthControllers.loginUser,
);

export const AuthRoutes = router;
