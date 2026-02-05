import { Router } from "express";
import {createUser} from "../controllers/user.controller";

const userRoutes = Router();
userRoutes.post("/", createUser); // POST /api/users

export default userRoutes;