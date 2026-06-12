# Kindred

Basically a gamified duolingo style plant and pet companion app. This will track by scanning for AI health checks, and you have to climb the global leaderboards and keep your streak alive.

---

## The Story Behind It

So basically At my first hackathon I walked in with an idea: a garden sensor that monitors plant health and keeps your plants safe. WE scratched my idea and went for something safe and guess what! The original idea that i had went on to **win first place** this was heartbreaking cuz i was there I was in that same process however it just did not happen (Hack the valley).

I knew I could build it better. So I did. Kindred is that idea, rebuilt from scratch with everything I wanted it to be: real AI-powered plant and pet identification, a full gamification loop with levels, streaks, and leaderboards, and a polished PWA that works offline on any device.

Looks much better too: ![alt text](image-1.png)

---

## What It Does

- **Add companions** You can add plants or pets and give accurate description nad proper breed or scan using ur camera and scan it. 
- **AI health scans**  point your camera at a plant or pet; Gemini 2.5 Flash identifies the species, scores its health (0–100), flags issues, and returns personalised care tips
- **Daily care tracking** By giving daily and important reminders throughout the day and week it ensures that you can optimize your plant health to it's maximum. ![alt text](image.png) ![alt text](image-3.png)
- **Weekly photo health checks** health is judged from real photos, not just taps. Each week you get a nudge to snap a fresh picture ![alt text](image-2.png)
- **Push notifications** Imported a web notification API to send notifications throughout the day to ensure that you are on top of things. 
- **Fully offline-capable** Firestore's IndexedDB persistent cache means the app keeps working without a connection

## AI Used (Where and how)

**Google Gemini 2.5 Flash using google AI studio API key** powers two features:

1. **Photo scan** (`/api/scan`)  you upload a photo and then Gemini identifies the plant or pet, scores its health, lists visible issues, and returns watering/fertilising intervals and care tips as mentionsed within the JSON
2. **Text identification** (`/api/identify`)  when you type a name instead of scanning, Gemini infers species and care needs from open source net, and flags when it's too vague which in return asks for the user to take a picture of the plant regardless of agnle or what not.

### Claude AI in development

**Claude Opus 4.8** researched the 3D plant model (the `.glb` scene, animation rigging, and how to integrate Three.js + React Three Fiber into Next.js 14 App Router) and explored how to wire it up without blocking hydration or triggering SSR issues.

**Claude Sonnet 4.6** handled architecture organization,  this meant to structure tha basic app layout and ensure that my PWA optimization was correct it also helped with tracking user data correctly on Firebase and the leaderboard redesign, PWA service worker configuration, and E2E test setup with Playwright. I also do want to adress when I was lazy I asked it to complete all hard tasks for it to complete but I am sure the Idea, creativity, prompts and coding was written by me while AI was just there for execution and  integrations and hard thigns I cannot figure out. 


You can try it out yourself on teh deployment but if not you can follow steps below to set up the repo on your own.

### Prerequisites

- Node.js 18+
- A Firebase project (Firestore + Google Auth enabled)
- A Google AI Studio API key (for Gemini)

### 1. Clone

### 2. Environment variables

Create a `.env.local` file in the main housing of the files like the root of structrure.

```env
# Firebase
NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
NEXT_PUBLIC_FIREBASE_APP_ID=
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=
GEMINI_API_KEY=
```

### 3. Firebase setup
- Enable **Google sign-in** in Firebase Auth
- Create a **Firestore** database

### 4. Run locally

```bash
npm run dev
```
There you have it the repo and eveyrthing and for PWA on the local host you can install it by clicking settsin and add to home page nad you will see an install button and what not.
