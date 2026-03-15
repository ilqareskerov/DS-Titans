/**
 * CommunityPulse Telegram Bot
 * 
 * This bot handles ALL user interactions:
 * - Daily quiz delivery and answering
 * - Leaderboard viewing
 * - User profiles and badges
 * - Community engagement
 * 
 * Web App = Admin Only (content creation & distribution)
 * Telegram/Discord/WhatsApp = User interactions
 * 
 * Setup:
 * 1. Create a bot via @BotFather on Telegram
 * 2. Copy the bot token to .env.local as BOT_TOKEN
 * 3. Get your group chat ID and add as CHAT_ID
 * 4. Run: node telegram-bot/bot.js
 */

/* eslint-disable @typescript-eslint/no-require-imports */

const TelegramBot = require('node-telegram-bot-api');

// Configuration
const BOT_TOKEN = process.env.BOT_TOKEN || 'YOUR_BOT_TOKEN';
const CHAT_ID = process.env.CHAT_ID || 'YOUR_CHAT_ID';

// Initialize bot
const bot = new TelegramBot(BOT_TOKEN, { polling: true });

// Badge definitions
const BADGES = [
  { id: 'first-step', name: 'First Step', emoji: '🎯', description: 'Complete your first quiz' },
  { id: 'show-up', name: 'Show Up', emoji: '✨', description: 'Log in for the first time' },
  { id: 'streak-7', name: 'On Fire', emoji: '🔥', description: 'Maintain a 7-day streak' },
  { id: 'quiz-master', name: 'Quiz Master', emoji: '🧠', description: 'Score 100% on a quiz' },
  { id: 'top-10', name: 'Top 10', emoji: '🏆', description: 'Reach the top 10 leaderboard' },
  { id: 'helpful', name: 'Helpful', emoji: '💡', description: 'Help 5 community members' },
  { id: 'recruiter', name: 'Recruiter', emoji: '👋', description: 'Invite 3 friends' },
  { id: 'og-member', name: 'OG Member', emoji: '⭐', description: 'Be a member for 30 days' },
];

// In-memory storage (in production, use a database)
const userProfiles = {};
const leaderboard = [];
const dailyQuiz = {
  questions: [],
  sent: false,
  answers: {},
};

// Initialize user if not exists
function initUser(userId, firstName) {
  if (!userProfiles[userId]) {
    userProfiles[userId] = {
      name: firstName,
      score: 0,
      streak: 0,
      badges: ['show-up'],
      quizzesCompleted: 0,
      correctAnswers: 0,
      lastActive: new Date().toISOString(),
      joinedAt: new Date().toISOString(),
    };
    
    // Add to leaderboard
    leaderboard.push({ id: userId, name: firstName, score: 0, streak: 0 });
  }
  
  // Update streak
  const lastActive = new Date(userProfiles[userId].lastActive);
  const today = new Date();
  const diffDays = Math.floor((today.getTime() - lastActive.getTime()) / (1000 * 60 * 60 * 24));
  
  if (diffDays === 1) {
    userProfiles[userId].streak++;
    // Check for 7-day streak badge
    if (userProfiles[userId].streak >= 7 && !userProfiles[userId].badges.includes('streak-7')) {
      userProfiles[userId].badges.push('streak-7');
    }
  } else if (diffDays > 1) {
    userProfiles[userId].streak = 1;
  }
  
  userProfiles[userId].lastActive = new Date().toISOString();
  
  return userProfiles[userId];
}

// Get user rank
function getRank(userId) {
  leaderboard.sort((a, b) => b.score - a.score);
  const index = leaderboard.findIndex(u => u.id === userId);
  return index >= 0 ? index + 1 : null;
}

// Update leaderboard score
function updateLeaderboardScore(userId, score, streak) {
  const userIndex = leaderboard.findIndex(u => u.id === userId);
  if (userIndex >= 0) {
    leaderboard[userIndex].score = score;
    leaderboard[userIndex].streak = streak;
  }
}

// ====================
// COMMANDS
// ====================

// Start command
bot.onText(/\/start/, async (msg) => {
  const chatId = msg.chat.id;
  const userId = String(msg.from.id);
  const userName = msg.from.first_name;

  initUser(userId, userName);

  const welcomeMessage = 
    `👋 Welcome to CommunityPulse, ${userName}!\n\n` +
    `🎯 I'm your community assistant! Here's what you can do:\n\n` +
    `📋 *Commands:*\n` +
    `  /quiz — Take today's quiz\n` +
    `  /leaderboard — View top rankings\n` +
    `  /profile — Your stats & badges\n` +
    `  /badges — All available badges\n` +
    `  /help — Show this message\n\n` +
    `⚡ Take daily quizzes to earn points and climb the leaderboard!`;

  await bot.sendMessage(chatId, welcomeMessage, { parse_mode: 'Markdown' });
});

