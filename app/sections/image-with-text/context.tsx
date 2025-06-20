import { createContext, useContext } from "react";

export type ImageAspectRatioType = "adapt" | "1/1" | "3/4" | "4/3" | "16/9";

interface ImageWithTextContextType {
  imageCount: number;
  setImageCount: (count: number) => void;
  imageAspectRatio: ImageAspectRatioType;
  setImageAspectRatio: (ratio: ImageAspectRatioType) => void;
}

export const ImageWithTextContext = createContext<ImageWithTextContextType>({
  imageCount: 0,
  setImageCount: () => {},
  imageAspectRatio: "1/1",
  setImageAspectRatio: () => {},
});

export const useImageWithTextContext = () => useContext(ImageWithTextContext); 