import { Get, Post } from "./apiWrapper";

export default {
  getSmtpSettings() {
    return new Promise((resolve, reject) => {
      Get("/smtp/get")
        .then((res) => resolve(res))
        .catch((err) => reject(err));
    });
  },
  saveSmtpSettings(data) {
    return new Promise((resolve, reject) => {
      Post("/smtp/save", data)
        .then((res) => resolve(res))
        .catch((err) => reject(err));
    });
  },
  testSmtpConnection(data) {
    return new Promise((resolve, reject) => {
      Post("/smtp/test", data)
        .then((res) => resolve(res))
        .catch((err) => reject(err));
    });
  },
  deleteSmtpSettings() {
    return new Promise((resolve, reject) => {
      Post("/smtp/delete", {})
        .then((res) => resolve(res))
        .catch((err) => reject(err));
    });
  },
};
