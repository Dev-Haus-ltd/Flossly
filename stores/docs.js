import docService from "../services/docService";

export const useDocStore = defineStore("docStore", {
  state: () => ({
    isLoading: false,
  }),

  getters: {},

  actions: {
    getFolders(data) {
      this.isLoading = true;
      return new Promise((resolve, reject) => {
        docService
          .getFolders(data)
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
    getSystemFolders(data) {
      this.isLoading = true;
      return new Promise((resolve, reject) => {
        docService
          .getSystemFolders(data)
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
    craeteFolder(data) {
      this.isLoading = true;
      return new Promise((resolve, reject) => {
        docService
          .createFolder(data)
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
    craeteSystemFolder(data) {
      this.isLoading = true;
      return new Promise((resolve, reject) => {
        docService
          .createSystemFolder(data)
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
    deleteFolder(data) {
      this.isLoading = true;
      return new Promise((resolve, reject) => {
        docService
          .deleteFolder(data)
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
    updateFolder(data) {
      this.isLoading = true;
      return new Promise((resolve, reject) => {
        docService
          .updateFolder(data)
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
    listDocs(data) {
      this.isLoading = true;
      return new Promise((resolve, reject) => {
        docService
          .listDocs(data)
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
    listSystemDocs(data) {
      this.isLoading = true;
      return new Promise((resolve, reject) => {
        docService
          .listSystemDocs(data)
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
    deleteDoc(data) {
      this.isLoading = true;
      return new Promise((resolve, reject) => {
        docService
          .deleteDoc(data)
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
    recentDocs() {
      this.isLoading = true;
      return new Promise((resolve, reject) => {
        docService
          .recentDocs()
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
    viewDoc(data) {
      this.isLoading = true;
      return new Promise((resolve, reject) => {
        docService
          .viewDoc(data)
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
    viewSystemDoc(data) {
      this.isLoading = true;
      return new Promise((resolve, reject) => {
        docService
          .viewSystemDoc(data)
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
    addDocs(data) {
      this.isLoading = true;
      return new Promise((resolve, reject) => {
        docService
          .addDocs(data)
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
    addSystemDocs(data) {
      this.isLoading = true;
      return new Promise((resolve, reject) => {
        docService
          .addSystemDocs(data)
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
    updateDocument(data) {
      this.isLoading = true;
      return new Promise((resolve, reject) => {
        docService
          .updateDocument(data)
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
    getAllFolders() {
      this.isLoading = true;
      return new Promise((resolve, reject) => {
        docService
          .getAllFolders()
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
    moveDocument(data) {
      this.isLoading = true;
      return new Promise((resolve, reject) => {
        docService
          .moveDocument(data)
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
    moveFolder(data) {
      this.isLoading = true;
      return new Promise((resolve, reject) => {
        docService
          .moveFolder(data)
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
