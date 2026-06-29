<template>
  <div class="reporting-bot-page">
    <!-- Sidebar: session history -->
    <div class="sessions-sidebar">
      <div class="sidebar-header">
        <span class="sidebar-title">History</span>
        <v-btn icon size="small" variant="text" @click="startNewSession">
          <v-icon color="#0061FB">mdi-plus</v-icon>
        </v-btn>
      </div>

      <div class="sessions-list">
        <div
          v-for="session in sessions"
          :key="session.id"
          class="session-item"
          :class="{ active: activeSessionId === session.id }"
          @click="loadSession(session)"
        >
          <v-icon size="16" class="session-icon">mdi-message-text-outline</v-icon>
          <span class="session-label">{{ session.subject || 'New conversation' }}</span>
        </div>
        <div v-if="sessions.length === 0" class="no-sessions">No history yet</div>
      </div>
    </div>

    <!-- Main area -->
    <div class="main-area">
      <!-- Home view: no active session -->
      <div v-if="!activeSessionId" class="home-view">
        <div class="home-center">
          <div class="home-logo">
            <v-icon size="48" color="#0061FB">mdi-chart-bar</v-icon>
          </div>
          <h1 class="home-title">FlosslyOS Reporting Bot</h1>
          <p class="home-subtitle">Ask anything about your practice data — leads, tasks, diary, staff, and more.</p>

          <!-- Suggested questions -->
          <div class="suggestions-grid">
            <button
              v-for="(suggestion, i) in visibleSuggestions"
              :key="i"
              class="suggestion-card"
              @click="startWithSuggestion(suggestion)"
            >
              <v-icon size="16" color="#0061FB" class="suggestion-icon">{{ suggestion.icon }}</v-icon>
              <span>{{ suggestion.text }}</span>
            </button>
          </div>

          <v-btn variant="text" size="small" color="grey" class="refresh-btn" @click="shuffleSuggestions">
            <v-icon size="16" class="mr-1">mdi-refresh</v-icon> Show different questions
          </v-btn>
        </div>

        <!-- Input at bottom of home view -->
        <div class="home-input-wrapper">
          <div class="input-bar">
            <textarea
              ref="homeInputRef"
              v-model="pendingMessage"
              class="chat-textarea"
              placeholder="Ask a question about your practice data..."
              rows="1"
              @keydown.enter.exact.prevent="submitFromHome"
              @input="autoResize($event.target)"
            />
            <v-btn
              icon
              size="small"
              color="#0061FB"
              :disabled="!pendingMessage.trim() || isLoading"
              @click="submitFromHome"
            >
              <v-icon>mdi-send</v-icon>
            </v-btn>
          </div>
        </div>
      </div>

      <!-- Chat view: active session -->
      <div v-else class="chat-view">
        <div class="chat-messages" ref="messagesContainer">
          <div
            v-for="msg in activeMessages"
            :key="msg.id"
            class="message-row"
            :class="msg.senderType === 'user' ? 'user-row' : 'bot-row'"
          >
            <!-- Bot message -->
            <template v-if="msg.senderType !== 'user'">
              <div class="bot-avatar">
                <v-icon size="18" color="white">mdi-chart-bar</v-icon>
              </div>
              <div class="bot-bubble">
                <div class="markdown-content" v-html="renderMarkdown(msg.message)" />
                <div v-if="!msg.streaming && msg.message?.length > 100" class="export-actions">
                  <button v-if="hasTable(msg.message)" class="export-btn" @click="downloadExcel(msg.message)">
                    <v-icon size="12">mdi-microsoft-excel</v-icon> Excel
                  </button>
                  <button class="export-btn" @click="openAsPdf(msg.message)">
                    <v-icon size="12">mdi-file-pdf-box</v-icon> PDF
                  </button>
                </div>
                <span v-if="msg.streaming" class="streaming-cursor">▋</span>
              </div>
            </template>

            <!-- User message -->
            <template v-else>
              <div class="user-bubble">{{ msg.message }}</div>
            </template>
          </div>

          <!-- Typing indicator -->
          <div v-if="isWaiting && !streamingText" class="message-row bot-row">
            <div class="bot-avatar"><v-icon size="18" color="white">mdi-chart-bar</v-icon></div>
            <div class="bot-bubble typing-bubble">
              <span></span><span></span><span></span>
            </div>
          </div>

          <div ref="bottomAnchor" style="height:1px" />
        </div>

        <!-- Input -->
        <div class="chat-input-wrapper">
          <div class="input-bar">
            <textarea
              ref="chatInputRef"
              v-model="pendingMessage"
              class="chat-textarea"
              placeholder="Ask a follow-up question..."
              rows="1"
              :disabled="isWaiting"
              @keydown.enter.exact.prevent="submitMessage"
              @input="autoResize($event.target)"
            />
            <v-btn
              icon
              size="small"
              color="#0061FB"
              :disabled="!pendingMessage.trim() || isWaiting"
              @click="submitMessage"
            >
              <v-icon>mdi-send</v-icon>
            </v-btn>
          </div>
          <p class="input-disclaimer">FlosslyOS Reporting Bot may make mistakes. Always verify critical figures.</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { marked } from 'marked';
