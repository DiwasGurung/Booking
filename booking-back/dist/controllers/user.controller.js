"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createUser = void 0;
const user_service_1 = __importDefault(require("../services/user.service"));
const createUser = async (req, res) => {
    try {
        const newUser = await user_service_1.default.createUser(req.body);
        // Exclude password from response for security
        const { password, ...userWithoutPassword } = newUser;
        res.status(201).json(userWithoutPassword);
    }
    catch (error) {
        res.status(400).json({ error: error.message || "Failed to create user" });
    }
};
exports.createUser = createUser;
