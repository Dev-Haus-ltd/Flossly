<template>
  <v-card
    class="automation-card rounded-xl"
    :class="{ 'automation-card--active': selected }"
    variant="text"
    @click="$emit('select')"
  >
    <div class="automation-illustration mb-3">
      <img src="@/assets/images/taskpool/operational.svg" alt="automation" class="illustration-img" />
    </div>
    <div class="automation-title clamp-2">{{ title }}</div>
    <span class="automation-sub mb-1 d-block">by flossly</span>
    <div class="automation-desc clamp-2">{{ description }}</div>
    <div class="d-flex align-center justify-space-between mt-3">
      <div class="d-flex align-center text-grey">
        <v-icon size="16" class="mr-1">mdi-format-list-bulleted</v-icon>
        <span class="count">{{ count }}</span>
      </div>
      <v-switch
        density="compact"
        inset
        hide-details
        color="primary"
        :model-value="enabled"
        @click.stop="$emit('toggle', !enabled)"
      />
    </div>
  </v-card>
</template>

<script setup>
defineProps({
  title: String,
  description: String,
  count: [Number, String],
  enabled: Boolean,
  selected: Boolean,
})

defineEmits(['select', 'toggle'])
</script>

<style scoped>
.automation-card { border:1px solid #dfdfdf; padding:16px; cursor:pointer; transition: all .2s ease; min-height: 260px; display:flex; flex-direction:column; }
.automation-card:hover { box-shadow:0 6px 22px rgba(0,0,0,0.06); }
.automation-card--active { border-color:#5a3fc0; box-shadow:0 6px 24px rgba(90,63,192,0.12); }
.automation-illustration { height: 110px; border-radius: 10px; background: linear-gradient(135deg, #f3f4ff, #eef2ff); display:flex; align-items:center; justify-content:center; }
.illustration-img { max-height: 90px; object-fit: contain; }
.automation-title { font-weight:600; font-size:14px; margin-bottom:6px; }
.automation-desc { font-size:12px; color:#636363; }
.automation-sub { font-size:11px; color:#8b8b8b; }
.count { color:#737373; font-size:14px; }
.clamp-2 {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  min-height: 34px;
}
</style>
