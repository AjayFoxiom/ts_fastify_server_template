import fs from "node:fs";
import path from "node:path";
import { pipeline } from "node:stream/promises";
import { MultipartFile } from "@fastify/multipart";
import { AppError } from "./AppError.js";
import { env } from "../config/env.js";

export interface SavedFileInfo {
  filename: string;
  originalFilename: string;
  mimetype: string;
  filepath: string;
  size?: number;
}

/**
 * Sanitize filename to avoid directory traversal or invalid characters
 */
export const sanitizeFilename = (filename: string): string => {
  const ext = path.extname(filename);
  const base = path.basename(filename, ext);
  const cleanBase = base
    .toLowerCase()
    .replace(/[^a-z0-9_-]/g, "-")
    .replace(/-+/g, "-");
  const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
  return `${cleanBase}-${uniqueSuffix}${ext}`;
};

/**
 * Ensure directory exists
 */
export const ensureDirectoryExists = async (dirPath: string): Promise<void> => {
  if (!fs.existsSync(dirPath)) {
    await fs.promises.mkdir(dirPath, { recursive: true });
  }
};

/**
 * Save a single uploaded multipart file to disk
 */
export const saveUploadedFile = async (
  file: MultipartFile,
  subFolder = ""
): Promise<SavedFileInfo> => {
  const uploadBaseDir = path.resolve(process.cwd(), env.UPLOAD_DIR || "uploads", subFolder);
  await ensureDirectoryExists(uploadBaseDir);

  const newFilename = sanitizeFilename(file.filename);
  const targetPath = path.join(uploadBaseDir, newFilename);

  // Stream file directly to target destination
  await pipeline(file.file, fs.createWriteStream(targetPath));

  const stats = await fs.promises.stat(targetPath);

  return {
    filename: newFilename,
    originalFilename: file.filename,
    mimetype: file.mimetype,
    filepath: path.relative(process.cwd(), targetPath).replace(/\\/g, "/"),
    size: stats.size,
  };
};

/**
 * Validate that uploaded file matches allowed MIME types
 */
export const validateFileType = (
  file: MultipartFile,
  allowedMimes: string[]
): void => {
  if (!allowedMimes.includes(file.mimetype)) {
    throw new AppError(
      `Invalid file type "${file.mimetype}". Allowed types: ${allowedMimes.join(", ")}`,
      400
    );
  }
};

/**
 * Safely delete an uploaded file from disk
 */
export const deleteFile = async (filePath: string): Promise<void> => {
  try {
    const fullPath = path.isAbsolute(filePath)
      ? filePath
      : path.resolve(process.cwd(), filePath);

    if (fs.existsSync(fullPath)) {
      await fs.promises.unlink(fullPath);
    }
  } catch (error) {
    console.error(`Failed to delete file at "${filePath}":`, error);
  }
};

export default {
  saveUploadedFile,
  validateFileType,
  deleteFile,
  ensureDirectoryExists,
};
