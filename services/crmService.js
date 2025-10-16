import { Get, Post } from "./apiWrapper";

export default {
  startMetaAuth() {
    return new Promise((resolve, reject) => {
      Get("/meta/authStart")
        .then((res) => resolve(res))
        .catch((err) => reject(err));
    });
  },
  connectionStatus() {
    return new Promise((resolve, reject) => {
      Get("/meta/connection")
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
  getAdAccounts() {
    return new Promise((resolve, reject) => {
      Get("/meta/adaccounts")
        .then((res) => resolve(res))
        .catch((err) => reject(err));
    });
  },
  getCampaigns(accountId) {
    return new Promise((resolve, reject) => {
      Get(`/meta/campaigns?account_id=${encodeURIComponent(accountId)}`)
        .then((res) => resolve(res))
        .catch((err) => reject(err));
    });
  },
  getAds({ accountId, campaignId }) {
    const q = campaignId ? `campaign_id=${encodeURIComponent(campaignId)}` : `account_id=${encodeURIComponent(accountId)}`
    return new Promise((resolve, reject) => {
      Get(`/meta/ads?${q}`)
        .then((res) => resolve(res))
        .catch((err) => reject(err));
    });
  },
};
