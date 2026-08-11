# Your Elegance Store — Manual Testing Checklist

Use this before go-live or after a major deploy.

## Auth & email

- [ ] Customer register → welcome email (inbox/spam)
- [ ] Customer login / logout
- [ ] Forgot password (customer) → reset link → new password → login
- [ ] Admin login → forgot password → reset → `/admin/login`
- [ ] SMTP missing on server → forgot password shows clear error (not silent fail)

## Checkout & orders

- [ ] Guest checkout → Razorpay pay → success page
- [ ] Logged-in checkout → pay → success page
- [ ] **Order confirmation email** to customer after successful payment
- [ ] **Admin new-order email** to `MAIL_ADMIN` after payment
- [ ] Order appears in Admin → Orders
- [ ] Customer sees order under Account → Orders
- [ ] Order search (admin + customer) by order id / name / email

## Admin

- [ ] Products CRUD + 3-level category dropdown
- [ ] Special Discounts → create category (e.g. Friends 10%)
- [ ] Users → assign discount category
- [ ] Order status: Confirmed → Shipped → Delivered
- [ ] Payment pending warning when marking Shipped/Delivered with Pending payment
- [ ] SKU column visible in admin orders

## Storefront

- [ ] Home page loads quickly (splash, hero, categories)
- [ ] Products page search + category filters
- [ ] Logged-in customer sees tier/campaign best price
- [ ] Product detail, cart, wishlist
- [ ] Review after order **Delivered**

## Production deploy

- [ ] `server/.env`: SMTP + `FRONTEND_URL=https://yourelegancestore.com` + `MAIL_ADMIN`
- [ ] `cd server && npm install && pm2 restart all`
- [ ] `cd client && npm run build`
- [ ] Test one real payment on live site (small amount)
