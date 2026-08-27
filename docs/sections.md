# Aspen section guide

This guide explains how to compose Aspen pages in Weaverse Studio. It is
written for merchants, implementers, and developers who do not work on the
theme every day.

The component registry in `app/weaverse/components.ts` and the schemas in
`app/sections` are the technical source of truth. Settings described as
"required" below are required for a useful storefront result, even when Studio
allows the section to be saved with an empty value.

## Quick start in Weaverse Studio

1. Choose the correct page type before adding a section. Template sections such
   as Main product, Collection filters, Journal, Account, and Order details only
   work on their matching page types.
2. Add the top-level section first. Add or reorder its child blocks inside it;
   child blocks such as Slide, Hotspots image, Products, or Newsletter form are
   not standalone sections.
3. Start from the Aspen preset, select Shopify resources, then replace copy and
   media. Preserve the preset structure unless the layout intentionally changes.
4. Preview at approximately 430 px, 834 px, and 1440 px before publishing.
5. Test every link, slider control, hotspot, form, and product action on the
   storefront preview. Studio may intentionally disable autoplay.

## Content and media standards

Aspen uses responsive Shopify images, so the pixel dimensions below are
recommendations rather than upload validation rules. Use the same aspect ratio
as the selected setting and upload the largest clean source available.

| Use                                                    | Recommended source                 | Notes                                                                                        |
| ------------------------------------------------------ | ---------------------------------- | -------------------------------------------------------------------------------------------- |
| Desktop hero, slideshow, or full-width editorial image | 2400 × 1200 px, 2:1                | Keep important subjects and text-safe areas near the center.                                 |
| Mobile hero or slideshow override                      | 1200 × 1500 px, 4:5                | Use a separate crop when the desktop focal point will not survive a narrow viewport.         |
| Landscape card                                         | 1600 × 1200 px, 4:3                | Good for articles, promotion cards, store imagery, and content cards.                        |
| Square product or collection card                      | 1200 × 1200 px, 1:1                | Keep product scale and background treatment consistent across the set.                       |
| Portrait card                                          | 1200 × 1600 px, 3:4                | Good for editorial, lifestyle, and vertical collection cards.                                |
| Reel or shoppable video                                | 1080 × 1920 px, 9:16               | Prefer MP4/WebM with muted autoplay-safe content; do not bake essential copy into the video. |
| Standard landscape video                               | 1920 × 1080 px, 16:9               | Supply a poster with the same crop for Hero video.                                           |
| Before/after pair                                      | Matching 2400 × 1200 px files, 2:1 | Both files must have identical dimensions, crop, and camera position.                        |
| Blog/article image                                     | 1600 × 1200 px, 4:3                | Use one consistent ratio across the blog index.                                              |
| Icon                                                   | Optimized SVG when possible        | Avoid untrusted scripts or complex inline SVG markup.                                        |

General copy guidance:

- Use one message per section. A heading should normally fit in one or two
  desktop lines and no more than three mobile lines.
- Keep promotional headings to roughly 3–10 words, supporting copy to 15–35
  words, and CTA labels to 1–3 words.
- Use sentence case for body copy. Use Aspen's uppercase display style only for
  short headings, labels, and CTAs.
- Describe a customer benefit or use case instead of repeating the collection
  or product title.
- Use real destination URLs. Do not publish placeholder links or `#` links.

## Section usage table

