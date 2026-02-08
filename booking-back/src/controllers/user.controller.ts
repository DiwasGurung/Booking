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
    // find the user by email
    const user = await userService.getUserByEmail(email);

    if (!user) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    // compare passwords
    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    // generate JWT token
    const token = jwt.sign(
      { userId: user.id, role: user.role },
      process.env.JWT_SECRET || "supersecret",
      { expiresIn: "7d" }
    );

    // remove password from response
    const { password: _, ...userWithoutPassword } = user;

    return res.status(200).json({ user: userWithoutPassword, token });
  } catch (err) {
    console.error("Error logging in user:", err);
    return res.status(500).json({ message: "Server error" });
  }
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
