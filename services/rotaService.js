import { Get, Post } from "./apiWrapper";
export default {
  getRotas() {
    return new Promise((resolve, reject) => {
      Get("/rota/list")
        .then((res) => {
          resolve(res);
        })
        .catch((err) => {
          reject(err);
        });
    });
  },
  addRota(data) {
    return new Promise((resolve, reject) => {
      Post("/rota/add",data)
        .then((res) => {
          resolve(res);
        })
        .catch((err) => {
          reject(err);
        });
    });
  },
  updateRota(data) {
    return new Promise((resolve, reject) => {
      Post("/rota/update",data)
        .then((res) => {
          resolve(res);
        })
        .catch((err) => {
          reject(err);
        });
    });
  },
  publishRota(data) {
    return new Promise((resolve, reject) => {
      Post("/rota/publish",data)
        .then((res) => {
          resolve(res);
        })
        .catch((err) => {
          reject(err);
        });
    });
  },
  unPublishRota(data) {
    return new Promise((resolve, reject) => {
      Post("/rota/unpublish",data)
        .then((res) => {
          resolve(res);
        })
        .catch((err) => {
          reject(err);
        });
    });
  },
  removeRotaUser(data) {
    return new Promise((resolve, reject) => {
      Post("/rota/removeUser",data)
        .then((res) => {
          resolve(res);
        })
        .catch((err) => {
          reject(err);
        });
    });
  },
  addRotaUsers(data) {
    return new Promise((resolve, reject) => {
      Post("/rota/addUser",data)
        .then((res) => {
          resolve(res);
        })
        .catch((err) => {
          reject(err);
        });
    });
  },
  addRotaShift(data) {
    return new Promise((resolve, reject) => {
      Post("/rota/addShift",data)
        .then((res) => {
          resolve(res);
        })
        .catch((err) => {
          reject(err);
        });
    });
  },
  updateShift(data) {
    return new Promise((resolve, reject) => {
      Post("/rota/updateShift",data)
        .then((res) => {
          resolve(res);
        })
        .catch((err) => {
          reject(err);
        });
    });
  },
  startShift(data) {
    return new Promise((resolve, reject) => {
      Post("/rota/startShift",data)
        .then((res) => {
          resolve(res);
        })
        .catch((err) => {
          reject(err);
        });
    });
  },
  completeShift(data) {
    return new Promise((resolve, reject) => {
      Post("/rota/completeShift",data)
        .then((res) => {
          resolve(res);
        })
        .catch((err) => {
          reject(err);
        });
    });
  },
  getAllShifts(data) {
    return new Promise((resolve, reject) => {
      Post("/rota/shifts",data)
        .then((res) => {
          resolve(res);
        })
        .catch((err) => {
          reject(err);
        });
    });
  },
  getRotaUsers(data) {
    return new Promise((resolve, reject) => {
      Post("/rota/users",data)
        .then((res) => {
          resolve(res);
        })
        .catch((err) => {
          reject(err);
        });
    });
  },
  deleteRotaShift(data) {
    return new Promise((resolve, reject) => {
      Post("/rota/deleteShift",data)
        .then((res) => {
          resolve(res);
        })
        .catch((err) => {
          reject(err);
        });
    });
  },
  getUserRotas(data) {
    return new Promise((resolve, reject) => {
      Post("/rota/myRotas",data)
        .then((res) => {
          resolve(res);
        })
        .catch((err) => {
          reject(err);
        });
    });
  }
};
