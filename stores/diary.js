import diaryService from "~/services/diaryService";

export const useDiaryStore = defineStore("diaryStore", {
  state: () => ({
    isLoading: false,
  }),

  getters: {},

  actions: {
    listTreatments() {
      this.isLoading = true;
      return new Promise((resolve, reject) => {
        diaryService
          .listTreatments()
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
    listPatients(search = "") {
      this.isLoading = true;
      return new Promise((resolve, reject) => {
        diaryService
          .listPatients(search)
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
    listPatientsPaged(params = {}) {
      this.isLoading = true;
      return new Promise((resolve, reject) => {
        diaryService
          .listPatientsPaged(params)
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
    getPatientStats() {
      this.isLoading = true;
      return new Promise((resolve, reject) => {
        diaryService
          .getPatientStats()
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

    createPatient(payload) {
      this.isLoading = true;
      return new Promise((resolve, reject) => {
        diaryService
          .createPatient(payload)
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

    getPatient(id) {
      this.isLoading = true;
      return new Promise((resolve, reject) => {
        diaryService
          .getPatient(id)
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

    updatePatient(payload) {
      this.isLoading = true;
      return new Promise((resolve, reject) => {
        diaryService
          .updatePatient(payload)
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
    listAppointments(params) {
      this.isLoading = true;
      return new Promise((resolve, reject) => {
        diaryService
          .listAppointments(params)
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

    createAppointment(payload) {
      this.isLoading = true;
      return new Promise((resolve, reject) => {
        diaryService
          .createAppointment(payload)
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

    updateAppointment(payload) {
      this.isLoading = true;
      return new Promise((resolve, reject) => {
        diaryService
          .updateAppointment(payload)
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
    listDentists(date) {
      this.isLoading = true;
      return new Promise((resolve, reject) => {
        diaryService
          .listDentists(date)
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
    getStats(params) {
      this.isLoading = true;
      return new Promise((resolve, reject) => {
        diaryService
          .getStats(params)
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
    listNotes(params) {
      this.isLoading = true;
      return new Promise((resolve, reject) => {
        diaryService
          .listNotes(params)
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

    createNote(payload) {
      this.isLoading = true;
      return new Promise((resolve, reject) => {
        diaryService
          .createNote(payload)
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

    deleteNote(id) {
      this.isLoading = true;
      return new Promise((resolve, reject) => {
        diaryService
          .deleteNote(id)
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
