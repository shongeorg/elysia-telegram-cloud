import { Elysia } from "elysia";
import { mainController } from "../controllers/main";

export const mainRoutes = new Elysia()
  .get("/", mainController.home);
