<template>
  <div class="text-center">
    <v-menu
      v-model="isOpen"
      location="top end"
      offset="10"
      :close-on-content-click="false"
      :scrim="false"
      :min-width="380"
      content-class="chatbot-menu-content"
    >
      <!-- Activator Button -->
      <template #activator="{ props }">
        <div class="chatbot-container" v-bind="props">
          <img
            src="@/assets/icons/Support/Chat.svg"
            alt="Chat Icon"
            class="chatbot-icon"
            draggable="false"
          />
          <v-badge
            v-if="unreadCount > 0"
            :content="unreadCount"
            color="error"
            class="chatbot-badge"
          />
        </div>
      </template>
      <v-card class="chatbot-dialog" elevation="12">
        <!-- Header Container -->
        <div class="chatbot-header-container">
          <!-- Gradient Header Section -->
          <div class="chatbot-header" :class="{ 'home-view': !isChatView && activeTab === 'home', 'messages-view': !isChatView && activeTab === 'messages', 'chat-view': isChatView }">
            <div class="header-content" :class="{ 'home-view-content': !isChatView && activeTab === 'home', 'chat-view-content': isChatView || activeTab === 'messages' }">
              <!-- Home view header (with gradient and avatars) -->
              <template v-if="!isChatView && activeTab === 'home'">
                <!-- Team Avatars -->
                <div class="team-avatars">
                  <v-avatar
                    v-for="(member, index) in teamMembers"
                    :key="index"
                    :class="['team-avatar', `avatar-${index}`]"
                    size="50"
                  >
                    <v-img v-if="member.image" :src="member.image" />
                    <span v-else class="avatar-text">{{ member.initials }}</span>
                  </v-avatar>
                </div>

                <!-- Greeting -->
                <h2 class="greeting">Hi {{ userName }} 👋</h2>
                <h3 class="tagline">How can we help?</h3>
              </template>

              <!-- Messages tab header -->
              <template v-else-if="!isChatView && activeTab === 'messages'">
                <h2 class="greeting chat-view-title messages-title">Messages</h2>
              </template>

              <!-- Chat view header -->
              <template v-else-if="isChatView">
                <!-- Title bar with back and close buttons -->
                <div class="chat-title-bar">
                  <!-- Back button -->
                  <v-btn
                    class="back-btn-inline"
                    icon
                    size="small"
                    variant="text"
                    @click="goBack"
                  >
                    <v-icon color="black">mdi-arrow-left</v-icon>
                  </v-btn>

                  <!-- Title -->
                  <h2 class="greeting chat-view-title">{{ selectedOption?.title }}</h2>

                  <!-- Close Button -->
                  <v-btn
                    class="close-btn-inline"
                    icon
                    size="small"
                    variant="text"
                    @click="toggleChat"
                  >
                    <v-icon color="black">mdi-close</v-icon>
                  </v-btn>
                </div>
              </template>
            </div>

            <!-- Close Button (for non-chat views) -->
            <v-btn
              v-if="!isChatView"
              class="close-btn"
              icon
              size="small"
              variant="text"
              @click="toggleChat"
            >
              <v-icon :color="(isChatView || activeTab === 'messages') ? 'black' : 'white'">mdi-close</v-icon>
            </v-btn>
          </div>
          
          <!-- Progress Indicator Section (white background) -->
          <div v-if="isChatView && currentConversationData && selectedOption?.id !== 'ask-question'" class="progress-indicator-section">
            <div class="progress-indicator">
              <div class="progress-steps">
                <div 
                  v-for="(step, index) in progressSteps" 
                  :key="index"
                  class="progress-step"
                  :class="{ 
                    'completed': index < currentStepIndex,
                    'active': index === currentStepIndex,
                    'pending': index > currentStepIndex
                  }"
                >
                  <!-- Connecting line (before circle, except first) -->
                  <div 
                    v-if="index > 0"
                    class="step-line"
                    :class="{ 
                      'completed': index <= currentStepIndex,
                      'pending': index > currentStepIndex
                    }"
                  ></div>
                  
                  <!-- Circle with number -->
                  <div 
                    class="step-circle"
                    :class="{ 
                      'completed': index < currentStepIndex,
                      'active': index === currentStepIndex,
                      'pending': index > currentStepIndex
                    }"
                  >
                    {{ index + 1 }}
                  </div>
                  
                  <!-- Label below -->
                  <span class="step-label">{{ step }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Messages/Conversations List -->
        <div class="chatbot-body">
          <!-- Home View -->
          <template v-if="!isChatView && activeTab === 'home'">
            <!-- Recent Conversations (Latest 2) -->
            <div v-if="recentConversations.length > 0" class="conversations-list">
              <div
                v-for="(conversation, index) in recentConversations"
                :key="index"
                class="conversation-item"
                @click="openConversation(conversation)"
              >
                <div class="conversation-icon">
                  <img src="@/assets/icons/Support/message-icon.svg" alt="Flossly" class="conversation-logo" />
                </div>
                <div class="conversation-content">
                  <h4 class="conversation-title">{{ conversation.subject }}</h4>
                  <p class="conversation-preview">{{ getLatestMessagePreview(conversation) }}</p>
                  <span class="conversation-time">{{ formatTime(conversation.lastMessageAt) }}</span>
                </div>
                <div v-if="conversation.unreadCount > 0" class="unread-indicator"></div>
              </div>
            </div>

            <!-- Action Options Section -->
            <div class="action-options-section">
              <div
                v-for="(option, index) in actionOptions"
                :key="index"
                class="action-option-card"
                @click="handleActionOption(option.id)"
              >
                <div class="option-content">
                  <div class="option-icon">
                    <img :src="option.iconSrc" :alt="option.title" class="support-icon support-icon--22" />
                  </div>
                  <div class="option-text">
                    <span class="option-title">{{ option.title }}</span>
                    <p class="option-subtitle">{{ option.subtitle }}</p>
                  </div>
                </div>
              </div>
            </div>
          </template>

          <!-- Messages View -->
          <template v-if="!isChatView && activeTab === 'messages'">
            <div v-if="loadingConversations" class="loading-container">
              <lottie-player
                src="/FlossslyLogoBlue.json"
                background="transparent"
                speed="1"
                style="width: 80px; height: 80px"
                loop
                autoplay
              />
            </div>
            <div v-else-if="allConversations.length > 0" class="conversations-list">
              <div
                v-for="(conversation, index) in allConversations"
                :key="index"
                class="conversation-item"
                @click="openConversation(conversation)"
              >
                <div class="conversation-icon">
                  <img src="@/assets/icons/Support/message-icon.svg" alt="Flossly" class="conversation-logo" />
                </div>
                <div class="conversation-content">
                  <h4 class="conversation-title">{{ conversation.subject }}</h4>
                  <p class="conversation-preview">{{ getLatestMessagePreview(conversation) }}</p>
                  <span class="conversation-time">{{ formatTime(conversation.lastMessageAt) }}</span>
                </div>
                <div v-if="conversation.unreadCount > 0" class="unread-indicator"></div>
              </div>
            </div>
            <div v-else class="empty-state">
              <img
                src="@/assets/icons/Support/MessageList.svg"
                alt="Messages"
                class="support-icon support-icon--64"
              />
              <p class="empty-text">No conversations yet</p>
              <p class="empty-subtext">Start a conversation from the Home tab</p>
            </div>
          </template>

          <!-- Chat View -->
          <template v-if="isChatView">
            <div class="chat-messages" ref="chatMessagesContainer">
              <!-- Typing indicator for welcome message -->
              <div v-if="showWelcomeTyping && !showWelcomeMessage" class="bot-message typing-indicator-wrapper message-fade-in">
                <img src="@/assets/icons/Support/message-icon.svg" alt="Flossly" class="bot-logo" />
                <div class="bot-message-bubble typing-indicator-bubble">
                  <div class="typing-indicator">
                    <span></span>
                    <span></span>
                    <span></span>
                  </div>
                </div>
              </div>

              <!-- Bot welcome message (virtual message, not saved to DB) -->
              <div v-if="!isConversationLoading && showWelcomeMessage" class="bot-message welcome-message message-fade-in">
                <img src="@/assets/icons/Support/message-icon.svg" alt="Flossly" class="bot-logo" />
                <div class="bot-message-bubble">
                  <p>{{ getBotMessage() }}</p>
                </div>
              </div>

              <div v-if="isConversationLoading" class="loading-container" style="padding: 16px;">
                <lottie-player
                  src="/FlossslyLogoBlue.json"
                  background="transparent"
                  speed="1"
                  style="width: 80px; height: 80px"
                  loop
                  autoplay
                />
              </div>

              <!-- Messages from conversation -->
              <template v-for="(message, index) in currentMessages" :key="message.id || index">
                <!-- User message -->
                <div v-if="message.senderType === 'user'" class="user-message message-fade-in">
                  <div class="user-message-bubble">
                    <p>{{ String(message.message || '').replace(/\s+$/g, '') }}</p>
                    
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
                  <v-avatar size="40" color="#263AAD" class="user-avatar">
                    <span class="avatar-text">{{ getUserInitials() }}</span>
                  </v-avatar>
                </div>

                <!-- Admin/Bot/AI reply -->
                <div v-else-if="message.senderType === 'support' || message.senderType === 'admin' || message.senderType === 'bot' || message.senderType === 'ai'" class="bot-message message-fade-in">
                  <img src="@/assets/icons/Support/message-icon.svg" alt="Flossly" class="bot-logo" />
                  <div class="bot-message-bubble">
                    <!-- Only render markdown for AI answers in the Ask a question flow -->
                    <div
                      v-if="selectedOption?.id === 'ask-question' && message.senderType === 'ai'"
                      class="markdown-content"
                      v-html="renderMarkdown(message.message)"
                    />
                    <p v-else>{{ String(message.message || '').replace(/\s+$/g, '') }}</p>
                    
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
                    
                    <span class="message-time">{{ formatMessageTime(message.createdAt) }}</span>
                  </div>
                </div>

              </template>

              <!-- Typing indicator - shows at the end while waiting -->
              <div v-if="isWaitingForResponse" class="bot-message typing-indicator-wrapper">
                <img src="@/assets/icons/Support/message-icon.svg" alt="Flossly" class="bot-logo" />
                <div class="bot-message-bubble typing-indicator-bubble">
                  <div class="typing-indicator">
                    <span></span>
                    <span></span>
                    <span></span>
                  </div>
                </div>
              </div>

              <!-- Bottom sentinel for reliable scroll-to-last-message -->
              <div ref="bottomSentinel" style="height: 1px;"></div>
            </div>
          </template>
        </div>

        <!-- Input Field (only in chat view and not loading) -->
        <div v-if="isChatView && !isConversationLoading" class="chat-input-container">
          <!-- Action Buttons (only for Report an issue and first time) -->
          <div v-if="selectedOption?.id === 'report-issue' && currentMessages.length === 0" class="action-buttons-container">
            <div class="action-btn-wrapper">
              <v-btn
                variant="text"
                color="grey-darken-2"
                class="action-btn"
                @click="openBugAnnotation"
              >
                <img src="@/assets/icons/Support/MarkBug.svg" alt="Mark bug" class="support-icon support-icon--18" />
                Mark the bug
              </v-btn>
            </div>
            <div class="action-btn-wrapper">
              <v-btn
                variant="text"
                color="grey-darken-2"
                class="action-btn"
                @click="openScreenRecorder"
              >
                <img src="@/assets/icons/Support/RecordScreen.svg" alt="Record screen" class="support-icon support-icon--18" />
                Record screen
              </v-btn>
            </div>
          </div>

          <!-- Attached Files Preview -->
          <div v-if="attachedFiles.length > 0" class="attached-files">
            <div class="attached-files-header">
              <span class="text-caption">Attached Files ({{ attachedFiles.length }})</span>
            </div>
            <div class="attached-files-list">
              <v-chip
                v-for="(file, index) in attachedFiles"
                :key="index"
                closable
                @click:close="removeAttachment(index)"
                class="ma-1"
                size="small"
              >
                <v-icon left small>{{ getFileIcon(file) }}</v-icon>
                {{ file.name }}
              </v-chip>
            </div>
          </div>

          <!-- First Time Chat Input (with Submit Button) -->
          <div v-if="currentMessages.length === 0" class="first-time-chat-input">
            <div class="textarea-wrapper">
              <!-- Emoji Picker -->
              <ClientOnly>
                <div v-if="showEmojiPicker" class="emoji-picker-wrapper" @click.stop>
                  <div class="emoji-picker-header">
                    <span>Emojis</span>
                    <v-icon size="small" @click="showEmojiPicker = false">mdi-close</v-icon>
                  </div>
                  <emoji-picker
                    ref="emojiPickerRef"
                    class="emoji-picker-component"
                    @emoji-click="handleEmojiClick"
                  ></emoji-picker>
                </div>
              </ClientOnly>
              
              <v-textarea
                v-model="userMessage"
                :placeholder="getInputPlaceholder()"
                variant="outlined"
                rows="3"
                hide-details
                class="chat-textarea"
                color="grey-lighten-1"
                @keydown.enter="handleEnterKey"
                :disabled="isSubmitting"
              />
              
              <!-- Bottom right icons -->
              <div 
                v-if="selectedOption?.id === 'report-issue' || selectedOption?.id === 'request-feature'"
                class="textarea-bottom-icons"
              >
                <img
                  src="@/assets/icons/Support/AttachFile.svg"
                  alt="Attach"
                  class="support-icon support-icon--20 attach-file-icon"
                  @click="triggerFileUpload"
                />
              </div>
              
              <input
                ref="fileInput"
                type="file"
                multiple
                accept="image/*,video/*,.pdf,.doc,.docx,.txt"
                style="display: none"
                @change="handleFileSelect"
              />
            </div>
            
            <!-- Submit Button for first time -->
            <v-btn
              block
              color="primary"
              size="large"
              class="submit-btn"
              :disabled="!userMessage.trim() || isSubmitting"
              @click="sendMessage"
            >
              Submit
            </v-btn>
          </div>

          <!-- Ongoing Chat Input (with Inline Send Button) -->
          <div v-else class="modern-chat-input">
            <!-- Emoji Picker for ongoing chat -->
            <ClientOnly>
              <div v-if="showEmojiPicker" class="emoji-picker-wrapper" @click.stop>
                <div class="emoji-picker-header">
                  <span>Emojis</span>
                  <v-icon size="small" @click="showEmojiPicker = false">mdi-close</v-icon>
                </div>
                <emoji-picker
                  ref="emojiPickerRef"
                  class="emoji-picker-component"
                  @emoji-click="handleEmojiClick"
                ></emoji-picker>
              </div>
            </ClientOnly>
            
            <v-text-field
              v-model="userMessage"
              :placeholder="getInputPlaceholder()"
              variant="outlined"
              hide-details
              class="chat-input"
              density="comfortable"
              @keydown.enter="handleEnterKey"
              :disabled="isSubmitting"
            >
              <template #prepend-inner>
                <div class="input-actions-left">
                  <!-- Attach file icon (for Report an issue and Request a feature) -->
                  <img
                    v-if="selectedOption?.id === 'report-issue' || selectedOption?.id === 'request-feature'"
                    src="@/assets/icons/Support/AttachFile.svg"
                    alt="Attach"
                    class="support-icon support-icon--20 attach-file-icon"
                    @click="triggerFileUpload"
                  />
                  
                  <!-- Emoji icon -->
                  <img
                    src="@/assets/icons/Support/Emoji.svg"
                    alt="Emoji"
                    class="support-icon support-icon--20 emoji-icon"
                    @click="toggleEmojiPicker"
                  />
                </div>
              </template>
              
              <template #append-inner>
                <div class="input-actions">
                  <!-- Send Button -->
                  <img
                    src="@/assets/icons/Support/send.svg"
                    alt="Send"
                    class="support-icon support-icon--20 send-icon"
                    :class="{ 'disabled': !userMessage.trim() || isSubmitting }"
                    @click="!userMessage.trim() || isSubmitting ? null : sendMessage()"
                  />
                </div>
              </template>
            </v-text-field>
            
            <input
              ref="fileInput"
              type="file"
              multiple
              accept="image/*,video/*,.pdf,.doc,.docx,.txt"
              style="display: none"
              @change="handleFileSelect"
            />
          </div>
        </div>

        <!-- Bottom Tab Navigation (only when not in chat view) -->
        <div v-if="!isChatView" class="chatbot-footer">
          <v-btn
            :class="['nav-btn', { active: activeTab === 'home' }]"
            variant="text"
            @click="activeTab = 'home'"
          >
            <div class="nav-content">
              <img src="@/assets/icons/Support/home.svg" alt="Home" class="nav-icon support-icon support-icon--22" />
              <span class="nav-label">Home</span>
            </div>
          </v-btn>
          <v-btn
            :class="['nav-btn', { active: activeTab === 'messages' }]"
            variant="text"
            @click="activeTab = 'messages'"
          >
            <div class="nav-content">
              <v-badge
                v-if="unreadCount > 0"
                :content="unreadCount"
                color="error"
                class="nav-badge"
              >
                <img src="@/assets/icons/Support/message-text.svg" alt="Messages" class="nav-icon support-icon support-icon--22" />
              </v-badge>
              <img v-else src="@/assets/icons/Support/message-text.svg" alt="Messages" class="nav-icon support-icon support-icon--22" />
              <span class="nav-label">Messages</span>
            </div>
          </v-btn>
        </div>
  
      </v-card>
    </v-menu>

    <!-- Bug Annotation Dialog -->
    <BugAnnotation 
      v-model="showBugAnnotation" 
      @save="handleBugAnnotationSave"
      @error="handleAnnotationError"
    />

    <!-- Screen Recorder Dialog -->
    <ScreenRecorder 
      v-model="showScreenRecorder" 
      @save="handleScreenRecordingSave"
      @error="handleRecordingError"
      @update:modelValue="onRecorderModelUpdate"
    />
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted, onUnmounted, nextTick } from 'vue';
import { marked } from 'marked';
import supportChatService from '@/services/supportChatService';
import BugAnnotation from '@/components/chatbot/BugAnnotation.vue';
import ScreenRecorder from '@/components/chatbot/ScreenRecorder.vue';

