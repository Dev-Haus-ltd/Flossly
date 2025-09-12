<template>
  <div class="parent">
    <div class="cust-border d-flex align-center">
      <p class="mr-1">Team CPD</p>
      <p
        v-if="step===2"
        @click="step=1"
        style="color: blue !important; cursor: pointer"
      >
        {{ "/Course Details"  }}
      </p>
    </div>
    <div class="mt-5 px-5" v-if="step === 1">
      <v-row>
        <v-col v-for="(item, i) in cards" :key="i" cols="3">
          <FlossAcademyStatCard
            :title="item.title"
            :points="item.points"
            :icon="item.icon"
            :total-hours="item.totalHours"
          />
        </v-col>
      </v-row>
    </div>

    <div class="cpd-tabs px-5" v-if="step === 1">
      <!-- Tabs -->
      <v-tabs v-model="tab" class="custom-tabs mt-5" slider-color="primary">
        <v-tab
          v-for="category in categories"
          :key="category.id"
          :value="category.id"
          class="tab-text"
        >
          {{ category.name }}
        </v-tab>
      </v-tabs>

      <!-- Cards Grid -->
      <v-tabs-window v-model="tab">
        <v-tabs-window-item
          v-for="category in categories"
          :key="category.id"
          :value="category.id"
        >
          <v-row class="py-6" align="stretch">
            <v-col
              v-for="(card, index) in filteredCards(category.id)"
              :key="index"
              cols="12"
              sm="6"
              md="3"
            >
              <FlossAcademyCourseCard
                :id="card.id"
                :title="card.title"
                :category-id="card.categoryId"
                :img="card.img"
                :total-time="card.totalTime"
                :is-verified="card.isVerified"
                @showCourse="showCourse"
              />
            </v-col>

            <!-- No cards -->
            <v-col v-if="!filteredCards(category.id).length" cols="12">
              <div class="text-center py-10 text-grey">No cards available</div>
            </v-col>
          </v-row>
        </v-tabs-window-item>
      </v-tabs-window>
    </div>
    <div class="px-5" v-if="step===2">
      <FlossAcademyCourseDetail
      video-url="https://www.w3schools.com/html/mov_bbb.mp4"
      aim="To provide comprehensive understanding of dental hygiene practices."
      :objectives="[
        'Learn correct brushing techniques',
        'Understand gum disease prevention',
        'Apply hygienic practices in daily routines'
      ]"
    />

    </div>
  </div>
</template>
<script setup>
const step = ref(1);
const cards = [
  {
    title: "Required CPD Hours",
    points: 200,
    icon: "https://cdn.lordicon.com/odxsdugo.json",
    totalHours: 12,
  },
  {
    title: "Completed CPD Hours",
    points: 150,
    icon: "https://cdn.lordicon.com/itlfjzxp.json",
    totalHours: 8,
  },
  {
    title: "Remaining CPD Hours",
    points: 100,
    icon: "https://cdn.lordicon.com/amdfceua.json",
    totalHours: 5,
  },
];
const tab = ref(0); // "All" by default (id = 0)

// Categories with ids
const categories = [
  { id: 0, name: "All" },
  { id: 1, name: "Delegatedcc" },
  { id: 2, name: "Dentist Courses" },
  { id: 3, name: "Nurse Courses" },
  { id: 4, name: "Receptionist Courses" },
  { id: 5, name: "Practice Manager Courses" },
];

// Dummy cards with categoryId
const allCards = [
  {
    id: 1,
    title: "Safeguarding Adults and Children Level 1",
    categoryId: 2,
    img: "https://picsum.photos/400/240?random=1",
    totalTime: "2h 30m",
    isVerified: true,
  },
  {
    id: 2,
    title: "Safeguarding Adults and Children Level 2",
    categoryId: 3,
    img: "https://picsum.photos/400/240?random=2",
    totalTime: "1h 45m",
    isVerified: false,
  },
  {
    id: 3,
    title: "Safeguarding Adults and Children Level 3",
    categoryId: 4,
    img: "https://picsum.photos/400/240?random=3",
    totalTime: "3h 10m",
    isVerified: true,
  },
  {
    id: 4,
    title: "Safeguarding Adults and Children Level 4",
    categoryId: 5,
    img: "https://picsum.photos/400/240?random=4",
    totalTime: "4h 00m",
    isVerified: false,
  },
  {
    id: 5,
    title: "Course E",
    categoryId: 1,
    img: "https://picsum.photos/400/240?random=5",
    totalTime: "2h 15m",
    isVerified: true,
  },
];

// Filtering logic
function filteredCards(categoryId) {
  if (categoryId === 0) return allCards;
  return allCards.filter((card) => card.categoryId === categoryId);
}
const showCourse = () => {
  step.value = 2;
};
</script>
<style scoped lang="scss">
.parent {
  background-color: white;
}
.cust-border {
  border-bottom: 1px solid #dbdbdb;
  padding: 17px;
  p {
    font-size: 12px;
    color: #c3c3c3;
  }
}
:deep(.v-breadcrumbs) {
  font-family: "Poppins", sans-serif;
  font-weight: 400;
  font-size: 14px;
}
.tab-text {
  font-family: "Poppins";
  font-weight: 400;
  font-style: "Regular";
  font-size: 14px;
  color: #1e1e1e;
}
.custom-tabs {
  border-bottom: 1px solid #dbdbdb;
}
.custom-tabs .v-tab {
  color: inherit !important;
}
.custom-tabs .v-tab.v-tab--selected {
  font-weight: 500;
}
</style>
