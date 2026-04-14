
import orgService from "../services/orgService";

export const useOrgStore = defineStore("orgStore", {
  state: () => ({
    organisation: null,
    isLoading: false,
    isNewPractice: false, // Flag to indicate if navigating to onboarding for new practice creation
  }),

  getters: {
    getOrgDetails(state) {
      return state.organisation;
    },
    getIsNewPractice(state) {
      return state.isNewPractice;
    },
  },

  actions: {
    setNewPracticeMode(orgId = null) {
      this.isNewPractice = true;
    },
    clearNewPracticeMode() {
      this.isNewPractice = false;
    },
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
    listTreatments() { 
      return new Promise((resolve, reject) => {
        this.isLoading = true
        orgService
          .listTreatments()
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
    addTreatment(payload) {
      return new Promise((resolve, reject) => {
        this.isLoading = true
        orgService
          .addTreatment(payload)
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
    updateTreatment(payload) {
      return new Promise((resolve, reject) => {
        this.isLoading = true
        orgService
          .updateTreatment(payload)
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
    deleteTreatment(id) {
      return new Promise((resolve, reject) => {
        this.isLoading = true
        orgService
          .deleteTreatment(id)
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
    },
    updateImportantPeople(data) {
      return new Promise((resolve, reject) => {
        this.isLoading = true;
        orgService
          .updateImportantPeople(data)
          .then((res) => {
            this.isLoading = false;
            if (this.organisation) {
              this.organisation.importantPeople = res.data;
            }
            resolve(res);
          })
          .catch((err) => {
            this.isLoading = false;
            reject(err);
          });
      });
    },
    deleteAttribute(data) {
      return new Promise((resolve, reject) => {
        this.isLoading = true;
        orgService
          .deleteAttribute(data)
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
    createOrganisationReferral(data) {
      return new Promise((resolve, reject) => {
        this.isLoading = true;
        orgService
          .createOrganisationReferral(data)
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
    getAllOrganisationReferrals() {
      return new Promise((resolve, reject) => {
        this.isLoading = true;
        orgService
          .getAllOrganisationReferrals()
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
    createOrganisationForUser(data) {
      return new Promise((resolve, reject) => {
        this.isLoading = true;
        orgService
          .createOrganisationForUser(data)
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