import supportChatService from '~/services/supportChatService.js';

marked.setOptions({ breaks: true, gfm: true });

definePageMeta({ layout: 'default' });

// ─── All 213 prompts, grouped with icons ───────────────────────────────────
const ALL_PROMPTS = [
  { text: 'How many total leads do I have?', icon: 'mdi-account-group' },
  { text: 'How many leads are in each status — New, Contacted, Converted, Lost?', icon: 'mdi-filter-variant' },
  { text: 'What is my overall lead-to-conversion rate?', icon: 'mdi-percent' },
  { text: 'How many leads have I converted this month?', icon: 'mdi-trophy' },
  { text: 'How many leads were marked as Lost this month?', icon: 'mdi-account-off' },
  { text: 'Show me the full pipeline breakdown for this week.', icon: 'mdi-chart-sankey' },
  { text: 'How many leads came in this week?', icon: 'mdi-calendar-week' },
  { text: 'How many leads have overdue follow-up dates?', icon: 'mdi-clock-alert' },
  { text: 'Which lead source generates the most leads overall?', icon: 'mdi-source-branch' },
  { text: 'Which lead source has the highest conversion rate?', icon: 'mdi-trending-up' },
  { text: 'Compare Meta Leadgen vs Chatbot conversion rates.', icon: 'mdi-compare' },
  { text: 'Which treatment is enquired about most overall?', icon: 'mdi-tooth-outline' },
  { text: 'Which treatment has the highest conversion rate?', icon: 'mdi-star' },
  { text: 'What is my average speed to lead — time from inquiry to first contact?', icon: 'mdi-timer-outline' },
  { text: 'What percentage of leads are contacted within 1 hour of enquiring?', icon: 'mdi-clock-fast' },
  { text: 'How many leads have been sitting in New status for more than 7 days?', icon: 'mdi-alert-circle' },
  { text: 'Which team member has the highest lead conversion rate?', icon: 'mdi-account-star' },
  { text: 'Which staff member has the most overdue follow-ups?', icon: 'mdi-account-alert' },
  { text: 'How many follow-ups are due today?', icon: 'mdi-calendar-today' },
  { text: 'How many follow-ups are overdue?', icon: 'mdi-calendar-alert' },
  { text: 'Show me all hot leads that haven\'t converted yet.', icon: 'mdi-fire' },
  { text: 'What is my total Meta ad spend this month?', icon: 'mdi-currency-gbp' },
  { text: 'Which Meta campaign generated the most leads?', icon: 'mdi-bullhorn' },
  { text: 'What is my average cost per lead from Meta this month?', icon: 'mdi-cash-multiple' },
  { text: 'How many patients are in the system?', icon: 'mdi-account-heart' },
  { text: 'How many patients are overdue for recall?', icon: 'mdi-tooth' },
  { text: 'How many appointments are booked this week?', icon: 'mdi-calendar-check' },
  { text: 'What is my DNA (Did Not Attend) rate this month?', icon: 'mdi-calendar-remove' },
  { text: 'How many tasks are overdue right now?', icon: 'mdi-checkbox-marked-circle-auto-outline' },
  { text: 'How many tasks are due today?', icon: 'mdi-checkbox-blank-circle-outline' },
  { text: 'Which team member has the most overdue tasks?', icon: 'mdi-account-clock' },
  { text: 'What is my team\'s overall task completion rate this week?', icon: 'mdi-chart-line' },
  { text: 'How many rotas have been published?', icon: 'mdi-calendar-month' },
  { text: 'How many holiday requests are currently pending approval?', icon: 'mdi-beach' },
  { text: 'Give me a full KPI summary for this month.', icon: 'mdi-view-dashboard' },
  { text: 'Give me a full KPI summary for the last 30 days.', icon: 'mdi-calendar-month-outline' },
  { text: 'What is my top-of-funnel performance this month?', icon: 'mdi-funnel' },
  { text: 'What are my top 3 lead sources by conversion rate this month?', icon: 'mdi-podium-gold' },
  { text: 'How many leads are currently at risk of going cold?', icon: 'mdi-snowflake-alert' },
  { text: 'Compare this month\'s performance to last month across all key metrics.', icon: 'mdi-swap-horizontal' },
];

