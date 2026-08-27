import type {
  ChildMenuItemFragment,
  MenuFragment,
  ParentMenuItemFragment,
} from "storefront-api.generated";

type EnhancedMenuItemProps = {
  to: string;
  target: string;
  isExternal?: boolean;
};

type ChildEnhancedMenuItem = ChildMenuItemFragment & EnhancedMenuItemProps;

type ParentEnhancedMenuItem = (ParentMenuItemFragment &
  EnhancedMenuItemProps) & {
  items: ChildEnhancedMenuItem[];
};

export type EnhancedMenu = Pick<MenuFragment, "id"> & {
  items: ParentEnhancedMenuItem[];
};

export interface SingleMenuItem {
  id: string;
  title: string;
  items: SingleMenuItem[];
  to: string;
  isExternal?: boolean;
  type?: string;
  url?: string;
  tags?: string[];
  resource?: {
    __typename?: string;
    articleTags?: string[];
    image?: {
      altText?: string | null;
      height: number;
      id: string;
      url: string;
      width: number;
    } | null;
  } | null;
}
