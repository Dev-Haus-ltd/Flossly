import { Get, Post, PostFormData } from "./apiWrapper";
export default {
    getCourses(data) {
    return new Promise((resolve, reject) => {
      Post("/cpd/listCourses", data)
        .then((res) => {
          resolve(res);
        })
        .catch((err) => {
          reject(err);
        });
    });
  },
  getMyCourses() {
    return new Promise((resolve, reject) => {
      Post("/cpd/mycourses")
        .then((res) => {
          resolve(res);
        })
        .catch((err) => {
          reject(err);
        });
    });
  },
  startQuiz(data) {
    return new Promise((resolve, reject) => {
      Post("/cpd/startQuiz", data)
        .then((res) => {
          resolve(res);
        })
        .catch((err) => {
          reject(err);
        });
    });
  },
  submitQuiz(data) {
    return new Promise((resolve, reject) => {
      Post("/cpd/submitQuiz", data)
        .then((res) => {
          resolve(res);
        })
        .catch((err) => {
          reject(err);
        });
    });
  },
};