// Import emoji picker only on client side
if (process.client) {
  import('emoji-picker-element');
}

// Configure marked for safe HTML rendering
marked.setOptions({
  breaks: true, // Convert \n to <br>
  gfm: true, // GitHub Flavored Markdown
});

const { user } = useUser();
const { lastNotification } = useFCM();

const isOpen = ref(false);
const selectedOption = ref(null);
const isChatView = ref(false);
const userMessage = ref('');
const activeTab = ref('home');
const currentConversationId = ref(null);

// Watch for FCM notifications related to chatbot messages
const handleFCMNotification = (notification) => {
  if (!notification) return;
  
  const notifData = notification.data || {};
  const type = notifData.type;
  
  // Handle new chatbot messages and support replies
  if (type === 'chatbot_message' || type === 'chatbot_status_update' || type === 'support_reply') {
    const convId = notifData.conversationId || notifData.ticketId;
    const parsedConvId = convId ? parseInt(convId) : null;
    
    if (type === 'chatbot_message' || type === 'support_reply') {
      const message = notifData.message ? JSON.parse(notifData.message) : null;
      
      if (parsedConvId && message) {
        // Update currently open conversation in realtime
        if (currentConversationId.value === parsedConvId) {
          const exists = currentMessages.value?.some(m => m.id === message.id);
          if (!exists) {
            // Remove temp message if this is the user's message coming back from server
            if (message.senderType === 'user') {
              currentMessages.value = currentMessages.value.filter(m => !m.id?.startsWith('temp-'));
            }
            
            currentMessages.value.push(message);
            currentMessages.value = [...currentMessages.value].sort(
              (a, b) => new Date(a.createdAt) - new Date(b.createdAt)
            );
            
            // Hide typing indicator when bot/AI responds
            if (message.senderType === 'bot' || message.senderType === 'ai') {
              isWaitingForResponse.value = false;
            }
            
            nextTick(() => scrollToBottom());
          }
        }
        
        // Refresh conversations list to update unread counts
        fetchConversations();
      }
    } else if (type === 'chatbot_status_update') {
      const status = notifData.status;
      
      if (parsedConvId && status) {
        // Update current conversation data
        if (currentConversationId.value === parsedConvId && currentConversationData.value) {
          currentConversationData.value.status = status;
        }
        
        // Update in conversations list
        const conv = allConversations.value.find(c => c.id === parsedConvId);
        if (conv) {
          conv.status = status;
        }
      }
    }
  }
};

