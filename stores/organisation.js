import orgService from "../services/orgService";

export const useOrgStore = defineStore("orgStore", {
  state: () => ({
    organisation: null,
    isLoading: false,
  }),

  getters: {
    getOrgDetails(state) {
      return state.organisation;
    }
  },

  actions: {
    updateOrganisation(data) {
      return new Promise((resolve, reject) => {
        this.isLoading = true
        orgService
          .updateOrganisation(data)
          .then((res) => {
            this.isLoading = false
            resolve(res);
          })
          .catch((err) => {
            this.isLoading = false
            reject(err);
          });
      });
    },
    getTaskStatuses() {
      return new Promise((resolve, reject) => {
        this.isLoading = true
        orgService
          .getTaskStatuses()
          .then((res) => {
            this.isLoading = false
            resolve(res);
          })
          .catch((err) => {
            this.isLoading = false
            reject(err);
          });
      });
    },
    getTaskPriorities() {
      return new Promise((resolve, reject) => {
        this.isLoading = true
        orgService
          .getTaskPriorities()
          .then((res) => {
            this.isLoading = false
            resolve(res);
          })
          .catch((err) => {
            this.isLoading = false
            reject(err);
          });
      });
    },
    getPracticeDetails() {
      return new Promise((resolve, reject) => {
        this.isLoading = true
        orgService
          .getPracticeDetails()
          .then((res) => {
            this.isLoading = false
            resolve(res);
          })
          .catch((err) => {
            this.isLoading = false
            reject(err);
          });
      });
    },
    addContacts(data) {
      return new Promise((resolve, reject) => {
        this.isLoading = true;
        orgService
          .addContacts(data)
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
    addEquipment(data) {
      return new Promise((resolve, reject) => {
        this.isLoading = true;
        orgService
          .addEquipment(data)
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
    addRoom(data) {
      return new Promise((resolve, reject) => {
        this.isLoading = true;
        orgService
          .addRoom(data)
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
    addGroup(data) {
      return new Promise((resolve, reject) => {
        this.isLoading = true;
        orgService
          .addGroup(data)
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
    updateAttributes(data) {
      return new Promise((resolve, reject) => {
        this.isLoading = true;
        orgService
          .updateAttributes(data)
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
    getSurgeries(data) {
      return new Promise((resolve, reject) => {
        this.isLoading = true;
        orgService
          .getSurgeries(data)
          .then((res) => {
            this.isLoading = false;
            resolve(res);
          })
          .catch((err) => {
            this.isLoading = false;
            reject(err);
          });
      });
    }
  },
});
