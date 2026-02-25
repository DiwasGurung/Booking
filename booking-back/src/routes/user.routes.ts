import { Router } from "express";
import {createUser, loginUser, updateUserRole, logoutUser} from "../controllers/user.controller";
import userService from "../services/user.service";
import { authMiddleware, AuthRequest } from "../middleware/auth.middleware";

const userRoutes = Router();
userRoutes.post("/", createUser); 

userRoutes.post("/login", loginUser); 

userRoutes.post("/logout", logoutUser);

userRoutes.get("/me", authMiddleware, async (req: AuthRequest, res) => {
  const user = await userService.getUserById(req.user!.userId);

  if (!user) {
    return res.status(404).json({ message: "User not found" });
  }

  const { password, ...userWithoutPassword } = user;

  res.json(userWithoutPassword);
});

userRoutes.put("/update-role", updateUserRole);

export default userRoutes;