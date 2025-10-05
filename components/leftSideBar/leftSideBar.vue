<template>
  <v-navigation-drawer
    v-model="model"
    :rail="rail"
    :temporary="smAndDown"
    :permanent="!smAndDown"
    style="background-color: #f3f4f6"
  >
    <LeftSideBarPracticeMenu :currentOrg="currentOrg" :rail="rail" />
    <v-card
      class="d-flex flex-column py-1"
      style="height: 87vh; overflow: auto; background-color: #f3f4f6"
    >
      <v-list density="compact" nav :class="[rail ? 'pr-0 rail-closed' : '']">
        <template v-for="item in menuItems" :key="item.value">
          <!-- Leaf item -->
          <v-tooltip
            v-if="rail && (!item.children || !item.children.length)"
            location="right"
          >
            <template #activator="{ props: tooltipProps }">
              <v-list-item
                v-bind="tooltipProps"
                :to="item.to"
                :active="isExact(item.to)"
                :class="[
                  'custom-list-item',
                  isExact(item.to) && 'active-item',
                  isExact(item.to) && 'right-border',
                ]"
              >
                <template #prepend>
                  <img :src="item.imgPath" class="list-icon" alt="icon" />
                </template>
              </v-list-item>
            </template>
            <span>{{ item.title }}</span>
          </v-tooltip>

          <v-list-item
            v-else-if="!item.children || !item.children.length"
            :title="item.title"
            :to="item.to"
            :active="isExact(item.to)"
            :class="[
              'custom-list-item',
              isExact(item.to) && 'active-item',
              isExact(item.to) && 'right-border',
            ]"
          >
            <template #prepend>
              <img :src="item.imgPath" class="list-icon" alt="icon" />
            </template>
            <template #title>
              <span>{{ item.title }}</span>
            </template>
          </v-list-item>

          <!-- Parent with children -->
          <div v-else class="group-with-line" :class="{ 'no-line': rail }">
            <v-list-group v-model="openGroups[item.value]">
              <template #activator="{ props }">
                <v-tooltip v-if="rail" location="right">
                  <template #activator="{ props: tooltipProps }">
                    <v-list-item
                      v-bind="{ ...props, ...tooltipProps }"
                      :to="item.to"
                      :active="isParentActive(item)"
                      @click="navigate(item.to)"
                      :class="[
                        'custom-list-item',
                        isParentActive(item) && 'active-item',
                        isParentActive(item) && 'right-border',
                      ]"
                    >
                      <img :src="item.imgPath" class="list-icon" alt="icon" />
                    </v-list-item>
                  </template>
                  <span>{{ item.title }}</span>
                </v-tooltip>
                <v-list-item
                  v-else
                  v-bind="props"
                  :title="item.title"
                  :active="isParentActive(item)"
                  @click.stop="(e) => handleParentClick(e, item)"
                  :class="['custom-list-item']"
                >
                  <template #prepend>
                    <img :src="item.imgPath" class="list-icon" alt="icon" />
                  </template>
                </v-list-item>
              </template>

              <!-- Children -->
              <div class="child-wrapper" :class="{ 'rail-child': rail }">
                <template v-for="child in item.children" :key="child.value">
                  <v-tooltip v-if="rail" location="right">
                    <template #activator="{ props: tooltipProps }">
                      <v-list-item
                        v-bind="tooltipProps"
                        :to="child.to"
                        :active="isExact(child.to)"
                        :class="['custom-list-item']"
                      >
                        <template #prepend>
                          <img
                            :src="child.imgPath"
                            class="list-icon"
                            alt="icon"
                          />
                        </template>
                      </v-list-item>
                    </template>
                    <span>{{ child.title }}</span>
                  </v-tooltip>

                  <v-list-item
                    v-else
                    :title="child.title"
                    :to="child.to"
                    :active="isExact(child.to)"
                    :class="['custom-list-item not-intended']"
                  >
                    <template #title>
                      <span>{{ child.title }}</span>
                    </template>
                  </v-list-item>
                </template>
              </div>
            </v-list-group>
          </div>
        </template>
      </v-list>

      <v-spacer />

      <v-btn
        v-if="!smAndDown"
        variant="text"
        @click.stop="emit('update:rail', !rail)"
        class="d-flex align-center"
        style="color: #737373"
      >
        <template v-if="!rail">
          Close
          <v-icon class="ml-2">mdi-chevron-left</v-icon>
        </template>
        <template v-else>
          <v-icon>mdi-chevron-right</v-icon>
        </template>
      </v-btn>
    </v-card>
  </v-navigation-drawer>
