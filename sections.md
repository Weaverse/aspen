# Aspen Weaverse section registry

This inventory reflects the components registered in
`app/weaverse/components.ts`. Match a design by composition, layout mechanism,
interaction, and then content model.

| Section | Composition / layout | Primary data or media | Key capabilities and constraints |
| --- | --- | --- | --- |
| `main-product` | Product gallery plus product-information column; stacked below 1024 px | Shopify product media, variants, selling plans and Judge.me | Product pages only. Slider/grid gallery, responsive story, reviews, stock state, options, subscription, ATC and accordions. |
| `featured-products` | Card grid or carousel with heading/link | Shopify collection | Responsive Swiper and grid modes. On product pages it becomes a three-card cross-sell carousel and can show a desktop promo. |
| `related-products` | Horizontal overflow rail | Shopify recommendations | Product pages only. Fixed-width cards; simpler than `featured-products`. |
| `judgeme-reviews` | Review summary, distribution, form, list and pagination | Judge.me | Product pages only. Handles empty data and submission states. |
| `hero-image` | Background-overlay hero | Static image | Height, overlay, background position and content position. Empty legacy product hero is suppressed because `main-product` owns product storytelling. |
| `hero-video` | Background-overlay hero | Video | Full hero behavior for video-led marketing pages. |
| `image-with-text` | Overlay or split columns | One or two images plus text children | Split supports left/right media; overlay supports two images. Not a replacement for multi-row product storytelling. |
| `image-gallery` | Repeated image grid | Manual images | Configurable gallery child items. |
| `columns-with-images` | Card grid | Manual image/content cards | Repeated column children; appropriate for feature grids. |
| `promotion-grid` | Grid of promotional cards | Manual images and links | Nested grid item/content blocks with slider controls where configured. |
| `slideshow` | One slide at a time | Manual image/content slides | Swiper navigation and dots. |
| `collection-filters` | Product result grid with filter/sort tools | Shopify collection | Collection pages; responsive filter and sort drawers. |
| `collection-list-page` | Collection card grid | Shopify collections | Collection index data. |
| `collection-list-dynamic` | Collection-driven content and cards | Shopify collections | Content and item child blocks. |
| `all-products` | Product listing | Shopify products | General product index use. |
| `single-product` | Single merchandising card/feature | Shopify product | Compact product spotlight, not full PDP. |
| `hotspots` | Image with product hotspots | Image plus Shopify products | Interactive hotspot popovers. |
| `testimonials` | Testimonial cards/hotspots | Manual content | Slider/card testimonial compositions. |
| `before-and-after` | Interactive comparison slider | Two images | Drag comparison interaction. |
| `accordion` | Stacked disclosure list | Manual content | Accordion group/item and information child types. |
| `highlights` | Repeated badge/highlight row | Manual icon/text | Compact trust or feature highlights. |
| `countdown` | Promotional content with timer | Manual content | Timer, subheading and button children. |
| `newsletter` | Heading, copy and signup form | Customer email | Configurable dimensions and colors; hidden on product pages in the approved Product Details layout. |
| `instagram` | Social media rail | Instagram/media URLs | Slider-based social content. |
| `articles`, `blogs`, `blog-post`, `related-articles` | Editorial cards or article content | Shopify blogs/articles | Blog and article templates. |
| `journal` | Featured article split followed by a responsive editorial card grid | Shopify blog articles | Blog pages only. The first article is featured; remaining articles render in three columns on tablet/desktop and one column on mobile, with incremental load-more behavior. |
| `account` | Customer dashboard composed from Orders, Account details and Address book child blocks | Customer Account API | Custom account page only. Mobile follows the 430 px Aspen account design; Orders and addresses become two-column grids on wider screens. |
| `order-details` | Order status cards, responsive line-item cards and order summary | Customer Account API | Custom order page only (`handle: order`). Uses live order data; line items switch from 320 px horizontal cards at 768 px to image-first stacked cards on mobile. |
| `page` | Generic page content | Shopify page | Rich page body. |
| `video-embed` | External video/content split | External embed | Video child plus content. |
| `videos` | Video grid/list | Manual video items | Repeated video children. |
| `map` | Map and address composition | Address/map data | Map and address child blocks. |
| `scrolling-text` | Marquee/ticker | Manual text | Continuous horizontal text. |
| `spacer` | Empty layout block | None | Controlled vertical spacing only. |

## Product Details mapping

The approved Product Details SVG maps to existing sections as follows:

1. `main-product` — gallery, full option selector, selling plan, quantity/ATC,
   accordions, product story and desktop/tablet reviews.
2. `featured-products` — responsive `You may also like` cross-sell, mobile
   reviews, and the desktop-only editorial promo.
3. Global footer — existing layout; the product-page newsletter is hidden.

## Global cart surfaces

The approved cart SVGs map to global commerce components rather than Weaverse
page sections:

1. `CartDrawer` — a global Radix dialog with a 430 px desktop cap, independent
   line scrolling, free-shipping progress, advanced cart actions and fixed
   summary/checkout actions.
2. `/cart` + shared `Cart` — responsive product line cards and order summary.
3. `CartBestSellers` — a Shopify-driven Product Card recommendation rail below
   the cart page and grid in the empty drawer.
4. Theme schema `Cart` group — controls empty copy, best sellers, free-shipping
   threshold, note, discount, gift card and checkout labels.
