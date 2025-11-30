<template>
  <div class="d-flex">
    <div
      v-for="(file, i) in attachments"
      :key="i"
      class="d-flex align-center justify-content-center mx-auto"
    >
      <v-tooltip location="top">
        <template #activator="{ props }">
          <a
            v-bind="props"
            :href="file.link"
            target="_blank"
            class="text-primary text-decoration-none text-caption d-inline-flex align-center justify-center"
          >
            <v-icon size="18" class="mr-1" icon="mdi-file" />
          </a>
        </template>
        <span>{{ file.title }}</span>
      </v-tooltip>

      <!-- <v-btn
        :href="file.link"
        target="_blank"
        icon="mdi-download"
        size="x-small"
        variant="text"
      /> -->
    </div>
  </div>
</template>
<script setup>
const { attachments } = defineProps(["attachments"]);
</script>
<style scoped>
.text-caption {
  font-size: 13px;
  
  font-weight: 400;
  color: #1e1e1e;
}
</style>
