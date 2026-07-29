"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const businessHours_service_1 = __importDefault(require("../services/businessHours.service"));
class BusinessHoursController {
    /**
     * Set or update business hours for a day
     */
    set(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const hours = yield businessHours_service_1.default.setBusinessHours(req.body);
                res.status(201).json(hours);
            }
            catch (error) {
                res.status(500).json({ message: "Failed to set business hours", error });
            }
        });
    }
    /**
     * Get all business hours
     */
    getAll(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const { businessId } = req.params;
                const hours = yield businessHours_service_1.default.getBusinessHours(businessId);
                res.json(hours);
            }
            catch (error) {
                res.status(500).json({ message: "Failed to fetch business hours", error });
            }
        });
    }
    /**
     * Get hours for a specific day
     */
    getByDay(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const { businessId, dayOfWeek } = req.params;
                const hours = yield businessHours_service_1.default.getHoursForDay(businessId, Number(dayOfWeek));
                if (!hours) {
                    return res.status(404).json({ message: "Business hours not found" });
                }
                res.json(hours);
            }
            catch (error) {
                res.status(500).json({ message: "Failed to fetch business hours", error });
            }
        });
    }
    /**
     * Update business hours by ID
     */
    update(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const { id } = req.params;
                const hours = yield businessHours_service_1.default.updateBusinessHours(id, req.body);
                res.json(hours);
            }
            catch (error) {
                res.status(500).json({ message: "Failed to update business hours", error });
            }
        });
    }
    /**
     * Delete business hours
     */
    delete(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const { id } = req.params;
                const hours = yield businessHours_service_1.default.deleteBusinessHours(id);
                res.json(hours);
            }
            catch (error) {
                res.status(500).json({ message: "Failed to delete business hours", error });
            }
        });
    }
    /**
     * Check if business is open now
     */
    isOpen(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const { businessId } = req.params;
                const open = yield businessHours_service_1.default.isBusinessOpen(businessId);
                res.json({ isOpen: open });
            }
            catch (error) {
                res.status(500).json({ message: "Failed to check business status", error });
            }
        });
    }
}
exports.default = new BusinessHoursController();
