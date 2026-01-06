
export type Channel = 'whatsapp' | 'instagram' | 'telegram';

export type UserRole = 'super_admin' | 'admin';

export interface UserSession {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatar: string;
}

export interface Message {
  id: string;
  sender: 'user' | 'admin' | 'ai';
  text: string;
  timestamp: Date;
}

export interface Conversation {
  id: string;
  customerName: string;
  avatar: string;
  channel: Channel;
  lastMessage: string;
  lastTimestamp: Date;
  unreadCount: number;
  status: 'unread' | 'resolved' | 'active';
  messages: Message[];
  tags: string[];
  startedAt: Date;
  resolvedAt?: Date;
}

export interface Customer {
  id: string;
  external_id: string;
  name: string;
  email: string;
  phone: string;
  tags: string[];
  lastActive: Date;
  avatar: string;
  source: 'chat' | 'manual'; // Baru: Melacak asal data
}

export type View = 'login' | 'dashboard' | 'chats' | 'contacts' | 'training' | 'settings';

export interface KnowledgeSource {
  id: string;
  name: string;
  size: string;
  status: string;
  created_at: Date;
}
