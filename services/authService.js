import { Post, Get, PostFormData } from "./apiWrapper";
export default {
  requestSignUp(data) {
    return new Promise((resolve, reject) => {
      Post("/auth/signUpRequest", data)
        .then((res) => {
          resolve(res);
        })
        .catch((err) => {
          reject(err);
        });
    });
  },
  getRoles() {
    return new Promise((resolve, reject) => {
      Get("/misc/getRoles")
        .then((res) => {
          resolve(res);
        })
        .catch((err) => {
          reject(err);
        });
    });
  },
  verifyEmail(data) {
    return new Promise((resolve, reject) => {
      Post("/auth/verifyEmail", data)
        .then((res) => {
          resolve(res);
        })
        .catch((err) => {
          reject(err);
        });
    });
  },
  login(data) {
    return new Promise((resolve, reject) => {
      Post("/auth/login", data)
        .then((res) => {
          resolve(res);
        })
        .catch((err) => {
          reject(err);
        });
    });
  },
  profile() {
    return new Promise((resolve, reject) => {
      Get("/auth/profile")
        .then((res) => {
          resolve(res);
        })
        .catch((err) => {
          reject(err);
        });
    });
  },
  requestReset(data) {
    return new Promise((resolve, reject) => {
      Post("/auth/requestResetPassword", data)
        .then((res) => {
          resolve(res);
        })
        .catch((err) => {
          reject(err);
        });
    });
  },
  accpetInvite(data) {
    return new Promise((resolve, reject) => {
      Post("/auth/acceptInvitation", data)
        .then((res) => {
          resolve(res);
        })
        .catch((err) => {
          reject(err);
        });
    });
  },
  resetPassword(data) {
    return new Promise((resolve, reject) => {
      Post("/auth/resetPassword", data)
        .then((res) => {
          resolve(res);
        })
        .catch((err) => {
          reject(err);
        });
    });
  },
  verifyToken(data) {
    return new Promise((resolve, reject) => {
      Post("/auth/verifyToken", data)
        .then((res) => {
          resolve(res);
        })
        .catch((err) => {
          reject(err);
        });
    });
  },
  getProfile(data) {
    return new Promise((resolve, reject) => {
      Post("/auth/updatePreferences", data)
        .then((res) => {
          resolve(res);
        })
        .catch((err) => {
          reject(err);
        });
    });
  },
  acceptInvite(data) {
    return new Promise((resolve, reject) => {
      Post("/auth/acceptinvite", data)
        .then((res) => {
          resolve(res);
        })
        .catch((err) => {
          reject(err);
        });
    });
  },

  validate() {
    return new Promise((resolve, reject) => {
      Post("/auth/validate")
        .then((res) => {
          resolve(res);
        })
        .catch((err) => {
          reject(err);
        });
    });
  },
  inviteMembers(data) {
    return new Promise((resolve, reject) => {
      Post("/auth/inviteMembers", data)
        .then((res) => {
          resolve(res);
        })
        .catch((err) => {
          reject(err);
        });
    });
  },
  updateAccountDetails(data) {
    return new Promise((resolve, reject) => {
      Post("/auth/updateBankDetails", data)
        .then((res) => {
          resolve(res);
        })
        .catch((err) => {
          reject(err);
        });
    });
  },
  updateProfile(data) {
    return new Promise((resolve, reject) => {
      Post("/auth/updateProfile", data)
        .then((res) => {
          resolve(res);
        })
        .catch((err) => {
          reject(err);
        });
    });
  },
  getContractDetails() {
    return new Promise((resolve, reject) => {
      Post("/auth/contractDetails")
        .then((res) => {
          resolve(res);
        })
        .catch((err) => {
          reject(err);
        });
    });
  },
  getBankDetails() {
    return new Promise((resolve, reject) => {
      Post("/auth/bankDetails")
        .then((res) => {
          resolve(res);
        })
        .catch((err) => {
          reject(err);
        });
    });
  },
  updatePassword(data) {
    return new Promise((resolve, reject) => {
      Post("/auth/updatePassword", data)
        .then((res) => {
          resolve(res);
        })
        .catch((err) => {
          reject(err);
        });
    });
  },
};
