"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const business_service_1 = __importDefault(require("../services/business.service"));
const user_service_1 = require("../services/user.service");
const subscription_service_1 = __importDefault(require("../services/subscription.service"));
const customer_service_1 = __importDefault(require("../services/customer.service"));
const slug_1 = require("../utils/slug");
const prisma_1 = __importDefault(require("../lib/prisma"));
class BusinessController {
    constructor() {
    }
    /**
     * Setup basic business info (for registration flow)
     */
    async setupBasic(req, res) {
        try {
            const userId = req.userId;
            if (!userId) {
                return res.status(401).json({ error: 'Not authenticated' });
            }
            const business = await business_service_1.default.createBusiness({
                ...req.body,
                userId
            });
            await user_service_1.userService.updateUserRole(userId, 'BUSINESS_OWNER');
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
    }
    async getCurrentBusiness(req, res) {
        try {
            const userId = req.userId;
            if (!userId) {
                return res.status(401).json({ message: "Not authenticated" });
            }
            const business = await business_service_1.default.getBusinessByUserId(userId);
            if (!business) {
                return res.status(404).json({ message: "No business found for this user" });
            }
            res.json(business);
        }
        catch (error) {
            console.error('[v0] Error getting current business:', error);
            res.status(500).json({ message: "Failed to fetch current business", error });
        }
    }
    /**
     * Create business
     */
    async create(req, res) {
        try {
            const business = await business_service_1.default.createBusiness(req.body);
            // inside your create-business flow, after creating the business
            await prisma_1.default.branch.create({
                data: {
                    businessId: business.id,
                    name: 'Main Branch',
                    phone: business.phone,
                    address: business.address,
                    city: business.city,
                    state: business.state,
                    latitude: business.latitude,
                    longitude: business.longitude,
                    isMain: true,
                },
            });
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
    async customerInsights(req, res) {
        try {
            const businessId = req.params.businessId;
            const subscription = await subscription_service_1.default.getSubscriptionStatus(businessId);
            if (!subscription.hasSubscription || !subscription.planName?.toLowerCase().includes('enterprise')) {
                return res.status(403).json({ error: 'Customer loyalty insights require an Enterprise subscription' });
            }
            return res.json({ insights: await customer_service_1.default.getBusinessInsights(businessId) });
        }
        catch (error) {
            return res.status(500).json({ error: 'Failed to load customer insights' });
        }
    }
    /**
   * Check if a slug is available (owner only)
   */
    async checkSlug(req, res) {
        try {
            const { businessId } = req.params;
            const slug = String(req.query.slug || '').toLowerCase().trim();
            const invalid = (0, slug_1.validateSlug)(slug);
            if (invalid)
                return res.json({ available: false, reason: invalid });
            const owned = await business_service_1.default.getBusinessByUserId(req.userId);
            if (!owned || owned.id !== businessId) {
                return res.status(403).json({ message: 'Forbidden' });
            }
            const available = await business_service_1.default.isSlugAvailable(slug, businessId);
            res.json({ available, reason: available ? null : 'Already taken' });
        }
        catch (error) {
            console.error('[Business] checkSlug error:', error);
            res.status(500).json({ message: 'Failed to check slug' });
        }
    }
    /**
     * Update booking slug (owner only)
     */
    async updateSlug(req, res) {
        try {
            const { businessId } = req.params;
            const slug = String(req.body.slug || '').toLowerCase().trim();
            const invalid = (0, slug_1.validateSlug)(slug);
            if (invalid)
                return res.status(400).json({ message: invalid });
            const owned = await business_service_1.default.getBusinessByUserId(req.userId);
            if (!owned || owned.id !== businessId) {
                return res.status(403).json({ message: 'Forbidden' });
            }
            const updated = await business_service_1.default.updateSlug(businessId, slug);
            res.json(updated);
        }
        catch (error) {
            if (error?.code === 'P2002') {
                return res.status(409).json({ message: 'This slug is already taken' });
            }
            console.error('[Business] updateSlug error:', error);
            res.status(500).json({ message: 'Failed to update slug' });
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
    async stats(req, res) {
        try {
            const { businessId } = req.params;
            const branchId = typeof req.query.branchId === 'string' ? req.query.branchId : undefined;
            const stats = await business_service_1.default.getBusinessStats(businessId, branchId);
            res.json(stats);
        }
        catch (error) {
            res.status(500).json({ message: "Failed to fetch statistics", error });
        }
    }
    async analytics(req, res) {
        try {
            const days = Number(req.query.days) || 30;
            const branchId = typeof req.query.branchId === 'string' ? req.query.branchId : undefined;
            const analytics = await business_service_1.default.getBusinessAnalytics(req.params.businessId, days, branchId);
            res.json(analytics);
        }
        catch (error) {
            res.status(500).json({ message: 'Failed to fetch analytics', error });
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
    /**
     * Get business settings
     */
    async getSettings(req, res) {
        try {
            const { businessId } = req.params;
            const settings = await business_service_1.default.getBusinessSettings(businessId);
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
    }
    /**
   * Get public business profile (safe fields only, no auth required)
   */
    async getPublicById(req, res) {
        try {
            const { id } = req.params;
            const business = await business_service_1.default.getPublicBusinessById(id);
            if (!business || !business.isActive) {
                return res.status(404).json({ message: "Business not found" });
            }
            res.json(business);
        }
        catch (error) {
            console.error('[Business] getPublicById error:', error);
            res.status(500).json({ message: "Failed to fetch business" });
        }
    }
    /**
     * Update business settings
     */
    async updateSettings(req, res) {
        try {
            const { businessId } = req.params;
            const settings = await business_service_1.default.updateBusinessSettings(businessId, req.body);
            res.json(settings);
        }
        catch (error) {
            console.error('[v0] updateSettings error:', error);
            const errorMessage = error instanceof Error ? error.message : String(error);
            res.status(500).json({ message: "Failed to update settings", error: errorMessage });
        }
    }
}
exports.default = new BusinessController();
