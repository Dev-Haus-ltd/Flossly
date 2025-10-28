<template>
  <v-form v-if="showform" ref="form" v-model="valid">
    <span class="lbl">Invite people to collaborate</span>
    <div v-for="(user, index) in model.users" :key="index">
      <v-text-field
        v-model="user.email"
        variant="solo"
        density="comfortable"
        type="email"
        single-line
        placeholder="example@email.com"
        
        :rules="[required, emailRule]"
        class="mt-2 input-bordered "
        flat
      >
        <!-- Appended dropdown inside text field -->
        <template #append-inner>
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
                    rolesList.find((x) => x.id === user.roleId)?.title.slice(0,20) ||
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

const model = defineModel({ users: [{ roleId: 1, email: "" }] });
const updateModel = () => {
  model.value.users.push({ roleId: 1, email: "" });
};
const required = (v) => !!v || "Required.";
const emailRule = (v) =>
  !v || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v) || "Invalid email.";

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
    const validation = await form.value.validate()
    return validation.valid
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
  border-radius: 8px !important;
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
</style>
