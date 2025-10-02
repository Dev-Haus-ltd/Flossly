<template>
  <div class="mt-5">
    <v-row>
      <v-col cols="12">
        <v-card
          elevation="0"
          class="pa-7"
          style="border: 1px solid #dbdbdb; border-radius: 12px"
        >
          <div class="info-section">
            <!-- Contract Type -->
            <div class="mb-4" style="width: 40%">
              <label class="info-label">Contract Type</label>
              <p
                class="editable"
              >
                {{ contractDetails?.contractType }}
              </p>
            </div>

            <!-- Start Date -->
            <div class="mb-4" style="width: 40%">
              <label class="info-label">Start Date</label>
              <p class="editable" v-bind="props">
                    {{ contractDetails?.contractStartDate }}
                  </p>
            </div>

            <!-- Hours Worked -->
            <div class="mb-4" style="width: 40%">
              <label class="info-label">Hours Worked (weekly)</label>
              <p
                class="editable"
              >
                {{ contractDetails?.weeklyHours  }}
              </p>
            </div>

            <!-- Salary -->
            <div class="mb-4" style="width: 40%">
              <label class="info-label">Salary (per hour)</label>
              <p
                class="editable"
              >
                {{ contractDetails?.salaryPerHour }}
              </p>
            </div>

            <!-- Probation Period End -->
            <div class="mb-4" style="width: 40%">
              <label class="info-label">Probation Period End</label>
              <p
                class="editable"
              >
                {{ contractDetails?.probEndDate  }}
              </p>
            </div>

            <!-- Holiday Entitlement -->
            <div class="mb-4" style="width: 40%">
              <label class="info-label">Holiday Entitlement (days)</label>
              <p
                class="editable"
              >
                {{ contractDetails?.holidaysEntitled  }}
              </p>
            </div>
          </div>
        </v-card>
      </v-col>
    </v-row>
  </div>
</template>

<script setup>
import { reactive } from "vue";

const emit = defineEmits(["update"]);
const { contractDetails } = defineProps({
  contractDetails: Object
})

const menus = reactive({
  startDate: false,
  dob: false,
});

function logValue(e, key) {
  contractDetails[key] = e.target.innerText.trim();
  emit("update", contractDetails);
}
</script>

<style scoped>
.info-label {
  display: block;
  
  font-weight: 600;
  font-size: 13px;
  color: #1e1e1e;
  margin-bottom: 4px;
}

.editable {
  
  font-weight: 400;
  font-size: 14px;
  color: #101010;
  outline: none;
  cursor: text;
  min-height: 20px;
  border: 1px solid transparent;
  border-radius: 6px;
}
.editable:focus {
  border: 1px solid #dfdfdf;
  padding: 4px 6px;
}
</style>