| Studio section       | Use it for                                         | Main data or blocks                                   | Recommended pages                  |
| -------------------- | -------------------------------------------------- | ----------------------------------------------------- | ---------------------------------- |
| Hero image           | A static, image-led opening statement              | Heading, paragraph, button over a background image    | Home, landing, collection campaign |
| Hero video           | A motion-led opening statement                     | Video URL, posters, text blocks, button               | Home, campaign landing             |
| Slideshow            | Two or three campaign messages in one hero area    | Slide blocks                                          | Home, campaign landing             |
| Featured collections | Navigating to curated collections                  | Heading/link and Collection items                     | Home, landing                      |
| Featured products    | Merchandising products from a collection           | Heading/link and Products                             | Home, landing, PDP cross-sell      |
| Image with text      | Brand, material, or category storytelling          | Content and one/two Image blocks                      | Home, landing, collection, PDP     |
| Hotspots             | Shopping products from a styled room               | Content, Hotspots container, images, product hotspots | Home, landing, collection          |
| Promotion grid       | Promotional cards or tabbed campaigns              | Promotion slider and Promotion blocks                 | Home, landing                      |
| Videos               | A short-form shoppable video rail                  | Heading, Videos, Video blocks                         | Home, landing                      |
| Video embed          | One long-form video with supporting copy           | Content and Video                                     | Home, landing, editorial           |
| Testimonials         | Social proof paired with lifestyle products        | Testimonial items, content, image hotspots            | Home, landing                      |
| Countdown            | A genuine time-limited campaign                    | Timer, subheading, paragraph, button                  | Home, campaign landing             |
| Highlights           | Three concise brand or service benefits            | Highlight Badge blocks                                | Home, collection, service page     |
| Instagram            | Social content and an account CTA                  | Content and Image Slider                              | Home, editorial                    |
| Newsletter           | Email acquisition                                  | Text blocks and Newsletter form                       | Home, landing, editorial           |
| Contact form         | Customer questions and service enquiries           | Name, email, message, and submission status           | Contact or service page            |
| Before & after       | A visual transformation comparison                 | Slider                                                | Home, landing, editorial           |
| Accordion            | FAQs or customer service information               | Content Information and Accordion Group               | FAQ, service, product support      |
| Map                  | Store locations                                    | Store address blocks                                  | Stores/contact page                |
| Image gallery        | A freeform visual gallery                          | Images and Image blocks                               | Editorial, brand, campaign         |
| Columns with images  | Repeated feature or service cards                  | Items and Column blocks                               | Home, landing, service page        |
| Scrolling Text       | A short announcement or value ticker               | Text and optional icons                               | Home, campaign landing             |
| Spacer               | Deliberate vertical rhythm                         | Height and separator settings                         | Any content page                   |
| Single product       | A standalone product spotlight                     | Shopify product and optional Judge.me block           | Home, landing, editorial           |
| Main product         | The complete product purchase experience           | Shopify product context                               | Product template only              |
| Related products     | Shopify product recommendations                    | Product context                                       | Product template only              |
| Judgeme Reviews      | A full standalone Judge.me review area             | Review blocks                                         | Product template only              |
| Collection filters   | Collection banner, filters, sort, and product grid | Shopify collection context                            | Collection template only           |
| Collection list      | The Shopify collection index                       | Collection items                                      | Collection-list template only      |
| All products         | Paginated all-products grid                        | Shopify products                                      | All-products template only         |
| Articles             | A reusable article feed from a selected blog       | Shopify blog                                          | Home, landing, editorial           |
| Journal              | Aspen's premium blog index                         | Current blog articles                                 | Blog template only                 |
| Blogs                | A general-purpose blog index                       | Current blog articles                                 | Blog template only                 |
| Blog post            | Article body, tags, and sharing                    | Current article                                       | Article template only              |
| Related articles     | More stories from the current blog                 | Current article/blog                                  | Article template only              |
| Page                 | Native Shopify page content                        | Current Shopify page                                  | Page template only                 |
| Account              | Customer dashboard composition                     | Orders, Account details, Address book                 | Custom account page only           |
| Order details        | One customer's order detail view                   | Customer Account API order                            | Custom `order` page only           |

## Shared blocks

These blocks appear inside multiple top-level sections. Add them through the
parent section's block list rather than as standalone page sections.

| Block            | Purpose                           | Important settings                                            |
| ---------------- | --------------------------------- | ------------------------------------------------------------- |
| Heading          | Semantic display heading          | Content, HTML tag, responsive size, weight, color, alignment  |
| Subheading       | Eyebrow or supporting label       | Content, tag, size, weight, color, alignment                  |
| Paragraph        | Supporting rich text              | Content, width, size, color, alignment                        |
| Button/Link      | Navigation CTA                    | Label, destination, variant, custom/hover colors              |
| Slide            | One slideshow campaign            | Desktop/mobile media and copy, content position, overlay, CTA |
| Collection items | Collection cards                  | Collections, layout scenario, gaps, overlay colors            |
| Products         | Collection-backed product cards   | Collection, layout counts, item limit, arrows                 |
| Image            | One media item in a parent layout | Image, crop/object fit, border radius                         |
| Hotspot          | A product marker on an image      | Product, X/Y offset, icon, price/details visibility           |
| Promotion        | One promotion or tab              | Image, content, CTA, overlay, tab-specific copy               |
| Testimonial      | One navigable testimonial scene   | Content and image/hotspot blocks                              |
| Testimonial hotspot | Product marker inside a testimonial scene | Product and marker position                          |
| Timer            | Countdown values                  | End time, responsive number and label sizes                   |
| Newsletter form  | Email field and submission action | Labels, success text, width, colors, radius                   |
| Store address    | One map location                  | Store name, full address, phone, opening hours                |
| Accordion item   | One question and answer           | Optional icon, title, answer                                  |
| Highlights Badge | One brand/service benefit         | Shape or custom icon, label, description, link, color         |

Studio also exposes structural blocks named Content, Images, Items, Videos,
Hotspots, Image Slider, and Promotion slider. These blocks own layout and group
their item blocks; keep them nested under the parent shown below rather than
using them as standalone content.

### Parent and child composition map

The arrows below show nesting. A block after an arrow belongs inside the block
before it. Limits are schema-enforced unless stated as a recommendation.

