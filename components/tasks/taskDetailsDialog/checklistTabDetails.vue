<template>
  <div class="px-7 py-3">
    <div class="d-flex align-center justify-space-between my-4">
      <h3 class="heading-text">E-Form</h3>
      <v-btn flat color="primary" variant="outlined" @click="downloadChecklist"
        >download checklist</v-btn
      >
    </div>
    <div ref="checklistRef">
      <v-card
        v-for="(item, index) in checklist"
        :key="index"
        class="pa-4 rounded-lg border-card mb-4"
        elevation="0"
        style="border: 1px solid #dbdbdb"
      >
        <TasksTaskDetailsDialogTaskChecklist
          :item="item"
          :index="index"
          @deleteItem="deleteItem"
        />
      </v-card>
    </div>

    <v-btn
      @click="addNewChecklist"
      class="w-100 justify-center add-qs-btn"
      variant="outlined"
      flat
    >
      <v-icon
        start
        class="me-2"
        color="primary"
        style="border: 1px solid currentColor; border-radius: 50%; padding: 4px"
      >
        mdi-plus
      </v-icon>
      Add More Questions
    </v-btn>
  </div>
</template>

<script setup>
const { $jsPDF } = useNuxtApp();
import html2canvas from "html2canvas";
const { checklist, userTaskId } = defineProps({
  checklist: Array,
  userTaskId: Number,
});
const checklistRef = ref(null);
const taskStore = useTaskStore();
const mainStore = useMainStore();
const deleteItem = (itemToDelete) => {
  taskStore.deleteChecklist({ id: itemToDelete.id }).then((res) => {
    if (res.code === 0) {
      mainStore.setSnackbar({
        title: "Checklist deleted successfully",
        type: "success",
      });
      const index = checklist.findIndex((item) => item.id === itemToDelete.id);
      if (index !== -1) {
        checklist.splice(index, 1);
      }
    }
  });
};
const addNewChecklist = () => {
  checklist.push({
    question: "",
    category: "",
    userTaskId,
    fieldOneTitle: "",
    fieldTwoTitle: "",
    showDate: false,
    showTime: false,
    showRadio: false,
    radioValue: "N/A",
    timeValue: null,
    dateValue: null,
  });
};
const downloadChecklist = async () => {
  const element = checklistRef.value;
  if (!element) return;

  const canvas = await html2canvas(element, { scale: 2 });
  const imgData = canvas.toDataURL("image/png");

  const pdf = new $jsPDF("p", "mm", "a4");
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();

  // padding in mm
  const margin = 10;

  const availableWidth = pageWidth - 2 * margin;
  const imgHeight = (canvas.height * availableWidth) / canvas.width;

  // if the height exceeds page height, you’d need pagination handling (optional)
  pdf.addImage(imgData, "PNG", margin, margin, availableWidth, imgHeight);

  pdf.save("checklist.pdf");
};
</script>
<style scoped>
.add-qs-btn {
  border: 1px solid #dfdfdf;
  height: 52px;
}
</style>
