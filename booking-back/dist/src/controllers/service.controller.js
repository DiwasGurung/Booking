"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const service_service_1 = __importDefault(require("../services/service.service"));
const index_1 = require("../validators/index");
const index_2 = require("../validators/index");
const subscription_service_1 = __importDefault(require("../services/subscription.service"));
class ServiceController {
    /**
     * Get all services (with optional businessId filter)
     */
    async getAll(req, res) {
        try {
            const { businessId } = req.query;
            if (businessId) {
                const services = await service_service_1.default.getServicesByBusinessId(businessId);
                return res.json({ data: services });
            }
            const services = await service_service_1.default.getAllServices();
            res.json({ data: services });
        }
        catch (error) {
            console.error('[v0] Error getting services:', error);
            res.status(500).json({ message: "Failed to fetch services", error });
        }
    }
    /**
     * Get service by ID
     */
    async getById(req, res) {
        try {
            const validation = (0, index_2.parseAndValidate)(index_2.ServiceParamsSchema, req.params);
            if ((0, index_1.isValidationError)(validation)) {
                return res.status(400).json({ message: validation.error });
            }
            const service = await service_service_1.default.getServiceById(validation.data.id);
            if (!service) {
                return res.status(404).json({ message: "Service not found" });
            }
            res.json({ data: service });
        }
        catch (error) {
            console.error('[v0] Error getting service:', error);
            res.status(500).json({ message: "Failed to fetch service", error });
        }
    }
    /**
     * Get services by business ID
     */
    async getByBusinessId(req, res) {
        try {
            const validation = (0, index_2.parseAndValidate)(index_2.BusinessIdParamsSchema, req.params);
            if ((0, index_1.isValidationError)(validation)) {
                return res.status(400).json({ message: validation.error });
            }
            const services = await service_service_1.default.getServicesByBusinessId(validation.data.businessId);
            res.json({ data: services });
        }
        catch (error) {
            console.error('[v0] Error getting services by business:', error);
            res.status(500).json({ message: "Failed to fetch services", error });
        }
    }
    /**
     * Create service
     */
    async create(req, res) {
        try {
            const validation = (0, index_2.parseAndValidate)(index_2.CreateServiceSchema, req.body);
            if ((0, index_1.isValidationError)(validation)) {
                return res.status(400).json({ message: validation.error });
            }
            const { businessId, name, description, price, duration, offerPrice } = validation.data;
            // Convert offerPrice to number or null
            const offerPriceNumber = offerPrice !== undefined ? (offerPrice !== null ? Number(offerPrice) : null) : undefined;
            const serviceLimit = await subscription_service_1.default.canAddService(businessId);
            if (!serviceLimit.allowed) {
                console.warn('[v0] Service limit exceeded for business:', businessId);
                return res.status(429).json({
                    message: serviceLimit.reason || 'Service limit reached. Please upgrade your subscription.',
                    error: 'SERVICE_LIMIT_EXCEEDED',
                    current: serviceLimit.current,
                    limit: serviceLimit.limit,
                    overLimit: true,
                });
            }
            const service = await service_service_1.default.createService({
                businessId,
                name,
                description,
                price,
                duration,
                offerPrice: offerPriceNumber,
            });
            res.status(201).json({ data: service });
        }
        catch (error) {
            console.error('[v0] Error creating service:', error);
            res.status(500).json({ message: "Failed to create service", error });
        }
    }
    /**
     * Update service
     */
    async update(req, res) {
        try {
            const paramsValidation = (0, index_2.parseAndValidate)(index_2.ServiceParamsSchema, req.params);
            if ((0, index_1.isValidationError)(paramsValidation)) {
                return res.status(400).json({ message: paramsValidation.error });
            }
            const bodyValidation = (0, index_2.parseAndValidate)(index_2.UpdateServiceSchema, req.body);
            if ((0, index_1.isValidationError)(bodyValidation)) {
                return res.status(400).json({ message: bodyValidation.error });
            }
            const { name, description, price, duration, offerPrice } = bodyValidation.data;
            // Convert offerPrice to number or null
            const offerPriceNumber = offerPrice !== undefined ? (offerPrice !== null ? Number(offerPrice) : null) : undefined;
            const updateData = {
                name,
                description,
                price,
                duration,
            };
            if (offerPrice !== undefined) {
                updateData.offerPrice = offerPriceNumber;
            }
            const service = await service_service_1.default.updateService(paramsValidation.data.id, updateData);
            res.json({ data: service });
        }
        catch (error) {
            console.error('[v0] Error updating service:', error);
            res.status(500).json({ message: "Failed to update service", error });
        }
    }
    /**
     * Delete service
     */
    async delete(req, res) {
        try {
            const validation = (0, index_2.parseAndValidate)(index_2.ServiceParamsSchema, req.params);
            if ((0, index_1.isValidationError)(validation)) {
                return res.status(400).json({ message: validation.error });
            }
            await service_service_1.default.deleteService(validation.data.id);
            res.json({ message: "Service deleted successfully" });
        }
        catch (error) {
            console.error('[v0] Error deleting service:', error);
            res.status(500).json({ message: "Failed to delete service", error });
        }
    }
    /**
     * Get active services for a business
     */
    async getActiveServices(req, res) {
        try {
            const validation = (0, index_2.parseAndValidate)(index_2.BusinessIdParamsSchema, req.params);
            if ((0, index_1.isValidationError)(validation)) {
                return res.status(400).json({ message: validation.error });
            }
            const services = await service_service_1.default.getActiveServices(validation.data.businessId);
            res.json({ data: services });
        }
        catch (error) {
            console.error('[v0] Error getting active services:', error);
            res.status(500).json({ message: "Failed to fetch active services", error });
        }
    }
    /**
     * Get services with booking statistics
     */
    async withStats(req, res) {
        try {
            const validation = (0, index_2.parseAndValidate)(index_2.BusinessIdParamsSchema, req.params);
            if ((0, index_1.isValidationError)(validation)) {
                return res.status(400).json({ message: validation.error });
            }
            const servicesWithStats = await service_service_1.default.getServicesWithStats(validation.data.businessId);
            res.json({ data: servicesWithStats });
        }
        catch (error) {
            console.error('[v0] Error getting services with stats:', error);
            res.status(500).json({ message: "Failed to fetch services with stats", error });
        }
    }
}
exports.default = new ServiceController();
