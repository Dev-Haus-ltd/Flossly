import { Get, Post } from "./apiWrapper";

export default {
  listAutomationGroups(patientId) {
    const q = patientId ? `?patientId=${encodeURIComponent(patientId)}` : "";
    return new Promise((resolve, reject) => {
      Get(`/patientJourney/automationGroups${q}`)
        .then(resolve)
        .catch(reject);
    });
  },
  listAutomationTemplates(groupKey, patientId) {
    const params = [];
    if (groupKey) params.push(`groupKey=${encodeURIComponent(groupKey)}`);
    if (patientId) params.push(`patientId=${encodeURIComponent(patientId)}`);
    const q = params.length ? `?${params.join("&")}` : "";
    return new Promise((resolve, reject) => {
      Get(`/patientJourney/automationTemplates${q}`)
        .then(resolve)
        .catch(reject);
    });
  },
  saveAutomationTemplate(payload) {
    return new Promise((resolve, reject) => {
      Post("/patientJourney/automationSave", payload)
        .then(resolve)
        .catch(reject);
    });
  },
  toggleAutomationGroup(payload) {
    return new Promise((resolve, reject) => {
      Post("/patientJourney/automationToggle", payload)
        .then(resolve)
        .catch(reject);
    });
  },
};
