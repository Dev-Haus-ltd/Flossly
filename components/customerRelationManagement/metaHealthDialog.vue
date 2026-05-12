<template>
  <v-dialog v-model="dialog" max-width="780" :content-class="'mh-dialog-wrapper'">
    <v-card class="mh-card">
      <div class="mh-header">
        <div class="mh-header__left">
          <div class="mh-icon-wrap">
            <v-icon size="15" color="#0061FB">mdi-heart-pulse</v-icon>
          </div>
          <div>
            <div class="mh-header__title">Meta Health</div>
            <div class="mh-header__sub">Connection overview</div>
          </div>
        </div>
        <v-btn icon variant="text" size="x-small" @click="close">
          <v-icon size="17">mdi-close</v-icon>
        </v-btn>
      </div>

      <div class="mh-body">
        <div v-if="loading" class="mh-loading">
          <v-progress-circular indeterminate size="28" width="2" color="#0061FB" />
        </div>
        <template v-else>
          <v-alert v-if="data?.error" type="error" variant="tonal" density="compact" class="mb-3">
            {{ data.error }}
          </v-alert>
          <template v-else>

            <!-- Page cards -->
            <div class="mh-pages">
              <div class="mh-pages__head">
                <span>Connected Meta Pages</span>
                <span class="mh-pages__hint">Lead activity &amp; connection health</span>
              </div>

              <div v-if="activePages.length" class="mh-pages__list">
                <div
                  v-for="page in activePages"
                  :key="page.pageId"
                  class="mh-page-card"
                >
                  <!-- Card top: avatars + names + chips -->
                  <div class="mh-page-card__top">
                    <!-- Accounts column -->
                    <div class="mh-page-card__accounts">
                      <!-- Facebook page -->
                      <div class="mh-account-row">
                        <div class="mh-avatar mh-avatar--fb">
                          <img
                            :src="`https://graph.facebook.com/${page.pageId}/picture?type=square`"
                            :alt="page.pageName"
                            class="mh-avatar__img"
                            @error="onAvatarError"
                          />
                        </div>
                        <div class="mh-account-row__info">
                          <div class="mh-account-row__name">
                            <v-icon size="12" color="#1877F2" class="mh-account-row__platform-icon">mdi-facebook</v-icon>
                            {{ page.pageName || page.pageId }}
                            <v-tooltip :text="page.pageId || '-'" location="top" max-width="320">
                              <template #activator="{ props: tip }">
                                <v-icon v-bind="tip" size="12" class="mh-info-icon">mdi-information-outline</v-icon>
                              </template>
                            </v-tooltip>
                          </div>
                          <div class="mh-account-row__chips">
                            <!-- Active chip — always shown -->
                            <v-chip size="x-small" color="primary" variant="tonal" label>
                              {{ page.status || 'Active' }}
                            </v-chip>

                            <!-- Issue chips — only shown when something is wrong -->
                            <v-tooltip
                              v-if="!page.tokenPresent"
                              text="Page access token is missing. Disconnect and reconnect this page to generate a fresh token."
                              location="top"
                              max-width="280"
                            >
                              <template #activator="{ props: tip }">
                                <v-chip v-bind="tip" size="x-small" color="error" variant="tonal" label class="mh-chip--issue">
                                  <v-icon start size="10">mdi-alert-circle-outline</v-icon>
                                  No Token
                                </v-chip>
                              </template>
                            </v-tooltip>

                            <v-tooltip
                              v-if="!page.subscribed"
                              text="Page is not subscribed to webhook events. Disconnect and reconnect to re-subscribe automatically."
                              location="top"
                              max-width="280"
                            >
                              <template #activator="{ props: tip }">
                                <v-chip v-bind="tip" size="x-small" color="error" variant="tonal" label class="mh-chip--issue">
                                  <v-icon start size="10">mdi-alert-circle-outline</v-icon>
                                  Not Subscribed
                                </v-chip>
                              </template>
                            </v-tooltip>

                            <v-tooltip
                              v-if="!page.appMatched"
                              text="The connected app ID doesn't match your META_APP_ID config. Check your app settings or reconnect with the correct app."
                              location="top"
                              max-width="280"
                            >
                              <template #activator="{ props: tip }">
                                <v-chip v-bind="tip" size="x-small" color="error" variant="tonal" label class="mh-chip--issue">
                                  <v-icon start size="10">mdi-alert-circle-outline</v-icon>
                                  App Mismatch
                                </v-chip>
                              </template>
                            </v-tooltip>

                            <v-tooltip
                              v-if="typeof page.messagesSubscribed !== 'undefined' && !page.messagesSubscribed"
                              text="Messages webhook field is not subscribed. Go to Meta for Developers → Webhooks and add 'messages' to the subscribed fields for this page."
                              location="top"
                              max-width="280"
                            >
                              <template #activator="{ props: tip }">
                                <v-chip v-bind="tip" size="x-small" color="warning" variant="tonal" label class="mh-chip--issue">
                                  <v-icon start size="10">mdi-alert-outline</v-icon>
                                  No Messages
                                </v-chip>
                              </template>
                            </v-tooltip>

                            <v-tooltip
                              v-if="Array.isArray(page.missingMessagingPermissions) && page.missingMessagingPermissions.length"
                              :text="`Missing permissions: ${page.missingMessagingPermissions.join(', ')}. Re-authorise the app and grant all requested permissions.`"
                              location="top"
                              max-width="280"
                            >
                              <template #activator="{ props: tip }">
                                <v-chip v-bind="tip" size="x-small" color="warning" variant="tonal" label class="mh-chip--issue">
                                  <v-icon start size="10">mdi-shield-alert-outline</v-icon>
                                  Permissions
                                </v-chip>
                              </template>
                            </v-tooltip>
                          </div>
                          <div v-if="page.error" class="mh-page-card__error">{{ page.error }}</div>
                        </div>
                      </div>

                      <!-- Instagram account (if connected) -->
                      <div v-if="page.instagramConnected" class="mh-account-row mh-account-row--ig">
                        <div class="mh-avatar mh-avatar--ig">
                          <img
                            v-if="page.instagramProfilePicture"
                            :src="page.instagramProfilePicture"
                            :alt="page.instagramAccountName"
                            class="mh-avatar__img"
                            @error="onAvatarError"
                          />
                          <v-icon v-else size="16" color="#E1306C">mdi-instagram</v-icon>
                        </div>
                        <div class="mh-account-row__info">
                          <div class="mh-account-row__name mh-account-row__name--ig">
                            <v-icon size="12" color="#E1306C" class="mh-account-row__platform-icon">mdi-instagram</v-icon>
                            {{ page.instagramAccountName || 'Instagram account' }}
                            <v-tooltip v-if="page.instagramAccountId" :text="page.instagramAccountId" location="top" max-width="320">
                              <template #activator="{ props: tip }">
                                <v-icon v-bind="tip" size="12" class="mh-info-icon">mdi-information-outline</v-icon>
                              </template>
                            </v-tooltip>
                          </div>
                          <div class="mh-account-row__chips">
                            <v-chip size="x-small" color="success" variant="tonal" label>
                              IG Connected
                            </v-chip>
                          </div>
                        </div>
                      </div>

                      <!-- Instagram not linked -->
                      <div v-else-if="typeof page.instagramConnected !== 'undefined'" class="mh-account-row mh-account-row--ig mh-account-row--ig-unlinked">
                        <div class="mh-avatar mh-avatar--ig mh-avatar--ig-empty">
                          <v-icon size="14" color="rgba(0,0,0,0.25)">mdi-instagram</v-icon>
                        </div>
                        <div class="mh-account-row__info">
                          <div class="mh-account-row__name mh-account-row__name--muted">Instagram not linked</div>
                        </div>
                      </div>
                    </div>

                    <!-- Stats column -->
                    <div class="mh-page-card__stats">
                      <div class="mh-mini-stat">
                        <div class="mh-mini-stat__key">Total Leads</div>
                        <div class="mh-mini-stat__val">{{ page.leadCount || 0 }}</div>
                      </div>
                      <div class="mh-mini-stat">
                        <div class="mh-mini-stat__key">Last Lead</div>
                        <v-tooltip :text="dateFull(page.lastLeadAt)" location="top">
                          <template #activator="{ props: tip }">
                            <div v-bind="tip" class="mh-mini-stat__val mh-mini-stat__val--date">{{ dateShort(page.lastLeadAt) }}</div>
                          </template>
                        </v-tooltip>
                      </div>
                      <div class="mh-mini-stat">
                        <div class="mh-mini-stat__key">Connected</div>
                        <v-tooltip :text="dateFull(page.connectedAt)" location="top">
                          <template #activator="{ props: tip }">
                            <div v-bind="tip" class="mh-mini-stat__val mh-mini-stat__val--date">{{ dateShort(page.connectedAt) }}</div>
                          </template>
                        </v-tooltip>
                      </div>
                      <div v-if="page.leadAccessStatus" class="mh-mini-stat">
                        <div class="mh-mini-stat__key">Lead Access</div>
                        <div class="mh-mini-stat__val">{{ page.leadAccessStatus }}</div>
                        <v-btn
                          v-if="page.leadAccessStatus === 'missing' && page.leadAccessUrl"
                          size="x-small"
                          variant="text"
                          class="mh-mini-stat__action"
                          @click="openLeadAccess(page.leadAccessUrl)"
                        >
                          Grant
                        </v-btn>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div v-else class="mh-pages__empty">
                No active Meta page is currently connected for this organisation.
              </div>
            </div>

          </template>
        </template>
      </div>
    </v-card>
  </v-dialog>
