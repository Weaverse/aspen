import { getSeoMeta, type SeoConfig } from "@shopify/hydrogen";

export type MetadataPage =
  | "account"
  | "addresses"
  | "article"
  | "blogs"
  | "cart"
  | "collection"
  | "collections"
  | "editAddress"
  | "editProfile"
  | "home"
  | "order"
  | "orders"
  | "page"
  | "policies"
  | "policy"
  | "product"
  | "products"
  | "profile"
  | "search";

type MetadataCopy = {
  title: string;
  description: string;
  section: string;
};

const metadataCopy = {
  en: {
    account: {
      title: "Account",
      description: "Manage your account details, addresses, and orders.",
      section: "Account",
    },
    addresses: {
      title: "Addresses",
      description: "Manage your saved delivery addresses.",
      section: "Account",
    },
    article: {
      title: "Article",
      description: "Read the latest story from Aspen.",
      section: "Journal",
    },
    blogs: {
      title: "Blog",
      description: "Read the latest stories and inspiration from Aspen.",
      section: "Blog",
    },
    cart: {
      title: "Cart",
      description: "Review the products in your shopping cart.",
      section: "Aspen",
    },
    collection: {
      title: "Collection",
      description: "Explore this Aspen collection.",
      section: "Collection",
    },
    collections: {
      title: "Collections",
      description: "Explore all Aspen collections.",
      section: "Collections",
    },
    editAddress: {
      title: "Edit address",
      description: "Add or update a delivery address.",
      section: "Account",
    },
    editProfile: {
      title: "Edit account",
      description: "Update your account information.",
      section: "Account",
    },
    home: {
      title: "Home",
      description: "Discover furniture and inspiration from Aspen.",
      section: "Aspen",
    },
    order: {
      title: "Order",
      description: "View your order details.",
      section: "Account",
    },
    orders: {
      title: "Orders",
      description: "View your order history.",
      section: "Account",
    },
    page: {
      title: "Page",
      description: "Information from Aspen.",
      section: "Aspen",
    },
    policies: {
      title: "Policies",
      description: "Read Aspen store policies.",
      section: "Policies",
    },
    policy: {
      title: "Policy",
      description: "Read this Aspen store policy.",
      section: "Policy",
    },
    product: {
      title: "Product",
      description: "View this Aspen product.",
      section: "Product",
    },
    products: {
      title: "All products",
      description: "Explore all Aspen products.",
      section: "Products",
    },
    profile: {
      title: "Profile",
      description: "View your account profile.",
      section: "Account",
    },
    search: {
      title: "Search",
      description: "Search products, collections, pages, and articles.",
      section: "Aspen",
    },
  },
  fr: {
    account: {
      title: "Compte",
      description: "Gérez vos informations, adresses et commandes.",
      section: "Compte",
    },
    addresses: {
      title: "Adresses",
      description: "Gérez vos adresses de livraison enregistrées.",
      section: "Compte",
    },
    article: {
      title: "Article",
      description: "Lisez la dernière histoire d’Aspen.",
      section: "Journal",
    },
    blogs: {
      title: "Blog",
      description: "Découvrez les dernières histoires et inspirations d’Aspen.",
      section: "Blog",
    },
    cart: {
      title: "Panier",
      description: "Consultez les produits dans votre panier.",
      section: "Aspen",
    },
    collection: {
      title: "Collection",
      description: "Découvrez cette collection Aspen.",
      section: "Collection",
    },
    collections: {
      title: "Collections",
      description: "Découvrez toutes les collections Aspen.",
      section: "Collections",
    },
    editAddress: {
      title: "Modifier l’adresse",
      description: "Ajoutez ou modifiez une adresse de livraison.",
      section: "Compte",
    },
    editProfile: {
      title: "Modifier le compte",
      description: "Mettez à jour les informations de votre compte.",
      section: "Compte",
    },
    home: {
      title: "Accueil",
      description: "Découvrez les meubles et les inspirations d’Aspen.",
      section: "Aspen",
    },
    order: {
      title: "Commande",
      description: "Consultez les détails de votre commande.",
      section: "Compte",
    },
    orders: {
      title: "Commandes",
      description: "Consultez l’historique de vos commandes.",
      section: "Compte",
    },
    page: {
      title: "Page",
      description: "Informations d’Aspen.",
      section: "Aspen",
    },
    policies: {
      title: "Politiques",
      description: "Consultez les politiques de la boutique Aspen.",
      section: "Politiques",
    },
    policy: {
      title: "Politique",
      description: "Consultez cette politique de la boutique Aspen.",
      section: "Politique",
    },
    product: {
      title: "Produit",
      description: "Découvrez ce produit Aspen.",
      section: "Produit",
    },
    products: {
      title: "Tous les produits",
      description: "Découvrez tous les produits Aspen.",
      section: "Produits",
    },
    profile: {
      title: "Profil",
      description: "Consultez le profil de votre compte.",
      section: "Compte",
    },
    search: {
      title: "Recherche",
      description: "Recherchez des produits, collections, pages et articles.",
      section: "Aspen",
    },
  },
  es: {
    account: {
      title: "Cuenta",
      description: "Gestiona tus datos, direcciones y pedidos.",
      section: "Cuenta",
    },
    addresses: {
      title: "Direcciones",
      description: "Gestiona tus direcciones de entrega guardadas.",
      section: "Cuenta",
    },
    article: {
      title: "Artículo",
      description: "Lee la última historia de Aspen.",
      section: "Revista",
    },
    blogs: {
      title: "Blog",
      description: "Descubre las últimas historias e inspiración de Aspen.",
      section: "Blog",
    },
    cart: {
      title: "Carrito",
      description: "Revisa los productos de tu carrito.",
      section: "Aspen",
    },
    collection: {
      title: "Colección",
      description: "Explora esta colección de Aspen.",
      section: "Colección",
    },
    collections: {
      title: "Colecciones",
      description: "Explora todas las colecciones de Aspen.",
      section: "Colecciones",
    },
    editAddress: {
      title: "Editar dirección",
      description: "Añade o actualiza una dirección de entrega.",
      section: "Cuenta",
    },
    editProfile: {
      title: "Editar cuenta",
      description: "Actualiza la información de tu cuenta.",
      section: "Cuenta",
    },
    home: {
      title: "Inicio",
      description: "Descubre muebles e inspiración de Aspen.",
      section: "Aspen",
    },
    order: {
      title: "Pedido",
      description: "Consulta los detalles de tu pedido.",
      section: "Cuenta",
    },
    orders: {
      title: "Pedidos",
      description: "Consulta tu historial de pedidos.",
      section: "Cuenta",
    },
    page: {
      title: "Página",
      description: "Información de Aspen.",
      section: "Aspen",
    },
    policies: {
      title: "Políticas",
      description: "Consulta las políticas de la tienda Aspen.",
      section: "Políticas",
    },
    policy: {
      title: "Política",
      description: "Consulta esta política de la tienda Aspen.",
      section: "Política",
    },
    product: {
      title: "Producto",
      description: "Consulta este producto de Aspen.",
      section: "Producto",
    },
    products: {
      title: "Todos los productos",
      description: "Explora todos los productos de Aspen.",
      section: "Productos",
    },
    profile: {
      title: "Perfil",
      description: "Consulta el perfil de tu cuenta.",
      section: "Cuenta",
    },
    search: {
      title: "Buscar",
      description: "Busca productos, colecciones, páginas y artículos.",
      section: "Aspen",
    },
  },
} satisfies Record<"en" | "es" | "fr", Record<MetadataPage, MetadataCopy>>;