| Parent section       | Direct and nested blocks                                                                                         |
| -------------------- | ---------------------------------------------------------------------------------------------------------------- |
| Hero image           | Subheading, Heading, Paragraph, Button                                                                           |
| Hero video           | Subheading, Heading, Paragraph, Button                                                                           |
| Slideshow            | Slide → desktop/mobile media and its own copy/CTA settings                                                       |
| Featured collections | Heading and link (maximum one), Collection items                                                                 |
| Featured products    | Heading and link (maximum one), Products                                                                         |
| Image with text      | Content → Subheading/Heading/Paragraph/Button; Images (maximum one) → Image (maximum two)                        |
| Hotspots             | Hotspots contents → Heading/Subheading/Paragraph/Button; Hotspots → Hotspots image (maximum two) → Hotspots item |
| Promotion grid       | Promotion slider → Promotion                                                                                     |
| Videos               | Heading; Videos → Video (maximum four)                                                                           |
| Video embed          | Video embed content (maximum one), Video                                                                         |
| Testimonials         | Testimonial item → Content (maximum one) and Hotspot image → product Hotspot                                     |
| Countdown            | Countdown Subheading, Paragraph, Timer, Countdown Button                                                         |
| Highlights           | Highlight Badge (maximum three), Subheading, Paragraph                                                           |
| Instagram            | Content (maximum one), Image Slider (maximum one)                                                                |
| Newsletter           | Subheading, Heading, Paragraph, Newsletter form                                                                  |
| Before & after       | Slider (maximum one)                                                                                             |
| Accordion            | Content Information → Subheading/Heading/Paragraph; Accordion Group → Accordion Item                             |
| Map                  | Store address                                                                                                    |
| Image gallery        | Heading, Paragraph, Images → Image                                                                               |
| Columns with images  | Subheading, Heading, Paragraph, Button; Items → Column                                                           |
| Single product       | Judge.me review block (maximum one)                                                                              |
| Judgeme Reviews      | Heading, Paragraph, Judgeme Review (maximum one)                                                                 |
| Collection list      | Subheading, Heading, Paragraph, Collection items                                                                 |
| Account              | Orders, Account details, Address book (each maximum one)                                                         |

Sections not listed in this map are configured directly and do not expose child
blocks. Ali Reviews imports are intentionally commented out in the registry and
therefore are not available in Studio or included in this guide.

`Promotion grid content` and `Information Item` remain registered as legacy or
internal helpers, but they are not part of Aspen's approved top-level presets.
Do not insert them as standalone sections. Use Promotion grid's Promotion
blocks or Accordion's Content Information block instead.

## Hero and campaign sections

### Hero image

- **Purpose:** Use for one primary campaign message when motion is unnecessary.
- **Blocks:** Optional subheading, heading, paragraph, and button.
- **Required:** Background image for a meaningful result.
- **Optional:** Height, content position, section width/padding, overlay, text,
  and CTA.
- **Media:** Prefer a 2:1 desktop image around 2400 × 1200 px. There is no
  dedicated mobile image input, so choose a crop with a safe central subject.
- **Copy:** One heading, one short sentence, and one primary CTA.
- **Mobile:** Height and content reflow are responsive, but the same background
  image is reused. Confirm text contrast at narrow widths.
- **Avoid:** Detailed imagery behind text without an overlay, or multiple
  competing buttons.

### Hero video

- **Purpose:** Use for an immersive premium introduction where motion materially
  improves the story.
- **Blocks:** Optional subheading, heading, paragraph, and button.
- **Required:** Video URL. A poster image is strongly recommended.
- **Optional:** Source ratio, mobile poster, height/custom heights, Aspen or
  centered content layout, gap, and overlay.
- **Media:** Match the `Source video aspect ratio` setting to the actual file.
  Aspen height uses 2:1 on desktop and approximately 4:5 on mobile. Prepare a
  2400 × 1200 desktop poster and 1200 × 1500 mobile poster.
- **Copy:** Keep copy independent from audio; autoplay video is muted.
- **Mobile:** A separate poster is supported. Video crops like a cover image and
  the Aspen preset moves copy to approved mobile positions.
- **Avoid:** Large uncompressed video, essential spoken-only information, or a
  ratio setting that does not match the source.

### Slideshow

- **Purpose:** Use when two or three equally important campaigns must share the
  hero position. Prefer a single hero when one message is dominant.
- **Blocks:** One or more Slide blocks.
- **Required:** At least one Slide with a background image and useful content.
- **Optional:** Height, fade/slide effect, autoplay interval, loop, arrows, dots,
  and navigation styling.
- **Media:** Use consistent crops for every slide: 2:1 desktop and a dedicated
  4:5 mobile override. Each Slide supports mobile image, heading, paragraph,
  button text, and button style overrides.
- **Copy:** Keep all slides similar in length and CTA grammar.
- **Mobile:** Mobile overrides fall back to desktop values when blank. Controls
  remain accessible; autoplay is disabled inside Studio but can run on the
  storefront.
- **Avoid:** More than three slides, rapid autoplay, missing mobile crops, or
  placing essential information only on later slides.

### Promotion grid

- **Purpose:** Use for a family of campaigns with either visual cards or a
  tabbed story.
- **Blocks:** Promotion slider (`Grid items`) containing Promotion blocks.
- **Required:** Each Promotion needs an image and destination for a useful card.
- **Optional:** Slider or Tabs layout, tab heights, slider heading/description,
  cards per view, gap, autoplay, arrows/dots, per-card text and overlays.
- **Media:** Use a consistent 4:3 card set for Slider. For Tabs, use large
  landscape images with a mobile-safe focal point; the layout has independent
  desktop and mobile heights.
- **Copy:** Slider card headings should be short. Tab labels should be 1–3 words
  and their descriptions should explain distinct categories.
- **Mobile:** Slider becomes swipeable. Tabs use the configured mobile height
  and swap active content when a tab is selected.
- **Avoid:** Mixing unrelated image ratios, duplicate tab labels, blank links,
  or enabling fast autoplay alongside other moving sections.

### Countdown

- **Purpose:** Use only for a real campaign with a specific end time.
- **Blocks:** Countdown subheading, paragraph, Timer, and Countdown button.
- **Required:** Timer with a future end time.
- **Optional:** Style 1/2, background and overlay, section height/padding,
  headings, button content, responsive number sizes, and unit-label sizes.
