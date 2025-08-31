import authService from "../services/authService";
import dashBoard from "@/assets/icons/mainDrawerIcons/dashboard.svg";
import tasksIcon from "@/assets/icons/mainDrawerIcons/tasks.svg";
import teamIcon from "@/assets/icons/mainDrawerIcons/team.svg";
import academyIcon from "@/assets/icons/mainDrawerIcons/academy.svg";
import flowIcon from "@/assets/icons/mainDrawerIcons/flow.svg";
import contentIcon from "@/assets/icons/mainDrawerIcons/content.svg";
import checkIcon from "@/assets/icons/mainDrawerIcons/check.svg";
import settingsIcon from "@/assets/icons/mainDrawerIcons/settings.svg";
import cleanIcon from "@/assets/icons/mainDrawerIcons/clean.svg";
import profileIcon from "@/assets/icons/mainDrawerIcons/profile.svg";
import flosslyDocs from '@/assets/icons/mainDrawerIcons/docs.svg'
import crmIcon from '@/assets/icons/mainDrawerIcons/crm.svg'


export const useMainStore = defineStore("mainStore", {
  state: () => ({
    locale: "en",
    roles: [],
    isLoading: false,
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
      return [
        {
          title: "DashBoard",
          imgPath: dashBoard,
          value: "dashBoard",
          to: "/",
        },
        {
          title: "Flossly Tasks",
          imgPath: tasksIcon,
          value: "tasks-group",
          to: "/tasks",
          children: [
            {
              title: "My Tasks",
              value: "myTasks",
              imgPath: tasksIcon,
              to: "/tasks/mytasks",
            },
            {
              title: "My Team Tasks",
              value: "myTeamTasks",
              imgPath: tasksIcon,
              to: "/tasks/teamtasks",
            },
          ],
        },
        {
          title: "Flossly docs",
          imgPath: flosslyDocs,
          value: "flosllyDocs",
          to: "/documents",
          children: [
            {
              title: "My Docs",
              value: "mydocs",
              imgPath: flosslyDocs,
              to: "/documents/mydocs",
            },
        
          ],
        },
        {
          title: "Team floss",
          imgPath: teamIcon,
          value: "teamFloss",
          to: "/teams",
          children: [
            {
              title: "Rota Management",
              value: "rotaManagement",
              imgPath: teamIcon,
              to: "/teams/rota",
            },
            {
              title: "Holiday Tracker",
              value: "holidayTracker",
              imgPath: teamIcon,
              to: "/teams/holiday",
            },
            {
              title: "Payroll",
              value: "payroll",
              imgPath: teamIcon,
              to: "/teams/payroll",
            },
            {
              title: "Invoice",
              value: "invoice",
              imgPath: teamIcon,
              to: "/teams/invoice",
            }, 
        
          ],
        },
        {
          title: "CRM",
          imgPath: crmIcon,
          value: "crm",
          to:"/crm",
          children: [],
        },
        {
          title: "Flossy Diary",
          imgPath: tasksIcon,
          value: "flosslyDiary",
          to:"/diary",
          children: [],
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
        {
          title: "Floss Academy",
          imgPath: academyIcon,
          value: "flossAcademy-group",
          children: [],
        },
        {
          title: "Floss Flow",
          imgPath: flowIcon,
          value: "flossFlow-group",
          children: [],
        },
        {
          title: "Content Cavity",
          imgPath: contentIcon,
          value: "contentCavity-group",
          children: [],
        },
        {
          title: "Cavity Check",
          imgPath: checkIcon,
          value: "cavityCheck-group",
          children: [],
        },
        {
          title: "Settings",
          imgPath: settingsIcon,
          value: "settings",
          to: "/settings",
        },
        {
          title: "Clean Sweep",
          imgPath: cleanIcon,
          value: "cleanSweep",
          to: "/cleanSweep",
        },
        {
          title: "Practice Profile",
          imgPath: profileIcon,
          value: "practiceProfile",
          to: "/practiceProfile",
        },
      ];
    },
    getuserOptions() {
      return [
        {
          title: "My Tasks",
          value: "myTasks",
          imgPath: tasksIcon,
          to: "/tasks/mytasks",
        },
        {
          title: "Flossly docs",
          imgPath: dashBoard,
          value: "flosllyDocs",
          to: "/documents",
          children: [
            {
              title: "My Docs",
              value: "mydocs",
              imgPath: flosslyDocs,
              to: "/documents/mydocs",
            },
        
          ],
        },
      ];
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
          key: "status.name",
          title: "Status",
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
          key: "comments",
          title: "Comments",
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
          key: "status.name",
          title: "Status",
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
          key: "comments",
          title: "Comments",
          sortable: true,
          width: 200,
        },
        {
          key: "assignedBy",
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
  },
});
