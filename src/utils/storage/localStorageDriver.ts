import fs from "node:fs";
import path from "node:path";
import { pipeline } from "node:stream/promises";
import { MultipartFile } from "@fastify/multipart";
import { StorageDriver, StoredFile } from "./storage.interface.js";

/**
 * Local disk storage driver.
 * baseDir is passed in at construction time from app.config.UPLOAD_DIR,
 * not read from a global env singleton.
 */
export class LocalStorageDriver implements StorageDriver {
  private readonly baseDir: string;

  constructor(baseDir: string) {
    this.baseDir = path.resolve(process.cwd(), baseDir);
  }

  private sanitizeFilename(filename: string): string {
    const ext = path.extname(filename).slice(0, 10); // cap extension length
    const base = path.basename(filename, ext);
    const cleanBase = base
      .toLowerCase()
      .replace(/[^a-z0-9_-]/g, "-")
      .replace(/-+/g, "-")
      .slice(0, 80);
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    return `${cleanBase}-${uniqueSuffix}${ext}`;
  }

  private async ensureDir(dirPath: string): Promise<void> {
    await fs.promises.mkdir(dirPath, { recursive: true });
  }

  /**
   * Save a multipart file to disk.
   * Cleans up the partial file if the stream is aborted mid-transfer.
   */
  async save(file: MultipartFile, subFolder = ""): Promise<StoredFile> {
    const targetDir = path.resolve(this.baseDir, subFolder);
    await this.ensureDir(targetDir);

    const filename = this.sanitizeFilename(file.filename);
    const targetPath = path.join(targetDir, filename);

    try {
      await pipeline(file.file, fs.createWriteStream(targetPath));
    } catch (err) {
      // Stream aborted or write error — clean up the partial file
      try {
        if (fs.existsSync(targetPath)) {
          await fs.promises.unlink(targetPath);
        }
      } catch {
        // Best-effort cleanup; don't shadow the original error
      }
      throw err;
    }

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

  /**
   * Delete a file by its relative or absolute path.
   *
   * Security: resolves the path and verifies it is inside baseDir to prevent
   * path traversal attacks (e.g. delete("../../etc/passwd")).
   */
  async delete(filePath: string): Promise<void> {
    const fullPath = path.isAbsolute(filePath)
      ? filePath
      : path.resolve(process.cwd(), filePath);

    // Prevent path traversal — the resolved path must be inside baseDir.
    if (!fullPath.startsWith(this.baseDir + path.sep) && fullPath !== this.baseDir) {
      throw new Error(`Path traversal detected: "${filePath}" is outside the upload directory.`);
    }

    try {
      await fs.promises.unlink(fullPath);
    } catch (err: any) {
      if (err?.code !== "ENOENT") {
        throw err;
      }
      // File already gone — not an error
    }
  }

  getUrl(filePath: string): string {
    const clean = filePath.replace(/\\/g, "/");
    return clean.startsWith("/") ? clean : `/${clean}`;
  }
}
