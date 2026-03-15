'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Crown, Medal, Trophy, Flame, Gift, ChevronUp, Share2, CheckCircle } from 'lucide-react';
import { useCommunityPulse } from '@/context/CommunityPulseContext';
import { useToast } from '@/components/Toast';

interface LeaderboardMember {
  name: string;
  score: number;
  streak: number;
  level: string;
  isCurrentUser?: boolean;
}

const mockLeaderboard: LeaderboardMember[] = [
  { name: "Alex K.", score: 2840, streak: 34, level: "Legend" },
  { name: "Maria L.", score: 2210, streak: 21, level: "Champion" },
  { name: "James T.", score: 1980, streak: 18, level: "Champion" },
  { name: "You", score: 1650, streak: 12, level: "Regular", isCurrentUser: true },
  { name: "Sara M.", score: 1420, streak: 9, level: "Regular" },
  { name: "David R.", score: 1100, streak: 7, level: "Contributor" },
  { name: "Leila N.", score: 890, streak: 5, level: "Contributor" },
  { name: "Omar B.", score: 720, streak: 3, level: "Member" },
  { name: "Chen W.", score: 540, streak: 2, level: "Member" },
  { name: "Priya S.", score: 310, streak: 1, level: "Newcomer" },
];

type TimeFilter = 'week' | 'month' | 'all';

const rewards = [
  { rank: 1, reward: "$50 Software Credit", icon: "💰", color: "from-yellow-400 to-amber-500" },
  { rank: 2, reward: "Premium Course Access", icon: "📚", color: "from-gray-300 to-gray-400" },
  { rank: 3, reward: "Community Badge + Shoutout", icon: "🎖️", color: "from-amber-600 to-orange-700" },
  { rank: 10, reward: "Exclusive Digital Badge", icon: "✨", color: "from-purple-400 to-purple-600" },
];

