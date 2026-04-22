import { PostFormData, Get, Post } from "./apiWrapper";
export default {
  updateOrganisation(data) {
    return new Promise((resolve, reject) => {
      PostFormData("/organisations/update", data)
        .then((res) => {
          resolve(res);
        })
        .catch((err) => {
          reject(err);
        });
    });
  },
  getTaskPriorities() {
    return new Promise((resolve, reject) => {
      Get("/organisations/priorities")
        .then((res) => {
          resolve(res);
        })
        .catch((err) => {
          reject(err);
        });
    });
  },
  getTaskStatuses() {
    return new Promise((resolve, reject) => {
      Get("/organisations/statuses")
        .then((res) => {
          resolve(res);
        })
        .catch((err) => {
          reject(err);
        });
    });
  },
  getPracticeDetails() {
    return new Promise((resolve, reject) => {
      Get("/organisations/details")
        .then((res) => {
          resolve(res);
        })
        .catch((err) => {
          reject(err);
        });
    });
  },
  addContacts(data) {
    return new Promise((resolve, reject) => {
      Post("/organisations/addContacts", data)
        .then((res) => {
          resolve(res);
        })
        .catch((err) => {
          reject(err);
        });
    });
  },
  addEquipment(data) {
    return new Promise((resolve, reject) => {
      Post("/organisations/addEquipment", data)
        .then((res) => {
          resolve(res);
        })
        .catch((err) => {
          reject(err);
        });
    });
  },
  addRoom(data) {
    return new Promise((resolve, reject) => {
      Post("/organisations/addSurgery", data)
        .then((res) => {
          resolve(res);
        })
        .catch((err) => {
          reject(err);
        });
    });
  },
  addGroup(data) {
    return new Promise((resolve, reject) => {
      Post("/organisations/addGroup", data)
        .then((res) => {
          resolve(res);
        })
        .catch((err) => {
          reject(err);
        });
    });
  },
  updateAttributes(data) {
    return new Promise((resolve, reject) => {
      Post("/organisations/updateAttribute", data)
        .then((res) => {
          resolve(res);
        })
        .catch((err) => {
          reject(err);
        });
    });
  },
  getSurgeries(data) {
    return new Promise((resolve, reject) => {
      Post("/organisations/surgeries", data)
        .then((res) => {
          resolve(res);
        })
        .catch((err) => {
          reject(err);
        });
    });
  },
  updateImportantPeople(data) {
    return new Promise((resolve, reject) => {
      Post("/organisations/updatePeople", data)
        .then((res) => resolve(res))
        .catch((err) => reject(err));
    });
  },
  getScripts() {
    return new Promise((resolve, reject) => {
      Get("/organisations/scripts")
        .then((res) => resolve(res))
        .catch((err) => reject(err));
    });
  },
  saveScript(data) {
    return new Promise((resolve, reject) => {
      Post("/organisations/saveScript", data)
        .then((res) => resolve(res))
        .catch((err) => reject(err));
    });
  },
  listClinicalNoteTemplateVersions(id) {
    return new Promise((resolve, reject) => {
      Get(`/organisations/clinicalNoteTemplateVersions?id=${encodeURIComponent(id)}`)
        .then((res) => resolve(res))
        .catch((err) => reject(err));
    });
  },
  createClinicalNoteTemplate(data) {
    return new Promise((resolve, reject) => {
      Post("/organisations/clinicalNoteTemplateCreate", data)
        .then((res) => resolve(res))
        .catch((err) => reject(err));
    });
  },
  updateClinicalNoteTemplate(data) {
    return new Promise((resolve, reject) => {
      Post("/organisations/clinicalNoteTemplateUpdate", data)
        .then((res) => resolve(res))
        .catch((err) => reject(err));
    });
  },
  cloneClinicalNoteTemplate(data) {
    return new Promise((resolve, reject) => {
      Post("/organisations/clinicalNoteTemplateClone", data)
        .then((res) => resolve(res))
        .catch((err) => reject(err));
    });
  },
  setDefaultClinicalNoteTemplate(data) {
    return new Promise((resolve, reject) => {
      Post("/organisations/clinicalNoteTemplateSetDefault", data)
        .then((res) => resolve(res))
        .catch((err) => reject(err));
    });
  },
  listTreatments() {
    return new Promise((resolve, reject) => {
      Get("/diary/treatments")
        .then((res) => resolve(res))
        .catch((err) => reject(err));
    });
  },
  addTreatment(payload) {
    return new Promise((resolve, reject) => {
      Post("/diary/treatments-create", payload)
        .then((res) => resolve(res))
        .catch((err) => reject(err));
    });
  },
  updateTreatment(payload) {
    return new Promise((resolve, reject) => {
      Post("/diary/treatments-update", payload)
        .then((res) => resolve(res))
        .catch((err) => reject(err));
    });
  },
  deleteTreatment(id) {
    return new Promise((resolve, reject) => {
      Post("/diary/treatments-delete", { id })
        .then((res) => resolve(res))
        .catch((err) => reject(err));
    });
  },
  deleteAttribute(data) {
    return new Promise((resolve, reject) => {
      Post("/organisations/deleteAttribute", data)
        .then(resolve)
        .catch(reject);
    });
  },
  listCustomColumns() {
    return new Promise((resolve, reject) => {
      Get("/tasks/listCustomColumns")
        .then((res) => resolve(res))
        .catch((err) => reject(err));
    });
  },
  createOrganisationReferral(data) {
    return new Promise((resolve, reject) => {
      Post("/organisations/createReferral", data)
        .then((res) => resolve(res))
        .catch((err) => reject(err));
    });
  },
  getAllOrganisationReferrals() {
    return new Promise((resolve, reject) => {
      Get("/organisations/allReferrals")
        .then((res) => resolve(res))
        .catch((err) => reject(err));
    });
  },
  createOrganisationForUser(data) {
    return new Promise((resolve, reject) => {
      PostFormData("/organisations/createForUser", data)
        .then((res) => resolve(res))
        .catch((err) => reject(err));
    });
  },
}
