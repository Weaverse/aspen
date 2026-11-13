import type { ReactNode } from "react";
import { Section } from "~/components/section";

export function ThemivoWishlistPageLayout({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <Section
      width="fixed"
      gap={32}
      verticalPadding="none"
      className="bg-(--color-background-subtle) pt-10 pb-20"
      containerClassName="!max-w-[1360px]"
    >
      <h1 className="text-left font-normal uppercase">{title}</h1>
      {children}
    </Section>
  );
}
