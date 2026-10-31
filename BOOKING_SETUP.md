# Booking page setup (Google Calendar, no Calendly)

`contact.html` shows a month calendar, the open time slots (Mon-Fri 4:00-8:00 PM IST, Sat 12:00-5:00 PM IST, Sundays off,
30-minute calls) and a details form. Until your calendar is connected it works in **request mode**: the visitor picks a slot and
their email app opens with the request filled in, plus an "Add to my Google Calendar" link. Connect the calendar and it becomes
fully automatic: taken times disappear, the event lands on your calendar and the guest gets an invite.

## Easiest way (about 3 minutes, no Google Cloud console)
1. Go to script.google.com, click **New project**, delete the sample code and paste in everything from `apps-script/Code.gs`.
2. Change `KEY` at the top to any long random string (keep a copy).
3. Click **Deploy > New deployment > Web app**. Set **Execute as: Me** and **Who has access: Anyone**. Authorise it with your Google account when asked.
4. Copy the **Web app URL**.
5. In Vercel: Project > Settings > Environment Variables, add `BOOKING_SCRIPT_URL` (the URL) and `BOOKING_SCRIPT_KEY` (the same KEY). Redeploy.

## Alternative: Google OAuth (Google Cloud console)
Set `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GOOGLE_REFRESH_TOKEN` (and optionally `GOOGLE_CALENDAR_ID`). This mode also adds a Google Meet link.
Steps: enable the Google Calendar API, create an OAuth client (Web), use developers.google.com/oauthplayground with your own credentials and the
scopes `calendar.events` and `calendar.freebusy`, then copy the refresh token. Publish the consent screen "In production" so the token does not expire.

## Rules (edit in `api/_lib.js` and the matching `localSlots` in `js/booking.js`)
No bookings within 4 hours, up to 60 days ahead. The server re-checks the calendar right before booking, so two people cannot take the same slot.
