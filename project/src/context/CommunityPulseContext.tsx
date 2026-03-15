'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

// Types
export interface Badge {
  id: string;
  name: string;
  icon: string;
  description: string;
  earned: boolean;
  earnedAt?: string;
}

export interface ScheduledPost {
  id: string;
  content: string;
  type: 'post' | 'quiz' | 'image';
  scheduledTime: string;
  createdAt: string;
}

export interface Activity {
  id: string;
  type: 'quiz' | 'streak' | 'badge' | 'post';
  description: string;
  points?: number;
  timestamp: string;
}

export interface QuizQuestion {
  question: string;
  options: string[];
  answer: string;
  explanation: string;
}

export interface Quiz {
  id: string;
  questions: QuizQuestion[];
  createdAt: string;
}

export interface AppState {
  userScore: number;
  userStreak: number;
  lastActiveDate: string;
  earnedBadges: Badge[];
  scheduledPosts: ScheduledPost[];
  currentQuiz: Quiz | null;
  activities: Activity[];
  currentLevel: string;
  memberSince: string;
}

// Default badges
const defaultBadges: Badge[] = [
  { id: 'first-step', name: 'First Step', icon: '🎯', description: 'Complete your first quiz', earned: false },
  { id: 'show-up', name: 'Show Up', icon: '✨', description: 'Log in for the first time', earned: true, earnedAt: new Date().toISOString() },
  { id: 'streak-7', name: '7-Day Streak', icon: '🔥', description: 'Maintain a 7-day streak', earned: false },
  { id: 'quiz-master', name: 'Quiz Master', icon: '🧠', description: 'Score 100% on a quiz', earned: false },
  { id: 'top-10', name: 'Top 10', icon: '🏆', description: 'Reach the top 10 leaderboard', earned: false },
  { id: 'helpful', name: 'Helpful', icon: '💡', description: 'Help 5 community members', earned: false },
  { id: 'recruiter', name: 'Recruiter', icon: '👋', description: 'Invite 3 friends', earned: false },
  { id: 'og-member', name: 'OG Member', icon: '⭐', description: 'Be a member for 30 days', earned: false },
];

// Default activities
const defaultActivities: Activity[] = [
  { id: '1', type: 'badge', description: 'Earned "Show Up" badge', timestamp: new Date().toISOString() },
  { id: '2', type: 'quiz', description: 'Completed daily quiz', points: 300, timestamp: new Date(Date.now() - 86400000).toISOString() },
  { id: '3', type: 'streak', description: 'Started a streak!', timestamp: new Date(Date.now() - 86400000 * 2).toISOString() },
];

// Calculate level based on score
function calculateLevel(score: number): string {
  if (score >= 5000) return 'Legend';
  if (score >= 3000) return 'Champion';
  if (score >= 2000) return 'Expert';
  if (score >= 1000) return 'Regular';
  if (score >= 500) return 'Contributor';
  if (score >= 100) return 'Member';
  return 'Newcomer';
}

// Initial state
const initialState: AppState = {
  userScore: 1650,
  userStreak: 12,
  lastActiveDate: new Date().toISOString().split('T')[0],
  earnedBadges: defaultBadges,
  scheduledPosts: [],
  currentQuiz: null,
  activities: defaultActivities,
  currentLevel: 'Regular',
  memberSince: new Date(Date.now() - 30 * 86400000).toISOString(),
};

// Context
interface CommunityPulseContextType {
  state: AppState;
  addScore: (points: number) => void;
  incrementStreak: () => void;
  addBadge: (badgeId: string) => void;
  schedulePost: (post: Omit<ScheduledPost, 'id' | 'createdAt'>) => void;
  setCurrentQuiz: (quiz: Quiz | null) => void;
  addActivity: (activity: Omit<Activity, 'id' | 'timestamp'>) => void;
  resetState: () => void;
}

const CommunityPulseContext = createContext<CommunityPulseContextType | undefined>(undefined);

// Local storage key
const STORAGE_KEY = 'communitypulse-state';

// Provider
export function CommunityPulseProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AppState>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          return {
            ...initialState,
            ...parsed,
            currentLevel: calculateLevel(parsed.userScore || initialState.userScore),
          };
        } catch {
          return initialState;
        }
      }
    }
    return initialState;
  });

  // Persist to localStorage
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }, [state]);

  const addScore = (points: number) => {
    setState(prev => {
      const newScore = prev.userScore + points;
      return {
        ...prev,
        userScore: newScore,
        currentLevel: calculateLevel(newScore),
      };
    });
  };

  const incrementStreak = () => {
    setState(prev => {
      const newStreak = prev.userStreak + 1;
      const newBadges = [...prev.earnedBadges];
      const streak7Badge = newBadges.find(b => b.id === 'streak-7');
      if (streak7Badge && newStreak >= 7 && !streak7Badge.earned) {
        streak7Badge.earned = true;
        streak7Badge.earnedAt = new Date().toISOString();
      }
      return { ...prev, userStreak: newStreak, earnedBadges: newBadges };
    });
  };

  const addBadge = (badgeId: string) => {
    setState(prev => {
      const newBadges = prev.earnedBadges.map(badge =>
        badge.id === badgeId && !badge.earned
          ? { ...badge, earned: true, earnedAt: new Date().toISOString() }
          : badge
      );
      return { ...prev, earnedBadges: newBadges };
    });
  };

  const schedulePost = (post: Omit<ScheduledPost, 'id' | 'createdAt'>) => {
    setState(prev => ({
      ...prev,
      scheduledPosts: [
        ...prev.scheduledPosts,
        {
          ...post,
          id: `post-${Date.now()}`,
          createdAt: new Date().toISOString(),
        },
      ],
    }));
  };

  const setCurrentQuiz = (quiz: Quiz | null) => {
    setState(prev => ({ ...prev, currentQuiz: quiz }));
  };

  const addActivity = (activity: Omit<Activity, 'id' | 'timestamp'>) => {
    setState(prev => ({
      ...prev,
      activities: [
        {
          ...activity,
          id: `activity-${Date.now()}`,
          timestamp: new Date().toISOString(),
        },
        ...prev.activities,
      ].slice(0, 20), // Keep last 20 activities
    }));
  };

  const resetState = () => {
    setState(initialState);
    localStorage.removeItem(STORAGE_KEY);
  };

  return (
    <CommunityPulseContext.Provider
      value={{
        state,
        addScore,
        incrementStreak,
        addBadge,
        schedulePost,
        setCurrentQuiz,
        addActivity,
        resetState,
      }}
    >
      {children}
    </CommunityPulseContext.Provider>
  );
}

// Hook
export function useCommunityPulse() {
  const context = useContext(CommunityPulseContext);
  if (context === undefined) {
    throw new Error('useCommunityPulse must be used within a CommunityPulseProvider');
  }
  return context;
}
