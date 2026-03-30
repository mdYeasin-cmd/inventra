/* eslint-disable no-console */
import { Server } from "http";
import mongoose from "mongoose";
import app from "./app.js";
import { envVars } from "./app/config/env.js";

let server: Server;

const startServer = async () => {
  try {
    await mongoose.connect(envVars.DB_URL);

    console.log("Connected to Database!");

    server = app.listen(envVars.PORT, () => {
      console.log(
        `Inventra server is listening on http://localhost:${envVars.PORT}`,
      );
    });
  } catch (error) {
    console.error("Error starting server:", error);
  }
};

process.on("SIGTERM", () => {
  console.log("SIGTERM signal received... Server shutting down...");

  if (server) {
    server.close(() => {
      process.exit(1);
    });
  }

  process.exit(1);
});

process.on("unhandledRejection", (err: Error) => {
  console.log("Unhandled Rejection detected... Server shutting down...", err);

  if (server) {
    server.close(() => {
      process.exit(1);
    });
  }

  process.exit(1);
});

process.on("uncaughtException", (err: Error) => {
  console.log("Uncaught Exception detected... Server shutting down...", err);

  if (server) {
    server.close(() => {
      process.exit(1);
    });
  }

  process.exit(1);
});

startServer();
