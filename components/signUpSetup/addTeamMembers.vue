<template>
  <v-form v-if="showform" ref="form" v-model="valid">
    <span class="lbl">Invite people to collaborate</span>
    <div v-for="(user, index) in model.users" :key="index" class="team-member-row">
      <v-text-field
        v-model="user.email"
        variant="solo"
        density="comfortable"
        type="email"
        single-line
        placeholder="example@email.com"
        @keydown.enter.prevent
        :rules="[emailRule]"
        class="mt-2 input-bordered"
        flat
      >
        <!-- Appended dropdown inside text field -->
        <template #append-inner>
          <div class="d-flex align-center gap-2">
            <v-menu
              activator="parent"
              offset-y
              open-on-click
              close-on-content-click
            >
              <template #activator="{ props }">
                <v-btn
                  v-bind="props"
                  variant="solo"
                  density="default"
                  size="small"
                  class="text-lowercase text-wrap"
                  style="max-width: 140px; background-color: #F2F2F2;"
                  flat
                >
                  <span style="max-width: 130px" class="px-2">
                    {{
                      user.roleId && rolesList.find((x) => x.id === user.roleId)?.title.slice(0,20) ||
                      "Select Role"
                    }}</span
                  >
                  <v-icon size="16">mdi-menu-down</v-icon>
                </v-btn>
              </template>

              <v-list class="role-list-dropdown">
                <v-list-item
                  v-for="role in rolesList"
                  :key="role"
                  @click="selectRole(user, role.id)"
                >
                  <v-list-item-title style="max-width: 350px">{{
                    role.title
                  }}</v-list-item-title>
                </v-list-item>
              </v-list>
            </v-menu>
            
            <!-- Delete button - only show if more than one row -->
            <v-btn
              v-if="model.users.length > 1"
              @click="removeUser(index)"
              variant="text"
              size="small"
              color="error"
              class="delete-btn"
              flat
            >
              <v-icon size="16">mdi-delete</v-icon>
            </v-btn>
          </div>
        </template>
      </v-text-field>
    </div>
    <v-btn @click="updateModel" variant="text" height="48" color="primary" class="add-more-btn"
      >+ Add More</v-btn
    >
  </v-form>
</template>

<script setup>
import { ref, defineExpose } from "vue";

const valid = ref(false);
const form = ref(null);
const showform = ref(false);

const model = defineModel({ users: [{ roleId: null, email: "" }] });
const updateModel = () => {
  model.value.users.push({ roleId: null, email: "" });
};

const removeUser = (index) => {
  if (model.value.users.length > 1) {
    model.value.users.splice(index, 1);
  }
};
const required = (v) => !!v || "Required.";
const emailRule = (v) =>
  !v || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v) || "Invalid email.";

// Custom validation for team members - only validate non-empty emails
const validateTeamMembers = () => {
  const validEmails = model.value.users.filter(user => user.email.trim() !== '');
  return validEmails.length > 0 && validEmails.every(user => 
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(user.email)
  );
};

const mainStore = useMainStore();
const rolesList = ref([]);

onMounted(() => {
  mainStore
    .getRoles()
    .then((res) => {
      if (res.code === 0 && res.data) {
        showform.value = true;
        rolesList.value = res.data.filter(
          (x) =>
            x.title !== "Principal Dentist / Practice Owner" ||
            x.title !== "Practice Manager"
        );
      }
    })
    .catch((err) => {
      return err;
    });
});

function selectRole(user, roleId) {
  model.value.users.find((x) => x.email === user.email).roleId = roleId;
}
defineExpose({
  validate: async () => {
    // First validate the form fields
    const formValidation = await form.value.validate()
    
    // Then validate team members logic
    const teamValidation = validateTeamMembers()
    
    // Return true only if both validations pass
    return formValidation.valid && teamValidation
  },
  valid,
});
</script>
<style scoped>
.lbl {
  font-weight: 400;
  font-size: 16px;
  line-height: 100%;
  color: "#1E1E1E";
}
.input-bordered :deep(.v-field) {
  border: 1px solid #dfdfdf !important;
  border-radius: 12px !important;
  background-color: white !important;
  min-height: 40px;
  font-size: 14px;
  
}

/* Make dropdown list scrollable with max height */
.role-list-dropdown {
  max-height: 300px;
  overflow-y: auto;
  overflow-x: hidden;
}

/* Align Add More button with form fields */
.add-more-btn {
  margin-left: 0;
  padding-left: 0;
  justify-content: flex-start;
}

/* Team member row styling */
.team-member-row {
  position: relative;
}

/* Delete button styling */
.delete-btn {
  min-width: 32px !important;
  width: 32px !important;
  height: 32px !important;
  padding: 0 !important;
  margin-left: 8px;
}

.delete-btn:hover {
  background-color: rgba(244, 67, 54, 0.1) !important;
}

/* Ensure proper spacing between elements */
.gap-2 {
  gap: 8px;
}
</style>