const visibleSuggestions = ref([]);

const shuffleSuggestions = () => {
  const shuffled = [...ALL_PROMPTS].sort(() => Math.random() - 0.5);
  visibleSuggestions.value = shuffled.slice(0, 6);
};

shuffleSuggestions();

// ─── Session management ────────────────────────────────────────────────────
const sessions = ref([]);
const activeSessionId = ref(null);
const activeMessages = ref([]);
const pendingMessage = ref('');
const isWaiting = ref(false);
const streamingText = ref('');
const messagesContainer = ref(null);
const bottomAnchor = ref(null);
const homeInputRef = ref(null);
const chatInputRef = ref(null);
let activeEventSource = null;

const fetchSessions = async () => {
  const res = await supportChatService.getConversations({ conversationType: 'reporting-bot', widgetView: true });
  if (res?.success) {
    sessions.value = (res.data ?? [])
      .sort((a, b) => new Date(b.lastMessageAt || b.createdAt) - new Date(a.lastMessageAt || a.createdAt));
  }
};

const route = useRoute();

onMounted(async () => {
  await fetchSessions();
  const convId = route.query.conversationId ? parseInt(route.query.conversationId) : null;
  if (convId) {
    const session = sessions.value.find(s => s.id === convId);
    if (session) loadSession(session);
  }
});

const startNewSession = () => {
  activeSessionId.value = null;
  activeMessages.value = [];
  pendingMessage.value = '';
  streamingText.value = '';
  isWaiting.value = false;
  closeStream();
};

const loadSession = async (session) => {
  closeStream();
  activeSessionId.value = session.id;
  streamingText.value = '';
  isWaiting.value = false;
  const res = await supportChatService.getConversationById(session.id);
  const msgs = res?.data?.messages ?? [];
  activeMessages.value = msgs.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
  await nextTick();
  scrollToBottom();
};

// ─── Sending messages ──────────────────────────────────────────────────────
const submitFromHome = async () => {
  if (!pendingMessage.value.trim()) return;
  // Create conversation first
  const convRes = await supportChatService.createConversation({
    conversationType: 'reporting-bot',
    subject: pendingMessage.value.trim().slice(0, 100),
  });
  if (!convRes?.success || !convRes?.data?.id) return;
  const convId = convRes.data.id;
  activeSessionId.value = convId;
  activeMessages.value = [];
  await fetchSessions();
  await sendUserMessage(convId, pendingMessage.value.trim());
};

const submitMessage = async () => {
  if (!pendingMessage.value.trim() || isWaiting.value) return;
  await sendUserMessage(activeSessionId.value, pendingMessage.value.trim());
};

