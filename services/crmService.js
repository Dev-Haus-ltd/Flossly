import { Get, Post } from "./apiWrapper";

export default {
  startMetaAuth() {
    return new Promise((resolve, reject) => {
      Get("/meta/authStart")
        .then((res) => resolve(res))
        .catch((err) => reject(err));
    });
  },
  fetchLeads() {
    return new Promise((resolve, reject) => {
      Get("/meta/leads")
        .then((res) => resolve(res))
        .catch((err) => reject(err));
    });
  },
  fetchLeadsNow() {
    return new Promise((resolve, reject) => {
      Get("/meta/fetchLeads")
        .then((res) => resolve(res))
        .catch((err) => reject(err));
    });
  },
  subscribePages() {
    return new Promise((resolve, reject) => {
      Get("/meta/subscribe")
        .then((res) => resolve(res))
        .catch((err) => reject(err));
    });
  },
};

