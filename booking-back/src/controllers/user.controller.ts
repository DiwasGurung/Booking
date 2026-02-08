import { Request, Response } from "express";
import userService from "../services/user.service";

export const createUser = async (req: Request, res: Response) => {
  console.log("Received request body:", req.body);

  // Example authorization check
  if (!req.headers.authorization || req.headers.authorization !== "Bearer mysecrettoken") {
    console.log("Authorization failed");
    return res.status(403).json({ message: "Forbidden" });
  }

  try {
    const newUser = await userService.createUser(req.body);
    res.status(201).json(newUser);
  } catch (err) {
    console.error("Error creating user:", err);
    res.status(500).json({ error: "Server error" });
  }
};
