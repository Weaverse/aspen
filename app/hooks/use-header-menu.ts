import { useTranslation } from "@weaverse/hydrogen";
import { useLocation } from "react-router";
import type { SingleMenuItem } from "~/types/menu";
import { getCollectionCategories } from "~/utils/collection-categories";
import { getNavigationKind } from "~/utils/navigation";
import { useShopMenu } from "./use-shop-menu";

// Desktop and Compact render the same navigation content with different layouts.
export function useHeaderMenu() {
  const { headerMenu, desktopMenuContent } = useShopMenu();
  const { t } = useTranslation();
  const location = useLocation();
  const menuItems = (headerMenu?.items ?? []) as unknown as SingleMenuItem[];

  const toCollectionItem = (
    collection: NonNullable<typeof desktopMenuContent>["collections"][number],
  ): SingleMenuItem => ({
    id: collection.id,
    title: collection.title,
    to: `/collections/${collection.handle}`,
    items: [],
    resource: { __typename: "Collection", image: collection.image },
  });
  const collectionImages =
    desktopMenuContent?.collections
      .filter((collection) => collection.image)
      .map(toCollectionItem) ?? [];
  const featuredCollection = desktopMenuContent?.featuredCollection;
  const feature = featuredCollection?.image
    ? toCollectionItem(featuredCollection)
    : undefined;

  const inCollection = /\/collections\/[^/]+\/?$/.test(location.pathname);
  const saleParams = new URLSearchParams(inCollection ? location.search : "");
  for (const key of [...saleParams.keys()]) {
    if (/cursor|direction/i.test(key)) {
      saleParams.delete(key);
    }
  }
  saleParams.set("sale", "true");
  const saleUrl = `${inCollection ? location.pathname : "/products"}?${saleParams}`;

  return menuItems.map((menuItem) => {
    const { items = [] } = menuItem;
    const menuKind = getNavigationKind(menuItem);
    const isCollections =
      menuKind === "collections" || menuItem.to === "/collections";
    const isWeaverse = menuKind === "weaverse";
    const collectionItems = isWeaverse
      ? (menuItems.find(
          (item) =>
            getNavigationKind(item) === "collections" ||
            item.to === "/collections",
        )?.items ?? [])
      : items;
    const collectionColumns = collectionItems
      .filter(
        (item) =>
          item.to !== "/collections" &&
          item.title.trim().toLowerCase() !== "all collections",
      )
      .map((item) => ({
        ...item,
        items: [
          {
            id: `${item.id}-new-arrival`,
            title: t("navigation.newArrival"),
            to: `${item.to}?sort=newest`,
            items: [],
          },
          ...(getCollectionCategories(
            item.to.split("?")[0].split("/").filter(Boolean).at(-1) ?? "",
          ).length
            ? getCollectionCategories(
                item.to.split("?")[0].split("/").filter(Boolean).at(-1) ?? "",
              ).map((category) => ({
                id: `${item.id}-${category.key}`,
                title: t(`navigation.categories.${category.key}`),
                to: `${item.to.split("?")[0]}?category=${category.key}`,
                items: [],
              }))
            : item.items
                .filter(
                  (child) => child.title.trim().toLowerCase() !== "new arrival",
                )
                .slice(0, 3)),
        ],
      }));
    const isBlogs = menuKind === "blogs" || menuItem.to === "/blogs";
    const isAbout = menuKind === "about" || menuItem.to === "/contact";
    const configuredArticles = items.filter(
      (item) =>
        item.resource?.image &&
        (item.resource.__typename === "Article" || item.to.includes("/blogs/")),
    );
    const extraArticles: SingleMenuItem[] =
      desktopMenuContent?.articles
        .filter(
          (article) =>
            article.image &&
            !configuredArticles.some((item) =>
              item.to.replace(/\/$/, "").endsWith(`/${article.handle}`),
            ),
        )
        .map((article) => ({
          id: article.id,
          title: article.title,
          to: `/blogs/${article.blog.handle}/${article.handle}`,
          items: [],
          resource: {
            __typename: "Article",
            articleTags: article.tags,
            image: article.image,
          },
        })) ?? [];
    const aboutImages = items.filter(
      (item) =>
        item.resource?.__typename === "Collection" && item.resource.image,
    );
    const aboutCollections = [
      ...aboutImages,
      ...collectionImages.filter(
        (item) => !aboutImages.some((configured) => configured.to === item.to),
      ),
    ].slice(0, 3);

    const columns: SingleMenuItem[] = [
      ...collectionColumns.filter(
        (item) => item.title.toLowerCase() !== "sale",
      ),
      {
        id: `${menuItem.id}-sale`,
        title: t("navigation.sale"),
        to: saleUrl,
        items: [
          {
            id: `${menuItem.id}-all-sale`,
            title: t("navigation.allSale"),
            to: saleUrl,
            items: [],
          },
        ],
      },
    ];
    return {
      ...menuItem,
      kind: menuKind,
      items:
        isCollections || isWeaverse
          ? columns
          : isBlogs && configuredArticles.length + extraArticles.length > 0
            ? [...configuredArticles, ...extraArticles].slice(0, 4)
            : isAbout && aboutCollections.length > 0
              ? aboutCollections
              : items,
      feature: isCollections ? feature : undefined,
    };
  });
}
