# High Style Cards — Multi-Brand System

The master card is at:

`/cards/?brand=high-style`

Each customer uses the same page and a different brand key in `brands.js`.

## Add a new customer

1. Open `cards/brands.js`.
2. Copy the `starter` block.
3. Rename the key, for example `joes-bar`.
4. Replace the business details, links, services and theme colours.
5. Their permanent card URL becomes:

`https://crossmatthew40-coder.github.io/cards/?brand=joes-bar`

That URL can be used to create the customer's QR code.

## Main fields

- `businessName` — business name
- `personName` — optional person's name
- `role` — job title / business type
- `tagline` — short brand line
- `logo` — path or hosted image URL
- `initials` — fallback brand mark if no logo is supplied
- `theme` — brand colours
- `phone` / `phoneDisplay`
- `whatsapp`
- `email`
- `website`
- `instagram` / `instagramLabel`
- `linkedin`
- `tiktok`
- `bookingUrl` / `bookingLabel`
- `services` — list of services
- `review` — optional testimonial
- `location` — location / areas covered
- `gallery` — optional image URLs
- `footer` — e.g. Powered by High Style Cards

Leave any optional field blank and the page hides it automatically.

## QR codes

Give every customer a unique URL using their brand key. The QR code should point at that URL. You can update their details later without replacing the printed QR code, provided the URL stays the same.
