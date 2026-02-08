import { Router } from "express";
import {createUser, loginUser, updateUserRole} from "../controllers/user.controller";

const userRoutes = Router();
userRoutes.post("/", createUser); 

userRoutes.post("/login", loginUser); 

userRoutes.put("/update-role", updateUserRole);

export default userRoutes;