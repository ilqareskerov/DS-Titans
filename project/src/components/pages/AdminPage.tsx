'use client';

import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Send, 
  Copy, 
  Clock, 
  Calendar, 
  Sparkles, 
  FileQuestion, 
  TrendingUp,
  Loader2,
  Image as ImageIcon,
  CheckCircle,
  X,
  Share2,
  ExternalLink,
  Users,
  MessageCircle,
  Newspaper,
  BarChart3
} from 'lucide-react';
import { useToast } from '@/components/Toast';


const SYSTEM_PROMPT = `You are CommunityPulse Admin AI, an expert community manager assistant with four skills:

1. COPYWRITER: Write engaging social media posts, announcements, and captions for tech communities. When asked for a post, return it formatted and ready to copy.

2. QUIZ GENERATOR: Generate domain-specific quiz questions. When asked, return exactly 5 questions in this JSON format only:
{"questions":[{"question":"string","options":["A","B","C","D"],"answer":"A","explanation":"string"}]}

3. TREND ANALYST: Suggest post ideas based on trending tech topics. Return 5 bullet-point ideas with emojis, optimized for engagement.

4. EVENT PLANNER: Create events. When asked to plan an event, return this exact JSON format only:
{"event":{"title":"string","description":"string","event_date":"ISO8601 Date","location":"string","organizer":"string","event_url":"string","image_url":"string"}}

Always detect which skill is needed from context and respond accordingly.
If the admin asks for a quiz or event, ALWAYS return valid JSON only, no extra text.
If asked for an image, describe the image prompt clearly for image generation.`;

// Platform configuration
const PLATFORMS = [
  { id: 'telegram',  label: 'Telegram',  emoji: '✈️',  type: 'bot' },
  { id: 'discord',   label: 'Discord',   emoji: '💬',  type: 'bot' },
  { id: 'whatsapp',  label: 'WhatsApp',  emoji: '📱',  type: 'share' },
  { id: 'instagram', label: 'Instagram', emoji: '📸',  type: 'share' },
  { id: 'facebook',  label: 'Facebook',  emoji: '👤',  type: 'share' },
  { id: 'linkedin',  label: 'LinkedIn',  emoji: '💼',  type: 'share' },
  { id: 'twitter',   label: 'X/Twitter', emoji: '🐦',  type: 'share' },
] as const;

type PlatformId = typeof PLATFORMS[number]['id'];

interface Message {
  role: 'user' | 'assistant';
  content: string;
  type: 'text' | 'quiz' | 'post' | 'trends' | 'image' | 'event';
}

interface PlatformResult {
  success?: boolean;
  message?: string;
  error?: string;
}

// Helper function to format quiz as readable text for sharing
function formatQuizAsText(quiz: { questions: any[] }): string {
  let text = '🧠 Daily Quiz!\n\n';
  
  quiz.questions.forEach((q, i) => {
    text += `Q${i + 1}: ${q.question}\n`;
    q.options.forEach((opt: string, j: number) => {
      text += `${String.fromCharCode(65 + j)}. ${opt}  `;
    });
    text += '\n\n';
  });
  
  text += 'Answer in the community! 💪\n#CommunityPulse #DailyQuiz';
  return text;
}

// Helper function to get share URL for each platform
function getShareUrl(platform: PlatformId, text: string): string | null {
  const encodedText = encodeURIComponent(text);
  const baseUrl = 'https://communitypulse.app';
  
  switch (platform) {
    case 'whatsapp':
      return `https://wa.me/?text=${encodedText}`;
    case 'facebook':
      return `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(baseUrl)}&quote=${encodedText}`;
    case 'linkedin':
      return `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(baseUrl)}&summary=${encodedText}`;
    case 'twitter':
      return `https://twitter.com/intent/tweet?text=${encodedText}`;
    default:
      return null;
  }
}

