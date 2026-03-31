import express from "express";
import { UserRoutes } from "../modules/User/user.route.js";
import { AuthRoutes } from "../modules/auth/auth.route.js";

const router = express.Router();

const moduleRoutes = [
  {
    path: "/auth",
    route: AuthRoutes,
  },
  {
    path: "/users",
    route: UserRoutes,
  },
];

moduleRoutes.forEach((route) => router.use(route.path, route.route));

export default router;
