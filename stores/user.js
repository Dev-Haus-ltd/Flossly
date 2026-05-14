import userService from "../services/userService";

export const useUserStore = defineStore("userStore", {
  state: () => ({
    isLoading: false,
    users: [],
    orgUsers: [],
    usersQueryKey: null,
    currentLeaveEntitlement: null,
  }),

  getters: {},

  actions: {
    updatePreferences(data) {
      this.isLoading = true;
      return new Promise((resolve, reject) => {
        userService
          .updatePreferences(data)
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
    getUserList(data = {}) {
      const payload = { ...(data || {}) };
      const force = Boolean(payload.force);
      if (force) delete payload.force;
      const queryKey = JSON.stringify(payload);
      if (!force && this.users.length && this.usersQueryKey === queryKey) {
        return Promise.resolve({ code: 0, data: this.users });
      }
      this.isLoading = true;
      return new Promise((resolve, reject) => {
        userService
          .getUserList(payload)
          .then((res) => {
            this.isLoading = false;
            this.users = res.data;
            this.usersQueryKey = queryKey;
            resolve(res);
          })
          .catch((err) => {
            this.isLoading = false;
            reject(err);
          });
      });
    },
    resetUsers() {
      this.users = [];
      this.usersQueryKey = null;
    },
    getUserOrgWise() {
      this.isLoading = true;
      return new Promise((resolve, reject) => {
        userService
          .getUserOrgWise()
          .then((res) => {
            this.isLoading = false;
            this.orgUsers = res.data
            resolve(res);
          })
          .catch((err) => {
            this.isLoading = false;
            reject(err);
          });
      });
    },
    getUserDetails(data) {
      this.isLoading = true;
      return new Promise((resolve, reject) => {
        userService
          .getUserDetails(data)
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
    updateContract(data) {
      this.isLoading = true;
      return new Promise((resolve, reject) => {
        userService
          .updateContract(data)
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
    updateUserBank(data) {
      this.isLoading = true;
      return new Promise((resolve, reject) => {
        userService
          .updateUserBank(data)
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
    getUserLeaveHistory(data) {
      this.isLoading = true;
      return new Promise((resolve, reject) => {
        userService
          .getUserLeaveHistory(data)
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
    applyLeave(data) {
      this.isLoading = true;
      return new Promise((resolve, reject) => {
        userService
          .applyLeave(data)
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
    updateLeaveEntitlement(data) {
      this.isLoading = true;
      return new Promise((resolve, reject) => {
        userService
          .updateLeaveEntitlement(data)
          .then((res) => {
            this.isLoading = false;
            if (res.code === 0) {
              this.currentLeaveEntitlement = { ...data };
            }
            resolve(res);
          })
          .catch((err) => {
            this.isLoading = false;
            reject(err);
          });
      });
    },
    getTeamLeaves(data) {
      this.isLoading = true;
      return new Promise((resolve, reject) => {
        userService
          .getTeamLeaves(data)
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
    updateLeaveStatus(data) {
      this.isLoading = true;
      return new Promise((resolve, reject) => {
        userService
          .updateLeaveStatus(data)
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
    deleteLeave(data) {
      return new Promise((resolve, reject) => {
        userService
          .deleteLeave(data)
          .then(resolve)
          .catch(reject);
      });
    },
  },
});
