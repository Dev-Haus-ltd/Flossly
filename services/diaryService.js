import { Post, Get, PostFormData } from "./apiWrapper";

export default {
  listTreatments() {
    return new Promise((resolve, reject) => {
      Get("/diary/treatments")
        .then(resolve)
        .catch(reject);
    });
  },
  listPatients(search = "") {
    const q = search ? `?search=${encodeURIComponent(search)}` : "";
    return new Promise((resolve, reject) => {
      Get(`/diary/patients${q}`)
        .then(resolve)
        .catch(reject);
    });
  },
  listPatientsPaged({ page = 1, itemsPerPage = 10, search = "", sortBy, sortDesc, sex, paymentPlan, marketingConsent, dentistId } = {}) {
    const params = new URLSearchParams();
    params.append("page", page);
    params.append("itemsPerPage", itemsPerPage);
    if (search) params.append("search", search);
    if (sortBy) params.append("sortBy", sortBy);
    if (sortDesc !== undefined) params.append("sortDesc", sortDesc);
    if (sex) params.append("sex", sex);
    if (paymentPlan) params.append("paymentPlan", paymentPlan);
    if (marketingConsent) params.append("marketingConsent", marketingConsent);
    if (dentistId) params.append("dentistId", dentistId);
    return new Promise((resolve, reject) => {
      Get(`/diary/patientsPaged?${params.toString()}`)
        .then(resolve)
        .catch(reject);
    });
  },
  getPatientStats() {
    return new Promise((resolve, reject) => {
      Get("/diary/patientStats")
        .then(resolve)
        .catch(reject);
    });
  },

  createPatient(payload) {
    return new Promise((resolve, reject) => {
      Post("/diary/patientCreate", payload)
        .then(resolve)
        .catch(reject);
    });
  },

  getPatient(id) {
    return new Promise((resolve, reject) => {
      Get(`/diary/patientGet?id=${encodeURIComponent(id)}`)
        .then(resolve)
        .catch(reject);
    });
  },

  updatePatient(payload) {
    return new Promise((resolve, reject) => {
      Post("/diary/patientUpdate", payload)
        .then(resolve)
        .catch(reject);
    });
  },
  listAppointments({ date, dentistId, status, treatmentId, search, patientId } = {}) {
    const params = new URLSearchParams();
    if (date) params.append("date", date);
    if (dentistId) params.append("dentistId", dentistId);
    if (status) params.append("status", status);
    if (treatmentId) params.append("treatmentId", treatmentId);
    if (search) params.append("search", search);
    if (patientId) params.append("patientId", patientId);

    return new Promise((resolve, reject) => {
      Get(`/diary/appointments?${params.toString()}`)
        .then(resolve)
        .catch(reject);
    });
  },

  createAppointment(payload) {
    return new Promise((resolve, reject) => {
      Post("/diary/appointmentCreate", payload)
        .then(resolve)
        .catch(reject);
    });
  },

  updateAppointment(payload) {
    return new Promise((resolve, reject) => {
      Post("/diary/appointmentUpdate", payload)
        .then(resolve)
        .catch(reject);
    });
  },
  listDentists(date) {
    const q = new URLSearchParams();
    if (date) q.append("date", date);

    return new Promise((resolve, reject) => {
      Get(`/diary/dentists?${q.toString()}`)
        .then(resolve)
        .catch(reject);
    });
  },
  getStats({ period = "day", date } = {}) {
    const p = new URLSearchParams({ period });
    if (date) p.append("date", date);

    return new Promise((resolve, reject) => {
      Get(`/diary/stats?${p.toString()}`)
        .then(resolve)
        .catch(reject);
    });
  },
  listNotes({ dentistId, date }) {
    const p = new URLSearchParams();
    if (dentistId) p.append("dentistId", dentistId);
    if (date) p.append("date", date);

    return new Promise((resolve, reject) => {
      Get(`/diary/notes?${p.toString()}`)
        .then(resolve)
        .catch(reject);
    });
  },

  createNote(payload) {
    return new Promise((resolve, reject) => {
      Post("/diary/noteCreate", payload)
        .then(resolve)
        .catch(reject);
    });
  },

  deleteNote(id) {
    return new Promise((resolve, reject) => {
      Post("/diary/noteDelete", { id })
        .then(resolve)
        .catch(reject);
    });
  },
};
