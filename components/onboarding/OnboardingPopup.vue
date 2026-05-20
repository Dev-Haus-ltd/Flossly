<template>
  <v-dialog
    :model-value="modelValue"
    :max-width="maxWidth"
    :persistent="persistent"
    @update:model-value="updateModel"
  >
    <div class="onboarding-shell" :style="themeStyle">
      <div v-if="showMarker" class="onboarding-marker">
        <span class="onboarding-marker__line"></span>
        <span class="onboarding-marker__dot"></span>
      </div>
      <div class="onboarding-frame">
        <v-card
          ref="dialogCard"
          class="onboarding-card"
          rounded="xl"
          role="dialog"
          aria-modal="true"
          :aria-label="ariaLabel"
          tabindex="0"
          @keydown.esc="handleEscape"
          @keydown.enter="handleEnter"
        >
          <v-btn
            v-if="showClose"
            class="onboarding-close"
            icon
            variant="text"
            aria-label="Close dialog"
            @click="handleClose"
          >
            <v-icon icon="mdi-close" />
          </v-btn>
          <div class="onboarding-card__inner">
            <div v-if="badgeLabel" class="onboarding-badge">
              {{ badgeLabel }}
            </div>
            <div v-if="iconSrc || icon" class="onboarding-icon">
              <img v-if="iconSrc" :src="iconSrc" alt="" />
              <v-icon v-else :icon="icon" size="26" />
            </div>
            <h2 class="onboarding-title">{{ title }}</h2>
            <p v-if="subtitle" class="onboarding-subtitle" v-html="subtitle"></p>
            <div v-if="$slots.default" class="onboarding-body">
              <slot />
            </div>
            <div v-if="primaryLabel || secondaryLabel" class="onboarding-actions">
              <v-btn
                v-if="secondaryLabel"
                variant="text"
                class="onboarding-secondary"
                @click="emitSecondary"
              >
                {{ secondaryLabel }}
              </v-btn>
              <v-btn
                v-if="primaryLabel"
                ref="primaryBtn"
                color="primary"
                variant="flat"
                class="onboarding-primary"
                @click="emitPrimary"
              >
                {{ primaryLabel }}
              </v-btn>
            </div>
            <p v-if="footnote" class="onboarding-footnote">
              {{ footnote }}
            </p>
          </div>
        </v-card>
      </div>
    </div>
  </v-dialog>
</template>

<script setup>
const props = defineProps({
  modelValue: { type: Boolean, default: false },
  maxWidth: { type: [Number, String], default: 760 },
  persistent: { type: Boolean, default: false },
  title: { type: String, default: "" },
  subtitle: { type: String, default: "" },
  footnote: { type: String, default: "" },
  primaryLabel: { type: String, default: "" },
  secondaryLabel: { type: String, default: "" },
  icon: { type: String, default: "" },
  iconSrc: { type: String, default: "" },
  showMarker: { type: Boolean, default: false },
  showClose: { type: Boolean, default: true },
  tier: { type: Number, default: 3 },
  badgeLabel: { type: String, default: "" },
});

const emit = defineEmits(["update:modelValue", "primary", "secondary", "close"]);
const dialogCard = ref(null);
const primaryBtn = ref(null);

const ariaLabel = computed(() => props.title || "Onboarding dialog");
const themeStyle = computed(() => {
  const themes = {
    1: {
      start: "#ff6b6b",
      end: "#ff9f43",
      soft: "#fff1eb",
    },
    2: {
      start: "#f9c74f",
      end: "#43aa8b",
      soft: "#f4fff3",
    },
    3: {
      start: "#4361ee",
      end: "#4cc9f0",
      soft: "#eef4ff",
    },
    4: {
      start: "#7209b7",
      end: "#b5179e",
      soft: "#faf0ff",
    },
    5: {
      start: "#adb5bd",
      end: "#dee2e6",
      soft: "#f7f8f9",
    },
  };
  const theme = themes[props.tier] || themes[3];
  return {
    "--onboarding-accent-start": theme.start,
    "--onboarding-accent-end": theme.end,
    "--onboarding-accent-soft": theme.soft,
  };
});

