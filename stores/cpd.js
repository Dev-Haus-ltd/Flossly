import cpdService from "../services/cpdService";

export const useCpdStore = defineStore("cpdStore", {
  state: () => ({
    isLoading: false,
    courses: [],
    myCourses: [],
  }),

  getters: {},

  actions: {
    getCourses() {
      this.isLoading = true;
      return new Promise((resolve, reject) => {
        cpdService
          .getCourses()
          .then((res) => {
            this.isLoading = false;
            if (res.code === 0) {
              this.courses = res.data;
            }
            resolve(res);
          })
          .catch((err) => {
            this.isLoading = false;
            reject(err);
          });
      });
    },
    getMyCourses(data) {
      this.isLoading = true;
      return new Promise((resolve, reject) => {
        cpdService
          .getMyCourses(data)
          .then((res) => {
            this.isLoading = false;
            if (res.code === 0) {
              this.myCourses = res.data;
            }
            resolve(res);
          })
          .catch((err) => {
            this.isLoading = false;
            reject(err);
          });
      });
    },
    startQuiz(data) {
      this.isLoading = true;
      return new Promise((resolve, reject) => {
        cpdService
          .startQuiz(data)
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
    submitQuiz(data) {
      this.isLoading = true;
      return new Promise((resolve, reject) => {
        cpdService
          .submitQuiz(data)
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
