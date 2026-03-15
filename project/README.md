# CommunityPulse (DS Titans)

**CommunityPulse** is an AI-powered community management tool designed to streamline content creation, audience engagement, and multi-platform delivery. Built for tech communities, it helps admins quickly generate social media posts, interactive quizzes, trending topics, and rich event announcements using the Groq AI API. content is then easily distributed across platforms like Discord and Telegram.

## 🚀 Features

### AI Administrator (Powered by Groq)
- **Fast Generation**: Uses Groq's low-latency API (`llama-3.3-70b-versatile`) to generate high-quality content instantly.
- **Copywriter**: Craft engaging social media posts, announcements, and captions tailored for tech communities.
- **Quiz Generator**: Automatically generate domain-specific, 5-question quizzes outputted in a structured JSON format.
- **Trend Analyst**: Stay ahead of the curve by requesting 5 bullet-point ideas based on trending tech topics with optimizing emojis.
- **Event Planner**: Create complex event announcements, outputting organized information (Title, Date, Location, Organizer, URL) for streamlined delivery.
- **Image Generation Prompting**: Describe image concepts quickly for associated posts.

### Multi-Platform Delivery
Deliver your content exactly where your community lives, formatted perfectly for each platform.

- **Discord Native Delivery**
  - **Quizzes**: Delivered as native interactive Discord Polls (each question is sent as a standalone poll message).
  - **Events**: Intercepts generated Event JSON and constructs vibrant, rich Embeds (featuring blurple colors, custom titles, formatted dates, and location tracking).
  - **Announcements**: Broadcast text messages beautifully.
- **Telegram Bot Integration**
  - **Quizzes**: Dispatches interactive quizzes natively formatted as Telegram Polls.
  - **Reliable Routing**: Handles standard and upgraded supergroup connection delivery.
- **Social Sharing** 
  - Generates deep-links for sharing posts manually natively to WhatsApp, LinkedIn, X/Twitter, and Facebook.
  - Provides easy "copy to clipboard" flows for unsupported platforms like Instagram.

## 🛠️ Technology Stack
- **Frontend/Framework**: [Next.js](https://nextjs.org/) (React)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/)
- **AI Engine**: [Groq API](https://groq.com/) (OpenAI-compatible endpoints)
- **Bot Delivery**: 
  - Discord Webhooks / Bot API
  - `node-telegram-bot-api` (Custom Node.js Telegram service)

## ⚙️ Getting Started

### Prerequisites
- Node.js (v18+)
- Discord Server with Webhook permissions
- Telegram Bot Token (from BotFather)
- Groq API Key

### 1. Installation
Clone the repository (or extract the zip):
```bash
# If extracting, navigate into the directory:
cd ds_titans

# Install dependencies for the main application
npm install
# or
bun install
```

### 2. Environment Configuration
Create or modify a `.env` (or `.env.local`) file in the root directory:

```env
# AI Provider Configuration
GROQ_API_KEY=your_groq_api_key_here

# Telegram Configuration
BOT_TOKEN=your_telegram_bot_token_here
CHAT_ID=your_telegram_target_chat_or_supergroup_id

# Discord Configuration
DISCORD_WEBHOOK_URL=your_discord_webhook_url_here

# Internal Linking (Optional, if bot runs separately)
TELEGRAM_BOT_URL=http://localhost:3001
```

### 3. Running the Application

This project requires two processes running simultaneously: the Next.js web application (Admin Dashboard) and the Telegram Bot Service.

**Start the Next.js Dashboard:**
```bash
npm run dev
# Dashboard will be available at http://localhost:3000
```

**Start the Telegram Bot Service:**
In a separate terminal window, navigate to the project root and run:
```bash
node telegram-bot/bot.js
```

## 📚 How to Use

1. **Access the Admin Panel**: Open `http://localhost:3000` in your browser.
2. **Generate Content**: Use the input box or the "Quick Actions" at the top left to prompt the AI. (e.g., "Create a quiz about Python fundamentals" or "Plan an event for an AI Hackathon next weekend").
3. **Preview**: Review the generated Quiz, Event, or Post in the right-hand **Content Preview** panel.
4. **Distribute**: 
   - Under **Bot Delivery**, select the platforms you want to push the content to (Discord, Telegram).
   - Click **Send to Community**. 
   - *Note: Quizzes and Events are automatically parsed and mapped into native interactive polls and rich embeds on their respective platforms.*

## 🤝 Contributing
Contributions are welcome. Feel free to open issues or submit pull requests for new features such as Slack integration, new AI skills, or UI enhancements.
