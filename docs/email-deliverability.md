# Email deliverability (Resend)

Lodus sends transactional mail via **Resend** only. Gmail SMTP is not supported.

## Required environment

```env
RESEND_API_KEY=re_xxxx
RESEND_FROM=Lodus <onboarding@yourdomain.com>
```

Optional: `RESEND_REPLY_TO`, `MAIL_UNSUBSCRIBE_URL` (HTTPS only).

## Production

- `RESEND_API_KEY` and `RESEND_FROM` are **required** when `NODE_ENV=production`.
- Set `AUTH_URL` to your public **https://** domain so verification links are trusted.

## Development

Without `RESEND_API_KEY`, emails are logged to the console (not sent).

## Domain setup

1. Add your domain in [Resend](https://resend.com).
2. Complete SPF/DKIM DNS records.
3. Use `RESEND_FROM` with that verified domain.

## What Lodus sends

- Email verification (applications)
- Admin approval alerts
- Membership approved (OTP login)
- Password reset OTP
- Phone verification OTP

All messages include HTML + plain text and `X-Entity-Ref-ID` headers.
