import userService from "../services/userService";

export const useUserStore = defineStore("userStore", {
  state: () => ({
    isLoading: false,
    users: [],
    orgUsers: []
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
    getUserList(data) {
      this.isLoading = true;
      return new Promise((resolve, reject) => {
        userService
          .getUserList(data)
          .then((res) => {
            this.isLoading = false;
            this.users = res.data;
            resolve(res);
          })
          .catch((err) => {
            this.isLoading = false;
            reject(err);
          });
      });
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
  },
});
