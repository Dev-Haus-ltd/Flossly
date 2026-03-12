<template>
  <v-sheet color="background">
    <div class="cust-border d-flex align-center">
      <p class="mr-1">Support Chat</p>
    </div>
    <div class="mt-5 px-5">
      <v-card class="support-chat-card" elevation="0">
          <div class="card-body">
            <div class="chat-container">
              <!-- Conversations List -->
              <div class="conversations-panel">
        <div class="panel-header">
          <h3>Conversations</h3>
          <v-btn icon size="small" variant="text" @click="fetchConversations">
            <v-icon>mdi-refresh</v-icon>
          </v-btn>
        </div>
        
        <div class="conversations-list">
          <div
            v-for="conversation in conversations"
            :key="conversation.id"
            class="conversation-item"
            :class="{ active: selectedConversation?.id === conversation.id }"
            @click="selectConversation(conversation)"
          >
            <v-avatar size="40" :color="conversation.type === 'report-issue' ? 'error' : 'primary'">
              <v-icon color="white">
                {{ getConversationIcon(conversation.type) }}
              </v-icon>
            </v-avatar>
            <div class="conversation-info">
              <div class="conversation-header">
                <span class="user-name">{{ conversation.userName }}</span>
                <span class="time">{{ formatTime(conversation.timestamp) }}</span>
              </div>
              <p class="conversation-type">{{ getConversationTypeLabel(conversation.type) }}</p>
              <p class="last-message">{{ conversation.lastMessage }}</p>
            </div>
            <v-badge
              v-if="conversation.unread"
              :content="conversation.unread"
              color="error"
              class="unread-badge"
            />
          </div>
        </div>
      </div>

      <!-- Chat Messages -->
      <div class="messages-panel">
        <div v-if="selectedConversation" class="chat-content">
          <!-- Chat Header -->
          <div class="chat-header">
            <div class="user-info">
              <v-avatar size="40" color="primary">
                <span class="avatar-text">{{ getUserInitials(selectedConversation.userName) }}</span>
              </v-avatar>
              <div>
                <h3>{{ selectedConversation.userName }}</h3>
                <p class="user-email">{{ selectedConversation.userEmail }}</p>
              </div>
            </div>
            <div class="header-actions">
              <v-chip :color="getTypeColor(selectedConversation.type)" size="small">
                {{ getConversationTypeLabel(selectedConversation.type) }}
              </v-chip>
              
              <!-- Status Dropdown (only for support agents) -->
              <v-menu v-if="isSupportAgent" offset-y>
                <template v-slot:activator="{ props }">
                  <v-chip
                    v-bind="props"
                    :color="getStatusColor(selectedConversation.status)"
                    size="small"
                    class="status-chip"
                  >
                    {{ getStatusLabel(selectedConversation.status) }}
                    <v-icon end size="small">mdi-chevron-down</v-icon>
                  </v-chip>
                </template>
                <v-list density="compact">
                  <v-list-item
                    v-for="status in statusOptions"
                    :key="status.value"
                    @click="updateConversationStatus(status.value)"
                  >
                    <v-list-item-title>
                      <v-chip :color="status.color" size="x-small" class="mr-2">
                        {{ status.label }}
                      </v-chip>
                    </v-list-item-title>
                  </v-list-item>
                </v-list>
              </v-menu>
              <!-- Status chip (read-only for customers) -->
              <v-chip v-else :color="getStatusColor(selectedConversation.status)" size="small">
                {{ getStatusLabel(selectedConversation.status) }}
              </v-chip>
            </div>
          </div>

          <!-- Messages -->
          <div class="messages-area" ref="messagesAreaRef">
            <div v-if="isConversationLoading" class="d-flex justify-center py-6">
              <v-progress-circular indeterminate color="primary" />
            </div>
            <div
              v-for="message in selectedConversation.messages"
              :key="message.id"
              class="message"
              :class="{ 'user-message': message.isUser, 'support-message': !message.isUser }"
            >
              <!-- User message (left aligned) -->
              <template v-if="message.isUser">
                <v-avatar size="40" color="primary" class="user-avatar">
                  <span class="avatar-text">{{ getUserInitials(selectedConversation.userName) }}</span>
                </v-avatar>
                <div class="message-bubble user-bubble">
                  <p>{{ message.text }}</p>
                  
                  <!-- Attachments -->
                  <div v-if="message.attachments && message.attachments.length > 0" class="message-attachments">
                    <div
                      v-for="attachment in message.attachments"
                      :key="attachment.id"
                      class="message-attachment"
                      @click="openAttachment(attachment)"
                    >
                      <v-icon size="16" class="attachment-icon">{{ getAttachmentIcon(attachment) }}</v-icon>
                      <span class="attachment-name">{{ attachment.originalFileName }}</span>
                      <span class="attachment-size">({{ formatFileSize(attachment.fileSize) }})</span>
                    </div>
                  </div>
                  
                  <span class="message-time">{{ formatTime(message.timestamp) }}</span>
                </div>
              </template>
              
              <!-- Support/AI message (right aligned, blue like chatbot user) -->
              <template v-else>
                <div class="message-bubble support-bubble">
                  <p>{{ message.text }}</p>
                  
                  <!-- Attachments -->
                  <div v-if="message.attachments && message.attachments.length > 0" class="message-attachments">
                    <div
                      v-for="attachment in message.attachments"
                      :key="attachment.id"
                      class="message-attachment"
                      @click="openAttachment(attachment)"
                    >
                      <v-icon size="16" class="attachment-icon">{{ getAttachmentIcon(attachment) }}</v-icon>
                      <span class="attachment-name">{{ attachment.originalFileName }}</span>
                      <span class="attachment-size">({{ formatFileSize(attachment.fileSize) }})</span>
                    </div>
                  </div>
                </div>
                <v-avatar size="40" color="success" class="support-avatar">
                  <v-icon color="white" size="20">mdi-face-agent</v-icon>
                </v-avatar>
              </template>
            </div>
            <!-- Bottom sentinel for reliable scroll-to-last-message -->
           <div ref="bottomSentinel" style="height: 1px;"></div>
         </div>

          <!-- Reply Input -->
          <div class="reply-section">
            <v-textarea
              v-model="replyMessage"
              placeholder="Type your reply..."
              variant="outlined"
              hide-details
              class="reply-textarea"
              color="grey-lighten-1"
              rows="1"
              auto-grow
              max-rows="4"
              @keydown.enter.prevent="sendReply"
            >
              <template #prepend-inner>
                <v-btn
                  icon
                  size="small"
                  variant="text"
                  color="grey-darken-1"
                  @click="openFileUpload"
                  class="attach-btn"
                >
                  <v-icon size="20">mdi-paperclip</v-icon>
                </v-btn>
              </template>
              <template #append-inner>
                <v-btn
                  size="small"
                  color="primary"
                  :disabled="!replyMessage.trim()"
                  @click="sendReply"
                  class="send-btn"
                  variant="flat"
                  rounded="xl"
                >
                  Send
                  <template #append>
                    <v-icon size="16">mdi-send</v-icon>
                  </template>
                </v-btn>
              </template>
            </v-textarea>
            
            <!-- Hidden file input -->
            <input
              ref="fileInput"
              type="file"
              multiple
              accept="image/*,video/*,.pdf,.doc,.docx"
              style="display: none"
              @change="handleFileSelection"
            />
          </div>
        </div>

        <!-- Empty State -->
        <div v-else class="empty-state">
          <v-icon size="64" color="grey-lighten-1">mdi-chat-outline</v-icon>
          <h3>Select a conversation</h3>
          <p>Choose a conversation from the left to view and respond</p>
        </div>
      </div>
            </div>
          </div>
        </v-card>
    </div>
  </v-sheet>
