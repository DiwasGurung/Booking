// routes/auth.routes.ts
import { Router } from "express";
import { loginUser } from "../controllers/user.controller";

const router = Router();

router.post("/login", loginUser);

export default router;
