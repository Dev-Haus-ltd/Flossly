<template>
  <v-dialog
    :model-value="visible"
    fullscreen
    :scrim="false"
    transition="dialog-bottom-transition"
    @update:model-value="(v) => !v && close()"
  >
    <div class="grapes-shell">
      <!-- Top bar -->
      <div class="grapes-topbar elevation-1">
        <div class="d-flex align-center" style="gap: 8px">
          <v-btn icon variant="text" size="small" @click="close">
            <v-icon>mdi-close</v-icon>
          </v-btn>
          <div class="grapes-topbar__title">
            <v-icon size="18" color="primary" class="mr-1">mdi-view-dashboard-outline</v-icon>
            Visual Email Builder
          </div>
          <v-chip size="x-small" variant="tonal" color="primary" class="ml-1">GrapeJS</v-chip>
        </div>
        <div class="d-flex align-center" style="gap: 8px">
          <v-btn
            size="small"
            variant="outlined"
            @click="close"
          >
            Discard
          </v-btn>
          <v-btn
            size="small"
            color="primary"
            flat
            @click="save"
          >
            <v-icon size="14" class="mr-1">mdi-check</v-icon>
            Apply changes
          </v-btn>
        </div>
      </div>

      <!-- GrapeJS container -->
      <div ref="grapesjsEl" class="grapes-canvas" />

      <!-- Loading overlay -->
      <Transition name="fade">
        <div v-if="loading" class="grapes-loading">
          <v-progress-circular indeterminate color="primary" size="44" class="mb-3" />
          <div class="text-body-2 text-medium-emphasis">Loading Visual Builder…</div>
        </div>
      </Transition>
    </div>
  </v-dialog>
</template>

<script setup>
const props = defineProps({
  modelValue: { type: String, default: '' },
  visible: { type: Boolean, default: false },
})
const emit = defineEmits(['update:modelValue', 'update:visible'])

const grapesjsEl = ref(null)
const loading = ref(false)
let editor = null

// ─── Content helpers ─────────────────────────────────────────────────

// Stored format: '<style>…css…</style>…body_html…'
// GrapeJS needs css and html separately on load.
const parseContent = (combined) => {
  if (!combined) return { css: '', html: '' }
  const styleMatch = combined.match(/<style[^>]*>([\s\S]*?)<\/style>/i)
  const css = styleMatch ? styleMatch[1] : ''
  const html = combined.replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '').trim()
  return { css, html }
}

// ─── GrapeJS lifecycle ────────────────────────────────────────────────

const initGrapes = async () => {
  if (typeof window === 'undefined') return
  loading.value = true

  // Lazy-load all GrapeJS assets only when the editor is first opened
  const [{ default: gjs }, { default: newsletter }] = await Promise.all([
    import('grapesjs'),
    import('grapesjs-preset-newsletter'),
  ])
  // CSS is a side-effect import — Vite injects it into <head> on first load
  await import('grapesjs/dist/css/grapes.min.css')

  await nextTick()
  if (!grapesjsEl.value) { loading.value = false; return }

  const { css, html } = parseContent(props.modelValue)

  editor = gjs.init({
    container: grapesjsEl.value,
    height: '100%',
    width: '100%',
    plugins: [newsletter],
    pluginsOpts: { [newsletter]: {} },
    storageManager: false,
    components: html || undefined,
    style: css || undefined,
    assetManager: {
      upload: '/api/crm/emailAssetUpload',
      uploadName: 'file',
      multiUpload: false,
      // Transform our standard { code, data } response into the URL array GrapeJS expects
      uploadResponseInterceptor: (response) => {
        if (response?.code === 0 && response?.data?.src) return [response.data.src]
        return []
      },
    },
  })

  // Belt-and-suspenders: also handle the event in case the interceptor isn't called
  editor.on('asset:upload:response', (response) => {
    try {
      if (response?.code === 0 && response?.data?.src) {
        const src = response.data.src
        if (!editor.AssetManager.get(src)) {
          editor.AssetManager.add([{ src, type: 'image' }])
        }
      }
    } catch {}
  })

  loading.value = false
}

const destroyGrapes = () => {
  if (editor) {
    try { editor.destroy() } catch {}
    editor = null
  }
}

// ─── Actions ─────────────────────────────────────────────────────────

const save = () => {
  if (!editor) { emit('update:visible', false); return }
  const html = editor.getHtml()
  const css = editor.getCss()
  const combined = css ? `<style>${css}</style>${html}` : html
  emit('update:modelValue', combined)
  emit('update:visible', false)
}

const close = () => {
  emit('update:visible', false)
}

watch(() => props.visible, async (v) => {
  if (v) {
    await initGrapes()
  } else {
    destroyGrapes()
  }
})

onUnmounted(() => {
  destroyGrapes()
})
</script>

<style scoped>
.grapes-shell {
  display: flex;
  flex-direction: column;
  height: 100vh;
  background: #f0f2f5;
  position: relative;
}

.grapes-topbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 16px;
  height: 52px;
  background: #fff;
  flex-shrink: 0;
  z-index: 10;
  border-bottom: 1px solid #e0e0e0;
}

.grapes-topbar__title {
  font-size: 14px;
  font-weight: 600;
  color: #1a1a2e;
  display: flex;
  align-items: center;
}

.grapes-canvas {
  flex: 1;
  overflow: hidden;
}

.grapes-loading {
  position: absolute;
  inset: 52px 0 0 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background: #f0f2f5;
  z-index: 5;
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.25s;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
