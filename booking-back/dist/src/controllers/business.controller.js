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
const business_service_1 = __importDefault(require("../services/business.service"));
const user_service_1 = require("../services/user.service");
class BusinessController {
    constructor() {
    }
    /**
     * Setup basic business info (for registration flow)
     */
    setupBasic(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const userId = req.userId;
                if (!userId) {
                    return res.status(401).json({ error: 'Not authenticated' });
                }
                console.log('[Business Setup] Creating business for user:', userId);
                const business = yield business_service_1.default.createBusiness(Object.assign(Object.assign({}, req.body), { userId }));
                yield user_service_1.userService.updateUserRole(userId, 'BUSINESS_OWNER');
                res.status(201).json(business);
            }
            catch (error) {
                const errorMessage = error instanceof Error ? error.message : String(error);
                if (errorMessage === "This user already has a business") {
                    return res.status(409).json({ error: errorMessage });
                }
                if (errorMessage === "userId is required to create a business") {
                    return res.status(400).json({ error: errorMessage });
                }
                console.error('[Business Setup] Error:', errorMessage);
                res.status(500).json({ error: "Failed to create business" });
            }
        });
    }
    getCurrentBusiness(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const userId = req.userId;
                if (!userId) {
                    return res.status(401).json({ message: "Not authenticated" });
                }
                console.log('[v0] Getting current business for user:', userId);
                const business = yield business_service_1.default.getBusinessByUserId(userId);
                if (!business) {
                    return res.status(404).json({ message: "No business found for this user" });
                }
                res.json(business);
            }
            catch (error) {
                console.error('[v0] Error getting current business:', error);
                res.status(500).json({ message: "Failed to fetch current business", error });
            }
        });
    }
    /**
     * Create business
     */
    create(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const business = yield business_service_1.default.createBusiness(req.body);
                res.status(201).json(business);
            }
            catch (error) {
                const errorMessage = error instanceof Error ? error.message : String(error);
                if (errorMessage === "This user already has a business") {
                    return res.status(409).json({ message: errorMessage });
                }
                if (errorMessage === "userId is required to create a business") {
                    return res.status(400).json({ message: errorMessage });
                }
                res.status(500).json({ message: "Failed to create business", error });
            }
        });
    }
    /**
     * Get business by ID
     */
    getById(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const { id } = req.params;
                const business = yield business_service_1.default.getBusinessById(id);
                if (!business) {
                    return res.status(404).json({ message: "Business not found" });
                }
                res.json(business);
            }
            catch (error) {
                res.status(500).json({ message: "Failed to fetch business", error });
            }
        });
    }
    /**
     * Get business by user ID
     */
    getByUserId(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const { userId } = req.params;
                const business = yield business_service_1.default.getBusinessByUserId(userId);
                if (!business) {
                    return res.status(404).json({ message: "Business not found" });
                }
                res.json(business);
            }
            catch (error) {
                res.status(500).json({ message: "Failed to fetch business", error });
            }
        });
    }
    /**
     * Update business
     */
    update(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const { id } = req.params;
                const business = yield business_service_1.default.updateBusiness(id, req.body);
                res.json(business);
            }
            catch (error) {
                res.status(500).json({ message: "Failed to update business", error });
            }
        });
    }
    /**
     * Delete business
     */
    delete(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const { id } = req.params;
                const business = yield business_service_1.default.deleteBusiness(id);
                res.json(business);
            }
            catch (error) {
                res.status(500).json({ message: "Failed to delete business", error });
            }
        });
    }
    /**
     * Get all businesses (pagination + filters)
     */
    getAll(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const page = Number(req.query.page) || 1;
                const limit = Number(req.query.limit) || 10;
                const category = req.query.category;
                const isActive = req.query.isActive !== undefined
                    ? req.query.isActive === "true"
                    : undefined;
                const result = yield business_service_1.default.getAllBusinesses(page, limit, category, isActive);
                res.json(result);
            }
            catch (error) {
                res.status(500).json({ message: "Failed to fetch businesses", error });
            }
        });
    }
    /**
     * Business statistics
     */
    stats(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const { businessId } = req.params;
                const stats = yield business_service_1.default.getBusinessStats(businessId);
                res.json(stats);
            }
            catch (error) {
                res.status(500).json({ message: "Failed to fetch statistics", error });
            }
        });
    }
    /**
     * Search businesses
     */
    search(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const query = req.query.q;
                const limit = Number(req.query.limit) || 10;
                if (!query) {
                    return res.status(400).json({ message: "Search query is required" });
                }
                const businesses = yield business_service_1.default.searchBusinesses(query, limit);
                res.json(businesses);
            }
            catch (error) {
                res.status(500).json({ message: "Search failed", error });
            }
        });
    }
    /**
     * Get business settings
     */
    getSettings(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const { businessId } = req.params;
                const settings = yield business_service_1.default.getBusinessSettings(businessId);
                if (!settings) {
                    return res.status(404).json({ message: "Business settings not found" });
                }
                res.json(settings);
            }
            catch (error) {
                console.error('[v0] getSettings error:', error);
                const errorMessage = error instanceof Error ? error.message : String(error);
                res.status(500).json({ message: "Failed to fetch settings", error: errorMessage });
            }
        });
    }
    /**
     * Update business settings
     */
    updateSettings(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const { businessId } = req.params;
                const settings = yield business_service_1.default.updateBusinessSettings(businessId, req.body);
                res.json(settings);
            }
            catch (error) {
                console.error('[v0] updateSettings error:', error);
                const errorMessage = error instanceof Error ? error.message : String(error);
                res.status(500).json({ message: "Failed to update settings", error: errorMessage });
            }
        });
    }
}
exports.default = new BusinessController();
