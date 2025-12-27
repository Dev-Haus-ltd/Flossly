<template>
  <v-list nav dense class="sidebar-list pt-5">
    <v-list-item
      v-for="(item, index) in items"
      :key="index"
      :active="selected === item.key"
      @click="$emit('select', item.key)"
      :class="['sidebar-item', { 'sidebar-item--active': selected === item.key }]"
      rounded="lg"
      :ripple="false"
    >
      <template #prepend>
        <img :src="item.icon" max-width="24" class="mr-2" />
      </template>
      <v-list-item-title class="cust-label">{{ item.label }}</v-list-item-title>
    </v-list-item>
  </v-list>
</template>

<script setup>
defineProps({
  items: {
    type: Array,
    required: true,
  },
  selected: {
    type: String,
    required: true,
  },
});

defineEmits(["select"]);
</script>
<style scoped>
.sidebar-list {
  border-right: 1px solid #e0e0e0; /* light grey line */
  min-width: 239px;
}
.sidebar-item { margin: 2px 8px 6px; padding-left: 12px; transition: background-color 0.2s ease, border-color 0.2s ease, color 0.2s ease; }
.sidebar-item:hover { background: #f6f7fb; }
.sidebar-item--active { background: #eef4ff; border: 1px solid #d7e3ff; }
.cust-label { font-weight: 400; font-size: 13px; color: #737373; }
.sidebar-item--active .cust-label { color: #1e1e1e; font-weight: 600; }
.sidebar-item img { opacity: 0.65; transition: opacity 0.2s ease; }
.sidebar-item--active img { opacity: 1; }
</style>
