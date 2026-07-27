# Halo API

Serverless backend for [Halo](https://github.com/ilikecandy/SSCS-2025-Arduino),
hosted on Vercel. Sits between the ESP32, Supabase, and the companion app.

What it handles:
- Device settings (GET/POST /settings): language, wake word, and alert
  preferences in Supabase, pulled by the firmware on boot
- Notifications (POST /notifications): pushes hazard and SOS alerts to
  the companion app through Firebase Cloud Messaging

See also the [companion app](https://github.com/StockerMC/SSCS-2025-App)
and [firmware](https://github.com/ilikecandy/SSCS-2025-Arduino).
