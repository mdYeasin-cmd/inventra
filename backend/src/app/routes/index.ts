import express from "express";
import auth from "../middlewares/auth";
import { ActivityLogRoutes } from "../modules/ActivityLog/activityLog.route";
import { UserRoutes } from "../modules/User/user.route.js";
import { AuthRoutes } from "../modules/auth/auth.route.js";
import { CategoryRoutes } from "../modules/Category/category.route";
import { DashboardRoutes } from "../modules/Dashboard/dashboard.route";
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
    requiresAuth: true,
  },
  {
    path: "/dashboard",
    route: DashboardRoutes,
    requiresAuth: true,
  },
  {
    path: "/products",
    route: ProductRoutes,
    requiresAuth: true,
  },
  {
    path: "/orders",
    route: OrderRoutes,
    requiresAuth: true,
  },
  {
    path: "/restock-queue",
    route: RestockQueueRoutes,
    requiresAuth: true,
  },
  {
    path: "/activity-logs",
    route: ActivityLogRoutes,
    requiresAuth: true,
  },
];

moduleRoutes.forEach((route) => {
  if (route.requiresAuth) {
    router.use(route.path, auth, route.route);
    return;
  }

  router.use(route.path, route.route);
});

export default router;
