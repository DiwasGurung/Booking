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
const service_service_1 = __importDefault(require("../services/service.service"));
const validators_1 = require("../validators");
const validators_2 = require("../validators");
const subscription_service_1 = __importDefault(require("../services/subscription.service"));
class ServiceController {
    /**
     * Get all services (with optional businessId filter)
     */
    getAll(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const { businessId } = req.query;
                if (businessId) {
                    const services = yield service_service_1.default.getServicesByBusinessId(businessId);
                    return res.json({ data: services });
                }
                const services = yield service_service_1.default.getAllServices();
                res.json({ data: services });
            }
            catch (error) {
                console.error('[v0] Error getting services:', error);
                res.status(500).json({ message: "Failed to fetch services", error });
            }
        });
    }
    /**
     * Get service by ID
     */
    getById(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const validation = (0, validators_2.parseAndValidate)(validators_2.ServiceParamsSchema, req.params);
                if ((0, validators_1.isValidationError)(validation)) {
                    return res.status(400).json({ message: validation.error });
                }
                const service = yield service_service_1.default.getServiceById(validation.data.id);
                if (!service) {
                    return res.status(404).json({ message: "Service not found" });
                }
                res.json({ data: service });
            }
            catch (error) {
                console.error('[v0] Error getting service:', error);
                res.status(500).json({ message: "Failed to fetch service", error });
            }
        });
    }
    /**
     * Get services by business ID
     */
    getByBusinessId(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const validation = (0, validators_2.parseAndValidate)(validators_2.BusinessIdParamsSchema, req.params);
                if ((0, validators_1.isValidationError)(validation)) {
                    return res.status(400).json({ message: validation.error });
                }
                const services = yield service_service_1.default.getServicesByBusinessId(validation.data.businessId);
                res.json({ data: services });
            }
            catch (error) {
                console.error('[v0] Error getting services by business:', error);
                res.status(500).json({ message: "Failed to fetch services", error });
            }
        });
    }
    /**
     * Create service
     */
    create(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const validation = (0, validators_2.parseAndValidate)(validators_2.CreateServiceSchema, req.body);
                if ((0, validators_1.isValidationError)(validation)) {
                    return res.status(400).json({ message: validation.error });
                }
                const { businessId, name, description, price, duration } = validation.data;
                const serviceLimit = yield subscription_service_1.default.canAddService(businessId);
                if (!serviceLimit.allowed) {
                    console.warn('[v0] Service limit exceeded for business:', businessId);
                    return res.status(429).json({
                        message: serviceLimit.reason || 'Service limit reached. Please upgrade your subscription.',
                        error: 'SERVICE_LIMIT_EXCEEDED',
                        current: serviceLimit.current,
                        limit: serviceLimit.limit,
                    });
                }
                const service = yield service_service_1.default.createService({
                    businessId,
                    name,
                    description,
                    price,
                    duration,
                });
                res.status(201).json({ data: service });
            }
            catch (error) {
                console.error('[v0] Error creating service:', error);
                res.status(500).json({ message: "Failed to create service", error });
            }
        });
    }
    /**
     * Update service
     */
    update(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const paramsValidation = (0, validators_2.parseAndValidate)(validators_2.ServiceParamsSchema, req.params);
                if ((0, validators_1.isValidationError)(paramsValidation)) {
                    return res.status(400).json({ message: paramsValidation.error });
                }
                const bodyValidation = (0, validators_2.parseAndValidate)(validators_2.UpdateServiceSchema, req.body);
                if ((0, validators_1.isValidationError)(bodyValidation)) {
                    return res.status(400).json({ message: bodyValidation.error });
                }
                const { name, description, price, duration } = bodyValidation.data;
                const service = yield service_service_1.default.updateService(paramsValidation.data.id, {
                    name,
                    description,
                    price,
                    duration,
                });
                res.json({ data: service });
            }
            catch (error) {
                console.error('[v0] Error updating service:', error);
                res.status(500).json({ message: "Failed to update service", error });
            }
        });
    }
    /**
     * Delete service
     */
    delete(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const validation = (0, validators_2.parseAndValidate)(validators_2.ServiceParamsSchema, req.params);
                if ((0, validators_1.isValidationError)(validation)) {
                    return res.status(400).json({ message: validation.error });
                }
                yield service_service_1.default.deleteService(validation.data.id);
                res.json({ message: "Service deleted successfully" });
            }
            catch (error) {
                console.error('[v0] Error deleting service:', error);
                res.status(500).json({ message: "Failed to delete service", error });
            }
        });
    }
    /**
     * Get active services for a business
     */
    getActiveServices(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const validation = (0, validators_2.parseAndValidate)(validators_2.BusinessIdParamsSchema, req.params);
                if ((0, validators_1.isValidationError)(validation)) {
                    return res.status(400).json({ message: validation.error });
                }
                const services = yield service_service_1.default.getActiveServices(validation.data.businessId);
                res.json({ data: services });
            }
            catch (error) {
                console.error('[v0] Error getting active services:', error);
                res.status(500).json({ message: "Failed to fetch active services", error });
            }
        });
    }
    /**
     * Get services with booking statistics
     */
    withStats(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const validation = (0, validators_2.parseAndValidate)(validators_2.BusinessIdParamsSchema, req.params);
                if ((0, validators_1.isValidationError)(validation)) {
                    return res.status(400).json({ message: validation.error });
                }
                const servicesWithStats = yield service_service_1.default.getServicesWithStats(validation.data.businessId);
                res.json({ data: servicesWithStats });
            }
            catch (error) {
                console.error('[v0] Error getting services with stats:', error);
                res.status(500).json({ message: "Failed to fetch services with stats", error });
            }
        });
    }
}
exports.default = new ServiceController();
