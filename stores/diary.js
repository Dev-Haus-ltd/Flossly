import diaryService from "~/services/diaryService";

export const useDiaryStore = defineStore("diaryStore", {
  state: () => ({
    isLoading: false,
    _pending: 0,
  }),

  getters: {},

  actions: {
    _notifyOnboardingRefresh(reason, detail = {}) {
      if (typeof window === "undefined") return;
      window.dispatchEvent(
        new CustomEvent("onboarding-refresh", {
          detail: { reason, ...detail, refreshedAt: Date.now() },
        })
      );
    },
    _start() {
      this._pending++;
      this.isLoading = true;
    },
    _end() {
      this._pending = Math.max(0, this._pending - 1);
      this.isLoading = this._pending > 0;
    },
    async _wrap(promiseFactory) {
      this._start();
      try {
        return await promiseFactory();
      } finally {
        this._end();
      }
    },
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
    addTreatment(payload) {
  this.isLoading = true;
  return new Promise((resolve, reject) => {
    diaryService
      .addTreatment(payload)
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
            if (res?.code === 0) this._notifyOnboardingRefresh("patient-created");
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

deletePatient(patientId) {
  this.isLoading = true;
  return new Promise((resolve, reject) => {
    // Handle both formats: just ID or object with id property
    const id = typeof patientId === 'object' ? patientId.id : patientId;
    diaryService
      .deletePatient(id)
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
            if (res?.code === 0) this._notifyOnboardingRefresh("appointment-created");
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
    deleteAppointment(appointmentId) {
      this.isLoading = true;
      return new Promise((resolve, reject) => {
        const id =
          typeof appointmentId === "object" ? appointmentId?.id : appointmentId;
        diaryService
          .deleteAppointment(id)
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

    getPatientCommunicationLogs(payload) {
      this.isLoading = true;
      return new Promise((resolve, reject) => {
        diaryService
          .getPatientCommunicationLogs(payload)
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

    createCommunicationLog(payload) {
      this.isLoading = true;
      return new Promise((resolve, reject) => {
        diaryService
          .createCommunicationLog(payload)
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

    updateCommunicationLog(payload) {
      this.isLoading = true;
      return new Promise((resolve, reject) => {
        diaryService
          .updateCommunicationLog(payload)
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

    deleteCommunicationLog(id) {
      this.isLoading = true;
      return new Promise((resolve, reject) => {
        diaryService
          .deleteCommunicationLog(id)
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

    // Unique Patient Comfort
    getPatientComfort(patientId) {
      this.isLoading = true;
      return new Promise((resolve, reject) => {
        diaryService
          .getPatientComfort(patientId)
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

    savePatientComfort(payload) {
      this.isLoading = true;
      return new Promise((resolve, reject) => {
        diaryService
          .savePatientComfort(payload)
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

    // Smile Concern Survey
    getPatientSurvey(patientId) {
      this.isLoading = true;
      return new Promise((resolve, reject) => {
        diaryService
          .getPatientSurvey(patientId)
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

    savePatientSurvey(payload) {
      this.isLoading = true;
      return new Promise((resolve, reject) => {
        diaryService
          .savePatientSurvey(payload)
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

    uploadSurveyPhotos(formData) {
      this.isLoading = true;
      return new Promise((resolve, reject) => {
        diaryService
          .uploadSurveyPhotos(formData)
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
    sharePatientSurvey(payload) {
      this.isLoading = true;
      return new Promise((resolve, reject) => {
        diaryService
          .sharePatientSurvey(payload)
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
    printPatientSurvey(patientId) {
      this.isLoading = true;
      return new Promise((resolve, reject) => {
        diaryService
          .printPatientSurvey(patientId)
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
    downloadPatientSurvey(patientId) {
      this.isLoading = true;
      return new Promise((resolve, reject) => {
        diaryService
          .downloadPatientSurvey(patientId)
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

    // Patient Forms
    listPatientForms(patientId) {
      return new Promise((resolve, reject) => {
        this.isLoading = true;
        diaryService
          .listPatientForms(patientId)
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
    getPatientForm(formId) {
      return new Promise((resolve, reject) => {
        this.isLoading = true;
        diaryService
          .getPatientForm(formId)
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
    savePatientForm(payload) {
      return new Promise((resolve, reject) => {
        this.isLoading = true;
        diaryService
          .savePatientForm(payload)
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
    updatePatientForm(payload) {
      return new Promise((resolve, reject) => {
        this.isLoading = true;
        diaryService
          .updatePatientForm(payload)
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
    deletePatientForm(formId) {
      return new Promise((resolve, reject) => {
        this.isLoading = true;
        diaryService
          .deletePatientForm(formId)
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
