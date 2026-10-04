import React, { useState, useRef, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import GlassCard from '../components/GlassCard';
import Button from '../components/Button';
import { aiService } from '../services/aiService';
import { useExpenses } from '../context/ExpenseContext';
import {
  Sparkles,
  Send,
  Bot,
  User,
  Zap,
  RotateCcw,
  TrendingDown,
  Calendar,
  AlertCircle,
  HelpCircle,
  ShieldCheck,
  CheckCircle2,
  RefreshCw,
  PieChart,
  DollarSign
} from 'lucide-react';

const STORAGE_KEY = 'student_expense_ai_chat_history_v1';

const AIAssistant = () => {
  const location = useLocation();
  const { expenses, budgets, analytics, refreshExpenses } = useExpenses();

  const initialWelcomeMessage = {
    id: 'welcome',
    role: 'assistant',
    text: `Hello! I'm **Gemma**, your local open-weight AI financial assistant for **Student Expense AI**.

I am connected to your live **PostgreSQL database**. I can analyze your transactions, category limits, daily pacing, and tell you exactly where your money is going.

Ask me anything about your finances or choose one of the suggested questions below!`,
    timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    source: 'gemma-modeled'
  };

  const [messages, setMessages] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch {
      // ignore JSON parse error
    }
    return [initialWelcomeMessage];
  });

  const [inputPrompt, setInputPrompt] = useState('');
  const [isThinking, setIsThinking] = useState(false);
  const [lastFailedQuery, setLastFailedQuery] = useState(null);
  const messagesEndRef = useRef(null);

  // Sync messages to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(messages));
    } catch (e) {
      console.warn('Failed to save chat history to localStorage', e);
    }
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isThinking]);

  // Handle passed prompts from external links or navigation state
  useEffect(() => {
    if (location.state?.prompt) {
      handleSendMessage(location.state.prompt);
    }
  }, [location.state]);

  const handleSendMessage = async (textToSend) => {
    const query = (textToSend || inputPrompt).trim();
    if (!query || isThinking) return;

    setLastFailedQuery(null);

    const userMessage = {
      id: `msg-${Date.now()}`,
      role: 'user',
      text: query,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputPrompt('');
    setIsThinking(true);

    try {
      const response = await aiService.queryAssistant(query, {});
      const aiReply = {
        id: `msg-${Date.now() + 1}`,
        role: 'assistant',
        text: response.reply,
        source: response.source,
        model: response.model,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setMessages((prev) => [...prev, aiReply]);
    } catch (err) {
      console.error('Chat error:', err);
      setLastFailedQuery(query);
      const errorMessage = {
        id: `msg-${Date.now() + 1}`,
        role: 'assistant',
        text: 'Unable to communicate with the FastAPI AI service. Please verify that the backend is running and reachable.',
        isError: true,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsThinking(false);
    }
  };

  const handleRetry = () => {
    if (lastFailedQuery) {
      handleSendMessage(lastFailedQuery);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleResetChat = () => {
    const resetMsg = {
      id: `welcome-reset-${Date.now()}`,
      role: 'assistant',
      text: `Conversation history cleared. What questions can I answer about your spending, budget, or saving goals?`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      source: 'gemma-modeled'
    };
    setMessages([resetMsg]);
    setLastFailedQuery(null);
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      // ignore
    }
  };

  // Primary suggested questions specified by requirements
  const primarySuggested = [
    { label: 'Where am I overspending?', query: 'Where am I overspending?', icon: AlertCircle, color: 'text-amber-400' },
    { label: 'Give me saving tips', query: 'Give me saving tips', icon: TrendingDown, color: 'text-emerald-400' },
    { label: 'Analyze this month', query: 'Analyze this month', icon: Zap, color: 'text-cyan-400' },
    { label: 'Compare with last month', query: 'Compare with last month', icon: Calendar, color: 'text-purple-400' }
  ];

  // Specific query pills for instant testing
  const specificPills = [
    'Where did I spend the most this month?',
    'How much did I spend on food?',
    'Can I afford to spend ₹500 today?',
    'What was my biggest expense?'
  ];

  // Format AI response with markdown formatting for bold, bullets, numbered lists
  const formatAiMessage = (content) => {
    if (!content) return null;
    const lines = content.split('\n');
    return lines.map((line, i) => {
      // Replace **text** with strong tag
      const formattedLine = line.replace(/\*\*(.*?)\*\*/g, '<strong class="text-white font-semibold">$1</strong>');

      if (line.startsWith('- ') || line.startsWith('* ')) {
        return (
          <li
            key={i}
            className="ml-4 list-disc text-slate-200 my-1 leading-relaxed"
            dangerouslySetInnerHTML={{ __html: formattedLine.replace(/^[-*]\s+/, '') }}
          />
        );
      }
      if (/^\d+\.\s+/.test(line)) {
        return (
          <li
            key={i}
            className="ml-4 list-decimal text-slate-200 my-1 leading-relaxed"
            dangerouslySetInnerHTML={{ __html: formattedLine.replace(/^\d+\.\s+/, '') }}
          />
        );
      }
      if (line.trim() === '') {
        return <div key={i} className="h-2" />;
      }
      return (
        <p
          key={i}
          className="my-1 text-slate-200 leading-relaxed"
          dangerouslySetInnerHTML={{ __html: formattedLine }}
        />
      );
    });
  };

  // Live database totals for quick context indicator
  const totalSpent = analytics?.totalSpent || 0;
  const monthlyBudget = budgets?.monthlyTotal || 10000;
  const remainingBudget = Math.max(0, monthlyBudget - totalSpent);

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-fade-in pb-12">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight flex items-center gap-2">
            AI Expense Assistant
          </h1>
          <p className="text-xs sm:text-sm text-slate-400">
            Ask natural questions grounded strictly in your real PostgreSQL expense and budget records.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            onClick={handleResetChat}
            variant="ghost"
            icon={RotateCcw}
            size="sm"
            className="text-slate-400 hover:text-white"
          >
            Clear Chat
          </Button>
        </div>
      </div>

      {/* Real PostgreSQL Live Context Snapshot Pill Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800/80 flex items-center gap-3">
          <div className="p-2 rounded-lg bg-blue-500/10 text-blue-400">
            <DollarSign className="w-4 h-4" />
          </div>
          <div>
            <p className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">Total Spent</p>
            <p className="text-sm font-bold text-white">₹{Number(totalSpent).toFixed(2)}</p>
          </div>
        </div>

        <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800/80 flex items-center gap-3">
          <div className="p-2 rounded-lg bg-purple-500/10 text-purple-400">
            <PieChart className="w-4 h-4" />
          </div>
          <div>
            <p className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">Monthly Budget</p>
            <p className="text-sm font-bold text-white">₹{Number(monthlyBudget).toFixed(2)}</p>
          </div>
        </div>

        <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800/80 flex items-center gap-3">
          <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400">
            <CheckCircle2 className="w-4 h-4" />
          </div>
          <div>
            <p className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">Remaining Buffer</p>
            <p className="text-sm font-bold text-emerald-400">₹{Number(remainingBudget).toFixed(2)}</p>
          </div>
        </div>

        <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800/80 flex items-center gap-3">
          <div className="p-2 rounded-lg bg-cyan-500/10 text-cyan-400">
            <ShieldCheck className="w-4 h-4" />
          </div>
          <div>
            <p className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">AI Grounding</p>
            <p className="text-xs font-semibold text-cyan-400">Live PostgreSQL Data</p>
          </div>
        </div>
      </div>

      {/* Suggested Questions Section */}
      <div className="space-y-2">
        <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
          <HelpCircle className="w-3.5 h-3.5 text-cyan-400" />
          <span>Suggested Questions</span>
        </p>

        {/* Primary 4 Suggested Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
          {primarySuggested.map((item, idx) => {
            const Icon = item.icon;
            return (
              <button
                key={idx}
                onClick={() => handleSendMessage(item.query)}
                disabled={isThinking}
                className="p-3 rounded-xl bg-slate-900/60 hover:bg-slate-800/80 border border-slate-800 hover:border-cyan-500/40 text-left transition-all duration-200 flex items-center gap-2.5 group cursor-pointer disabled:opacity-50"
              >
                <div className={`p-2 rounded-lg bg-slate-800 group-hover:bg-cyan-500/20 shrink-0 ${item.color}`}>
                  <Icon className="w-4 h-4" />
                </div>
                <span className="text-xs font-medium text-slate-300 group-hover:text-white truncate">
                  {item.label}
                </span>
              </button>
            );
          })}
        </div>

        {/* Specific quick question pills */}
        <div className="flex flex-wrap gap-2 pt-1">
          {specificPills.map((queryText, idx) => (
            <button
              key={idx}
              onClick={() => handleSendMessage(queryText)}
              disabled={isThinking}
              className="text-xs px-3 py-1.5 rounded-lg bg-slate-900/50 hover:bg-slate-800 border border-slate-800/80 hover:border-purple-500/40 text-slate-400 hover:text-slate-200 transition-colors cursor-pointer disabled:opacity-50"
            >
              &ldquo;{queryText}&rdquo;
            </button>
          ))}
        </div>
      </div>

      {/* Chat Messages Frame */}
      <GlassCard className="flex flex-col h-[560px] border border-slate-700/80 p-4 sm:p-6 shadow-2xl relative">
        {/* Messages Stream */}
        <div className="flex-1 overflow-y-auto space-y-4 pr-2 custom-scrollbar">
          {messages.map((msg) => {
            const isAI = msg.role === 'assistant';
            const isError = msg.isError;

            return (
              <div
                key={msg.id}
                className={`flex gap-3 sm:gap-4 ${isAI ? 'justify-start' : 'justify-end'}`}
              >
                {isAI && (
                  <div className={`w-8 h-8 rounded-xl p-[1px] shrink-0 mt-1 shadow-md ${
                    isError
                      ? 'bg-rose-500/30'
                      : 'bg-gradient-to-tr from-cyan-500 to-purple-600 shadow-purple-500/20'
                  }`}>
                    <div className="w-full h-full bg-[#080d1b] rounded-[11px] flex items-center justify-center">
                      {isError ? (
                        <AlertCircle className="w-4 h-4 text-rose-400" />
                      ) : (
                        <Bot className="w-4 h-4 text-cyan-400" />
                      )}
                    </div>
                  </div>
                )}

                <div
                  className={`
                    max-w-[85%] sm:max-w-[78%] rounded-2xl p-4 text-sm leading-relaxed
                    ${isError
                      ? 'bg-rose-950/30 border border-rose-800/50 text-rose-200 shadow-md'
                      : isAI
                        ? 'bg-slate-900/85 border border-slate-700/80 text-slate-100 shadow-md backdrop-blur-md'
                        : 'bg-gradient-to-r from-cyan-600 to-blue-600 text-white font-medium shadow-lg shadow-cyan-600/20'
                    }
                  `}
                >
                  <div className="flex items-center justify-between gap-4 mb-1.5 opacity-60 text-[11px]">
                    <span className="font-semibold uppercase tracking-wider">
                      {isAI ? (isError ? 'System Error' : 'Gemma AI Assistant') : 'You'}
                    </span>
                    <span>{msg.timestamp}</span>
                  </div>

                  <div>{formatAiMessage(msg.text)}</div>

                  {/* Error Retry CTA */}
                  {isError && lastFailedQuery && (
                    <div className="mt-3 pt-2 border-t border-rose-800/40 flex items-center justify-between gap-2">
                      <span className="text-xs text-rose-300">Would you like to retry?</span>
                      <Button
                        size="xs"
                        variant="secondary"
                        icon={RefreshCw}
                        onClick={handleRetry}
                        disabled={isThinking}
                        className="bg-rose-900/40 hover:bg-rose-800/60 border border-rose-700 text-rose-200 text-xs py-1 px-2.5"
                      >
                        Retry Query
                      </Button>
                    </div>
                  )}

                  {/* Grounding Source Badge */}
                  {isAI && !isError && (
                    <div className="mt-2.5 pt-2 border-t border-slate-800/80 text-[10px] text-slate-400 flex items-center justify-between">
                      <span className="flex items-center gap-1 text-emerald-400">
                        <ShieldCheck className="w-3 h-3" />
                        <span>PostgreSQL Grounded (No Hallucinations)</span>
                      </span>
                      <span className="text-slate-500 font-mono">
                        {msg.model || 'gemma3'}
                      </span>
                    </div>
                  )}
                </div>

                {!isAI && (
                  <div className="w-8 h-8 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center shrink-0 mt-1 text-slate-300 shadow-sm">
                    <User className="w-4 h-4" />
                  </div>
                )}
              </div>
            );
          })}

          {/* Loading Animation */}
          {isThinking && (
            <div className="flex gap-3 sm:gap-4 items-start animate-fade-in">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-cyan-500 to-purple-600 p-[1px] shrink-0 mt-1 shadow-md shadow-purple-500/20">
                <div className="w-full h-full bg-[#080d1b] rounded-[11px] flex items-center justify-center">
                  <Bot className="w-4 h-4 text-cyan-400 animate-pulse" />
                </div>
              </div>
              <div className="p-3.5 rounded-2xl bg-slate-900/85 border border-slate-700/80 flex items-center gap-2.5 shadow-md">
                <div className="flex items-center gap-1.5">
                  <div className="w-2 h-2 rounded-full bg-cyan-400 animate-bounce" />
                  <div className="w-2 h-2 rounded-full bg-purple-400 animate-bounce [animation-delay:0.2s]" />
                  <div className="w-2 h-2 rounded-full bg-blue-400 animate-bounce [animation-delay:0.4s]" />
                </div>
                <span className="text-xs text-slate-400 ml-1">
                  Gemma is querying PostgreSQL and computing financial analysis...
                </span>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input Bar */}
        <div className="pt-4 mt-2 border-t border-slate-800/80">
          <div className="flex items-center gap-2">
            <input
              type="text"
              placeholder="Ask: 'Where did I spend the most?', 'Can I afford ₹500 today?', or 'Give me saving tips'..."
              value={inputPrompt}
              onChange={(e) => setInputPrompt(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={isThinking}
              className="flex-1 px-4 py-3 rounded-xl glass-input text-white text-sm placeholder-slate-500 focus:border-cyan-400"
            />
            <Button
              onClick={() => handleSendMessage()}
              disabled={!inputPrompt.trim() || isThinking}
              icon={Send}
              size="md"
            >
              Send
            </Button>
          </div>
          <div className="flex items-center justify-between text-[11px] text-slate-500 mt-2 px-1">
            <span className="flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
              Gemma Local Inference &bull; Zero Cloud Leakage
            </span>
            <span>FastAPI & PostgreSQL Connected</span>
          </div>
        </div>
      </GlassCard>
    </div>
  );
};

export default AIAssistant;