</template>

<script setup>
definePageMeta({
  layout: 'home'
})

import { ref, onMounted, computed, watch, onUnmounted, nextTick } from 'vue';
import { useRouter } from 'vue-router';
import { useDeveloperAccess } from '@/composables/useDeveloperAccess';
import { useAuthStore } from '@/stores/auth';
import supportChatService from '@/services/supportChatService';
import { useFCM } from '@/composables/useFCM';

const router = useRouter();
const authStore = useAuthStore();
const { isDeveloper, DEVELOPER_EMAILS } = useDeveloperAccess();

const isLoading = ref(false);

// Start empty: always load real conversations from API
const conversations = ref([]);

const selectedConversation = ref(null);
const replyMessage = ref('');
const isConversationLoading = ref(false);

// File upload refs and state
const fileInput = ref(null);
const attachedFiles = ref([]);

// Status options for the dropdown
const statusOptions = ref([
  { value: 'active', label: 'Submitted', color: 'blue-grey' },
  { value: 'in-progress', label: 'In progress', color: 'orange' },
  { value: 'resolved', label: 'Resolved', color: 'success' },
  { value: 'closed', label: 'Closed', color: 'grey' }
]);

const { lastNotification } = useFCM();

// Handle FCM notifications for chatbot messages
const handleFCMNotification = (notification) => {
  if (!notification) return;
  
  const notifData = notification.data || {};
  const type = notifData.type;
  
  if (type === 'chatbot_message') {
    const convId = notifData.conversationId ? parseInt(notifData.conversationId) : null;
    const msg = notifData.message ? JSON.parse(notifData.message) : null;
    
    if (!convId || !msg) return;

    // If currently viewing this conversation, append
    if (selectedConversation.value?.id === convId) {
      const tmpId = msg?.metadata?.clientTempId;
      if (tmpId) {
        const idx = selectedConversation.value.messages?.findIndex(m => m.id === tmpId);
        if (idx !== -1) {
          selectedConversation.value.messages[idx] = {
            id: msg.id,
            text: msg.message,
            isUser: msg.senderType === 'user',
            senderType: msg.senderType,
            timestamp: new Date(msg.createdAt)
          };
          selectedConversation.value.messages.sort((a, b) => a.timestamp - b.timestamp);
          return;
        }
      }

      const exists = selectedConversation.value.messages?.some(m => m.id === msg.id);
      if (!exists) {
        selectedConversation.value.messages.push({
          id: msg.id,
          text: msg.message,
          isUser: msg.senderType === 'user',
          senderType: msg.senderType,
          timestamp: new Date(msg.createdAt),
          attachments: msg.attachments || []
        });
        selectedConversation.value.messages.sort((a, b) => a.timestamp - b.timestamp);
        nextTick(() => requestAnimationFrame(() => scrollMessagesToBottom()));
      }
    }

    // Update conversation list preview + timestamp
    const convInList = conversations.value.find(c => c.id === convId);
    if (convInList) {
      convInList.lastMessage = msg.message;
      convInList.timestamp = new Date(msg.createdAt);
      if (msg.senderType === 'user' && selectedConversation.value?.id !== convId) {
        convInList.unread = (convInList.unread || 0) + 1;
      }
    }
  } else if (type === 'chatbot_status_update') {
    const convId = notifData.conversationId ? parseInt(notifData.conversationId) : null;
    const status = notifData.status;
    
    if (convId && status) {
      // Update current conversation status
      if (selectedConversation.value?.id === convId) {
        selectedConversation.value.status = status;
      }
      
      // Update in conversations list
      const conv = conversations.value.find(c => c.id === convId);
      if (conv) {
        conv.status = status;
      }
    }
  }
};

