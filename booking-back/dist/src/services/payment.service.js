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
exports.PaymentService = void 0;
const prisma_1 = __importDefault(require("../lib/prisma"));
class PaymentService {
    getBusinessPayments(businessId_1) {
        return __awaiter(this, arguments, void 0, function* (businessId, options = { skip: 0, limit: 10 }) {
            try {
                const where = {
                    subscription: {
                        businessId
                    }
                };
                if (options.status) {
                    where.status = options.status;
                }
                const payments = yield prisma_1.default.payment.findMany({
                    where,
                    include: {
                        subscription: {
                            include: { plan: true }
                        }
                    },
                    orderBy: { createdAt: 'desc' },
                    skip: options.skip,
                    take: options.limit
                });
                return payments;
            }
            catch (error) {
                console.error('[Payment] Error fetching business payments:', error);
                return [];
            }
        });
    }
    /**
     * Get business payments count
     */
    getBusinessPaymentsCount(businessId) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                return yield prisma_1.default.payment.count({
                    where: {
                        subscription: {
                            businessId
                        }
                    }
                });
            }
            catch (error) {
                console.error('[Payment] Error counting business payments:', error);
                return 0;
            }
        });
    }
    /**
     * Get payment by ID with ownership verification
     */
    getPaymentById(paymentId, businessId) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a;
            try {
                const payment = yield prisma_1.default.payment.findUnique({
                    where: { id: paymentId },
                    include: {
                        subscription: {
                            include: { plan: true }
                        }
                    }
                });
                if (!payment) {
                    return null;
                }
                // Verify business ownership
                if (((_a = payment.subscription) === null || _a === void 0 ? void 0 : _a.businessId) !== businessId) {
                    throw new Error('Unauthorized: This payment does not belong to your business');
                }
                return payment;
            }
            catch (error) {
                console.error('[Payment] Error fetching payment details:', error);
                throw error;
            }
        });
    }
    /**
     * Update payment status
     */
    updatePaymentStatus(paymentId, status, businessId) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a;
            try {
                // Verify ownership first
                const payment = yield prisma_1.default.payment.findUnique({
                    where: { id: paymentId },
                    include: { subscription: true }
                });
                if (!payment) {
                    throw new Error('Payment not found');
                }
                if (((_a = payment.subscription) === null || _a === void 0 ? void 0 : _a.businessId) !== businessId) {
                    throw new Error('Unauthorized: This payment does not belong to your business');
                }
                const updatedPayment = yield prisma_1.default.payment.update({
                    where: { id: paymentId },
                    data: { status },
                    include: { subscription: true }
                });
                yield this.logPaymentAction(paymentId, 'STATUS_UPDATED', status);
                return updatedPayment;
            }
            catch (error) {
                console.error('[Payment] Error updating payment status:', error);
                throw error;
            }
        });
    }
    /**
     * Refund payment
     */
    // async refundPayment(paymentId: string, businessId: string, reason?: string) {
    //   try {
    //     // Verify ownership first
    //     const payment = await prisma.payment.findUnique({
    //       where: { id: paymentId },
    //       include: { subscription: true }
    //     });
    //     if (!payment) {
    //       throw new Error('Payment not found');
    //     }
    //     if (payment.subscription?.businessId !== businessId) {
    //       throw new Error('Unauthorized: This payment does not belong to your business');
    //     }
    //     if (payment.status !== 'COMPLETED') {
    //       throw new Error('Only completed payments can be refunded');
    //     }
    //     const refundedPayment = await prisma.payment.update({
    //       where: { id: paymentId },
    //       data: {
    //         status: 'REFUNDED',
    //         refundedAt: new Date(),
    //         refundReason: reason
    //       },
    //       include: { subscription: true }
    //     });
    //     await this.logPaymentAction(paymentId, 'REFUNDED', 'REFUNDED', { reason });
    //     // Deactivate subscription if it was active
    //     if (refundedPayment.subscriptionId) {
    //       await prisma.subscription.update({
    //         where: { id: refundedPayment.subscriptionId },
    //         data: { status: 'CANCELLED' }
    //       });
    //     }
    //     return refundedPayment;
    //   } catch (error: any) {
    //     console.error('[Payment] Error refunding payment:', error);
    //     throw error;
    //   }
    // }
    /**
     * Log payment action
     */
    logPaymentAction(paymentId, action, status, metadata) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                console.log(`[Payment] Action: ${action} | Payment: ${paymentId} | Status: ${status}`, metadata || '');
                // TODO: Implement payment audit logging if needed
            }
            catch (error) {
                console.error('[Payment] Error logging action:', error);
            }
        });
    }
}
exports.PaymentService = PaymentService;
exports.default = new PaymentService();
