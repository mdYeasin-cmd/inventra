import express from "express";
import { UserRoutes } from "../modules/User/user.route.js";
import { AuthRoutes } from "../modules/auth/auth.route.js";
import { CategoryRoutes } from "../modules/Category/category.route";
import { ProductRoutes } from "../modules/Product/product.route";

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
  {
    path: "/categories",
    route: CategoryRoutes,
  },
  {
    path: "/products",
    route: ProductRoutes,
  },
];

moduleRoutes.forEach((route) => router.use(route.path, route.route));

export default router;
