import { createContext, useContext } from "react";

export type TestimonialArrowIcon = "caret" | "arrow";
export type TestimonialArrowShape = "rounded" | "circle" | "square";

interface TestimonialNavigationContextValue {
  canNavigate: boolean;
  canGoPrevious: boolean;
  canGoNext: boolean;
  goToPrevious: () => void;
  goToNext: () => void;
  navigationButtonColor: string;
  navigationButtonHoverColor: string;
  navigationIconColor: string;
  navigationIcon: TestimonialArrowIcon;
  navigationShape: TestimonialArrowShape;
}

const defaultValue: TestimonialNavigationContextValue = {
  canNavigate: false,
  canGoPrevious: false,
  canGoNext: false,
  goToPrevious: () => undefined,
  goToNext: () => undefined,
  navigationButtonColor: "#EDEAE6",
  navigationButtonHoverColor: "#E4DFDA",
  navigationIconColor: "#343231",
  navigationIcon: "caret",
  navigationShape: "rounded",
};

export const TestimonialNavigationContext =
  createContext<TestimonialNavigationContextValue>(defaultValue);

export const useTestimonialNavigation = () =>
  useContext(TestimonialNavigationContext);
