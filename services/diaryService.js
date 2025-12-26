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
  listAppointments({ date, dentistId, status, treatmentId, search } = {}) {
    const params = new URLSearchParams();
    if (date) params.append("date", date);
    if (dentistId) params.append("dentistId", dentistId);
    if (status) params.append("status", status);
    if (treatmentId) params.append("treatmentId", treatmentId);
    if (search) params.append("search", search);

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

  // Unique Patient Comfort
  getPatientComfort(patientId) {
    const q = new URLSearchParams();
    if (patientId) q.append("patientId", patientId);
    return new Promise((resolve, reject) => {
      Get(`/diary/patientComfortGet?${q.toString()}`)
        .then(resolve)
        .catch(reject);
    });
  },
  savePatientComfort(payload) {
    return new Promise((resolve, reject) => {
      Post("/diary/patientComfortSave", payload)
        .then(resolve)
        .catch(reject);
    });
  },

  // Smile Concern Survey
  getPatientSurvey(patientId) {
    const q = new URLSearchParams();
    if (patientId) q.append("patientId", patientId);
    return new Promise((resolve, reject) => {
      Get(`/diary/surveyGet?${q.toString()}`)
        .then(resolve)
        .catch(reject);
    });
  },
  savePatientSurvey(payload) {
    return new Promise((resolve, reject) => {
      Post("/diary/surveySave", payload)
        .then(resolve)
        .catch(reject);
    });
  },
  uploadSurveyPhotos(formData) {
    return new Promise((resolve, reject) => {
      PostFormData("/diary/surveyUploadPhotos", formData)
        .then(resolve)
        .catch(reject);
    });
  },
  sharePatientSurvey(payload) {
    return new Promise((resolve, reject) => {
      Post("/diary/surveyShare", payload)
        .then(resolve)
        .catch(reject);
    });
  },
  printPatientSurvey(patientId) {
    const q = new URLSearchParams();
    if (patientId) q.append("patientId", patientId);
    return new Promise((resolve, reject) => {
      Get(`/diary/surveyPrint?${q.toString()}`)
        .then(resolve)
        .catch(reject);
    });
  },
  downloadPatientSurvey(patientId) {
    const q = new URLSearchParams();
    if (patientId) q.append("patientId", patientId);
    return new Promise((resolve, reject) => {
      Get(`/diary/surveyDownload?${q.toString()}`)
        .then(resolve)
        .catch(reject);
    });
  },

  // Patient Forms
  listPatientForms(patientId) {
    const q = new URLSearchParams();
    if (patientId) q.append("patientId", patientId);
    return new Promise((resolve, reject) => {
      Get(`/diary/formsList?${q.toString()}`)
        .then(resolve)
        .catch(reject);
    });
  },
  getPatientForm(formId) {
    const q = new URLSearchParams();
    if (formId) q.append("id", formId);
    return new Promise((resolve, reject) => {
      Get(`/diary/formGet?${q.toString()}`)
        .then(resolve)
        .catch(reject);
    });
  },
  savePatientForm(payload) {
    return new Promise((resolve, reject) => {
      Post("/diary/formSave", payload)
        .then(resolve)
        .catch(reject);
    });
  },
  updatePatientForm(payload) {
    return new Promise((resolve, reject) => {
      Post("/diary/formUpdate", payload)
        .then(resolve)
        .catch(reject);
    });
  },
  deletePatientForm(formId) {
    const q = new URLSearchParams();
    if (formId) q.append("id", formId);
    return new Promise((resolve, reject) => {
      Get(`/diary/formDelete?${q.toString()}`)
        .then(resolve)
        .catch(reject);
    });
  },
};
