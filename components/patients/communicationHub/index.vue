<template>
  <div class="communication-hub">
    <section class="hub-card">
      <div class="hub-card__header">
        <h2>Communication Hub</h2>

        <button type="button" class="new-btn">
          <v-icon start>mdi-plus-circle-outline</v-icon>
          <span>New Correspondence</span>
        </button>
      </div>

      <div class="hub-table-wrap">
        <table class="hub-table">
          <thead>
            <tr>
              <th>Kind</th>
              <th>Description</th>
              <th>Status</th>
              <th>Sent</th>
              <th>Created</th>
              <th>Action</th>
            </tr>
          </thead>

          <tbody>
            <tr v-for="item in correspondence" :key="item.id">
              <td>
                <div class="kind-cell">
                  <v-icon size="16" color="#4b5563">mdi-email-outline</v-icon>
                  <span>Email</span>
                </div>
              </td>
              <td class="description-cell">{{ item.description }}</td>
              <td class="status-cell">
                <span
                  class="status-badge"
                  :class="`status-badge--${item.status.toLowerCase()}`"
                >
                  {{ item.status }}
                </span>
              </td>
              <td>{{ item.sent }}</td>
              <td>{{ item.created }}</td>
              <td>
                <div class="action-cell">
                  <button type="button" class="icon-btn">
                    <v-icon size="16" color="#d069b0">mdi-eye-outline</v-icon>
                  </button>
                  <button
                    v-if="item.editable"
                    type="button"
                    class="icon-btn"
                  >
                    <v-icon size="16" color="#f5a623">mdi-pencil-outline</v-icon>
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>
  </div>
</template>

<script setup>
const reminderText =
  "Mr KANR CROSFILL, This is a reminder that you have a dental appointment at Dentozen- Leeds";

const correspondence = [
  {
    id: 1,
    description: reminderText,
    status: "Delivered",
    sent: "Wed 8 Oct 2025 at 11:40",
    created: "Wed 8 Oct 2025 at 11:40",
    editable: false,
  },
  {
    id: 2,
    description: reminderText,
    status: "Sent",
    sent: "Wed 8 Oct 2025 at 11:40",
    created: "Wed 8 Oct 2025 at 11:40",
    editable: false,
  },
  {
    id: 3,
    description: reminderText,
    status: "Failed",
    sent: "Wed 8 Oct 2025 at 11:40",
    created: "Wed 8 Oct 2025 at 11:40",
    editable: true,
  },
  {
    id: 4,
    description: reminderText,
    status: "Pending",
    sent: "Wed 8 Oct 2025 at 11:40",
    created: "Wed 8 Oct 2025 at 11:40",
    editable: true,
  },
];
</script>

<style scoped lang="scss">
.communication-hub {
  margin-top: 18px;
}

.hub-card {
  min-height: 535px;
  border: 1px solid #e8edf3;
  border-radius: 20px;
  background: #ffffff;
  overflow: hidden;
}

.hub-card__header {
  padding: 10px 14px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  border-bottom: 1px solid #edf1f5;
}

.hub-card__header h2 {
  font-size: 30px;
  font-weight: 700;
  color: #242424;
}

.new-btn {
  height: 38px;
  border: 0;
  border-radius: 8px;
  padding: 0 18px;
  background: #0061fb;
  color: #ffffff;
  display: inline-flex;
  align-items: center;
  font-size: 13px;
  font-weight: 500;
}

.hub-table-wrap {
  overflow-x: auto;
}

.hub-table {
  width: 100%;
  min-width: 980px;
  border-collapse: collapse;
}

.hub-table th,
.hub-table td {
  border-bottom: 1px solid #edf1f5;
  border-right: 1px solid #edf1f5;
  padding: 8px 12px;
  text-align: left;
  font-size: 12px;
  color: #5a6576;
  vertical-align: middle;
}

.hub-table th {
  font-size: 11px;
  font-weight: 600;
  color: #757f8f;
  background: #ffffff;
}

.hub-table th:last-child,
.hub-table td:last-child {
  border-right: 0;
}

.kind-cell,
.action-cell {
  display: flex;
  align-items: center;
  gap: 6px;
}

.description-cell {
  min-width: 430px;
  color: #606978;
}

.status-cell {
  padding: 0 !important;
  width: 108px;
}

.status-badge {
  min-height: 31px;
  width: 100%;
  display: flex;
  align-items: center;
  padding: 0 12px;
  color: #ffffff;
  font-size: 12px;
  font-weight: 500;
}

.status-badge--delivered {
  background: #10b057;
}

.status-badge--sent {
  background: #0b7fd9;
}

.status-badge--failed {
  background: #ff3131;
}

.status-badge--pending {
  background: #ff7a00;
}

.icon-btn {
  border: 0;
  background: transparent;
  width: 20px;
  height: 20px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

@media (max-width: 900px) {
  .hub-card__header {
    flex-direction: column;
    align-items: flex-start;
  }

  .hub-card__header h2 {
    font-size: 24px;
  }
}
</style>