// Help command
bot.onText(/\/help/, async (msg) => {
  const chatId = msg.chat.id;

  const helpMessage = 
    `📋 *CommunityPulse Bot Commands*\n\n` +
    `Commands:\n` +
    `  /quiz        — Take today's quiz\n` +
    `  /leaderboard — Top 10 rankings\n` +
    `  /profile     — Your stats & badges\n` +
    `  /badges      — All available badges\n` +
    `  /help        — Show this message\n\n` +
    `💡 *Tips:*\n` +
    `• Take daily quizzes to earn points\n` +
    `• Maintain streaks for bonus points\n` +
    `• Invite friends to unlock badges`;

  await bot.sendMessage(chatId, helpMessage, { parse_mode: 'Markdown' });
});

// Daily Quiz command
bot.onText(/\/quiz/, async (msg) => {
  const chatId = msg.chat.id;
  const userId = String(msg.from.id);
  const userName = msg.from.first_name;

  initUser(userId, userName);

  if (!dailyQuiz.questions || dailyQuiz.questions.length === 0) {
    await bot.sendMessage(chatId, 
      '📝 No quiz available right now.\n\n' +
      'The admin will send a new quiz soon! Stay tuned 🔔'
    );
    return;
  }

  // Send quiz as poll
  const question = dailyQuiz.questions[0];
  await bot.sendPoll(chatId, question.question, question.options, {
    type: 'quiz',
    correct_option_id: question.answer.charCodeAt(0) - 65, // Convert A, B, C, D to 0, 1, 2, 3
    explanation: question.explanation,
    is_anonymous: false,
  });

  // Send remaining questions
  for (let i = 1; i < dailyQuiz.questions.length; i++) {
    const q = dailyQuiz.questions[i];
    await bot.sendPoll(chatId, q.question, q.options, {
      type: 'quiz',
      correct_option_id: q.answer.charCodeAt(0) - 65,
      explanation: q.explanation,
      is_anonymous: false,
    });
  }

  userProfiles[userId].quizzesCompleted++;
  
  // Check for first quiz badge
  if (!userProfiles[userId].badges.includes('first-step')) {
    userProfiles[userId].badges.push('first-step');
    await bot.sendMessage(chatId, 
      `🎉 *Congratulations!* You earned the 🎯 *First Step* badge!`,
      { parse_mode: 'Markdown' }
    );
  }
});

// Leaderboard command
bot.onText(/\/leaderboard/, async (msg) => {
  const chatId = msg.chat.id;

  // Get top 10
  leaderboard.sort((a, b) => b.score - a.score);
  const top10 = leaderboard.slice(0, 10);

  let message = '🏆 *CommunityPulse Leaderboard*\n\n';
  
  top10.forEach((user, index) => {
    const medal = index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `${index + 1}.`;
    message += `${medal} ${user.name} — *${user.score.toLocaleString()} pts*`;
    if (user.streak > 0) {
      message += ` 🔥${user.streak}`;
    }
    message += '\n';
  });

  message += '\n_Keep taking quizzes to climb the ranks!_';

  await bot.sendMessage(chatId, message, { parse_mode: 'Markdown' });
});

// Profile command
bot.onText(/\/profile/, async (msg) => {
  const chatId = msg.chat.id;
  const userId = String(msg.from.id);
  const userName = msg.from.first_name;

  const userData = initUser(userId, userName);
  const rank = getRank(userId);
  
  const earnedBadges = BADGES.filter(b => userData.badges?.includes(b.id));
  const badgeText = earnedBadges.length > 0 
    ? earnedBadges.map(b => `${b.emoji} ${b.name}`).join(' | ')
    : 'No badges yet — complete a quiz!';

  const profileText = 
    `👤 *${userName}'s Profile*\n\n` +
    `⚡ Score: *${userData.score.toLocaleString()} pts*\n` +
    `🔥 Streak: *${userData.streak} days*\n` +
    `📊 Rank: *#${rank || '—'}*\n` +
    `🧩 Quizzes: *${userData.quizzesCompleted || 0}*\n` +
    `✅ Correct: *${userData.correctAnswers || 0}*\n\n` +
    `🏅 *Badges:*\n${badgeText}\n\n` +
    `_Keep taking daily quizzes to earn more points and badges!_`;

  await bot.sendMessage(chatId, profileText, { parse_mode: 'Markdown' });
});

