import authService from "../services/authService";

export const useAuthStore = defineStore("authStore", {
  state: () => ({
    loggedUser: null,
    organisationDetails: null,
    userPreferences: null,
    isLoading: false,
  }),

  getters: {
    getLoggedUser(state) {
      return state.loggedUser;
    },
  },

  actions: {
    requestSignUp(data) {
      this.isLoading = true;
      return new Promise((resolve, reject) => {
        authService
          .requestSignUp(data)
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
    verifyEmail(data) {
      return new Promise((resolve, reject) => {
        this.isLoading = true;
        authService
          .verifyEmail(data)
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
    login(data) {
      return new Promise((resolve, reject) => {
        this.isLoading = true;
        authService
          .login(data)
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
    inviteMembers(data) {
      return new Promise((resolve, reject) => {
        this.isLoading = true;
        authService
          .inviteMembers(data)
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
    accpetInvite(data) {
      return new Promise((resolve, reject) => {
        this.isLoading = true;
        authService
          .accpetInvite(data)
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
    profile() {
      return new Promise((resolve, reject) => {
        this.isLoading = true;
        authService
          .profile()
          .then((res) => {
            this.loggedUser = res.data;
            this.isLoading = false;
            resolve(res);
          })
          .catch((err) => {
            this.isLoading = false;
            reject(err);
          });
      });
    },
    requestReset(data) {
      return new Promise((resolve, reject) => {
        this.isLoading = true;
        authService
          .requestReset(data)
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
    resetPassword(data) {
      return new Promise((resolve, reject) => {
        this.isLoading = true;
        authService
          .resetPassword(data)
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
    getAccountDetails() {
      return new Promise((resolve, reject) => {
        this.isLoading = true;
        authService
          .getBankDetails()
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
    getContractDetails() {
      return new Promise((resolve, reject) => {
        this.isLoading = true;
        authService
          .getContractDetails()
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
    updateAccountDetails(data) {
      return new Promise((resolve, reject) => {
        this.isLoading = true;
        authService
          .updateAccountDetails(data)
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
    updateProfile(data) {
      return new Promise((resolve, reject) => {
        this.isLoading = true;
        authService
          .updateProfile(data)
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
    updatePassword(data) {
      return new Promise((resolve, reject) => {
        this.isLoading = true;
        authService 
          .updatePassword(data)
          .then((res) =>  {
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
