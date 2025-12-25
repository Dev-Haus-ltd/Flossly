import { Get, Post } from "./apiWrapper";

export default {
  listAutomationGroups() {
    return new Promise((resolve, reject) => {
      Get("/patientJourney/automationGroups")
        .then(resolve)
        .catch(reject);
    });
  },
  listAutomationTemplates(groupKey) {
    const q = groupKey ? `?groupKey=${encodeURIComponent(groupKey)}` : "";
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
