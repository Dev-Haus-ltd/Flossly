<template>
  <div
    :style="`background-color: ${color}; height: 100%; color: #fff;`"
    class="pa-1 d-flex align-center"
  >
    <v-menu v-model="menuOpen" :close-on-content-click="false" offset-y>
      <template #activator="{ props: menuProps }">
        <p v-bind="menuProps" class="px-2" style="width: 100%; cursor: pointer; margin: 0;">
          {{ selected.active ? 'Active' : 'Inactive' }}
        </p>
      </template>

      <v-card width="180" class="pa-2">
        <v-list density="compact" nav>
          <v-list-item
            v-for="opt in options"
            :key="opt.value"
            :style="`background-color: ${opt.color}; color: #fff; margin-bottom: 6px; border-radius: 6px;`"
            min-height="32"
            @click="choose(opt.value)"
          >
            <v-list-item-title style="font-size:13px;">{{ opt.label }}</v-list-item-title>
          </v-list-item>
        </v-list>
      </v-card>
    </v-menu>
  </div>
</template>

<script setup>
const props = defineProps(['selected'])
const emit = defineEmits(['toggle'])

const menuOpen = ref(false)

const options = [
  { label: 'Active', value: true, color: '#16a34a' },
  { label: 'Inactive', value: false, color: '#6b7280' },
]

const color = computed(() => props.selected.active ? '#16a34a' : '#6b7280')

const choose = (val) => {
  menuOpen.value = false
  if (val !== props.selected.active) emit('toggle', val)
}
</script>
