import { NextRequest, NextResponse } from 'next/server';

interface QuizQuestion {
  question: string;
  options: string[];
  answer: string;
  explanation: string;
}

interface Quiz {
  questions: QuizQuestion[];
}

interface EventData {
  title: string;
  description: string;
  event_date: string;
  location: string;
  organizer: string;
  event_url?: string;
  image_url?: string;
}

interface PlatformResult {
  success?: boolean;
  message?: string;
  error?: string;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { quiz, event, platforms, postText } = body as {
      quiz?: Quiz;
      event?: EventData;
      platforms?: string[];
      postText?: string;
    };

    const results: Record<string, PlatformResult> = {};

    // Process each platform
    if (platforms) {
      for (const platform of platforms) {
        if (platform === 'telegram') {
          results.telegram = await sendToTelegram(quiz, postText);
        } else if (platform === 'discord') {
          results.discord = await sendToDiscord(quiz, event, postText);
        }
      }
    }

    return NextResponse.json({ success: true, results });
  } catch (error) {
    console.error('Send quiz error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to send content' },
      { status: 500 }
    );
  }
}

// Telegram Bot API sender
async function sendToTelegram(quiz?: Quiz, postText?: string): Promise<PlatformResult> {
  const botToken = process.env.BOT_TOKEN;
  const chatId = process.env.CHAT_ID;
  const telegramBotUrl = process.env.TELEGRAM_BOT_URL || 'http://localhost:3001';

  // If we have the bot service URL, send via that
  if (telegramBotUrl) {
    try {
      const botResponse = await fetch(`${telegramBotUrl}/send-quiz`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          quiz,
          postText,
        }),
      });

      if (botResponse.ok) {
        const data = await botResponse.json();
        return { success: true, message: data.message || 'Posted to Telegram!' };
      }
    } catch (error) {
      console.log('Bot service not available, trying direct API...');
    }
  }

  // Direct Telegram API fallback (requires BOT_TOKEN and CHAT_ID)
  if (!botToken || !chatId) {
    return { error: 'Configure BOT_TOKEN & CHAT_ID in .env.local' };
  }

  try {
    let message = '';
    
    if (quiz?.questions?.length && postText) {
      message = postText;
    } else if (postText) {
      message = postText;
    } else {
      return { error: 'No content to send' };
    }

    const telegramUrl = `https://api.telegram.org/bot${botToken}/sendMessage`;
    const telegramRes = await fetch(telegramUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text: message,
        parse_mode: 'Markdown',
      }),
    });

    if (telegramRes.ok) {
      return { success: true, message: 'Posted to Telegram group!' };
    } else {
      const errorData = await telegramRes.json().catch(() => ({}));
      return { error: `Telegram error: ${telegramRes.status} - ${errorData.description || 'Unknown'}` };
    }
  } catch (error) {
    return { error: `Telegram error: ${error instanceof Error ? error.message : 'Unknown'}` };
  }
}

// Discord Webhook sender
async function sendToDiscord(quiz?: Quiz, event?: EventData, postText?: string): Promise<PlatformResult> {
  const webhookUrl = process.env.DISCORD_WEBHOOK_URL;

  if (!webhookUrl) {
    return { error: 'Configure DISCORD_WEBHOOK_URL in .env.local' };
  }

  try {
    // 1. Send Event as Rich Embed if present
    if (event) {
      const eventDateStr = event.event_date ? new Date(event.event_date).toLocaleString() : 'TBD';
      
      const fields = [
        { name: "📅 Date & Time", value: eventDateStr, inline: false },
        { name: "📍 Location", value: `**${event.location || 'TBD'}**`, inline: true }
      ];
      
      if (event.event_url) {
        fields.push({ name: "🔗 More Details", value: `[Click here to join](${event.event_url})`, inline: true });
      }

      const embed: any = {
        title: `🚀 ${event.title}`,
        description: event.description ? `${event.description}\n\n---` : undefined,
        color: 5793266, // Vibrant Blurple
        fields: fields,
        footer: {
          text: "CommunityPulse Event Platform",
          icon_url: "https://cdn-icons-png.flaticon.com/512/5968/5968756.png"
        },
        thumbnail: { url: "https://cdn-icons-png.flaticon.com/512/2693/2693507.png" }
      };

      if (event.event_date) {
        try { embed.timestamp = new Date(event.event_date).toISOString(); } catch (e) {}
      }

      if (event.organizer) {
        embed.author = {
          name: `Organized by ${event.organizer}`,
          icon_url: "https://cdn-icons-png.flaticon.com/512/1144/1144760.png"
        };
      }

      if (event.image_url && event.image_url.startsWith("http")) {
        embed.image = { url: event.image_url };
      }

      await fetch(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ embeds: [embed] }),
      });
    } 
    // 2. Or send announcement/post text if present (prevent double-posting event content)
    else if (postText) {
      await fetch(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          content: `📢 **Community Update**\n\n${postText}` 
        }),
      });
    }

    // 3. Send quiz questions as native polls
    if (quiz?.questions?.length) {
      for (const [index, q] of quiz.questions.entries()) {
        const pollPayload = {
          poll: {
            question: { text: `Q${index + 1}: ${q.question}` },
            answers: q.options.map((option, i) => ({
              answer_id: i + 1,
              poll_media: { text: option }
            })),
            allow_multiselect: false,
            duration: 24, // 24 hours
            layout_type: 1 // Default layout
          }
        };

        const response = await fetch(webhookUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(pollPayload),
        });

        if (!response.ok) {
          console.error(`Discord poll error (Q${index + 1}):`, response.status);
        }

        // Small delay to prevent rate issues and ensure ordering
        await new Promise(resolve => setTimeout(resolve, 800));
      }
    }

    return { success: true, message: 'Posted to Discord!' };
  } catch (error) {
    return { error: `Discord error: ${error instanceof Error ? error.message : 'Unknown'}` };
  }
}
