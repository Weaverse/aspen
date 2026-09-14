import { createContext, useContext } from "react";

export interface InstagramMedia {
  id: string;
  media_url: string;
  permalink?: string;
  thumbnail_url?: string;
  username?: string;
}

interface InstagramContextType {
  loaderData?: {
    data?: InstagramMedia[];
  } | null;
}

const defaultContextValue: InstagramContextType = {
  loaderData: null,
};

const InstagramContext =
  createContext<InstagramContextType>(defaultContextValue);

export const InstagramProvider = InstagramContext.Provider;

export const useInstagramContext = (): InstagramContextType => {
  const context = useContext(InstagramContext);
  return context;
};
