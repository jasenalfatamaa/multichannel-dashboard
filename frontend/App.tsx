
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
import { analyzeCustomerIntent, getAISuggestion } from './services/geminiService';

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
  const [conversations, setConversations] = useState<Conversation[]>(MOCK_CONVERSATIONS);
  const [customers, setCustomers] = useState<Customer[]>(MOCK_CUSTOMERS);

  // Check session on mount
  useEffect(() => {
    const savedSession = localStorage.getItem('omniai_current_session');
    if (savedSession) {
      try {
        const session = JSON.parse(savedSession);
        setUserSession(session);
        setIsAuthenticated(true);
      } catch (e) {
        console.error("Invalid session data");
      }
    }
  }, []);

  // Ref to track which user messages have already been auto-replied to
  const repliedMessageIds = useRef<Set<string>>(new Set());

  // Logic Auto-Sync & AI Tagging
  useEffect(() => {
    const syncWithAI = async () => {
      const newConvs = conversations.filter(conv => !customers.some(cust => cust.name === conv.customerName));

      if (newConvs.length > 0) {
        const newCustomers: Customer[] = await Promise.all(newConvs.map(async conv => {
          const aiTags = await analyzeCustomerIntent(conv.messages);
          return {
            id: conv.customerName.toLowerCase().replace(' ', '-'),
            name: conv.customerName,
            email: `${conv.customerName.toLowerCase().replace(' ', '.')}@example.com`,
            phone: '+62812' + Math.floor(10000000 + Math.random() * 90000000),
            tags: aiTags,
            lastActive: conv.lastTimestamp,
            avatar: conv.avatar,
            source: 'chat'
          };
        }));
        setCustomers(prev => [...prev, ...newCustomers]);
      }
    };
    syncWithAI();
  }, [conversations, customers.length]);


  // Ref to track mounting time to avoid replying to old mock messages
  const appStartTime = useRef<number>(Date.now());

  // LOGIKA AUTO-REPLY
  useEffect(() => {
    const handleAutoReply = async () => {
      // Periksa setting Auto-Reply dari LocalStorage
      const savedProfile = localStorage.getItem('omniai_user_profile');
      let isAutoReplyEnabled = true;
      let aiTone = 'Friendly';

      if (savedProfile) {
        try {
          const parsed = JSON.parse(savedProfile);
          isAutoReplyEnabled = parsed.aiAutoReply !== false;
          aiTone = parsed.aiTone || 'Friendly';
        } catch (e) {
          console.error("Error reading profile for auto-reply", e);
        }
      }

      if (!isAutoReplyEnabled) return;

      // Iterasi setiap percakapan untuk melihat apakah ada pesan baru dari 'user'
      for (const conv of conversations) {
        if (conv.messages.length === 0) continue;
        const lastMsg = conv.messages[conv.messages.length - 1];

        // OPTIMASI: Hanya balas jika:
        // 1. Pesan berasal dari 'user'
        // 2. Belum pernah dibalas otomatis (ID ada di Set)
        // 3. Pesan diterima SETELAH aplikasi dijalankan (mencegah spam ke mock history)
        const isNewMessage = new Date(lastMsg.timestamp).getTime() > appStartTime.current;

        if (lastMsg.sender === 'user' && !repliedMessageIds.current.has(lastMsg.id) && isNewMessage) {
          // Tandai sebagai sudah diproses
          repliedMessageIds.current.add(lastMsg.id);

          // Simulasi delay "AI sedang mengetik"
          setTimeout(async () => {
            const promptContext = `Respond as an AI assistant with a ${aiTone} tone. Customer name: ${conv.customerName}`;
            const aiResponse = await getAISuggestion(conv.messages, promptContext);

            const newMessage: Message = {
              id: 'ai-auto-' + Math.random().toString(36).substr(2, 9),
              sender: 'ai',
              text: aiResponse,
              timestamp: new Date()
            };

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

            // Sync selected chat if open
            if (selectedChat && selectedChat.id === conv.id) {
              setSelectedChat(prev => prev ? {
                ...prev,
                messages: [...prev.messages, newMessage],
                lastMessage: aiResponse,
                lastTimestamp: new Date()
              } : null);
            }
          }, 4000); // 4 detik delay agar terasa natural
        }
      }
    };

    handleAutoReply();
  }, [conversations, selectedChat]);

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
    localStorage.removeItem('omniai_current_session');
    setIsAuthenticated(false);
    setUserSession(null);
    setCurrentView('dashboard');
    setSelectedChat(null);
  };

  const handleLoginSuccess = (session: UserSession) => {
    setUserSession(session);
    setIsAuthenticated(true);
  };

  const handleSendMessage = (text: string) => {
    if (!selectedChat) return;

    const newMessage: Message = {
      id: Math.random().toString(36).substr(2, 9),
      sender: 'admin',
      text,
      timestamp: new Date()
    };

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
  };

  const handleToggleStatus = (id: string, newStatus: 'unread' | 'resolved' | 'active') => {
    const now = new Date();
    setConversations(prev => prev.map(conv => {
      if (conv.id === id) {
        return { ...conv, status: newStatus, resolvedAt: newStatus === 'resolved' ? now : undefined };
      }
      return conv;
    }));
    if (selectedChat && selectedChat.id === id) {
      setSelectedChat({ ...selectedChat, status: newStatus, resolvedAt: newStatus === 'resolved' ? now : undefined });
    }
  };

  const handleAddCustomer = (newCustomer: Customer) => { setCustomers(prev => [newCustomer, ...prev]); };
  const handleDeleteCustomer = (id: string) => { setCustomers(prev => prev.filter(c => c.id !== id)); };
  const handleStartChat = (customerName: string) => {
    const conv = conversations.find(c => c.customerName === customerName);
    if (conv) { setSelectedChat(conv); setCurrentView('chats'); }
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
              className="flex-1 h-full p-4 md:p-8 overflow-y-auto custom-scrollbar"
            >
              {currentView === 'contacts' && <CustomerDatabase customers={customers} onAddCustomer={handleAddCustomer} onDeleteCustomer={handleDeleteCustomer} onStartChat={handleStartChat} />}
              {currentView === 'training' && <AITraining />}
              {currentView === 'dashboard' && <DashboardOverview conversations={conversations} customers={customers} />}
              {currentView === 'settings' && <Settings userRole={userSession?.role || 'admin'} />}
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
};

export default App;
