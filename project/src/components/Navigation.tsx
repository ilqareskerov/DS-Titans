'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Zap, Settings, ExternalLink, MessageCircle, BarChart3, Users } from 'lucide-react';

export default function Navigation() {
  return (
    <nav className="sticky top-0 z-40 bg-background/80 backdrop-blur-lg border-b border-border">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <motion.div
            whileHover={{ scale: 1.02 }}
            className="flex items-center gap-3"
          >
            <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center">
              <Zap className="w-5 h-5 text-white" />
            </div>
            <div>
              <span className="text-lg font-bold text-white">CommunityPulse</span>
              <span className="text-purple-400 ml-1">⚡</span>
              <span className="ml-2 text-xs px-2 py-0.5 bg-purple-500/20 text-purple-400 rounded-full">
                Admin
              </span>
            </div>
          </motion.div>

          {/* Right Side - Quick Links */}
          <div className="flex items-center gap-3">
            {/* Platform Status */}
            <div className="hidden md:flex items-center gap-2 px-3 py-1.5 bg-secondary rounded-lg">
              <span className="text-sm text-muted-foreground">Platforms:</span>
              <span className="flex items-center gap-1 text-sm">
                <span>✈️</span>
                <span className="text-green-400">●</span>
              </span>
              <span className="flex items-center gap-1 text-sm">
                <span>💬</span>
                <span className="text-green-400">●</span>
              </span>
              <span className="flex items-center gap-1 text-sm">
                <span>📱</span>
                <span className="text-muted-400">●</span>
              </span>
            </div>

            {/* Docs/Help */}
            <a
              href="https://github.com/communitypulse/docs"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-3 py-2 text-sm text-muted-foreground hover:text-white transition-colors"
            >
              <ExternalLink className="w-4 h-4" />
              <span className="hidden sm:inline">Docs</span>
            </a>
          </div>
        </div>
      </div>
    </nav>
  );
}
