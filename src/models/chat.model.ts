import { supabase } from '../config/supabase';
import { UserModel, UserWithInterests } from './user.model';
import { RealtimeChannel } from '@supabase/supabase-js';

export interface Chat {
  id: string;
  created_at: Date;
  updated_at: Date;
  participants?: UserWithInterests[];
  last_message?: Message;
  unread_count?: number;
}

export interface Message {
  id: string;
  chat_id: string;
  sender_id: string;
  text: string;
  image_url?: string;
  is_read: boolean;
  created_at: Date;
}

export interface CreateMessageDto {
  chat_id: string;
  sender_id: string;
  text: string;
  image_url?: string;
}

interface ChatParticipant {
  chat_id: string;
  user_id: string;
}

// Store active subscriptions
const activeSubscriptions: Map<string, RealtimeChannel> = new Map();

export const ChatModel = {
  // Subscribe to chat updates
  async subscribeToChatUpdates(chatId: string, callback: (payload: any) => void): Promise<{ unsubscribe: () => void }> {
    // Check if subscription already exists
    if (activeSubscriptions.has(chatId)) {
      const existingChannel = activeSubscriptions.get(chatId);
      if (existingChannel) {
        return { 
          unsubscribe: () => {
            existingChannel.unsubscribe();
            activeSubscriptions.delete(chatId);
          }
        };
      }
    }

    // Create a new subscription
    const channel = supabase
      .channel(`chat:${chatId}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'messages',
        filter: `chat_id=eq.${chatId}`
      }, (payload: any) => {
        callback(payload);
      })
      .subscribe();

    // Store subscription
    activeSubscriptions.set(chatId, channel);

    // Return unsubscribe function
    return {
      unsubscribe: () => {
        channel.unsubscribe();
        activeSubscriptions.delete(chatId);
      }
    };
  },

  async findById(chatId: string, userId: string): Promise<Chat | null> {
    // Verify that the user is a participant in this chat
    const { data: chatParticipant } = await supabase
      .from('chat_participants')
      .select('user_id')
      .eq('chat_id', chatId)
      .eq('user_id', userId)
      .single();

    if (!chatParticipant) {
      return null; // User is not a participant in this chat
    }
    
    // Get chat details
    const { data: chat, error } = await supabase
      .from('chats')
      .select('*')
      .eq('id', chatId)
      .single();

    if (error || !chat) {
      return null;
    }

    // Get chat participants
    const { data: participants } = await supabase
      .from('chat_participants')
      .select('user_id')
      .eq('chat_id', chatId);

    // Get user details for each participant
    const participantUsers = await Promise.all(
      participants?.map((p: any) => UserModel.findById(p.user_id)) || []
    );

    // Get the last message
    const { data: messages } = await supabase
      .from('messages')
      .select('*')
      .eq('chat_id', chatId)
      .order('created_at', { ascending: false })
      .limit(1);

    // Get unread message count for this user
    const unreadCount = await this.getUnreadMessageCount(chatId, userId);

    return {
      ...chat,
      participants: participantUsers.filter(Boolean) as UserWithInterests[],
      last_message: messages && messages.length > 0 ? messages[0] : undefined,
      unread_count: unreadCount
    };
  },

  async getUserChats(userId: string): Promise<Chat[]> {
    // Get chat IDs where user is a participant
    const { data: userChats, error } = await supabase
      .from('chat_participants')
      .select('chat_id')
      .eq('user_id', userId);

    if (error || !userChats || userChats.length === 0) {
      return [];
    }

    // Get details for each chat
    const chatIds = userChats.map((uc: { chat_id: string }) => uc.chat_id);
    const chats = await Promise.all(
      chatIds.map((chatId: string) => this.findById(chatId, userId))
    );

    return chats.filter(Boolean) as Chat[];
  },

  async createChat(userIds: string[]): Promise<Chat | null> {
    if (userIds.length < 2) {
      throw new Error('Chat requires at least 2 participants');
    }

    // Check if chat already exists between these users
    const existingChatId = await this.findExistingChatBetweenUsers(userIds);
    
    if (existingChatId) {
      return this.findById(existingChatId, userIds[0]);
    }

    // Create new chat
    const { data: chat, error } = await supabase
      .from('chats')
      .insert({})
      .select()
      .single();

    if (error || !chat) {
      throw new Error(`Error creating chat: ${error?.message || 'Unknown error'}`);
    }

    // Add participants
    const participants = userIds.map(userId => ({
      chat_id: chat.id,
      user_id: userId
    }));

    const { error: participantError } = await supabase
      .from('chat_participants')
      .insert(participants);

    if (participantError) {
      throw new Error(`Error adding chat participants: ${participantError.message}`);
    }

    return this.findById(chat.id, userIds[0]);
  },

  async getUnreadMessageCount(chatId: string, userId: string): Promise<number> {
    const { count, error } = await supabase
      .from('messages')
      .select('*', { count: 'exact', head: true })
      .eq('chat_id', chatId)
      .neq('sender_id', userId)
      .eq('is_read', false);

    if (error) {
      throw new Error(`Error getting unread message count: ${error.message}`);
    }

    return count || 0;
  },

  async getUnreadCounts(userId: string): Promise<Record<string, number>> {
    // Get all chats for the user
    const { data: userChats, error } = await supabase
      .from('chat_participants')
      .select('chat_id')
      .eq('user_id', userId);

    if (error || !userChats || userChats.length === 0) {
      return {};
    }

    // Get unread counts for each chat
    const unreadCounts: Record<string, number> = {};
    await Promise.all(
      userChats.map(async ({ chat_id }: { chat_id: string }) => {
        unreadCounts[chat_id] = await this.getUnreadMessageCount(chat_id, userId);
      })
    );

    return unreadCounts;
  },

  async findExistingChatBetweenUsers(userIds: string[]): Promise<string | null> {
    if (userIds.length !== 2) {
      return null; // This simple check only works for 2 users
    }

    // Find a chat where both users are participants
    const [user1, user2] = userIds;
    
    const { data } = await supabase.rpc('create_chat', {
      user1_id: user1,
      user2_id: user2
    });

    return data || null;
  }
};

export const MessageModel = {
  async findByChatId(chatId: string, userId: string, limit = 50, offset = 0): Promise<Message[]> {
    // Verify that the user is a participant in this chat
    const { data: chatParticipant } = await supabase
      .from('chat_participants')
      .select('user_id')
      .eq('chat_id', chatId)
      .eq('user_id', userId)
      .single();

    if (!chatParticipant) {
      return []; // User is not a participant in this chat
    }

    // Get messages for this chat
    const { data: messages, error } = await supabase
      .from('messages')
      .select('*')
      .eq('chat_id', chatId)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      throw new Error(`Error fetching messages: ${error.message}`);
    }

    return messages || [];
  },

  async create(messageData: CreateMessageDto): Promise<Message> {
    // Verify that the sender is a participant in this chat
    const { data: chatParticipant } = await supabase
      .from('chat_participants')
      .select('user_id')
      .eq('chat_id', messageData.chat_id)
      .eq('user_id', messageData.sender_id)
      .single();

    if (!chatParticipant) {
      throw new Error('User is not a participant in this chat');
    }

    // Create message
    const { data: message, error } = await supabase
      .from('messages')
      .insert({
        chat_id: messageData.chat_id,
        sender_id: messageData.sender_id,
        text: messageData.text,
        image_url: messageData.image_url,
        is_read: false
      })
      .select()
      .single();

    if (error) {
      throw new Error(`Error creating message: ${error.message}`);
    }

    // Update chat's updated_at timestamp
    await supabase
      .from('chats')
      .update({ updated_at: new Date() })
      .eq('id', messageData.chat_id);

    return message;
  },

  async markAsRead(chatId: string, userId: string): Promise<boolean> {
    // Update all unread messages sent to this user in this chat
    const { error } = await supabase
      .from('messages')
      .update({ is_read: true })
      .eq('chat_id', chatId)
      .neq('sender_id', userId)
      .eq('is_read', false);

    if (error) {
      throw new Error(`Error marking messages as read: ${error.message}`);
    }

    return true;
  }
}; 