const selectConversation = async (conversation) => {
  selectedConversation.value = conversation;

  isConversationLoading.value = true;
  
  // Load messages if not already loaded
  if (!conversation.messages || conversation.messages.length === 0) {
    const messages = await loadConversationMessages(conversation.id);
    conversation.messages = messages;
  }

  isConversationLoading.value = false;
  await nextTick();
  requestAnimationFrame(() => {
    scrollMessagesToBottom();
    requestAnimationFrame(() => scrollMessagesToBottom());
  });
  
  // Mark messages as read
  if (conversation.unread > 0) {
    try {
      await supportChatService.markMessagesAsRead(conversation.id);
      conversation.unread = 0;
    } catch (error) {
      console.error('Failed to mark messages as read:', error);
    }
  }
};

// File upload functions
const openFileUpload = () => {
  fileInput.value?.click();
};

const handleFileSelection = async (event) => {
  const files = Array.from(event.target.files || []);
  if (files.length === 0) return;

  if (!selectedConversation.value) {
    alert('Please select a conversation first');
    return;
  }

  for (const file of files) {
    try {
      // First create a placeholder message to get messageId
      const messageResponse = await supportChatService.createMessage({
        conversationId: selectedConversation.value.id,
        message: `[File: ${file.name}]`,
        senderType: 'support',
        clientTempId: Date.now()
      });

      if (!messageResponse.success) {
        throw new Error('Failed to create message for attachment');
      }

      const formData = new FormData();
      formData.append('file', file);
      formData.append('messageId', messageResponse.data.id.toString());
      formData.append('conversationId', selectedConversation.value.id.toString());
      
      const response = await supportChatService.uploadAttachment(formData);
      
      if (response.success) {
        // File uploaded successfully - the attachment is linked to the message
        console.log('File uploaded:', response.data);
      } else {
        console.error('Upload failed:', response.message);
        alert(`Failed to upload ${file.name}: ${response.message}`);
      }
    } catch (error) {
      console.error('Upload error:', error);
      alert(`Error uploading ${file.name}: ${error.message}`);
    }
  }
  
  // Clear the input and refresh conversation to show new messages
  event.target.value = '';
  if (selectedConversation.value) {
    await selectConversation(selectedConversation.value);
  }
};