// Watch for FCM notifications at the component level (not inside onMounted)
let stopWatchingNotifications = null;

onMounted(() => {
  // Set up FCM notification watcher
  stopWatchingNotifications = watch(lastNotification, handleFCMNotification, { immediate: true });
  
  // Fetch conversations when component mounts
  fetchConversations();
});

onUnmounted(() => {
  // Stop watching notifications
  if (stopWatchingNotifications) {
    stopWatchingNotifications();
  }
});

const isSubmitting = ref(false);
const isWaitingForResponse = ref(false);
const allConversations = ref([]);
const loadingConversations = ref(false);
const currentMessages = ref([]);
const chatMessagesContainer = ref(null);
const bottomSentinel = ref(null);

// Bug annotation and screen recording
const showBugAnnotation = ref(false);
const showScreenRecorder = ref(false);
const attachedFiles = ref([]);
const shouldReopenChatAfterSnip = ref(false);
const showEmojiPicker = ref(false);
const emojiPickerRef = ref(null);

const userName = computed(() => {
  return user.value?.name || user.value?.firstName || 'there';
});

const teamMembers = ref([
  { initials: 'SA', image: 'https://randomuser.me/api/portraits/women/44.jpg' },
  { initials: 'JD', image: 'https://randomuser.me/api/portraits/men/32.jpg' },
  { initials: 'MK', image: 'https://randomuser.me/api/portraits/women/68.jpg' },
]);

const actionOptions = ref([
  {
    id: 'ask-question',
    title: 'Ask a question',
    subtitle: 'We are here to help.',
    iconSrc: new URL('@/assets/icons/Support/MessageList.svg', import.meta.url).href,
  },
  {
    id: 'report-issue',
    title: 'Report an issue',
    subtitle: 'Found a bug? Let us know.',
    iconSrc: new URL('@/assets/icons/Support/ReportBug.svg', import.meta.url).href,
  },
  {
    id: 'request-feature',
    title: 'Request a feature',
    subtitle: 'What would you like to see next?',
    iconSrc: new URL('@/assets/icons/Support/RequestFeature.svg', import.meta.url).href,
  }
]);

