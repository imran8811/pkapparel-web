/** Folders admin images are uploaded to: the same as the API's ImageStore::FOLDERS. */
export const UPLOAD_FOLDERS = ["blog", "pages", "products", "stock", "factory", "certificates"] as const;

export type UploadFolder = (typeof UPLOAD_FOLDERS)[number];
