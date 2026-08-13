import { Request, Response } from "express"
import ReviewService from "../services/review.service.js"

class ReviewController {
  /**
   * Create review
   */
  async create(req: Request, res: Response) {
    try {
      const review = await ReviewService.createReview(req.body)
      res.status(201).json(review)
    } catch (error: any) {
      res.status(400).json({ message: error.message || "Failed to create review" })
    }
  }

  /**
   * Get review by ID
   */
  async getById(req: Request, res: Response) {
    try {
      const { id } = req.params
      const review = await ReviewService.getReviewById(id as string)

      if (!review) {
        return res.status(404).json({ message: "Review not found" })
      }

      res.json(review)
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch review", error })
    }
  }

  /**
   * Get reviews for a business
   */
  async getBusinessReviews(req: Request, res: Response) {
    try {
      const { businessId } = req.params
      const page = Number(req.query.page) || 1
      const limit = Number(req.query.limit) || 10

      const result = await ReviewService.getBusinessReviews(
        businessId as string,
        page,
        limit,
      )

      res.json(result)
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch reviews", error })
    }
  }

  /**
   * Update review
   */
  async update(req: Request, res: Response) {
    try {
      const { id } = req.params
      const review = await ReviewService.updateReview(id as string, req.body)
      res.json(review)
    } catch (error) {
      res.status(500).json({ message: "Failed to update review", error })
    }
  }

  /**
   * Delete review
   */
  async delete(req: Request, res: Response) {
    try {
      const { id } = req.params
      const review = await ReviewService.deleteReview(id as string)
      res.json(review)
    } catch (error) {
      res.status(500).json({ message: "Failed to delete review", error })
    }
  }

  /**
   * Review statistics for business
   */
  async stats(req: Request, res: Response) {
    try {
      const { businessId } = req.params
      const stats = await ReviewService.getReviewStats(businessId as string)
      res.json(stats)
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch review stats", error })
    }
  }
}

export default new ReviewController()
