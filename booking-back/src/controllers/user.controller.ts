// controllers/auth.controller.ts
import { Request, Response } from "express";
import userService from "../services/user.service";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
export const loginUser = async (req: Request, res: Response) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: "Email and password are required" });
  }

  try {
    const user = await userService.getUserByEmail(email);

    if (!user) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    const token = jwt.sign(
      { userId: user.id, role: user.role },
      process.env.JWT_SECRET || "supersecret",
      { expiresIn: "7d" }
    );

    // ✅ Store token in HTTP-only cookie
    res.cookie("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production", // HTTPS only in prod
      sameSite: "strict",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    const { password: _, ...userWithoutPassword } = user;

  
    return res.status(200).json({ user: userWithoutPassword });

  } catch (err) {
    console.error("Error logging in user:", err);
    return res.status(500).json({ message: "Server error" });
  }
};
export const logoutUser = (req: Request, res: Response) => {
  // Overwrite the token cookie to log the user out
  res.cookie("token", "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    maxAge: 0, // expires immediately
  });

  return res.status(200).json({ message: "Logged out successfully" });
};


export const createUser = async (req: Request, res: Response) => {
  console.log("Received request body:", req.body);

  try {
    const newUser = await userService.createUser(req.body);

    // remove password from response
    const { password, ...userWithoutPassword } = newUser;

    res.status(201).json(userWithoutPassword);
  } catch (err) {
    console.error("Error creating user:", err);
    res.status(500).json({ error: "Server error" });
  }
};



export const updateUserRole = async (req: Request, res: Response) => {
  const { userId, role } = req.body;

  if (!userId || !role) {
    return res.status(400).json({ message: "userId and role are required" });
  }

  try {
    const updatedUser = await userService.updateUserRole(userId, role);
    // Remove password before sending response
    const { password, ...userWithoutPassword } = updatedUser;
    res.status(200).json(userWithoutPassword);
  } catch (err) {
    console.error("Error updating user role:", err);
    res.status(500).json({ message: "Server error" });
  }
};
  export const getCurrentUser= async (req: any, res: Response) => {
    try {
      // The userId should be set by the auth middleware
      const userId = req.userId

      if (!userId) {
        return res.status(401).json({
          success: false,
          message: 'Not authenticated',
        })
      }

      const user = await userService.getUserById(userId)

      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found',
        })
      }

      // Remove password from response
      const { password: _, ...userWithoutPassword } = user

      res.json({
        success: true,
        user: userWithoutPassword,
      })
    } catch (error: any) {
      console.error('[v0] Error getting current user:', error)
      res.status(500).json({
        success: false,
        message: 'Failed to get user',
        error: error.message,
      })
    }
  }
