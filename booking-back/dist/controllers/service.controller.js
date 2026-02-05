"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const service_service_1 = __importDefault(require("../services/service.service"));
class ServiceController {
    /**
     * Create service
     */
    async create(req, res) {
        try {
            const service = await service_service_1.default.createService(req.body);
            res.status(201).json(service);
        }
        catch (error) {
            res.status(500).json({ message: "Failed to create service", error });
        }
    }
    /**
     * Get service by ID
     */
    async getById(req, res) {
        try {
            const { id } = req.params;
            const service = await service_service_1.default.getServiceById(id);
            if (!service) {
                return res.status(404).json({ message: "Service not found" });
            }
            res.json(service);
        }
        catch (error) {
            res.status(500).json({ message: "Failed to fetch service", error });
        }
    }
    /**
     * Get all services for a business
     */
    async getBusinessServices(req, res) {
        try {
            const { businessId } = req.params;
            const services = await service_service_1.default.getBusinessServices(businessId);
            res.json(services);
        }
        catch (error) {
            res.status(500).json({ message: "Failed to fetch services", error });
        }
    }
    /**
     * Get active services for a business
     */
    async getActiveServices(req, res) {
        try {
            const { businessId } = req.params;
            const services = await service_service_1.default.getActiveServices(businessId);
            res.json(services);
        }
        catch (error) {
            res.status(500).json({ message: "Failed to fetch active services", error });
        }
    }
    /**
     * Update service
     */
    async update(req, res) {
        try {
            const { id } = req.params;
            const service = await service_service_1.default.updateService(id, req.body);
            res.json(service);
        }
        catch (error) {
            res.status(500).json({ message: "Failed to update service", error });
        }
    }
    /**
     * Delete service
     */
    async delete(req, res) {
        try {
            const { id } = req.params;
            const service = await service_service_1.default.deleteService(id);
            res.json(service);
        }
        catch (error) {
            res.status(500).json({ message: "Failed to delete service", error });
        }
    }
    /**
     * Services with booking stats
     */
    async withStats(req, res) {
        try {
            const { businessId } = req.params;
            const services = await service_service_1.default.getServicesWithStats(businessId);
            res.json(services);
        }
        catch (error) {
            res.status(500).json({ message: "Failed to fetch service stats", error });
        }
    }
}
exports.default = new ServiceController();
