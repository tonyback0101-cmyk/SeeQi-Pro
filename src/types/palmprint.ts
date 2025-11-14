export type PalmHandType = "left" | "right";
export type PalmRegion = "full" | "palm" | "fingers";
export type PalmFeatureType = "mainLine" | "wrinkle" | "minutiae";

export interface PalmFeature {
  id?: string;
  type: PalmFeatureType;
  position: { x: number; y: number };
  description?: string;
  metadata?: Record<string, unknown>;
}

export interface PalmPrintData {
  id: string;
  imagePath: string;
  handType: PalmHandType;
  palmRegion: PalmRegion;
  qualityRating?: number | null;
  metadata?: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
  features?: PalmFeature[];
}

export interface PalmPrintUploadPayload {
  handType: PalmHandType;
  palmRegion: PalmRegion;
  captureMethod?: "camera" | "upload";
  qualityRating?: number | null;
}

export interface PalmPrintFeaturePayload {
  features: PalmFeature[];
  qualityRating?: number | null;
}