- **Media:** Style 1 works best with a 2:1 campaign background and a centered
  mobile-safe subject. Style 2 can work without photography.
- **Copy:** State the offer and eligibility; do not imply false urgency.
- **Mobile:** Both scenarios have independent mobile number sizing. Keep unit
  labels small enough that Days, Hours, Minutes, and Seconds never collide.
- **Avoid:** Expired timers, oversized mobile values, or vague sale terms.

### Before & after

- **Purpose:** Use to compare a room, finish, layout, or restoration before and
  after a change.
- **Blocks:** One Slider block.
- **Required:** Before and after images.
- **Optional:** Separator/handle colors and width, initial desktop/mobile
  position, Aspen 2:1 height, or custom responsive heights.
- **Media:** Both images must have identical pixel dimensions, crop, viewpoint,
  and subject scale. Recommended: matching 2400 × 1200 px files.
- **Copy:** Put explanation in adjacent sections; the comparison itself should
  remain visually simple.
- **Mobile:** The divider has an independent initial position. Verify the drag
  handle is reachable and the focal subject remains visible.
- **Avoid:** Mismatched photos or placing text inside only one source image.

## Merchandising sections

### Featured collections

- **Purpose:** Use as the main visual path into collection categories.
- **Blocks:** One Heading and link block plus one Collection items block.
- **Required:** Select collections in Collection items.
- **Optional:** Section spacing, heading/description/CTA, mobile and desktop
  gaps, card colors, and one of three scenarios.
- **Scenarios:** Grid always presents six cards; Card slider supports a title
  with side link; Editorial showcase presents three cards.
- **Media:** Use consistent collection images. Square 1200 × 1200 px is safest
  for Grid/Slider. Editorial imagery should share a coherent crop and quality;
  allow the right image to carry more vertical emphasis on desktop.
- **Copy:** Use collection names as labels. The intro should explain the
  assortment, not repeat all six names.
- **Mobile:** Grid still exposes all six collections. Slider is swipeable.
  Editorial reorders into the approved stacked composition and retains readable
  bottom-left overlay text.
- **Avoid:** Selecting fewer than the scenario expects, inconsistent image
  backgrounds, or long collection names that wrap over imagery.

### Featured products

- **Purpose:** Use to merchandise a selected collection in a carousel or grid.
- **Blocks:** One Heading and link block plus one Products block.
- **Required:** Select a collection in Products.
- **Optional:** Scenario, products to show, per-view/per-row count, gaps,
  arrows, heading/description/CTA, and the desktop PDP promo.
- **Media:** Product cards use Shopify product media. Standardize the first
  product image to a square 1200 × 1200 px canvas. The optional promo image is
  best around 1600 × 1030 px (approximately 1.55:1).
- **Copy:** Use a category or benefit-led heading. Keep the intro to one short
  sentence.
- **Mobile:** Product cards become a swipeable rail or compact grid according to
  the scenario. The product-page promo is desktop-only.
- **Avoid:** Empty collection selection, too many products above the fold, or
  mixing product photography styles.

### Single product

- **Purpose:** Spotlight one Shopify product outside its PDP.
- **Blocks:** Optional Judge.me rating block.
- **Required:** Select a product.
- **Optional:** Media grid/slider, ratio, thumbnails/dots, arrows, zoom, badges,
  vendor, sale price, description, policies, and CTA labels.
- **Media:** Use the product's established image ratio; square is the most
  reliable for mixed pages.
- **Copy:** Product title, pricing, and variant data come from Shopify. Avoid
  duplicating them in nearby manual text.
- **Mobile:** Slider controls condense and purchase information stacks below the
  media.
- **Avoid:** Using Single product on a PDP or selecting a product with incomplete
  variants/media.

### Hotspots

- **Purpose:** Turn a styled room image into a shoppable scene.
- **Blocks:** Content, one Hotspots container, one/two Hotspots image blocks,
  and product Hotspot blocks.
- **Required:** One image and at least one selected product hotspot.
- **Optional:** Single/split image scenario, design/adapt/fixed ratios, gaps,
  hotspot icon/size/position, price, and details link.
- **Media:** Use 4:3 or a high-resolution crop suited to the Design ratio. Leave
  clean space around every tagged product so the popup does not cover it.
- **Copy:** Use a short "Shop the look" intro and a direct CTA.
- **Mobile:** Split layout stacks its two images. Re-check X/Y positions on the
  narrow crop and keep hotspots away from edges.
- **Avoid:** Unselected products, overlapping markers, markers over decorative
  objects, or using different crops that move the tagged product.

### Videos

- **Purpose:** Present up to four short-form videos, optionally shoppable.
- **Blocks:** Heading, one Videos container, and up to four Video blocks.
- **Required:** A video for each Video block.
- **Optional:** 1:1, 3:4, 4:3, 16:9, or 9:16 ratio; gap; featured product; and
  Add to cart label.
- **Media:** Use 1080 × 1920 px for the default 9:16 reel layout. Keep the key
  action and product centered and avoid embedded text near the bottom overlay.
- **Copy:** Product title and price come from Shopify; only customize the CTA
  label when necessary.
- **Mobile:** The active video reveals its product card as the user swipes. On
  desktop, product information appears on hover/focus.
