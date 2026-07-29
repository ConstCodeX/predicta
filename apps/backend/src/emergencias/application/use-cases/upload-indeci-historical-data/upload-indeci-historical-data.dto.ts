export interface UploadINDECIHistoricalDataCommand {
  fileBuffer: Buffer;
  fuente?: string;
}

export interface UploadResult {
  total: number;
  imported: number;
  discarded: number;
  errors: Array<{ row: number; message: string }>;
}
