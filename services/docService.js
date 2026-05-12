import { Get, Post, PostFormData } from "./apiWrapper";
export default {
  getFolders(data) {
    return new Promise((resolve, reject) => {
      Post("/docs/listFolders", data)
        .then((res) => {
          resolve(res);
        })
        .catch((err) => {
          reject(err);
        });
    });
  },
  getSystemFolders(data) {
    return new Promise((resolve, reject) => {
      Post("/docs/listSystemFolders", data)
        .then((res) => {
          resolve(res);
        })
        .catch((err) => {
          reject(err);
        });
    });
  },
  createFolder(data) {
    return new Promise((resolve, reject) => {
      Post("/docs/createfolder", data)
        .then((res) => {
          resolve(res);
        })
        .catch((err) => {
          reject(err);
        });
    });
  },
  createSystemFolder(data) {
    return new Promise((resolve, reject) => {
      Post("/docs/createSystemfolder", data)
        .then((res) => {
          resolve(res);
        })
        .catch((err) => {
          reject(err);
        });
    });
  },
  updateFolder(data) {
    return new Promise((resolve, reject) => {
      Post("/docs/updateFolder", data)
        .then((res) => {
          resolve(res);
        })
        .catch((err) => {
          reject(err);
        });
    });
  },
  deleteFolder(data) {
    return new Promise((resolve, reject) => {
      Post("/docs/deleteFolder", data)
        .then((res) => {
          resolve(res);
        })
        .catch((err) => {
          reject(err);
        });
    });
  },
  recentDocs() {
    return new Promise((resolve, reject) => {
      Get("/docs/recent")
        .then((res) => {
          resolve(res);
        })
        .catch((err) => {
          reject(err);
        });
    });
  },
  
  deleteDoc(data) {
    return new Promise((resolve, reject) => {
      Post("/docs/delete", data)
        .then((res) => {
          resolve(res);
        })
        .catch((err) => {
          reject(err);
        });
    });
  },
  viewDoc(data) {
    return new Promise((resolve, reject) => {
      Post("/docs/view", data)
        .then((res) => {
          resolve(res);
        })
        .catch((err) => {
          reject(err);
        });
    });
  },
  viewSystemDoc(data) {
    return new Promise((resolve, reject) => {
      Post("/docs/viewSystemDoc", data)
        .then((res) => {
          resolve(res);
        })
        .catch((err) => {
          reject(err);
        });
    });
  },
  listDocs(data) {
    return new Promise((resolve, reject) => {
      Post("/docs/list", data)
        .then((res) => {
          resolve(res);
        })
        .catch((err) => {
          reject(err);
        });
    });
  },
  listSystemDocs(data) {
    return new Promise((resolve, reject) => {
      Post("/docs/listSystemDocuments", data)
        .then((res) => {
          resolve(res);
        })
        .catch((err) => {
          reject(err);
        });
    });
  },
  addDocs(data) {
    return new Promise((resolve, reject) => {
      PostFormData("/docs/add", data)
        .then((res) => {
          resolve(res);
        })
        .catch((err) => {
          reject(err);
        });
    });
  },
  addSystemDocs(data) {
    return new Promise((resolve, reject) => {
      PostFormData("/docs/addSystemDoc", data)
        .then((res) => {
          resolve(res);
        })
        .catch((err) => {
          reject(err);
        });
    });
  },
  updateDocument(data) {
    return new Promise((resolve, reject) => {
      PostFormData("/docs/update", data)
        .then((res) => {
          resolve(res);
        })
        .catch((err) => {
          reject(err);
        });
    });
  },
  getAllFolders() {
    return new Promise((resolve, reject) => {
      Post("/docs/listAllFolders")
        .then((res) => {
          resolve(res);
        })
        .catch((err) => {
          reject(err);
        });
    });
  },
  moveDocument(data) {
    return new Promise((resolve, reject) => {
      Post("/docs/moveDocument", data)
        .then((res) => {
          resolve(res);
        })
        .catch((err) => {
          reject(err);
        });
    });
  },
  moveFolder(data) {
    return new Promise((resolve, reject) => {
      Post("/docs/moveFolder", data)
        .then((res) => {
          resolve(res);
        })
        .catch((err) => {
          reject(err);
        });
    });
  },
};