const sendReply = async () => {
  if (!replyMessage.value.trim() || !selectedConversation.value) return;
  
  // v-textarea tends to include a trailing newline; trim it before sending
  const messageText = replyMessage.value.trim();
  const tempId = Date.now();
  replyMessage.value = '';
  
  // Optimistically add message to UI immediately
  const tempMessage = {
    id: tempId,
    text: messageText,
    isUser: false,
    senderType: 'support',
    timestamp: new Date(),
    attachments: []
  };
  
  selectedConversation.value.messages.push(tempMessage);
  await nextTick();
  requestAnimationFrame(() => scrollMessagesToBottom());
  
  try {
    const response = await supportChatService.createMessage({
      conversationId: selectedConversation.value.id,
      message: messageText,
      senderType: 'support',
      clientTempId: tempId
    });
    
    if (response.success) {
      // Replace temp message with real message from server
      const msgIndex = selectedConversation.value.messages.findIndex(m => m.id === tempId);
      if (msgIndex !== -1) {
        selectedConversation.value.messages[msgIndex] = {
          id: response.data.id,
          text: messageText,
          isUser: false,
          senderType: 'support',
          timestamp: new Date(response.data.createdAt),
          attachments: []
        };
      }
      
      // Update last message in conversation list
      selectedConversation.value.lastMessage = messageText;
      selectedConversation.value.timestamp = new Date();
      
      // Update in conversations list
      const conv = conversations.value.find(c => c.id === selectedConversation.value.id);
      if (conv) {
        conv.lastMessage = messageText;
        conv.timestamp = new Date();
      }
    } else {
      throw new Error('Failed to send message');
    }
  } catch (error) {
    console.error('Failed to send reply:', error);
    
    // Remove the temp message on error
    const msgIndex = selectedConversation.value.messages.findIndex(m => m.id === tempId);
    if (msgIndex !== -1) {
      selectedConversation.value.messages.splice(msgIndex, 1);
    }
    
    alert('Failed to send message. Please try again.');
    replyMessage.value = messageText; // Restore message on error
  }
};

const getConversationIcon = (type) => {
  const icons = {
    'ask-question': 'mdi-message-reply',
    'report-issue': 'mdi-bug',
    'request-feature': 'mdi-lightbulb'
  };
  return icons[type] || 'mdi-message';
};

const getConversationTypeLabel = (type) => {
  const labels = {
    'ask-question': 'Question',
    'report-issue': 'Issue',
    'request-feature': 'Feature Request'
  };
  return labels[type] || type;
};

const getTypeColor = (type) => {
  const colors = {
    'ask-question': 'primary',
    'report-issue': 'error',
    'request-feature': 'warning'
  };
  return colors[type] || 'grey';
};

const getUserInitials = (name) => {
  return name.split(' ').map(n => n[0]).join('').toUpperCase();
};

const getStatusLabel = (status) => {
  const statusObj = statusOptions.value.find(s => s.value === status);
  return statusObj ? statusObj.label : status;
};

const getStatusColor = (status) => {
  const statusObj = statusOptions.value.find(s => s.value === status);
  return statusObj ? statusObj.color : 'grey';
};

const updateConversationStatus = async (newStatus) => {
  if (!selectedConversation.value) return;
  
  try {
    const response = await supportChatService.updateConversationStatus(
      selectedConversation.value.id,
      newStatus
    );
    
    if (response.success) {
      // Update local conversation status
      selectedConversation.value.status = newStatus;
      
      // Update in conversations list
      const conv = conversations.value.find(c => c.id === selectedConversation.value.id);
      if (conv) {
        conv.status = newStatus;
      }
    }
  } catch (error) {
    console.error('Failed to update conversation status:', error);
  }
};

