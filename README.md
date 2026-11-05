# Innolead site (GitHub + Vercel)

```
public/index.html    the website
api/                 serverless functions: sign-up, login, logout, course booking requests
lib/                 shared code and the course price table (lib/prices.js)
vercel.json          tells Vercel to serve public/
```
There are no packages to install.

## Deploy
1. Create a GitHub repository and push this folder to it.
2. In Vercel: **Add New > Project**, import the repository, leave the framework as "Other", and deploy.
3. **Storage:** in the project's Storage tab, add **Upstash Redis** from the Marketplace and connect it to the project. This holds booking requests. (Vercel functions cannot save files.)
4. **Environment variables:** add `APP_URL`, `AUTHGATE_URL`, `AUTHGATE_API_KEY`, `SESSION_SECRET` (see `.env.example`), then redeploy so they take effect.
5. **Domain:** add `innoleadafrica.com` under Project > Settings > Domains and follow Vercel's DNS instructions. Set `APP_URL` to the final address.

## AuthGate dashboard
1. Providers: keep **Email** enabled.
2. Callbacks: register `APP_URL/` (for example `https://innoleadafrica.com/`). Preview deployments use other addresses, so test sign-up on the production address.
3. Confirm the verification email arrives after a test sign-up.
4. If calls to `https://authgate.dev` fail, set `AUTHGATE_URL` to `https://innolead-8269daeb.authgate.dev`.

## Booking requests
"Request my place" saves the request in Redis as `order:<id>` (with ids listed in `orders:all` and `orders:<email>`): full name, email, contact number, course, option, price, the customer's acknowledgement with its time, and a `transactionId` field (blank until DPO is connected). View them in the Upstash data browser, which you can open from the Vercel Storage tab. DPO payments will be added later.

## Payment notification email
`lib/payments.js` exports `markPaid(orderId, transactionId)`. When DPO is connected, call it from the DPO return/notification route once `verifyToken` confirms payment. It saves the transaction ID, marks the order paid, and emails `ACADEMY_EMAIL` the customer's name, email, contact number, course, amount, transaction ID and order reference. The email's reply address is the customer, so the team can reply to contact them. It is sent once per order, and if sending fails the order still becomes paid and the error is stored on the order (`notifyError`) so a repeat call retries.

Setup: create a Resend account, add and verify `innoleadafrica.com` (DNS records), create an API key, and set `RESEND_API_KEY`, `MAIL_FROM`, `ACADEMY_EMAIL` in Vercel.

## Editing
Change the site in `public/index.html` and push to GitHub; Vercel redeploys automatically. Change prices in `lib/prices.js`. PRINCE2 option prices and PRINCE2 Agile are still empty (recorded as blank).

## Local test (optional)
`npm i -g vercel`, then `vercel dev` in this folder with a `.env` file.