const sendUserMessage = async (conversationId, text) => {
  const msg = text;
  pendingMessage.value = '';
  await nextTick();
  if (chatInputRef.value) chatInputRef.value.style.height = 'auto';

  const userMsg = { id: `u-${Date.now()}`, message: msg, senderType: 'user', createdAt: new Date().toISOString() };
  activeMessages.value.push(userMsg);
  isWaiting.value = true;
  await nextTick();
  scrollToBottom();

  // Save user message
  const msgRes = await supportChatService.createMessage({ conversationId, message: msg, senderType: 'user' });
  if (!msgRes?.success) {
    isWaiting.value = false;
    return;
  }
  // Replace temp with real
  activeMessages.value = activeMessages.value.filter(m => m.id !== userMsg.id);
  activeMessages.value.push(msgRes.data);

  // Open SSE stream
  openStream(conversationId);
  await fetchSessions();
};

const startWithSuggestion = (suggestion) => {
  pendingMessage.value = suggestion.text;
  submitFromHome();
};

// ─── SSE streaming ─────────────────────────────────────────────────────────
const openStream = (conversationId) => {
  closeStream();
  streamingText.value = '';
  const streamingMsgId = `stream-${Date.now()}`;
  activeMessages.value.push({ id: streamingMsgId, message: '', senderType: 'ai', createdAt: new Date().toISOString(), streaming: true });

  const es = new EventSource(`/api/reportingBot/stream?conversationId=${conversationId}`);
  activeEventSource = es;

  es.onmessage = async (event) => {
    try {
      const data = JSON.parse(event.data);
      if (data.chunk) {
        streamingText.value += data.chunk;
        const streamMsg = activeMessages.value.find(m => m.id === streamingMsgId);
        if (streamMsg) streamMsg.message = streamingText.value;
        await nextTick();
        scrollToBottom();
      }
      if (data.done || data.error) {
        es.close();
        activeEventSource = null;
        isWaiting.value = false;
        activeMessages.value = activeMessages.value.filter(m => m.id !== streamingMsgId);
        if (data.message) {
          activeMessages.value.push({ ...data.message, streaming: false });
        }
        streamingText.value = '';
        await nextTick();
        scrollToBottom();
        await fetchSessions();
      }
    } catch (e) {
      console.error('SSE parse error', e);
    }
  };

  es.onerror = () => {
    es.close();
    activeEventSource = null;
    isWaiting.value = false;
    activeMessages.value = activeMessages.value.filter(m => m.id !== streamingMsgId);
    streamingText.value = '';
  };
};

const closeStream = () => {
  if (activeEventSource) { activeEventSource.close(); activeEventSource = null; }
};

onUnmounted(closeStream);

// ─── Markdown + scroll ─────────────────────────────────────────────────────
const renderMarkdown = (text) => {
  if (!text) return '';
  return marked.parse(text);
};

const scrollToBottom = () => {
  bottomAnchor.value?.scrollIntoView({ behavior: 'smooth' });
};

const autoResize = (el) => {
  el.style.height = 'auto';
  el.style.height = Math.min(el.scrollHeight, 160) + 'px';
};

// ─── Export helpers ────────────────────────────────────────────────────────
const hasTable = (text) => /^\|.+\|/m.test(text || '');

const stripMd = (s) => s.replace(/\*\*(.+?)\*\*/g, '$1').replace(/\*(.+?)\*/g, '$1').trim();

const parseMarkdownTables = (text) => {
  const tables = [];
  const lines = (text || '').split('\n');
  let current = null;
  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed.startsWith('|')) {
      if (/^\|[\s|:-]+\|$/.test(trimmed)) continue;
      const cells = trimmed.split('|').slice(1, -1).map(c => stripMd(c.trim()));
      if (!current) { current = { headers: cells, rows: [] }; }
      else { current.rows.push(cells); }
    } else {
      if (current) { tables.push(current); current = null; }
    }
  }
  if (current) tables.push(current);
  return tables;
};