// Progress steps for conversation tracking
const progressSteps = ref(['Submitted', 'In progress', 'Resolved']);
const currentConversationData = ref(null);

// Welcome message with typing indicator
const showWelcomeMessage = ref(false);
const showWelcomeTyping = ref(false);

// Computed properties
const currentStepIndex = computed(() => {
  if (!currentConversationData.value) return 0;
  
  const status = currentConversationData.value.status;
  switch (status) {
    case 'active':
      return 0; // Submitted
    case 'in-progress':
      return 1; // In progress
    case 'resolved':
    case 'closed':
      return 2; // Resolved
    default:
      return 0;
  }
});

const recentConversations = computed(() => {
  return allConversations.value.slice(0, 2);
});

const unreadCount = computed(() => {
  return allConversations.value.reduce((count, conv) => count + (conv.unreadCount || 0), 0);
});

// Fetch conversations
const fetchConversations = async () => {
  try {
    loadingConversations.value = true;
    const response = await supportChatService.getConversations({
      limit: 50,
      offset: 0
    });
    
    if (response.success) {
      allConversations.value = response.data.map(conv => ({
        ...conv,
        unreadCount: conv.messages?.filter(m => !m.isRead && (m.senderType === 'support' || m.senderType === 'admin')).length || 0
      }));
    }
  } catch (error) {
    console.error('Failed to fetch conversations:', error);
  } finally {
    loadingConversations.value = false;
  }
};

// Helper functions
const getConversationIcon = (conversationType) => {
  switch (conversationType) {
    case 'ask-question':
      return 'mdi-message-reply';
    case 'report-issue':
      return 'mdi-bug';
    case 'request-feature':
      return 'mdi-lightbulb';
    default:
      return 'mdi-message-text';
  }
};

const getLatestMessagePreview = (conversation) => {
  if (conversation.messages && conversation.messages.length > 0) {
    const latestMessage = conversation.messages[0];
    return latestMessage.message?.substring(0, 50) + (latestMessage.message?.length > 50 ? '...' : '');
  }
  return 'No messages yet';
};

const formatTime = (dateString) => {
  if (!dateString) return '';
  
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now - date;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);
  
  if (diffMins < 1) return 'just now';
  if (diffMins < 60) return `${diffMins} minute${diffMins > 1 ? 's' : ''} ago`;
  if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
  if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
  
  return date.toLocaleDateString();
};

const formatMessageTime = (dateString) => {
  if (!dateString) return '';
  
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now - date;
  const diffMins = Math.floor(diffMs / 60000);
  
  if (diffMins < 1) return 'just now';
  
  // Show time in HH:MM format
  const hours = date.getHours().toString().padStart(2, '0');
  const minutes = date.getMinutes().toString().padStart(2, '0');
  return `${hours}:${minutes}`;
};

const getUserInitials = () => {
  const name = user.value?.name || user.value?.firstName || user.value?.fullName || 'U';
  return name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2);
};

const renderMarkdown = (text) => {
  if (!text) return '';
  try {
    const normalized = String(text).replace(/\s+$/g, '');
    return marked.parse(normalized).trimEnd(); 
  } catch (error) {
    console.error('Markdown parsing error:', error);
    return String(text).replace(/\s+$/g, '');
  }
};


const scrollToBottom = () => {
  if (bottomSentinel.value?.scrollIntoView) {
    bottomSentinel.value.scrollIntoView({ block: 'end' });
    return;
  }
  if (chatMessagesContainer.value) {
    chatMessagesContainer.value.scrollTop = chatMessagesContainer.value.scrollHeight;
  }
};

const scrollToBottomSoon = async () => {
  await nextTick();
  scrollToBottom();
  requestAnimationFrame(() => scrollToBottom());
  setTimeout(() => scrollToBottom(), 0);
};

// v-menu toggles isOpen via activator; fetch conversations when opened
watch(isOpen, (val) => {
  if (val) fetchConversations();
});

const toggleChat = () => {
  isOpen.value = false;
};

const isConversationLoading = ref(false);

const openConversation = async (conversation) => {
  console.log('Opening conversation:', conversation);
  currentConversationId.value = conversation.id;
  currentConversationData.value = conversation; // Store conversation data for progress indicator
  selectedOption.value = {
    id: conversation.conversationType,
    title: conversation.subject
  };
  isChatView.value = true;
  
  // Load full conversation with all messages
  try {
    isConversationLoading.value = true;
    const response = await supportChatService.getConversationById(conversation.id);
    
    if (response.success && response.data.messages) {
      // Always display oldest -> newest
      currentMessages.value = [...response.data.messages].sort(
        (a, b) => new Date(a.createdAt) - new Date(b.createdAt)
      );
      
      // Mark messages as read
      await supportChatService.markMessagesAsRead(conversation.id);
      
      // Refresh conversations to update unread count
      fetchConversations();
    } else {
      currentMessages.value = [];
    }
  } catch (error) {
    console.error('Failed to load conversation messages:', error);
    currentMessages.value = [];
  } finally {
    isConversationLoading.value = false;
  }
  
  // Scroll to bottom after messages are loaded and UI is updated
  await nextTick(); // Wait for UI to update
  await scrollToBottomSoon();
};

const handleActionOption = (optionId) => {
  console.log('Action option selected:', optionId);
  const option = actionOptions.value.find(opt => opt.id === optionId);
  selectedOption.value = option;
  
  // Set loading state for new chat
  isConversationLoading.value = true;
  isChatView.value = true;
  
  // Simulate loading for new conversation (to prevent UI flash)
  setTimeout(async () => {
    isConversationLoading.value = false;
    // Show typing indicator then welcome message
    showTypingThenWelcome();
    // Scroll to bottom after UI is ready
    await scrollToBottomSoon();
  }, 300);
};

const goBack = () => {
  isChatView.value = false;
  selectedOption.value = null;
  userMessage.value = '';
  attachedFiles.value = []; // Clear attached files
  showBugAnnotation.value = false; // Close annotation if open
  showScreenRecorder.value = false; // Close recorder if open
  currentConversationId.value = null;
  
  // Clear welcome message
  showWelcomeMessage.value = false;
  showWelcomeTyping.value = false;
  currentConversationData.value = null; // Clear conversation data
  currentMessages.value = [];
  // Refresh conversations when going back
  fetchConversations();
};

const handleEnterKey = (event) => {
  // Only send on Enter without Shift (to allow multi-line with Shift+Enter)
  if (!event.shiftKey) {
    event.preventDefault();
    sendMessage();
  }
};

