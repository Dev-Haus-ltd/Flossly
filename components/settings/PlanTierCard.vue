<template>
  <article
    class="plan-tier-card"
    :class="{ 'plan-tier-card--active': isActive }"
  >
    <div class="plan-tier-card__shell">
      <div class="plan-tier-card__top">
        <img
          :src="plan.logo"
          :alt="plan.title"
          class="plan-tier-card__logo"
          :class="{ 'plan-tier-card__logo--wide': plan.logoWide }"
        />
        <span
          v-if="badgeLabel"
          class="plan-tier-card__badge"
          :class="{ 'plan-tier-card__badge--active': isActive }"
        >
          {{ badgeLabel }}
        </span>
      </div>

      <div class="plan-tier-card__heading">
        <h3 class="plan-tier-card__title">{{ plan.title }}</h3>
        <p class="plan-tier-card__subtitle">{{ plan.subtitle }}</p>
      </div>

      <div class="plan-tier-card__price-block">
        <span class="plan-tier-card__price">{{ plan.price }}</span>
        <p class="plan-tier-card__description">{{ plan.description }}</p>
      </div>

      <v-btn
        block
        rounded="pill"
        size="large"
        class="plan-tier-card__action"
        :class="{
          'plan-tier-card__action--active': isActive && !actionDisabled,
          'plan-tier-card__action--upgrade': !isActive && !actionDisabled,
          'plan-tier-card__action--muted': actionDisabled,
        }"
        :variant="actionDisabled ? 'tonal' : 'flat'"
        :disabled="actionDisabled"
        :loading="loading"
        @click="$emit('action')"
      >
        {{ actionLabel }}
      </v-btn>

      <div class="plan-tier-card__divider" />

      <ul class="plan-tier-card__features">
        <li
          v-for="feature in plan.features"
          :key="feature"
          class="plan-tier-card__feature"
        >
          <v-icon size="16" class="plan-tier-card__check">mdi-check-circle-outline</v-icon>
          <span>{{ feature }}</span>
        </li>
      </ul>
    </div>
  </article>
</template>

<script setup>
defineProps({
  plan: {
    type: Object,
    required: true,
  },
  isActive: {
    type: Boolean,
    default: false,
  },
  actionLabel: {
    type: String,
    required: true,
  },
  actionDisabled: {
    type: Boolean,
    default: false,
  },
  loading: {
    type: Boolean,
    default: false,
  },
  badgeLabel: {
    type: String,
    default: "",
  },
});

defineEmits(["action"]);
</script>

<style scoped lang="scss">
.plan-tier-card {
  position: relative;
  height: 100%;
  border-radius: 24px;
  padding: 2px;
  background: #e2e8f0;
  transition:
    transform 0.22s ease,
    box-shadow 0.22s ease,
    background 0.22s ease;

  &:hover {
    transform: translateY(-4px);
    box-shadow: 0 20px 40px rgba(15, 23, 42, 0.09);
  }
}

.plan-tier-card--active {
  background: linear-gradient(90deg, #FFA977 0%, #FF85DA 32.21%, #7D77FF 63.94%, #68ECE6 100%);
  box-shadow: 0 16px 40px rgba(80, 109, 180, 0.18);
}

.plan-tier-card__shell {
  display: flex;
  flex-direction: column;
  gap: 20px;
  height: 100%;
  padding: 24px;
  border-radius: 22px;
  background: #fff;
}

.plan-tier-card__top {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
  min-height: 44px;
}

.plan-tier-card__logo {
  height: 40px;
  width: auto;
  object-fit: contain;
  flex-shrink: 0;
}

.plan-tier-card__logo--wide {
  height: 32px;
  max-width: 140px;
}

.plan-tier-card__badge {
  border-radius: 999px;
  padding: 6px 12px;
  background: #edf4ff;
  color: #0061fb;
  font-size: 12px;
  font-weight: 700;
  line-height: 1;
  white-space: nowrap;
  flex-shrink: 0;
}

.plan-tier-card__badge--active {
  background: linear-gradient(90deg, rgba(255, 169, 119, 0.15) 0%, rgba(255, 133, 218, 0.15) 50%, rgba(104, 236, 230, 0.15) 100%);
  color: #7D77FF;
}

.plan-tier-card__heading {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.plan-tier-card__title {
  margin: 0;
  color: #12182f;
  font-size: 22px;
  font-weight: 800;
  line-height: 1.15;
}

.plan-tier-card__subtitle {
  margin: 0;
  color: #6b7280;
  font-size: 14px;
  font-weight: 500;
}

.plan-tier-card__price-block {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.plan-tier-card__price {
  color: #0a0a0f;
  font-size: 26px;
  font-weight: 800;
  line-height: 1.1;
}

.plan-tier-card__description {
  margin: 0;
  color: #6b7280;
  font-size: 13.5px;
  line-height: 1.5;
}

.plan-tier-card__action {
  height: 46px !important;
  text-transform: none !important;
  font-size: 15px !important;
  font-weight: 700 !important;
  letter-spacing: 0 !important;
  box-shadow: none !important;
}

.plan-tier-card__action--active {
  background: linear-gradient(90deg, #FFA977 0%, #FF85DA 32.21%, #7D77FF 63.94%, #68ECE6 100%) !important;
  color: #fff !important;
}

.plan-tier-card__action--upgrade {
  background: #0061fb !important;
  color: #fff !important;
}

.plan-tier-card__action--muted {
  background: #f1f3f7 !important;
  color: #9ca3af !important;
}

.plan-tier-card__divider {
  height: 1px;
  background: #f0f1f5;
  margin: 0 -4px;
}

.plan-tier-card__features {
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin: 0;
  padding: 0;
  list-style: none;
  flex: 1;
}

.plan-tier-card__feature {
  display: flex;
  align-items: flex-start;
  gap: 9px;
  color: #374151;
  font-size: 13.5px;
  line-height: 1.45;
}

.plan-tier-card__check {
  margin-top: 1px;
  color: #0061fb;
  flex-shrink: 0;
}

@media (max-width: 959px) {
  .plan-tier-card__shell {
    gap: 16px;
    padding: 20px;
  }
}
</style>
