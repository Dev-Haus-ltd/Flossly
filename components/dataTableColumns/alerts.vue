<template>
  <div class="pa-1 d-flex align-center" style="height:100%">
    <v-menu v-model="selected.alertMenu" :close-on-content-click="false" offset-y>
      <template #activator="{ props }">
        <div v-bind="props" class="d-flex align-center px-2" style="width:100%; cursor:pointer">
          <v-icon :color="current?.color || 'on-surface-variant'" size="18" class="mr-1">
            {{ current?.icon || 'mdi-plus' }}
          </v-icon>
          <span class="text-truncate">{{ current?.label || 'Add alert' }}</span>
        </div>
      </template>
      <v-card width="260" class="pa-2">
        <v-list density="compact">
          <v-list-item
            v-for="(opt,i) in options"
            :key="i"
            class="opt-item"
            style="cursor:pointer"
            @click="apply(opt)"
          >
            <template #prepend>
              <v-icon :color="opt.color" size="18">{{ opt.icon }}</v-icon>
            </template>
            <v-list-item-title>{{ opt.label }}</v-list-item-title>
          </v-list-item>
        </v-list>
      </v-card>
    </v-menu>
  </div>
  
</template>

<script setup>
import crmService from '@/services/crmService'
const { selected } = defineProps(['selected'])
const emit = defineEmits(['update'])
const saving = ref(false)

const options = [
  { key:'hot', label:'Hot lead alerts', icon:'mdi-fire', color:'error' },
  { key:'time', label:'Time-sensitive deadlines', icon:'mdi-clock-outline', color:'warning' },
  { key:'value', label:'High-value opportunity', icon:'mdi-star-outline', color:'tertiary' },
  { key:'follow', label:'Follow-up reminders', icon:'mdi-bell-outline', color:'info' },
  { key:'callback', label:'Callback scheduled', icon:'mdi-phone-incoming-outline', color:'success' },
  { key:'none', label:'No response warnings', icon:'mdi-minus-circle-outline', color:'on-surface' },
]

const current = computed(() => options.find(o => o.key === selected.alert) )

const apply = async (opt) => {
  try {
    saving.value = true
    selected.alert = opt.key
    const res = await crmService.updateLead({ id: selected.id, alert: opt.key })
    if (res?.code === 0) emit('update')
  } finally {
    saving.value = false
    selected.alertMenu = false
  }
}
</script>

<style scoped>
.opt-item:hover { background: rgba(0,0,0,0.04); }
</style>