// Badges command
bot.onText(/\/badges/, async (msg) => {
  const chatId = msg.chat.id;
  const userId = String(msg.from.id);

  const userData = userProfiles[userId] || { badges: [] };

  let message = '🎖️ *Available Badges*\n\n';
  
  BADGES.forEach(badge => {
    const earned = userData.badges?.includes(badge.id);
    const status = earned ? '✅' : '⬜';
    message += `${status} ${badge.emoji} *${badge.name}*\n`;
    message += `   _${badge.description}_\n\n`;
  });

  message += `\n📊 Progress: ${userData.badges?.length || 0}/${BADGES.length} badges unlocked`;

  await bot.sendMessage(chatId, message, { parse_mode: 'Markdown' });
});

// Handle poll answers
bot.on('poll_answer', async (answer) => {
  const userId = String(answer.user.id);
  const userName = answer.user.first_name;
  
  const userData = initUser(userId, userName);
  
  // Check if correct (we'll track this via the quiz poll mechanism)
  // In a real implementation, you'd verify against the correct answer
  // For now, we award points for participation
  
  userData.score += 10;
  userData.correctAnswers++;
  
  updateLeaderboardScore(userId, userData.score, userData.streak);
  
  // Check for quiz master badge (100% on a quiz would be tracked elsewhere)
});

// ====================
// HTTP ENDPOINT for admin to send content
// ====================

const http = require('http');
const url = require('url');

// Create HTTP server for receiving content from admin web app
const server = http.createServer(async (req, res) => {
  const parsedUrl = url.parse(req.url, true);
  
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }

  if (req.method === 'POST' && parsedUrl.pathname === '/send-quiz') {
    let body = '';
    
    req.on('data', chunk => {
      body += chunk.toString();
    });
    
    req.on('end', async () => {
      try {
        const data = JSON.parse(body);
        const { quiz, postText, platforms } = data;
        const targetChatId = data.chatId || CHAT_ID;
        
        // Store quiz for users to take
        if (quiz?.questions?.length > 0) {
          dailyQuiz.questions = quiz.questions;
          dailyQuiz.sent = true;
          dailyQuiz.answers = {};
        }
        
        // Send announcement to group
        if (postText && !quiz) {
          await bot.sendMessage(targetChatId, postText, { parse_mode: 'Markdown' });
        }
        
        // Send quiz as polls
        if (quiz?.questions?.length > 0) {
          if (postText) {
            await bot.sendMessage(targetChatId, `📢 *New Quiz Announcement:*\n\n${postText}`, { parse_mode: 'Markdown' });
          }

          for (const q of quiz.questions) {
            await bot.sendPoll(targetChatId, q.question, q.options, {
              type: 'quiz',
              correct_option_id: q.answer.charCodeAt(0) - 65,
              explanation: q.explanation,
              is_anonymous: false
            });
            // Small delay between polls to avoid flood limits
            await new Promise(resolve => setTimeout(resolve, 500));
          }
        }
        
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ 
          success: true, 
          message: 'Quiz sent to Telegram!',
          questionsSent: quiz?.questions?.length || 0
        }));
      } catch (error) {
        console.error('Error processing quiz:', error);
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: error.message }));
      }
    });
  } else if (req.method === 'GET' && parsedUrl.pathname === '/health') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ status: 'ok', users: Object.keys(userProfiles).length }));
  } else {
    res.writeHead(404, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Not found' }));
  }
});

const PORT = process.env.TELEGRAM_BOT_PORT || 3001;
server.listen(PORT, () => {
  console.log(`🤖 CommunityPulse Telegram Bot running!`);
  console.log(`📡 HTTP server listening on port ${PORT}`);
  console.log(`\n📋 User Commands:`);
  console.log(`   /quiz        — Take today's quiz`);
  console.log(`   /leaderboard — Top 10 rankings`);
  console.log(`   /profile     — Your stats & badges`);
  console.log(`   /badges      — All available badges`);
  console.log(`   /help        — Show all commands`);
  console.log(`\n🌐 Admin sends content via web app → bot delivers to users`);
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\n🛑 Shutting down bot...');
  bot.stopPolling();
  server.close();
  process.exit(0);
});

module.exports = { bot, BADGES, userProfiles, dailyQuiz };