const updateModel = (val) => {
  emit("update:modelValue", val);
};

const emitPrimary = () => {
  emit("primary");
};

const emitSecondary = () => {
  emit("secondary");
};

const handleClose = () => {
  updateModel(false);
  emit("close");
};

const handleEscape = (event) => {
  if (!props.persistent) {
    event.preventDefault();
    updateModel(false);
  }
};

const handleEnter = (event) => {
  if (!props.primaryLabel) return;
  const tag = event?.target?.tagName?.toLowerCase();
  if (["button", "a", "input", "textarea"].includes(tag)) return;
  event.preventDefault();
  emitPrimary();
};

watch(
  () => props.modelValue,
  (val) => {
    if (!val) return;
    nextTick(() => {
      const el = primaryBtn.value?.$el || dialogCard.value?.$el || dialogCard.value;
      if (el && typeof el.focus === "function") {
        el.focus();
      }
    });
  }
);
</script>

<style scoped>
.onboarding-shell {
  position: relative;
  padding-top: 46px;
}

.onboarding-marker {
  position: absolute;
  top: 0;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  flex-direction: column;
  align-items: center;
  pointer-events: none;
}

.onboarding-marker__line {
  width: 4px;
  height: 46px;
  background: var(--onboarding-accent-start, #0b5ff2);
  border-radius: 999px;
}

.onboarding-marker__dot {
  width: 20px;
  height: 20px;
  margin-top: 8px;
  background: var(--onboarding-accent-start, #0b5ff2);
  border-radius: 50%;
  box-shadow: 0 0 0 6px var(--onboarding-accent-soft, #e8f0ff);
}

.onboarding-frame {
  padding: 1px;
  border-radius: 26px;
  background: linear-gradient(
    120deg,
    var(--onboarding-accent-start, #ffb27a),
    var(--onboarding-accent-end, #5dd0ff)
  );
}

.onboarding-card {
  background: #ffffff;
  position: relative;
}

.onboarding-card__inner {
  padding: 32px 36px 28px;
  text-align: center;
  font-family: "Inter", "Garnett", sans-serif;
  color: #101828;
}

.onboarding-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 14px;
  padding: 6px 12px;
  border-radius: 999px;
  background: var(--onboarding-accent-soft, #eef4ff);
  color: var(--onboarding-accent-start, #0b5ff2);
  font-size: 12px;
  font-weight: 600;
  letter-spacing: 0.02em;
}

.onboarding-icon {
  width: 44px;
  height: 44px;
  margin: 0 auto 12px;
  border-radius: 12px;
  background: linear-gradient(
    135deg,
    var(--onboarding-accent-start, #0b5ff2),
    var(--onboarding-accent-end, #5dd0ff)
  );
  color: #ffffff;
  display: flex;
  align-items: center;
  justify-content: center;
}

.onboarding-icon img {
  width: 26px;
  height: 26px;
  object-fit: contain;
  filter: brightness(0) invert(1);
}

.onboarding-title {
  font-family: "Garnett", "Inter", sans-serif;
  font-size: 22px;
  font-weight: 600;
  margin: 0 0 8px;
}

.onboarding-subtitle {
  font-size: 14px;
  color: #333c4d;
  margin: 0 0 12px;
}

.onboarding-body {
  font-size: 14px;
  color: #475467;
}

.onboarding-actions {
  display: flex;
  justify-content: center;
  gap: 12px;
  margin-top: 20px;
}

.onboarding-primary {
  min-width: 180px;
  border-radius: 12px;
  text-transform: none;
}

.onboarding-secondary {
  text-transform: none;
}

.onboarding-footnote {
  margin-top: 12px;
  font-size: 12px;
  color: #8a94a6;
}

.onboarding-close {
  position: absolute;
  top: 10px;
  right: 10px;
  z-index: 1;
}

@media (max-width: 600px) {
  .onboarding-card__inner {
    padding: 26px 22px 24px;
  }

  .onboarding-actions {
    flex-direction: column;
  }

  .onboarding-primary {
    width: 100%;
  }
}
</style>
