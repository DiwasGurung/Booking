"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.normalizeDataUrlImage = normalizeDataUrlImage;
// utils/image.ts
const sharp_1 = __importDefault(require("sharp"));
const LOGO_SIZE = 400;
const COVER_SIZE = { width: 1600, height: 400 };
const MAX_INPUT_BYTES = 8 * 1024 * 1024; // reject absurdly large payloads before decoding
async function normalizeDataUrlImage(dataUrl, kind) {
    const match = /^data:(image\/\w+);base64,(.+)$/.exec(dataUrl);
    if (!match)
        throw new Error("Invalid image data");
    const buffer = Buffer.from(match[2], "base64");
    if (buffer.byteLength > MAX_INPUT_BYTES) {
        throw new Error("Image is too large");
    }
    const pipeline = (0, sharp_1.default)(buffer).rotate(); // auto-orient from EXIF
    const resized = kind === "logo"
        ? pipeline.resize(LOGO_SIZE, LOGO_SIZE, { fit: "cover" }).png()
        : pipeline.resize(COVER_SIZE.width, COVER_SIZE.height, { fit: "cover" }).jpeg({ quality: 82 });
    const outBuffer = await resized.toBuffer();
    const outMime = kind === "logo" ? "image/png" : "image/jpeg";
    return `data:${outMime};base64,${outBuffer.toString("base64")}`;
}
