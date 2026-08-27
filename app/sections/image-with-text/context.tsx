import { createContext, useContext } from "react";

export type ImageAspectRatioType = "adapt" | "1/1" | "3/4" | "4/3" | "16/9";
export type ImageWithTextLayout = "overlay" | "split";

interface ImageWithTextContextType {
  imageCount: number;
  setImageCount: (count: number) => void;
  imageAspectRatio: ImageAspectRatioType;
  setImageAspectRatio: (ratio: ImageAspectRatioType) => void;
  layout: ImageWithTextLayout;
  isLegacyLayout: boolean;
}

export const ImageWithTextContext = createContext<ImageWithTextContextType>({
  imageCount: 0,
  setImageCount: () => {
    // Default context setter is intentionally a no-op outside its provider.
  },
  imageAspectRatio: "1/1",
  setImageAspectRatio: () => {
    // Default context setter is intentionally a no-op outside its provider.
  },
  layout: "split",
  isLegacyLayout: false,
});

export const useImageWithTextContext = () => useContext(ImageWithTextContext);
