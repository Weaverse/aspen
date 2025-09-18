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
      label: "United States (USD $)",
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
          type: "range",
          label: "Page width",
          name: "pageWidth",
          configs: {
            min: 1000,
            max: 1600,
            step: 10,
            unit: "px",
          },
          defaultValue: 1280,
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
          label: "Height",
          name: "topbarHeight",
          configs: {
            min: 10,
            max: 100,
            step: 1,
            unit: "px",
          },
          defaultValue: 36,
        },
        {
          type: "richtext",
          name: "topbarText",
          label: "Content",
          defaultValue: "",
        },
        {
          type: "range",
          label: "Content gap",
          name: "topbarScrollingGap",
          configs: {
            min: 0,
            max: 100,
            step: 1,
            unit: "px",
          },
          condition: "layoutText.eq.scroll",
          defaultValue: 44,
        },
        {
          type: "range",
          label: "Scrolling speed",
          name: "topbarScrollingSpeed",
          configs: {
            min: 1,
            max: 20,
            step: 1,
            unit: "x",
          },
          condition: "layoutText.eq.scroll",
          defaultValue: 5,
        },
        {
          type: "heading",
          label: "Social links",
        },
        {
          type: "text",
          name: "socialInstagramAnnouncement",
          label: "Instagram",
          defaultValue: "https://www.instagram.com/",
        },
        {
          type: "text",
          name: "socialXAnnouncement",
          label: "X (formerly Twitter)",
          defaultValue: "https://x.com/i/communities/1636383560197373952",
        },
        {
          type: "text",
          name: "socialLinkedInAnnouncement",
          label: "LinkedIn",
          defaultValue: "https://www.linkedin.com/company/weaverseio",
        },
        {
          type: "text",
          name: "socialFacebookAnnouncement",
          label: "Facebook",
          defaultValue: "https://www.facebook.com/weaverse",
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
          type: "switch",
          label: "Enable transparent header",
          name: "enableTransparentHeader",
          defaultValue: true,
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
          label: "General",
        },
        {
          type: "color",
          label: "Background",
          name: "colorBackground",
          defaultValue: "#ffffff",
        },
        {
          type: "color",
          label: "Text",
          name: "colorText",
          defaultValue: "#24211E",
        },
        {
          type: "color",
          label: "Text (subtle)",
          name: "colorTextSubtle",
          defaultValue: "#524B46",
        },
        {
          type: "color",
          label: "Text (basic)",
          name: "colorTextInverse",
          defaultValue: "#fff",
        },
        {
          type: "color",
          label: "Borders",
          name: "colorLine",
          defaultValue: "#A79D95",
        },
        {
          type: "color",
          label: "Borders (subtle)",
          name: "colorLineSubtle",
          defaultValue: "#DBD7D1",
        },
        {
          type: "heading",
          label: "Announcement bar",
        },
        {
          type: "color",
          label: "Announcement text",
          name: "topbarTextColor",
          defaultValue: "#524B46",
        },
        {
          type: "color",
          label: "Announcement background",
          name: "topbarBgColor",
          defaultValue: "#F2F0EE",
        },
        {
          type: "heading",
          label: "Header",
        },
        {
          type: "color",
          label: "Header background",
          name: "headerBgColor",
          defaultValue: "#ffffff",
        },
        {
          type: "color",
          label: "Header background hover",
          name: "headerBgColorHover",
          defaultValue: "#EBE8E5",
        },
        {
          type: "color",
          label: "Header text",
          name: "headerText",
          defaultValue: "#24211E",
        },
        {
          type: "color",
          label: "Transparent header text",
          name: "transparentHeaderText",
          defaultValue: "#ffffff",
        },
        {
          type: "heading",
          label: "Footer",
        },
        {
          type: "color",
          label: "Footer background",
          name: "footerBgColor",
          defaultValue: "#EBE8E5",
        },
        {
          type: "color",
          label: "Footer text",
          name: "footerText",
          defaultValue: "#24211E",
        },
        {
          type: "heading",
          label: "Button (primary)",
        },
        {
          type: "color",
          label: "Background color",
          name: "buttonPrimaryBg",
          defaultValue: "#908379",
        },
        {
          type: "color",
          label: "Text color",
          name: "buttonPrimaryColor",
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
          type: "heading",
          label: "Button (outline)",
        },
        {
          type: "color",
          label: "Text color",
          name: "buttonOutlineText",
          defaultValue: "#524B46",
        },
        {
          type: "color",
          label: "Background color",
          name: "buttonOutlineBackground",
          defaultValue: "#A79D95",
        },
        {
          type: "color",
          label: "Border color",
          name: "buttonOutlineBorder",
          defaultValue: "#A79D95",
        },
        {
          type: "heading",
          label: "Badges / labels / tags",
        },
        {
          type: "color",
          label: "Discounts",
          name: "saleBadgeColor",
          defaultValue: "#c6512c",
        },
        {
          type: "color",
          label: "New",
          name: "newBadgeColor",
          defaultValue: "#67785d",
        },
        {
          type: "color",
          label: "Best seller / Hot",
          name: "bestSellerBadgeColor",
          defaultValue: "#000000",
        },
        {
          type: "color",
          label: "Sold out / unavailable",
          name: "soldOutBadgeColor",
          defaultValue: "#d4d4d4",
        },
        {
          type: "heading",
          label: "Others",
        },
        {
          type: "color",
          label: "Compare price text",
          name: "comparePriceTextColor",
          defaultValue: "#84807B",
        },
        {
          type: "color",
          label: "Star rating",
          name: "starRatingColor",
          defaultValue: "#fde047",
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
          defaultValue: "0.025em",
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
          defaultValue: 60,
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
          defaultValue: 1.2,
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
          defaultValue: "0.025em",
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
          defaultValue: 0,
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
          defaultValue: "Uppercase",
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
          defaultValue: "New",
          placeholder: "New",
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
          type: "textarea",
          label: "Sale badge text",
          name: "saleBadgeText",
          defaultValue: "-[percentage]% Off",
          placeholder: "-[percentage]% Off, Saved [amount], or Sale",
          helpText: [
            "<p class='mb-1'>- Use <strong>[percentage]</strong> to display the discount percentage.</p>",
            "<p class='mb-1'>- Use <strong>[amount]</strong> to display the discount amount.</p>",
            "<p>E.g. <strong>-[percentage]% Off</strong>, <strong>Saved [amount]</strong>, or <strong>Sale</strong>.</p>",
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
          type: "range",
          name: "pcardBorderRadius",
          label: "Border radius",
          configs: {
            min: 0,
            max: 40,
            step: 2,
            unit: "px",
          },
          defaultValue: 0,
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
          defaultValue: "adapt",
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
          defaultValue: "horizontal",
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
          defaultValue: "center",
          condition: (data) => data.pcardTitlePricesAlignment === "vertical",
        },
        {
          type: "switch",
          label: "Show vendor",
          name: "pcardShowVendor",
          defaultValue: true,
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
        // {
        //   type: "select",
        //   label: "Quick shop button type",
        //   name: "pcardQuickShopButtonType",
        //   configs: {
        //     options: [
        //       { value: "icon", label: "Icon button" },
        //       { value: "text", label: "Text button" },
        //     ],
        //   },
        //   defaultValue: "icon",
        //   condition: (data) => data.pcardEnableQuickShop === true,
        // },
        // {
        //   type: "text",
        //   label: "Quick shop button text",
        //   name: "pcardQuickShopButtonText",
        //   defaultValue: "Quick shop",
        //   placeholder: "Quick shop",
        //   condition: (data) => data.pcardQuickShopButtonType === "text",
        // },
        // {
        //   type: "select",
        //   label: "Quick shop action",
        //   name: "pcardQuickShopAction",
        //   configs: {
        //     options: [
        //       { value: "go-to-page", label: "Go to product page" },
        //       { value: "open-quick-shop", label: "Open quick shop panel" },
        //     ],
        //   },
        //   defaultValue: "open-quick-shop",
        //   condition: (data) => data.pcardEnableQuickShop === true,
        // },
        // {
        //   type: "select",
        //   label: "Quick shop panel type",
        //   name: "pcardQuickShopPanelType",
        //   configs: {
        //     options: [
        //       { value: "modal", label: "Modal" },
        //       { value: "drawer", label: "Drawer" },
        //     ],
        //   },
        //   defaultValue: "modal",
        //   condition: (data) => data.pcardQuickShopAction === "open-quick-shop",
        // },
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
          defaultValue: "top-right",
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
            "Looks like you haven’t added anything yet, let’s get you started!",
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
          defaultValue: "Quick shop",
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
          defaultValue: "fixed",
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
          defaultValue: 400,
        },
        {
          type: "richtext",
          name: "bio",
          label: "Store bio",
          defaultValue:
            "<p>We are a team of designers, developers, and creatives who are passionate about creating beautiful and functional products.</p>",
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
          defaultValue: "OUR SHOP",
          placeholder: "Our shop",
        },
        {
          type: "text",
          name: "storeAddress",
          label: "Address",
          defaultValue: "301 Front St W, Toronto, ON M5V 2T6, Canada",
          placeholder: "301 Front St W, Toronto, ON M5V 2T6, Canada",
        },
        {
          type: "text",
          name: "storeEmail",
          label: "Email",
          defaultValue: "contact@my-store.com",
          placeholder: "contact@my-store.com",
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
          defaultValue: "Please enter your email",
          placeholder: "Please enter your email",
        },
        {
          type: "text",
          name: "newsletterButtonText",
          label: "Button text",
          defaultValue: "Send",
          placeholder: "Send",
        },
        {
          type: "richtext",
          name: "copyright",
          label: "Copyright text",
          defaultValue: "© 2024 Weaverse. All rights reserved.",
        },
      ],
    },
  ],
};
