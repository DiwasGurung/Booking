"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const branch_controller_1 = __importDefault(require("../controllers/branch.controller"));
const auth_middleware_1 = require("../middleware/auth.middleware");
const branchRoutes = (0, express_1.Router)();
branchRoutes.get('/branches/public/:businessId', branch_controller_1.default.publicList);
branchRoutes.get("/", auth_middleware_1.auth, branch_controller_1.default.list);
branchRoutes.post("/", auth_middleware_1.auth, branch_controller_1.default.create);
branchRoutes.put("/:id", auth_middleware_1.auth, branch_controller_1.default.update);
branchRoutes.delete("/:id", auth_middleware_1.auth, branch_controller_1.default.remove);
exports.default = branchRoutes;
