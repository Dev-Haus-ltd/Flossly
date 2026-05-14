import authService from "../services/authService";
import orgService from "../services/orgService";
import dashBoard from "@/assets/icons/mainDrawerIcons/dashboard.svg";
import tasksIcon from "@/assets/icons/mainDrawerIcons/tasks.svg";
import teamIcon from "@/assets/icons/mainDrawerIcons/team.svg";
import flosslyDocs from '@/assets/icons/mainDrawerIcons/docs.svg'
import crmIcon from '@/assets/icons/mainDrawerIcons/crm.svg'
import academyIcon from '@/assets/icons/mainDrawerIcons/academy.svg'
import settingsIcon from '@/assets/icons/mainDrawerIcons/settings.svg'
import { DEVELOPER_EMAILS } from '@/composables/useDeveloperAccess';

export const LICENSE_TYPES = {
  LITE:   "Lite",
  CRM:    "CRM",
  PRO:    "Pro",
  // Legacy values still present in DB — kept for backwards compatibility during transition
  SYSTEM: "System",
  TRIAL:  "Trial",
  DRIFT:  "Drift",
  GLIDE:  "Glide",
  SOAR:   "Soar",
};

// Maps any legacy or current license type to the menu feature set it should see
const LICENSE_FEATURES = {
  Lite:   new Set(["dashboard", "tasks", "docs", "team", "crm", "crm_leads", "crm_meta", "diary"]),
  CRM:    new Set(["dashboard", "tasks", "taskPool", "docs", "team", "crm", "crm_leads", "crm_meta", "automation", "diary"]),
  Pro:    new Set(["dashboard", "tasks", "taskPool", "docs", "team", "crm", "crm_leads", "crm_meta", "automation", "googleAds", "diary", "patientBooking"]),
  // Legacy — mapped to their resolved tier's feature set
  System: new Set(["dashboard", "tasks", "taskPool", "docs", "team", "crm", "crm_leads", "crm_meta", "automation", "googleAds", "diary", "patientBooking"]),
  Trial:  new Set(["dashboard", "tasks", "docs", "team", "crm", "crm_leads", "crm_meta", "diary"]),
  Drift:  new Set(["dashboard", "tasks", "docs", "team", "crm", "crm_leads", "crm_meta", "diary"]),
  Glide:  new Set(["dashboard", "tasks", "taskPool", "docs", "team", "crm", "crm_leads", "crm_meta", "automation", "diary"]),
  Soar:   new Set(["dashboard", "tasks", "taskPool", "docs", "team", "crm", "crm_leads", "crm_meta", "automation", "googleAds", "diary", "patientBooking"]),
};

const getLicenseTypeFromStorage = () => {
  try {
    const authStore = useAuthStore();
    return authStore.loggedUser?.licenseType ?? LICENSE_TYPES.LITE;
  } catch {
    return LICENSE_TYPES.LITE;
  }
};

const LOCK_VISIBLE_FEATURES = new Set([
  "taskPool",
  "automation",
  "googleAds",
  "patientBooking",
])

const filterMenuByLicense = (menuItems, licenseType) => {
  const allowed = LICENSE_FEATURES[licenseType] ?? LICENSE_FEATURES[LICENSE_TYPES.LITE];

  return menuItems.reduce((acc, item) => {
    const hasChildren = Array.isArray(item.children) && item.children.length > 0
    if (!allowed.has(item.featureKey) && !hasChildren) {
      return acc;
    }

    const next = { ...item };
    if (hasChildren) {
      next.children = next.children.reduce((children, child) => {
        const childFeature = child.featureKey || next.featureKey
        if (allowed.has(childFeature)) {
          children.push({ ...child, locked: false })
          return children
        }
        if (LOCK_VISIBLE_FEATURES.has(childFeature) && allowed.has(next.featureKey)) {
          children.push({
            ...child,
            locked: true,
            lockedFeature: childFeature,
          })
        }
        return children
      }, [])
      if (!allowed.has(next.featureKey) && !next.children.length) return acc
    }
    acc.push(next);
    return acc;
  }, []);
};