</template>

<script setup>
import { formatDateOnly, parsedDate } from '~/lib/dateFormatter';

const props = defineProps({
  modelValue: { type: Boolean, default: false },
  loading: { type: Boolean, default: false },
  data: { type: Object, default: null },
});

const emit = defineEmits(['update:modelValue']);

const dialog = computed({
  get: () => props.modelValue,
  set: (val) => emit('update:modelValue', val),
});

const close = () => emit('update:modelValue', false);

const activePages = computed(() => {
  const pages = Array.isArray(props.data?.pages) ? props.data.pages : [];
  return pages.filter((row) => String(row?.status || '').toLowerCase() === 'active');
});

const dateShort = (value) => formatDateOnly(value) || '-';
const dateFull = (value) => parsedDate(value) || '-';

const openLeadAccess = (url) => {
  if (!url || typeof window === 'undefined') return;
  window.open(url, '_blank');
};

const onAvatarError = (e) => {
  e.target.style.display = 'none';
};
</script>

<style scoped lang="scss">
::v-deep(.mh-dialog-wrapper) {
  border-radius: 26px !important;
  overflow: hidden;
}

.mh-card {
  border-radius: 26px;
  background: #fff;
  border: 1px solid rgba(15, 23, 42, 0.08);
  box-shadow: 0 16px 56px rgba(15, 23, 42, 0.14);
  overflow: hidden;
}