const messagesAreaRef = ref(null);
const bottomSentinel = ref(null);
const scrollMessagesToBottom = () => {
  if (bottomSentinel.value?.scrollIntoView) {
    bottomSentinel.value.scrollIntoView({ block: 'end' });
    return;
  }
  if (messagesAreaRef.value) {
    messagesAreaRef.value.scrollTop = messagesAreaRef.value.scrollHeight;
  }
};

const formatTime = (timestamp) => {
  const now = new Date();
  const diff = now - new Date(timestamp);
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7) return `${days}d ago`;
  
  return new Date(timestamp).toLocaleDateString();
};

// Attachment helper functions
const getAttachmentIcon = (attachment) => {
  if (!attachment) return 'mdi-file';
  
  const category = attachment.fileCategory;
  const ext = attachment.fileExtension?.toLowerCase();
  
  if (category === 'image' || ['.png', '.jpg', '.jpeg', '.gif', '.svg'].includes(ext)) {
    return 'mdi-file-image';
  } else if (category === 'video' || ['.mp4', '.mov', '.avi', '.webm'].includes(ext)) {
    return 'mdi-video';
  } else if (['.pdf'].includes(ext)) {
    return 'mdi-file-pdf-box';
  } else if (['.doc', '.docx'].includes(ext)) {
    return 'mdi-file-word';
  } else if (['.xls', '.xlsx'].includes(ext)) {
    return 'mdi-file-excel';
  } else if (['.txt'].includes(ext)) {
    return 'mdi-text-box';
  }
  return 'mdi-file';
};

const formatFileSize = (bytes) => {
  if (!bytes) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
};

const openAttachment = (attachment) => {
  if (!attachment || !attachment.filePath) return;
  window.open(attachment.filePath, '_blank');
};

// Fetch conversations from backend
const fetchConversations = async () => {
  isLoading.value = true;
  try {
    const response = await supportChatService.getConversations({
      limit: 50,
      offset: 0
    });

    if (response.success) {
      const rows = Array.isArray(response.data) ? response.data : [];
      conversations.value = rows.map(conv => ({
        id: conv.id,
        userName: conv.user?.fullName || 'Unknown User',
        userEmail: conv.user?.email || '',
        type: conv.conversationType,
        status: conv.status || 'active', // Add status field with default
        lastMessage: conv.messages?.[0]?.message || 'No messages yet',
        timestamp: new Date(conv.lastMessageAt || conv.createdAt),
        unread: conv.messages?.filter(m => !m.isRead && m.senderType === 'user').length || 0,
        messages: [] // Will be loaded when conversation is selected
      }));
    }
  } catch (error) {
    console.error('Failed to fetch conversations:', error);
  } finally {
    isLoading.value = false;
  }
};

// Fetch conversation details with messages
const loadConversationMessages = async (conversationId) => {
  try {
    const response = await supportChatService.getConversationById(conversationId);

    if (response.success) {
      const conv = response.data;
      const mapped = conv.messages?.map(msg => ({
        id: msg.id,
        text: msg.message,
        isUser: msg.senderType === 'user',
        senderType: msg.senderType,
        timestamp: new Date(msg.createdAt),
        attachments: msg.attachments || [] // Include attachments
      })) || [];

      // Always display oldest -> newest
      return mapped.sort((a, b) => a.timestamp - b.timestamp);
    }
  } catch (error) {
    console.error('Failed to load conversation messages:', error);
  }
  return [];
};

const checkDeveloperAccess = () => {
  if (authStore.loggedUser && !isDeveloper.value) {
    router.push('/');
  }
};

onMounted(() => {
  checkDeveloperAccess();
  
  // Watch for FCM notifications
  watch(lastNotification, handleFCMNotification, { immediate: true });

  console.log('Support Chat page mo unted');
  fetchConversations();
  
  // Keep a slow refresh as a fallback
  const interval = setInterval(fetchConversations, 30000);
  
  onUnmounted(() => {
    clearInterval(interval);
  });
});
</script>

