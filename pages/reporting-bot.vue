<template>
  <div class="rb-page">

    <!-- Left column: main content + footer -->
    <div class="rb-left">
      <div class="rb-main">

        <!-- Home view -->
        <div v-if="!activeSessionId" class="rb-home">
          <div class="rb-avatar-wrap">
            <img src="/reporting-ico.svg" alt="Reporting Bot" class="rb-avatar-img" />
          </div>
          <h1 class="rb-greeting">Hello, {{ firstName }}</h1>
          <p class="rb-subtitle">What report would you like to run for you?</p>

          <!-- Home input -->
          <div class="rb-input-wrap rb-home-input">
            <div class="rb-input-bar">
              <img src="/reportpage/attach.svg" alt="attach" class="rb-input-icon rb-attach-btn" @click="triggerFileInput" />
              <textarea
                ref="homeInputRef"
                v-model="pendingMessage"
                class="rb-textarea"
                placeholder="Ask anything"
                rows="1"
                @keydown.enter.exact.prevent="submitFromHome"
                @input="autoResize($event.target)"
              />
              <button
                class="rb-send-btn"
                :disabled="(!pendingMessage.trim() && !attachedFiles.length) || isLoading"
                @click="submitFromHome"
              >
                <img src="/reportpage/send.svg" alt="send" style="width:18px;height:18px;" />
              </button>
            </div>
            <div v-if="attachedFiles.length" class="rb-attached-chips">
              <span v-for="(f, i) in attachedFiles" :key="i" class="rb-file-chip">
                <v-icon size="12">mdi-paperclip</v-icon> {{ f.name }}
                <button class="rb-chip-remove" @click.stop="removeFile(i)">×</button>
              </span>
            </div>
          </div>

          <!-- Suggestion cards -->
          <div class="rb-cards">
            <button
              v-for="(card, i) in suggestionCards"
              :key="i"
              class="rb-card"
              @click="startWithText(card.question)"
            >
              <img :src="card.iconSrc" :alt="card.title" class="rb-card-icon-img" />
              <div class="rb-card-title">{{ card.title }}</div>
              <div class="rb-card-desc">{{ card.description }}</div>
            </button>
          </div>

          <!-- Quick reports -->
          <div class="rb-reports-section">
            <span class="rb-reports-label">Reports</span>
            <div class="rb-pills">
              <button
                v-for="(pill, i) in quickReports"
                :key="i"
                class="rb-pill"
                @click="startWithText(pill.question)"
              >
                <v-icon size="14" color="#6b7280">{{ pill.icon }}</v-icon>
                <span>{{ pill.label }}</span>
              </button>
            </div>
          </div>
        </div>


        <!-- Chat view -->
        <div v-else class="rb-chat">
          <div class="rb-chat-header">
            <v-btn icon size="small" variant="text" @click="startNewSession">
              <v-icon>mdi-arrow-left</v-icon>
            </v-btn>
            <span class="rb-chat-title">{{ activeSession?.subject || 'Reporting Bot' }}</span>
          </div>

          <div class="rb-messages" ref="messagesContainer">
            <div
              v-for="msg in activeMessages"
              :key="msg.id"
              class="rb-msg-row"
              :class="msg.senderType === 'user' ? 'rb-user-row' : 'rb-bot-row'"
            >
              <template v-if="msg.senderType !== 'user'">
                <div class="rb-msg-avatar">
                  <img src="/ava.svg" alt="bot" class="rb-bubble-avatar" />
                </div>
                <div class="rb-bot-bubble">
                  <div class="rb-md" v-html="renderMarkdown(msg.message)" />
                  <div v-if="!msg.streaming && hasTable(msg.message)" class="rb-export-row">
                    <button class="rb-export-btn" @click="downloadExcel(msg.message)">
                      <v-icon size="11">mdi-microsoft-excel</v-icon> Excel
                    </button>
                  </div>
                  <span v-if="msg.streaming" class="rb-cursor">▋</span>
                </div>
              </template>
              <template v-else>
                <div class="rb-user-bubble">
                  <div v-if="msg.metadata?.files?.length" class="rb-bubble-files">
                    <span v-for="(f, i) in msg.metadata.files" :key="i" class="rb-bubble-file-chip">
                      <v-icon size="13">{{ fileIcon(f.type) }}</v-icon> {{ f.name }}
                    </span>
                  </div>
                  <span v-if="msg.message">{{ msg.message }}</span>
                </div>
              </template>
            </div>

            <!-- Typing / tool indicator -->
            <div v-if="isWaiting && !streamingActive" class="rb-msg-row rb-bot-row">
              <div class="rb-msg-avatar">
                <img src="/ava.svg" alt="bot" class="rb-bubble-avatar" />
              </div>
              <div v-if="currentToolLabel" class="rb-bot-bubble rb-tool-status">
                <span class="rb-tool-dot" /><span class="rb-tool-label">{{ currentToolLabel }}</span>
              </div>
              <div v-else class="rb-bot-bubble rb-typing">
                <span /><span /><span />
              </div>
            </div>

            <div ref="bottomAnchor" />
          </div>
        </div>
      </div>

      <!-- Sticky input footer (chat view only) -->
      <div v-if="activeSessionId" class="rb-input-footer">
        <div class="rb-input-wrap">
          <div class="rb-input-bar">
            <img src="/reportpage/attach.svg" alt="attach" class="rb-input-icon rb-attach-btn" @click="triggerFileInput" />
            <textarea
              ref="chatInputRef"
              v-model="pendingMessage"
              class="rb-textarea"
              placeholder="Ask anything"
              rows="1"
              :disabled="isWaiting"
              @keydown.enter.exact.prevent="submitMessage"
              @input="autoResize($event.target)"
            />
            <button
              class="rb-send-btn"
              :disabled="(!pendingMessage.trim() && !attachedFiles.length) || isWaiting"
              @click="submitMessage"
            >
              <img src="/reportpage/send.svg" alt="send" style="width:18px;height:18px;" />
            </button>
          </div>
          <div v-if="attachedFiles.length" class="rb-attached-chips">
            <span v-for="(f, i) in attachedFiles" :key="i" class="rb-file-chip">
              <v-icon size="12">mdi-paperclip</v-icon> {{ f.name }}
              <button class="rb-chip-remove" @click.stop="removeFile(i)">×</button>
            </span>
          </div>
        </div>
      </div>
      <input ref="fileInputRef" type="file" multiple accept="image/jpeg,image/png,image/gif,image/webp,.pdf,.csv,.txt" style="display:none" @change="onFilesSelected" />
    </div>

    <!-- Recents sidebar (full height) -->
    <div class="rb-recents">
      <div class="rb-recents-header">
        <img src="/reportpage/recent.svg" alt="recents" style="width:18px;height:18px;" />
        <span class="rb-recents-title">Recents</span>
      </div>
      <div class="rb-recents-list">
        <button
          v-for="session in sessions"
          :key="session.id"
          class="rb-recent-item"
          :class="{ active: activeSessionId === session.id }"
          @click="loadSession(session)"
        >
          {{ session.subject || 'New conversation' }}
        </button>
        <div v-if="sessions.length === 0" class="rb-recents-empty">No recent conversations</div>
      </div>
    </div>

  </div>
