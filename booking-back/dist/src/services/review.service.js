"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ReviewService = void 0;
const prisma_1 = __importDefault(require("../lib/prisma"));
class ReviewService {
    /**
     * Create a new review
     */
    async createReview(data) {
        if (data.rating < 1 || data.rating > 5) {
            throw new Error("Rating must be between 1 and 5");
        }
        return prisma_1.default.review.create({
            data,
        });
    }
    /**
     * Get review by ID
     */
    async getReviewById(id) {
        return prisma_1.default.review.findUnique({
            where: { id },
            include: { user: true, business: true },
        });
    }
    /**
     * Get all reviews for a business
     */
    async getBusinessReviews(businessId, page = 1, limit = 10) {
        const skip = (page - 1) * limit;
        const [reviews, total] = await Promise.all([
            prisma_1.default.review.findMany({
                where: { businessId },
                skip,
                take: limit,
                include: { user: true },
                orderBy: { createdAt: "desc" },
            }),
            prisma_1.default.review.count({ where: { businessId } }),
        ]);
        return { reviews, total };
    }
    /**
     * Update review
     */
    async updateReview(id, data) {
        return prisma_1.default.review.update({
            where: { id },
            data,
        });
    }
    /**
     * Delete review
     */
    async deleteReview(id) {
        return prisma_1.default.review.delete({
            where: { id },
        });
    }
    /**
     * Get review statistics
     */
    async getReviewStats(businessId) {
        const reviews = await prisma_1.default.review.findMany({
            where: { businessId },
            select: { rating: true },
        });
        if (reviews.length === 0) {
            return { averageRating: 0, totalReviews: 0, distribution: {} };
        }
        const averageRating = reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length;
        const distribution = {
            5: reviews.filter((r) => r.rating === 5).length,
            4: reviews.filter((r) => r.rating === 4).length,
            3: reviews.filter((r) => r.rating === 3).length,
            2: reviews.filter((r) => r.rating === 2).length,
            1: reviews.filter((r) => r.rating === 1).length,
        };
        return {
            averageRating: Math.round(averageRating * 10) / 10,
            totalReviews: reviews.length,
            distribution,
        };
    }
}
exports.ReviewService = ReviewService;
exports.default = new ReviewService();