- **Avoid:** More than four videos, mixed ratios, audio-dependent content, or a
  featured product unrelated to the video.

### Main product

- **Purpose:** Provide the complete purchase experience for the current Shopify
  product. Use exactly once on a product template.
- **Required:** Product page context; no manual product selection is needed.
- **Optional:** Media ratio/layout, thumbnails/dots/navigation, zoom, badges,
  CTA labels, vendor/pricing, wishlist, back-in-stock, inventory messaging,
  policies, product story media/copy, and Judge.me rating/reviews.
- **Media:** Standardize product media to 1:1 or 3:4. Product story supports a
  desktop lifestyle image, optional square mobile crop, and two feature images.
- **Copy:** Maintain product facts, options, prices, inventory, and descriptions
  in Shopify. Theme settings should control labels rather than duplicate data.
- **Mobile:** Media becomes a touch slider; product information follows it;
  story/reviews use their approved stacked layouts.
- **Avoid:** Adding a second Main product, duplicating Judge.me both internally
  and as a separate section, or manually publishing inventory claims.

### Related products

- **Purpose:** Show Shopify recommendations for the current product.
- **Required:** Product template context.
- **Optional:** Heading and general section spacing.
- **Media:** Uses product media; maintain the catalog's standard ratio.
- **Mobile:** Renders as a horizontally scrollable product rail.
- **Avoid:** Using it as a manual collection grid; use Featured products when
  curation is required.

### Judgeme Reviews

- **Purpose:** Render a standalone Judge.me summary, form, and review list.
- **Required:** Product context and valid Judge.me integration credentials.
- **Optional:** Heading/paragraph blocks and section spacing.
- **Content:** Review text, ratings, authors, and customer media come from
  Judge.me. Use Studio only for the surrounding heading and introduction.
- **Mobile:** Review summary, distribution, form, and list stack vertically.
- **Avoid:** Adding it when Main product already has `Show product reviews`
  enabled, or adding multiple Judge.me blocks to the same PDP.

## Brand, service, and social sections

### Image with text

- **Purpose:** Explain a material, collection, service, or brand idea with strong
  supporting imagery.
- **Blocks:** One Content block and one Images container with up to two Image
  blocks.
- **Required:** Content and at least one image. Scenario 1 should use two distinct
  images.
- **Optional:** Overlay/split scenario, desktop media side, image ratio, fit,
  radius, content position, child spacing, and background.
- **Media:** Scenario 1 works best with two coordinated square 1600 × 1600 px
  images. Scenario 2 works well with one 3:4 or 4:3 image matching the selected
  ratio.
- **Copy:** One concise heading, one supporting sentence, one CTA.
- **Mobile:** Overlay uses both images in the approved mobile composition. Split
  stacks media and text; desktop left/right choice does not force an awkward
  side-by-side mobile layout.
- **Avoid:** Duplicating the same image into both Scenario 1 slots or choosing
  `contain` for photography that should fill the frame.

### Video embed

- **Purpose:** Pair one long-form video with explanatory content.
- **Blocks:** One Content and one Video block.
- **Required:** Uploaded video or valid embed URL.
- **Optional:** Vertical/horizontal content header, copy, CTA, desktop video
  size, and border radius.
- **Media:** Prefer 1920 × 1080 px or a 16:9 YouTube/Vimeo embed.
- **Mobile:** Desktop video size settings do not apply; video becomes responsive
  and content stacks.
- **Avoid:** Using an ordinary watch-page URL where an embed URL is required, or
  duplicating Hero video functionality.

### Testimonials

- **Purpose:** Combine customer quotes with a shoppable lifestyle scene.
- **Blocks:** One or more Testimonial items, each with Content and a testimonial
  image/hotspot container.
- **Required:** At least one quote/author. Use an image when product hotspots are
  present.
- **Optional:** Rating, heading, image, product hotspots, loop navigation,
  button colors, icon style, and button shape.
- **Media:** Use a clean 4:3 lifestyle image around 1600 × 1200 px.
- **Copy:** Quotes should sound specific and credible; keep them to roughly
  15–35 words and include a customer name or attribution.
- **Mobile:** Items change one at a time. Navigation loops only when enabled and
  only has an effect when more than one Testimonial item exists.
- **Avoid:** Putting multiple unrelated quotes inside one item, adding hotspots
  without products, or expecting navigation with a single child.

### Highlights

- **Purpose:** Present up to three differentiators such as quality, delivery,
  service, or warranty.
- **Blocks:** Highlight Badge blocks plus optional shared text blocks.
- **Required:** A useful heading for each badge.
- **Optional:** Built-in shape/custom icon, color, description, and link.
- **Media:** Prefer optimized SVG for custom icons; keep all icons visually
  consistent.
- **Copy:** Use parallel benefit-led phrases and similarly sized descriptions.
- **Mobile:** Badges stack or reflow for readability while preserving order.
- **Avoid:** More than three badges, mixing icon styles, or using vague claims
  that cannot be supported.

### Instagram

- **Purpose:** Add social proof and lead customers to the brand's Instagram.
- **Blocks:** One Content and one Image Slider.
- **Required:** Instagram token for live media. Content can still explain the
  account, but the feed needs valid API access.
- **Optional:** Heading, handle, paragraph, CTA, section styling, slide gap,
  navigation, arrow icon/color/shape.
