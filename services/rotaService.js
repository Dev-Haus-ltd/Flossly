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
  addRota() {
    return new Promise((resolve, reject) => {
      Post("/rota/add")
        .then((res) => {
          resolve(res);
        })
        .catch((err) => {
          reject(err);
        });
    });
  },
  updateRota() {
    return new Promise((resolve, reject) => {
      Post("/rota/update")
        .then((res) => {
          resolve(res);
        })
        .catch((err) => {
          reject(err);
        });
    });
  },
  publishRota() {
    return new Promise((resolve, reject) => {
      Post("/rota/publish")
        .then((res) => {
          resolve(res);
        })
        .catch((err) => {
          reject(err);
        });
    });
  },
  unPublishRota() {
    return new Promise((resolve, reject) => {
      Post("/rota/unpublish")
        .then((res) => {
          resolve(res);
        })
        .catch((err) => {
          reject(err);
        });
    });
  },
  removeRotaUser() {
    return new Promise((resolve, reject) => {
      Post("/rota/removeUser")
        .then((res) => {
          resolve(res);
        })
        .catch((err) => {
          reject(err);
        });
    });
  },
  addRotaUsers() {
    return new Promise((resolve, reject) => {
      Post("/rota/addUser")
        .then((res) => {
          resolve(res);
        })
        .catch((err) => {
          reject(err);
        });
    });
  },
  addRotaShift() {
    return new Promise((resolve, reject) => {
      Post("/rota/addShift")
        .then((res) => {
          resolve(res);
        })
        .catch((err) => {
          reject(err);
        });
    });
  },
  updateShift() {
    return new Promise((resolve, reject) => {
      Post("/rota/updateShift")
        .then((res) => {
          resolve(res);
        })
        .catch((err) => {
          reject(err);
        });
    });
  },
  startShift() {
    return new Promise((resolve, reject) => {
      Post("/rota/startShift")
        .then((res) => {
          resolve(res);
        })
        .catch((err) => {
          reject(err);
        });
    });
  },
  completeShift() {
    return new Promise((resolve, reject) => {
      Post("/rota/completeShift")
        .then((res) => {
          resolve(res);
        })
        .catch((err) => {
          reject(err);
        });
    });
  },
  getAllShifts() {
    return new Promise((resolve, reject) => {
      Post("/rota/shifts")
        .then((res) => {
          resolve(res);
        })
        .catch((err) => {
          reject(err);
        });
    });
  },
};
