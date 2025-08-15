import { useThemeSettings } from "@weaverse/hydrogen";
import { animate, inView, useAnimate } from "framer-motion";
import { type ForwardedRef, useEffect } from "react";

export type MotionType = "fade-up" | "zoom-in" | "slide-in";

const ANIMATIONS: Record<MotionType, any> = {
  "fade-up": { opacity: [0, 1], y: [20, 0] },
  "zoom-in": { opacity: [0, 1], scale: [0.8, 1], y: [20, 0] },
  "slide-in": { opacity: [0, 1], x: [20, 0] },
};

export function useAnimation(ref?: ForwardedRef<any>) {
  const { revealElementsOnScroll } = useThemeSettings();
  const [scope] = useAnimate();

  useEffect(() => {
    if (!(scope.current && ref)) {
      return;
    }
    Object.assign(ref, { current: scope.current });
  }, [scope, ref]);

  useEffect(() => {
    if (!revealElementsOnScroll) {
      return;
    }

    if (scope.current) {
      // Thêm lớp phủ opacity-0 cho tất cả elements có data-motion
      const elems = scope.current.querySelectorAll("[data-motion]");
      
      // Ẩn tất cả elements ban đầu
      elems.forEach((elem: HTMLElement) => {
        elem.style.opacity = "0";
      });

      // Thêm class để track trạng thái
      scope.current.classList.add("animated-scope");
      
      elems.forEach((elem: HTMLElement, idx: number) => {
        inView(
          elem,
          (element: Element) => {
            const { motion, delay } = elem.dataset;
            const animationType = motion || "fade-up";
            
            // Reset về trạng thái ban đầu trước khi animate
            const htmlElement = element as HTMLElement;
            
            // Chạy animation
            animate(element, ANIMATIONS[animationType], {
              delay: Number(delay) || idx * 0.15,
              duration: 0.5,
            });
            
            // Xóa inline styles sau khi animation hoàn thành
            setTimeout(() => {
              htmlElement.style.transform = "";
              htmlElement.style.opacity = "";
            }, 500 + (Number(delay) || idx * 0.15) * 1000);
          },
          { 
            amount: 0.3,
          },
        );
      });
    }
  }, [revealElementsOnScroll]);

  return [scope] as const;
}
