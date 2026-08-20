# Customer wishlist setup

Aspen stores each signed-in customer's wishlist in Shopify Customer Account API
metafield `custom.aspen_wishlist`.

Create the definition in Shopify Admin before enabling wishlist in production:

1. Go to **Settings → Custom data → Customers**.
2. Add a definition named **Aspen wishlist**.
3. Set namespace and key to `custom.aspen_wishlist`.
4. Choose **List of values → Single line text**.
5. In storefront/customer account access, grant the Customer Account API
   **Read and write** access.

The storefront stores Shopify product GIDs in this list. The API route is
authenticated, private, uncached, validates product IDs, limits the list to 100
products, and uses compare-and-set updates to avoid overwriting a wishlist
changed in another session.

Local development and Weaverse Studio cannot run Customer Account OAuth on
`localhost`. In those environments the heart button saves to a preview cookie
instead of sending you to `/account/login`. Use `npm run dev:ca` and the
Hydrogen tunnel URL when you need to test the real signed-in metafield flow.
