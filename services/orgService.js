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
  listTreatments() {
    return new Promise((resolve, reject) => {
      Post("/diary/treamtments")
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
  }

}
