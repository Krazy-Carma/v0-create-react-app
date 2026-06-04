# KrazyCarma Audio Mastering Engine

Professional-grade audio mastering tool with AI-powered analysis, real-time processing, and one-click export.

**🎵 Live Demo:** https://v0-create-react-app-psi-neon.vercel.app

---

## ✨ Features

- **🤖 AI-Powered Audio Analysis** — Claude AI analyzes your tracks and recommends mastering presets (genre, EQ, compression, stereo width, loudness)
- **🎚️ Professional-Grade Processing**
  - 5-band parametric EQ with individual frequency controls
  - Dynamic compression with threshold, ratio, attack, release, and makeup gain
  - Stereo width control (0–100%)
  - Loudness optimization (LUFS targeting for streaming standards)
- **🎨 Pre-Tuned Mastering Presets**
  - Balanced Master — versatile, broadcast-ready
  - Warm & Analog — vintage character
  - Bright & Modern — contemporary sparkle
  - Loud & Punchy — competitive levels
  - Cinematic Wide — immersive soundscapes
- **📊 Real-Time Visualization** — Dual-channel waveform analysis and spectral feedback
- **💾 One-Click Export** — Stereo WAV export with all processing applied
- **📱 Mobile-Responsive UI** — Works on desktop, tablet, and mobile
- **🔒 Privacy-First** — All audio processing happens in your browser; no audio uploaded to servers
- **💰 Usage Tiers**
  - **Free:** 3 AI analyses per month
  - **Subscriber:** Unlimited analyses and advanced features

---

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ 
- npm or yarn

### Installation

```bash
# Clone the repository
git clone https://github.com/Krazy-Carma/v0-create-react-app.git
cd v0-create-react-app

# Install dependencies
npm install

# Set up environment variables (see .env.example)
cp .env.example .env.local

# Start development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Environment Variables

Create a `.env.local` file:

```env
# Claude API for AI audio analysis
ANTHROPIC_API_KEY=sk_...

# Optional: Comma-separated list of subscriber customer IDs
SUBSCRIBER_CIDS=cid1,cid2,cid3
```

---

## 🛠️ Tech Stack

- **Frontend:** Next.js 16, React 19, TypeScript
- **UI Components:** Radix UI, Tailwind CSS
- **Audio Processing:** Web Audio API
- **AI Analysis:** Claude (Anthropic SDK)
- **Deployment:** Vercel
- **State Management:** React Hooks

---

## 📁 Project Structure

```
v0-create-react-app/
├── app/
│   ├── api/
│   │   ├── ai-analysis/route.ts      # Claude AI analysis endpoint
│   │   ├── check-usage/route.ts      # Usage quota check
│   │   └── record-use/route.ts       # Log usage when analysis is performed
│   ├── master/page.tsx               # Main mastering tool UI
│   ├── layout.tsx                    # App layout
│   └── globals.css                   # Global styles
├── lib/
│   ├── audio-analyzer.ts             # Audio feature extraction & analysis
│   ├── audio-processor.ts            # Web Audio graph and processing
│   ├── usage-store.ts                # In-memory usage tracking (dev only)
│   └── presets.ts                    # Mastering preset definitions
├── public/
│   ├── icon-light-32x32.png
│   ├── icon-dark-32x32.png
│   └── icon.svg
├── .env.example                      # Environment variable template
└── package.json
```

---

## 🎯 How It Works

### 1. Upload Audio
- Select an audio file (MP3, WAV, FLAC, OGG)
- Browser decodes the audio and displays waveform

### 2. Get AI Recommendations (Optional)
- Click "Analyze with AI"
- Claude analyzes genre, dynamics, spectral characteristics
- Returns recommended preset and improvement tips

### 3. Adjust Parameters
- Tweak EQ bands, compression, stereo width, loudness
- Real-time visualization shows processing impact

### 4. Preview & Export
- Play the processed audio before exporting
- Click "Export Master" to download stereo WAV

---

## 📊 Usage Tracking

The app tracks monthly usage for rate limiting:

- **Free Users:** 3 AI analyses per calendar month
- **Subscribers:** Unlimited access

Usage is tracked by customer ID (stored in local state by default; production should use Vercel KV, Redis, or a database).

---

## 🐛 Known Issues & Future Work

- **Stereo Width Control:** Currently UI-only; wiring to Web Audio graph requires M/S (mid-side) processing node (see [PR #3](#))
- **Usage Storage:** Current in-memory store resets on server restart; replace with persistent storage for production
- **Mobile Safari:** File upload now works but test thoroughly with iOS devices

---

## 🤝 Contributing

Contributions welcome! Please:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## 📝 License

This project is open source. See LICENSE file for details.

---

## 🙋 Support

- **Issues & Bugs:** [GitHub Issues](https://github.com/Krazy-Carma/v0-create-react-app/issues)
- **Discussions:** [GitHub Discussions](https://github.com/Krazy-Carma/v0-create-react-app/discussions)
- **Live Demo:** https://v0-create-react-app-psi-neon.vercel.app

---

## 🎓 Learn More

- [Next.js Documentation](https://nextjs.org/docs) — Learn about Next.js features
- [Web Audio API Docs](https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API) — Audio processing guide
- [Claude API Docs](https://docs.anthropic.com/) — AI integration details

---

*Built with ❤️ by KrazyCarma. Powered by Claude AI.*
