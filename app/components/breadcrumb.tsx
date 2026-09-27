import { useTranslatedText } from "~/hooks/use-translated-text";
import { cn } from "~/utils/cn";
import { Link } from "./link";

export function BreadCrumb({
  homeLabel: rawI18nHomeLabel = "Home",
  page,
  className,
}: {
  homeLabel?: string;
  page: string;
  className?: string;
}) {
  const translateText = useTranslatedText();
  const homeLabel = translateText(
    rawI18nHomeLabel,
    "themeContent.componentsBreadcrumb.homeLabel",
  );

  return (
    <div className={cn("flex items-center gap-2 text-body-subtle", className)}>
      <Link to="/" className="underline-offset-4 hover:underline">
        {homeLabel}
      </Link>
      <span>/</span>
      <span>{page}</span>
    </div>
  );
}
