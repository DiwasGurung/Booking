"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const review_service_js_1 = __importDefault(require("../services/review.service.js"));
class ReviewController {
    /**
     * Create review
     */
    async create(req, res) {
        try {
            const review = await review_service_js_1.default.createReview(req.body);
            res.status(201).json(review);
        }
        catch (error) {
            res.status(400).json({ message: error.message || "Failed to create review" });
        }
    }
    /**
     * Get review by ID
     */
    async getById(req, res) {
        try {
            const { id } = req.params;
            const review = await review_service_js_1.default.getReviewById(id);
            if (!review) {
                return res.status(404).json({ message: "Review not found" });
            }
            res.json(review);
        }
        catch (error) {
            res.status(500).json({ message: "Failed to fetch review", error });
        }
    }
    /**
     * Get reviews for a business
     */
    async getBusinessReviews(req, res) {
        try {
            const { businessId } = req.params;
            const page = Number(req.query.page) || 1;
            const limit = Number(req.query.limit) || 10;
            const result = await review_service_js_1.default.getBusinessReviews(businessId, page, limit);
            res.json(result);
        }
        catch (error) {
            res.status(500).json({ message: "Failed to fetch reviews", error });
        }
    }
    /**
     * Update review
     */
    async update(req, res) {
        try {
            const { id } = req.params;
            const review = await review_service_js_1.default.updateReview(id, req.body);
            res.json(review);
        }
        catch (error) {
            res.status(500).json({ message: "Failed to update review", error });
        }
    }
    /**
     * Delete review
     */
    async delete(req, res) {
        try {
            const { id } = req.params;
            const review = await review_service_js_1.default.deleteReview(id);
            res.json(review);
        }
        catch (error) {
            res.status(500).json({ message: "Failed to delete review", error });
        }
    }
    /**
     * Review statistics for business
     */
    async stats(req, res) {
        try {
            const { businessId } = req.params;
            const stats = await review_service_js_1.default.getReviewStats(businessId);
            res.json(stats);
        }
        catch (error) {
            res.status(500).json({ message: "Failed to fetch review stats", error });
        }
    }
}
exports.default = new ReviewController();
