'use client';

import React, { useEffect, useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { 
  Flame, 
  Calendar, 
  Trophy, 
  Target, 
  Award,
  Activity as ActivityIcon,
  MessageCircle,
  Users,
  CheckCircle,
  Lock,
  Zap,
  Share2,
  Download,
  Copy
} from 'lucide-react';
import { useCommunityPulse, Activity, Badge } from '@/context/CommunityPulseContext';
import { useToast } from '@/components/Toast';

const platformActivity = [
  { name: 'Discord', icon: '💬', percentage: 85, color: 'bg-indigo-500' },
  { name: 'Telegram', icon: '✈️', percentage: 72, color: 'bg-blue-500' },
  { name: 'WhatsApp', icon: '📱', percentage: 45, color: 'bg-green-500' },
  { name: 'Meetup', icon: '🎯', percentage: 30, color: 'bg-red-500' },
  { name: 'LinkedIn', icon: '💼', percentage: 60, color: 'bg-sky-500' },
];

const levelThresholds = [
  { level: 'Newcomer', min: 0 },
  { level: 'Member', min: 100 },
  { level: 'Contributor', min: 500 },
  { level: 'Regular', min: 1000 },
  { level: 'Expert', min: 2000 },
  { level: 'Champion', min: 3000 },
  { level: 'Legend', min: 5000 },
];

export default function ProfilePage() {
  const { state } = useCommunityPulse();
  const [animatedScore, setAnimatedScore] = useState(0);
  const [showConfetti, setShowConfetti] = useState(false);
  const profileCardRef = useRef<HTMLDivElement>(null);
  const { showToast } = useToast();

  // Animate score on load
  useEffect(() => {
    const targetScore = state.userScore;
    const duration = 2000;
    const steps = 60;
    const increment = targetScore / steps;
    let current = 0;
    
    const timer = setInterval(() => {
      current += increment;
      if (current >= targetScore) {
        setAnimatedScore(targetScore);
        clearInterval(timer);
      } else {
        setAnimatedScore(Math.floor(current));
      }
    }, duration / steps);
    
    return () => clearInterval(timer);
  }, [state.userScore]);

  // Calculate progress to next level
  const getNextLevel = () => {
    for (let i = levelThresholds.length - 1; i >= 0; i--) {
      if (state.userScore < levelThresholds[i].min) {
        return {
          nextLevel: levelThresholds[i].level,
          currentMin: levelThresholds[i - 1]?.min || 0,
          nextMin: levelThresholds[i].min,
        };
      }
    }
    return {
      nextLevel: 'Max Level',
      currentMin: levelThresholds[levelThresholds.length - 1].min,
      nextMin: levelThresholds[levelThresholds.length - 1].min,
    };
  };

  const levelInfo = getNextLevel();
  const progressPercent = levelInfo.nextMin === levelInfo.currentMin
    ? 100
    : ((state.userScore - levelInfo.currentMin) / (levelInfo.nextMin - levelInfo.currentMin)) * 100;
  const pointsToNext = levelInfo.nextMin - state.userScore;

  // Generate calendar days for streak visualization
  const generateCalendarDays = () => {
    const days = [];
    const today = new Date();
    
    for (let i = 27; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const isActive = i < state.userStreak;
      days.push({
        date: date.getDate(),
        isActive,
        isToday: i === 0,
      });
    }
    
    return days;
  };

  const calendarDays = generateCalendarDays();

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);
    
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  const getActivityIcon = (type: Activity['type']) => {
    switch (type) {
      case 'quiz':
        return <Target className="w-4 h-4 text-purple-400" />;
      case 'streak':
        return <Flame className="w-4 h-4 text-orange-400" />;
      case 'badge':
        return <Award className="w-4 h-4 text-yellow-400" />;
      case 'post':
        return <MessageCircle className="w-4 h-4 text-blue-400" />;
      default:
        return <ActivityIcon className="w-4 h-4 text-gray-400" />;
    }
  };

  // Get earned badges for profile card
  const earnedBadges = state.earnedBadges.filter(b => b.earned);
  
  // Format profile as text for sharing
  const getProfileShareText = () => {
    const badgeEmojis = earnedBadges.map(b => b.icon).join(' ');
    return `🏆 My CommunityPulse Stats
──────────────────────
👤 Alex K. | Level: ${state.currentLevel}
⚡ Score: ${state.userScore.toLocaleString()} pts
🔥 Streak: ${state.userStreak} days
🏅 Rank: #4
🎖️ Badges: ${badgeEmojis || 'None yet'}
──────────────────────
Join at communitypulse.app`;
  };

  // Copy profile as text
  const handleCopyProfile = () => {
    navigator.clipboard.writeText(getProfileShareText());
    showToast('Profile copied to clipboard!', 'success');
  };

  // Download profile card as image
  const handleDownloadCard = async () => {
    if (!profileCardRef.current) return;

    try {
      // Dynamic import for html2canvas
      const html2canvas = (await import('html2canvas')).default;
      
      const canvas = await html2canvas(profileCardRef.current, {
        backgroundColor: '#0f0f0f',
        scale: 2,
      });
      
      const link = document.createElement('a');
      link.download = 'communitypulse-profile.png';
      link.href = canvas.toDataURL('image/png');
      link.click();
      
      showToast('Profile card downloaded!', 'success');
    } catch (error) {
      console.error('Download error:', error);
      showToast('Failed to download. Make sure html2canvas is installed: npm install html2canvas', 'error');
    }
  };

  return (
    <div className="min-h-[calc(100vh-80px)] p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        {/* Profile Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-card rounded-xl border border-border p-6 mb-6"
        >
          <div className="flex flex-col md:flex-row items-center gap-6">
            {/* Avatar */}
            <div className="relative">
              <img
                src="https://api.dicebear.com/7.x/avataaars/svg?seed=Alex"
                alt="Profile"
                className="w-24 h-24 rounded-full border-4 border-purple-500"
              />
              <div className="absolute -bottom-1 -right-1 bg-purple-500 rounded-full px-2 py-0.5 text-xs font-bold">
                {state.currentLevel}
              </div>
            </div>
            
            {/* User Info */}
            <div className="text-center md:text-left flex-1">
              <h1 className="text-2xl font-bold text-white mb-1">Alex K.</h1>
              <p className="text-muted-foreground text-sm mb-2">
                Member since {new Date(state.memberSince).toLocaleDateString('en-US', { 
                  month: 'long', 
                  year: 'numeric' 
                })}
              </p>
              <div className="flex flex-wrap justify-center md:justify-start gap-2">
                <span className="px-3 py-1 bg-purple-500/20 text-purple-400 rounded-full text-sm flex items-center gap-1">
                  <Trophy className="w-4 h-4" />
                  #{4} on Leaderboard
                </span>
                <span className="px-3 py-1 bg-orange-500/20 text-orange-400 rounded-full text-sm flex items-center gap-1">
                  <Flame className="w-4 h-4" />
                  {state.userStreak}-day streak
                </span>
              </div>
            </div>
            
            {/* Score */}
            <div className="text-center">
              <motion.p
                className="text-5xl font-bold gradient-text"
                animate={{ scale: [1, 1.05, 1] }}
                transition={{ duration: 0.5, repeat: Infinity, repeatDelay: 5 }}
              >
                {animatedScore.toLocaleString()}
              </motion.p>
              <p className="text-muted-foreground text-sm">Total Points</p>
            </div>
          </div>
        </motion.div>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Streak Calendar */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-card rounded-xl border border-border p-6"
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-white flex items-center gap-2">
                <Flame className="w-5 h-5 text-orange-400" />
                Streak Calendar
              </h2>
              <span className="text-orange-400 font-bold">{state.userStreak} days</span>
            </div>
            
            <div className="grid grid-cols-7 gap-1 mb-2">
              {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, idx) => (
                <div key={idx} className="text-center text-xs text-muted-foreground py-1">
                  {day}
                </div>
              ))}
            </div>
            
            <div className="grid grid-cols-7 gap-1">
              {calendarDays.map((day, idx) => (
                <motion.div
                  key={idx}
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: idx * 0.02 }}
                  className={`aspect-square rounded-md flex items-center justify-center text-xs ${
                    day.isToday
                      ? 'bg-purple-500 text-white font-bold ring-2 ring-purple-400 ring-offset-2 ring-offset-card'
                      : day.isActive
                        ? 'bg-orange-500/40 text-orange-200'
                        : 'bg-secondary text-muted-foreground'
                  }`}
                >
                  {day.date}
                </motion.div>
              ))}
            </div>
            
            <p className="text-sm text-muted-foreground mt-4 text-center">
              Keep your streak alive! Come back daily.
            </p>
          </motion.div>

          {/* Level Progress */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-card rounded-xl border border-border p-6"
          >
            <h2 className="font-semibold text-white flex items-center gap-2 mb-4">
              <Zap className="w-5 h-5 text-yellow-400" />
              Level Progress
            </h2>
            
            <div className="mb-4">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm text-muted-foreground">Current Level</span>
                <span className="text-sm font-bold text-purple-400">{state.currentLevel}</span>
              </div>
              <div className="h-3 bg-secondary rounded-full overflow-hidden">
                <motion.div
                  className="h-full progress-bar-animated"
                  initial={{ width: 0 }}
                  animate={{ width: `${Math.min(progressPercent, 100)}%` }}
                  transition={{ duration: 1, delay: 0.5 }}
                />
              </div>
              <div className="flex justify-between items-center mt-2">
                <span className="text-xs text-muted-foreground">{state.userScore} pts</span>
                <span className="text-xs text-muted-foreground">{levelInfo.nextMin} pts</span>
              </div>
            </div>
            
            {pointsToNext > 0 && (
              <div className="bg-purple-500/10 rounded-lg p-4 text-center">
                <p className="text-sm text-muted-foreground">Points to reach</p>
                <p className="text-2xl font-bold text-purple-400">{levelInfo.nextLevel}</p>
                <p className="text-3xl font-bold text-white">{pointsToNext}</p>
              </div>
            )}
            
            {pointsToNext <= 0 && (
              <div className="bg-yellow-500/10 rounded-lg p-4 text-center">
                <p className="text-yellow-400 font-semibold">🏆 Max Level Achieved!</p>
              </div>
            )}
          </motion.div>
        </div>

        {/* Platform Activity */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-card rounded-xl border border-border p-6 mt-6"
        >
          <h2 className="font-semibold text-white flex items-center gap-2 mb-4">
            <Users className="w-5 h-5 text-blue-400" />
            Platform Activity
          </h2>
          
          <div className="space-y-4">
            {platformActivity.map((platform, idx) => (
              <div key={idx}>
                <div className="flex justify-between items-center mb-1">
                  <span className="text-sm text-muted-foreground flex items-center gap-2">
                    <span>{platform.icon}</span>
                    {platform.name}
                  </span>
                  <span className="text-sm font-medium text-white">{platform.percentage}%</span>
                </div>
                <div className="h-2 bg-secondary rounded-full overflow-hidden">
                  <motion.div
                    className={`h-full ${platform.color}`}
                    initial={{ width: 0 }}
                    animate={{ width: `${platform.percentage}%` }}
                    transition={{ duration: 1, delay: 0.5 + idx * 0.1 }}
                  />
                </div>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Badges */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-card rounded-xl border border-border p-6 mt-6"
        >
          <h2 className="font-semibold text-white flex items-center gap-2 mb-4">
            <Award className="w-5 h-5 text-yellow-400" />
            Badges
          </h2>
          
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {state.earnedBadges.map((badge, idx) => (
              <motion.div
                key={badge.id}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.5 + idx * 0.05 }}
                className={`relative p-4 rounded-xl text-center ${
                  badge.earned
                    ? 'bg-gradient-to-br from-purple-500/20 to-blue-500/20 border border-purple-500/30'
                    : 'bg-secondary border border-border opacity-50'
                }`}
              >
                {!badge.earned && (
                  <div className="absolute inset-0 flex items-center justify-center bg-card/50 rounded-xl">
                    <Lock className="w-6 h-6 text-muted-foreground" />
                  </div>
                )}
                <span className="text-3xl mb-2 block">{badge.icon}</span>
                <p className="text-sm font-medium text-white">{badge.name}</p>
                <p className="text-xs text-muted-foreground mt-1">{badge.description}</p>
                {badge.earned && badge.earnedAt && (
                  <p className="text-xs text-purple-400 mt-2 flex items-center justify-center gap-1">
                    <CheckCircle className="w-3 h-3" />
                    Earned
                  </p>
                )}
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Shareable Profile Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="bg-card rounded-xl border border-border p-6 mt-6"
        >
          <h2 className="font-semibold text-white flex items-center gap-2 mb-4">
            <Share2 className="w-5 h-5 text-purple-400" />
            Your Profile Card
          </h2>

          {/* Profile Card - Shareable Image */}
          <div 
            ref={profileCardRef}
            className="bg-[#0f0f0f] rounded-2xl p-6 border-2 border-purple-500/50 mb-4"
          >
            {/* Header */}
            <div className="flex items-center gap-2 mb-4">
              <Trophy className="w-5 h-5 text-purple-400" />
              <span className="text-lg font-bold text-white">CommunityPulse</span>
            </div>

            {/* Main Content */}
            <div className="flex items-center gap-4 mb-4">
              <img
                src="https://api.dicebear.com/7.x/avataaars/svg?seed=Alex"
                alt="Profile"
                className="w-16 h-16 rounded-full border-2 border-purple-500"
              />
              <div>
                <p className="text-xl font-bold text-white">Alex K.</p>
                <div className="flex items-center gap-2 text-sm">
                  <span className="text-purple-400 font-medium">{state.currentLevel}</span>
                  <span className="text-orange-400">🔥 {state.userStreak} days</span>
                </div>
              </div>
            </div>

            {/* Stats */}
            <div className="flex items-center gap-4 mb-4 py-3 border-y border-purple-500/20">
              <div className="flex items-center gap-2">
                <span className="text-lg">⚡</span>
                <span className="text-white font-bold">{state.userScore.toLocaleString()}</span>
                <span className="text-gray-400 text-sm">pts</span>
              </div>
              <div className="w-px h-4 bg-purple-500/30" />
              <div className="flex items-center gap-2">
                <span className="text-lg">🏅</span>
                <span className="text-white font-bold">#4</span>
                <span className="text-gray-400 text-sm">ranked</span>
              </div>
            </div>

            {/* Badges Row */}
            <div className="grid grid-cols-4 gap-2">
              {earnedBadges.slice(0, 4).map(badge => (
                <div key={badge.id} className="text-center p-2 bg-purple-500/10 rounded-lg">
                  <span className="text-xl">{badge.icon}</span>
                  <p className="text-xs text-gray-300 mt-1 truncate">{badge.name}</p>
                </div>
              ))}
              {earnedBadges.length === 0 && (
                <div className="col-span-4 text-center py-4 text-gray-400 text-sm">
                  Complete quizzes to earn badges!
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="mt-4 pt-3 border-t border-purple-500/20 text-center">
              <span className="text-gray-500 text-sm">communitypulse.app</span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3">
            <button
              onClick={handleCopyProfile}
              className="flex-1 flex items-center justify-center gap-2 py-3 bg-secondary rounded-lg hover:bg-secondary/80 transition-colors"
            >
              <Copy className="w-4 h-4" />
              Copy as Text
            </button>
            <button
              onClick={handleDownloadCard}
              className="flex-1 flex items-center justify-center gap-2 py-3 bg-purple-500 rounded-lg hover:bg-purple-600 transition-colors"
            >
              <Download className="w-4 h-4" />
              Download as Image
            </button>
          </div>
          <p className="text-xs text-muted-foreground text-center mt-3">
            Share your profile card on Instagram, WhatsApp status, and more!
          </p>
        </motion.div>

        {/* Recent Activity */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="bg-card rounded-xl border border-border p-6 mt-6"
        >
          <h2 className="font-semibold text-white flex items-center gap-2 mb-4">
            <ActivityIcon className="w-5 h-5 text-green-400" />
            Recent Activity
          </h2>
          
          <div className="space-y-3">
            {state.activities.slice(0, 5).map((activity, idx) => (
              <motion.div
                key={activity.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.7 + idx * 0.05 }}
                className="flex items-center gap-4 p-3 bg-secondary rounded-lg"
              >
                <div className="w-10 h-10 rounded-full bg-card flex items-center justify-center">
                  {getActivityIcon(activity.type)}
                </div>
                <div className="flex-1">
                  <p className="text-sm text-white">{activity.description}</p>
                  <p className="text-xs text-muted-foreground">{formatDate(activity.timestamp)}</p>
                </div>
                {activity.points && (
                  <span className="text-sm font-bold text-green-400">+{activity.points}</span>
                )}
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
