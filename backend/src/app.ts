import express, {
  type Application,
  type Request,
  type Response,
} from "express";
import cors from "cors";
import router from "./app/routes/index.js";
import globalErrorHandler from "./app/middlewares/globalErrorHandler";
import notFound from "./app/middlewares/notFound";

const app: Application = express();

// parsers
app.use(express.json());
app.use(
  cors({
    origin: ["http://localhost:3000"],
  }),
);

// application routes
app.use("/api/v1", router);

// testing route
app.get("/", (req: Request, res: Response) => {
  res.send("Welcome to Inventra API");
});

// global error handler
app.use(globalErrorHandler);

// not found route
app.use(notFound);

export default app;
