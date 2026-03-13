import { Router } from "express";
import {createUser, loginUser, updateUserRole, logoutUser} from "../controllers/user.controller";
import userService from "../services/user.service";
import { auth, AuthRequest } from "../middleware/auth.middleware";

const userRoutes = Router();
userRoutes.post("/", createUser); 

userRoutes.post("/login", loginUser); 

userRoutes.post("/logout", logoutUser);

userRoutes.get('/me', auth, async (req: AuthRequest, res) => {
  try {
    const user = await userService.getUserById(req.user!.userId)

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      })
    }

    const { password, ...userWithoutPassword } = user

    res.json({
      success: true,
      user: userWithoutPassword,
    })
  } catch (error: any) {
    console.error('[v0] Error fetching user:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to fetch user',
      error: error.message,
    })
  }
})

userRoutes.put("/update-role", updateUserRole);

export default userRoutes;