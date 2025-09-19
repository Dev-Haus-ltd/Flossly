<template>
  <div class="px-7 py-3">
    <div class="d-flex align-center justify-space-between my-4">
      <h3 class="heading-text">E-Form</h3>
      <v-btn v-if="checklist?.length" prepend-icon="mdi-download" flat color="primary" variant="outlined" @click="downloadChecklist"
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
const { checklist, userTaskId , title} = defineProps({
  checklist: Array,
  userTaskId: Number,
  title:String
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
  if (!element || !checklist.length) return;

  // clone the element
  const clone = element.cloneNode(true);

  // hide buttons inside the clone
  clone.querySelectorAll(".action-btn").forEach((el) => (el.style.display = "none"));

  // temporary container offscreen
  const tempContainer = document.createElement("div");
  tempContainer.style.position = "fixed";
  tempContainer.style.left = "-9999px";
  tempContainer.style.top = "0";
  tempContainer.style.width = `${element.offsetWidth}px`; // keep width
  tempContainer.appendChild(clone);
  document.body.appendChild(tempContainer);

  try {
    const canvas = await html2canvas(clone, { scale: 2 });
    const imgData = canvas.toDataURL("image/png");

    const pdf = new $jsPDF("p", "mm", "a4");

    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    const margin = 10;
    const availableWidth = pageWidth - 2 * margin;
    const imgHeight = (canvas.height * availableWidth) / canvas.width;

    // add title (centered)
    pdf.setFontSize(16);
    pdf.text(`${title}-checklist`, pageWidth / 2, 15, { align: "center" });
    pdf.setFontSize(12);

    let heightLeft = imgHeight;
    let position = 25; // start lower so it doesn’t overlap the title

    while (heightLeft > 0) {
      pdf.addImage(imgData, "PNG", margin, position, availableWidth, imgHeight);
      heightLeft -= pageHeight - 2 * margin;
      if (heightLeft > 0) {
        pdf.addPage();
        position = margin;
      }
    }

    pdf.save(`${title}-checklist.pdf`);
  } catch (err) {
    console.error("PDF generation failed:", err);
  } finally {
    // clean up
    document.body.removeChild(tempContainer);
  }
};

</script>
<style scoped>
.add-qs-btn {
  border: 1px solid #dfdfdf;
  height: 52px;
}
</style>
