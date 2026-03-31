import express from "express";
import { UserRoutes } from "../modules/User/user.route.js";
import { AuthRoutes } from "../modules/auth/auth.route.js";
import { CategoryRoutes } from "../modules/Category/category.route";
import { OrderRoutes } from "../modules/Order/order.route";
import { ProductRoutes } from "../modules/Product/product.route";
import { RestockQueueRoutes } from "../modules/RestockQueue/restockQueue.route";

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
  {
    path: "/orders",
    route: OrderRoutes,
  },
  {
    path: "/restock-queue",
    route: RestockQueueRoutes,
  },
];

moduleRoutes.forEach((route) => router.use(route.path, route.route));

export default router;
