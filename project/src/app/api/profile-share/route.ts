import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const userId = searchParams.get('userId') || 'default';

  // In production this would query a database
  // For now, return mock data based on userId
  const profiles: Record<string, any> = {
    default: {
      name: 'Alex K.',
      score: 1650,
      streak: 12,
      level: 'Regular',
      rank: 4,
      badges: ['first_step', 'show_up', 'streak_7'],
      memberSince: '2024-10',
      shareText: `🏆 My CommunityPulse Stats
──────────────────────
👤 Alex K. | Level: Regular
⚡ Score: 1,650 pts
🔥 Streak: 12 days
🏅 Rank: #4
🎖️ Badges: 🎯 First Step | ✨ Show Up | 🔥 7-Day Streak
──────────────────────
Join at communitypulse.app`,
    },
  };

  const profile = profiles[userId] || profiles.default;

  return NextResponse.json(profile);
}