export default function LeaderboardPage() {
  const [timeFilter, setTimeFilter] = useState<TimeFilter>('week');
  const [copied, setCopied] = useState(false);
  const { state } = useCommunityPulse();
  const { showToast } = useToast();

  // Simulated filtered data
  const getFilteredData = (): LeaderboardMember[] => {
    // Update current user's score from state
    return mockLeaderboard.map(member => 
      member.isCurrentUser 
        ? { ...member, score: state.userScore, streak: state.userStreak, level: state.currentLevel }
        : member
    ).sort((a, b) => b.score - a.score);
  };

  const leaderboardData = getFilteredData();

  const getCrownIcon = (rank: number) => {
    if (rank === 1) return <Crown className="w-6 h-6 crown-gold" />;
    if (rank === 2) return <Crown className="w-5 h-5 crown-silver" />;
    if (rank === 3) return <Crown className="w-5 h-5 crown-bronze" />;
    return null;
  };

  const getLevelColor = (level: string) => {
    switch (level) {
      case 'Legend': return 'bg-gradient-to-r from-yellow-400 to-amber-500 text-black';
      case 'Champion': return 'bg-gradient-to-r from-purple-500 to-pink-500';
      case 'Expert': return 'bg-gradient-to-r from-blue-500 to-cyan-500';
      case 'Regular': return 'bg-gradient-to-r from-green-500 to-emerald-500';
      case 'Contributor': return 'bg-gradient-to-r from-orange-500 to-red-500';
      case 'Member': return 'bg-secondary';
      case 'Newcomer': return 'bg-muted';
      default: return 'bg-secondary';
    }
  };

  // Format leaderboard for sharing
  const getShareText = () => {
    let text = '🏆 CommunityPulse Leaderboard\n';
    text += '──────────────────────\n';
    
    leaderboardData.slice(0, 5).forEach((member, idx) => {
      const rank = idx + 1;
      const medal = rank === 1 ? '🥇' : rank === 2 ? '🥈' : rank === 3 ? '🥉' : `${rank}.`;
      text += `${medal} ${member.name} — ${member.score.toLocaleString()} pts\n`;
    });
    
    text += '──────────────────────\n';
    text += 'Join the community → communitypulse.app';
    
    return text;
  };

  // Handle share
  const handleShare = () => {
    navigator.clipboard.writeText(getShareText());
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    showToast('Leaderboard copied to clipboard!', 'success');
  };

  return (
    <div className="min-h-[calc(100vh-80px)] p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <div className="flex items-center justify-center gap-4 mb-2">
            <h1 className="text-3xl font-bold text-white">Leaderboard</h1>
            <button
              onClick={handleShare}
              className="flex items-center gap-2 px-4 py-2 bg-secondary rounded-lg hover:bg-secondary/80 transition-colors text-sm"
            >
              {copied ? (
                <>
                  <CheckCircle className="w-4 h-4 text-green-400" />
                  <span className="text-green-400">Copied!</span>
                </>
              ) : (
                <>
                  <Share2 className="w-4 h-4" />
                  <span>Share</span>
                </>
              )}
            </button>
          </div>
          <p className="text-muted-foreground">Compete with the community and climb the ranks!</p>
        </motion.div>

        {/* Time Filter Tabs */}
        <div className="flex justify-center mb-8">
          <div className="bg-card rounded-xl p-1 border border-border flex gap-1">
            {(['week', 'month', 'all'] as TimeFilter[]).map((filter) => (
              <button
                key={filter}
                onClick={() => setTimeFilter(filter)}
                className={`px-6 py-2 rounded-lg text-sm font-medium transition-all ${
                  timeFilter === filter
                    ? 'bg-purple-500 text-white'
                    : 'text-muted-foreground hover:text-white'
                }`}
              >
                {filter === 'week' ? 'This Week' : filter === 'month' ? 'This Month' : 'All Time'}
              </button>
            ))}
          </div>
        </div>

        {/* Top 3 Podium */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-3 gap-4 mb-8"
        >
          {/* 2nd Place */}
          <div className="order-1 pt-8">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', delay: 0.3 }}
              className="bg-card rounded-xl p-4 border border-border text-center"
            >
              <div className="relative inline-block mb-3">
                <img
                  src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${leaderboardData[1]?.name}`}
                  alt={leaderboardData[1]?.name}
                  className="w-16 h-16 rounded-full border-2 border-gray-400"
                />
                <div className="absolute -top-2 -right-2">
                  <Crown className="w-6 h-6 crown-silver" />
                </div>
              </div>
              <p className="font-semibold text-white truncate">{leaderboardData[1]?.name}</p>
              <p className="text-lg font-bold text-gray-400">{leaderboardData[1]?.score.toLocaleString()}</p>
              <p className="text-xs text-muted-foreground flex items-center justify-center gap-1 mt-1">
                <Flame className="w-3 h-3 text-orange-400" />
                {leaderboardData[1]?.streak} days
              </p>
            </motion.div>
          </div>

          {/* 1st Place */}
          <div className="order-2">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', delay: 0.2 }}
              className="bg-gradient-to-b from-yellow-500/20 to-card rounded-xl p-4 border border-yellow-500/30 text-center"
            >
              <div className="relative inline-block mb-3">
                <img
                  src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${leaderboardData[0]?.name}`}
                  alt={leaderboardData[0]?.name}
                  className="w-20 h-20 rounded-full border-4 border-yellow-400"
                />
                <div className="absolute -top-3 -right-3">
                  <Crown className="w-8 h-8 crown-gold" />
                </div>
              </div>
              <p className="font-bold text-white truncate">{leaderboardData[0]?.name}</p>
              <p className="text-2xl font-bold text-yellow-400">{leaderboardData[0]?.score.toLocaleString()}</p>
              <p className="text-xs text-muted-foreground flex items-center justify-center gap-1 mt-1">
                <Flame className="w-3 h-3 text-orange-400" />
                {leaderboardData[0]?.streak} days
              </p>
            </motion.div>
          </div>

          {/* 3rd Place */}
          <div className="order-3 pt-12">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', delay: 0.4 }}
              className="bg-card rounded-xl p-4 border border-border text-center"
            >
              <div className="relative inline-block mb-3">
                <img
                  src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${leaderboardData[2]?.name}`}
                  alt={leaderboardData[2]?.name}
                  className="w-14 h-14 rounded-full border-2 border-amber-600"
                />
                <div className="absolute -top-2 -right-2">
                  <Crown className="w-5 h-5 crown-bronze" />
                </div>
              </div>
              <p className="font-semibold text-white truncate">{leaderboardData[2]?.name}</p>
              <p className="text-lg font-bold text-amber-600">{leaderboardData[2]?.score.toLocaleString()}</p>
              <p className="text-xs text-muted-foreground flex items-center justify-center gap-1 mt-1">
                <Flame className="w-3 h-3 text-orange-400" />
                {leaderboardData[2]?.streak} days
              </p>
            </motion.div>
          </div>
        </motion.div>

        {/* Full Leaderboard List */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="bg-card rounded-xl border border-border overflow-hidden mb-8"
        >
          <div className="divide-y divide-border">
            {leaderboardData.slice(3).map((member, idx) => {
              const rank = idx + 4;
              const isCurrentUser = member.isCurrentUser;
              
              return (
                <motion.div
                  key={member.name}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.1 * idx }}
                  className={`flex items-center gap-4 p-4 ${
                    isCurrentUser ? 'bg-purple-500/10 border-l-4 border-l-purple-500' : ''
                  }`}
                >
                  <span className={`w-8 text-center font-bold ${
                    rank <= 3 ? 'text-yellow-400' : 'text-muted-foreground'
                  }`}>
                    #{rank}
                  </span>
                  
                  <img
                    src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${member.name}`}
                    alt={member.name}
                    className="w-10 h-10 rounded-full"
                  />
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-semibold text-white truncate">
                        {member.name}
                        {isCurrentUser && <span className="text-purple-400 ml-1">(You)</span>}
                      </p>
                      {/* My Rank Badge */}
                      {isCurrentUser && (
                        <span className="px-2 py-0.5 bg-purple-500/20 text-purple-400 rounded text-xs font-bold flex items-center gap-1">
                          <Medal className="w-3 h-3" />
                          My rank: #{rank}
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">{member.level}</p>
                  </div>
                  
                  <div className="text-right">
                    <p className="font-bold text-white">{member.score.toLocaleString()}</p>
                    <p className="text-xs text-muted-foreground flex items-center justify-end gap-1">
                      <Flame className="w-3 h-3 text-orange-400" />
                      {member.streak}
                    </p>
                  </div>
                  
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getLevelColor(member.level)}`}>
                    {member.level}
                  </span>
                </motion.div>
              );
            })}
          </div>
        </motion.div>

        {/* Rewards Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="bg-card rounded-xl border border-border overflow-hidden"
        >
          <div className="p-4 border-b border-border flex items-center gap-2">
            <Gift className="w-5 h-5 text-purple-400" />
            <h2 className="font-semibold text-white">Rewards</h2>
          </div>
          
          <div className="p-4 grid gap-4 sm:grid-cols-2">
            {rewards.map((reward, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.7 + idx * 0.1 }}
                className="bg-secondary rounded-xl p-4 border border-border flex items-center gap-4"
              >
                <div className={`w-12 h-12 rounded-full bg-gradient-to-r ${reward.color} flex items-center justify-center text-2xl`}>
                  {reward.rank <= 3 ? (
                    <span className="font-bold text-white">{reward.rank}</span>
                  ) : (
                    <span className="text-sm font-bold text-white">TOP{reward.rank}</span>
                  )}
                </div>
                <div>
                  <p className="font-semibold text-white">{reward.icon} {reward.reward}</p>
                  <p className="text-sm text-muted-foreground">
                    {reward.rank <= 3 ? `${reward.rank}${reward.rank === 1 ? 'st' : reward.rank === 2 ? 'nd' : 'rd'} Place` : `Top ${reward.rank}`}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
