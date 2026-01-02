
import React from 'react';
import { 
  MessageCircle, 
  Instagram, 
  Send, 
  LayoutDashboard, 
  Users, 
  Settings, 
  BrainCircuit
} from 'lucide-react';
import { Conversation, Customer, Channel, Message } from './types';

const daysAgo = (days: number, hours: number = 10, mins: number = 0) => {
  const d = new Date();
  d.setDate(d.getDate() - days);
  d.setHours(hours, mins, 0, 0);
  return d;
};

const generateHistory = (baseId: string, totalMessages: number, startDate: Date): Message[] => {
  const msgs: Message[] = [];
  const startTime = startDate.getTime();
  const now = Date.now();
  
  for (let i = 0; i < totalMessages; i++) {
    const timestamp = new Date(startTime + Math.random() * (now - startTime));
    msgs.push({
      id: `${baseId}-${i}`,
      sender: Math.random() > 0.4 ? 'user' : 'admin',
      text: [
        'Halo, saya tertarik dengan layanannya.',
        'Berapa biayanya?',
        'Terima kasih informasinya.',
        'Apakah ada promo?',
        'Saya ada kendala teknis.',
        'Sangat membantu!',
        'Bisa kirim invoice?',
        'Kapan stok ready lagi?',
        'Oke, saya pesan sekarang.'
      ][Math.floor(Math.random() * 9)],
      timestamp
    });
  }
  return msgs;
};

const customerNames = [
  'Ahmad Kurniawan', 'Siti Sarah', 'Budi Santoso', 'Rina Marlina', 'Jessica Wong', 
  'Denny Huang', 'Andi Pratama', 'Maya Indah', 'Kevin Sanjaya', 'Lestari Putri',
  'Rian Hidayat', 'Dewi Lestari', 'Fajar Nugraha', 'Eka Putra', 'Indah Permata',
  'Guntur Bumi', 'Hana Sofia', 'Irfan Hakim', 'Joko Susilo', 'Kartika Sari',
  'Lukman Hakim', 'Mira Santika', 'Nanda Pratama', 'Oki Setiana', 'Putra Bangsa',
  'Qory Sandioriva', 'Rizky Billar', 'Sule Prikitiw', 'Tukul Arwana', 'Uus Komedian'
];

const channels: Channel[] = ['whatsapp', 'instagram', 'telegram'];

export const MOCK_CONVERSATIONS: Conversation[] = customerNames.map((name, idx) => {
  const channel = channels[idx % 3];
  const status = idx < 5 ? 'unread' : (idx % 4 === 0 ? 'resolved' : 'active');
  const startDaysAgo = Math.floor(Math.random() * 30);
  const startedAt = daysAgo(startDaysAgo, Math.floor(Math.random() * 24), Math.floor(Math.random() * 60));
  const msgHistory = generateHistory(`msg-${idx}`, 10 + Math.floor(Math.random() * 15), startedAt);
  
  let resolvedAt = undefined;
  if (status === 'resolved') {
    const resolveTime = startedAt.getTime() + (Math.random() * 2 * 24 * 60 * 60 * 1000);
    resolvedAt = new Date(Math.min(resolveTime, Date.now()));
  }

  msgHistory.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());

  return {
    id: `conv-${idx}`,
    customerName: name,
    avatar: `https://i.pravatar.cc/150?u=${name.replace(' ', '')}`,
    channel,
    lastMessage: msgHistory[msgHistory.length - 1].text,
    lastTimestamp: msgHistory[msgHistory.length - 1].timestamp,
    unreadCount: status === 'unread' ? Math.floor(Math.random() * 5) + 1 : 0,
    status,
    tags: idx % 3 === 0 ? ['VIP'] : (idx % 5 === 0 ? ['Potential'] : ['New']),
    messages: msgHistory,
    startedAt,
    resolvedAt
  };
});

MOCK_CONVERSATIONS.sort((a, b) => b.lastTimestamp.getTime() - a.lastTimestamp.getTime());

export const MOCK_CUSTOMERS: Customer[] = MOCK_CONVERSATIONS.map(conv => ({
  id: conv.customerName.toLowerCase().replace(' ', '-'),
  name: conv.customerName,
  email: `${conv.customerName.toLowerCase().replace(' ', '.')}@example.com`,
  phone: `+6281${Math.floor(10000000 + Math.random() * 90000000)}`,
  tags: conv.tags,
  lastActive: conv.lastTimestamp,
  avatar: conv.avatar,
  source: 'chat' as const
}));

export const CHANNEL_ICONS: Record<Channel, React.ReactNode> = {
  whatsapp: <MessageCircle className="w-4 h-4 text-emerald-500" />,
  instagram: <Instagram className="w-4 h-4 text-pink-500" />,
  telegram: <Send className="w-4 h-4 text-sky-500" />,
};

export const NAV_ITEMS = [
  { id: 'dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { id: 'chats', icon: MessageCircle, label: 'Inbox' },
  { id: 'contacts', icon: Users, label: 'Contacts' },
  { id: 'training', icon: BrainCircuit, label: 'AI Training' },
  { id: 'settings', icon: Settings, label: 'Settings' },
];