<style scoped lang="scss">
.cust-border {
  border-bottom: 1px solid #dbdbdb;
  padding: 17px;
  background: white;
  position: sticky;
  top: 0;
  z-index: 10;
  p {
    font-size: 12px;
  }
}

.support-chat-card {
  border: 1px solid #e3e3e3;
  border-radius: 14px;
  background: #ffffff;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  /* Fixed height similar to CRM - constrained to viewport */
  height: calc(100vh - 180px);
}

.card-header {
  padding: 16px 20px;
  font-weight: 600;
  font-size: 14px;
  color: #1f2937;
  border-bottom: 1px solid #efefef;
  background: #fafafa;
  flex-shrink: 0; /* Prevent shrinking */
}

.card-body {
  padding: 0;
  flex: 1;
  min-height: 0;
  overflow: hidden; /* Ensure container doesn't expand */
}

.chat-container {
  display: grid;
  grid-template-columns: 350px 1fr;
  gap: 0;
  height: 100%;
  overflow: hidden; /* Ensure container doesn't expand */
}

/* Conversations Panel */
.conversations-panel {
  background: white;
  border-right: 1px solid #efefef;
  display: flex;
  flex-direction: column;
  height: 100%;
  overflow: hidden; /* Ensure container doesn't expand */
}

.panel-header {
  padding: 16px 20px;
  border-bottom: 1px solid #e0e0e0;
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-shrink: 0; /* Prevent shrinking */

  h3 {
    font-size: 18px;
    font-weight: 600;
    margin: 0;
  }
}

.conversations-list {
  flex: 1;
  overflow-y: auto;
  min-height: 0; /* Important for flex child to allow scrolling */
}

.conversation-item {
  padding: 16px 20px;
  display: flex;
  gap: 12px;
  cursor: pointer;
  border-bottom: 1px solid #f5f5f5;
  transition: background 0.2s;
  position: relative;

  &:hover {
    background: #f9f9f9;
  }

  &.active {
    background: #f0f4ff;
    border-left: 3px solid #263AAD;
  }
}

.conversation-info {
  flex: 1;
  min-width: 0;
}

.conversation-header {
  display: flex;
  justify-content: space-between;
  margin-bottom: 4px;
}

.user-name {
  font-weight: 600;
  font-size: 14px;
}

.time {
  font-size: 12px;
  color: #999;
}

.conversation-type {
  font-size: 12px;
  color: #666;
  margin: 0 0 4px 0;
}