- **Media:** Keep Instagram source posts consistent; 1080 × 1350 px (4:5) is a
  useful social source size.
- **Mobile:** The rail is swipeable and supports caret or arrow navigation.
- **Avoid:** Expired tokens, a displayed handle that differs from the linked
  account, or relying on Instagram as the only source of important content.

### Newsletter

- **Purpose:** Capture email subscribers with a focused inline form.
- **Blocks:** Optional subheading, heading, paragraph, and one Newsletter form.
- **Required:** Newsletter form with meaningful placeholder, button, and success
  message.
- **Optional:** Responsive heights, product-page visibility, background,
  headings, help/legal copy, form width, button width, colors, and radius.
- **Copy:** Explain the value and cadence. Add consent/privacy language in Help
  text when required.
- **Mobile:** Form width is capped by the viewport and controls reflow. The
  section has independent mobile and desktop heights.
- **Avoid:** Hiding the success state, using only "Subscribe" without a benefit,
  or adding a second newsletter next to the global footer form.

### Contact form

- **Purpose:** Collect customer questions from a dedicated contact or service
  page and record each valid submission as a Klaviyo event.
- **Blocks:** None. The heading, description, fields, button, and feedback state
  are configured directly on the section.
- **Required:** A valid email and message from the customer, plus the private
  `KLAVIYO_PRIVATE_API_TOKEN` in local and deployed server environments. Name is
  optional.
- **Optional:** Heading, description, button label, success message, name/email/
  message placeholders, and section background color.
- **Copy:** Explain when the customer should expect a response. Use field
  placeholders as short labels and keep the success message specific but free
  of promises the support team cannot meet.
- **Mobile:** The centered single-column form is capped by the viewport; fields
  and button retain the same order and touch-friendly sizing as desktop.
- **Avoid:** Publishing before testing a real submission, placing private
  Klaviyo credentials in a public variable, or using the success message as a
  substitute for an accessible field label when the form design evolves.

See [Third-party integrations](./integrations.md) for Klaviyo setup and failure
behavior.

### Accordion

- **Purpose:** Build FAQs or a combined contact-information and FAQ section.
- **Blocks:** Content Information and Accordion Group containing Accordion Item
  blocks.
- **Required:** At least one Accordion Item with a title and answer.
- **Optional:** Contact content, Contact + FAQ or two-column FAQ layout, first
  item open state, colors, background/overlay, and optional item icons.
- **Copy:** Questions should match customer language; keep each answer focused
  and link to detailed policies when appropriate.
- **Mobile:** Both scenarios collapse into a readable vertical flow. The first
  item can open by default.
- **Avoid:** Hiding essential legal information only inside closed panels,
  overly long answers, or pasting unsafe SVG/script content as icons.

### Map

- **Purpose:** Present physical stores and their contact/opening information.
- **Blocks:** Store address blocks.
- **Required:** At least one store with a complete, geocodable street address.
- **Optional:** Store-list or Accordion scenario, heading, active/panel/text
  colors, phone, and opening hours.
- **Copy:** Use consistent address and opening-hours formats. Verify seasonal
  hours before campaigns.
- **Mobile:** Store list and map stack. Scenario 2's desktop overlay becomes an
  accessible accordion/list interaction.
- **Avoid:** Partial addresses, stale hours, duplicate store names, or assuming
  a postal code alone will map correctly.

### Image gallery

- **Purpose:** Create an editorial mosaic without linking every image to a
  product or collection.
- **Blocks:** Heading/paragraph plus Images containing Image blocks.
- **Required:** At least one image.
- **Optional:** Item gap/height, column span, radius, and hide-on-mobile.
- **Media:** Use a coherent set with enough resolution for multi-column spans;
  1600 px on the long edge is a practical minimum.
- **Mobile:** Items marked `Hide on mobile` are removed; remaining images form a
  compact gallery.
- **Avoid:** Hiding every image on mobile or giving a low-resolution image a
  large column span.

### Columns with images

- **Purpose:** Present repeated services, values, categories, or process steps.
- **Blocks:** Optional shared text and Items containing Column blocks.
- **Required:** At least one Column with heading and image/content.
- **Optional:** Gap, image ratio, column size, hide-on-mobile, radius, body copy,
  and link.
- **Media:** Use a consistent 4:3 set around 1600 × 1200 px unless another ratio
  is selected for every item.
- **Mobile:** Columns stack; individually hidden columns are removed.
- **Avoid:** Mixing ratios, unequal copy length, or hiding content that customers
  need to complete a task.

### Scrolling Text

- **Purpose:** Display one short announcement or a repeated brand/service value.
- **Required:** Text.
- **Optional:** Style 1/2, icon list, icon size, text size/colors, border,
  background, width, spacing, speed, and mobile visibility.
- **Copy:** Use one short phrase that remains understandable when repeated.
- **Mobile:** Can be hidden explicitly. Use a conservative speed for legibility.
- **Avoid:** Long paragraphs, critical legal details, excessive speed, or large
  image icons that cause layout shift.

### Spacer

- **Purpose:** Add intentional breathing room when section-native padding is not
  sufficient.
- **Required:** Nothing.
- **Optional:** Separate mobile/desktop height, background, and separator.
- **Media/Copy:** Not applicable; Spacer intentionally has no content.
- **Mobile:** Set mobile height to zero to hide it.
- **Avoid:** Building the whole page rhythm from many Spacer sections; prefer
  parent section padding first.

