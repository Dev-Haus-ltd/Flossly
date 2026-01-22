import taskService from "../services/taskService";

const makeTasksCacheKey = (payload = {}) => {
  const sorted = (obj) => {
    if (obj === null || typeof obj !== "object") return obj;
    if (Array.isArray(obj)) return obj.map((item) => sorted(item));
    return Object.keys(obj)
      .sort()
      .reduce((acc, key) => {
        acc[key] = sorted(obj[key]);
        return acc;
      }, {});
  };
  const cachePayload = { ...payload };
  if (!cachePayload.__cacheDay) {
    cachePayload.__cacheDay = new Date().toISOString().slice(0, 10);
  }
  return JSON.stringify(sorted(cachePayload));
};

export const useTaskStore = defineStore("taskStore", {
  state: () => ({
    myTasks: [],
    myTaskStats: null,
    myTeamTasks: [],
    myTeamTaskStats: [],
    isLoading: false,
    tasksCache: new Map(),
  }),

  getters: {},

  actions: {
    clearTasksCache() {
      this.tasksCache?.clear();
    },
    getMyTasks(data) {
      return new Promise((resolve, reject) => {
        this.isLoading = true;
        taskService
          .getMyTasks(data)
          .then((res) => {
            this.isLoading = false;
            resolve(res);
          })
          .catch((err) => {
            this.isLoading = false;
            reject(err);
          });
      });
    },
    getTaskDetails(data) {
      return new Promise((resolve, reject) => {
        this.isLoading = true;
        taskService
          .getTaskDetails(data)
          .then((res) => {
            this.isLoading = false;
            resolve(res);
          })
          .catch((err) => {
            this.isLoading = false;
            reject(err);
          });
      });
    },
    addNewTask(data) {
      return new Promise((resolve, reject) => {
        this.isLoading = true;
        taskService
          .addNewTask(data)
          .then((res) => { 
            this.isLoading = false;
            if (res?.code === 0) this.clearTasksCache();
            resolve(res);
          })
          .catch((err) => {
            this.isLoading = false;
            reject(err);
          });
      });
    },
    addBulkTasks(data) {
      return new Promise((resolve, reject) => {
        this.isLoading = true;
        taskService
          .addBulkTasks(data)
          .then((res) => { 
            this.isLoading = false;
            if (res?.code === 0) this.clearTasksCache();
            resolve(res);
          })
          .catch((err) => {
            this.isLoading = false;
            reject(err);
          });
      });
    },
    getMyTeamTasks() {
      return new Promise((resolve, reject) => {
        this.isLoading = true;
        taskService
          .getMyTeamTasks()
          .then((res) => {
            this.isLoading = false;
            resolve(res);
          })
          .catch((err) => {
            this.isLoading = false;
            reject(err);
          });
      });
    },
    getMyTeamTaskStats() {
      return new Promise((resolve, reject) => {
        this.isLoading = true;
        taskService
          .getMyTeamTaskStats()
          .then((res) => {
            this.isLoading = false;
            resolve(res);
          })
          .catch((err) => {
            this.isLoading = false;
            reject(err);
          });
      });
    },
    getMyTeamTasksDetails() {
      return new Promise((resolve, reject) => {
        this.isLoading = true;
        taskService
          .getMyTeamTasksDetails()
          .then((res) => {
            this.isLoading = false;
            resolve(res);
          })
          .catch((err) => {
            this.isLoading = false;
            reject(err);
          });
      });
    },
    listCategories() { 
      return new Promise((resolve, reject) => {
        this.isLoading = true;
        taskService
          .listCategories()
          .then((res) => {
            this.isLoading = false;
            resolve(res);
          })
          .catch((err) => {
            this.isLoading = false;
            reject(err);
          });
      });
    },
    listCategoriesForPool() { 
      return new Promise((resolve, reject) => {
        this.isLoading = true;
        taskService
          .listCategoriesForPool()
          .then((res) => {
            this.isLoading = false;
            resolve(res);
          })
          .catch((err) => {
            this.isLoading = false;
            reject(err);
          });
      });
    },
    getMyTaskStatsByCategory() {
      return new Promise((resolve, reject) => {
        this.isLoading = true;
        taskService
          .getMyTaskStatsByCategory()
          .then((res) => {
            this.isLoading = false;
            resolve(res);
          })
          .catch((err) => {
            this.isLoading = false;
            reject(err);
          });
      });
    },
    tasksGroupedByStatus(data) {
      return new Promise((resolve, reject) => {
        this.isLoading = true;
        taskService
          .tasksGroupedByStatus(data)
          .then((res) => {
            this.isLoading = false;
            resolve(res);
          })
          .catch((err) => {
            this.isLoading = false;
            reject(err);
          });
      });
    },
    tasksGroupedByStatusWithCache(data) {
      const key = makeTasksCacheKey(data);

      if (this.tasksCache?.has(key)) {
        return Promise.resolve({
          code: 0,
          data: this.tasksCache?.get(key),
        });
      }

      return new Promise((resolve, reject) => {
        this.isLoading = true;
        taskService
          .tasksGroupedByStatus(data)
          .then((res) => {
            this.isLoading = false;
            if (res?.code === 0 && res?.data) {
              this.tasksCache?.set(key, res.data);
            }
            resolve(res);
          })
          .catch((err) => {
            this.isLoading = false;
            reject(err);
          });
      });
    },
    teamTasksGroupedByStatus(data) {
      return new Promise((resolve, reject) => {
        this.isLoading = true;
        taskService
          .teamTasksGroupedByStatus(data)
          .then((res) => {
            this.isLoading = false;
            resolve(res);
          })
          .catch((err) => {
            this.isLoading = false;
            reject(err);
          });
      });
    },
    getTeamTaskStatsByCategory() {
      return new Promise((resolve, reject) => {
        this.isLoading = true;
        taskService
          .getTeamTaskStatsByCategory()
          .then((res) => {
            this.isLoading = false;
            resolve(res);
          })
          .catch((err) => {
            this.isLoading = false;
            reject(err);
          });
      });
    },
    updateChecklist(data) {
      return new Promise((resolve, reject) => {
        this.isLoading = true;
        taskService
          .updateChecklist(data)
          .then((res) => {
            this.isLoading = false;
            if (res?.code === 0) this.clearTasksCache();
            resolve(res);
          })
          .catch((err) => {
            this.isLoading = false;
            reject(err);
          });
      });
    },
  updateUserTask(data) {
    return new Promise((resolve, reject) => {
      this.isLoading = true;
      taskService
        .updateUserTask(data)
        .then((res) => {
          this.isLoading = false;
          if (res?.code === 0) this.clearTasksCache();
          resolve(res);
        })
        .catch((err) => {
          this.isLoading = false;
          reject(err);
        });
    });
  },
  addTaskComment(data) {
    return new Promise((resolve, reject) => {
      this.isLoading = true;
      taskService
        .addTaskComment(data)
        .then((res) => {
          this.isLoading = false;
          resolve(res);
        })
        .catch((err) => {
          this.isLoading = false;
          reject(err);
        });
    });
  },
  listTaskComments(data) {
    return new Promise((resolve, reject) => {
      this.isLoading = true;
      taskService
        .listTaskComments(data)
        .then((res) => {
          this.isLoading = false;
          resolve(res);
        })
        .catch((err) => {
          this.isLoading = false;
          reject(err);
        });
    });
  },
  updateTaskComment(data) {
    return new Promise((resolve, reject) => {
      this.isLoading = true;
      taskService
        .updateTaskComment(data)
        .then((res) => {
          this.isLoading = false;
          resolve(res);
        })
        .catch((err) => {
          this.isLoading = false;
          reject(err);
        });
    });
  },
  deleteTaskComment(data) {
    return new Promise((resolve, reject) => {
      this.isLoading = true;
      taskService
        .deleteTaskComment(data)
        .then((res) => {
          this.isLoading = false;
          resolve(res);
        })
        .catch((err) => {
          this.isLoading = false;
          reject(err);
        });
    });
  },
    addChecklist(data) {
      return new Promise((resolve, reject) => {
        this.isLoading = true;
        taskService
          .addChecklist(data)
          .then((res) => {
            this.isLoading = false;
            if (res?.code === 0) this.clearTasksCache();
            resolve(res);
          })
          .catch((err) => {
            this.isLoading = false;
            reject(err);
          });
      });
    },
    deleteChecklist(data) {
      return new Promise((resolve, reject) => {
        this.isLoading = true;
        taskService
          .deleteChecklist(data)
          .then((res) => {
            this.isLoading = false;
            if (res?.code === 0) this.clearTasksCache();
            resolve(res);
          })
          .catch((err) => {
            this.isLoading = false;
            reject(err);
          });
      });
    },
    generalTasks(data) {
    },
    bulkAddChecklists(data) {
      return new Promise((resolve, reject) => {
        this.isLoading = true;
        taskService
          .bulkAddChecklists(data)
          .then((res) => {
            this.isLoading = false;
            if (res?.code === 0) this.clearTasksCache();
            resolve(res);
          })
          .catch((err) => {
            this.isLoading = false;
            reject(err);
          });
      });
    },
    generalTasks(data) {
      return new Promise((resolve, reject) => {
        this.isLoading = true;
        taskService
          .generalTasks(data)
          .then((res) => {
            this.isLoading = false;
            resolve(res);
          })
          .catch((err) => {
            this.isLoading = false;
            reject(err);
          });
      });
    },
    addAttachments(data, options = {}) {
      return new Promise((resolve, reject) => {
        this.isLoading = true;
        taskService
          .addAttachments(data, options)
          .then((res) => {
            this.isLoading = false;
            if (res?.code === 0) this.clearTasksCache();
            resolve(res);
          })
          .catch((err) => {
            this.isLoading = false;
          reject(err);
        });
      });
    },
    deleteAttachment(data) {
      return new Promise((resolve, reject) => {
        this.isLoading = true;
        taskService
          .deleteAttachment(data)
          .then((res) => {
            this.isLoading = false;
            if (res?.code === 0) this.clearTasksCache();
            resolve(res);
          })
          .catch((err) => {
            this.isLoading = false;
            reject(err);
          });
      });
    },
    
    assignTask(data) {
      return new Promise((resolve, reject) => {
        this.isLoading = true;
        taskService
          .assignTask(data)
          .then((res) => {
            this.isLoading = false;
            if (res?.code === 0) this.clearTasksCache();
            resolve(res);
          })
          .catch((err) => {
            this.isLoading = false;
            reject(err);
          });
      });
    },
    sendTaskDetailsByEmail(data) {
      return new Promise((resolve, reject) => {
        this.isLoading = true;
        taskService
          .sendTaskDetailsByEmail(data)
          .then((res) => {
            this.isLoading = false;
            resolve(res);
          })
          .catch((err) => {
            this.isLoading = false;
            reject(err);
          });
      });
    },
    unAssignBulkTasks(data) {
      return new Promise((resolve, reject) => {
        this.isLoading = true;
        taskService
          .unAssignBulkTask(data)
          .then((res) => {
            this.isLoading = false;
            if (res?.code === 0) this.clearTasksCache();
            resolve(res);
          })
          .catch((err) => {
            this.isLoading = false;
            reject(err);
          });
      });
    },
    completeBulkTasks(data) {
      return new Promise((resolve, reject) => {
        this.isLoading = true;
        taskService
          .completeBulkTasks(data)
          .then((res) => {
            this.isLoading = false;
            if (res?.code === 0) this.clearTasksCache();
            resolve(res);
          })
          .catch((err) => {
            this.isLoading = false;
            reject(err);
          });
      });
    },

    archieveBulkTasks(data) {
      return new Promise((resolve, reject) => {
        this.isLoading = true;
        taskService
          .archieveBulkTasks(data)
          .then((res) => {
            this.isLoading = false;
            if (res?.code === 0) this.clearTasksCache();
            resolve(res);
          })
          .catch((err) => {
            this.isLoading = false;
            reject(err);
          });
      });
    },
    unarchiveBulkTasks(data) {
      return new Promise((resolve, reject) => {
        this.isLoading = true;
        taskService
          .unarchiveBulkTasks(data)
          .then((res) => {
            this.isLoading = false;
            if (res?.code === 0) this.clearTasksCache();
            resolve(res);
          })
          .catch((err) => {
            this.isLoading = false;
            reject(err);
          });
      });
    },
    unAssignTask(data) {
      return new Promise((resolve, reject) => {
        this.isLoading = true;
        taskService
          .unAssignTask(data)
          .then((res) => {
            this.isLoading = false;
            if (res?.code === 0) this.clearTasksCache();
            resolve(res);
          })
          .catch((err) => {
            this.isLoading = false;
            reject(err);
          });
      });
    },
    addCategory(data) {
      return new Promise((resolve, reject) => {
        this.isLoading = true;
        taskService
          .addCategory(data)
          .then((res) => {
            this.isLoading = false;
            resolve(res);
          })
          .catch((err) => {
            this.isLoading = false;
            reject(err);
          });
      });
    },
    deleteCategory(data) {
      return new Promise((resolve, reject) => {
        this.isLoading = true;
        taskService
          .deleteCategory(data)
          .then((res) => {
            this.isLoading = false;
            if (res?.code === 0) this.clearTasksCache();
            resolve(res);
          })
          .catch((err) => {
            this.isLoading = false;
            reject(err);
          });
      });
    },
    getTeamTaskStatsByStatusAndCategory(categoryId) {
      return new Promise((resolve, reject) => {
        this.isLoading = true;
        taskService
          .getTeamTaskStatsByStatusAndCategory(categoryId)
          .then((res) => {
            this.isLoading = false;
            resolve(res);
          })
          .catch((err) => {
            this.isLoading = false;
            reject(err);
          });
      });
    },
    createCustomColumn(data) {
      return new Promise((resolve, reject) => {
        taskService
          .createCustomColumn(data)
          .then((res) => {
            if (res.code === 0) {
              // Refresh custom columns list
              const mainStore = useMainStore();
              mainStore.getCustomColumns();
            }
            resolve(res);
          })
          .catch((err) => {
            reject(err);
          });
      });
    },
    deleteCustomColumn(data) {
      return new Promise((resolve, reject) => {
        taskService
          .deleteCustomColumn(data)
          .then((res) => {
            if (res.code === 0) {
              // Refresh custom columns list
              const mainStore = useMainStore();
              mainStore.getCustomColumns();
            }
            resolve(res);
          })
          .catch((err) => {
            reject(err);
          });
      });
    },
  },
});