const createDocsItem = (imgPath) => ({
  title: "Flossly docs",
  imgPath,
  value: "flosllyDocs",
  to: "/docs/mydocs",
  featureKey: "docs",
});

export const useMainStore = defineStore("mainStore", {
  state: () => ({
    locale: "en",
    roles: [],
    isLoading: false,
    loginSkipSplash: false,
    customColumns: [],
    snackbar: {
      title: "",
      subtitle: "",
      type: "success",
      color: "info",
    },
  }),

  getters: {
    getToast(state) {
      return state.snackbar;
    },
    roles(state) {
      return state.roles;
    },
    getManagerOptions() {
      const licenseType = getLicenseTypeFromStorage();
      const authStore = useAuthStore();
      
      const isDeveloper = authStore.getIsDeveloper;
      
      // Get user data to check roleId
      const { user } = useUser();
      const userRoleId = user.value?.roleId;
      
      const menuItems = [
        {
          title: "DashBoard",
          imgPath: dashBoard,
          value: "dashBoard",
          to: "/",
          featureKey: "dashboard",
        },
        {
          title: "Flossly Tasks",
          imgPath: tasksIcon,
          value: "tasks-group",
          to: "/tasks/",
          featureKey: "tasks",
          children: [
            {
              title: "My Tasks",
              value: "myTasks",
              imgPath: tasksIcon,
              to: "/tasks/mytasks",
              featureKey: "tasks",
            },
            {
              title: "My Team Tasks",
              value: "myTeamTasks",
              imgPath: tasksIcon,
              to: "/tasks/teamtasks",
              featureKey: "tasks",
            },
          ],
        },
        createDocsItem(flosslyDocs),
        {
          title: "Team floss",
          imgPath: teamIcon,
          value: "teamFloss",
          to: "/teams",
          featureKey: "team",
          children: [
            {
              title: "Rota Management",
              value: "rotaManagement",
              imgPath: teamIcon,
              to: "/teams/rota",
              featureKey: "team",
            },
            {
              title: "Holiday Tracker",
              value: "holidayTracker",
              imgPath: teamIcon,
              to: "/teams/holiday",
              featureKey: "team",
            },
            // {
            //   title: "Payroll",
            //   value: "payroll",
            //   imgPath: teamIcon,
            //   to: "/teams/payroll",
            // },
            // {
            //   title: "Invoice",
            //   value: "invoice",
            //   imgPath: teamIcon,
            //   to: "/teams/invoice",
            // }, 
        
          ],
        },
        // {
        //   title: "Floss Academy",
        //   imgPath: academyIcon,
        //   value: "flossAcademy",
        //   to:"/academy",
        //   children: [
        //     {
        //       title: "My Courses",
        //       value: "myCourses",
        //       imgPath: academyIcon,
        //       to: "/academy/mycourses",
        //     },
        //   ],
        // },
          {
            title: "CRM",
            imgPath: crmIcon,
            value: "crm",
            to:"/crm",
            children: [
              {
                title: "Leads",
                value: "crmLeads",
                imgPath: crmIcon,
                to: "/crm/leads",
                featureKey: "crm_leads",
              },
            {
              title: "DMs",
              value: "crmDms",
              imgPath: crmIcon,
              to: "/crm/dms",
              featureKey: "crm_meta",
              beta: true,
            },
            {
              title: "My Automations",
              value: "crmAutomations",
              imgPath: crmIcon,
              to: "/crm/automations",
              featureKey: "automation",
            },
            {
              title: "Meta Analytics",
              value: "crmAnalytics",
              imgPath: crmIcon,
              to: "/crm/analytics",
              featureKey: "crm_meta",
            },
            {
              title: "Google Analytics",
              value: "crm Google Analytics",
              imgPath: crmIcon,
              to: "/crm/google_analytics",
              featureKey: "googleAds",
            },
          ],
          featureKey: "crm",
        },
        {
          title: "Flossy Diary",
          imgPath: tasksIcon,
          value: "flosslyDiary",
          to: "/diary/calendar",
          featureKey: "diary",
          children: [
            {
              title: "Calendar",
              value: "diaryCalendar",
              imgPath: tasksIcon,
              to: "/diary/calendar",
              featureKey: "diary",
            },
            {
              title: "Patients",
              value: "diaryPatients",
              imgPath: tasksIcon,
              to: "/diary/patients",
              featureKey: "patientBooking",
            },
            {
              title: "Finance",
              value: "diaryfinance",
              imgPath: tasksIcon,
              to: "/diary/finance",
              featureKey: "patientBooking",
            },
          ],
        },
        // {
        //   title: "Staff",
        //   imgPath: teamIcon,
        //   value: "staff-group",
        //   children: [
        //     {
        //       title: "My Staff",
        //       value: "myStaff",
        //       imgPath: teamIcon,
        //       to: "/staffmanagement/staff",
        //     },
        //     {
        //       title: "Rota Management",
        //       value: "rotaManager",
        //       imgPath: teamIcon,
        //       to: "/staffmanagement/rota",
        //     },
        //     {
        //       title: "Holiday Tracker",
        //       value: "holidayTracker",
        //       imgPath: teamIcon,
        //       to: "/staffmanagement/holidays",
        //     },
        //     {
        //       title: "Payroll",
        //       value: "payroll",
        //       imgPath: teamIcon,
        //       to: "/staffmanagement/payroll",
        //     },
        //   ],
        // },
      ];

      // Add Support Chat menu item only for developers
      if (isDeveloper) {
        menuItems.push({
          title: "Support Chat",
          imgPath: teamIcon, // Using team icon temporarily, can be replaced with chat icon
          value: "supportChat",
          to: "/support-chat",
          featureKey: "dashboard", // Use dashboard feature key so it's always visible
        });
      }

      // Add Settings menu item for roleId 16 and roleId 1
      if (userRoleId === 16 || userRoleId === 1) {
        menuItems.push({
          title: "Settings",
          imgPath: settingsIcon,
          value: "settings",
          to: "/settings",
          featureKey: "dashboard", // Use dashboard feature key so it's always visible
        });
      }

      const filtered = filterMenuByLicense(menuItems, licenseType);
      return filtered;
    },
    getuserOptions() {
      const licenseType = getLicenseTypeFromStorage();
      
      // Get user data to check roleId
      const { user } = useUser();
      const userRoleId = user.value?.roleId;
      
      const menuItems = [
        {
          title: "DashBoard",
          imgPath: dashBoard,
          value: "dashBoard",
          to: "/",
          featureKey: "dashboard",
        },
        {
          title: "My Tasks",
          value: "myTasks",
          imgPath: tasksIcon,
          to: "/tasks/mytasks",
          featureKey: "tasks",
        },
        createDocsItem(dashBoard),
        {
          title: "Rota",
          value: "rotaManagement",
          imgPath: teamIcon,
          to: "/teams/rota",
          featureKey: "team",
        },
        {
          title: "Holiday Tracker",
          value: "holidayTracker",
          imgPath: teamIcon,
          to: "/teams/holiday",
          featureKey: "team",
        },
        {
          title: "CRM",
          imgPath: crmIcon,
          value: "crm",
          to: "/crm",
          featureKey: "crm",
          children: [
            {
              title: "Leads",
              value: "crmLeads",
              imgPath: crmIcon,
              to: "/crm/leads",
              featureKey: "crm_leads",
            },
            {
              title: "My Automations",
              value: "crmAutomations",
              imgPath: crmIcon,
              to: "/crm/automations",
              featureKey: "automation",
            },
            {
              title: "Meta Analytics",
              value: "crmAnalytics",
              imgPath: crmIcon,
              to: "/crm/analytics",
              featureKey: "crm_meta",
            },
            {
              title: "Google Analytics",
              value: "crm Google Analytics",
              imgPath: crmIcon,
              to: "/crm/google_analytics",
              featureKey: "googleAds",
            },
          ],
        },
        // {
        //   title: "Floss Academy",
        //   imgPath: academyIcon,
        //   value: "flossAcademy",
        //   to:"/academy",
        //   children: [
        //     {
        //       title: "My Courses",
        //       value: "myCourses",
        //       imgPath: academyIcon,
        //       to: "/academy/mycourses",
        //     },
        //   ],
        // },
      ];

      // Add Settings menu item for roleId 16 and roleId 1
      if (userRoleId === 16 || userRoleId === 1) {
        menuItems.push({
          title: "Settings",
          imgPath: settingsIcon,
          value: "settings",
          to: "/settings",
          featureKey: "dashboard", // Use dashboard feature key so it's always visible
        });
      }

      return filterMenuByLicense(menuItems, licenseType);
    },
    getTeamTaskTableHeaders() {
      return [
        {
          key: "title",
          title: "Task",
          sortable: true,
          width: 200,
        },
        {
          key: "status",
          title: "Status",
          sortable: true,
          width: 200,
        },
        {
          key: "frequency",
          title: "Frequency",
          sortable: true,
          width: 200,
        },
        {
          key: "priority.name",
          title: "Priority",
          sortable: true,
          width: 200,
        },
        {
          key: "assignedUser.fullName",
          title: "Assigned User",
          sortable: true,
          width: 200,
        },
        {
          key: "dueDate",
          title: "Due Date",
          sortable: true,
          width: 200,
        },
        {
          key: "documentLink",
          title: "Template Link",
          sortable: true,
          width: 200,
        },
      ];
    },
    getTeamTaskAllHeaders() {
      return [
        {
          key: "title",
          title: "Task",
          sortable: true,
          width: 200,
          cellClass: "stickyClass",
        },
        {
          key: "status",
          title: "Status",
          sortable: true,
          width: 200,
        },
        {
          key: "frequency",
          title: "Frequency",
          sortable: true,
          width: 200,
        },
        {
          key: "priority.name",
          title: "Priority",
          sortable: true,
          width: 200,
        },
        {
          key: "assignedUser.fullName",
          title: "Assigned User",
          sortable: true,
          width: 200,
        },
        {
          key: "documentLink",
          title: "Template Link",
          sortable: true,
          width: 200,
        },
        {
          key: "assigner.fullName",
          title: "Assigned By",
          sortable: true,
          width: 200,
        },
        {
          key: "attachments",
          title: "Attachments",
          sortable: true,
          width: 200,
        },
        {
          key: "createdAt",
          title: "Created Date",
          sortable: true,
          width: 200,
        },
        {
          key: "dueDate",
          title: "Due Date",
          sortable: true,
          width: 200,
        },
        {
          key: "taskDetails.category.name",
          title: "Category",
          sortable: true,
          width: 200,
        },
        {
          key: "taskDetails.description",
          title: "Description",
          sortable: true,
          width: 200,
        },
        {
          key: "updatedAt",
          title: "Last updated on",
          sortable: true,
          width: 200,
        },
      ];
    },
  },

  actions: {
    setLoginSkipSplash(value) {
      this.loginSkipSplash = !!value;
    },
    getRoles() {
      return new Promise((resolve, reject) => {
        this.isLoading = true;
        authService
          .getRoles()
          .then((res) => {
            this.isLoading = false;
            resolve(res);
          })
          .catch((err) => {
            this.isLoading = false;
            reject(err);
          });
      });
    },
    setSnackbar(toast) {
      this.snackbar = { ...toast };
    },
    getCustomColumns() {
      return new Promise((resolve, reject) => {
        orgService
          .listCustomColumns()
          .then((res) => {
            if (res.code === 0 && res.data) {
              this.customColumns = res.data;
            }
            resolve(res);
          })
          .catch((err) => {
            reject(err);
          });
      });
    },
  },
});
