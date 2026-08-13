"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const customer_service_js_1 = __importDefault(require("../services/customer.service.js"));
class CustomerController {
    /**
     * Create customer
     */
    async create(req, res) {
        try {
            const customer = await customer_service_js_1.default.createCustomer(req.body);
            res.status(201).json(customer);
        }
        catch (error) {
            res.status(500).json({ message: "Failed to create customer", error });
        }
    }
    /**
     * Get customer by ID
     */
    async getById(req, res) {
        try {
            const { id } = req.params;
            const customer = await customer_service_js_1.default.getCustomerById(id);
            if (!customer) {
                return res.status(404).json({ message: "Customer not found" });
            }
            res.json(customer);
        }
        catch (error) {
            res.status(500).json({ message: "Failed to fetch customer", error });
        }
    }
    /**
     * Get customers of a business (pagination)
     */
    async getBusinessCustomers(req, res) {
        try {
            const { businessId } = req.params;
            const page = Number(req.query.page) || 1;
            const limit = Number(req.query.limit) || 10;
            const result = await customer_service_js_1.default.getBusinessCustomers(businessId, page, limit);
            res.json(result);
        }
        catch (error) {
            res.status(500).json({ message: "Failed to fetch customers", error });
        }
    }
    /**
     * Update customer
     */
    async update(req, res) {
        try {
            const { id } = req.params;
            const customer = await customer_service_js_1.default.updateCustomer(id, req.body);
            res.json(customer);
        }
        catch (error) {
            res.status(500).json({ message: "Failed to update customer", error });
        }
    }
    /**
     * Delete customer
     */
    async delete(req, res) {
        try {
            const { id } = req.params;
            const customer = await customer_service_js_1.default.deleteCustomer(id);
            res.json(customer);
        }
        catch (error) {
            res.status(500).json({ message: "Failed to delete customer", error });
        }
    }
    /**
     * Get or create customer
     */
    async getOrCreate(req, res) {
        try {
            const customer = await customer_service_js_1.default.getOrCreateCustomer(req.body);
            res.json(customer);
        }
        catch (error) {
            res.status(500).json({ message: "Failed to get or create customer", error });
        }
    }
    /**
     * Customer statistics
     */
    async stats(req, res) {
        try {
            const { customerId } = req.params;
            const stats = await customer_service_js_1.default.getCustomerStats(customerId);
            res.json(stats);
        }
        catch (error) {
            res.status(500).json({ message: "Failed to fetch customer stats", error });
        }
    }
    /**
     * Search customers
     */
    async search(req, res) {
        try {
            const { businessId } = req.params;
            const query = req.query.q;
            const limit = Number(req.query.limit) || 10;
            if (!query) {
                return res.status(400).json({ message: "Search query is required" });
            }
            const customers = await customer_service_js_1.default.searchCustomers(businessId, query, limit);
            res.json(customers);
        }
        catch (error) {
            res.status(500).json({ message: "Customer search failed", error });
        }
    }
}
exports.default = new CustomerController();
