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
const review_service_1 = __importDefault(require("../services/review.service"));
class ReviewController {
    /**
     * Create review
     */
    create(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const review = yield review_service_1.default.createReview(req.body);
                res.status(201).json(review);
            }
            catch (error) {
                res.status(400).json({ message: error.message || "Failed to create review" });
            }
        });
    }
    /**
     * Get review by ID
     */
    getById(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const { id } = req.params;
                const review = yield review_service_1.default.getReviewById(id);
                if (!review) {
                    return res.status(404).json({ message: "Review not found" });
                }
                res.json(review);
            }
            catch (error) {
                res.status(500).json({ message: "Failed to fetch review", error });
            }
        });
    }
    /**
     * Get reviews for a business
     */
    getBusinessReviews(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const { businessId } = req.params;
                const page = Number(req.query.page) || 1;
                const limit = Number(req.query.limit) || 10;
                const result = yield review_service_1.default.getBusinessReviews(businessId, page, limit);
                res.json(result);
            }
            catch (error) {
                res.status(500).json({ message: "Failed to fetch reviews", error });
            }
        });
    }
    /**
     * Update review
     */
    update(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const { id } = req.params;
                const review = yield review_service_1.default.updateReview(id, req.body);
                res.json(review);
            }
            catch (error) {
                res.status(500).json({ message: "Failed to update review", error });
            }
        });
    }
    /**
     * Delete review
     */
    delete(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const { id } = req.params;
                const review = yield review_service_1.default.deleteReview(id);
                res.json(review);
            }
            catch (error) {
                res.status(500).json({ message: "Failed to delete review", error });
            }
        });
    }
    /**
     * Review statistics for business
     */
    stats(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const { businessId } = req.params;
                const stats = yield review_service_1.default.getReviewStats(businessId);
                res.json(stats);
            }
            catch (error) {
                res.status(500).json({ message: "Failed to fetch review stats", error });
            }
        });
    }
}
exports.default = new ReviewController();
