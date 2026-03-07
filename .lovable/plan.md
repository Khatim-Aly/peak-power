

## Plan: Fix Password Reset, Admin Password Change, Checkout Order Creation, and Dashboard Order Visibility

This plan addresses four major issues found in the codebase:

---

### Issue 1: "Forgot Password" button does nothing

The "Forgot password?" button on the login form (line 163-170 of `LoginForm.tsx`) has no `onClick` handler -- it's purely decorative.

**Fix:**
- Add a `resetPasswordForEmail` method to `AuthContext` using `supabase.auth.resetPasswordForEmail(email, { redirectTo: window.location.origin + '/reset-password' })`
- Add a forgot-password flow to `LoginForm.tsx`: clicking "Forgot password?" shows an email input + submit button that calls the reset method
- Create a new `/reset-password` page that reads the recovery token from the URL hash and lets the user set a new password via `supabase.auth.updateUser({ password })`
- Add the `/reset-password` route to `App.tsx`

---

### Issue 2: Admin password reset edge function works but needs verification

The `admin-reset-password` edge function exists and looks correct. However, the admin client is created with the service role key but then a separate client is used to verify the requesting user. Need to ensure the user verification uses the service role key to read from `user_roles` (since RLS is restrictive). Looking at the code, it creates `supabaseClient` with the service role key + auth header, which should work for the `getUser` call and the `user_roles` query. This appears functional -- no changes needed here.

---

### Issue 3: Checkout doesn't create real orders in the database

The `handlePlaceOrder` function (line 165-179 of `Checkout.tsx`) only simulates order placement with a `setTimeout` and generates a fake order ID. It never writes to the `orders` or `order_items` tables, so no orders appear in any dashboard.

**Fix:**
- Rewrite `handlePlaceOrder` to use `useOrders().createOrder()` to save the order to the database
- The checkout page currently uses hardcoded cart items instead of the real cart from `CartContext` -- connect it to use real cart data from `useCartContext()`
- After successful order creation, clear the cart
- Fetch product details (name, image, price) by joining `cart_items` with `products` table for the order items

---

### Issue 4: Merchant dashboard revenue still shows £ instead of PKR

Line 108 of `MerchantDashboard.tsx` still has `£` -- missed in the earlier currency update.

**Fix:** Change `£` to `PKR` on that line.

---

### Implementation Steps

1. **Add password reset to AuthContext** -- add `resetPassword` method
2. **Update LoginForm** -- add forgot password UI flow (email input + send reset link)
3. **Create ResetPassword page** -- `/reset-password` route with new password form
4. **Update App.tsx** -- add `/reset-password` route
5. **Connect Checkout to real cart and orders** -- use `useCartContext()` for cart items, use `useOrders().createOrder()` to save orders to DB, clear cart after order
6. **Fix MerchantDashboard currency** -- `£` to `PKR`

### Technical Details

- The `useCart` hook stores `product_id` but not product details. The `CartDrawer` likely already fetches product info. For checkout, we need to fetch product details from the `products` table to populate `order_items`.
- The checkout page needs to be wrapped in auth check since orders require `user_id`.
- Password reset uses Supabase's built-in `resetPasswordForEmail` which sends an email with a recovery link. The `/reset-password` page listens for the `PASSWORD_RECOVERY` event via `onAuthStateChange`.

