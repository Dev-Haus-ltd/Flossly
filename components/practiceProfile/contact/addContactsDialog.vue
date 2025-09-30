<template>
  <v-dialog v-model="isOpen" max-width="700px" class="rounded-lg">
    <v-card>
      <!-- Title -->
      <v-card-title
        class="d-flex align-center justify-space-between"
        style="
          
          font-weight: 600;
          font-size: 16px;
          border-bottom: 1px solid #dbdbdb;
        "
      >
        Add Contacts
        <v-btn
          icon
          variant="text"
          size="small"
          @click="close"
          style="min-width: unset; color: #737373"
        >
          <v-icon>mdi-close</v-icon>
        </v-btn>
      </v-card-title>

      <!-- Contacts List -->
      <v-card-text>
        <div
          v-for="(contact, index) in contacts"
          :key="index"
          class="d-flex align-center rounded-lg border-sm"
          style="gap: 10px; padding: 10px; background-color: #f7f8f9;"
        >
          <!-- Name -->
          <div style="width: 30%;">
            <label class="field-label">Name</label>
            <v-text-field
              v-model="contact.name"
              hide-details
              variant="solo"
              density="compact"
              class="input-bordered"
              flat
            />
          </div>

          <!-- Contact (phone / number) -->
          <div style="width: 30%;">
            <label class="field-label">Contact</label>
            <v-text-field
              v-model="contact.contact"
              hide-details
              variant="solo"
              density="compact"
              class="input-bordered"
              flat
            />
          </div>

          <!-- Email -->
          <div style="width: 30%;">
            <label class="field-label">Email</label>
            <v-text-field
              v-model="contact.email"
              hide-details
              variant="solo"
              density="compact"
              class="input-bordered"
              flat
            />
          </div>

          <!-- Remove Button -->
          <div style="width: 10%; text-align: center;">
              <v-icon size="18" @click="removeContact(index)">mdi-close</v-icon>
          </div>
        </div>
        <p style="color: red; font-size: 12px;" v-if="invalidContact">Each contact must have a name, phone and email</p>

        <!-- Add contact button -->
        <v-btn
          variant="outlined"
          size="small"
          color="primary"
          class="mt-2"
          @click="addContact"
        >
          <v-icon left>mdi-plus</v-icon>
          Add Contact
        </v-btn>
      </v-card-text>

      <!-- Actions -->
      <v-card-actions class="justify-end pa-5">
        <v-btn
          text
          @click="close"
          variant="flat"
        >
          Cancel
        </v-btn>
        <v-btn
          color="primary"
          @click="save"
          variant="flat"
        >
          Save
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup>
import { ref, watch } from "vue";

const props = defineProps({
  modelValue: Boolean,
});
const emit = defineEmits(["update:modelValue", "onUpdate"]);

const isOpen = ref(props.modelValue);
const contacts = ref([{ name: "", contact: "" }]); // start with one row
const invalidContact = ref(false)
watch(
  () => props.modelValue,
  (val) => (isOpen.value = val)
);
watch(isOpen, (val) => emit("update:modelValue", val));

const close = () => {
  isOpen.value = false;
};

const addContact = () => {
  contacts.value.push({ name: "", contact: "", email: "" });
};

const removeContact = (index) => {
  contacts.value.splice(index, 1);
};

const save = () => {
  if (contacts.value.find((x) => !x.email || !x.contact)){
  invalidContact.value = true
  return
  }

  emit("update:modelValue", false);
  emit("onUpdate", contacts.value);
  contacts.value = [{ name: "", contact: "" }];
};
</script>

<style scoped>
.input-bordered :deep(.v-field) {
  border: 1px solid #dfdfdf !important;
  border-radius: 8px !important;
  background-color: white !important;
  min-height: 40px;
  font-size: 14px;
  
}
.field-label {
  display: block;
  
  font-size: 13px;
  font-weight: 500;
  margin-bottom: 4px;
  color: #737373;
}
</style>
