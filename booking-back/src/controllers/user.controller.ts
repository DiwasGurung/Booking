import { Request, Response } from "express";
import userService from "../services/user.service";

export const createUser = async (req: Request, res: Response) => {
  try {
    const newUser = await userService.createUser(req.body);
    // Exclude password from response for security
    const { password, ...userWithoutPassword } = newUser;
    res.status(201).json(userWithoutPassword);
  } catch (error: any) {
    res.status(400).json({ error: error.message || "Failed to create user" });
  }
};
