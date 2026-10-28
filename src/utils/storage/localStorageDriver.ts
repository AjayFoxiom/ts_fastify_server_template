import fs from "node:fs";
import path from "node:path";
import { pipeline } from "node:stream/promises";
import { MultipartFile } from "@fastify/multipart";
import { StorageDriver, StoredFile } from "./storage.interface.js";
import { env } from "../../config/env.js";

export class LocalStorageDriver implements StorageDriver {
  private baseDir: string;

  constructor(baseDir?: string) {
    this.baseDir = baseDir || env.UPLOAD_DIR || "uploads";
  }

  private sanitizeFilename(filename: string): string {
    const ext = path.extname(filename);
    const base = path.basename(filename, ext);
    const cleanBase = base
      .toLowerCase()
      .replace(/[^a-z0-9_-]/g, "-")
      .replace(/-+/g, "-");
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    return `${cleanBase}-${uniqueSuffix}${ext}`;
  }

  private async ensureDir(dirPath: string): Promise<void> {
    if (!fs.existsSync(dirPath)) {
      await fs.promises.mkdir(dirPath, { recursive: true });
    }
  }

  async save(file: MultipartFile, subFolder = ""): Promise<StoredFile> {
    const targetDir = path.resolve(process.cwd(), this.baseDir, subFolder);
    await this.ensureDir(targetDir);

    const filename = this.sanitizeFilename(file.filename);
    const targetPath = path.join(targetDir, filename);

    await pipeline(file.file, fs.createWriteStream(targetPath));

    const stats = await fs.promises.stat(targetPath);
    const relativePath = path.relative(process.cwd(), targetPath).replace(/\\/g, "/");

    return {
      filename,
      originalFilename: file.filename,
      mimetype: file.mimetype,
      filepath: relativePath,
      size: stats.size,
      url: `/${relativePath}`,
    };
  }

  async delete(filePath: string): Promise<void> {
    try {
      const fullPath = path.isAbsolute(filePath) ? filePath : path.resolve(process.cwd(), filePath);

      if (fs.existsSync(fullPath)) {
        await fs.promises.unlink(fullPath);
      }
    } catch (err) {
      console.error(`Failed to delete local file at "${filePath}":`, err);
    }
  }

  getUrl(filePath: string): string {
    const clean = filePath.replace(/\\/g, "/");
    return clean.startsWith("/") ? clean : `/${clean}`;
  }
}
