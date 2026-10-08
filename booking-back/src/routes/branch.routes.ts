import { Router } from "express";
import BranchController from "../controllers/branch.controller";
import { auth } from "../middleware/auth.middleware";

const branchRoutes = Router()

branchRoutes.get('/branches/public/:businessId', BranchController.publicList)
branchRoutes.get("/", auth, BranchController.list)
branchRoutes.post("/", auth, BranchController.create)
branchRoutes.put("/:id", auth, BranchController.update)
branchRoutes.delete("/:id", auth, BranchController.remove)

export default branchRoutes