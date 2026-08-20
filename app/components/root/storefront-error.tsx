import { useTranslation } from "@weaverse/hydrogen";
import Link from "~/components/link";
import { cn } from "~/utils/cn";

type StorefrontErrorProps = {
  actionLabel?: string;
  actionTo?: string;
  className?: string;
  statusCode?: number | string;
  title?: string;
};

/**
 * Shared full-page commerce error state.
 *
 * The approved Aspen error frames reserve a 509px content area between the
 * global header and footer at every breakpoint. Keeping this presentation in
 * one component makes collection, PDP, cart, search, and catch-all failures
 * visually consistent without duplicating route-specific markup.
 */
export function StorefrontError({
  actionLabel,
  actionTo = "/",
  className,
  statusCode = 500,
  title,
}: StorefrontErrorProps) {
  const { t } = useTranslation();
  const titleId = `storefront-error-${statusCode}`;
  const resolvedActionLabel = actionLabel ?? t("navigation.home");
  const resolvedTitle = title ?? t("system.somethingWentWrong");

  return (
    <section
      aria-labelledby={titleId}
      className={cn(
        "storefront-error-state flex min-h-[509px] w-full items-center justify-center bg-white px-(--page-padding) text-body",
        className,
      )}
    >
      <div className="flex -translate-y-1 flex-col items-center text-center md:-translate-y-2">
        <p
          aria-hidden="true"
          className="font-heading text-[56px] font-normal leading-none tracking-[-0.035em]"
        >
          {statusCode}
        </p>
        <h1
          id={titleId}
          className="mt-3 font-body text-[28px] font-normal leading-tight tracking-[-0.02em]"
        >
          {resolvedTitle}
        </h1>
        <Link
          to={actionTo}
          variant="custom"
          textColor="var(--color-text)"
          backgroundColor="#EDEDED"
          borderColor="transparent"
          textColorHover="var(--color-text)"
          backgroundColorHover="#E2E1DF"
          borderColorHover="transparent"
          className="mt-10 h-[54px] min-h-0 min-w-32 rounded-lg border-0 px-6 py-0 font-semibold uppercase"
        >
          {resolvedActionLabel}
        </Link>
      </div>
    </section>
  );
}
