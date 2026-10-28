import { MultipartFile } from "@fastify/multipart";
import { storage } from "./storage/index.js";
import { AppError } from "./AppError.js";

export const saveUploadedFile = (file: MultipartFile, subFolder = "") =>
  storage.save(file, subFolder);

export const deleteFile = (filePath: string) => storage.delete(filePath);

export const validateFileType = (file: MultipartFile, allowedMimes: string[]): void => {
  if (!allowedMimes.includes(file.mimetype)) {
    throw new AppError(
      `Invalid file type "${file.mimetype}". Allowed types: ${allowedMimes.join(", ")}`,
      400,
    );
  }
};

export { storage };
export default storage;
