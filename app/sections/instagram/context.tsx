import { createContext, useContext } from "react";

interface InstagramContextType {
  loaderData?: {
    data?: {
      id: string;
      media_url: string;
      username?: string;
    }[];
  } | null;
}

const defaultContextValue: InstagramContextType = {
  loaderData: null
};

const InstagramContext = createContext<InstagramContextType>(defaultContextValue);

export const InstagramProvider = InstagramContext.Provider;

export const useInstagramContext = (): InstagramContextType => {
  const context = useContext(InstagramContext);
  return context;
}; 