.last-message {
  font-size: 13px;
  color: #666;
  margin: 0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.unread-badge {
  position: absolute;
  right: 16px;
  top: 16px;
}

/* Messages Panel */
.messages-panel {
  background: white;
  display: flex;
  flex-direction: column;
  height: 100%;
}

.chat-content {
  display: flex;
  flex-direction: column;
  height: 100%;
  overflow: hidden; /* Prevent expansion */
}

.chat-header {
  padding: 16px 20px;
  border-bottom: 1px solid #e0e0e0;
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-shrink: 0; /* Prevent shrinking */
}

.user-info {
  display: flex;
  align-items: center;
  gap: 12px;

  h3 {
    font-size: 16px;
    font-weight: 600;
    margin: 0;
  }

  .user-email {
    font-size: 13px;
    color: #666;
    margin: 0;
  }
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 8px;
}

.status-chip {
  cursor: pointer;
  transition: opacity 0.2s;

  &:hover {
    opacity: 0.8;
  }
}

.avatar-text {
  font-size: 16px;
  font-weight: 600;
  color: white;
}

.messages-area {
  flex: 1;
  padding: 20px;
  overflow-y: auto;
  overflow-x: hidden;
  max-height: calc(100vh - 370px); /* Increased by 30px for more message space */
  min-height: 0; /* Important for flex child to allow scrolling */
  background: white;
}

.message {
  display: flex;
  gap: 12px;
  align-items: center;
  max-width: 100%;
  margin-bottom: 20px;
  position: relative;
}

.message:last-child {
  margin-bottom: 0;
}

.user-message {
  align-self: flex-start;
  justify-content: flex-start;

  .message-bubble {
    background: white;
    color: #1a1a1a;
    border-radius: 20px;
    border: 1px solid hsla(0, 0%, 86%, 1);
    position: relative;
  }

  .message-bubble::before {
    content: '';
    position: absolute;
    left: -8px;
    top: 50%;
    transform: translateY(-50%);
    width: 0;
    height: 0;
    border-style: solid;
    border-width: 8px 8px 8px 0;
    border-color: transparent hsla(0, 0%, 86%, 1) transparent transparent;
  }

  .message-bubble::after {
    content: '';
    position: absolute;
    left: -6px;
    top: 50%;
    transform: translateY(-50%);
    width: 0;
    height: 0;
    border-style: solid;
    border-width: 7px 7px 7px 0;
    border-color: transparent white transparent transparent;
  }
}

.support-message {
  align-self: flex-end;
  justify-content: flex-end;

  .message-bubble {
    background: #E8F0FE;
    color: #1a1a1a;
    border-radius: 20px;
    position: relative;
    order: 1;
  }

  .message-bubble::before {
    content: '';
    position: absolute;
    right: -8px;
    top: 50%;
    transform: translateY(-50%);
    width: 0;
    height: 0;
    border-style: solid;
    border-width: 8px 0 8px 8px;
    border-color: transparent transparent transparent #E8F0FE;
  }

  .support-avatar {
    order: 2;
  }
}

/* message-logo kept for future attachments/avatars if needed */
.message-logo {
  width: 32px;
  height: 32px;
  object-fit: contain;
  flex-shrink: 0;
}

.message-bubble {
  padding: 16px;
  width: fit-content;
  max-width: calc(100% - 52px);
  display: inline-block;
  word-break: break-word;
  white-space: pre-wrap;
  overflow-wrap: break-word;

  p {
    margin: 0 0 2px 0;
    font-size: 14px;
    line-height: 1.5;
  }
}

.message-time {
  display: block;
  margin-top: 4px;
  font-size: 10px;
  opacity: 0.8;
  color: #999;
  text-align: right;
}

.user-avatar {
  flex-shrink: 0;
}

.support-avatar {
  flex-shrink: 0;
}

/* Message Attachments */
.message-attachments {
  margin-top: 8px;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.message-attachment {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  background: white;
  border-radius: 50px;
  cursor: pointer;
  transition: background 0.2s;
  font-size: 12px;
  color: #1a1a1a;
  border: 1px solid #e0e0e0;
}

.user-message .message-attachment {
  background: white;
  color: #1a1a1a;
  border: 1px solid #e0e0e0;
}

.user-message .message-attachment:hover {
  background: #f5f5f5;
}

.support-message .message-attachment {
  background: white;
  color: #1a1a1a;
  border: 1px solid #e0e0e0;
}

.support-message .message-attachment:hover {
  background: #f5f5f5;
}

.attachment-icon {
  flex-shrink: 0;
}

.attachment-name {
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-weight: 500;
}

.attachment-size {
  flex-shrink: 0;
  opacity: 0.7;
  font-size: 11px;
}

.reply-section {
  padding: 20px;
  border-top: 1px solid #e0e0e0;
}

.reply-textarea :deep(.v-field) {
  border-radius: 24px;
  border-color: #d0d0d0;
}

.reply-textarea :deep(.v-field__outline__start),
.reply-textarea :deep(.v-field__outline__end) {
  border-color: #d0d0d0 !important;
}

.reply-textarea :deep(.v-field--focused .v-field__outline__start),
.reply-textarea :deep(.v-field--focused .v-field__outline__end) {
  border-color: #b0b0b0 !important;
}

.reply-textarea :deep(.v-field__input) {
  font-size: 14px;
}

.reply-textarea :deep(::placeholder) {
  font-size: 14px;
  opacity: 0.6;
}

.send-btn {
  margin-right: -8px;
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  color: #999;

  h3 {
    margin: 16px 0 8px;
    color: #666;
  }

  p {
    margin: 0;
    font-size: 14px;
  }
}

/* Reply Section */
.reply-section {
  padding: 16px 20px;
  border-top: 1px solid #e0e0e0;
  background: white;
  flex-shrink: 0; /* Prevent shrinking */
  position: sticky;
  bottom: 0;
  z-index: 1;
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  height: 100%;
  color: #666;
  
  h3 {
    margin: 16px 0 8px 0;
    font-size: 18px;
    font-weight: 600;
  }
  
  p {
    margin: 0;
    font-size: 14px;
  }
}

</style>
