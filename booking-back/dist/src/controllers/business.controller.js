"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const business_service_1 = __importDefault(require("../services/business.service"));
const subscription_service_1 = __importDefault(require("../services/subscription.service"));
const customer_service_1 = __importDefault(require("../services/customer.service"));
const slug_1 = require("../utils/slug");
const branchIdFrom = (req) => typeof req.query.branchId === 'string' && req.query.branchId ? req.query.branchId : undefined;
// Only these fields may be changed through the generic PUT /:id route
const UPDATABLE_FIELDS = [
    'name', 'description', 'email', 'phone', 'website', 'category',
    'address', 'city', 'state', 'zipCode', 'country', 'latitude', 'longitude',
];
class BusinessController {
    /** Setup basic business info (registration flow). Role change happens inside createBusiness. */
    async setupBasic(req, res) {
        try {
            const userId = req.userId;
            if (!userId)
                return res.status(401).json({ error: 'Not authenticated' });
            const business = await business_service_1.default.createBusiness({ ...req.body, userId });
            res.status(201).json(business);
        }
        catch (error) {
            const message = error instanceof Error ? error.message : String(error);
            if (message === "This user already has a business")
                return res.status(409).json({ error: message });
            if (message === "userId is required to create a business")
                return res.status(400).json({ error: message });
            console.error('[Business Setup] Error:', message);
            res.status(500).json({ error: "Failed to create business" });
        }
    }
    async getCurrentBusiness(req, res) {
        try {
            const userId = req.userId;
            if (!userId)
                return res.status(401).json({ message: "Not authenticated" });
            const business = await business_service_1.default.getBusinessByUserId(userId);
            if (!business)
                return res.status(404).json({ message: "No business found for this user" });
            res.json(business);
        }
        catch (error) {
            console.error('[Business] getCurrentBusiness error:', error);
            res.status(500).json({ message: "Failed to fetch current business" });
        }
    }
    /** Create business for the logged-in user (userId comes from the session, never the body). */
    async create(req, res) {
        try {
            const userId = req.userId;
            if (!userId)
                return res.status(401).json({ message: "Not authenticated" });
            // createBusiness already creates the Main branch in the same transaction
            const business = await business_service_1.default.createBusiness({ ...req.body, userId });
            res.status(201).json(business);
        }
        catch (error) {
            const message = error instanceof Error ? error.message : String(error);
            if (message === "This user already has a business")
                return res.status(409).json({ message });
            if (message === "userId is required to create a business")
                return res.status(400).json({ message });
            console.error('[Business] create error:', message);
            res.status(500).json({ message: "Failed to create business" });
        }
    }
    async getById(req, res) {
        try {
            const business = await business_service_1.default.getBusinessById(req.params.id);
            if (!business)
                return res.status(404).json({ message: "Business not found" });
            res.json(business);
        }
        catch (error) {
            res.status(500).json({ message: "Failed to fetch business" });
        }
    }
    async customerInsights(req, res) {
        try {
            const businessId = req.params.businessId;
            const subscription = await subscription_service_1.default.getSubscriptionStatus(businessId);
            if (!subscription.hasSubscription || !subscription.planName?.toLowerCase().includes('enterprise')) {
                return res.status(403).json({ error: 'Customer loyalty insights require an Enterprise subscription' });
            }
            const insights = await customer_service_1.default.getBusinessInsights(businessId, branchIdFrom(req));
            return res.json({ insights });
        }
        catch (error) {
            console.error('[Business] customerInsights error:', error);
            return res.status(500).json({ error: 'Failed to load customer insights' });
        }
    }
    async checkSlug(req, res) {
        try {
            const { businessId } = req.params;
            const slug = String(req.query.slug || '').toLowerCase().trim();
            const invalid = (0, slug_1.validateSlug)(slug);
            if (invalid)
                return res.json({ available: false, reason: invalid });
            const available = await business_service_1.default.isSlugAvailable(slug, businessId);
            res.json({ available, reason: available ? null : 'Already taken' });
        }
        catch (error) {
            console.error('[Business] checkSlug error:', error);
            res.status(500).json({ message: 'Failed to check slug' });
        }
    }
    async updateSlug(req, res) {
        try {
            const { businessId } = req.params;
            const slug = String(req.body.slug || '').toLowerCase().trim();
            const invalid = (0, slug_1.validateSlug)(slug);
            if (invalid)
                return res.status(400).json({ message: invalid });
            const updated = await business_service_1.default.updateSlug(businessId, slug);
            res.json(updated);
        }
        catch (error) {
            if (error?.code === 'P2002')
                return res.status(409).json({ message: 'This slug is already taken' });
            console.error('[Business] updateSlug error:', error);
            res.status(500).json({ message: 'Failed to update slug' });
        }
    }
    async getByUserId(req, res) {
        try {
            // A user may only look up their own business
            if (req.params.userId !== req.userId)
                return res.status(403).json({ message: "Forbidden" });
            const business = await business_service_1.default.getBusinessByUserId(req.params.userId);
            if (!business)
                return res.status(404).json({ message: "Business not found" });
            res.json(business);
        }
        catch (error) {
            res.status(500).json({ message: "Failed to fetch business" });
        }
    }
    async update(req, res) {
        try {
            // Whitelist: never pass req.body straight to Prisma (it could set smsCredits, userId, isVerified...)
            const data = {};
            for (const key of UPDATABLE_FIELDS) {
                if (req.body[key] !== undefined)
                    data[key] = req.body[key];
            }
            const business = await business_service_1.default.updateBusiness(req.params.id, data);
            res.json(business);
        }
        catch (error) {
            console.error('[Business] update error:', error);
            res.status(500).json({ message: "Failed to update business" });
        }
    }
    async delete(req, res) {
        try {
            const business = await business_service_1.default.deleteBusiness(req.params.id);
            res.json(business);
        }
        catch (error) {
            res.status(500).json({ message: "Failed to delete business" });
        }
    }
    async getAll(req, res) {
        try {
            const page = Number(req.query.page) || 1;
            const limit = Math.min(Number(req.query.limit) || 10, 100);
            const category = req.query.category;
            const isActive = req.query.isActive !== undefined ? req.query.isActive === "true" : undefined;
            res.json(await business_service_1.default.getAllBusinesses(page, limit, category, isActive));
        }
        catch (error) {
            res.status(500).json({ message: "Failed to fetch businesses" });
        }
    }
    async stats(req, res) {
        try {
            const stats = await business_service_1.default.getBusinessStats(req.params.businessId, branchIdFrom(req));
            res.json(stats);
        }
        catch (error) {
            res.status(500).json({ message: "Failed to fetch statistics" });
        }
    }
    async analytics(req, res) {
        try {
            const days = Number(req.query.days) || 30;
            const analytics = await business_service_1.default.getBusinessAnalytics(req.params.businessId, days, branchIdFrom(req));
            res.json(analytics);
        }
        catch (error) {
            console.error('[Business] analytics error:', error);
            res.status(500).json({ message: 'Failed to fetch analytics' });
        }
    }
    async search(req, res) {
        try {
            const query = req.query.q;
            const limit = Math.min(Number(req.query.limit) || 10, 50);
            if (!query)
                return res.status(400).json({ message: "Search query is required" });
            res.json(await business_service_1.default.searchBusinesses(query, limit));
        }
        catch (error) {
            res.status(500).json({ message: "Search failed" });
        }
    }
    async getSettings(req, res) {
        try {
            const settings = await business_service_1.default.getBusinessSettings(req.params.businessId);
            if (!settings)
                return res.status(404).json({ message: "Business settings not found" });
            res.json(settings);
        }
        catch (error) {
            console.error('[Business] getSettings error:', error);
            res.status(500).json({ message: "Failed to fetch settings" });
        }
    }
    async getPublicById(req, res) {
        try {
            const business = await business_service_1.default.getPublicBusinessById(req.params.id);
            if (!business || !business.isActive)
                return res.status(404).json({ message: "Business not found" });
            res.json(business);
        }
        catch (error) {
            console.error('[Business] getPublicById error:', error);
            res.status(500).json({ message: "Failed to fetch business" });
        }
    }
    async updateSettings(req, res) {
        try {
            const settings = await business_service_1.default.updateBusinessSettings(req.params.businessId, req.body);
            res.json(settings);
        }
        catch (error) {
            console.error('[Business] updateSettings error:', error);
            const message = error instanceof Error ? error.message : String(error);
            res.status(500).json({ message: "Failed to update settings", error: message });
        }
    }
}
exports.default = new BusinessController();
