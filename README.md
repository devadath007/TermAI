# TermAI - NextGen HUD

A highly interactive, stealth-themed web application designed as a next-generation Heads-Up Display (HUD) for CLI developers. Powered by Google Gemini AI, it acts as a cross-platform expert terminal assistant directly inside your browser.

## Features

- **Professional Glassmorphism UI**: A sleek, dark "stealth mode" aesthetic with beautiful animated gradient backgrounds and frosted glass panels.
- **Google Gemini Integration**: A lightweight Node.js backend connects directly to Google's elite Generative AI models.
- **Cross-Platform CLI Expertise**: The AI is strictly prompted to provide accurate terminal commands tailored to Windows (PowerShell/CMD), Linux, and macOS.
- **Quick Commands Panel**: A fast, searchable sidebar of frequently used snippets that instantly populates the chat.
- **Smart Markdown Rendering**: AI responses are cleanly formatted with code blocks, inline code highlighting, and professional typography using the Inter font.

## Tech Stack

- **Frontend**: HTML5, Vanilla CSS (Glassmorphism), Vanilla JavaScript
- **Backend**: Node.js, Express, Google GenAI SDK (`@google/generative-ai`)
- **Icons & Parsing**: Lucide Icons, Marked.js

## Quick Start Setup

1. **Clone the repository**
   ```bash
   git clone https://github.com/devadath007/TermAI.git
   cd TermAI
   ```

2. **Install Dependencies**
   ```bash
   npm install
   ```

3. **Configure Environment Variables**
   Create a `.env` file in the root directory and add your Google Gemini API key:
   ```env
   # .env
   GEMINI_API_KEY=your_actual_api_key_here
   GEMINI_MODEL=gemini-flash-lite-latest
   ```

4. **Run the Backend Server**
   ```bash
   npm start
   ```

5. **Launch the Application**
   Open the `index.html` file in your preferred web browser, or configure the server to serve it statically on `http://localhost:3000`.

## Developer

Designed and developed by [devadath007](https://github.com/devadath007).