const sendMessage = async () => {
  if (!userMessage.value.trim() || isSubmitting.value) return;
  
  isSubmitting.value = true;
  
  try {
    const messageText = userMessage.value.trim();
    
    // Create optimistic user message for immediate display
    const tempUserMessage = {
      id: `temp-${Date.now()}`,
      message: messageText,
      senderType: 'user',
      createdAt: new Date().toISOString(),
      attachments: []
    };
    
    // Add message to UI immediately
    currentMessages.value.push(tempUserMessage);
    await nextTick();
    await scrollToBottomSoon();

    // Clear input
    userMessage.value = '';
    await nextTick();
    
    // Show typing indicator for ask-question flow
    if (selectedOption.value?.id === 'ask-question') {
      isWaitingForResponse.value = true;
    }
    
    // If no conversation exists, create one first
    if (!currentConversationId.value) {
      const metadata = {
        browserInfo: {
          userAgent: navigator.userAgent,
          language: navigator.language,
          platform: navigator.platform
        },
        pageUrl: window.location.href
      };
      
      const convResponse = await supportChatService.createConversation({
        conversationType: selectedOption.value?.id || 'ask-question',
        subject: messageText.substring(0, 100),
        metadata
      });
      
      if (convResponse.success) {
        currentConversationId.value = convResponse.data.id;
        currentConversationData.value = convResponse.data; // Set conversation data for progress indicator
      } else {
        throw new Error('Failed to create conversation');
      }
    }
    
    // Send message
    const response = await supportChatService.createMessage({
      conversationId: currentConversationId.value,
      message: messageText,
      senderType: 'user'
    });
    
    if (response.success) {
      console.log('Message sent successfully');
      
      // Remove temp message and add the real user message
      currentMessages.value = currentMessages.value.filter(m => m.id !== tempUserMessage.id);
      currentMessages.value.push(response.data);
      
      // For ask-question flow, handle bot response directly from API
      if (selectedOption.value?.id === 'ask-question') {
        if (response.botResponse) {
          console.log('Bot response received directly from API:', response.botResponse);
          
          // Add bot response to messages
          currentMessages.value.push(response.botResponse);
          
          // Hide typing indicator
          isWaitingForResponse.value = false;
          
          // Scroll to show bot response
          await nextTick();
          await scrollToBottomSoon();
        } else {
          // If no bot response received, hide typing indicator after a timeout
          console.warn('No bot response received from API for ask-question flow');
          setTimeout(() => {
            if (isWaitingForResponse.value) {
              isWaitingForResponse.value = false;
              console.log('Typing indicator hidden after timeout');
            }
          }, 30000); // 30 second timeout
        }
      }
      
      // Upload attachments if any
      if (attachedFiles.value.length > 0) {
        await uploadAttachments(response.data.id);
      }
      
      // Bug reports and feature requests are now handled via conversation metadata
      // No need for separate API calls
      
      // Refresh conversations to show the new message
      await fetchConversations();
      
      // Update current conversation data to reflect latest status for progress indicator
      if (currentConversationId.value) {
        const updatedConv = allConversations.value.find(c => c.id === currentConversationId.value);
        if (updatedConv) {
          currentConversationData.value = updatedConv;
        }
      }
      
      // Re-enable input immediately after successful message send
      isSubmitting.value = false;
    } else {
      throw new Error('Failed to send message');
    }
  } catch (error) {
    console.error('Error sending message:', error);
    alert('Failed to send message. Please try again.');
    isWaitingForResponse.value = false; // Hide typing indicator on error
    isSubmitting.value = false; // Re-enable input on error
  }
};

// Polling removed - FCM handles real-time message updates

// Bug reports and feature requests are now stored as conversation metadata
// when the conversation is created - no separate functions needed

const getBotMessage = () => {
  switch (selectedOption.value?.id) {
    case 'ask-question':
      return 'Hey 👋 We are here to help! Please ask your question below.';
    case 'report-issue':
      return 'Hey 👋 Found a bug? Please describe the issue below. You can also mark the bug.';
    case 'request-feature':
      return 'Hey 👋 What would you like to see next? Please describe your feature request below.';
    default:
      return 'Hey 👋 How can we help you today?';
  }
};

const getInputPlaceholder = () => {
  switch (selectedOption.value?.id) {
    case 'ask-question':
      return 'Type your question here...';
    case 'report-issue':
      return 'What went wrong?';
    case 'request-feature':
      return 'Describe your feature idea...';
    default:
      return 'Type your message...';
  }
};

// Show typing indicator then welcome message
const showTypingThenWelcome = () => {
  showWelcomeTyping.value = true;
  showWelcomeMessage.value = false;
  
  // Show typing indicator for 1-2 seconds then show message
  setTimeout(() => {
    showWelcomeTyping.value = false;
    showWelcomeMessage.value = true;
  }, 1500);
};

// Bug annotation and screen recording handlers
const openBugAnnotation = () => {
  // Hide the chatbot dialog
  shouldReopenChatAfterSnip.value = true;
  isOpen.value = false;
  // Small delay to ensure dialog is hidden before screenshot
  setTimeout(() => {
    showBugAnnotation.value = true;
  }, 100);
};

const openScreenRecorder = () => {
  // Hide chatbot while recording UI is in use
  isOpen.value = false;
  showScreenRecorder.value = true;
};

const onRecorderModelUpdate = (val) => {
  showScreenRecorder.value = val;
  if (!val) {
    // Always re-open chatbot when recorder closes
    isOpen.value = true;
  }
};

const handleBugAnnotationSave = (file) => {
  console.log('Bug annotation saved:', file);
  attachedFiles.value.push(file);
  showBugAnnotation.value = false;
  // Reopen the chatbot dialog after snipping
  isOpen.value = true;
};

const handleScreenRecordingSave = (file) => {
  console.log('Screen recording saved:', file);
  attachedFiles.value.push(file);
  showScreenRecorder.value = false;
};

const handleAnnotationError = (error) => {
  console.error('Annotation error:', error);
  alert(error || 'Failed to create annotation');
  // Reopen chatbot on error
  isOpen.value = true;
};

const handleRecordingError = (error) => {
  console.error('Recording error:', error);
  alert(error || 'Failed to record screen');
};

// File upload handlers
const fileInput = ref(null);

const triggerFileUpload = () => {
  fileInput.value?.click();
};

const toggleEmojiPicker = () => {
  showEmojiPicker.value = !showEmojiPicker.value;
};

const handleEmojiClick = (event) => {
  const emoji = event.detail.unicode;
  userMessage.value += emoji;
  showEmojiPicker.value = false;
};

const handleFileSelect = (event) => {
  const files = Array.from(event.target.files || []);
  if (files.length > 0) {
    attachedFiles.value.push(...files);
  }
  // Reset input to allow selecting the same file again
  if (fileInput.value) {
    fileInput.value.value = '';
  }
};

const removeAttachment = (index) => {
  attachedFiles.value.splice(index, 1);
};

