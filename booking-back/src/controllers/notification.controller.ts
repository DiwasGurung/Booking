import { Request, Response } from "express"
import NotificationService from "../services/notification.service.js"

class NotificationController {
  /**
   * Create notification
   */
  async create(req: Request, res: Response) {
    try {
      const notification = await NotificationService.createNotification(req.body)
      res.status(201).json(notification)
    } catch (error) {
      res.status(500).json({ message: "Failed to create notification", error })
    }
  }

  /**
   * Get notification by ID
   */
  async getById(req: Request, res: Response) {
    try {
      const { id } = req.params
      const notification = await NotificationService.getNotificationById(id as string)

      if (!notification) {
        return res.status(404).json({ message: "Notification not found" })
      }

      res.json(notification)
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch notification", error })
    }
  }

  /**
   * Get user notifications
   */
  async getUserNotifications(req: Request, res: Response) {
    try {
      const { userId } = req.params
      const page = Number(req.query.page) || 1
      const limit = Number(req.query.limit) || 20
      const unreadOnly = req.query.unreadOnly === "true"

      const result = await NotificationService.getUserNotifications(
        userId as string,
        page,
        limit,
        unreadOnly,
      )

      res.json(result)
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch notifications", error })
    }
  }

  /**
   * Mark notification as read
   */
  async markAsRead(req: Request, res: Response) {
    try {
      const { id } = req.params
      const notification = await NotificationService.markAsRead(id as string)
      res.json(notification)
    } catch (error) {
      res.status(500).json({ message: "Failed to mark notification as read", error })
    }
  }

  /**
   * Mark all notifications as read
   */
  async markAllAsRead(req: Request, res: Response) {
    try {
      const { userId } = req.params
      const count = await NotificationService.markAllAsRead(userId as string)
      res.json({ updated: count })
    } catch (error) {
      res.status(500).json({ message: "Failed to mark notifications as read", error })
    }
  }

  /**
   * Delete notification
   */
  async delete(req: Request, res: Response) {
    try {
      const { id } = req.params
      const notification = await NotificationService.deleteNotification(id as string)
      res.json(notification)
    } catch (error) {
      res.status(500).json({ message: "Failed to delete notification", error })
    }
  }

  /**
   * Get unread notifications count
   */
  async unreadCount(req: Request, res: Response) {
    try {
      const { userId } = req.params
      const count = await NotificationService.getUnreadCount(userId as string)
      res.json({ unreadCount: count })
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch unread count", error })
    }
  }
}

export default new NotificationController()
