"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SLUG_REGEX = exports.RESERVED_SLUGS = void 0;
exports.slugify = slugify;
exports.validateSlug = validateSlug;
exports.generateUniqueSlug = generateUniqueSlug;
const prisma_1 = __importDefault(require("../lib/prisma"));
exports.RESERVED_SLUGS = new Set([
    'admin', 'api', 'app', 'book', 'dashboard', 'login', 'logout', 'register',
    'signup', 'subscription', 'settings', 'payments', 'static', 'www', 'support',
    'help', 'about', 'contact', 'terms', 'privacy',
]);
function slugify(input) {
    return input
        .toLowerCase()
        .normalize('NFKD')
        .replace(/[\u0300-\u036f]/g, '') // strip accents
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-+|-+$)/g, '')
        .slice(0, 40)
        .replace(/-+$/g, '');
}
exports.SLUG_REGEX = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
function validateSlug(slug) {
    if (slug.length < 3 || slug.length > 40)
        return 'Slug must be 3-40 characters';
    if (!exports.SLUG_REGEX.test(slug))
        return 'Use lowercase letters, numbers and single hyphens only';
    if (exports.RESERVED_SLUGS.has(slug))
        return 'This slug is reserved';
    return null;
}
async function generateUniqueSlug(name, excludeId) {
    let base = slugify(name);
    if (base.length < 3 || exports.RESERVED_SLUGS.has(base))
        base = `${base || 'business'}-booking`;
    let slug = base;
    let i = 1;
    while (true) {
        const existing = await prisma_1.default.business.findUnique({ where: { slug } });
        if (!existing || existing.id === excludeId)
            return slug;
        i += 1;
        slug = `${base}-${i}`;
    }
}
