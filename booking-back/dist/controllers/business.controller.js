"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const business_service_1 = __importDefault(require("../services/business.service"));
class BusinessController {
    /**
     * Create business
     */
    async create(req, res) {
        try {
            const business = await business_service_1.default.createBusiness(req.body);
            res.status(201).json(business);
        }
        catch (error) {
            res.status(500).json({ message: "Failed to create business", error });
        }
    }
    /**
     * Get business by ID
     */
    async getById(req, res) {
        try {
            const { id } = req.params;
            const business = await business_service_1.default.getBusinessById(id);
            if (!business) {
                return res.status(404).json({ message: "Business not found" });
            }
            res.json(business);
        }
        catch (error) {
            res.status(500).json({ message: "Failed to fetch business", error });
        }
    }
    /**
     * Get business by user ID
     */
    async getByUserId(req, res) {
        try {
            const { userId } = req.params;
            const business = await business_service_1.default.getBusinessByUserId(userId);
            if (!business) {
                return res.status(404).json({ message: "Business not found" });
            }
            res.json(business);
        }
        catch (error) {
            res.status(500).json({ message: "Failed to fetch business", error });
        }
    }
    /**
     * Update business
     */
    async update(req, res) {
        try {
            const { id } = req.params;
            const business = await business_service_1.default.updateBusiness(id, req.body);
            res.json(business);
        }
        catch (error) {
            res.status(500).json({ message: "Failed to update business", error });
        }
    }
    /**
     * Delete business
     */
    async delete(req, res) {
        try {
            const { id } = req.params;
            const business = await business_service_1.default.deleteBusiness(id);
            res.json(business);
        }
        catch (error) {
            res.status(500).json({ message: "Failed to delete business", error });
        }
    }
    /**
     * Get all businesses (pagination + filters)
     */
    async getAll(req, res) {
        try {
            const page = Number(req.query.page) || 1;
            const limit = Number(req.query.limit) || 10;
            const category = req.query.category;
            const isActive = req.query.isActive !== undefined
                ? req.query.isActive === "true"
                : undefined;
            const result = await business_service_1.default.getAllBusinesses(page, limit, category, isActive);
            res.json(result);
        }
        catch (error) {
            res.status(500).json({ message: "Failed to fetch businesses", error });
        }
    }
    /**
     * Business statistics
     */
    async stats(req, res) {
        try {
            const { businessId } = req.params;
            const stats = await business_service_1.default.getBusinessStats(businessId);
            res.json(stats);
        }
        catch (error) {
            res.status(500).json({ message: "Failed to fetch statistics", error });
        }
    }
    /**
     * Monthly revenue
     */
    async monthlyRevenue(req, res) {
        try {
            const { businessId } = req.params;
            const months = Number(req.query.months) || 6;
            const data = await business_service_1.default.getMonthlyRevenue(businessId, months);
            res.json(data);
        }
        catch (error) {
            res.status(500).json({ message: "Failed to fetch revenue", error });
        }
    }
    /**
     * Search businesses
     */
    async search(req, res) {
        try {
            const query = req.query.q;
            const limit = Number(req.query.limit) || 10;
            if (!query) {
                return res.status(400).json({ message: "Search query is required" });
            }
            const businesses = await business_service_1.default.searchBusinesses(query, limit);
            res.json(businesses);
        }
        catch (error) {
            res.status(500).json({ message: "Search failed", error });
        }
    }
}
exports.default = new BusinessController();
