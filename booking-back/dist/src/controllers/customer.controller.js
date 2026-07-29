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
const customer_service_1 = __importDefault(require("../services/customer.service"));
class CustomerController {
    /**
     * Create customer
     */
    create(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const customer = yield customer_service_1.default.createCustomer(req.body);
                res.status(201).json(customer);
            }
            catch (error) {
                res.status(500).json({ message: "Failed to create customer", error });
            }
        });
    }
    /**
     * Get customer by ID
     */
    getById(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const { id } = req.params;
                const customer = yield customer_service_1.default.getCustomerById(id);
                if (!customer) {
                    return res.status(404).json({ message: "Customer not found" });
                }
                res.json(customer);
            }
            catch (error) {
                res.status(500).json({ message: "Failed to fetch customer", error });
            }
        });
    }
    /**
     * Get customers of a business (pagination)
     */
    getBusinessCustomers(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const { businessId } = req.params;
                const page = Number(req.query.page) || 1;
                const limit = Number(req.query.limit) || 10;
                const result = yield customer_service_1.default.getBusinessCustomers(businessId, page, limit);
                res.json(result);
            }
            catch (error) {
                res.status(500).json({ message: "Failed to fetch customers", error });
            }
        });
    }
    /**
     * Update customer
     */
    update(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const { id } = req.params;
                const customer = yield customer_service_1.default.updateCustomer(id, req.body);
                res.json(customer);
            }
            catch (error) {
                res.status(500).json({ message: "Failed to update customer", error });
            }
        });
    }
    /**
     * Delete customer
     */
    delete(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const { id } = req.params;
                const customer = yield customer_service_1.default.deleteCustomer(id);
                res.json(customer);
            }
            catch (error) {
                res.status(500).json({ message: "Failed to delete customer", error });
            }
        });
    }
    /**
     * Get or create customer
     */
    getOrCreate(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const customer = yield customer_service_1.default.getOrCreateCustomer(req.body);
                res.json(customer);
            }
            catch (error) {
                res.status(500).json({ message: "Failed to get or create customer", error });
            }
        });
    }
    /**
     * Customer statistics
     */
    stats(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const { customerId } = req.params;
                const stats = yield customer_service_1.default.getCustomerStats(customerId);
                res.json(stats);
            }
            catch (error) {
                res.status(500).json({ message: "Failed to fetch customer stats", error });
            }
        });
    }
    /**
     * Search customers
     */
    search(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const { businessId } = req.params;
                const query = req.query.q;
                const limit = Number(req.query.limit) || 10;
                if (!query) {
                    return res.status(400).json({ message: "Search query is required" });
                }
                const customers = yield customer_service_1.default.searchCustomers(businessId, query, limit);
                res.json(customers);
            }
            catch (error) {
                res.status(500).json({ message: "Customer search failed", error });
            }
        });
    }
}
exports.default = new CustomerController();
