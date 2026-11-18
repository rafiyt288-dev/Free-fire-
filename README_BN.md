# Free Fire Control Center — Dashboard Prototype

এটি একটি Render-ready Node.js dashboard prototype।

## এটি কী করে
- Owner password দিয়ে dashboard login
- Render service health ও server uptime দেখায়
- Player label, UID ও Bio text সংরক্ষণের demo form
- Monitoring ON/OFF flag (শুধু dashboard setting)

## এটি কী করে না
- Free Fire-এ login করে না
- গেম চালায় না বা account online রাখে না
- Glory বাড়ায় না বা game automation করে না
- Gmail / Free Fire password চায় না

## GitHub-এ আপলোড
এই ZIP extract করে সব ফাইল repository-র root-এ upload করুন। `public` folder-সহ পুরো structure বজায় রাখুন।

## Render deploy
1. Render-এ New > Blueprint নির্বাচন করুন।
2. GitHub account connect করে `Free-fire-bot` repository নির্বাচন করুন।
3. `render.yaml` detect হলে deploy করুন।
4. Deploy-এর সময় `ADMIN_PASSWORD` চাইলে শক্তিশালী আলাদা password দিন।
5. `SESSION_SECRET`-এর জন্য Render auto-generate করতে পারবে। না হলে অন্তত 32 অক্ষরের random secret দিন।
6. Deploy শেষে Render URL খুলে Admin Password দিয়ে login করুন।

## Local run (ঐচ্ছিক)
Node.js 20+ প্রয়োজন। `.env.example` দেখে environment variables সেট করে:
`npm install`
`npm start`

## গুরুত্বপূর্ণ সীমাবদ্ধতা
এই প্রথম সংস্করণে settings memory-তে থাকে, তাই service restart বা redeploy হলে reset হবে। স্থায়ী সংরক্ষণের জন্য পরের ধাপে PostgreSQL যুক্ত করতে হবে। Free hosting service idle হলে sleep করতে পারে; uptime সবসময় নিশ্চিত নয়।