.mh-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 16px 0;
  margin-bottom: 12px;
}

.mh-header__left {
  display: flex;
  align-items: center;
  gap: 10px;
}

.mh-icon-wrap {
  width: 30px;
  height: 30px;
  border-radius: 9px;
  background: rgba(0, 97, 251, 0.1);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.mh-header__title {
  font-size: 14px;
  font-weight: 700;
  color: #111827;
  line-height: 1.2;
}

.mh-header__sub {
  font-size: 11px;
  color: rgba(0, 0, 0, 0.4);
  margin-top: 1px;
}

.mh-body {
  padding: 0 16px 16px;
}

.mh-loading {
  padding: 32px 0;
  display: flex;
  justify-content: center;
}

/* Pages section */
.mh-pages {
  border: 1px solid rgba(15, 23, 42, 0.07);
  border-radius: 14px;
  overflow: hidden;
  background: #fff;
}

.mh-pages__head {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  padding: 8px 14px;
  border-bottom: 1px solid rgba(15, 23, 42, 0.06);
  font-size: 12px;
  font-weight: 600;
  color: #111827;
}

.mh-pages__hint {
  font-size: 10px;
  font-weight: 400;
  color: rgba(0, 0, 0, 0.4);
}

.mh-pages__list {
  display: flex;
  flex-direction: column;
}

/* Page card */
.mh-page-card {
  padding: 14px;
  border-bottom: 1px solid rgba(15, 23, 42, 0.05);

  &:last-child {
    border-bottom: none;
  }
}

.mh-page-card__top {
  display: flex;
  gap: 12px;
  align-items: flex-start;
}

.mh-page-card__accounts {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.mh-page-card__error {
  border-radius: 8px;
  padding: 5px 8px;
  background: rgba(249, 115, 22, 0.08);
  color: rgba(124, 45, 18, 0.9);
  font-size: 11px;
  line-height: 1.4;
  margin-top: 2px;
}

/* Account row (FB or IG) */
.mh-account-row {
  display: flex;
  align-items: flex-start;
  gap: 10px;
}

.mh-account-row--ig {
  padding-left: 4px;
  position: relative;

  &::before {
    content: '';
    position: absolute;
    left: 16px;
    top: -10px;
    width: 1px;
    height: 10px;
    background: rgba(15, 23, 42, 0.1);
  }
}

.mh-account-row--ig-unlinked {
  opacity: 0.5;
}

.mh-account-row__info {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 5px;
}

.mh-account-row__name {
  display: flex;
  align-items: center;
  gap: 5px;
  font-size: 13px;
  font-weight: 700;
  color: #111827;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  line-height: 1.3;

  &--ig {
    font-size: 12.5px;
    color: #E1306C;
  }

  &--muted {
    font-size: 12px;
    font-weight: 400;
    color: rgba(0, 0, 0, 0.38);
  }
}

.mh-account-row__platform-icon {
  flex-shrink: 0;
}

.mh-info-icon {
  color: rgba(0, 0, 0, 0.28);
  cursor: pointer;
  flex-shrink: 0;
  transition: color 0.15s;

  &:hover { color: #0061FB; }
}

.mh-account-row__chips {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
}

.mh-chip--issue {
  cursor: default;
}

.mh-account-row__warn {
  font-size: 11px;
  color: rgba(0, 0, 0, 0.5);
  line-height: 1.4;
}

/* Avatar */
.mh-avatar {
  width: 38px;
  height: 38px;
  border-radius: 50%;
  flex-shrink: 0;
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(24, 119, 242, 0.08);
  border: 1.5px solid rgba(24, 119, 242, 0.15);

  &--ig {
    width: 32px;
    height: 32px;
    background: rgba(225, 48, 108, 0.07);
    border-color: rgba(225, 48, 108, 0.2);
  }

  &--ig-empty {
    background: rgba(0, 0, 0, 0.04);
    border-color: rgba(0, 0, 0, 0.08);
  }
}

.mh-avatar__img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

/* Stats */
.mh-page-card__stats {
  display: flex;
  gap: 6px;
  flex-shrink: 0;
}

.mh-mini-stat {
  border: 1px solid rgba(15, 23, 42, 0.06);
  border-radius: 10px;
  padding: 7px 10px;
  background: rgba(248, 250, 252, 0.8);
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 80px;
  text-align: center;
}

.mh-mini-stat__val {
  font-size: 12px;
  font-weight: 600;
  color: #111827;
  word-break: break-word;
}

.mh-mini-stat__val--date {
  cursor: default;
  text-decoration: underline dotted rgba(0, 0, 0, 0.25);
  text-underline-offset: 2px;
}

.mh-mini-stat__key {
  font-size: 10px;
  color: rgba(0, 0, 0, 0.4);
}

.mh-mini-stat__action {
  min-height: auto;
  padding: 0;
}

.mh-pages__empty {
  padding: 14px;
  font-size: 12px;
  color: rgba(0, 0, 0, 0.45);
}

/* Responsive */
@media (max-width: 600px) {
  .mh-page-card__top {
    flex-direction: column;
  }

  .mh-page-card__stats {
    flex-wrap: wrap;
    width: 100%;
  }

  .mh-mini-stat {
    flex: 1;
  }
}
</style>