## Editorial sections

### Articles

- **Purpose:** Add a curated article feed to a non-blog page.
- **Required:** Select a Shopify blog.
- **Optional:** Heading, accent/background, articles per row, initial/load-more
  counts, radius, date/category/read-more visibility, separator, and button.
- **Media:** Standardize article featured images to 4:3, about 1600 × 1200 px.
- **Copy:** Maintain title, excerpt, tags, date, and author in Shopify Articles.
- **Mobile:** Cards collapse to fewer columns and Load more appends items.
- **Avoid:** Using Articles as the primary blog template when Journal is already
  present, or publishing articles without featured images/excerpts.

### Journal

- **Purpose:** Aspen's premium blog index with one featured story and a
  responsive article grid.
- **Required:** Blog page context with published articles.
- **Optional:** Heading/description, initial/load counts, category/date/author,
  featured excerpt, read-more links, radius, colors, and button label.
- **Media:** The featured story receives the largest treatment. Use consistent
  4:3 featured images at 1600 × 1200 px or larger.
- **Copy:** Use the first article tag as a short category. Provide concise
  excerpts for the featured story.
- **Mobile:** Featured content stacks and the rest becomes one column. Load more
  appends the configured number of articles.
- **Avoid:** Adding Journal and Blogs together on the same blog template or
  omitting tags when category display is enabled.

### Blogs

- **Purpose:** A simpler general-purpose blog index when the Aspen Journal
  composition is not desired.
- **Required:** Blog page context.
- **Optional:** Heading, initial/load counts, card ratio/radius, excerpt/date/
  author/read-more visibility, colors, and Load more button.
- **Media:** Select one card ratio and standardize all article images to it.
- **Mobile:** The card grid reduces to a single column and supports incremental
  loading.
- **Avoid:** Using alongside Journal or mixing `Adapt` with inconsistent source
  dimensions.

### Blog post

- **Purpose:** Render the current Shopify article body.
- **Required:** Article page context.
- **Optional:** General layout, tags, and social share buttons.
- **Media:** Article content images should be optimized and large enough for the
  content column; avoid fixed-width HTML from external editors.
- **Mobile:** Article body, media, tags, and share actions stack naturally.
- **Avoid:** Adding more than one Blog post section or hardcoding article data in
  Studio.

### Related articles

- **Purpose:** Continue discovery after an article.
- **Required:** Article context with other published articles.
- **Optional:** Heading, View all, image ratio, excerpt/date/author/read-more,
  and general layout.
- **Media:** Match the blog's established article image ratio.
- **Mobile:** Cards become a compact horizontal or stacked recommendation area.
- **Avoid:** Enabling every metadata option when it overwhelms the card.

## Commerce template sections

### Collection filters

- **Purpose:** Own the collection heading/banner, filters, sort controls,
  responsive product grid, and pagination. Use exactly once per collection.
- **Required:** Collection page context.
- **Optional:** Breadcrumb/description, banner and responsive heights, sorting,
  filters, sidebar/drawer, default-open filters, counts, swatches, button-style
  filters, responsive columns, and pagination labels.
- **Media:** Collection banner can come from `custom.collection_banner`; use a
  wide image around 2400 × 800–1200 px with a mobile-safe focal point.
- **Mobile:** Filters use a drawer; grid supports one or two products per row;
  banner has an independent mobile height.
- **Avoid:** Adding it outside a collection page, enabling swatches without
  configured Shopify filter data, or using comma-separated filter names that do
  not exactly match Shopify labels.

### Collection list

- **Purpose:** Render the Shopify collection index.
- **Blocks:** Optional heading/copy plus Collection items.
- **Required:** Collection-list page context with collections in Shopify.
- **Optional:** Layout spacing, pagination labels, Grid/Card slider/Editorial
  scenario, gaps, and card colors.
- **Media:** Follow the same guidance as Featured collections.
- **Mobile:** Grid exposes up to six cards, slider is swipeable, and Editorial
  stacks while preserving readable overlays.
- **Avoid:** Adding the dynamic Featured collections section when the goal is to
  paginate the complete collection index.

### All products

- **Purpose:** Render the Shopify all-products listing with pagination.
- **Required:** All-products page context.
- **Optional:** Heading, previous/next labels, and general layout.
- **Media:** Uses Shopify product media; standardize catalog photography.
- **Mobile:** Product cards reduce to the responsive catalog grid.
- **Avoid:** Using it as a curated list; use Featured products instead.

### Page

- **Purpose:** Render the current native Shopify page body.
- **Required:** Page template context and page content in Shopify.
- **Optional:** Section width and padding.
- **Content:** Maintain headings, body copy, links, and inline media in the
  Shopify page editor rather than duplicating them in Studio.
- **Mobile:** Rich page content uses the responsive content column.
- **Avoid:** Adding more than one Page section or pasting inaccessible fixed-size
  HTML into the Shopify page editor.

## Customer template sections

### Account

- **Purpose:** Build the authenticated customer dashboard.
- **Blocks:** Orders, Account details, and Address book; each is limited to one.
- **Required:** Custom account page context and authenticated Customer Account
  API data.
- **Optional:** Main heading/background, Orders heading/max count, Account edit
  label, and Address book action labels.
