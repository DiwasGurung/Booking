// utils/image.ts
import sharp from "sharp"

const LOGO_SIZE = 400
const COVER_SIZE = { width: 1600, height: 400 }
const MAX_INPUT_BYTES = 8 * 1024 * 1024 // reject absurdly large payloads before decoding
// utils/image.ts
const AVATAR_SIZE = 400
const ALLOWED_MIME = new Set(["image/png", "image/jpeg", "image/webp"])

export async function normalizeDataUrlImage(
  dataUrl: string,
  kind: "logo" | "cover" | "avatar"
): Promise<string> {
  const match = /^data:(image\/[\w+.-]+);base64,(.+)$/.exec(dataUrl)
  if (!match) throw new Error("Invalid image data")
  if (!ALLOWED_MIME.has(match[1])) throw new Error("Use a JPG, PNG, or WebP image")

  const buffer = Buffer.from(match[2], "base64")
  if (buffer.byteLength > MAX_INPUT_BYTES) throw new Error("Image is too large")

  const pipeline = sharp(buffer).rotate()

  let resized
  let outMime = "image/jpeg"
  if (kind === "logo") {
    resized = pipeline.resize(LOGO_SIZE, LOGO_SIZE, { fit: "cover" }).png()
    outMime = "image/png"
  } else if (kind === "cover") {
    resized = pipeline.resize(COVER_SIZE.width, COVER_SIZE.height, { fit: "cover" }).jpeg({ quality: 82 })
  } else {
    // JPEG keeps avatars around 30-60 KB; they are returned on the public booking page
    resized = pipeline
      .resize(AVATAR_SIZE, AVATAR_SIZE, { fit: "cover", position: "attention" })
      .jpeg({ quality: 85 })
  }

  const outBuffer = await resized.toBuffer()
  return `data:${outMime};base64,${outBuffer.toString("base64")}`
}