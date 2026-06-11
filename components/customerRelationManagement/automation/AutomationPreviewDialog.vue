<template>
  <v-dialog v-model="model" max-width="980px" :retain-focus="false">
    <v-card class="rounded-xl elevation-8 preview-card">

      <!-- Header -->
      <div class="preview-header">
        <div class="preview-header__left">
          <div class="preview-header__icon" :class="isWhatsApp ? 'preview-header__icon--wa' : 'preview-header__icon--email'">
            <v-icon size="16" color="white">{{ isWhatsApp ? 'mdi-whatsapp' : 'mdi-email-outline' }}</v-icon>
          </div>
          <div>
            <div class="preview-header__title">{{ title || 'Preview' }}</div>
            <div class="preview-header__sub">{{ isWhatsApp ? 'WhatsApp Preview' : 'Email Preview' }}</div>
          </div>
        </div>
        <v-btn icon variant="text" size="small" @click="model = false">
          <v-icon size="18">mdi-close</v-icon>
        </v-btn>
      </div>

      <v-divider />

      <!-- Body -->
      <div class="preview-body">

        <!-- WhatsApp -->
        <div v-if="isWhatsApp" class="wa-preview">
          <div class="wa-preview__bubble">{{ whatsappText }}</div>
        </div>

        <!-- Email -->
        <template v-else>
          <!-- Meta row: subject + attachments side by side on wide screens -->
          <div class="email-meta-grid">
            <div class="email-meta-box">
              <div class="email-meta-label">
                <v-icon size="13" class="mr-1" color="#6b7280">mdi-format-title</v-icon>
                Subject
              </div>
              <div class="email-meta-value">{{ subject || '(no subject)' }}</div>
            </div>

            <div v-if="normalizedAttachments.length" class="email-meta-box email-meta-box--attachments">
              <div class="email-meta-label">
                <v-icon size="13" class="mr-1" color="#6b7280">mdi-paperclip</v-icon>
                Attachments
                <span class="attachment-badge">{{ normalizedAttachments.length }}</span>
              </div>
              <div class="attachment-list">
                <a
                  v-for="(att, index) in normalizedAttachments"
                  :key="`${att.link}-${index}`"
                  :href="att.link"
                  target="_blank"
                  rel="noopener noreferrer"
                  class="attachment-row"
                >
                  <div class="attachment-row__icon-wrap" :style="{ background: fileIconMeta(att.contentType, att.name).bg }">
                    <v-icon size="14" :color="fileIconMeta(att.contentType, att.name).color">
                      {{ fileIconMeta(att.contentType, att.name).icon }}
                    </v-icon>
                  </div>
                  <div class="attachment-row__info">
                    <span class="attachment-row__name">{{ att.name }}</span>
                    <span v-if="att.contentType || att.size" class="attachment-row__meta">
                      <span v-if="att.contentType">{{ shortMime(att.contentType) }}</span>
                      <span v-if="att.contentType && att.size" class="attachment-row__dot">·</span>
                      <span v-if="att.size">{{ formatSize(att.size) }}</span>
                    </span>
                  </div>
                  <v-icon size="14" color="#9ca3af" class="attachment-row__dl">mdi-open-in-new</v-icon>
                </a>
              </div>
            </div>
          </div>

          <!-- iframe -->
          <iframe
            title="Email preview"
            :srcdoc="emailHtml"
            class="email-iframe"
          />
        </template>

      </div>
    </v-card>
  </v-dialog>
</template>

<script setup>
const props = defineProps({
  modelValue: { type: Boolean, default: false },
  title:       { type: String,  default: '' },
  subject:     { type: String,  default: '' },
  emailHtml:   { type: String,  default: '' },
  isWhatsApp:  { type: Boolean, default: false },
  whatsappText:{ type: String,  default: '' },
  attachments: { type: Array,   default: () => [] },
})

const emit = defineEmits(['update:modelValue'])

const model = computed({
  get: () => props.modelValue,
  set: (val) => emit('update:modelValue', val),
})

const normalizedAttachments = computed(() =>
  (Array.isArray(props.attachments) ? props.attachments : [])
    .map((item) => ({
      link:        item?.link || item?.url || item?.path || '',
      name:        item?.name || item?.filename || item?.title || 'Attachment',
      contentType: item?.contentType || item?.mimeType || null,
      size:        item?.size || null,
    }))
    .filter((item) => item.link)
)

