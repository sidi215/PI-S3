import { api } from '@/lib/api';

export interface ConversationParticipant {
  id: number;
  username: string;
  first_name: string;
  last_name: string;
  user_type: 'farmer' | 'buyer';
  profile_picture?: string;
}

export interface Message {
  id: number;
  conversation: number;
  sender: ConversationParticipant;
  content: string;
  message_type: string;
  media_url?: string;
  file_name?: string;
  file_size?: number;
  is_read: boolean;
  read_by: number[];
  metadata: any;
  created_at: string;
  updated_at: string;
}

export interface Conversation {
  id: number;
  participants: ConversationParticipant[];
  created_at: string;
  updated_at: string;
  last_message?: Message | null;
  order?: number | null;
  product?: number | null;
}

export interface Notification {
  id: number;
  notification_type: string;
  title: string;
  message: string;
  is_read: boolean;
  data: any;
  created_at: string;
}

class MessagingService {
  async getConversations(role?: 'farmer' | 'buyer'): Promise<Conversation[]> {
    try {
      const response = await api.get('/messaging/conversations/', {
        params: role ? { role } : undefined,
      });
      return Array.isArray(response.data) ? response.data : [];
    } catch (error) {
      console.error('Error fetching conversations:', error);
      return [];
    }
  }

  async getFarmerConversations(): Promise<Conversation[]> {
    return this.getConversations('farmer');
  }

  async getBuyerConversations(): Promise<Conversation[]> {
    return this.getConversations('buyer');
  }

  async getConversation(id: number): Promise<Conversation> {
    const response = await api.get(`/messaging/conversations/${id}/`);
    return response.data;
  }

  async createConversation(
    participantIds: number[],
    orderId?: number,
    productId?: number
  ): Promise<Conversation> {
    const payload: any = { participant_ids: participantIds };
    if (orderId) payload.order = orderId;
    if (productId) payload.product = productId;

    const response = await api.post('/messaging/conversations/', payload);
    return response.data;
  }

  async startConversationWithBuyer(
    buyerId: number,
    orderId?: number,
    productId?: number
  ): Promise<Conversation> {
    return this.createConversation([buyerId], orderId, productId);
  }

  async startConversationWithFarmer(
    farmerId: number,
    orderId?: number,
    productId?: number
  ): Promise<Conversation> {
    return this.createConversation([farmerId], orderId, productId);
  }

  /* Messages */

  async getMessages(conversationId: number): Promise<Message[]> {
    if (!conversationId) return [];

    try {
      const response = await api.get(
        `/messaging/conversations/${conversationId}/messages/`
      );
      return Array.isArray(response.data) ? response.data : [];
    } catch (error) {
      console.error('Error fetching messages:', error);
      return [];
    }
  }

  async sendMessage(
    conversationId: number,
    content: string,
    messageType: string = 'text',
    metadata: any = {}
  ): Promise<Message> {
    if (!conversationId || !content.trim()) {
      throw new Error('Conversation ou message invalide');
    }

    const response = await api.post('/messaging/messages/', {
      conversation_id: conversationId,
      content,
      message_type: messageType,
      metadata,
    });

    return response.data;
  }

  async markMessageAsRead(messageId: number): Promise<void> {
    await api.post(`/messaging/messages/${messageId}/mark_read/`);
  }

  async getUnreadMessagesCount(): Promise<number> {
    const response = await api.get('/messaging/messages/unread_count/');
    return response.data?.unread_count ?? 0;
  }

  /* Notifications */

  async getNotifications(): Promise<Notification[]> {
    try {
      const response = await api.get('/messaging/notifications/');
      return Array.isArray(response.data) ? response.data : [];
    } catch (error) {
      console.error('Error fetching notifications:', error);
      return [];
    }
  }

  async markNotificationAsRead(notificationId: number): Promise<void> {
    await api.post(`/messaging/notifications/${notificationId}/mark_read/`);
  }

  async markAllNotificationsAsRead(): Promise<void> {
    await api.post('/messaging/notifications/mark_all_read/');
  }

  async getUnreadNotificationsCount(): Promise<number> {
    const response = await api.get('/messaging/notifications/unread_count/');
    return response.data?.unread_count ?? 0;
  }
}

export const messagingService = new MessagingService();