</template>

<script setup>
import { Marked } from 'marked';
import reportingBotService from '~/services/reportingBotService.js';

definePageMeta({ layout: 'home' });

const md = new Marked({ breaks: true, gfm: true });

const { user } = useUser();
const firstName = computed(() => (user.value?.fullName || 'there').split(' ')[0]);

// ─── Suggestion cards ─────────────────────────────────────────────────────
const ALL_CARDS = [
  { iconSrc: '/reportpage/response-time.svg', title: 'Response Time',  description: "What's our average speed to lead this month vs last month?",    question: "What's our average speed to lead this month vs last month?" },
  { iconSrc: '/reportpage/campaign.svg',       title: 'Campaigns',      description: 'Which campaign generated the most leads in the last 90 days?',  question: 'Which Meta campaign generated the most leads in the last 90 days?' },
  { iconSrc: '/reportpage/cost.svg',           title: 'Cost Analysis',  description: "What's our cost per lead from Meta this month?",                question: "What's our cost per lead from Meta this month?" },
  { iconSrc: '/reportpage/response-time.svg', title: 'Lead Pipeline',  description: 'Show me the full pipeline breakdown for this week.',             question: 'Show me the full pipeline breakdown for this week.' },
  { iconSrc: '/reportpage/campaign.svg',       title: 'Top Performers', description: 'Which team member has the highest lead conversion rate?',        question: 'Which team member has the highest lead conversion rate?' },
  { iconSrc: '/reportpage/cost.svg',           title: 'Treatment Mix',  description: 'Which treatment is enquired about most overall?',               question: 'Which treatment is enquired about most overall?' },
];

