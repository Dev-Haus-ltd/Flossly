<template>
  <div :style="`height: 100%;`" class="pa-1 d-flex align-center">
    <v-menu
      v-model="selected.roleMenu"
      :close-on-content-click="false"
      offset-y
    >
      <template #activator="{ props }">
        <v-chip
          class="role-chip mt-1 d-flex align-center justify-center mx-auto"
          size="small"
          v-bind="props"
          :color="selected?.role.color"
          label
          style="height: 22px; border-radius: 6px"
        >
          {{ selected?.role.title.slice(0, 20) }}
        </v-chip>
      </template>

      <v-card width="250" class="px-4 pt-2 rounded-lg">
        <v-list>
          <v-chip
            v-for="(r, i) in rolesList"
            :key="i"
            class="mb-2 d-flex align-center justify-center mx-auto"
            size="small"
            :color="r.color"
            label
            @click="
              () => {
                selected.role.title = r.title;
                selected.role.id = r.id;
                selected.role.color = r.color;
                selected.roleId = r.id;
                emit('update');
                selected.roleMenu = false; // Optional: close menu on select
              }
            "
            style="height: 22px; border-radius: 6px"
          >
            {{ r.title }}
          </v-chip>
        </v-list>
      </v-card>
    </v-menu>
  </div>
</template>
<script setup>
const mainStore = useMainStore();
const { selected, column } = defineProps(["selected", "column", "rolesList"]);
const emit = defineEmits(["update"]);

</script>
