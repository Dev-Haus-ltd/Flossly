<template>
  <v-container style="min-height: 100vh">
    <v-card class="pa-4" rounded="xl" :elevation="0" flat>
      <v-card-text>
        <SignUpSetupPricing />
      </v-card-text>
    </v-card>
  </v-container>
</template>

<script setup>
import { useStripe } from "@/composables/useStripe";

const { currSubscription, getCurrentSubscription } = useStripe();

onMounted(getCurrentSubscription)

</script>

