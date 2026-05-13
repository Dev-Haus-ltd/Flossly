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
  resendVerificationEmail(data) {
    return new Promise((resolve, reject) => {
      Post("/auth/resendVerificationEmail", data)
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
  verifyMagicLink(token) {
    return new Promise((resolve, reject) => {
      Post("/auth/verifyMagicLink", { token })
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
     
      if (data && (typeof File !== 'undefined') && (data._photoFile instanceof File || data.photo instanceof File)) {
        const form = new FormData();
        Object.keys(data).forEach((key) => {
          if (key === 'photo' || key === '_photoFile' || key === '_photoPreviewUrl') return; 
          const val = data[key];
          if (val !== undefined && val !== null) form.append(key, String(val));
        });
        const fileToSend = data._photoFile instanceof File ? data._photoFile : data.photo;
        form.append('photo', fileToSend);
        PostFormData("/auth/updateProfile", form)
          .then(resolve)
          .catch(reject);
      } else {
        Post("/auth/updateProfile", data)
          .then(resolve)
          .catch(reject);
      }
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
  getUserHrDocuments(data) {
    return new Promise((resolve, reject) => {
      Post("/auth/hrDocs", data)
        .then((res) => {
          resolve(res);
        })
        .catch((err) => {
          reject(err);
        });
    });
  },
  addUserHrDoc(data) {
    return new Promise((resolve, reject) => {
      PostFormData("/auth/addHrDoc", data)
        .then((res) => {
          resolve(res);
        })
        .catch((err) => {
          reject(err);
        });
    });
  },
  removeUserDoc(data) {
    return new Promise((resolve, reject) => {
      Post("/auth/removeHrDoc", data)
        .then((res) => {
          resolve(res);
        })
        .catch((err) => {
          reject(err);
        });
    });
  },
  switchOrgnanisation(data) {
    return new Promise((resolve, reject) => {
      Post("/auth/switchOrg", data)
        .then((res) => {
          resolve(res);
        })
        .catch((err) => {
          reject(err);
        });
    });
  },
  createShortToken() {
    return new Promise((resolve, reject) => {
      Get("/auth/createShortToken")
        .then((res) => {
          resolve(res);
        })
        .catch((err) => {
          reject(err);
        });
    });
  },
  getLoginHistory(data) {
    return new Promise((resolve, reject) => {
      Post("/auth/loginHistory", data)
        .then((res) => {
          resolve(res);
        })
        .catch((err) => {
          reject(err);
        });
    });
  },
  acceptOrganisationInvitation(data) {
    return new Promise((resolve, reject) => {
      Post("/auth/acceptOrganisationInvitation", data)
        .then((res) => {
          resolve(res);
        })
        .catch((err) => {
          reject(err);
        });
    });
  },
  declineOrganisationInvitation(data) {
    return new Promise((resolve, reject) => {
      Post("/auth/declineOrganisationInvitation", data)
        .then((res) => {
          resolve(res);
        })
        .catch((err) => {
          reject(err);
        });
    });
  },
  verifyInvitationToken(data) {
    return new Promise((resolve, reject) => {
      Post("/auth/verifyInvitationToken", data)
        .then((res) => {
          resolve(res);
        })
        .catch((err) => {
          reject(err);
        });
    });
  },
  resendOrganisationInvitation(data) {
    return new Promise((resolve, reject) => {
      Post("/auth/resendOrganisationInvitation", data)
        .then((res) => {
          resolve(res);
        })
        .catch((err) => {
          reject(err);
        });
    });
  },
  recordOnboardingEvent(data) {
    return new Promise((resolve, reject) => {
      Post("/auth/onboardingEvent", data)
        .then((res) => resolve(res))
        .catch((err) => reject(err));
    });
  },
};