</template>

<script setup>
const props = defineProps({
  drawer: Boolean,
  menuItems: Array,
  rail: Boolean,
});

const { drawer, menuItems, rail } = toRefs(props);
import { useDisplay } from "vuetify";
import { useRouter, useRoute } from "vue-router";

const { smAndDown } = useDisplay();
const router = useRouter();
const route = useRoute();

const emit = defineEmits(["update:drawer", "update:rail"]);
const model = computed({
  get: () => drawer,
  set: (val) => emit("update:drawer", val),
});
watch(rail, (newVal) => {
  emit("update:rail", newVal);
});
onMounted(() => {
  const storedUser = JSON.parse(localStorage.getItem("user"));
  user.value = storedUser;
  if (storedUser?.userOrganisations?.length) {
    currentOrg.value =
      storedUser.userOrganisations.find(
        (org) => org.organisationId === storedUser.currentLoggedInOrgId
      )?.organisation || {};
  }
});
const norm = (p) => (p || "").replace(/\/+$/, "") || "/";
const resolvedPath = (to) => {
  if (!to) return "";
  const r =
    typeof to === "string" ? router.resolve(to) : router.resolve({ ...to });
  return norm(r.path);
};
const currentPath = computed(() => norm(route.path));
const isExact = (to) => currentPath.value === resolvedPath(to);
const startsUnder = (to) => {
  const base = resolvedPath(to);
  return (
    base &&
    (currentPath.value === base || currentPath.value.startsWith(base + "/"))
  );
};
const isParentActive = (item) =>
  isExact(item.to) ||
  (item.children && item.children.some((c) => isExact(c.to))) ||
  startsUnder(item.to);

const openGroups = reactive({});
const syncOpenGroups = () => {
  menuItems.value.forEach((item) => {
    if (item.children && item.value) {
      openGroups[item.value] = isParentActive(item);
    }
  });
};

const navigate = (to) => {
  if (to) router.push(to);
};
const handleParentClick = (e, item) => {
  // Navigate to the parent's route if it exists
  if (item.to) router.push(item.to);

  // If the parent has children
  if (item.children?.length && item.value) {
    // Store the current state of this group before closing others
    const currentState = openGroups[item.value];

    // Close all other open groups first
    Object.keys(openGroups).forEach((key) => {
      if (key !== item.value) {
        openGroups[key] = false;
      }
    });

    openGroups[item.value] = !currentState;
  }
};

// keep this watcher AFTER handleParentClick
watch(
  () => route.fullPath,
  () => {
    // only auto-sync if user hasn’t manually opened something
    const activeKey = Object.keys(openGroups).find((k) => openGroups[k]);
    if (!activeKey) {
      syncOpenGroups();
    }
  },
  { immediate: true }
);
const user = ref(null);
const currentOrg = ref({});
</script>

<style scoped lang="scss">
.custom-list-item {
  font-size: 13px;
  font-weight: 400;
  color: #737373;
  border-radius: 0px;
  height: 44px;
}
.not-intended {
  padding-inline-start: 30px !important;
}
.group-with-line {
  position: relative;
  border-radius: 6px;
  .v-list-group--open {
    background-color: #ffffff;
    border-right: 5px solid #0061fb;
    border-radius: 6px;
    .active-item {
      background-color: transparent;
    }
  }
}
.group-with-line.no-line .child-wrapper::before {
  display: none;
}
.child-wrapper {
  position: relative;
}
.child-wrapper.rail-child {
  padding-left: 0 !important;
}
.child-wrapper::before {
  content: "";
  position: absolute;
  top: -15px;
  left: 17px;
  width: 2px;
  height: calc(100% + 1px);
  background-color: #737373;
  z-index: 0;
}
.active-item {
  font-weight: 600 !important;
  background-color: #ffffff;
  border-radius: 8px;
}
.right-border {
  border-right: 5px solid #0061fb;
}
:deep(.v-list-item--active) {
  color: #0061fb !important;
  font-weight: 600 !important;
}
.list-icon {
  width: 20px;
  height: 20px;
  object-fit: contain;
  margin-right: 8px;
  color: #737373;
  margin-bottom: 4px;
}
.rail-closed .v-list-group__items .v-list-item {
  padding-inline-start: 8px !important; /* match parent padding */
}
</style>