const downloadExcel = async (text) => {
  const XLSX = await import('xlsx');
  const tables = parseMarkdownTables(text);
  if (!tables.length) return;
  const wb = XLSX.utils.book_new();
  tables.forEach((table, i) => {
    const ws = XLSX.utils.aoa_to_sheet([table.headers, ...table.rows]);
    ws['!cols'] = table.headers.map((h, ci) => ({
      wch: Math.max(h.length, ...table.rows.map(r => (r[ci] || '').length), 10)
    }));
    XLSX.utils.book_append_sheet(wb, ws, `Table ${i + 1}`);
  });
  XLSX.writeFile(wb, 'flossly-report.xlsx');
};

const openAsPdf = (text) => {
  const htmlContent = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>FlosslyOS Report</title>
    <style>
      body { font-family: Arial, sans-serif; max-width: 900px; margin: 40px auto; padding: 0 24px; color: #1a1a1a; line-height: 1.6; }
      h1,h2,h3 { color: #0061FB; }
      table { border-collapse: collapse; width: 100%; margin: 16px 0; }
      th { background: #0061FB; color: white; padding: 8px 12px; text-align: left; }
      td { padding: 8px 12px; border-bottom: 1px solid #e5e7eb; }
      tr:nth-child(even) td { background: #f9fafb; }
      code { background: #f3f4f6; padding: 2px 6px; border-radius: 4px; }
      pre { background: #f3f4f6; padding: 16px; border-radius: 8px; overflow-x: auto; }
    </style>
    </head><body>${marked.parse(text)}</body></html>`;
  const blob = new Blob([htmlContent], { type: 'text/html' });
  const url = URL.createObjectURL(blob);
  window.open(url, '_blank');
  setTimeout(() => URL.revokeObjectURL(url), 60000);
};
</script>

<style scoped>
.reporting-bot-page {
  display: flex;
  height: calc(100vh - 64px);
  background: #f8f9fb;
  overflow: hidden;
}

/* ── Sidebar ── */
.sessions-sidebar {
  width: 260px;
  min-width: 260px;
  background: white;
  border-right: 1px solid #e5e7eb;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.sidebar-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 16px 12px;
  border-bottom: 1px solid #f0f0f0;
}

.sidebar-title {
  font-weight: 700;
  font-size: 14px;
  color: #111827;
}

.sessions-list {
  flex: 1;
  overflow-y: auto;
  padding: 8px;
}

.session-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 12px;
  border-radius: 8px;
  cursor: pointer;
  font-size: 13px;
  color: #374151;
  transition: background 0.15s;
  overflow: hidden;
}

.session-item:hover { background: #f3f4f6; }
.session-item.active { background: #eff6ff; color: #0061FB; font-weight: 600; }

.session-icon { flex-shrink: 0; opacity: 0.6; }

.session-label {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.no-sessions {
  padding: 16px;
  color: #9ca3af;
  font-size: 13px;
  text-align: center;
}

/* ── Main ── */
.main-area {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

/* ── Home view ── */
.home-view {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.home-center {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px 24px 16px;
  overflow-y: auto;
}

.home-logo {
  width: 72px;
  height: 72px;
  background: #eff6ff;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 20px;
}

.home-title {
  font-size: 26px;
  font-weight: 700;
  color: #111827;
  margin-bottom: 8px;
}

.home-subtitle {
  font-size: 15px;
  color: #6b7280;
  margin-bottom: 32px;
  text-align: center;
  max-width: 500px;
}

.suggestions-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
  width: 100%;
  max-width: 680px;
  margin-bottom: 16px;
}

.suggestion-card {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  padding: 14px 16px;
  font-size: 13px;
  color: #374151;
  text-align: left;
  cursor: pointer;
  transition: border-color 0.15s, box-shadow 0.15s;
  line-height: 1.4;
}

.suggestion-card:hover {
  border-color: #0061FB;
  box-shadow: 0 0 0 1px #0061FB22;
}

.suggestion-icon { flex-shrink: 0; margin-top: 1px; }

.refresh-btn { margin-top: 4px; font-size: 12px; }

/* ── Home input ── */
.home-input-wrapper {
  padding: 16px 24px 20px;
  border-top: 1px solid #f0f0f0;
  background: white;
}

/* ── Chat view ── */
.chat-view {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.chat-messages {
  flex: 1;
  overflow-y: auto;
  padding: 24px;
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.message-row {
  display: flex;
  align-items: flex-start;
  gap: 12px;
}

.bot-row { flex-direction: row; }
.user-row { flex-direction: row-reverse; }

.bot-avatar {
  width: 36px;
  height: 36px;
  min-width: 36px;
  border-radius: 50%;
  background: #0061FB;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.bot-bubble {
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  padding: 14px 16px;
  max-width: 80%;
  font-size: 14px;
  line-height: 1.6;
  color: #111827;
}

.user-bubble {
  background: #0061FB;
  color: white;
  border-radius: 12px;
  padding: 12px 16px;
  max-width: 70%;
  font-size: 14px;
  line-height: 1.5;
}

.typing-bubble {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 14px 16px;
}

.typing-bubble span {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #9ca3af;
  display: inline-block;
  animation: bounce 1.2s infinite;
}
.typing-bubble span:nth-child(2) { animation-delay: 0.2s; }
.typing-bubble span:nth-child(3) { animation-delay: 0.4s; }

@keyframes bounce {
  0%, 60%, 100% { transform: translateY(0); }
  30% { transform: translateY(-6px); }
}

.streaming-cursor {
  display: inline-block;
  animation: blink 1s step-end infinite;
  color: #0061FB;
  font-weight: bold;
}

@keyframes blink {
  50% { opacity: 0; }
}

.export-actions {
  display: flex;
  gap: 8px;
  margin-top: 10px;
}

.export-btn {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 4px 10px;
  border-radius: 6px;
  border: 1px solid #d1d5db;
  background: #f9fafb;
  font-size: 12px;
  color: #374151;
  cursor: pointer;
  transition: background 0.15s;
}
.export-btn:hover { background: #f3f4f6; border-color: #9ca3af; }

/* ── Chat input ── */
.chat-input-wrapper {
  padding: 12px 24px 16px;
  border-top: 1px solid #e5e7eb;
  background: white;
}

/* ── Shared input bar ── */
.input-bar {
  display: flex;
  align-items: flex-end;
  gap: 8px;
  background: white;
  border: 1.5px solid #d1d5db;
  border-radius: 14px;
  padding: 10px 12px 10px 16px;
  transition: border-color 0.15s;
}

.input-bar:focus-within { border-color: #0061FB; }

.chat-textarea {
  flex: 1;
  border: none;
  outline: none;
  font-size: 14px;
  color: #111827;
  resize: none;
  line-height: 1.5;
  background: transparent;
  max-height: 160px;
  overflow-y: auto;
  font-family: inherit;
}

.chat-textarea::placeholder { color: #9ca3af; }

.input-disclaimer {
  font-size: 11px;
  color: #9ca3af;
  text-align: center;
  margin-top: 8px;
  margin-bottom: 0;
}

/* ── Markdown content ── */
.markdown-content :deep(p) { margin: 0 0 10px; }
.markdown-content :deep(p:last-child) { margin-bottom: 0; }
.markdown-content :deep(ul), .markdown-content :deep(ol) { padding-left: 20px; margin: 8px 0; }
.markdown-content :deep(li) { margin-bottom: 4px; }
.markdown-content :deep(table) { border-collapse: collapse; width: 100%; margin: 12px 0; font-size: 13px; }
.markdown-content :deep(th) { background: #0061FB; color: white; padding: 8px 12px; text-align: left; }
.markdown-content :deep(td) { padding: 7px 12px; border-bottom: 1px solid #e5e7eb; }
.markdown-content :deep(tr:nth-child(even) td) { background: #f9fafb; }
.markdown-content :deep(code) { background: #f3f4f6; padding: 2px 5px; border-radius: 4px; font-size: 12px; }
.markdown-content :deep(pre) { background: #f3f4f6; padding: 12px 16px; border-radius: 8px; overflow-x: auto; }
.markdown-content :deep(h1), .markdown-content :deep(h2), .markdown-content :deep(h3) { color: #111827; margin: 12px 0 6px; }
.markdown-content :deep(strong) { color: #111827; }
</style>