export default function AdminPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [previewContent, setPreviewContent] = useState<{
    type: 'quiz' | 'post' | 'image' | 'event' | null;
    content: any;
  }>({ type: null, content: null });
  const [scheduledTime, setScheduledTime] = useState('');
  const [copied, setCopied] = useState(false);
  
  // Platform sharing state
  const [selectedBotPlatforms, setSelectedBotPlatforms] = useState<PlatformId[]>([]);
  const [selectedSharePlatforms, setSelectedSharePlatforms] = useState<PlatformId[]>([]);
  const [isSending, setIsSending] = useState(false);
  const [platformResults, setPlatformResults] = useState<Record<string, PlatformResult>>({});
  const [showInstagramTooltip, setShowInstagramTooltip] = useState(false);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { showToast } = useToast();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const detectContentType = (content: string): 'quiz' | 'post' | 'image' | 'trends' | 'event' | 'text' => {
    try {
      const parsed = JSON.parse(content);
      if (parsed.questions && Array.isArray(parsed.questions)) {
        return 'quiz';
      }
      if (parsed.event && parsed.event.title) {
        return 'event';
      }
    } catch {
      // Not JSON
    }
    
    if (content.includes('image:') || content.includes('generate image') || content.includes('visual:')) {
      return 'image';
    }
    
    if (content.includes('•') || content.includes('- ') && content.split('\n').filter(l => l.startsWith('- ') || l.startsWith('• ')).length >= 3) {
      return 'trends';
    }
    
    if (content.length > 100 && !content.includes(':')) {
      return 'post';
    }
    
    return 'text';
  };

  const callAIAPI = async (userMessage: string) => {
    setIsLoading(true);
    
    try {
      const response = await fetch('/api/ai', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          systemPrompt: SYSTEM_PROMPT,
          messages: [
            ...messages.map(m => ({
              role: m.role,
              content: m.content,
            })),
            {
              role: 'user',
              content: userMessage,
            },
          ],
        }),
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || `API error: ${response.status}`);
      }
      
      const assistantContent = data.text;
      const type = detectContentType(assistantContent);
      
      const newMessage: Message = {
        role: 'assistant',
        content: assistantContent,
        type: type,
      };
      
      setMessages(prev => [...prev, { role: 'user', content: userMessage, type: 'text' }, newMessage]);
      
      // Update preview
      if (type === 'quiz') {
        try {
          const quiz = JSON.parse(assistantContent);
          setPreviewContent({ type: 'quiz', content: quiz });
        } catch {
          setPreviewContent({ type: 'post', content: assistantContent });
        }
      } else if (type === 'event') {
        try {
          const evt = JSON.parse(assistantContent);
          setPreviewContent({ type: 'event', content: evt.event });
        } catch {
          setPreviewContent({ type: 'post', content: assistantContent });
        }
      } else if (type === 'image') {
        const promptMatch = assistantContent.match(/image:\s*(.+)/i) || 
                           assistantContent.match(/generate.*?image.*?:\s*(.+)/i) ||
                           assistantContent.match(/visual:\s*(.+)/i);
        const prompt = promptMatch ? promptMatch[1] : assistantContent;
        setPreviewContent({ type: 'image', content: prompt });
      } else {
        setPreviewContent({ type: 'post', content: assistantContent });
      }
      
    } catch (error) {
      console.error('AI API error:', error);
      
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      
      // Simulate response for demo purposes when API is not available
      const demoResponse = generateDemoResponse(userMessage);
      const type = detectContentType(demoResponse);
      
      setMessages(prev => [
        ...prev, 
        { role: 'user', content: userMessage, type: 'text' },
        { role: 'assistant', content: demoResponse, type }
      ]);
      
      if (type === 'quiz') {
        try {
          const quiz = JSON.parse(demoResponse);
          setPreviewContent({ type: 'quiz', content: quiz });
        } catch {
          setPreviewContent({ type: 'post', content: demoResponse });
        }
      } else if (type === 'event') {
        try {
          const evt = JSON.parse(demoResponse);
          setPreviewContent({ type: 'event', content: evt.event });
        } catch {
          setPreviewContent({ type: 'post', content: demoResponse });
        }
      } else {
        setPreviewContent({ type: 'post', content: demoResponse });
      }
      
      showToast(`AI Error: ${errorMessage}. Using demo data.`, 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const generateDemoResponse = (userMessage: string): string => {
    const lowerMessage = userMessage.toLowerCase();
    
    if (lowerMessage.includes('quiz')) {
      return JSON.stringify({
        questions: [
          {
            question: "What is the correct way to create a React functional component?",
            options: ["function Component() {}", "const Component = () => {}", "class Component extends React.Component", "Both A and B are correct"],
            answer: "D",
            explanation: "React functional components can be created using either a function declaration or an arrow function expression."
          },
          {
            question: "Which hook is used for side effects in React?",
            options: ["useState", "useEffect", "useContext", "useReducer"],
            answer: "B",
            explanation: "useEffect is the hook designed for handling side effects like API calls, subscriptions, or DOM manipulations."
          },
          {
            question: "What does JSX compile to?",
            options: ["HTML", "React.createElement() calls", "Virtual DOM nodes", "JavaScript objects"],
            answer: "B",
            explanation: "JSX is syntactic sugar that compiles to React.createElement() function calls."
          },
          {
            question: "How do you pass data from parent to child component?",
            options: ["State", "Props", "Context", "Redux"],
            answer: "B",
            explanation: "Props (properties) are the primary way to pass data from parent to child components in React."
          },
          {
            question: "What is the purpose of the key prop in React lists?",
            options: ["Styling list items", "Identifying list items for reconciliation", "Sorting list items", "Filtering list items"],
            answer: "B",
            explanation: "Keys help React identify which items have changed, added, or removed, enabling efficient updates."
          }
        ]
      });
    }
    
    if (lowerMessage.includes('event')) {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      return JSON.stringify({
        event: {
          title: "AI in Production Workshop",
          description: "Join us for a hands-on workshop building GenAI apps.",
          event_date: tomorrow.toISOString(),
          location: "TechHub Discord Voice 1",
          organizer: "CommunityPulse Admin",
          event_url: "https://communitypulse.app/events",
          image_url: "https://cdn.discordapp.com/embed/avatars/0.png"
        }
      });
    }
    
    if (lowerMessage.includes('post') || lowerMessage.includes('announcement')) {
      return `🚀 Exciting News from Our Community!

We're thrilled to announce the launch of our new weekly challenges! 

🎯 Each week, we'll release a new coding challenge designed to test and improve your skills.

✨ What's in it for you?
• Earn points and climb the leaderboard
• Unlock exclusive badges
• Connect with fellow developers
• Win amazing prizes!

Ready to level up your skills? Join us every Monday for a new challenge! 

#CommunityGrowth #DeveloperLife #LevelUp`;
    }
    
    if (lowerMessage.includes('trend') || lowerMessage.includes('idea')) {
      return `🔥 Trending Tech Topics This Week:

• 🤖 AI-Powered Development Tools - How Copilot and Cursor are changing how we code
• 🌐 WebGPU - The future of web graphics and compute
• ⚡ Bun vs Node.js - The runtime wars heat up
• 🎨 Framer Motion 11 - New animations for modern web apps
• 🔐 Zero-Knowledge Proofs - Privacy-first authentication

💡 Engagement Tip: Create polls around these topics and ask for community experiences!`;
    }
    
    if (lowerMessage.includes('image')) {
      return `Image: A vibrant tech community gathering with developers collaborating around holographic displays, futuristic workspace with purple and blue neon accents`;
    }
    
    return `I can help you with:
1. Creating social media posts - just ask me to "write a post about [topic]"
2. Generating quiz questions - ask me to "create a quiz about [topic]"
3. Trending topic analysis - ask me for "trending ideas"
4. Image generation - ask me to "generate an image of [description]"
5. Event Planning - ask me to "create an event for [topic]"

What would you like me to help you with?`;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;
    
    callAIAPI(input.trim());
    setInput('');
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    showToast('Copied to clipboard!', 'success');
  };

  const handleSchedule = () => {
    if (!scheduledTime) {
      showToast('Please select a schedule time', 'error');
      return;
    }
    
    showToast('Content scheduled successfully!', 'success');
    setScheduledTime('');
  };

  // Platform toggle handlers
  const toggleBotPlatform = (platformId: PlatformId) => {
    setSelectedBotPlatforms(prev => 
      prev.includes(platformId)
        ? prev.filter(p => p !== platformId)
        : [...prev, platformId]
    );
  };

  const toggleSharePlatform = (platformId: PlatformId) => {
    setSelectedSharePlatforms(prev => 
      prev.includes(platformId)
        ? prev.filter(p => p !== platformId)
        : [...prev, platformId]
    );
  };

  // Get post text for sharing
  const getPostText = (): string => {
    if (previewContent.type === 'quiz' && previewContent.content) {
      return formatQuizAsText(previewContent.content);
    }
    if (previewContent.type === 'event' && previewContent.content) {
      const evt = previewContent.content;
      return `🚀 **${evt.title}**\n\n${evt.description}\n\n📅 Date: ${new Date(evt.event_date).toLocaleString()}\n📍 Location: ${evt.location}\n\n🔗 ${evt.event_url || ''}`;
    }
    return previewContent.content || '';
  };

  // Send to bot platforms (Telegram, Discord)
  const handleSendToBots = async () => {
    if (selectedBotPlatforms.length === 0) {
      showToast('Please select at least one platform', 'error');
      return;
    }

    setIsSending(true);
    setPlatformResults({});

    try {
      const response = await fetch('/api/send-quiz', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          quiz: previewContent.type === 'quiz' ? previewContent.content : undefined,
          event: previewContent.type === 'event' ? previewContent.content : undefined,
          platforms: selectedBotPlatforms,
          postText: getPostText(),
        }),
      });

      const data = await response.json();
      setPlatformResults(data.results || {});

      // Show summary toast
      const successCount = Object.values(data.results || {}).filter((r: any) => r.success).length;
      const errorCount = Object.values(data.results || {}).filter((r: any) => r.error).length;

      if (successCount > 0) {
        showToast(`Sent to ${successCount} platform(s)!`, 'success');
      }
      if (errorCount > 0) {
        showToast(`${errorCount} platform(s) failed`, 'error');
      }
    } catch (error) {
      console.error('Send error:', error);
      showToast('Failed to send content', 'error');
    } finally {
      setIsSending(false);
    }
  };

  // Open share links for social platforms
  const handleOpenShareLinks = () => {
    if (selectedSharePlatforms.length === 0) {
      showToast('Please select at least one platform', 'error');
      return;
    }

    const postText = getPostText();
    let hasInstagram = false;

    selectedSharePlatforms.forEach(platform => {
      if (platform === 'instagram') {
        hasInstagram = true;
        return; // Handle Instagram separately
      }

      const shareUrl = getShareUrl(platform, postText);
      if (shareUrl) {
        window.open(shareUrl, '_blank');
      }
    });

    if (hasInstagram) {
      setShowInstagramTooltip(true);
    }
  };

  const quickActions = [
    { icon: FileQuestion, label: 'Generate Quiz', prompt: 'Create a quiz about React and JavaScript fundamentals' },
    { icon: Calendar, label: 'Plan Event', prompt: 'Create an event for an upcoming AI Hackathon next weekend' },
    { icon: Sparkles, label: 'Write Post', prompt: 'Write an engaging social media post about our community event' },
    { icon: TrendingUp, label: 'Trending Topics', prompt: 'What are the trending tech topics this week?' },
    { icon: ImageIcon, label: 'Generate Image', prompt: 'Generate an image for a tech community banner' },
  ];

  const botPlatforms = PLATFORMS.filter(p => p.type === 'bot');
  const sharePlatforms = PLATFORMS.filter(p => p.type === 'share');

  return (
    <div className="h-[calc(100vh-80px)] flex flex-col lg:flex-row gap-4 p-4">
      {/* Left Panel - Chat */}
      <div className="flex-1 flex flex-col bg-card rounded-xl border border-border overflow-hidden">
        {/* Chat Header */}
        <div className="p-4 border-b border-border flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-purple-500/20 flex items-center justify-center">
            <Sparkles className="w-5 h-5 text-purple-400" />
          </div>
          <div>
            <h2 className="font-semibold text-white">Admin AI Assistant</h2>
            <p className="text-xs text-muted-foreground">Powered by Groq</p>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="p-3 border-b border-border flex gap-2 overflow-x-auto">
          {quickActions.map((action, idx) => (
            <button
              key={idx}
              onClick={() => setInput(action.prompt)}
              className="flex items-center gap-2 px-3 py-2 bg-secondary rounded-lg text-sm whitespace-nowrap hover:bg-secondary/80 transition-colors"
            >
              <action.icon className="w-4 h-4 text-purple-400" />
              {action.label}
            </button>
          ))}
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.length === 0 && (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <Sparkles className="w-12 h-12 text-purple-400 mb-4 animate-pulse" />
              <h3 className="text-lg font-semibold mb-2">Admin AI Assistant</h3>
              <p className="text-muted-foreground text-sm max-w-md">
                Create posts, generate quizzes, and share content to your community platforms.
              </p>
            </div>
          )}
          
          {messages.map((message, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[80%] rounded-xl px-4 py-3 ${
                  message.role === 'user'
                    ? 'bg-purple-500 text-white'
                    : 'bg-secondary text-white'
                }`}
              >
                {message.type === 'quiz' && message.role === 'assistant' ? (
                  <div className="font-mono text-xs whitespace-pre-wrap">
                    {message.content}
                  </div>
                ) : (
                  <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                )}
              </div>
            </motion.div>
          ))}
          
          {isLoading && (
            <div className="flex justify-start">
              <div className="bg-secondary rounded-xl px-4 py-3 flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin text-purple-400" />
                <span className="text-sm text-muted-foreground">Generating...</span>
              </div>
            </div>
          )}
          
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <form onSubmit={handleSubmit} className="p-4 border-t border-border">
          <div className="flex gap-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask me to create posts, quizzes, or analyze trends..."
              className="flex-1 bg-input border border-border rounded-lg px-4 py-3 text-white placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-purple-500"
              disabled={isLoading}
            />
            <button
              type="submit"
              disabled={isLoading || !input.trim()}
              className="px-4 py-3 bg-purple-500 rounded-lg hover:bg-purple-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <Send className="w-5 h-5" />
            </button>
          </div>
        </form>
      </div>

      {/* Right Panel - Preview & Sharing */}
      <div className="flex-1 flex flex-col bg-card rounded-xl border border-border overflow-hidden">
        {/* Preview Header */}
        <div className="p-4 border-b border-border flex items-center justify-between">
          <h2 className="font-semibold text-white flex items-center gap-2">
            <Newspaper className="w-5 h-5 text-purple-400" />
            Content Preview
          </h2>
          {previewContent.type && (
            <button
              onClick={() => setPreviewContent({ type: null, content: null })}
              className="text-muted-foreground hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Preview Content */}
        <div className="flex-1 overflow-y-auto p-4">
          {!previewContent.type && (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <div className="w-16 h-16 rounded-full bg-secondary flex items-center justify-center mb-4">
                <Copy className="w-8 h-8 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Preview Panel</h3>
              <p className="text-muted-foreground text-sm max-w-md">
                Generated content will appear here for preview and sharing to your community.
              </p>
            </div>
          )}

          {/* Quiz Preview */}
          {previewContent.type === 'quiz' && previewContent.content && (
            <div className="space-y-4">
              <div className="flex items-center justify-between mb-4">
                <span className="text-sm text-muted-foreground">
                  {previewContent.content.questions?.length || 0} questions generated
                </span>
                <button
                  onClick={() => handleCopy(JSON.stringify(previewContent.content, null, 2))}
                  className="text-sm text-purple-400 hover:text-purple-300 flex items-center gap-1"
                >
                  {copied ? <CheckCircle className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  {copied ? 'Copied!' : 'Copy JSON'}
                </button>
              </div>
              
              {previewContent.content.questions?.map((q: any, idx: number) => (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.1 }}
                  className="bg-secondary rounded-xl p-4 border border-border"
                >
                  <div className="flex items-start gap-3 mb-3">
                    <span className="w-6 h-6 rounded-full bg-purple-500/20 text-purple-400 text-xs flex items-center justify-center font-bold">
                      {idx + 1}
                    </span>
                    <p className="text-white font-medium flex-1">{q.question}</p>
                  </div>
                  <div className="grid grid-cols-2 gap-2 ml-9">
                    {q.options?.map((opt: string, optIdx: number) => (
                      <div
                        key={optIdx}
                        className={`px-3 py-2 rounded-lg text-sm ${
                          opt === q.answer
                            ? 'bg-green-500/20 border border-green-500/50 text-green-400'
                            : 'bg-input border border-border text-muted-foreground'
                        }`}
                      >
                        {String.fromCharCode(65 + optIdx)}. {opt}
                      </div>
                    ))}
                  </div>
                  {q.explanation && (
                    <p className="text-xs text-muted-foreground mt-3 ml-9 italic">
                      💡 {q.explanation}
                    </p>
                  )}
                </motion.div>
              ))}
            </div>
          )}

          {/* Event Preview */}
          {previewContent.type === 'event' && previewContent.content && (
            <div className="bg-gradient-to-br from-indigo-500/10 to-purple-500/10 rounded-xl p-6 border border-indigo-500/20">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-xl font-bold text-white mb-2">🚀 {previewContent.content.title}</h3>
                  <p className="text-muted-foreground whitespace-pre-wrap">{previewContent.content.description}</p>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4 mt-6">
                <div className="bg-secondary/50 rounded-lg p-3 border border-border">
                  <p className="text-xs text-muted-foreground mb-1 flex items-center gap-1"><Calendar className="w-3 h-3" /> Date & Time</p>
                  <p className="text-sm text-white font-medium">
                    {new Date(previewContent.content.event_date).toLocaleString()}
                  </p>
                </div>
                <div className="bg-secondary/50 rounded-lg p-3 border border-border">
                  <p className="text-xs text-muted-foreground mb-1">📍 Location</p>
                  <p className="text-sm text-white font-medium">{previewContent.content.location}</p>
                </div>
                {previewContent.content.organizer && (
                  <div className="bg-secondary/50 rounded-lg p-3 border border-border">
                    <p className="text-xs text-muted-foreground mb-1 flex items-center gap-1"><Users className="w-3 h-3" /> Organizer</p>
                    <p className="text-sm text-white font-medium">{previewContent.content.organizer}</p>
                  </div>
                )}
                {previewContent.content.event_url && (
                  <div className="bg-secondary/50 rounded-lg p-3 border border-border">
                    <p className="text-xs text-muted-foreground mb-1 flex items-center gap-1"><ExternalLink className="w-3 h-3" /> Link</p>
                    <a href={previewContent.content.event_url} className="text-sm text-blue-400 hover:underline truncate block">
                      {previewContent.content.event_url}
                    </a>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Post Preview */}
          {previewContent.type === 'post' && previewContent.content && (
            <div className="bg-gradient-to-br from-purple-500/10 to-blue-500/10 rounded-xl p-6 border border-purple-500/20">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-full bg-purple-500 flex items-center justify-center text-white font-bold">
                  CP
                </div>
                <div>
                  <p className="font-semibold text-white">CommunityPulse</p>
                  <p className="text-xs text-muted-foreground">Just now</p>
                </div>
              </div>
              <p className="text-white whitespace-pre-wrap mb-4">{previewContent.content}</p>
              <div className="flex items-center gap-4 text-muted-foreground text-sm border-t border-border pt-4">
                <span>💬 0 comments</span>
                <span>🔄 0 shares</span>
                <span>❤️ 0 likes</span>
              </div>
            </div>
          )}

          {/* Image Preview */}
          {previewContent.type === 'image' && previewContent.content && (
            <div className="space-y-4">
              <div className="relative aspect-video rounded-xl overflow-hidden bg-secondary">
                <img
                  src={`https://image.pollinations.ai/prompt/${encodeURIComponent(previewContent.content)}?width=600&height=400&nologo=true`}
                  alt="Generated image"
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="600" height="400"><rect fill="%231a1a1a" width="600" height="400"/><text x="50%" y="50%" fill="%23a0a0a0" font-family="sans-serif" font-size="16" text-anchor="middle">Failed to load image</text></svg>';
                  }}
                />
              </div>
              <p className="text-sm text-muted-foreground">
                <strong>Prompt:</strong> {previewContent.content}
              </p>
            </div>
          )}
        </div>

        {/* Send to Platforms Section */}
        {previewContent.type && (
          <div className="p-4 border-t border-border space-y-4">
            {/* GROUP 1: Bot Delivery */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <MessageCircle className="w-4 h-4 text-purple-400" />
                <span className="text-sm font-medium text-white">Bot Delivery</span>
                <span className="text-xs text-muted-foreground">(Users answer quizzes here)</span>
              </div>
              
              <div className="flex flex-wrap gap-2">
                {botPlatforms.map(platform => (
                  <button
                    key={platform.id}
                    onClick={() => toggleBotPlatform(platform.id)}
                    className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-all ${
                      selectedBotPlatforms.includes(platform.id)
                        ? 'bg-purple-500 text-white'
                        : 'bg-secondary text-muted-foreground hover:text-white'
                    }`}
                  >
                    <span>{platform.emoji}</span>
                    {platform.label}
                  </button>
                ))}
              </div>

              {/* Platform Results */}
              {Object.keys(platformResults).length > 0 && (
                <div className="space-y-2">
                  {Object.entries(platformResults).map(([platform, result]) => (
                    <div
                      key={platform}
                      className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm ${
                        result.success
                          ? 'bg-green-500/10 text-green-400'
                          : 'bg-red-500/10 text-red-400'
                      }`}
                    >
                      {result.success ? (
                        <CheckCircle className="w-4 h-4" />
                      ) : (
                        <X className="w-4 h-4" />
                      )}
                      {platform}: {result.success ? result.message : result.error}
                    </div>
                  ))}
                </div>
              )}

              <button
                onClick={handleSendToBots}
                disabled={selectedBotPlatforms.length === 0 || isSending}
                className="w-full py-3 bg-purple-500 rounded-lg hover:bg-purple-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2 font-medium"
              >
                {isSending ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Send className="w-4 h-4" />
                )}
                Send to Community
              </button>
            </div>

            {/* GROUP 2: Social Sharing */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Share2 className="w-4 h-4 text-blue-400" />
                <span className="text-sm font-medium text-white">Social Sharing</span>
              </div>
              
              <div className="flex flex-wrap gap-2">
                {sharePlatforms.map(platform => (
                  <button
                    key={platform.id}
                    onClick={() => toggleSharePlatform(platform.id)}
                    className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-all ${
                      selectedSharePlatforms.includes(platform.id)
                        ? 'bg-blue-500 text-white'
                        : 'bg-secondary text-muted-foreground hover:text-white'
                    }`}
                  >
                    <span>{platform.emoji}</span>
                    {platform.label}
                  </button>
                ))}
              </div>

              {/* Instagram Tooltip */}
              <AnimatePresence>
                {showInstagramTooltip && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    className="bg-secondary rounded-xl p-4 border border-border"
                  >
                    <div className="flex items-start gap-3">
                      <span className="text-2xl">📸</span>
                      <div className="flex-1">
                        <p className="text-sm text-white font-medium mb-2">Instagram doesn't support direct sharing</p>
                        <p className="text-xs text-muted-foreground mb-3">
                          Copy the text below and paste it manually into Instagram.
                        </p>
                        <div className="bg-input rounded-lg p-3 text-xs text-muted-foreground max-h-32 overflow-y-auto whitespace-pre-wrap mb-3">
                          {getPostText()}
                        </div>
                        <button
                          onClick={() => {
                            navigator.clipboard.writeText(getPostText());
                            showToast('Copied for Instagram!', 'success');
                            setShowInstagramTooltip(false);
                          }}
                          className="flex items-center gap-2 px-3 py-2 bg-purple-500 rounded-lg text-sm hover:bg-purple-600 transition-colors"
                        >
                          <Copy className="w-4 h-4" />
                          Copy Text
                        </button>
                      </div>
                      <button
                        onClick={() => setShowInstagramTooltip(false)}
                        className="text-muted-foreground hover:text-white"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              <button
                onClick={handleOpenShareLinks}
                disabled={selectedSharePlatforms.length === 0}
                className="w-full py-3 bg-blue-500 rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2 font-medium"
              >
                <ExternalLink className="w-4 h-4" />
                Open Share Links
              </button>
            </div>

            {/* Schedule Section */}
            <div className="pt-4 border-t border-border">
              <div className="flex gap-2">
                <div className="flex-1 relative">
                  <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <input
                    type="datetime-local"
                    value={scheduledTime}
                    onChange={(e) => setScheduledTime(e.target.value)}
                    className="w-full bg-input border border-border rounded-lg pl-10 pr-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>
                <button
                  onClick={handleSchedule}
                  disabled={!scheduledTime}
                  className="px-6 py-3 bg-secondary rounded-lg hover:bg-secondary/80 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
                >
                  <Calendar className="w-4 h-4" />
                  Schedule
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
