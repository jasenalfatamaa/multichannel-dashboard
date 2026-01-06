
import React, { useState, useEffect, useRef } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { View, Conversation, Message, Customer, UserSession } from './types';
import Login from './components/Login';
import Sidebar from './components/Sidebar';
import ChatInbox from './components/ChatInbox';
import ChatWindow from './components/ChatWindow';
import AISuggestionPanel from './components/AISuggestionPanel';
import CustomerDatabase from './components/CustomerDatabase';
import AITraining from './components/AITraining';
import DashboardOverview from './components/DashboardOverview';
import Settings from './components/Settings';
import { MOCK_CONVERSATIONS, MOCK_CUSTOMERS } from './constants';
import { authService, customerService, conversationService, aiService } from './services/apiService';

const pageVariants = {
  initial: { opacity: 0, scale: 0.98, y: 10 },
  animate: { opacity: 1, scale: 1, y: 0 },
  exit: { opacity: 0, scale: 1.02, y: -10 }
};

const pageTransition = {
  type: 'spring' as const,
  stiffness: 100,
  damping: 20
};

const App: React.FC = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userSession, setUserSession] = useState<UserSession | null>(null);
  const [currentView, setCurrentView] = useState<View>('dashboard');
  const [selectedChat, setSelectedChat] = useState<Conversation | null>(null);
  const [showAIPanel, setShowAIPanel] = useState(false);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);

  // Fetch initial data
  useEffect(() => {
    if (isAuthenticated) {
      const fetchData = async () => {
        try {
          const [convs, custs] = await Promise.all([
            conversationService.list(),
            customerService.list()
          ]);
          setConversations(convs);
          setCustomers(custs);
        } catch (error) {
          console.error("Failed to fetch data:", error);
        }
      };
      fetchData();
    }
  }, [isAuthenticated]);

  // Check session on mount
  useEffect(() => {
    const checkSession = async () => {
      const token = localStorage.getItem('omniai_token');
      if (token) {
        try {
          const user = await authService.getCurrentUser();
          setUserSession(user);
          setIsAuthenticated(true);
        } catch (e) {
          console.error("Invalid session data");
          localStorage.removeItem('omniai_token');
        }
      }
    };
    checkSession();
  }, []);

  // Ref to track which user messages have already been auto-replied to
  const repliedMessageIds = useRef<Set<string>>(new Set());

  // Logic Auto-Sync & AI Tagging (Simplified for Backend integration)
  useEffect(() => {
    const syncWithAI = async () => {
      // In a real app, the backend would handle this trigger,
      // but for this port, we can still trigger analysis for new conversations if needed.
      const unanalyzed = conversations.filter(c => c.tags.length === 0 || c.tags.includes('New'));
      for (const conv of unanalyzed) {
        try {
          // Trigger backend analysis
          await aiService.analyzeIntent(Number(conv.id));
        } catch (e) {
          console.error("Analysis trigger failed");
        }
      }
    };
    if (conversations.length > 0) syncWithAI();
  }, [conversations.length]);

  // LOGIKA AUTO-REPLY
  useEffect(() => {
    const handleAutoReply = async () => {
      const token = localStorage.getItem('omniai_token');
      if (!token) return;

      // Iterasi setiap percakapan untuk melihat apakah ada pesan baru dari 'user'
      for (const conv of conversations) {
        if (conv.messages.length === 0) continue;
        const lastMsg = conv.messages[conv.messages.length - 1];

        if (lastMsg.sender === 'user' && !repliedMessageIds.current.has(lastMsg.id)) {
          repliedMessageIds.current.add(lastMsg.id);

          setTimeout(async () => {
            try {
              const aiResponse = await aiService.getSuggestion(Number(conv.id), 'Friendly');
              const newMessage = await conversationService.sendMessage(Number(conv.id), 'ai', aiResponse);

              setConversations(prev => prev.map(c => {
                if (c.id === conv.id) {
                  return {
                    ...c,
                    messages: [...c.messages, newMessage],
                    lastMessage: aiResponse,
                    lastTimestamp: new Date(),
                    unreadCount: 0,
                    status: 'active'
                  };
                }
                return c;
              }));

              if (selectedChat && selectedChat.id === conv.id) {
                setSelectedChat(prev => prev ? {
                  ...prev,
                  messages: [...prev.messages, newMessage],
                  lastMessage: aiResponse,
                  lastTimestamp: new Date()
                } : null);
              }
            } catch (e) {
              console.error("Auto reply failed", e);
            }
          }, 4000);
        }
      }
    };

    if (isAuthenticated) handleAutoReply();
  }, [conversations, selectedChat, isAuthenticated]);

  // Auto-resolve logic
  useEffect(() => {
    const sweepInterval = setInterval(() => {
      const now = new Date().getTime();
      const fortyEightHoursInMs = 48 * 60 * 60 * 1000;
      setConversations(prev => prev.map(conv => {
        if (conv.status !== 'resolved') {
          const lastActivity = new Date(conv.lastTimestamp).getTime();
          if (now - lastActivity > fortyEightHoursInMs) {
            return { ...conv, status: 'resolved' as const, resolvedAt: new Date() };
          }
        }
        return conv;
      }));
    }, 60000);
    return () => clearInterval(sweepInterval);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('omniai_token');
    setIsAuthenticated(false);
    setUserSession(null);
    setCurrentView('dashboard');
    setSelectedChat(null);
  };

  const handleLoginSuccess = (session: UserSession) => {
    setUserSession(session);
    setIsAuthenticated(true);
  };

  const handleSendMessage = async (text: string) => {
    if (!selectedChat) return;

    try {
      const newMessage = await conversationService.sendMessage(Number(selectedChat.id), 'admin', text);

      setConversations(prev => prev.map(conv => {
        if (conv.id === selectedChat.id) {
          return {
            ...conv,
            messages: [...conv.messages, newMessage],
            lastMessage: text,
            lastTimestamp: new Date(),
            unreadCount: 0,
            status: 'active' as const,
            resolvedAt: undefined
          };
        }
        return conv;
      }));

      setSelectedChat({
        ...selectedChat,
        messages: [...selectedChat.messages, newMessage],
        status: 'active' as const,
        resolvedAt: undefined
      });
    } catch (e) {
      console.error("Send message failed", e);
    }
  };

  const handleToggleStatus = async (id: string, newStatus: 'unread' | 'resolved' | 'active') => {
    const now = new Date();
    try {
      await conversationService.updateStatus(Number(id), newStatus);
      setConversations(prev => prev.map(conv => {
        if (conv.id === id) {
          return { ...conv, status: newStatus, resolvedAt: newStatus === 'resolved' ? now : undefined };
        }
        return conv;
      }));
      if (selectedChat && selectedChat.id === id) {
        setSelectedChat({ ...selectedChat, status: newStatus, resolvedAt: newStatus === 'resolved' ? now : undefined });
      }
    } catch (e) {
      console.error("Update status failed", e);
    }
  };

  const handleAddCustomer = async (newCustomer: Customer) => {
    try {
      const created = await customerService.create(newCustomer);
      setCustomers(prev => [created, ...prev]);
    } catch (e) {
      console.error("Add customer failed", e);
    }
  };
  const handleDeleteCustomer = async (id: string) => {
    try {
      await customerService.delete(Number(id));
      setCustomers(prev => prev.filter(c => c.id !== id));
    } catch (e) {
      console.error("Delete customer failed", e);
    }
  };
  const handleStartChat = (customerName: string) => {
    const conv = conversations.find(c => c.customerName === customerName);
    if (conv) { setSelectedChat(conv); setCurrentView('chats'); }
  };

  const refreshUserSession = async () => {
    try {
      const user = await authService.getCurrentUser();
      setUserSession(user);
    } catch (error) {
      console.error("Failed to refresh session:", error);
    }
  };

  if (!isAuthenticated) return <Login onLogin={handleLoginSuccess} />;

  return (
    <div className="flex flex-col md:flex-row h-screen w-full bg-slate-50 overflow-hidden font-['Inter']">
      <Sidebar
        activeView={currentView}
        onViewChange={(view) => {
          setCurrentView(view);
          if (view !== 'chats') setSelectedChat(null);
        }}
        userSession={userSession}
        onLogout={handleLogout}
      />

      <main className="flex-1 flex overflow-hidden relative pb-20 md:pb-0">
        <AnimatePresence mode="wait">
          {currentView === 'chats' ? (
            <motion.div
              key="chats"
              variants={pageVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              transition={pageTransition}
              className="flex flex-1 overflow-hidden"
            >
              <div className={`${selectedChat ? 'hidden lg:block' : 'block'} w-full lg:w-80 h-full border-r border-slate-200`}>
                <ChatInbox
                  conversations={conversations}
                  selectedId={selectedChat?.id || null}
                  onSelect={setSelectedChat}
                />
              </div>

              <div className={`${selectedChat ? 'flex' : 'hidden lg:flex'} flex-1 flex-col relative bg-white h-full overflow-hidden`}>
                {selectedChat ? (
                  <div className="flex flex-1 overflow-hidden relative h-full">
                    <ChatWindow
                      conversation={selectedChat}
                      onSendMessage={handleSendMessage}
                      onToggleAI={() => setShowAIPanel(!showAIPanel)}
                      onToggleStatus={handleToggleStatus}
                      onBack={() => setSelectedChat(null)}
                    />

                    <AnimatePresence>
                      {showAIPanel && (
                        <>
                          <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="fixed inset-0 bg-slate-900/30 backdrop-blur-sm z-40 lg:hidden"
                            onClick={() => setShowAIPanel(false)}
                          />
                          <div className="z-50 lg:z-0 lg:relative lg:h-full">
                            <AISuggestionPanel
                              conversation={selectedChat}
                              onApplySuggestion={handleSendMessage}
                              onClose={() => setShowAIPanel(false)}
                            />
                          </div>
                        </>
                      )}
                    </AnimatePresence>
                  </div>
                ) : (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="flex-1 hidden lg:flex items-center justify-center text-slate-400 bg-slate-50/50"
                  >
                    <div className="text-center">
                      <motion.div
                        animate={{ y: [0, -10, 0] }}
                        transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                        className="mb-6 flex justify-center"
                      >
                        <div className="p-6 rounded-[32px] bg-white shadow-xl shadow-indigo-100/50 border border-slate-100">
                          <img src="https://img.icons8.com/ios-filled/100/4f46e5/chat.png" className="w-16 h-16 opacity-20" alt="chat" />
                        </div>
                      </motion.div>
                      <h3 className="text-xl font-black text-slate-800 mb-2">OmniAI Inbox</h3>
                      <p className="text-slate-400 text-sm font-medium">Select a conversation to start high-converting replies.</p>
                    </div>
                  </motion.div>
                )}
              </div>
            </motion.div>
          ) : (
            <motion.div
              key={currentView}
              variants={pageVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              transition={pageTransition}
              className="flex-1 p-4 md:p-8 overflow-y-auto custom-scrollbar"
            >
              {currentView === 'contacts' && <CustomerDatabase customers={customers} onAddCustomer={handleAddCustomer} onDeleteCustomer={handleDeleteCustomer} onStartChat={handleStartChat} />}
              {currentView === 'training' && <AITraining />}
              {currentView === 'dashboard' && <DashboardOverview conversations={conversations} customers={customers} />}
              {currentView === 'settings' && <Settings userSession={userSession} onRefreshSession={refreshUserSession} />}
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
};

export default App;
