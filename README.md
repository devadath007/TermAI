# TermAI - Local HUD

A highly interactive, stealth-themed web application designed as a next-generation Heads-Up Display (HUD) for CLI developers. Powered by **WebLLM** and local AI models, it acts as a completely private, cross-platform expert terminal assistant directly inside your browser—no backend servers or API keys required!

## Features

- **100% Private, Local AI**: The AI model runs entirely on your machine using your browser's WebGPU. No data is sent to external APIs, and there are absolutely no rate limits.
- **Professional Glassmorphism UI**: A sleek, dark "stealth mode" aesthetic with beautiful animated gradient backgrounds and frosted glass panels.
- **Cross-Platform CLI Expertise**: The local AI acts as your personal terminal expert, providing accurate commands tailored to Windows (PowerShell/CMD), Linux, and macOS.
- **Quick Commands Panel**: A fast, searchable sidebar of frequently used snippets that instantly populates the chat.
- **Smart Markdown Rendering**: AI responses are cleanly formatted with code blocks, inline code highlighting, and professional typography using the Inter font.

## Tech Stack

- **Frontend**: HTML5, Vanilla CSS (Glassmorphism), Vanilla JavaScript
- **Local AI Engine**: WebLLM (`@mlc-ai/web-llm`) running Microsoft's Phi-3 model via WebGPU
- **Icons & Parsing**: Lucide Icons, Marked.js
- **Backend**: None! 100% static frontend.

## Quick Start Setup

Since the application is purely a static frontend, there is no build step or backend server required.

1. **Clone the repository**
   ```bash
   git clone https://github.com/devadath007/TermAI.git
   cd TermAI
   ```

2. **Run a local web server**
   Because the browser needs to load the AI model using Web Workers and fetch API, you cannot simply double-click the `index.html` file (due to CORS policies for local files). You must serve it via a local web server.

   You can use Python:
   ```bash
   python -m http.server 3000
   ```
   Or Node.js (npx):
   ```bash
   npx serve .
   ```
   Or any other static server extension like "Live Server" in VS Code.

3. **Launch the Application**
   Open your browser to `http://localhost:3000`. The first time you load the page, the application will download the AI model directly into your browser cache (approx. 1.8GB). Subsequent loads will be instantaneous.

## Hosting

Because TermAI is entirely static, it can be hosted for free forever on platforms like:
- **GitHub Pages** (Recommended)
- Vercel
- Netlify

Simply deploy the root directory to your host of choice. No environment variables or build commands are necessary.

## Developer

Designed and developed by [devadath007](https://github.com/devadath007).
