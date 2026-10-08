"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createMainBranch = createMainBranch;
exports.syncMainBranchIfSingle = syncMainBranchIfSingle;
exports.resolveBranchId = resolveBranchId;
exports.getBranchDisplay = getBranchDisplay;
/**
 * Creates the business's Main branch from its profile details.
 * Accepts a transaction client so it can run inside the same transaction
 * that creates the business. Idempotent: does nothing if a main branch exists.
 */
async function createMainBranch(db, business, name = 'Main Branch') {
    const existing = await db.branch.findFirst({
        where: { businessId: business.id, isMain: true },
        select: { id: true },
    });
    if (existing)
        return existing;
    return db.branch.create({
        data: {
            businessId: business.id,
            name,
            phone: business.phone,
            address: business.address,
            city: business.city,
            state: business.state,
            latitude: business.latitude ?? null,
            longitude: business.longitude ?? null,
            isMain: true,
        },
    });
}
/**
 * Keeps the Main branch in sync with the business profile while the business
 * has a single branch. Call it from the settings/update-business flow.
 */
async function syncMainBranchIfSingle(db, business) {
    const count = await db.branch.count({ where: { businessId: business.id } });
    if (count !== 1)
        return;
    await db.branch.updateMany({
        where: { businessId: business.id, isMain: true },
        data: {
            phone: business.phone,
            address: business.address,
            city: business.city,
            state: business.state,
            latitude: business.latitude ?? null,
            longitude: business.longitude ?? null,
        },
    });
}
const prisma_1 = __importDefault(require("./prisma"));
/** Validates a branchId for a business, or falls back to the main branch. */
async function resolveBranchId(businessId, branchId) {
    if (branchId) {
        const b = await prisma_1.default.branch.findFirst({ where: { id: branchId, businessId, isActive: true }, select: { id: true } });
        if (!b)
            throw new Error('Branch not found');
        return b.id;
    }
    const main = await prisma_1.default.branch.findFirst({ where: { businessId, isMain: true }, select: { id: true } });
    if (!main)
        throw new Error('Business has no main branch');
    return main.id;
}
/** Name/address/phone to show customers. The branch name is added only when the business has 2+ branches. */
async function getBranchDisplay(branchId, business) {
    const fallback = { name: business.name, phone: business.phone ?? null, address: business.address ?? null };
    if (!branchId)
        return fallback;
    const branch = await prisma_1.default.branch.findUnique({
        where: { id: branchId },
        include: { business: { select: { _count: { select: { branches: true } } } } },
    });
    if (!branch)
        return fallback;
    const multi = branch.business._count.branches > 1;
    return {
        name: multi ? `${business.name} - ${branch.name}` : business.name,
        phone: branch.phone ?? business.phone ?? null,
        address: [branch.address, branch.city].filter(Boolean).join(', ') || business.address || null,
    };
}
