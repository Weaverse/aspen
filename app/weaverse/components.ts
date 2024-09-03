import type {HydrogenComponent} from '@weaverse/hydrogen';

import * as AllProducts from '~/sections/all-products';
import * as BlogPost from '~/sections/blog-post';
import * as Blogs from '~/sections/blogs';
import * as CollectionBanner from '~/sections/collection-banner';
import * as CollectionFilters from '~/sections/collection-filters';
import * as CollectionList from '~/sections/collection-list';
import * as Countdown from '~/sections/countdown';
import * as CountdownActions from '~/sections/countdown/actions';
import * as CountDownTimer from '~/sections/countdown/timer';
import * as FeaturedCollections from '~/sections/featured-collections';
import * as FeaturedProducts from '~/sections/featured-products';
import * as ImageBanner from '~/sections/image-banner';
import * as ImageGallery from '~/sections/image-gallery';
import * as ImageGalleryItem from '~/sections/image-gallery/image';
import * as ImageGalleryItems from '~/sections/image-gallery/items';
import * as ImageWithText from '~/sections/image-with-text';
import * as ImageWithTextContent from '~/sections/image-with-text/content';
import * as ImageWithTextImage from '~/sections/image-with-text/image';
import * as Map from '~/sections/map';
import * as Page from '~/sections/page';
import * as ProductInformation from '~/sections/product-information';
import * as PromotionGrid from '~/sections/promotion-grid';
import * as PromotionGridButtons from '~/sections/promotion-grid/buttons';
import * as PromotionGridItem from '~/sections/promotion-grid/item';
import * as RelatedArticles from '~/sections/related-articles';
import * as RelatedProducts from '~/sections/related-products';
import {commonComponents} from '~/sections/shared/atoms';
import * as SingleProduct from '~/sections/single-product';
import * as Judgeme from '~/components/product-form/judgeme-review';
import * as Testimonial from '~/sections/testimonials';
import * as TestimonialItem from '~/sections/testimonials/item';
import * as TestimonialItems from '~/sections/testimonials/items';
import * as VideoHero from '~/sections/video-hero';
import * as VideoEmbed from '~/sections/video-embed';
import * as VideoEmbedItem from '~/sections/video-embed/video';
import * as MetaDemo from '~/sections/meta-demo';
import * as SlideShow from '~/sections/SlideShow/SlideShow';
import * as SlideShowItem from '~/sections/SlideShow/SlideItems';
import * as NewsLetter from '~/sections/newsletter';
import * as ImageHotspot from '~/sections/image-hotspots/image-hotspot';
import * as ImageHotspotItem from '~/sections/image-hotspots/items';
import * as ProductList from '~/sections/product-list';
import * as ContactForm from '~/sections/contact-form';
import * as UserProfiles from '~/sections/user-profiles';
import * as AnnounceBar from '~/sections/announce-bar';
import * as AnnounceBarItem from '~/sections/announce-bar/items';
import * as Header from '~/sections/header';
import * as HeaderItem from '~/sections/header/menu-item';
import * as ImgWithTextButton from '~/sections/image-with-text/Button';
import * as ImageWithTextDescription from '~/sections/image-with-text/Description';
import * as ImageWithTextHeading from '~/sections/image-with-text/Heading';
import * as ImageWithTextSubheading from '~/sections/image-with-text/SubHeading';
import * as NotFound from '~/sections/404-page';
import * as ContactUs from '~/sections/contact-us';
import * as TermsPolicy from '~/sections/terms-policy';
import * as TermsPolicyItem from '~/sections/terms-policy/items';
import * as IconList from '~/sections/icon-list';
import * as IconListTitle from '~/sections/icon-list/icon-list-title';
import * as IconListContainer from '~/sections/icon-list/icon-list-container';
import * as IconListIcon from '~/sections/icon-list/icon-list-icon';
import * as VideoBanner from '~/sections/video-banner/index';
import * as VideoBannerItem from '~/sections/video-banner/items';
import * as RichText from '~/sections/rich-text';
import * as LogoList from '~/sections/logo-list';
import * as LogoListContainer from '~/sections/logo-list/logo-list-container';
import * as LogoListItem from '~/sections/logo-list/logo-list-item';
import * as Image from '~/sections/image';
import * as ImageHeading from '~/sections/image/image-heading';
import * as ImageSubheading from '~/sections/image/image-subheading';
import * as ImageDescription from '~/sections/image/image-description';
import * as ImageButton from '~/sections/image/image-button';
import * as ColumnsWithImages from '~/sections/content-columns';
import * as ColumnsWithImagesItems from '~/sections/content-columns/items';
import * as ColumnWithImageItem from '~/sections/content-columns/column-with-image-item';
import * as BeforeAfter from '~/sections/before-after';
import * as BeforeAfterHeading from '~/sections/before-after/heading';
import * as BeforeAfterSlider from '~/sections/before-after/slider';
import * as ScrollingText from '~/sections/scrolling-text';

export let components: HydrogenComponent[] = [
  ...commonComponents,
  AllProducts,
  BlogPost,
  Blogs,
  CollectionBanner,
  Page,
  VideoEmbed,
  VideoEmbedItem,
  ImageBanner,
  ImageWithText,
  ImageWithTextContent,
  ImageWithTextImage,
  ColumnsWithImages,
  ColumnsWithImagesItems,
  ColumnWithImageItem,
  VideoHero,
  Map,
  PromotionGrid,
  PromotionGridItem,
  PromotionGridButtons,
  ImageHotspot,
  ImageHotspotItem,
  Countdown,
  CountDownTimer,
  CountdownActions,
  NewsLetter,
  UserProfiles,
  Blogs,
  BlogPost,
  AllProducts,
  FeaturedProducts,
  FeaturedCollections,
  Testimonial,
  TestimonialItems,
  TestimonialItem,
  ImageGallery,
  ImageGalleryItems,
  ImageGalleryItem,
  ProductInformation,
  RelatedProducts,
  RelatedArticles,
  CollectionFilters,
  CollectionList,
  SingleProduct,
  Judgeme,
  MetaDemo,
  SlideShow,
  SlideShowItem,
  ProductList,
  ContactForm,
  AnnounceBar,
  AnnounceBarItem,
  Header,
  HeaderItem,
  ImgWithTextButton,
  ImageWithTextDescription,
  ImageWithTextHeading,
  ImageWithTextSubheading,
  NotFound,
  ContactUs,
  TermsPolicy,
  TermsPolicyItem,
  IconList,
  IconListTitle,
  IconListContainer,
  IconListIcon,
  VideoBanner,
  VideoBannerItem,
  RichText,
  LogoList,
  LogoListContainer,
  LogoListItem,
  Image,
  ImageHeading,
  ImageSubheading,
  ImageDescription,
  ImageButton,
  BeforeAfter,
  BeforeAfterHeading,
  BeforeAfterSlider,
  ScrollingText,
];
