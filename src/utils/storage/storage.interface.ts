import { MultipartFile } from "@fastify/multipart";

export interface StoredFile {
  filename: string;
  originalFilename: string;
  mimetype: string;
  filepath: string;
  size?: number;
  url?: string;
}

export interface StorageDriver {
  save(file: MultipartFile, subFolder?: string): Promise<StoredFile>;
  delete(filePath: string): Promise<void>;
  getUrl(filePath: string): string;
}
