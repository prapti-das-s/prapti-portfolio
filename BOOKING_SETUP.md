# Booking page setup (Google Calendar, no Calendly)

The booking page (`contact.html`) talks to two serverless functions that Vercel runs automatically:
`api/availability.js` (open slots) and `api/book.js` (creates the event and emails the guest an invite).
Nothing works until these four environment variables exist in Vercel
(Project → Settings → Environment Variables), then redeploy:

| Variable | Value |
|---|---|
| `GOOGLE_CLIENT_ID` | OAuth client ID |
| `GOOGLE_CLIENT_SECRET` | OAuth client secret |
| `GOOGLE_REFRESH_TOKEN` | refresh token for **your** Google account |
| `GOOGLE_CALENDAR_ID` | optional, defaults to `primary` |

## One-time Google setup
1. console.cloud.google.com → create a project → **APIs & Services → Library → Google Calendar API → Enable**.
2. **OAuth consent screen**: user type External, add yourself as a test user, then set publishing status to **In production**
   (otherwise the refresh token expires after 7 days; the "unverified app" warning is fine for your own account).
3. **Credentials → Create credentials → OAuth client ID → Web application**. Add `https://developers.google.com/oauthplayground` as an authorised redirect URI.
4. Open developers.google.com/oauthplayground → gear icon → tick **Use your own OAuth credentials**, paste the client ID and secret.
   Authorise the scope `https://www.googleapis.com/auth/calendar.events` and also `https://www.googleapis.com/auth/calendar.freebusy`, sign in with your account, then **Exchange authorization code for tokens** and copy the **refresh token**.
5. Put the three values into Vercel and redeploy.

## Rules (edit in `api/_lib.js`)
Mon–Fri 4:00–8:00 PM IST, Sat 12:00–5:00 PM IST, Sundays off. 30-minute slots, no bookings within 4 hours, up to 60 days ahead.
Slots that clash with anything already on your calendar are hidden automatically, and the server re-checks before booking.