const fileIconMeta = (contentType, name) => {
  const ct = String(contentType || name || '').toLowerCase()
  if (ct.includes('pdf'))
    return { icon: 'mdi-file-pdf-box',   color: '#dc2626', bg: '#fef2f2' }
  if (ct.includes('word') || ct.includes('doc'))
    return { icon: 'mdi-file-word-box',  color: '#2563eb', bg: '#eff6ff' }
  if (ct.includes('sheet') || ct.includes('excel') || ct.includes('csv') || ct.includes('xls'))
    return { icon: 'mdi-file-excel-box', color: '#16a34a', bg: '#f0fdf4' }
  if (ct.includes('image') || ct.includes('png') || ct.includes('jpg') || ct.includes('jpeg') || ct.includes('gif') || ct.includes('webp'))
    return { icon: 'mdi-file-image',     color: '#0284c7', bg: '#f0f9ff' }
  if (ct.includes('zip') || ct.includes('rar') || ct.includes('tar'))
    return { icon: 'mdi-zip-box',        color: '#d97706', bg: '#fffbeb' }
  return { icon: 'mdi-file-outline',     color: '#6b7280', bg: '#f9fafb' }
}

const shortMime = (mime) => {
  if (!mime) return ''
  const parts = String(mime).split('/')
  const sub = parts[parts.length - 1] || mime
  return sub.replace(/^vnd\.[^.]+\./, '').replace(/\+.*$/, '').toUpperCase()
}

const formatSize = (bytes) => {
  if (!bytes || bytes <= 0) return null
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}
</script>

<style scoped>
/* ── Card ─────────────────────────────────────────── */
.preview-card {
  overflow: hidden;
}

/* ── Header ───────────────────────────────────────── */
.preview-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 20px;
  background: #fff;
}

.preview-header__left {
  display: flex;
  align-items: center;
  gap: 10px;
}

.preview-header__icon {
  width: 32px;
  height: 32px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.preview-header__icon--email { background: #0061fb; }
.preview-header__icon--wa    { background: #25d366; }

.preview-header__title {
  font-size: 14px;
  font-weight: 700;
  color: #0f172a;
  line-height: 1.2;
}

.preview-header__sub {
  font-size: 11px;
  color: #6b7280;
  margin-top: 1px;
}

/* ── Body ─────────────────────────────────────────── */
.preview-body {
  padding: 16px;
  background: #f8fafc;
  max-height: 78vh;
  overflow: auto;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

/* ── Meta grid (subject + attachments) ────────────── */
.email-meta-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 10px;
}

@media (min-width: 680px) {
  .email-meta-grid {
    grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
  }
}

.email-meta-box {
  background: #fff;
  border-radius: 12px;
  padding: 12px 14px;
  border: 1px solid #e9ecf0;
}

.email-meta-label {
  display: flex;
  align-items: center;
  font-size: 11px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: #9ca3af;
  margin-bottom: 6px;
}

.email-meta-value {
  font-size: 14px;
  font-weight: 600;
  color: #0f172a;
  word-break: break-word;
}

/* ── Attachment badge ─────────────────────────────── */
.attachment-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 18px;
  height: 18px;
  border-radius: 999px;
  background: #0061fb;
  color: #fff;
  font-size: 10px;
  font-weight: 700;
  padding: 0 4px;
  margin-left: 6px;
}

/* ── Attachment list ──────────────────────────────── */
.attachment-list {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.attachment-row {
  display: grid;
  grid-template-columns: 28px minmax(0, 1fr) 16px;
  align-items: center;
  gap: 8px;
  padding: 6px 8px;
  border-radius: 8px;
  background: #f8fafc;
  border: 1px solid #e9ecf0;
  text-decoration: none;
  transition: background 0.15s, border-color 0.15s;
}

.attachment-row:hover {
  background: #eff6ff;
  border-color: #bfdbfe;
}

.attachment-row__icon-wrap {
  width: 28px;
  height: 28px;
  border-radius: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.attachment-row__info {
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 1px;
}

.attachment-row__name {
  font-size: 12px;
  font-weight: 600;
  color: #0f172a;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.attachment-row__meta {
  font-size: 11px;
  color: #9ca3af;
  display: flex;
  align-items: center;
  gap: 4px;
}

.attachment-row__dot {
  color: #d1d5db;
}

.attachment-row__dl {
  flex-shrink: 0;
  opacity: 0;
  transition: opacity 0.15s;
}

.attachment-row:hover .attachment-row__dl {
  opacity: 1;
}

/* ── Email iframe ─────────────────────────────────── */
.email-iframe {
  width: 100%;
  height: 68vh;
  border: 0;
  border-radius: 12px;
  background: #f8f9fb;
  flex-shrink: 0;
}

/* ── WhatsApp preview ─────────────────────────────── */
.wa-preview {
  background: #e5ddd5;
  border-radius: 12px;
  padding: 20px;
  min-height: 220px;
  display: flex;
  align-items: flex-start;
}

.wa-preview__bubble {
  background: #dcf8c6;
  border-radius: 10px;
  padding: 12px 14px;
  max-width: 520px;
  white-space: pre-wrap;
  line-height: 1.5;
  font-size: 14px;
  color: #111827;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.08);
}
</style>