const QUICK_REPORTS = [
  { icon: 'mdi-cash',                   label: 'Total income this month',       question: 'What is the total income this month?' },
  { icon: 'mdi-account-plus-outline',   label: 'New patient per month',         question: 'How many new patients joined this month?' },
  { icon: 'mdi-percent',                label: 'Conversion rate',               question: 'What is my overall lead-to-conversion rate?' },
  { icon: 'mdi-calendar-remove',        label: 'DNA rate this month',           question: 'What is my DNA (Did Not Attend) rate this month?' },
  { icon: 'mdi-account-group-outline',  label: 'Total leads this month',        question: 'How many leads came in this month?' },
  { icon: 'mdi-trending-up',            label: 'Top converting lead source',    question: 'Which lead source has the highest conversion rate?' },
  { icon: 'mdi-clock-alert-outline',    label: 'Overdue follow-ups',            question: 'How many follow-ups are overdue?' },
  { icon: 'mdi-trophy-outline',         label: 'Top performer this month',      question: 'Which team member has the highest lead conversion rate this month?' },
  { icon: 'mdi-currency-gbp',           label: 'Meta ad spend this month',      question: 'What is my total Meta ad spend this month?' },
  { icon: 'mdi-checkbox-marked-circle-outline', label: 'Tasks completed today', question: 'How many tasks were completed today?' },
];

const suggestionCards = ref([]);
const quickReports = ref(QUICK_REPORTS);

const pickCards = () => {
  const shuffled = [...ALL_CARDS].sort(() => Math.random() - 0.5);
  suggestionCards.value = shuffled.slice(0, 3);
};
pickCards();

// ─── Sessions ─────────────────────────────────────────────────────────────
const sessions = ref([]);
const activeSessionId = ref(null);
const activeSession = ref(null);
const activeMessages = ref([]);
const pendingMessage = ref('');
const isWaiting = ref(false);
const isLoading = ref(false);
const streamingActive = ref(false);
const currentToolLabel = ref('');
const messagesContainer = ref(null);
const bottomAnchor = ref(null);
const homeInputRef = ref(null);
const chatInputRef = ref(null);
const fileInputRef = ref(null);
const attachedFiles = ref([]);
let activeEventSource = null;

const triggerFileInput = () => fileInputRef.value?.click();

const onFilesSelected = (e) => {
  const files = Array.from(e.target.files || []);
  attachedFiles.value.push(...files);
  e.target.value = '';
};

const removeFile = (i) => attachedFiles.value.splice(i, 1);

const readFileAsBase64 = (file) => new Promise((resolve, reject) => {
  const reader = new FileReader();
  reader.onload = () => resolve({ name: file.name, type: file.type, data: reader.result.split(',')[1] });
  reader.onerror = reject;
  reader.readAsDataURL(file);
});

const fetchSessions = async () => {
  const res = await reportingBotService.getConversations();
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
  closeStream();
  activeSessionId.value = null;
  activeSession.value = null;
  activeMessages.value = [];
  pendingMessage.value = '';
  isWaiting.value = false;
  streamingActive.value = false;
  pickCards();
};

const loadSession = async (session) => {
  closeStream();
  activeSessionId.value = session.id;
  activeSession.value = session;
  isWaiting.value = false;
  streamingActive.value = false;
  const res = await reportingBotService.getConversationById(session.id);
  activeMessages.value = (res?.data?.messages ?? [])
    .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
  await nextTick();
  scrollToBottom();
};

// ─── Sending ──────────────────────────────────────────────────────────────
const startWithText = (text) => {
  pendingMessage.value = text;
  submitFromHome();
};

const submitFromHome = async () => {
  const text = pendingMessage.value.trim();
  if (!text || isLoading.value) return;
  isLoading.value = true;
  const convRes = await reportingBotService.createConversation({
    subject: text.slice(0, 100),
  });
  isLoading.value = false;
  if (!convRes?.success || !convRes?.data?.id) return;
  const convId = convRes.data.id;
  activeSessionId.value = convId;
  activeSession.value = convRes.data;
  activeMessages.value = [];
  await fetchSessions();
  await sendUserMessage(convId, text);
};

