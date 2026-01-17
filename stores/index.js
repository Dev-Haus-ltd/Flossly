import authService from "../services/authService";
import orgService from "../services/orgService";
import dashBoard from "@/assets/icons/mainDrawerIcons/dashboard.svg";
import tasksIcon from "@/assets/icons/mainDrawerIcons/tasks.svg";
import teamIcon from "@/assets/icons/mainDrawerIcons/team.svg";
import flosslyDocs from '@/assets/icons/mainDrawerIcons/docs.svg'
import crmIcon from '@/assets/icons/mainDrawerIcons/crm.svg'
import academyIcon from '@/assets/icons/mainDrawerIcons/academy.svg'

const LICENSE_TYPES = {
  SYSTEM: "System",
  TRIAL: "Trial",
  DRIFT: "Drift",
  GLIDE: "Glide",
  SOAR: "Soar",
};

const LICENSE_FEATURES = {
  [LICENSE_TYPES.TRIAL]: new Set([
    "dashboard",
    "tasks",
    "docs",
    "team",
    "crm",
    "diary",
  ]),
  [LICENSE_TYPES.DRIFT]: new Set(["dashboard", "tasks", "docs"]),
  [LICENSE_TYPES.GLIDE]: new Set(["dashboard", "tasks", "docs", "team", "crm"]),
  [LICENSE_TYPES.SOAR]: new Set([
    "dashboard",
    "tasks",
    "docs",
    "team",
    "crm",
    "diary",
  ]),
  [LICENSE_TYPES.SYSTEM]: new Set([
    "dashboard",
    "tasks",
    "docs",
    "team",
    "crm",
    "diary",
  ]),
};

const getLicenseTypeFromStorage = () => {
  if (typeof localStorage === "undefined") {
    return LICENSE_TYPES.TRIAL;
  }

  try {
    const user = JSON.parse(localStorage.getItem("user") || "{}");
    return user?.preferences?.licenseType || LICENSE_TYPES.TRIAL;
  } catch {
    return LICENSE_TYPES.TRIAL;
  }
};

const filterMenuByLicense = (menuItems, licenseType) => {
  const allowed =
    LICENSE_FEATURES[licenseType] || LICENSE_FEATURES[LICENSE_TYPES.TRIAL];

  return menuItems.reduce((acc, item) => {
    if (!allowed.has(item.featureKey)) {
      return acc;
    }

    const next = { ...item };
    if (Array.isArray(next.children) && next.children.length) {
      next.children = next.children.filter((child) =>
        allowed.has(child.featureKey || next.featureKey)
      );
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
          to: "/tasks/mytasks",
          featureKey: "tasks",
          children: [
            // {
            //   title: "My Tasks",
            //   value: "myTasks",
            //   imgPath: tasksIcon,
            //   to: "/tasks/mytasks",
            // },
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
          children: [],
          featureKey: "crm",
        },
        {
          title: "Flossy Diary",
          imgPath: tasksIcon,
          value: "flosslyDiary",
          to:"/diary",
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
              featureKey: "diary",
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

      return filterMenuByLicense(menuItems, licenseType);
    },
    getuserOptions() {
      const licenseType = getLicenseTypeFromStorage();
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
      this.snackbar = toast;
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