const NAVBAR_PAGES = new Set<MetadataPage>([
  "blogs",
  "collections",
  "policies",
  "products",
]);

function metadataLanguage(locale?: string | null) {
  const language = locale
    ?.toLowerCase()
    .match(/(?:^|\/)(en|es|fr)(?:-|\/|$)/)?.[1];
  return language === "es" || language === "fr" ? language : "en";
}

export function getMetadataCopy(
  locale: string | null | undefined,
  page: MetadataPage,
) {
  return metadataCopy[metadataLanguage(locale)][page];
}

function nonEmpty(...values: Array<string | null | undefined>) {
  return values
    .find((value): value is string => Boolean(value?.trim()))
    ?.trim();
}

export function createLocalizedSeoConfig({
  locale,
  page,
  seo,
  title,
  description,
}: {
  locale?: string | null;
  page: MetadataPage;
  seo?: SeoConfig | null;
  title?: string | null;
  description?: string | null;
}): SeoConfig {
  const copy = getMetadataCopy(locale, page);
  const isNavbarPage = NAVBAR_PAGES.has(page);
  const resolvedTitle =
    page === "home"
      ? "Aspen"
      : isNavbarPage
        ? copy.section
        : nonEmpty(title, seo?.title, copy.title);
  const titleTemplate =
    page === "home" ? undefined : isNavbarPage ? "Aspen | %s" : "%s | Aspen";

  return {
    ...seo,
    title: resolvedTitle,
    titleTemplate,
    description: nonEmpty(description, seo?.description, copy.description),
  };
}

export function getLocalizedMeta(
  options: Omit<Parameters<typeof createLocalizedSeoConfig>[0], "seo"> & {
    seo?: unknown;
  },
) {
  return getSeoMeta(
    createLocalizedSeoConfig({
      ...options,
      seo: options.seo as SeoConfig | null | undefined,
    }),
  );
}
