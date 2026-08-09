# Halo API

Serverless backend for [Halo](https://github.com/ilikecandy/Halo-Firmware),
hosted on Vercel. Sits between the ESP32, Supabase, and the companion app.

What it handles:
- Device settings (GET/POST /settings): language, wake word, and alert
  preferences in Supabase, pulled by the firmware on boot
- Notifications (POST /notifications): stores each alert in Supabase, then
  pushes hazard and SOS alerts to the companion app through Firebase Cloud
  Messaging
- Alert feed (GET /alerts, PATCH /alerts/:id): serves the companion app's
  emergency alerts screen; alerts can be acknowledged or resolved

See also the [companion app](https://github.com/StockerMC/Halo-App)
and [firmware](https://github.com/ilikecandy/Halo-Firmware).