const submitMessage = async () => {
  const text = pendingMessage.value.trim();
  if (!text || isWaiting.value) return;
  await sendUserMessage(activeSessionId.value, text);
};

const sendUserMessage = async (conversationId, text) => {
  const filesToSend = [...attachedFiles.value];
  attachedFiles.value = [];
  pendingMessage.value = '';
  await nextTick();
  if (chatInputRef.value) chatInputRef.value.style.height = 'auto';
  if (homeInputRef.value) homeInputRef.value.style.height = 'auto';

  let encodedFiles = [];
  if (filesToSend.length) {
    encodedFiles = await Promise.all(filesToSend.map(readFileAsBase64));
  }

  const displayText = text;
  const tempId = `u-${Date.now()}`;
  const tempMeta = encodedFiles.length ? { files: encodedFiles.map(f => ({ name: f.name, type: f.type })) } : null;
  activeMessages.value.push({ id: tempId, message: displayText, senderType: 'user', createdAt: new Date().toISOString(), metadata: tempMeta });
  isWaiting.value = true;
  await nextTick();
  scrollToBottom();

  const msgRes = await reportingBotService.createMessage({
    conversationId,
    message: displayText,
    senderType: 'user',
    ...(encodedFiles.length ? { metadata: { files: encodedFiles } } : {}),
  });
  if (!msgRes?.success) { isWaiting.value = false; return; }

  activeMessages.value = activeMessages.value.filter(m => m.id !== tempId);
  activeMessages.value.push(msgRes.data);

  openStream(conversationId);
  await fetchSessions();
};

// ─── SSE ──────────────────────────────────────────────────────────────────
const openStream = (conversationId, files = []) => {
  closeStream();
  streamingActive.value = false;
  const streamId = `s-${Date.now()}`;
  let placeholderAdded = false;

  const es = new EventSource(`/api/reportingBot/stream?conversationId=${conversationId}`);
  activeEventSource = es;

  es.onmessage = async (event) => {
    try {
      const data = JSON.parse(event.data);
      if (data.tool) {
        currentToolLabel.value = data.tool;
      }
      if (data.chunk) {
        currentToolLabel.value = '';
        if (!placeholderAdded) {
          placeholderAdded = true;
          streamingActive.value = true;
          activeMessages.value.push({ id: streamId, message: '', senderType: 'ai', createdAt: new Date().toISOString(), streaming: true });
        }
        const msg = activeMessages.value.find(m => m.id === streamId);
        if (msg) msg.message += data.chunk;
        await nextTick();
        scrollToBottom();
      }
      if (data.done || data.error) {
        es.close();
        activeEventSource = null;
        isWaiting.value = false;
        streamingActive.value = false;
        currentToolLabel.value = '';
        activeMessages.value = activeMessages.value.filter(m => m.id !== streamId);
        if (data.message) activeMessages.value.push({ ...data.message, streaming: false });
        await nextTick();
        scrollToBottom();
        await fetchSessions();
      }
    } catch (e) { console.error('SSE error', e); }
  };

  es.onerror = () => {
    es.close();
    activeEventSource = null;
    isWaiting.value = false;
    streamingActive.value = false;
    activeMessages.value = activeMessages.value.filter(m => m.id !== streamId);
  };
};

const closeStream = () => {
  if (activeEventSource) { activeEventSource.close(); activeEventSource = null; }
};

onUnmounted(closeStream);

// ─── Helpers ──────────────────────────────────────────────────────────────
const renderMarkdown = (text) => text ? md.parse(text) : '';

const scrollToBottom = () => bottomAnchor.value?.scrollIntoView({ behavior: 'smooth' });

const autoResize = (el) => {
  el.style.height = 'auto';
  el.style.height = Math.min(el.scrollHeight, 160) + 'px';
};

const hasTable = (text) => /^\|.+\|/m.test(text || '');

const fileIcon = (type = '') => {
  if (type.startsWith('image/')) return 'mdi-image-outline';
  if (type === 'application/pdf') return 'mdi-file-pdf-box';
  if (type === 'text/csv' || type.includes('spreadsheet') || type.includes('excel')) return 'mdi-file-excel-outline';
  return 'mdi-paperclip';
};
const stripMd = (s) => s.replace(/\*\*(.+?)\*\*/g, '$1').replace(/\*(.+?)\*/g, '$1').trim();

