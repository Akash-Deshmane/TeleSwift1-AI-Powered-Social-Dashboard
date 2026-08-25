# TeleSwift ✨

TeleSwift is a full-stack, AI-powered social dashboard that allows users to manage their live Telegram dialogs from a unified web interface. 

It solves the problem of information overload in highly active messaging groups by integrating Google's Gemini AI to distill hundreds of unread messages into concise, actionable insights.

## 🚀 Tech Stack

### Frontend (Client)
- **React.js (Vite)** - Blazing fast frontend framework
- **Lucide React** - Modern, crisp iconography
- **CSS3** - Custom glassmorphism UI and responsive design

### Backend (Server & API)
- **Node.js & Express** - Scalable backend architecture
- **Telegram MTProto API (GramJS)** - Native password-less Telegram OTP authentication and real-time messaging
- **Google Generative AI SDK (Gemini Flash)** - Real-time chat summarization engine
- **Firebase Firestore (Admin SDK)** - Cloud database for persisting AI summaries and user usage quotas
- **Node-Cache** - In-memory caching layer to optimize API performance and prevent Telegram rate-limits

## 💡 Key Features
- **OTP Authentication:** Secure, password-less login directly through Telegram's native SMS/App system.
- **Live Feed Dashboard:** View all your active Telegram groups, channels, and direct messages in a sleek web UI.
- **On-Demand AI Summaries:** Instantly summarize hundreds of missed messages in a group using Gemini AI.
- **Quick Reply:** Send messages directly to Telegram groups from the TeleSwift dashboard.
- **Summary History:** Save and bookmark important AI-generated summaries to your personal Firebase-backed cloud.

## 🏗️ System Architecture

- **React Frontend:** Handles the UI and makes REST API calls to the backend.
- **Node.js / Express Backend (Core):**
  - Uses your **Telegram API Keys** (APP_API_ID & APP_API_HASH) via GramJS to securely connect directly to Telegram servers for real-time chats and password-less authentication.
  - Connects to the **Google Gemini API SDK** to process chat payloads and generate AI summaries.
  - Connects to the **Firebase Admin SDK** to persist user quotas and save history in a Firestore Database.

## 📂 Project Structure

```text
TeleSwift/
├── back_end/                # Node.js backend
│   ├── index.js             # Express server entry point
│   ├── routes/              # Express API routes
│   │   ├── authRoutes.js    # Telegram OTP and Session caching logic
│   │   └── mainRoutes.js    # Gemini AI summarization & message routing
│   ├── utils/               # Helper modules
│   │   ├── db.js            # Firebase Admin SDK logic
│   │   └── telegramClient.js# MTProto Telegram Client setup
│   └── sessions/            # Local cached MTProto sessions (Git-ignored)
└── front_end_web/           # React.js frontend
    ├── src/
    │   ├── pages/           # React page components (Login, Feed, Profile, etc.)
    │   ├── components/      # Reusable UI components (Sidebar Layout)
    │   ├── App.jsx          # React Router setup
    │   └── config.js        # Global frontend configuration
    └── vite.config.js       # Vite bundler configuration
```

## 🛠️ Setup Instructions

### 1. Prerequisites
- Node.js (v18+)
- A Telegram API ID and Hash (from my.telegram.org)
- Google Gemini API Key (from Google AI Studio)
- Firebase Service Account Key

### 2. Backend Setup
```bash
cd back_end
npm install
```
Create a `.env` file in the `back_end` directory:
```env
APP_API_ID=your_telegram_api_id
APP_API_HASH=your_telegram_api_hash
GEMINI_API_KEY=your_gemini_api_key
```
Place your Firebase `serviceAccountKey.json` inside the `back_end` folder. Then start the server:
```bash
node index.js
```

### 3. Frontend Setup
```bash
cd front_end_web
npm install
npm run dev
```

Navigate to `http://localhost:5173` to start using TeleSwift!
