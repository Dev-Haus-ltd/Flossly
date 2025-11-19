<!-- Add Contacts Dialog Component -->
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
          class="contact-row"
        >
          <!-- Name -->
          <div class="contact-field">
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
          <div class="contact-field">
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
          <div class="contact-field">
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
          <div class="contact-remove">
            <v-icon size="18" @click="removeContact(index)">mdi-close</v-icon>
          </div>
        </div>

        <!-- Error Message -->
        <p v-if="invalidContact" class="error-message">
          Each contact must have a name, phone and email
        </p>

        <!-- Add contact button -->
        <v-btn
          variant="outlined"
          size="small"
          color="primary"
          class="mt-4"
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
const contacts = ref([{ name: "", contact: "", email: "" }]);
const invalidContact = ref(false);

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
  if (contacts.value.find((x) => !x.email || !x.contact)) {
    invalidContact.value = true;
    return;
  }

  emit("update:modelValue", false);
  emit("onUpdate", contacts.value);
  contacts.value = [{ name: "", contact: "", email: "" }];
};
</script>

<style scoped>
/* Contact Row - Responsive Layout */
.contact-row {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
  gap: 10px;
  padding: 10px;
  background-color: #f7f8f9;
  border-radius: 8px;
  margin-bottom: 10px;
  align-items: flex-end;
}

/* Desktop: 4-column layout (Name, Contact, Email, Remove) */
@media (min-width: 960px) {
  .contact-row {
    grid-template-columns: 1fr 1fr 1fr auto;
  }
}

/* Tablet: 2x2 grid */
@media (max-width: 959px) and (min-width: 600px) {
  .contact-row {
    grid-template-columns: 1fr 1fr;
  }
}

/* Mobile: Single column */
@media (max-width: 599px) {
  .contact-row {
    grid-template-columns: 1fr;
  }
}

.contact-field {
  width: 100%;
}

.contact-remove {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 40px;
  cursor: pointer;
}

/* Field Label */
.field-label {
  display: block;
  font-size: 13px;
  font-weight: 500;
  margin-bottom: 4px;
  color: #737373;
}

/* Error Message */
.error-message {
  color: #d32f2f;
  font-size: 12px;
  margin: 10px 0;
}

/* Input Styling */
.input-bordered :deep(.v-field) {
  border: 1px solid #dfdfdf !important;
  border-radius: 8px !important;
  background-color: white !important;
  min-height: 40px;
  font-size: 14px;
}
</style>