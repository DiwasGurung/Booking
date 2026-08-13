import  prisma  from "../lib/prisma.js"
import type { Review, Prisma } from "@prisma/client"

export class ReviewService {
  /**
   * Create a new review
   */
  async createReview(data: {
    businessId: string
    userId: string
    rating: number
    title?: string
    comment?: string
  }): Promise<Review> {
    if (data.rating < 1 || data.rating > 5) {
      throw new Error("Rating must be between 1 and 5")
    }

    return prisma.review.create({
      data,
    })
  }

  /**
   * Get review by ID
   */
  async getReviewById(id: string): Promise<Review | null> {
    return prisma.review.findUnique({
      where: { id },
      include: { user: true, business: true },
    })
  }

  /**
   * Get all reviews for a business
   */
  async getBusinessReviews(businessId: string, page = 1, limit = 10): Promise<{ reviews: Review[]; total: number }> {
    const skip = (page - 1) * limit

    const [reviews, total] = await Promise.all([
      prisma.review.findMany({
        where: { businessId },
        skip,
        take: limit,
        include: { user: true },
        orderBy: { createdAt: "desc" },
      }),
      prisma.review.count({ where: { businessId } }),
    ])

    return { reviews, total }
  }

  /**
   * Update review
   */
  async updateReview(id: string, data: Prisma.ReviewUpdateInput): Promise<Review> {
    return prisma.review.update({
      where: { id },
      data,
    })
  }

  /**
   * Delete review
   */
  async deleteReview(id: string): Promise<Review> {
    return prisma.review.delete({
      where: { id },
    })
  }

  /**
   * Get review statistics
   */
  async getReviewStats(businessId: string) {
    const reviews = await prisma.review.findMany({
      where: { businessId },
      select: { rating: true },
    })

    if (reviews.length === 0) {
      return { averageRating: 0, totalReviews: 0, distribution: {} }
    }

    const averageRating = reviews.reduce((sum: any, r: any) => sum + r.rating, 0) / reviews.length

    const distribution = {
      5: reviews.filter((r:any) => r.rating === 5).length,
      4: reviews.filter((r:any) => r.rating === 4).length,
      3: reviews.filter((r:any) => r.rating === 3).length,
      2: reviews.filter((r:any) => r.rating === 2).length,
      1: reviews.filter((r:any) => r.rating === 1).length,
    }

    return {
      averageRating: Math.round(averageRating * 10) / 10,
      totalReviews: reviews.length,
      distribution,
    }
  }
}

export default new ReviewService()

