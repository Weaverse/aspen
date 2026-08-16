import type { HydrogenThemeSchema } from "@weaverse/hydrogen";
import { COUNTRIES } from "~/utils/const";
import pkg from "../../package.json";

export const themeSchema: HydrogenThemeSchema = {
  info: {
    version: pkg.version,
    author: "Weaverse",
    name: "Aspen",
    authorProfilePhoto:
      "https://cdn.shopify.com/s/files/1/0838/0052/3057/files/Weaverse_logo_-_3000x_e2fa8c13-dac2-4dcb-a2c2-f7aaf7a58169.png?v=1698245759",
    documentationUrl: "https://weaverse.io/docs",
    supportUrl: "https://help.weaverse.io/",
  },
  i18n: {
    urlStructure: "url-path",
    defaultLocale: {
      pathPrefix: "",
      label: "United States - USD",
      language: "EN",
      country: "US",
      currency: "USD",
    },
    shopLocales: Object.entries(COUNTRIES).map(
      ([pathPrefix, { label, language, country }]) => {
        return {
          pathPrefix: pathPrefix === "default" ? "" : pathPrefix,
          label,
          language,
          country,
        };
      },
    ),
  },
  settings: [
    {
      group: "Layout",
      inputs: [
        {
          type: "select",
          label: "Visual system preset",
          name: "designSystemPreset",
          configs: {
            options: [
              { value: "aspen-2026", label: "Aspen 2026" },
              { value: "custom", label: "Custom" },
            ],
          },
          defaultValue: "aspen-2026",
          helpText:
            "Aspen 2026 applies the approved Figma tokens. Choose Custom to use the individual layout, color, typography, and radius settings below.",
        },
        {
          type: "range",
          label: "Page width",
          name: "pageWidth",
          configs: {
            min: 1000,
            max: 1600,
            step: 10,
            unit: "px",
          },
          defaultValue: 1440,
        },
        {
          type: "range",
          label: "Nav height (mobile)",
          name: "navHeightMobile",
          configs: {
            min: 2,
            max: 8,
            step: 1,
            unit: "rem",
          },
          defaultValue: 3,
        },
        {
          type: "range",
          label: "Nav height (tablet)",
          name: "navHeightTablet",
          configs: {
            min: 2,
            max: 8,
            step: 1,
            unit: "rem",
          },
          defaultValue: 4,
        },
        {
          type: "range",
          label: "Nav height (desktop)",
          name: "navHeightDesktop",
          configs: {
            min: 2,
            max: 8,
            step: 1,
            unit: "rem",
          },
          defaultValue: 6,
        },
      ],
    },
    {
      group: "Scrolling announcements",
      inputs: [
        {
          type: "select",
          name: "announcementWidth",
          label: "Announcement width",
          configs: {
            options: [
              { value: "full", label: "Full page" },
              { value: "stretch", label: "Stretch" },
              { value: "fixed", label: "Fixed" },
            ],
          },
          defaultValue: "fixed",
        },
        {
          type: "range",
          label: "Desktop height",
          name: "topbarHeight",
          configs: {
            min: 44,
            max: 100,
            step: 1,
            unit: "px",
          },
          defaultValue: 56,
        },
        {
          type: "richtext",
          name: "topbarText",
          label: "Content",
          defaultValue: "<p>FREE SHIPPING FOR ORDERS OVER $200USD</p>",
        },
        {
          type: "heading",
          label: "Social links",
        },
        {
          type: "text",
          name: "socialFacebookAnnouncement",
          label: "Facebook",
          defaultValue: "https://www.facebook.com/",
        },
        {
          type: "text",
          name: "socialXAnnouncement",
          label: "X (formerly Twitter)",
          defaultValue: "https://x.com/",
        },
        {
          type: "text",
          name: "socialInstagramAnnouncement",
          label: "Instagram",
          defaultValue: "https://www.instagram.com/",
        },
        {
          type: "text",
          name: "socialYoutubeAnnouncement",
          label: "YouTube",
          defaultValue: "https://www.youtube.com/",
        },
      ],
    },
    {
      group: "Header",
      inputs: [
        {
          type: "select",
          name: "headerWidth",
          label: "Header width",
          configs: {
            options: [
              { value: "full", label: "Full page" },
              { value: "stretch", label: "Stretch" },
              { value: "fixed", label: "Fixed" },
            ],
          },
          defaultValue: "fixed",
        },
        {
          type: "select",
          name: "headerLayout",
          label: "Desktop layout",
          configs: {
            options: [
              { value: "inline", label: "Inline menu" },
              { value: "compact", label: "Compact menu" },
            ],
          },
          defaultValue: "inline",
        },
        {
          type: "switch",
          label: "Enable transparent header",
          name: "enableTransparentHeader",
          defaultValue: false,
          helpText: "Header is transparent in home page only.",
        },
        {
          type: "image",
          name: "logoData",
          label: "Logo",
          defaultValue: {
            id: "gid://shopify/MediaImage/34144817938616",
            altText: "Logo",
            url: "https://cdn.shopify.com/s/files/1/0838/0052/3057/files/fpo-logo-k-600x200.svg",
            width: 320,
            height: 116,
          },
        },
        {
          type: "image",
          name: "transparentLogoData",
          label: "Logo on transparent header",
          defaultValue: {
            id: "gid://shopify/MediaImage/34144817938616",
            altText: "Logo",
            url: "https://cdn.shopify.com/s/files/1/0838/0052/3057/files/fpo-logo-w-600x200.svg",
            width: 320,
            height: 116,
          },
          condition: (data) => data.enableTransparentHeader === true,
        },
        {
          type: "range",
          name: "logoWidth",
          label: "Logo width",
          configs: {
            min: 50,
            max: 500,
            step: 1,
            unit: "px",
          },
          defaultValue: 150,
        },
        {
          type: "heading",
          label: "Menu",
        },
        {
          type: "select",
          name: "openMenuBy",
          label: "Open menu by",
          configs: {
            options: [
              { value: "hover", label: "Mouse hover" },
              { value: "click", label: "Mouse click" },
            ],
          },
          defaultValue: "click",
        },
      ],
    },
    {
      group: "Colors",
      inputs: [
        {
          type: "heading",
          label: "Custom palette (used with the Custom visual system preset)",
        },
        {
          type: "heading",
          label: "General",
        },
        {
          type: "color",
          label: "Background",
          name: "colorBackground",
          defaultValue: "#FFFFFF",
        },
        {
          type: "color",
          label: "Text",
          name: "colorText",
          defaultValue: "#343231",
        },
        {
          type: "color",
          label: "Text (subtle)",
          name: "colorTextSubtle",
          defaultValue: "#524B46",
        },
        {
          type: "color",
          label: "Text (light UI)",
          name: "colorTextLight",
          defaultValue: "#979797",
        },
        {
          type: "color",
          label: "Text (inverse)",
          name: "colorTextInverse",
          defaultValue: "#FEF4EB",
        },
        {
          type: "color",
          label: "Background (subtle UI)",
          name: "colorBackgroundSubtle",
          defaultValue: "#EDEDED",
        },
        {
          type: "color",
          label: "Background (subtle 2)",
          name: "colorBackgroundSubtle2",
          defaultValue: "#DFDFDF",
        },
        {
          type: "color",
          label: "Borders",
          name: "colorLine",
          defaultValue: "#9D9D9D",
        },
        {
          type: "color",
          label: "Borders (subtle)",
          name: "colorLineSubtle",
          defaultValue: "#D8D8D8",
        },
        {
          type: "heading",
          label: "Announcement bar",
        },
        {
          type: "color",
          label: "Announcement text",
          name: "topbarTextColor",
          defaultValue: "#EDEDED",
        },
        {
          type: "color",
          label: "Announcement background",
          name: "topbarBgColor",
          defaultValue: "#565656",
        },
        {
          type: "heading",
          label: "Header",
        },
        {
          type: "color",
          label: "Header background",
          name: "headerBgColor",
          defaultValue: "#FFFFFF",
        },
        {
          type: "color",
          label: "Header background hover",
          name: "headerBgColorHover",
          defaultValue: "#DFDFDF",
        },
        {
          type: "color",
          label: "Header text",
          name: "headerText",
          defaultValue: "#343231",
        },
        {
          type: "color",
          label: "Transparent header text",
          name: "transparentHeaderText",
          defaultValue: "#FEF4EB",
        },
        {
          type: "heading",
          label: "Footer",
        },
        {
          type: "color",
          label: "Footer background",
          name: "footerBgColor",
          defaultValue: "#1B1B19",
        },
        {
          type: "color",
          label: "Footer text",
          name: "footerText",
          defaultValue: "#EDEDED",
        },
        {
          type: "heading",
          label: "Button (primary)",
        },
        {
          type: "color",
          label: "Background color",
          name: "buttonPrimaryBg",
          defaultValue: "#4D4946",
        },
        {
          type: "color",
          label: "Text color",
          name: "buttonPrimaryColor",
          defaultValue: "#F1EEEA",
        },
        {
          type: "color",
          label: "Background color (hover)",
          name: "buttonPrimaryBgHover",
          defaultValue: "#6D6966",
        },
        {
          type: "color",
          label: "Text color (hover)",
          name: "buttonPrimaryColorHover",
          defaultValue: "#F1EEEA",
        },
        {
          type: "heading",
          label: "Button (secondary)",
        },
        {
          type: "color",
          label: "Background color",
          name: "buttonSecondaryBg",
          defaultValue: "#F0EFED",
        },
        {
          type: "color",
          label: "Text color",
          name: "buttonSecondaryColor",
          defaultValue: "#24211E",
        },
        {
          type: "color",
          label: "Background color (hover)",
          name: "buttonSecondaryBgHover",
          defaultValue: "#E9E7E4",
        },
        {
          type: "color",
          label: "Text color (hover)",
          name: "buttonSecondaryColorHover",
          defaultValue: "#24211E",
        },
        {
          type: "heading",
          label: "Button (outline)",
        },
        {
          type: "color",
          label: "Text color",
          name: "buttonOutlineText",
          defaultValue: "#343231",
        },
        {
          type: "color",
          label: "Background color",
          name: "buttonOutlineBackground",
          defaultValue: "#FFFFFF",
        },
        {
          type: "color",
          label: "Border color",
          name: "buttonOutlineBorder",
          defaultValue: "#B1B0AF",
        },
        {
          type: "color",
          label: "Text color (hover)",
          name: "buttonOutlineTextHover",
          defaultValue: "#524B46",
        },
        {
          type: "color",
          label: "Background color (hover)",
          name: "buttonOutlineBackgroundHover",
          defaultValue: "#E9E7E4",
        },
        {
          type: "color",
          label: "Border color (hover)",
          name: "buttonOutlineBorderHover",
          defaultValue: "#B0ACA9",
        },
        {
          type: "heading",
          label: "Badges / labels / tags",
        },
        {
          type: "color",
          label: "Discounts",
          name: "saleBadgeColor",
          defaultValue: "#573B3B",
        },
        {
          type: "color",
          label: "New",
          name: "newBadgeColor",
          defaultValue: "#EBE8E5",
        },
        {
          type: "color",
          label: "Best seller / Hot",
          name: "bestSellerBadgeColor",
          defaultValue: "#3B3B3B",
        },
        {
          type: "color",
          label: "Sold out / unavailable",
          name: "soldOutBadgeColor",
          defaultValue: "#DFDFDF",
        },
        {
          type: "color",
          label: "Bundle",
          name: "bundleBadgeColor",
          defaultValue: "#3B3B3B",
        },
        {
          type: "heading",
          label: "Others",
        },
        {
          type: "color",
          label: "Compare price text",
          name: "comparePriceTextColor",
          defaultValue: "#979797",
        },
        {
          type: "color",
          label: "Star rating",
          name: "starRatingColor",
          defaultValue: "#343231",
        },
      ],
    },
    {
      group: "Typography",
      inputs: [
        {
          type: "heading",
          label: "Headings",
        },
        {
          type: "select",
          label: "Letter spacing",
          name: "headingBaseSpacing",
          configs: {
            options: [
              { label: "-75", value: "-0.075em" },
              { label: "-50", value: "-0.05em" },
              { label: "-25", value: "-0.025em" },
              { label: "-12.5", value: "-0.0125em" },
              { label: "0", value: "0em" },
              { label: "25", value: "0.025em" },
              { label: "50", value: "0.05em" },
              { label: "75", value: "0.075em" },
              { label: "100", value: "0.1em" },
              { label: "150", value: "0.15em" },
              { label: "200", value: "0.2em" },
              { label: "250", value: "0.25em" },
            ],
          },
          defaultValue: "-0.025em",
        },
        {
          type: "range",
          label: "Font size",
          name: "h1BaseSize",
          configs: {
            min: 48,
            max: 92,
            step: 1,
            unit: "px",
          },
          defaultValue: 64,
        },
        {
          type: "range",
          label: "Line height",
          name: "headingBaseLineHeight",
          configs: {
            min: 0.8,
            max: 2,
            step: 0.1,
          },
          defaultValue: 1.1,
        },
        {
          type: "heading",
          label: "Body text",
        },
        {
          type: "select",
          label: "Letter spacing",
          name: "bodyBaseSpacing",
          configs: {
            options: [
              { label: "-75", value: "-0.075em" },
              { label: "-50", value: "-0.05em" },
              { label: "-25", value: "-0.025em" },
              { label: "0", value: "0em" },
              { label: "25", value: "0.025em" },
              { label: "50", value: "0.05em" },
              { label: "75", value: "0.075em" },
              { label: "100", value: "0.1em" },
              { label: "150", value: "0.15em" },
              { label: "200", value: "0.2em" },
              { label: "250", value: "0.25em" },
            ],
          },
          defaultValue: "-0.0125em",
        },
        {
          type: "range",
          label: "Font size",
          name: "bodyBaseSize",
          configs: {
            min: 12,
            max: 48,
            step: 1,
            unit: "px",
          },
          defaultValue: 14,
        },
        {
          type: "range",
          label: "Line height",
          name: "bodyBaseLineHeight",
          configs: {
            min: 0.8,
            max: 2,
            step: 0.1,
          },
          defaultValue: 1.5,
        },
      ],
    },
    {
      group: "Radius",
      inputs: [
        {
          type: "range",
          label: "Extra small",
          name: "radiusXs",
          configs: {
            min: 0,
            max: 16,
            step: 1,
            unit: "px",
          },
          defaultValue: 4,
          helpText: "Dense utility elements such as tags and checkmarks.",
        },
        {
          type: "range",
          label: "Small",
          name: "radiusSm",
          configs: {
            min: 0,
            max: 24,
            step: 1,
            unit: "px",
          },
          defaultValue: 8,
          helpText: "Product cards, inputs, and buttons.",
        },
        {
          type: "range",
          label: "Medium",
          name: "radiusMd",
          configs: {
            min: 0,
            max: 32,
            step: 1,
            unit: "px",
          },
          defaultValue: 12,
          helpText: "Content cards, overlays, and drawer containers.",
        },
      ],
    },
    {
      group: "Product badges",
      inputs: [
        {
          type: "range",
          label: "Border radius",
          name: "badgeBorderRadius",
          configs: {
            min: 0,
            max: 10,
            step: 2,
            unit: "px",
          },
          defaultValue: 4,
        },
        {
          type: "select",
          label: "Text transform",
          name: "badgeTextTransform",
          configs: {
            options: [
              { value: "none", label: "None" },
              { value: "uppercase", label: "Uppercase" },
              { value: "lowercase", label: "Lowercase" },
              { value: "capitalize", label: "Capitalize" },
            ],
          },
          defaultValue: "uppercase",
        },
        {
          type: "text",
          label: "Best Seller / Hot text",
          name: "bestSellerBadgeText",
          defaultValue: "Best Seller",
          placeholder: "Best Seller",
        },
        {
          type: "text",
          label: "New text",
          name: "newBadgeText",
          defaultValue: "New Arrival",
          placeholder: "New Arrival",
        },
        {
          type: "range",
          label: "Days old",
          name: "newBadgeDaysOld",
          configs: {
            min: 0,
            max: 365,
            step: 1,
          },
          defaultValue: 30,
          helpText:
            "The <strong>New</strong> badge will be shown if the product is published within the last days.",
        },
        {
          type: "text",
          label: "Sold out text",
          name: "soldOutBadgeText",
          defaultValue: "Sold out",
          placeholder: "Sold out",
        },
        {
          type: "text",
          label: "Bundle text",
          name: "bundleBadgeText",
          defaultValue: "Bundle",
          placeholder: "Bundle",
        },
        {
          type: "textarea",
          label: "Sale badge text",
          name: "saleBadgeText",
          defaultValue: "[percentage]% Off",
          placeholder: "[percentage]% Off, Saved [amount], or Sale",
          helpText: [
            "<p class='mb-1'>- Use <strong>[percentage]</strong> to display the discount percentage.</p>",
            "<p class='mb-1'>- Use <strong>[amount]</strong> to display the discount amount.</p>",
            "<p>E.g. <strong>[percentage]% Off</strong>, <strong>Saved [amount]</strong>, or <strong>Sale</strong>.</p>",
          ].join(""),
        },
      ],
    },
    {
      group: "Product cards",
      inputs: [
        {
          type: "color",
          name: "pcardBackgroundColor",
          label: "Background color",
          defaultValue: "",
        },
        {
          type: "color",
          name: "pcardHoverBackgroundColor",
          label: "Hover background color",
          defaultValue: "#F1F1F1",
        },
        {
          type: "range",
          name: "pcardBorderRadius",
          label: "Border radius",
          configs: {
            min: 0,
            max: 40,
            step: 2,
            unit: "px",
          },
          defaultValue: 8,
        },
        {
          type: "heading",
          label: "Image",
        },
        {
          type: "switch",
          name: "pcardShowImageOnHover",
          label: "Show second image on hover",
          defaultValue: true,
        },
        {
          type: "select",
          name: "pcardImageRatio",
          label: "Image aspect ratio",
          defaultValue: "1/1",
          configs: {
            options: [
              { value: "adapt", label: "Adapt to image" },
              { value: "1/1", label: "Square (1/1)" },
              { value: "3/4", label: "Portrait (3/4)" },
              { value: "4/3", label: "Landscape (4/3)" },
              { value: "16/9", label: "Widescreen (16/9)" },
            ],
          },
          helpText:
            'Learn more about image <a href="https://developer.mozilla.org/en-US/docs/Web/CSS/aspect-ratio" target="_blank" rel="noopener noreferrer">aspect ratio</a> property.',
        },
        {
          type: "heading",
          label: "Content",
        },
        {
          type: "select",
          label: "Title & prices alignment",
          name: "pcardTitlePricesAlignment",
          configs: {
            options: [
              { value: "horizontal", label: "Horizontal" },
              { value: "vertical", label: "Vertical" },
            ],
          },
          defaultValue: "vertical",
        },
        {
          type: "toggle-group",
          name: "pcardAlignment",
          label: "Content alignment",
          configs: {
            options: [
              { value: "left", label: "Left", icon: "align-start-vertical" },
              {
                value: "center",
                label: "Center",
                icon: "align-center-vertical",
              },
              { value: "right", label: "Right", icon: "align-end-vertical" },
            ],
          },
          defaultValue: "left",
          condition: (data) => data.pcardTitlePricesAlignment === "vertical",
        },
        {
          type: "switch",
          label: "Show vendor",
          name: "pcardShowVendor",
          defaultValue: false,
        },
        {
          type: "switch",
          label: "Show lowest price",
          name: "pcardShowLowestPrice",
          defaultValue: false,
        },
        {
          type: "switch",
          label: "Show sale price",
          name: "pcardShowSalePrice",
          defaultValue: true,
          condition: (data) => data.pcardShowLowestPrice !== true,
        },
        {
          type: "switch",
          label: "Show product rating",
          name: "pcardShowRating",
          defaultValue: true,
        },
        {
          type: "switch",
          label: "Show option values",
          name: "pcardShowOptionValues",
          defaultValue: true,
        },
        {
          type: "text",
          label: "Option to show",
          name: "pcardOptionToShow",
          defaultValue: "Color",
          placeholder: "Color",
          condition: (data) => data.pcardShowOptionValues === true,
        },
        {
          type: "range",
          label: "Max option values to show",
          name: "pcardMaxOptionValues",
          configs: {
            min: 2,
            max: 10,
          },
          defaultValue: 5,
          condition: (data) => data.pcardShowOptionValues === true,
        },
        {
          type: "heading",
          label: "Quick shop",
        },
        {
          type: "switch",
          label: "Enable quick shop",
          name: "pcardEnableQuickShop",
          defaultValue: true,
        },
        {
          type: "switch",
          label: "Enable customer wishlist",
          name: "pcardEnableWishlist",
          defaultValue: true,
        },
        {
          type: "switch",
          label: "Show quick shop on hover",
          name: "pcardShowQuickShopOnHover",
          defaultValue: true,
          condition: (data) => data.pcardEnableQuickShop === true,
        },
        {
          type: "heading",
          label: "Badges",
        },
        {
          type: "toggle-group",
          name: "pcardBadgesPosition",
          label: "Badges position",
          configs: {
            options: [
              { value: "top-left", label: "Top left" },
              { value: "top-center", label: "Top center" },
              { value: "top-right", label: "Top right" },
            ],
          },
          defaultValue: "top-left",
        },
        {
          type: "switch",
          label: "Show sale badges",
          name: "pcardShowSaleBadges",
          defaultValue: true,
        },
        {
          type: "switch",
          label: "Show Hot / Best Seller badges",
          name: "pcardShowBestSellerBadges",
          defaultValue: true,
        },
        {
          type: "switch",
          label: "Show New badges",
          name: "pcardShowNewBadges",
          defaultValue: true,
        },
        {
          type: "switch",
          label: "Show Out of stock badges",
          name: "pcardShowOutOfStockBadges",
          defaultValue: true,
        },
        {
          type: "switch",
          label: "Show Bundle badges",
          name: "pcardShowBundleBadge",
          defaultValue: true,
        },
        {
          type: "switch",
          label: "Show badges on mobile",
          name: "pcardShowBadgesOnMobile",
          defaultValue: false,
        },
      ],
    },
    {
      group: "Cart",
      inputs: [
        {
          type: "text",
          label: "Cart title empty state",
          name: "cartTitleEmpty",
          defaultValue:
            "Looks like you haven't added anything yet, let's get you started!",
        },
        {
          type: "text",
          label: "Button tittle start shopping",
          name: "buttonStartShopping",
          defaultValue: "Start Shopping",
        },
        {
          type: "switch",
          label: "Enable cart best sellers",
          name: "enableCartBestSellers",
          defaultValue: true,
        },
        {
          type: "switch",
          label: "Enable free shipping",
          name: "enableFreeShipping",
          defaultValue: true,
        },
        {
          type: "text",
          label: "Total amount sufficient for free shipping",
          name: "freeShippingThreshold",
          defaultValue: "50",
          placeholder: "Only numeric values can be entered.",
        },
        {
          type: "heading",
          label: "Cart summary info",
        },
        {
          type: "switch",
          label: "Enable cart note",
          name: "enableCartNote",
          defaultValue: true,
        },
        {
          type: "text",
          label: "Cart note button text",
          name: "cartNoteButtonText",
          defaultValue: "Add a note",
          placeholder: "Add a note",
          condition: (theme) => theme.enableCartNote === true,
        },
        {
          type: "switch",
          label: "Enable discount code",
          name: "enableDiscountCode",
          defaultValue: true,
        },
        {
          type: "text",
          label: "Discount code button text",
          name: "discountCodeButtonText",
          defaultValue: "Discount code",
          placeholder: "Discount code",
          condition: (theme) => theme.enableDiscountCode === true,
        },
        {
          type: "switch",
          label: "Enable gift card",
          name: "enableGiftCard",
          defaultValue: true,
        },
        {
          type: "text",
          label: "Gift card button text",
          name: "giftCardButtonText",
          defaultValue: "Giftcard",
          placeholder: "Gift card",
          condition: (theme) => theme.enableGiftCard === true,
        },
        {
          type: "text",
          label: "Checkout button text",
          name: "checkoutButtonText",
          defaultValue: "Continue to Checkout",
          placeholder: "Continue to Checkout",
        },
      ],
    },
    {
      group: "Quick shop",
      inputs: [
        {
          type: "heading",
          label: "Product Media",
        },
        {
          label: "Enable zoom",
          name: "enableZoom",
          type: "switch",
          defaultValue: true,
        },
        {
          type: "switch",
          label: "Show badges on product media",
          name: "showBadgesOnProductMedia",
          defaultValue: true,
          helpText:
            "Display sale, new, and best seller badges on product images",
        },
        {
          type: "heading",
          label: "Quick Shop",
        },
        {
          type: "text",
          label: "Quick shop button text",
          name: "quickShopButtonTextOpen",
          defaultValue: "Select options",
        },
        {
          type: "text",
          label: "Add to cart text",
          name: "addToCartText",
          defaultValue: "Add to cart",
          placeholder: "Add to cart",
        },
        {
          type: "text",
          label: "Sold out text",
          name: "soldOutText",
          defaultValue: "Sold out",
          placeholder: "Sold out",
        },
        {
          type: "switch",
          label: "Show compare at price",
          name: "showCompareAtPrice",
          defaultValue: true,
        },
        {
          type: "heading",
          label: "Navigation",
        },
        {
          type: "select",
          label: "Navigation style",
          name: "quickShopNavigationStyle",
          configs: {
            options: [
              { value: "corner", label: "Corner" },
              { value: "sides", label: "Sides" },
            ],
          },
          defaultValue: "corner",
        },
        {
          type: "select",
          label: "Arrows color",
          name: "quickShopArrowsColor",
          configs: {
            options: [
              { value: "primary", label: "Primary" },
              { value: "secondary", label: "Secondary" },
            ],
          },
          defaultValue: "primary",
        },
        {
          type: "toggle-group",
          label: "Arrows shape",
          name: "quickShopArrowsShape",
          configs: {
            options: [
              { value: "rounded-sm", label: "Rounded", icon: "squircle" },
              { value: "circle", label: "Circle", icon: "circle" },
              { value: "square", label: "Square", icon: "square" },
            ],
          },
          defaultValue: "circle",
        },
        {
          type: "heading",
          label: "Zoom",
        },
        {
          type: "select",
          label: "Arrows zoom button color",
          name: "quickShopArrowsZoomColor",
          configs: {
            options: [
              { value: "primary", label: "Primary" },
              { value: "secondary", label: "Secondary" },
            ],
          },
          defaultValue: "primary",
        },
        {
          type: "toggle-group",
          label: "Arrows zoom button shape",
          name: "quickShopArrowsZoomShape",
          configs: {
            options: [
              { value: "rounded-sm", label: "Rounded", icon: "squircle" },
              { value: "circle", label: "Circle", icon: "circle" },
              { value: "square", label: "Square", icon: "square" },
            ],
          },
          defaultValue: "circle",
        },
        {
          type: "select",
          label: "Zoom button color",
          name: "quickShopZoomColor",
          configs: {
            options: [
              { value: "primary", label: "Primary" },
              { value: "secondary", label: "Secondary" },
            ],
          },
          defaultValue: "primary",
          condition: (data) => data.enableZoom === true,
        },
        {
          type: "toggle-group",
          label: "Zoom button shape",
          name: "quickShopZoomShape",
          configs: {
            options: [
              { value: "rounded-sm", label: "Rounded", icon: "squircle" },
              { value: "circle", label: "Circle", icon: "circle" },
              { value: "square", label: "Square", icon: "square" },
            ],
          },
          defaultValue: "circle",
          condition: (data) => data.enableZoom === true,
        },
      ],
    },
    {
      group: "Animations and effects",
      inputs: [
        {
          type: "switch",
          label: "Enable view transition",
          name: "enableViewTransition",
          defaultValue: true,
          helpText:
            'Learn more about how <a href="https://developer.mozilla.org/en-US/docs/Web/API/View_Transitions_API" target="_blank" rel="noreferrer">View Transitions API</a> work.',
        },
        {
          type: "switch",
          label: "Reveal elements on scroll",
          name: "revealElementsOnScroll",
          defaultValue: true,
        },
      ],
    },
    {
      group: "Search",
      inputs: [
        {
          type: "image",
          name: "searchEditorialImage",
          label: "Editorial image",
          helpText:
            "Displayed below search results. Leave empty to hide the editorial banner.",
        },
        {
          type: "text",
          name: "searchEditorialHeading",
          label: "Editorial heading",
          defaultValue: "Decorate for holidays and beyond",
        },
        {
          type: "text",
          name: "searchEditorialLinkText",
          label: "Editorial link text",
          defaultValue: "Explore now",
        },
        {
          type: "url",
          name: "searchEditorialLink",
          label: "Editorial link",
          defaultValue: "/collections",
        },
      ],
    },
    {
      group: "Footer",
      inputs: [
        {
          type: "select",
          name: "footerWidth",
          label: "Footer width",
          configs: {
            options: [
              { value: "full", label: "Full page" },
              { value: "stretch", label: "Stretch" },
              { value: "fixed", label: "Fixed" },
            ],
          },
          defaultValue: "full",
        },
        {
          type: "image",
          name: "footerLogoData",
          label: "Logo",
          defaultValue: "",
        },
        {
          type: "range",
          name: "footerLogoWidth",
          label: "Logo width",
          configs: {
            min: 20,
            max: 500,
            step: 1,
            unit: "px",
          },
          defaultValue: 300,
        },
        {
          type: "richtext",
          name: "bio",
          label: "Store bio",
          defaultValue:
            "<p>Modern furniture designed for living. Built for longevity, crafted with care.</p>",
        },
        {
          type: "heading",
          label: "Business hours",
        },
        {
          type: "text",
          name: "businessHoursTitle",
          label: "Title",
          defaultValue: "BUSINESS HOURS",
        },
        {
          type: "text",
          name: "businessHoursWeekdays",
          label: "Weekday hours",
          defaultValue: "Monday to Friday, 9:00 AM – 6:00 PM",
        },
        {
          type: "text",
          name: "businessHoursWeekend",
          label: "Weekend hours",
          defaultValue: "Saturday to Sunday, 10:00 AM – 2:00 PM",
        },
        {
          type: "heading",
          label: "Social links",
        },
        {
          type: "text",
          name: "socialInstagram",
          label: "Instagram",
          defaultValue: "https://www.instagram.com/",
        },
        {
          type: "text",
          name: "socialX",
          label: "X (formerly Twitter)",
          defaultValue: "https://x.com/i/communities/1636383560197373952",
        },
        {
          type: "text",
          name: "socialLinkedIn",
          label: "LinkedIn",
          defaultValue: "https://www.linkedin.com/company/weaverseio",
        },
        {
          type: "text",
          name: "socialFacebook",
          label: "Facebook",
          defaultValue: "https://www.facebook.com/weaverse",
        },
        {
          type: "heading",
          label: "Store information",
        },
        {
          type: "text",
          name: "addressTitle",
          label: "Title",
          defaultValue: "CONTACT",
          placeholder: "Contact",
        },
        {
          type: "textarea",
          name: "storeAddress",
          label: "Address",
          defaultValue:
            "123 Main Street, Suite 200\nLos Angeles, CA, USA, 90015",
          placeholder:
            "123 Main Street, Suite 200\nLos Angeles, CA, USA, 90015",
        },
        {
          type: "text",
          name: "storeEmail",
          label: "Email",
          defaultValue: "hello@aspen.com",
          placeholder: "hello@aspen.com",
        },
        {
          type: "text",
          name: "storePhone",
          label: "Phone",
          defaultValue: "+1 (555) 123-4567",
          placeholder: "+1 (555) 123-4567",
        },
        {
          type: "heading",
          label: "Newsletter",
        },
        {
          type: "text",
          name: "newsletterTitle",
          label: "Title",
          defaultValue: "STAY IN TOUCH",
          placeholder: "Stay in touch",
        },
        {
          type: "text",
          name: "newsletterDescription",
          label: "Description",
          defaultValue: "News and inspiration in your inbox, every week.",
        },
        {
          type: "text",
          name: "newsletterPlaceholder",
          label: "Input placeholder",
          defaultValue: "Enter your email",
          placeholder: "Enter your email",
        },
        {
          type: "text",
          name: "newsletterButtonText",
          label: "Button text",
          defaultValue: "SEND",
          placeholder: "SEND",
        },
        {
          type: "richtext",
          name: "copyright",
          label: "Copyright text",
          defaultValue:
            '<p>© 2025 Aspen Theme. <a href="https://www.shopify.com/?utm_campaign=poweredby&utm_medium=shopify&utm_source=onlinestore">Powered by Shopify</a></p>',
        },
        {
          type: "heading",
          label: "Payment methods",
        },
        {
          type: "switch",
          name: "showVisaIcon",
          label: "Show Visa",
          defaultValue: true,
          helpText:
            "Toggle payment method icons. If your store has payment methods configured in Shopify Admin, those will be displayed automatically. Maximum 5 icons will be displayed, with a '+N' indicator for remaining methods.",
        },
        {
          type: "switch",
          name: "showMastercardIcon",
          label: "Show Mastercard",
          defaultValue: true,
        },
        {
          type: "switch",
          name: "showAmexIcon",
          label: "Show American Express",
          defaultValue: true,
        },
        {
          type: "switch",
          name: "showPaypalIcon",
          label: "Show PayPal",
          defaultValue: true,
        },
        {
          type: "switch",
          name: "showDiscoverIcon",
          label: "Show Discover",
          defaultValue: false,
        },
        {
          type: "switch",
          name: "showDinersIcon",
          label: "Show Diners Club",
          defaultValue: true,
        },
        {
          type: "switch",
          name: "showJcbIcon",
          label: "Show JCB",
          defaultValue: false,
        },
        {
          type: "switch",
          name: "showUnionpayIcon",
          label: "Show UnionPay",
          defaultValue: false,
        },
        {
          type: "switch",
          name: "showApplePayIcon",
          label: "Show Apple Pay",
          defaultValue: false,
        },
        {
          type: "switch",
          name: "showGooglePayIcon",
          label: "Show Google Pay",
          defaultValue: false,
        },
      ],
    },
  ],
};
