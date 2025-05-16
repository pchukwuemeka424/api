import { supabase } from '../config/supabase';
import { RealtimeChannel } from '@supabase/supabase-js';

interface SubscriptionOptions {
  table: string;
  schema?: string;
  event?: 'INSERT' | 'UPDATE' | 'DELETE' | '*';
  filter?: string;
}

interface SubscriptionCallback {
  (payload: any): void;
}

export class RealtimeService {
  private static instance: RealtimeService;
  private subscriptions: Map<string, RealtimeChannel> = new Map();

  private constructor() {
    // private constructor for singleton pattern
  }

  public static getInstance(): RealtimeService {
    if (!RealtimeService.instance) {
      RealtimeService.instance = new RealtimeService();
    }
    return RealtimeService.instance;
  }

  /**
   * Subscribe to real-time changes for a specific resource
   * @param channelName A unique name for this subscription
   * @param options Subscription options (table, schema, event, filter)
   * @param callback Function to call when events occur
   * @returns An object with an unsubscribe method
   */
  public subscribe(
    channelName: string,
    options: SubscriptionOptions,
    callback: SubscriptionCallback
  ): { unsubscribe: () => void } {
    // Check if subscription already exists
    if (this.subscriptions.has(channelName)) {
      const existingChannel = this.subscriptions.get(channelName);
      if (existingChannel) {
        console.log(`Using existing subscription for ${channelName}`);
        return {
          unsubscribe: () => this.unsubscribe(channelName)
        };
      }
    }

    // Set defaults
    const {
      table,
      schema = 'public',
      event = '*',
      filter = ''
    } = options;

    // Create channel
    const channel = supabase
      .channel(channelName)
      .on('postgres_changes' as any, {
        event,
        schema,
        table,
        filter
      }, (payload: any) => {
        callback(payload);
      })
      .subscribe((status: any) => {
        console.log(`Subscription status for ${channelName}:`, status);
      });

    // Store subscription
    this.subscriptions.set(channelName, channel);

    // Return unsubscribe function
    return {
      unsubscribe: () => this.unsubscribe(channelName)
    };
  }

  /**
   * Unsubscribe from a specific channel
   * @param channelName The channel name to unsubscribe from
   */
  public unsubscribe(channelName: string): void {
    const channel = this.subscriptions.get(channelName);
    if (channel) {
      channel.unsubscribe();
      this.subscriptions.delete(channelName);
      console.log(`Unsubscribed from ${channelName}`);
    }
  }

  /**
   * Subscribe to chat messages for a specific chat
   * @param chatId The chat ID to subscribe to
   * @param callback Function to call when new messages arrive
   * @returns An object with an unsubscribe method
   */
  public subscribeToChat(
    chatId: string,
    callback: SubscriptionCallback
  ): { unsubscribe: () => void } {
    return this.subscribe(
      `chat:${chatId}`,
      {
        table: 'messages',
        event: 'INSERT',
        filter: `chat_id=eq.${chatId}`
      },
      callback
    );
  }

  /**
   * Subscribe to new matches for a user
   * @param userId The user ID to subscribe to matches for
   * @param callback Function to call when new matches occur
   * @returns An object with an unsubscribe method
   */
  public subscribeToMatches(
    userId: string,
    callback: SubscriptionCallback
  ): { unsubscribe: () => void } {
    return this.subscribe(
      `matches:${userId}`,
      {
        table: 'likes',
        event: 'INSERT',
        filter: `likee_id=eq.${userId}`
      },
      callback
    );
  }

  /**
   * Unsubscribe from all active channels
   */
  public unsubscribeAll(): void {
    this.subscriptions.forEach((channel, name) => {
      channel.unsubscribe();
      console.log(`Unsubscribed from ${name}`);
    });
    this.subscriptions.clear();
  }
} 