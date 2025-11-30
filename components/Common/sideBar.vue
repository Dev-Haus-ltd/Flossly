<template>
  <v-list nav dense class="sidebar-list pt-5">
    <v-list-item
      v-for="(item, index) in items"
      :key="index"
      :active="selected === item.key"
      @click="$emit('select', item.key)"
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
  min-width: 200px;
}
.cust-label {
  
  font-weight: 400;
  font-size: 13px;
  color: #737373;
}
</style>