const parseMarkdownTables = (text) => {
  const tables = [];
  const lines = (text || '').split('\n');
  let current = null;
  for (const line of lines) {
    const t = line.trim();
    if (t.startsWith('|')) {
      if (/^\|[\s|:-]+\|$/.test(t)) continue;
      const cells = t.split('|').slice(1, -1).map(c => stripMd(c.trim()));
      if (!current) current = { headers: cells, rows: [] };
      else current.rows.push(cells);
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
    ws['!cols'] = table.headers.map((h, ci) => ({ wch: Math.max(h.length, ...table.rows.map(r => (r[ci] || '').length), 10) }));
    XLSX.utils.book_append_sheet(wb, ws, `Table ${i + 1}`);
  });
  XLSX.writeFile(wb, 'flossly-report.xlsx');
};

const openAsPdf = (text) => {
  const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>FlosslyOS Report</title>
    <style>body{font-family:Arial,sans-serif;max-width:900px;margin:40px auto;padding:0 24px;color:#1a1a1a;line-height:1.6}h1,h2,h3{color:#0061FB}table{border-collapse:collapse;width:100%;margin:16px 0}th{background:#0061FB;color:white;padding:8px 12px;text-align:left}td{padding:8px 12px;border-bottom:1px solid #e5e7eb}tr:nth-child(even) td{background:#f9fafb}code{background:#f3f4f6;padding:2px 6px;border-radius:4px}pre{background:#f3f4f6;padding:16px;border-radius:8px;overflow-x:auto}</style>
    </head><body>${md.parse(text)}</body></html>`;
  const blob = new Blob([html], { type: 'text/html' });
  const url = URL.createObjectURL(blob);
  window.open(url, '_blank');
  setTimeout(() => URL.revokeObjectURL(url), 60000);
};
</script>

<style scoped>
.rb-page {
  display: flex;
  flex-direction: row;
  height: calc(100vh - 64px);
  max-height: calc(100vh - 64px);
  background: #f9fafb;
  overflow: hidden;
}

/* ── Left column (main + footer stacked) ── */
.rb-left {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  min-width: 0;
}

/* ── Main ── */
.rb-main {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

/* ── Input footer ── */
.rb-input-footer {
  flex-shrink: 0;
  padding: 10px 20px 12px;
  border-top: 1px solid #e5e7eb;
  background: white;
}

/* Home input wrap — inline under subtitle */
.rb-home-input {
  max-width: 680px;
  margin-bottom: 32px;
}

/* Footer input bar — full width */
.rb-input-footer .rb-input-bar {
  max-width: 100%;
}


/* ── Home ── */
.rb-home {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  overflow-y: auto;
  padding: 40px 24px 32px;
}

/* Avatar */
.rb-avatar-wrap {
  margin-bottom: 24px;
}

.rb-avatar-img {
  width: 200px;
  height: 200px;
  display: block;
}

/* Greeting */
.rb-greeting {
  font-family: 'Inter', sans-serif;
  font-weight: 700;
  font-size: 40px;
  line-height: 130%;
  letter-spacing: 0%;
  text-align: center;
  margin-bottom: 6px;
  background: linear-gradient(90.52deg, #FFA977 0.24%, #FF85DA 33.98%, #7D77FF 66.09%, #68ECE6 99.49%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.rb-subtitle {
  font-family: 'Inter', sans-serif;
  font-weight: 500;
  font-size: 40px;
  line-height: 130%;
  letter-spacing: 0%;
  text-align: center;
  color: #111827;
  margin-bottom: 32px;
}

/* Input wrap (bar + chips below) */
.rb-input-wrap {
  display: flex;
  flex-direction: column;
  gap: 8px;
  width: 100%;
}

/* Input bar (shared) */
.rb-input-bar {
  display: flex;
  align-items: center;
  gap: 10px;
  background: white;
  border: 1.5px solid #e5e7eb;
  border-radius: 999px;
  padding: 10px 10px 10px 20px;
  width: 100%;
  transition: border-color 0.15s;
  box-shadow: 0 1px 4px rgba(0,0,0,0.06);
}

.rb-input-bar:focus-within { border-color: #0061FB; }

.rb-input-icon {
  width: 20px;
  height: 20px;
  flex-shrink: 0;
  opacity: 0.6;
}

.rb-textarea {
  flex: 1;
  border: none;
  outline: none;
  font-size: 15px;
  color: #111827;
  resize: none;
  line-height: 1.5;
  background: transparent;
  max-height: 160px;
  overflow-y: auto;
  font-family: inherit;
}

.rb-textarea::placeholder { color: #9ca3af; }

.rb-send-btn {
  width: 40px;
  height: 40px;
  min-width: 40px;
  border-radius: 50%;
  background: #0061FB;
  border: none;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background 0.15s;
  flex-shrink: 0;
}

.rb-send-btn:disabled { background: #d1d5db; cursor: default; }
.rb-send-btn:not(:disabled):hover { background: #0052d4; }

.rb-bubble-files {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-bottom: 6px;
}

.rb-bubble-file-chip {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  background: rgba(255,255,255,0.2);
  border: 1px solid rgba(255,255,255,0.35);
  border-radius: 8px;
  padding: 4px 10px;
  font-size: 12px;
  color: white;
  max-width: 220px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.rb-attach-btn { cursor: pointer; opacity: 0.7; transition: opacity 0.15s; }
.rb-attach-btn:hover { opacity: 1; }

.rb-attached-chips {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  flex-shrink: 0;
}

.rb-file-chip {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  background: #eff6ff;
  border: 1px solid #bfdbfe;
  border-radius: 999px;
  padding: 2px 8px;
  font-size: 12px;
  color: #1d4ed8;
  white-space: nowrap;
}

.rb-chip-remove {
  background: none;
  border: none;
  cursor: pointer;
  color: #6b7280;
  font-size: 14px;
  line-height: 1;
  padding: 0 0 0 2px;
}
.rb-chip-remove:hover { color: #111827; }

/* Cards */
.rb-cards {
  display: flex;
  gap: 14px;
  margin-top: 28px;
  width: 100%;
  max-width: 680px;
}

.rb-card {
  flex: 1;
  background: #ffffff;
  border: 1px solid #dedede;
  border-radius: 14px;
  padding: 18px 16px;
  text-align: left;
  cursor: pointer;
  transition: box-shadow 0.15s;
  display: flex;
  flex-direction: column;
  gap: 6px;
  box-shadow: 0px 8px 10px 0px rgba(0, 0, 0, 0.06);
}

.rb-card:hover {
  box-shadow: 0px 12px 20px 0px rgba(0, 0, 0, 0.1);
}

.rb-card-icon-img {
  width: 24px;
  height: 24px;
  margin-bottom: 4px;
}

.rb-card-title {
  font-size: 14px;
  font-weight: 600;
  color: #111827;
}

.rb-card-desc {
  font-size: 12px;
  color: #6b7280;
  line-height: 1.4;
}

/* Quick reports */
.rb-reports-section {
  margin-top: 24px;
  width: 100%;
  max-width: 680px;
}

.rb-reports-label {
  font-size: 13px;
  font-weight: 600;
  color: #374151;
  margin-bottom: 10px;
  display: block;
}

.rb-pills {
  display: flex;
  flex-wrap: nowrap;
  gap: 8px;
  overflow-x: auto;
  padding-bottom: 4px;
  scrollbar-width: none;
}
.rb-pills::-webkit-scrollbar { display: none; }

.rb-pill {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 7px 14px;
  border-radius: 999px;
  border: 1px solid #e5e7eb;
  background: white;
  font-size: 13px;
  color: #374151;
  cursor: pointer;
  white-space: nowrap;
  flex-shrink: 0;
  transition: border-color 0.15s, background 0.15s;
}

.rb-pill:hover { border-color: #0061FB; background: #eff6ff; }

/* ── Chat view ── */
.rb-chat {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.rb-chat-header {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 20px;
  border-bottom: 1px solid #e5e7eb;
  background: white;
}

.rb-chat-title {
  font-size: 15px;
  font-weight: 600;
  color: #111827;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.rb-messages {
  flex: 1;
  overflow-y: auto;
  padding: 24px 20px;
  display: flex;
  flex-direction: column;
  gap: 18px;
}

.rb-msg-row { display: flex; align-items: flex-start; gap: 10px; }
.rb-bot-row { flex-direction: row; }
.rb-user-row { flex-direction: row-reverse; }

.rb-msg-avatar {
  width: 32px;
  height: 32px;
  min-width: 32px;
  border-radius: 50%;
  background: transparent;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
}

.rb-bubble-avatar {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  object-fit: cover;
}

.rb-bot-bubble {
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  padding: 12px 16px;
  max-width: 80%;
  font-size: 14px;
  line-height: 1.6;
  color: #111827;
}

.rb-user-bubble {
  background: #0061FB;
  color: white;
  border-radius: 12px;
  padding: 10px 16px;
  max-width: 70%;
  font-size: 14px;
  line-height: 1.5;
}

.rb-typing {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 14px 16px;
}

.rb-typing span {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: #9ca3af;
  display: inline-block;
  animation: rbBounce 1.2s infinite;
}
.rb-typing span:nth-child(2) { animation-delay: 0.2s; }
.rb-typing span:nth-child(3) { animation-delay: 0.4s; }

@keyframes rbBounce {
  0%, 60%, 100% { transform: translateY(0); }
  30% { transform: translateY(-5px); }
}

.rb-tool-status {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 14px;
  font-size: 13px;
  color: #6b7280;
}

.rb-tool-dot {
  width: 8px;
  height: 8px;
  min-width: 8px;
  border-radius: 50%;
  background: #0061FB;
  animation: rbPulse 1.2s ease-in-out infinite;
}

.rb-tool-label {
  font-style: italic;
}

@keyframes rbPulse {
  0%, 100% { opacity: 1; transform: scale(1); }
  50% { opacity: 0.4; transform: scale(0.75); }
}

.rb-cursor {
  display: inline-block;
  animation: rbBlink 1s step-end infinite;
  color: #0061FB;
}
@keyframes rbBlink { 50% { opacity: 0; } }

.rb-export-row { display: flex; gap: 6px; margin-top: 8px; }
.rb-export-btn {
  display: flex;
  align-items: center;
  gap: 3px;
  padding: 3px 8px;
  border-radius: 6px;
  border: 1px solid #d1d5db;
  background: #f9fafb;
  font-size: 11px;
  color: #374151;
  cursor: pointer;
}
.rb-export-btn:hover { background: #f3f4f6; }


/* ── Recents sidebar ── */
.rb-recents {
  width: 240px;
  min-width: 240px;
  border-left: 1px solid #e5e7eb;
  background: white;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.rb-recents-header {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 18px 16px 12px;
  border-bottom: 1px solid #f0f0f0;
}

.rb-recents-title {
  font-size: 14px;
  font-weight: 600;
  color: #111827;
}

.rb-recents-list {
  flex: 1;
  overflow-y: auto;
  padding: 8px;
}

.rb-recent-item {
  display: block;
  width: 100%;
  text-align: left;
  padding: 9px 12px;
  border-radius: 8px;
  border: none;
  background: none;
  font-size: 12.5px;
  color: #4b5563;
  line-height: 1.4;
  cursor: pointer;
  transition: background 0.12s;
  margin-bottom: 2px;
}
.rb-recent-item:hover { background: #f3f4f6; }
.rb-recent-item.active { background: #eff6ff; color: #0061FB; font-weight: 600; }

.rb-recents-empty {
  padding: 16px;
  font-size: 12px;
  color: #9ca3af;
  text-align: center;
}

/* ── Markdown ── */
.rb-md :deep(p) { margin: 0 0 10px; }
.rb-md :deep(p:last-child) { margin-bottom: 0; }
.rb-md :deep(ul), .rb-md :deep(ol) { padding-left: 20px; margin: 8px 0; }
.rb-md :deep(li) { margin-bottom: 3px; }
.rb-md :deep(table) { border-collapse: collapse; width: 100%; margin: 12px 0; font-size: 13px; }
.rb-md :deep(th) { background: #0061FB; color: white; padding: 7px 12px; text-align: left; }
.rb-md :deep(td) { padding: 6px 12px; border-bottom: 1px solid #e5e7eb; }
.rb-md :deep(tr:nth-child(even) td) { background: #f9fafb; }
.rb-md :deep(code) { background: #f3f4f6; padding: 2px 5px; border-radius: 4px; font-size: 12px; }
.rb-md :deep(pre) { background: #f3f4f6; padding: 12px 16px; border-radius: 8px; overflow-x: auto; }
.rb-md :deep(h1), .rb-md :deep(h2), .rb-md :deep(h3) { color: #111827; margin: 10px 0 6px; }
</style>
