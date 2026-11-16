import type { ComponentProps } from "react";
import { useCart } from "~/components/cart/cart-store";
import * as Track from "./analytics-views";
export const Analytics = {
  ProductView: ({
    data,
  }: {
    data: ComponentProps<typeof Track.ProductView>;
  }) => <Track.ProductView {...data} />,
  CollectionView: ({
    data,
  }: {
    data: ComponentProps<typeof Track.CollectionView>;
  }) => <Track.CollectionView {...data} />,
  SearchView: ({ data }: { data: ComponentProps<typeof Track.SearchView> }) => (
    <Track.SearchView {...data} />
  ),
  CartView: () => {
    const { data, loading } = useCart((state) => state);
    return <Track.CartView cart={data} ready={!loading} />;
  },
};
