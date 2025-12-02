<template>
  <v-navigation-drawer
    v-model="drawerModel"
    :rail="rail"
    :temporary="smAndDown"
    :permanent="!smAndDown"
    style="z-index: 1000 !important"
  >
    <LeftSideBarPracticeMenu :currentOrg="currentOrg" :rail="rail" />
    <v-card
      class="d-flex flex-column py-1"
      style="height: 87vh; overflow: auto;"
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
                @click="handleItemClick"
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
            @click="handleItemClick"
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
                    
                      :active="isParentActive(item)"
                      @click="(e) => handleParentClick(e, item)"
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
                  @click="(e) => handleParentClick(e, item)"
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
                        @click="handleItemClick"
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
                    @click="handleItemClick"
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

      <div 
        :class="['sidebar-toggle-wrapper', rail ? 'collapsed-state' : 'expanded-state']" 
        v-if="!smAndDown"
      >
        <v-btn
          :class="['sidebar-toggle-btn', rail ? 'collapsed' : 'expanded']"
          variant="text"
          icon
          size="small"
          @click.stop="emit('update:rail', !rail)"
        >
          <v-icon 
            :class="['toggle-icon', rail ? 'icon-right' : 'icon-left']"
            size="18"
          >
            {{ rail ? 'mdi-chevron-right' : 'mdi-chevron-left' }}
          </v-icon>
        </v-btn>
      </div>
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

// Create a computed property for drawer model
const drawerModel = computed({
  get() {
    return drawer.value;
  },
  set(newVal) {
    emit("update:drawer", newVal);
  }
});

// Close drawer on mobile when leaf item is clicked
const handleItemClick = () => {
  if (smAndDown.value) {
    emit("update:drawer", false);
  }
};

// Helper function to get organization data consistently
const getOrgData = (orgWrapper) => {
  // Check if org has nested organisation object
  if (orgWrapper?.organisation?.id && orgWrapper?.organisation?.name) {
    return orgWrapper.organisation;
  }
  
  // Check if org is the organisation object itself
  if (orgWrapper?.id && orgWrapper?.name) {
    return orgWrapper;
  }
  
  return null;
};

onMounted(() => {
  const storedUser = JSON.parse(localStorage.getItem("user"));
  user.value = storedUser;
  console.log('Left Sidebar - Stored User:', storedUser);
  console.log('Left Sidebar - User Organisations:', storedUser?.userOrganisations);
  console.log('Left Sidebar - Current Logged In Org ID:', storedUser?.currentLoggedInOrgId);
  
  if (storedUser?.userOrganisations?.length) {
    // Log each organization structure for debugging
    storedUser.userOrganisations.forEach((org, index) => {
      console.log(`Left Sidebar - Org ${index}:`, org);
      console.log(`Left Sidebar - Org ${index} organisation:`, org?.organisation);
      console.log(`Left Sidebar - Org ${index} orgData:`, getOrgData(org));
    });
    
    // Try to find the current organization
    let foundOrg = null;
    
    // Filter to only active organizations
    const activeOrgs = storedUser.userOrganisations.filter(org => {
      const isActive = org.isActive !== undefined ? org.isActive : true; // Default to true for backward compatibility
      return isActive;
    });
    
    // First try to find by organisationId
    if (storedUser.currentLoggedInOrgId) {
      const orgWrapper = activeOrgs.find(
        (org) => org.organisationId === storedUser.currentLoggedInOrgId
      );
      if (orgWrapper) {
        foundOrg = getOrgData(orgWrapper);
      }
    }
    
    // If not found, try to find by id
    if (!foundOrg && storedUser.currentLoggedInOrgId) {
      const orgWrapper = activeOrgs.find(
        (org) => getOrgData(org)?.id === storedUser.currentLoggedInOrgId
      );
      if (orgWrapper) {
        foundOrg = getOrgData(orgWrapper);
      }
    }
    
    // If still not found, use the first available active organization
    if (!foundOrg && activeOrgs.length > 0) {
      const firstOrg = activeOrgs[0];
      foundOrg = getOrgData(firstOrg);
    }
    
    currentOrg.value = foundOrg || {};
    console.log('Left Sidebar - Current Org:', currentOrg.value);
  } else {
    console.log('Left Sidebar - No user organisations found');
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

  // Close drawer on mobile when parent is clicked
  if (smAndDown.value) {
    emit("update:drawer", false);
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

// Watch for changes in user data and update currentOrg accordingly
watch(() => user.value, (newUser) => {
  if (newUser?.userOrganisations?.length) {
    // Filter to only active organizations
    const activeOrgs = newUser.userOrganisations.filter(org => {
      const isActive = org.isActive !== undefined ? org.isActive : true; // Default to true for backward compatibility
      return isActive;
    });
    
    // Try to find the current organization
    let foundOrg = null;
    
    // First try to find by organisationId
    if (newUser.currentLoggedInOrgId) {
      const orgWrapper = activeOrgs.find(
        (org) => org.organisationId === newUser.currentLoggedInOrgId
      );
      if (orgWrapper) {
        foundOrg = getOrgData(orgWrapper);
      }
    }
    
    // If not found, try to find by id
    if (!foundOrg && newUser.currentLoggedInOrgId) {
      const orgWrapper = activeOrgs.find(
        (org) => getOrgData(org)?.id === newUser.currentLoggedInOrgId
      );
      if (orgWrapper) {
        foundOrg = getOrgData(orgWrapper);
      }
    }
    
    // If still not found, use the first available active organization
    if (!foundOrg && activeOrgs.length > 0) {
      const firstOrg = activeOrgs[0];
      foundOrg = getOrgData(firstOrg);
    }
    
    currentOrg.value = foundOrg || {};
  }
}, { deep: true });
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
  filter: grayscale(100%) brightness(0) invert(40%) sepia(5%) saturate(200%) hue-rotate(180deg);
  transition: filter 0.2s ease;
  margin-bottom: 4px;
}
.active-item .list-icon,
.v-list-item--active .list-icon {
  filter: invert(33%) sepia(98%) saturate(7455%) hue-rotate(213deg) brightness(97%) contrast(101%);
}
.rail-closed .v-list-group__items .v-list-item {
  padding-inline-start: 8px !important; /* match parent padding */
}

/* Sidebar Toggle Button Styles - Minimal Design */
.sidebar-toggle-wrapper {
  padding: 12px 8px;
  margin-top: auto;
  display: flex;
  position: sticky;
  bottom: 0;
  background: inherit;
  z-index: 1;
  border-top: 1px solid rgba(0, 0, 0, 0.06);
}

.sidebar-toggle-wrapper.expanded-state {
  justify-content: flex-end;
}

.sidebar-toggle-wrapper.collapsed-state {
  justify-content: center;
  padding: 12px 4px;
}

.sidebar-toggle-btn {
  color: #737373 !important;
  transition: all 0.2s ease;
  min-width: 28px !important;
  width: 28px !important;
  height: 28px !important;
  opacity: 0.6;
}

.sidebar-toggle-btn:hover {
  opacity: 1;
  color: #0061fb !important;
  background-color: rgba(0, 97, 251, 0.08) !important;
}

.sidebar-toggle-btn:active {
  opacity: 0.8;
}

.toggle-icon {
  transition: transform 0.2s ease;
}

/* Smooth transition for the entire sidebar */
:deep(.v-navigation-drawer) {
  transition: width 0.3s cubic-bezier(0.4, 0, 0.2, 1) !important;
}
.v-navigation-drawer__scrim {
  display: none !important;
}
</style>
