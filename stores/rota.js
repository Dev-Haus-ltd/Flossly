import rotaService from "~/services/rotaService";

export const useRotaStore = defineStore("rotaStore", {
  state: () => ({
    isLoading: false,
  }),

  getters: {},

  actions: {
    getRotas() {
      this.isLoading = true;
      return new Promise((resolve, reject) => {
        rotaService
          .getRotas()
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
    addRota(data) {
      this.isLoading = true;
      return new Promise((resolve, reject) => {
        rotaService
          .addRota(data)
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
    updateRota(data) {
      this.isLoading = true;
      return new Promise((resolve, reject) => {
        rotaService
          .updateRota(data)
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
    publishRota(data) {
      this.isLoading = true;
      return new Promise((resolve, reject) => {
        rotaService
          .publishRota(data)
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
    unPublishRota(data) {
      this.isLoading = true;
      return new Promise((resolve, reject) => {
        rotaService
          .unPublishRota(data)
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
    removeRotaUser(data) {
      this.isLoading = true;
      return new Promise((resolve, reject) => {
        rotaService
          .removeRotaUser(data)
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
    addRotaUsers(data) {
      this.isLoading = true;
      return new Promise((resolve, reject) => {
        rotaService
          .addRotaUsers(data)
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
    addRotaShift(data) {
      this.isLoading = true;
      return new Promise((resolve, reject) => {
        rotaService
          .addRotaShift(data)
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
    updateShift(data) {
      this.isLoading = true;
      return new Promise((resolve, reject) => {
        rotaService
          .updateShift(data)
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
    startShift(data) {
      this.isLoading = true;
      return new Promise((resolve, reject) => {
        rotaService
          .startShift(data)
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
    completeShift(data) {
      this.isLoading = true;
      return new Promise((resolve, reject) => {
        rotaService
          .completeShift(data)
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
    getAllShifts(data) {
      this.isLoading = true;
      return new Promise((resolve, reject) => {
        rotaService
          .getAllShifts(data)
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
    getRotaUsers(data) {
      this.isLoading = true;
      return new Promise((resolve, reject) => {
        rotaService
          .getRotaUsers(data)
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