- **Content:** Customer names, email, orders, and addresses come from Shopify;
  Studio controls presentation labels only.
- **Mobile:** Orders become compact image/detail cards; account and address cards
  stack. Wider screens use multi-column cards where space allows.
- **Avoid:** Entering customer data as preset content, removing required child
  blocks without a deliberate account flow, or expecting actions to work while
  logged out.

### Order details

- **Purpose:** Render one authenticated order, including status, shipping
  address, line items, discounts, and totals.
- **Required:** Custom page with handle `order`, an authenticated customer, and a
  valid order identifier from the route.
- **Optional:** Presentation labels and colors only.
- **Content:** All order values come from the Customer Account API.
- **Mobile:** Status cards and line items stack image-first; labels and totals
  remain aligned in the summary.
- **Avoid:** Adding to a generic page, manually editing financial values, or
  exposing order routes without authentication.

## Example page compositions

The order below is a starting point. Remove sections that do not serve the page
goal rather than using every available section.

### Premium homepage — product discovery

1. Slideshow with 2–3 Slide blocks
2. Featured collections — Grid, six cards
3. Hotspots — single or split room scene
4. Featured products — product carousel
5. Image with text — two-image overlay
6. Videos — four shoppable reels
7. Promotion grid — slider
8. Testimonials — two or more items
9. Highlights — three benefits
10. Instagram
11. Newsletter

### Premium homepage — editorial variation

1. Hero video
2. Featured collections — Card slider
3. Image with text — split image and text
4. Featured products — product grid
5. Promotion grid — Tabs
6. Before & after
7. Articles
8. Newsletter

### Collection page

1. Collection filters, including collection banner
2. Image with text or Promotion grid for category education
3. Hotspots for a styled category scene
4. Featured products only when a distinct cross-category collection is useful
5. Newsletter, unless the global footer already supplies the same form

Do not insert another general product grid above Collection filters; it already
owns the collection results and pagination.

### Product detail page

1. Main product
2. Featured products for curated cross-sell **or** Related products for Shopify
   recommendations
3. Judgeme Reviews only when Main product's built-in reviews are disabled
4. Image with text, Video embed, or Before & after for additional storytelling

Keep the primary purchase information inside Main product. Avoid placing a
second product purchase section above it.

### Blog index

1. Journal
2. Newsletter

Use Blogs instead of Journal when a simpler generic card grid is preferred. Do
not add both.

### Article page

1. Blog post
2. Related articles
3. Newsletter

### Editorial or brand page

1. Hero image or Hero video
2. Page for long-form Shopify content, when applicable
3. Image gallery or Columns with images
4. Video embed
5. Before & after or Testimonials
6. Newsletter

### FAQ/contact/store page

1. Hero image with a short page title
2. Contact form
3. Accordion — Contact + FAQ scenario, when frequently asked questions are
   useful
4. Map with Store address blocks, when the business has physical locations
5. Newsletter only when it does not duplicate the footer

### Account page

1. Account
   1. Orders
   2. Account details
   3. Address book

### Order page

1. Order details

## Common mistakes to avoid

- Adding a child block as if it were a top-level section.
- Using a template-bound section on the wrong page type.
- Adding Journal and Blogs together, or adding two product/review systems to one
  PDP.
- Publishing a Shopify-backed section without selecting its product,
  collection, or blog.
- Treating placeholder content as demo-store-ready copy.
- Mixing source image ratios while the layout enforces one ratio.
- Using `Adapt to image` with inconsistent image dimensions.
- Skipping mobile-specific hero/slideshow crops and relying on desktop focal
  points.
- Putting text inside images instead of using editable Studio text blocks.
- Using low-contrast text without an overlay.
- Adding several autoplaying/moving sections to the same viewport.
- Leaving CTAs empty, pointing them to `#`, or linking to a route that the
  storefront does not expose.
- Placing hotspots too close to an image edge or without selected products.
- Using mismatched before/after images.
- Leaving a countdown expired or publishing unsupported urgency claims.
- Publishing stale store hours, Instagram tokens, or customer-service details.
- Publishing Contact form without a server-side Klaviyo token and a successful
  end-to-end submission test.
- Using Spacer repeatedly instead of setting appropriate parent-section
  padding.

## Pre-publish checklist

- Every Shopify-backed section has a valid resource selection or page context.
- Heading order is semantic: one page-level `h1`, then logical `h2`/`h3`
  descendants.
- Images use consistent ratios and include meaningful alt text in Shopify.
- Desktop and mobile crops are checked at 1440 px, 834 px, and 430 px.
- Text remains readable over every image and video frame.
- Sliders work with mouse, touch, and keyboard; a single child does not show
  misleading navigation.
- All links, add-to-cart actions, forms, account actions, filters, and Load more
  controls work in storefront preview.
- Contact form shows both a successful submission state and a safe error state;
  no private integration token is exposed to the browser.
- Countdown, store hours, promotional terms, and social credentials are current.
- No page contains duplicate Main product, Journal/Blogs, or review sections.

## Maintaining this guide

When a schema changes, update this document in the same pull request. Check the
section's `settings`, `childTypes`, `presets`, loader data source, and responsive
classes. Add a screenshot only when interaction or composition cannot be
explained clearly with text; screenshots should identify the section name,
scenario, and viewport width.
