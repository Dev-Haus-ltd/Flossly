import scheduleService from '~/services/scheduleService'

export const useScheduleStore = defineStore('schedule', {
  state: () => ({
    schedules: [],
    currentSchedule: null,
    isLoading: false,
    isSaving: false,
    error: null,
  }),

  getters: {
    getAllSchedules: (state) => state.schedules,
    getActiveSchedules: (state) => state.schedules.filter(s => s.isActive),
    getScheduleById: (state) => (id) => state.schedules.find(s => s.id === id),
    getCurrentSchedule: (state) => state.currentSchedule,
    getCurrentScheduleDays: (state) => state.currentSchedule?.days || [],
    getScheduleDay: (state) => (dayOfWeek) => {
      const day = state.currentSchedule?.days?.find(d => d.dayOfWeek === dayOfWeek)
      return day || null
    },
    getBreaksForDay: (state) => (dayOfWeek) => {
      const day = state.currentSchedule?.days?.find(d => d.dayOfWeek === dayOfWeek)
      return day?.breaks || []
    },
    getIsLoading: (state) => state.isLoading,
    getIsSaving: (state) => state.isSaving,
    getError: (state) => state.error,
  },

  actions: {
    async fetchSchedules(organisationId, dentistId) {
      this.isLoading = true
      this.error = null

      try {
        const response = await scheduleService.listSchedules(organisationId, dentistId)
        
        if (response?.code === 0) {
          this.schedules = response.data || []
          return this.schedules
        } else {
          this.error = response?.message || 'Failed to fetch schedules'
          throw new Error(this.error)
        }
      } catch (err) {
        this.error = err.message || 'Error fetching schedules'
        console.error('Fetch schedules error:', err)
        throw err
      } finally {
        this.isLoading = false
      }
    },

    async fetchSchedule(scheduleId) {
      this.isLoading = true
      this.error = null

      try {
        const response = await scheduleService.getSchedule(scheduleId)
        
        if (response?.code === 0) {
          this.currentSchedule = response.data
          return this.currentSchedule
        } else {
          this.error = response?.message || 'Failed to fetch schedule'
          throw new Error(this.error)
        }
      } catch (err) {
        this.error = err.message || 'Error fetching schedule'
        console.error('Fetch schedule error:', err)
        throw err
      } finally {
        this.isLoading = false
      }
    },

    async createSchedule(payload) {
      this.isSaving = true
      this.error = null

      try {
        const response = await scheduleService.createSchedule(payload)
        
        if (response?.code === 0) {
          const newSchedule = response.data
          this.schedules.push(newSchedule)
          this.currentSchedule = newSchedule
          return newSchedule
        } else {
          this.error = response?.message || 'Failed to create schedule'
          throw new Error(this.error)
        }
      } catch (err) {
        this.error = err.message || 'Error creating schedule'
        console.error('Create schedule error:', err)
        throw err
      } finally {
        this.isSaving = false
      }
    },

    async updateSchedule(payload) {
      this.isSaving = true
      this.error = null

      try {
        const response = await scheduleService.updateSchedule(payload)
        
        if (response?.code === 0) {
          const updated = response.data
          const index = this.schedules.findIndex(s => s.id === updated.id)
          if (index !== -1) {
            this.schedules[index] = updated
          }
          if (this.currentSchedule?.id === updated.id) {
            this.currentSchedule = updated
          }
          return updated
        } else {
          this.error = response?.message || 'Failed to update schedule'
          throw new Error(this.error)
        }
      } catch (err) {
        this.error = err.message || 'Error updating schedule'
        console.error('Update schedule error:', err)
        throw err
      } finally {
        this.isSaving = false
      }
    },

    async updateScheduleDay(payload) {
      this.isSaving = true
      this.error = null

      try {
        const response = await scheduleService.updateScheduleDay(payload)
        
        if (response?.code === 0) {
          const updated = response.data
          if (this.currentSchedule) {
            const dayIndex = this.currentSchedule.days.findIndex(d => d.id === updated.id)
            if (dayIndex !== -1) {
              this.currentSchedule.days[dayIndex] = updated
            }
          }
          return updated
        } else {
          this.error = response?.message || 'Failed to update schedule day'
          throw new Error(this.error)
        }
      } catch (err) {
        this.error = err.message || 'Error updating schedule day'
        console.error('Update schedule day error:', err)
        throw err
      } finally {
        this.isSaving = false
      }
    },

    async addBreak(payload) {
      this.isSaving = true
      this.error = null

      try {
        const response = await scheduleService.addBreak(payload)
        
        if (response?.code === 0) {
          const newBreak = response.data
          if (this.currentSchedule) {
            const day = this.currentSchedule.days.find(d => d.id === payload.scheduleDayId)
            if (day) {
              if (!day.breaks) day.breaks = []
              day.breaks.push(newBreak)
            }
          }
          return newBreak
        } else {
          this.error = response?.message || 'Failed to add break'
          throw new Error(this.error)
        }
      } catch (err) {
        this.error = err.message || 'Error adding break'
        console.error('Add break error:', err)
        throw err
      } finally {
        this.isSaving = false
      }
    },

    async updateBreak(payload) {
      this.isSaving = true
      this.error = null

      try {
        const response = await scheduleService.updateBreak(payload)
        
        if (response?.code === 0) {
          const updated = response.data
          if (this.currentSchedule) {
            for (const day of this.currentSchedule.days) {
              const breakIndex = day.breaks?.findIndex(b => b.id === updated.id)
              if (breakIndex !== -1 && breakIndex >= 0) {
                day.breaks[breakIndex] = updated
                break
              }
            }
          }
          return updated
        } else {
          this.error = response?.message || 'Failed to update break'
          throw new Error(this.error)
        }
      } catch (err) {
        this.error = err.message || 'Error updating break'
        console.error('Update break error:', err)
        throw err
      } finally {
        this.isSaving = false
      }
    },

    async deleteBreak(breakId, scheduleDayId) {
      this.isSaving = true
      this.error = null

      try {
        const response = await scheduleService.deleteBreak(breakId)
        
        if (response?.code === 0) {
          if (this.currentSchedule) {
            const day = this.currentSchedule.days.find(d => d.id === scheduleDayId)
            if (day && day.breaks) {
              day.breaks = day.breaks.filter(b => b.id !== breakId)
            }
          }
          return true
        } else {
          this.error = response?.message || 'Failed to delete break'
          throw new Error(this.error)
        }
      } catch (err) {
        this.error = err.message || 'Error deleting break'
        console.error('Delete break error:', err)
        throw err
      } finally {
        this.isSaving = false
      }
    },

    async deleteSchedule(scheduleId) {
      this.isSaving = true
      this.error = null

      try {
        const response = await scheduleService.deleteSchedule(scheduleId)
        
        if (response?.code === 0) {
          this.schedules = this.schedules.filter(s => s.id !== scheduleId)
          if (this.currentSchedule?.id === scheduleId) {
            this.currentSchedule = null
          }
          return true
        } else {
          this.error = response?.message || 'Failed to delete schedule'
          throw new Error(this.error)
        }
      } catch (err) {
        this.error = err.message || 'Error deleting schedule'
        console.error('Delete schedule error:', err)
        throw err
      } finally {
        this.isSaving = false
      }
    },

    async toggleSchedule(scheduleId) {
      this.isSaving = true
      this.error = null

      try {
        const response = await scheduleService.toggleSchedule(scheduleId)
        
        if (response?.code === 0) {
          const updated = response.data
          const index = this.schedules.findIndex(s => s.id === updated.id)
          if (index !== -1) {
            this.schedules[index] = updated
          }
          if (this.currentSchedule?.id === updated.id) {
            this.currentSchedule = updated
          }
          return updated
        } else {
          this.error = response?.message || 'Failed to toggle schedule'
          throw new Error(this.error)
        }
      } catch (err) {
        this.error = err.message || 'Error toggling schedule'
        console.error('Toggle schedule error:', err)
        throw err
      } finally {
        this.isSaving = false
      }
    },

    clearCurrentSchedule() {
      this.currentSchedule = null
      this.error = null
    },

    clearError() {
      this.error = null
    },

    setSchedules(schedules) {
      this.schedules = schedules
    },

    setCurrentSchedule(schedule) {
      this.currentSchedule = schedule
    },
  }
})