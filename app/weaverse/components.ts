import type { HydrogenComponent } from "@weaverse/hydrogen";
import * as Heading from "~/components/heading";
import * as Link from "~/components/link";
import * as Paragraph from "~/components/paragraph";
import * as Judgeme from "~/components/product/judgeme-review";
import * as SubHeading from "~/components/subheading";
// import * as AliReview from "~/sections/ali-reviews";
// import * as AliReviewList from "~/sections/ali-reviews/review-list";
import * as AllProducts from "~/sections/all-products";
import * as AccordionSection from "~/sections/accordion/index";
import * as AccordionInformationItem from "~/sections/accordion/information-item";
import * as AccordionInformationGroup from "~/sections/accordion/content-information";
import * as AccordionGroup from "~/sections/accordion/accordion-group";
import * as AccordionItem from "~/sections/accordion/accordion-item";
import * as Articles from "~/sections/articles";
import * as BeforeAndAfter from "~/sections/before-and-after";
import * as BeforeAndAfterSlide from "~/sections/before-and-after/slider";
import * as BlogPost from "~/sections/blog-post";
import * as Blogs from "~/sections/blogs";
import * as CollectionFilters from "~/sections/collection-filters";
import * as ColumnsWithImages from "~/sections/columns-with-images";
import * as ColumnWithImageItem from "~/sections/columns-with-images/column";
import * as ColumnsWithImagesItems from "~/sections/columns-with-images/items";
import * as Countdown from "~/sections/countdown";
import * as CountDownTimer from "~/sections/countdown/timer";
import * as CollectionList from "~/sections/collection-list-page/collections-items";
import * as CollectionListItems from "~/sections/collection-list-page";
import * as CollectionListDynamic from "~/sections/collection-list-dynamic";
import * as CollectionListDynamicItems from "~/sections/collection-list-dynamic/collection-items";
import * as FeaturedCollections from "~/sections/featured-collections";
import * as FeaturedCollectionItems from "~/sections/featured-collections/collection-items";
import * as FeaturedProducts from "~/sections/featured-products";
import * as FeaturedProductItems from "~/sections/featured-products/product-items";
import * as HeroImage from "~/sections/hero-image";
import * as HeroVideo from "~/sections/hero-video";
import * as Hotspots from "~/sections/hotspots";
import * as HotspotsItem from "~/sections/hotspots/item";
import * as ImageGallery from "~/sections/image-gallery";
import * as ImageGalleryItem from "~/sections/image-gallery/image";
import * as ImageGalleryItems from "~/sections/image-gallery/items";
import * as ImageWithText from "~/sections/image-with-text";
import * as ImageWithTextContent from "~/sections/image-with-text/content";
import * as ImageWithTextImage from "~/sections/image-with-text/image";
import * as ImageWithTextImages from "~/sections/image-with-text/images";
import * as JudgemeReview from "~/sections/judgeme-reviews";
import * as ReviewIndex from "~/sections/judgeme-reviews/review-index";
import * as MapSection from "~/sections/map/map";
import * as Address from "~/sections/map/address";
import * as NewsLetter from "~/sections/newsletter";
import * as NewsLetterForm from "~/sections/newsletter/newsletter-form";
import * as OurTeam from "~/sections/our-team";
import * as OurTeamMembers from "~/sections/our-team/team-members";
import * as Page from "~/sections/page";
import * as ProductInformation from "~/sections/product-information";
import * as PromotionGrid from "~/sections/promotion-grid";
import * as PromotionGridButtons from "~/sections/promotion-grid/buttons";
import * as PromotionGridItem from "~/sections/promotion-grid/item";
import * as RelatedArticles from "~/sections/related-articles";
import * as RelatedProducts from "~/sections/related-products";
import * as SingleProduct from "~/sections/single-product";
import * as SlideShow from "~/sections/slideshow";
import * as SlideShowSlide from "~/sections/slideshow/slide";
import * as Spacer from "~/sections/spacer";
import * as ScrollingText from "~/sections/scrolling-text";
import * as Testimonial from "~/sections/testimonials/index";
import * as TestimonialContent from "~/sections/testimonials/content";
import * as TestimonialHotspots from "~/sections/testimonials/hotspots";
import * as TestimonialHotspotsItems from "~/sections/testimonials/hotspot-item";
import * as TestimonialHotspotsItem from "~/sections/testimonials/item";
import * as VideoEmbed from "~/sections/video-embed";
import * as VideoEmbedItem from "~/sections/video-embed/video";
import * as Videos from "~/sections/videos";
import * as VideoItems from "~/sections/videos/items";
import * as VideoItem from "~/sections/videos/video";

export let components: HydrogenComponent[] = [
  SubHeading,
  Heading,
  Paragraph,
  Link,
  // AliReview,
  // AliReviewList,
  AllProducts,
  AccordionSection,
  AccordionInformationItem,
  AccordionInformationGroup,
  AccordionGroup,
  AccordionItem,
  Articles,
  BeforeAndAfter,
  BeforeAndAfterSlide,
  FeaturedCollections,
  FeaturedCollectionItems,
  BlogPost,
  Blogs,
  Page,
  VideoEmbed,
  VideoEmbedItem,
  Videos,
  VideoItems,
  VideoItem,
  HeroImage,
  ImageWithText,
  ImageWithTextContent,
  ImageWithTextImage,
  ImageWithTextImages,
  ColumnsWithImages,
  ColumnsWithImagesItems,
  ColumnWithImageItem,
  HeroVideo,
  MapSection,
  Address,
  PromotionGrid,
  PromotionGridItem,
  PromotionGridButtons,
  Hotspots,
  HotspotsItem,
  Countdown,
  CountDownTimer,
  NewsLetter,
  NewsLetterForm,
  Blogs,
  BlogPost,
  AllProducts,
  FeaturedProducts,
  FeaturedProductItems,
  Testimonial,
  TestimonialContent,
  TestimonialHotspots,
  TestimonialHotspotsItem,
  TestimonialHotspotsItems,
  ImageGallery,
  ImageGalleryItems,
  ImageGalleryItem,
  ProductInformation,
  RelatedProducts,
  RelatedArticles,
  CollectionFilters,
  CollectionList,
  CollectionListItems,
  CollectionListDynamic,
  CollectionListDynamicItems,
  SingleProduct,
  Judgeme,
  JudgemeReview,
  ReviewIndex,
  OurTeam,
  OurTeamMembers,
  SlideShow,
  SlideShowSlide,
  Spacer,
  ScrollingText,
];
