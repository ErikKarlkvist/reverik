import { type Flow } from '../flow';

/**
 * Handgjord fixture för en påhittad webshop. Täcker alla nodtyper och används
 * för att bygga visualiseringen utan att analysen finns.
 */
export const addToCartFlow: Flow = {
  question: 'Visa vad som händer när man klickar på lägg till i varukorg',
  title: 'Lägg till i varukorg',
  summary:
    'Klicket skickar en POST till backend som kontrollerar lager, sparar raden i databasen och publicerar en händelse innan varukorgen svaras tillbaka.',
  nodes: [
    {
      id: 'add-button',
      kind: 'ui',
      label: 'Lägg till i varukorg',
      description: 'Knappen på produktsidan',
      source: { file: 'web/src/components/AddToCartButton.tsx', line: 18 },
    },
    {
      id: 'use-add-to-cart',
      kind: 'handler',
      label: 'useAddToCart',
      description: 'Hook som anropar API:t och uppdaterar lokal state',
      source: { file: 'web/src/cart/useAddToCart.ts', line: 9 },
    },
    {
      id: 'cart-items-route',
      kind: 'http',
      label: 'POST /api/cart/items',
      source: { file: 'api/src/routes/cart.ts', line: 41 },
    },
    {
      id: 'cart-service',
      kind: 'service',
      label: 'CartService',
      source: { file: 'api/src/cart/CartService.ts', line: 12 },
    },
    {
      id: 'inventory-api',
      kind: 'external',
      label: 'Inventory API',
      description: 'Lagersaldo hos tredje part',
    },
    {
      id: 'postgres',
      kind: 'db',
      label: 'Postgres cart_items',
    },
    {
      id: 'cart-events',
      kind: 'queue',
      label: 'cart-events',
      description: 'Kafka-topic som analytics och e-post lyssnar på',
    },
  ],
  edges: [
    {
      id: 'click',
      from: 'add-button',
      to: 'use-add-to-cart',
      label: 'onClick',
      payload: '{ productId: "p-123", quantity: 1 }',
      source: { file: 'web/src/components/AddToCartButton.tsx', line: 24 },
    },
    {
      id: 'post',
      from: 'use-add-to-cart',
      to: 'cart-items-route',
      label: 'POST /api/cart/items',
      payload: '{ "productId": "p-123", "quantity": 1 }',
      response: '200 { "cartId": "c-9", "items": [...] }',
      source: { file: 'web/src/cart/useAddToCart.ts', line: 17 },
    },
    {
      id: 'route-to-service',
      from: 'cart-items-route',
      to: 'cart-service',
      label: 'cartService.addItem()',
      payload: 'userId från session, productId, quantity',
      source: { file: 'api/src/routes/cart.ts', line: 48 },
    },
    {
      id: 'check-stock',
      from: 'cart-service',
      to: 'inventory-api',
      label: 'GET /stock/p-123',
      response: '{ "available": 42 }',
      source: { file: 'api/src/cart/CartService.ts', line: 27 },
    },
    {
      id: 'insert',
      from: 'cart-service',
      to: 'postgres',
      label: 'INSERT INTO cart_items',
      payload: '(cart_id, product_id, quantity)',
      source: { file: 'api/src/cart/CartService.ts', line: 34 },
    },
    {
      id: 'publish',
      from: 'cart-service',
      to: 'cart-events',
      label: 'publish item_added',
      payload: '{ "type": "item_added", "cartId": "c-9", "productId": "p-123" }',
      source: { file: 'api/src/cart/CartService.ts', line: 41 },
    },
    {
      id: 'respond',
      from: 'cart-items-route',
      to: 'use-add-to-cart',
      label: '200 OK',
      payload: '{ "cartId": "c-9", "items": [...] }',
      source: { file: 'api/src/routes/cart.ts', line: 52 },
    },
    {
      id: 'update-state',
      from: 'use-add-to-cart',
      to: 'add-button',
      label: 'setCart()',
      payload: 'Ny varukorg, knappen visar "Tillagd"',
      source: { file: 'web/src/cart/useAddToCart.ts', line: 21 },
    },
  ],
  steps: [
    { edgeId: 'click', description: 'Användaren klickar och hooken anropas med produkt-id.' },
    { edgeId: 'post', description: 'Hooken skickar en POST till backend.' },
    {
      edgeId: 'route-to-service',
      description: 'Routen läser användaren ur sessionen och anropar tjänsten.',
    },
    { edgeId: 'check-stock', description: 'Tjänsten kontrollerar lagersaldo hos Inventory API.' },
    { edgeId: 'insert', description: 'Raden sparas i databasen.' },
    { edgeId: 'publish', description: 'En händelse publiceras på kön.' },
    { edgeId: 'respond', description: 'Backend svarar med den uppdaterade varukorgen.' },
    { edgeId: 'update-state', description: 'Hooken uppdaterar state och knappen byter utseende.' },
  ],
};