const getFileIcon = (file) => {
  if (!file) return 'mdi-file';
  
  const fileName = file.name || '';
  const ext = fileName.substring(fileName.lastIndexOf('.')).toLowerCase();
  
  if (file.type?.startsWith('image/') || ['.png', '.jpg', '.jpeg', '.gif', '.svg'].includes(ext)) {
    return 'mdi-file-image';
  } else if (file.type?.startsWith('video/') || ['.mp4', '.mov', '.avi', '.webm'].includes(ext)) {
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

const uploadAttachments = async (messageId) => {
  try {
    for (const file of attachedFiles.value) {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('messageId', messageId);
      formData.append('conversationId', currentConversationId.value);

      // Upload the file
      await supportChatService.uploadAttachment(formData);
      console.log('Uploaded attachment:', file.name);
    }
    
    // Clear attachments after successful upload
    attachedFiles.value = [];
    
    // Reload conversation to show attachments with the message
    if (currentConversationId.value) {
      const response = await supportChatService.getConversationById(currentConversationId.value);
      if (response.success && response.data.messages) {
        currentMessages.value = [...response.data.messages].sort(
          (a, b) => new Date(a.createdAt) - new Date(b.createdAt)
        );
        await nextTick();
        await scrollToBottomSoon();
      }
    }
  } catch (error) {
    console.error('Failed to upload attachments:', error);
    // Don't throw - let the message go through even if attachments fail
  }
};

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
  
  // Open attachment in a new tab
  window.open(attachment.filePath, '_blank');
};

// Lifecycle hooks
onMounted(() => {
  fetchConversations();
});

watch(currentMessages, async () => {
  // When opening a conversation, ensure we stay pinned to the bottom
  if (isChatView.value && !isConversationLoading.value) {
    await scrollToBottomSoon();
  }
}, { deep: true });

// Watch for tab changes
watch(activeTab, (newTab) => {
  if (newTab === 'messages') {
    fetchConversations();
  }
});

// Re-open chatbot after snipping tool closes (save or cancel)
watch(showBugAnnotation, (val) => {
  if (!val && shouldReopenChatAfterSnip.value) {
    isOpen.value = true;
    shouldReopenChatAfterSnip.value = false;
  }
});
</script>

<style scoped>
.chatbot-container {
  position: relative;
  display: inline-block;
}

.chatbot-icon {
  width: 60px;
  height: 60px;
  cursor: pointer;
  transition: transform 0.25s ease;
}

.chatbot-icon:hover {
  transform: scale(1.05);
}

.chatbot-badge {
  position: absolute;
  top: 2px;
  right: 2px;
}

.chatbot-dialog {
  width: 380px;
  max-height: 600px;
  border-radius: 20px !important;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

/* Prevent horizontal scrollbar inside widget */
.chatbot-dialog,
.chatbot-body,
.chat-messages {
  overflow-x: hidden;
}

.chatbot-header {
  background: white;
  padding: 16px 20px;
  position: relative;
  color: #1a1a1a;
  border-bottom: 1px solid #e0e0e0;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.chatbot-header.home-view {
  background: linear-gradient(180deg, #263388 0%, #3247A4 50%, #AD7CF3 100%);
  color: white;
  border-bottom: none;
}

.chatbot-header.messages-view {
  background: linear-gradient(90deg, #263388 0%, #3247A4 50%, #AD7CF3 100%);
  color: white;
  border-bottom: none;
}

.chatbot-header.messages-view .greeting {
  color: white;
}

.chatbot-header.messages-view .close-btn .v-icon {
  color: white !important;
}

.header-content {
  position: relative;
  z-index: 1;
  width: 100%;
  display: flex;
  flex-direction: column;
}

.header-content.home-view-content {
  align-items: flex-start;
  justify-content: flex-start;
  gap: 5px;
  /* Keep text below the top-right avatars/close button */
  padding-top: 86px;
}

.header-content.chat-view-content {
  align-items: center;
  justify-content: flex-start;
}

.team-avatars {
  display: flex;
  margin-bottom: 16px;
}

/* Home header: avatars on top-left, close button on top-right */
.chatbot-header.home-view .team-avatars {
  position: absolute;
  top: 12px;
  left: 0px;
  margin-bottom: 0;
}

.chatbot-header.home-view .close-btn {
  position: absolute;
  top: 12px;
  right: 12px;
}

.chatbot-header.messages-view .close-btn {
  position: absolute;
  top: 12px;
  right: 12px;
}

.chatbot-header.chat-view {
  background: linear-gradient(90deg, #263388 0%, #3247A4 50%, #AD7CF3 100%);
  color: white;
  border-bottom: none;
}

.chatbot-header.chat-view .greeting {
  color: white;
}

.chatbot-header.chat-view .back-btn-inline .v-icon,
.chatbot-header.chat-view .close-btn-inline .v-icon {
  color: white !important;
}

.chatbot-header.chat-view .step-label {
  color: white !important;
}

.team-avatar {
  width: 50px;
  height: 50px;
  border: 1px solid hsla(0, 0%, 86%, 1);
  background: rgba(255, 255, 255, 0.2);
  backdrop-filter: blur(10px);
  box-sizing: border-box;
  margin-left: -12px;
  transition: transform 0.2s ease, z-index 0.2s ease;
}

.team-avatar:first-child {
  margin-left: 0;
}

.team-avatar:hover {
  transform: translateY(-4px);
  z-index: 10;
}

.avatar-text {
  font-weight: 600;
  font-size: 16px;
  color: white;
}

.greeting {
  font-family: Inter, sans-serif;
  font-size: 24px;
  font-weight: 700;
  line-height: 130%;
  letter-spacing: 0;
  margin: 0;
  color: white;
}

.tagline {
  margin: 0;
  color: white;
  opacity: 0.95;
}

.close-btn {
  position: absolute;
  top: 12px;
  right: 12px;
  z-index: 2;
}

.chatbot-body {
  flex: 1;
  overflow-y: auto;
  background: white;
  height: calc(100vh - 200px);
  max-height: 500px;
}

.conversations-list {
  background: white;
}

.conversation-item {
  display: flex;
  align-items: flex-start;
  padding: 16px 20px;
  gap: 12px;
  cursor: pointer;
  transition: background 0.2s;
  position: relative;
}

.conversation-item:hover {
  background: #f9f9f9;
}

.conversation-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 5px;
  position: relative;
  padding-right: 60px;
  min-width: 0;
  overflow: hidden;
}

.conversation-title {
  font-family: Inter, sans-serif;
  font-weight: 500;
  font-size: 14px;
  line-height: 130%;
  letter-spacing: 0;
  margin: 0;
  color: #1a1a1a;
  display: -webkit-box;
  -webkit-line-clamp: 1;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.conversation-preview {
  font-family: Inter, sans-serif;
  font-weight: 400;
  font-size: 14px;
  line-height: 130%;
  letter-spacing: 0;
  margin: 0;
  color: #666;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  max-width: 100%;
}

.conversation-time {
  font-family: Inter, sans-serif;
  font-weight: 400;
  font-size: 10px;
  line-height: 130%;
  letter-spacing: 0;
  color: hsla(0, 0%, 45%, 1);
  margin: 0;
  position: absolute;
  top: 0;
  right: 0;
  white-space: nowrap;
}

.unread-indicator {
  width: 10px;
  height: 10px;
  background: #f44336;
  border-radius: 50%;
  flex-shrink: 0;
}

.action-options-section {
  padding: 12px;
  background: white;
  margin-top: 1px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.action-option-card {
  background: white;
  border: 1px solid #e0e0e0;
  border-radius: 12px;
  padding: 12px 14px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.action-option-card:hover {
  background: #f9f9f9;
  border-color: #d0d0d0;
  transform: translateY(-1px);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
}

.option-content {
  display: flex;
  align-items: center;
  justify-content: flex-start;
  gap: 12px;
}

.option-icon {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
}

.option-text {
  flex: 1;
}

.option-title {
  font-size: 14px;
  font-weight: 600;
  color: #1a1a1a;
  display: block;
  margin-bottom: 2px;
}

.option-subtitle {
  font-size: 12px;
  color: #666;
  margin: 0;
  line-height: 1.3;
}

/* Chat View Styles */
/* (legacy absolute-position rules removed; chat view uses .chat-title-bar with inline buttons) */

.chat-title-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  gap: 8px;
  margin-bottom: 0;
}

.back-btn-inline,
.close-btn-inline {
  flex-shrink: 0;
}

.chat-view-title {
  margin: 0;
  text-align: left;
  flex: 1;
  font-size: 18px;
  font-weight: 600;
  color: #1a1a1a;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.chatbot-header-container {
  display: flex;
  flex-direction: column;
}

.progress-indicator-section {
  background: white;
  padding: 12px 20px;
  border-bottom: 1px solid #e0e0e0;
}

.progress-indicator {
  width: 100%;
}

.progress-steps {
  display: flex;
  align-items: center;
  justify-content: space-between;
  position: relative;
  width: 100%;
}

.progress-step {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  position: relative;
  flex: 1;
}

.progress-step:first-child {
  align-items: flex-start;
}

.progress-step:last-child {
  align-items: flex-end;
}

.step-line {
  position: absolute;
  top: 18px;
  left: -50%;
  width: 100%;
  height: 3px;
  z-index: 0;
  transition: background 0.3s ease;
}

.step-line.completed {
  background: hsla(217, 100%, 49%, 1);
}

.step-line.pending {
  background: #D1D5DB;
}

.step-circle {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 16px;
  font-weight: 600;
  z-index: 1;
  transition: all 0.3s ease;
}

.step-circle.active {
  background: hsla(217, 100%, 49%, 1);
  color: white;
}

.step-circle.completed {
  background: hsla(217, 100%, 49%, 1);
  color: white;
}

.step-circle.pending {
  background: #D1D5DB;
  color: #9CA3AF;
}

.step-label {
  font-size: 11px;
  font-weight: 500;
  text-align: center;
  white-space: nowrap;
  z-index: 1;
}

.progress-step.active .step-label {
  color: hsla(217, 100%, 49%, 1);
}

.progress-step.completed .step-label {
  color: hsla(217, 100%, 49%, 1);
}

.progress-step.pending .step-label {
  color: #9CA3AF;
}

.chat-messages {
  min-height: 200px;
  height: 100%;
  max-height: 100%;
  padding: 20px;
  display: flex;
  flex-direction: column;
  background: white;
  overflow-x: hidden;
  overflow-y: auto;
  flex: 1;
}

.bot-message {
  display: flex;
  gap: 12px;
  margin-bottom: 20px;
  align-items: center;
  justify-content: flex-start;
  position: relative;
}

.welcome-message {
  opacity: 0.95;
}

.bot-logo {
  width: 40px;
  height: 40px;
  object-fit: contain;
  flex-shrink: 0;
}

.conversation-icon {
  flex-shrink: 0;
  align-self: flex-start;
}

.conversation-logo {
  width: 40px;
  height: 40px;
  object-fit: contain;
}

.bot-message-bubble {
  background: white;
  padding: 16px;
  border-radius: 20px;
  width: fit-content;
  max-width: calc(100% - 52px);
  display: inline-block;
  word-break: break-word;
  overflow-wrap: break-word;
  white-space: pre-wrap;
  border: 1px solid hsla(0, 0%, 86%, 1);
  position: relative;
}

.bot-message-bubble::before {
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

.bot-message-bubble::after {
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

.bot-message-bubble p {
  margin: 0;
  color: #1a1a1a;
  font-size: 14px;
  line-height: 1.5;
}

.markdown-content {
  color: #1a1a1a;
  line-height: 1.6;
  font-size: 14px;
  overflow-x: hidden;
  word-break: break-word;
}

.markdown-content p {
  margin: 0;
}

.markdown-content p + p {
  margin-top: 8px;
}

.markdown-content h1,
.markdown-content h2,
.markdown-content h3,
.markdown-content h4,
.markdown-content h5,
.markdown-content h6 {
  margin: 12px 0 8px 0;
  font-weight: 600;
  line-height: 1.3;
}

.markdown-content h1 { font-size: 1.5em; }
.markdown-content h2 { font-size: 1.3em; }
.markdown-content h3 { font-size: 1.1em; }

.markdown-content code {
  background: #f5f5f5;
  padding: 2px 6px;
  border-radius: 4px;
  font-family: 'Courier New', monospace;
  font-size: 0.9em;
}

.markdown-content pre {
  background: #f5f5f5;
  padding: 12px;
  border-radius: 8px;
  overflow-x: hidden;
  margin: 8px 0;
}

.markdown-content pre code {
  background: transparent;
  padding: 0;
}

.markdown-content ul,
.markdown-content ol {
  margin: 8px 0;
  padding-left: 0;
  list-style: none;
}

.markdown-content li {
  margin: 4px 0;
  padding-left: 0;
}

.markdown-content .list-content {
  margin: 8px 0;
}

.markdown-content .list-item {
  margin: 4px 0;
}

.markdown-content blockquote {
  border-left: 3px solid #0061FB;
  padding-left: 12px;
  margin: 8px 0;
  color: #666;
  font-style: italic;
}

.markdown-content a {
  color: #0061FB;
  text-decoration: none;
}

.markdown-content a:hover {
  text-decoration: underline;
}

.markdown-content table {
  border-collapse: collapse;
  width: 100%;
  margin: 8px 0;
}

.markdown-content th,
.markdown-content td {
  border: 1px solid #ddd;
  padding: 8px;
  text-align: left;
}

.markdown-content th {
  background-color: #f5f5f5;
  font-weight: 600;
}

.markdown-content img {
  max-width: 100%;
  height: auto;
  border-radius: 8px;
  margin: 8px 0;
}

.markdown-content hr {
  border: none;
  border-top: 1px solid #e0e0e0;
  margin: 12px 0;
}

/* Typing Indicator */
.typing-indicator-wrapper {
  margin-bottom: 16px;
  display: flex;
  align-items: flex-start;
  gap: 8px;
  margin-right: 0;
}

.typing-indicator-bubble {
  background: #f5f5f5;
  padding: 12px;
  border-radius: 20px;
  width: fit-content;
  max-width: 60px;
}

.typing-indicator {
  display: flex;
  align-items: center;
  gap: 4px;
  height: 20px;
}

.typing-indicator span {
  width: 8px;
  height: 8px;
  background-color: #999;
  border-radius: 50%;
  display: inline-block;
  animation: typing 1.4s infinite;
}

.typing-indicator span:nth-child(1) {
  animation-delay: 0s;
}

.typing-indicator span:nth-child(2) {
  animation-delay: 0.2s;
}

.typing-indicator span:nth-child(3) {
  animation-delay: 0.4s;
}

@keyframes typing {
  0%, 60%, 100% {
    transform: translateY(0);
    opacity: 0.5;
  }
  30% {
    transform: translateY(-10px);
    opacity: 1;
  }
}

.user-message {
  display: flex;
  justify-content: flex-end;
  align-items: center;
  margin-bottom: 20px;
  gap: 12px;
  position: relative;
}

.user-message-bubble {
  background: #E8F0FE;
  padding: 16px;
  border-radius: 20px;
  width: fit-content;
  max-width: calc(100% - 52px);
  word-break: break-word;
  white-space: pre-wrap;
  overflow-wrap: break-word;
  position: relative;
  order: 1;
}

.user-message-bubble::before {
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

.user-message-bubble p {
  margin: 0;
  color: #1a1a1a;
  font-size: 14px;
  line-height: 1.5;
  word-wrap: break-word;
}

.user-avatar {
  flex-shrink: 0;
  order: 2;
}

.user-message .message-time {
  font-size: 10px;
  color: #999;
  opacity: 0.8;
  display: block;
  margin-top: 4px;
  text-align: right;
}

.bot-message .message-time {
  font-size: 10px;
  color: #999;
  opacity: 0.8;
  display: block;
  margin-top: 4px;
  text-align: right;
}

.empty-chat {
  display: flex;
  align-items: center;
  justify-content: center;
  flex: 1;
  color: #999;
  font-size: 14px;
}

.chat-input-container {
  padding: 16px;
  background: white;
}


.first-time-chat-input {
  position: relative;
}

.textarea-wrapper {
  position: relative;
  margin-bottom: 12px;
}

.textarea-bottom-icons {
  position: absolute;
  right: 12px;
  bottom: 12px;
  display: flex;
  align-items: center;
  gap: 12px;
  z-index: 1;
}


.chat-textarea :deep(.v-field) {
  border-radius: 24px;
  border-color: #d0d0d0;
}

.chat-textarea :deep(.v-field__outline__start),
.chat-textarea :deep(.v-field__outline__end) {
  border-color: #d0d0d0 !important;
}

.chat-textarea :deep(.v-field--focused .v-field__outline__start),
.chat-textarea :deep(.v-field--focused .v-field__outline__end) {
  border-color: #b0b0b0 !important;
}

.chat-textarea :deep(.v-field__input) {
  font-size: 14px;
}

.chat-textarea :deep(::placeholder) {
  font-size: 14px;
  opacity: 0.6;
}

.submit-btn {
  border-radius: 24px;
  text-transform: none;
  font-weight: 600;
  padding: 10px 0;
  font-size: 14px;
}

.modern-chat-input {
  position: relative;
}

.input-actions {
  display: flex;
  align-items: center;
  gap: 8px;
}

.input-actions-left {
  display: flex;
  align-items: center;
  gap: 5px;
  margin-right: 0px;
}

.send-icon {
  cursor: pointer;
  transition: opacity 0.2s;
}

.send-icon:hover:not(.disabled) {
  opacity: 0.7;
}

.send-icon.disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.attach-file-icon,
.emoji-icon {
  cursor: pointer;
  transition: opacity 0.2s;
}

.attach-file-icon:hover,
.emoji-icon:hover {
  opacity: 0.7;
}

.emoji-picker-wrapper {
  position: absolute;
  bottom: 100%;
  left: 0;
  width: 350px;
  background: white;
  border-radius: 12px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
  z-index: 10000;
  margin-bottom: 8px;
  overflow: hidden;
}

.emoji-picker-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  border-bottom: 1px solid #e0e0e0;
  background: #f9f9f9;
  font-weight: 600;
  font-size: 14px;
}

.emoji-picker-header .v-icon {
  cursor: pointer;
  opacity: 0.6;
  transition: opacity 0.2s;
}

.emoji-picker-header .v-icon:hover {
  opacity: 1;
}

.emoji-picker-component {
  --border-radius: 0;
  --background: white;
  width: 100%;
  height: 350px;
}

.attach-file-icon {
  cursor: pointer;
  padding: 4px;
  border-radius: 4px;
  transition: background-color 0.2s ease;
}

.attach-file-icon:hover {
  background-color: rgba(0, 0, 0, 0.04);
}

.chat-input :deep(.v-field) {
  border-radius: 24px !important;
}

.chat-input :deep(.v-field--focused .v-field__outline__start),
.chat-input :deep(.v-field--focused .v-field__outline__end) {
  border-color: #e0e0e0 !important;

}




.chat-input :deep(.v-field__input) {
  font-size: 14px;
  padding: 12px 16px;
  min-height: 44px;
}

.chat-input :deep(::placeholder) {
  font-size: 14px;
  opacity: 0.6;
  color: #666;
}

.attach-file-btn-inline {
  margin-right: 4px;
}

.send-btn {
  margin-left: 8px;
  background-color: #0061FB !important;
  border-radius: 50% !important;
  width: 36px !important;
  height: 36px !important;
}

.send-btn:disabled {
  background-color: #e0e0e0 !important;
}

.send-btn:disabled .v-icon {
  color: #999 !important;
}

.action-buttons-container {
  display: flex;
  justify-content: center;
  gap: 12px;
  margin-bottom: 16px;
}

.action-btn-wrapper {
  border: 1px solid hsla(0, 0%, 86%, 1);
  border-radius: 50px;
  padding: 4px 8px;
}

.action-btn {
  text-transform: none;
  font-weight: 500;
}

.attached-files {
  margin-bottom: 16px;
  padding: 12px;
  background-color: #f5f5f5;
  border-radius: 8px;
}

.attached-files-header {
  margin-bottom: 8px;
  font-weight: 600;
  color: #666;
}

.attached-files-list {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
}


.chatbot-footer {
  background: white;
  border-top: 1px solid #e0e0e0;
  padding: 8px 4px;
  display: flex;
  align-items: center;
  gap: 4px;
}

.nav-btn {
  flex: 1;
  height: 64px !important;
  border-radius: 8px !important;
  text-transform: none !important;
  color: #666 !important;
  min-width: 60px !important;
}

.nav-btn.active {
  color: #0061FB !important;
}

.nav-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
}

.nav-label {
  font-size: 12px;
  font-weight: 500;
}

.nav-icon {
  opacity: 0.5;
  filter: grayscale(100%);
  transition: all 0.2s ease;
}

.nav-btn.active .nav-icon {
  opacity: 1;
  filter: grayscale(0%) brightness(0) saturate(100%) invert(27%) sepia(97%) saturate(3084%) hue-rotate(212deg) brightness(101%) contrast(106%);
}

.nav-badge {
  position: relative;
}

.social-icons {
  display: flex;
  gap: 2px;
  padding: 0 8px;
  border-left: 1px solid #e0e0e0;
}

/* Scrollbar Styling */
.chatbot-body::-webkit-scrollbar {
  width: 6px;
}

.chatbot-body::-webkit-scrollbar-track {
  background: #f5f5f5;
}

.chatbot-body::-webkit-scrollbar-thumb {
  background: #ccc;
  border-radius: 3px;
}

.chatbot-body::-webkit-scrollbar-thumb:hover {
  background: #999;
}

/* Loading State */
.loading-container {
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 48px 20px;
}

/* Empty State */
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 48px 20px;
  text-align: center;
}

.empty-text {
  font-size: 16px;
  font-weight: 600;
  color: #666;
  margin: 16px 0 8px 0;
}

.empty-subtext {
  font-size: 14px;
  color: #999;
  margin: 0;
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

.user-message .message-attachment .attachment-icon {
  color: #1a1a1a !important;
}

.user-message .message-attachment .attachment-name,
.user-message .message-attachment .attachment-size {
  color: #1a1a1a;
}

.bot-message .message-attachment:hover {
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

/* Attached Files Preview (before sending) */
.attached-files {
  margin-top: 12px;
  padding: 12px;
  background: #f5f5f5;
  border-radius: 8px;
}

.attached-files-header {
  margin-bottom: 8px;
  color: #666;
  font-weight: 500;
}

.attached-files-list {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
}

/* Bottom Tab Navigation */
.chatbot-footer {
  background: white;
  border-top: 1px solid #e0e0e0;
  padding: 8px 4px;
  display: flex;
  align-items: center;
  gap: 4px;
}

.nav-btn {
  flex: 1;
  height: 64px !important;
  border-radius: 8px !important;
  text-transform: none !important;
  color: #666 !important;
  min-width: 60px !important;
}

.nav-btn.active {
  color: #0061FB !important;
}

.nav-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
}

.nav-label {
  font-size: 12px;
  font-weight: 500;
}

.nav-badge {
  position: relative;
}

/* Animations */
@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes slideInRight {
  from {
    opacity: 0;
    transform: translateX(20px) scale(0.95);
  }
  to {
    opacity: 1;
    transform: translateX(0) scale(1);
  }
}

.message-fade-in {
  animation: fadeInUp 0.4s ease-out;
}

.chatbot-dialog {
  animation: slideInRight 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
}


:deep(.chatbot-menu-content) {
  border-radius: 20px !important;
  overflow: hidden;
  box-shadow: 0 8px 32px rgba(0,0,0,0.18) !important;
  max-height: 600px !important;
  transform: none !important;
}

:deep(.chatbot-menu-content .v-overlay__content) {
  max-height: 600px !important;
  transform: none !important;
}
</style>
