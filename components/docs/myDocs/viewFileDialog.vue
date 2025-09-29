<template>
  <v-dialog v-model="isOpen" max-width="90%" class="rounded-lg">
    <v-card>
      <v-card-title
        class="d-flex align-center justify-space-between"
        style="
          font-family: Poppins;
          font-weight: 600;
          font-size: 16px;
          border-bottom: 1px solid #dbdbdb;
        "
      >
        {{ doc?.name }}
        <v-btn
          icon
          variant="text"
          size="small"
          @click="close"
          style="min-width: unset; color: #737373"
        >
          <v-icon>mdi-close</v-icon>
        </v-btn>
      </v-card-title>

      <div v-if="doc.type === 'editable'" class="pa-5">
        <DocumentEditorContainerComponent
          ref="editor"
          height="500px"
          :serviceUrl="serviceUrl"
          :enableToolbar="true"
          :enableRibbon="true"
        />
      </div>
      <div v-else class="pa-5" style="height: 700px">
        <iframe
          v-if="pdfurl"
          :src="pdfurl"
          width="100%"
          height="100%"
          style="border: none"
        ></iframe>
      </div>

      <!-- Actions -->
      <v-card-actions class="justify-end">
        <v-btn
          v-if="doc.type === 'editable'"
          text
          @click="close"
          style="font-weight: 500; text-transform: none"
        >
          Cancel
        </v-btn>
        <v-btn color="primary" @click="updateFile" flat
          >{{ doc.type === "editable" ? "Save" : "Close" }}
        </v-btn>
      </v-card-actions>
    </v-card>
    <v-overlay
      v-model="isLoading"
      contained
      class="justify-center align-center full-page"
    >
      <div class="loader">
        <lottie-player
          src="/Loader.json"
          background="transparent"
          speed="1"
          style="width: 200px; height: 200px"
          loop
          autoplay
        />
      </div>
    </v-overlay>
  </v-dialog>
</template>

<script setup>
import { registerLicense } from "@syncfusion/ej2-base";
registerLicense(
  "Ngo9BigBOggjHTQxAR8/V1JEaF1cWWhAYVJwWmFZfVtgd19HaVZQR2YuP1ZhSXxWdk1iXn9dcX1UTmlUU0Z9XEI="
);
import pkg from '@syncfusion/ej2-vue-documenteditor';

const { 
  Toolbar, 
  Print, 
  Ribbon, 
  SfdtExport, 
  WordExport, 
  TextExport, 
  Selection, 
  Search, 
  Editor, 
  EditorHistory, 
  OptionsPane, 
  ContextMenu, 
  ImageResizer, 
  HyperlinkDialog, 
  TableDialog, 
  BookmarkDialog, 
  TableOfContentsDialog, 
  PageSetupDialog, 
  StyleDialog, 
  ListDialog, 
  ParagraphDialog, 
  BulletsAndNumberingDialog, 
  FontDialog, 
  TablePropertiesDialog, 
  BordersAndShadingDialog, 
  TableOptionsDialog, 
  CellOptionsDialog, 
  StylesDialog, 
  Comment, 
  DocumentEditorContainerComponent 
} = pkg;

const editor = ref(null);
const pdfurl = ref(null);
const serviceUrl =
  "https://services.syncfusion.com/vue/production/api/documenteditor/";
provide("editor", [
  Toolbar,
  Print,
  Ribbon,
  SfdtExport,
  WordExport,
  TextExport,
  Selection,
  Search,
  Editor,
  EditorHistory,
  OptionsPane,
  ContextMenu,
  ImageResizer,
  HyperlinkDialog,
  TableDialog,
  BookmarkDialog,
  TableOfContentsDialog,
  PageSetupDialog,
  StyleDialog,
  ListDialog,
  ParagraphDialog,
  BulletsAndNumberingDialog,
  FontDialog,
  TablePropertiesDialog,
  BordersAndShadingDialog,
  TableOptionsDialog,
  CellOptionsDialog,
  StylesDialog,
  Comment,
]);
const isLoading = ref(false);
const props = defineProps({
  modelValue: Boolean,
  doc: Object,
});
const docStore = useDocStore();

const emit = defineEmits(["update:modelValue", "onUpdate"]);

const isOpen = ref(props.modelValue);

// Sync prop with local state
watch(
  () => props.modelValue,
  async (val) => {
    isLoading.value = true;
    isOpen.value = val;
    if (props.doc.type === "editable") {
      const response = await fetch(`/api/docs/view`, {
        method: "Post",
        body: JSON.stringify({ id: props.doc.id }),
      });
      const blob = await response.blob();
      const formData = new FormData();
      formData.append("files", blob, "sample.docx");
      // Send to Syncfusion service to convert into SFDT
      const res = await fetch(serviceUrl + "Import", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      editor.value.ej2Instances.documentEditor.open(data);
      isLoading.value = false;
    } else {
      const config = useRuntimeConfig();
      pdfurl.value = `${config.public.BASE_URL}${props.doc.link}`;
      isLoading.value = false;
    }
  }
);
watch(isOpen, (val) => emit("update:modelValue", val));

const close = () => {
  isOpen.value = false;
};

const updateFile = () => {
  if (props.doc.type === "readonly") {
    close();
    return;
  }
  const docEditor = editor.value.ej2Instances.documentEditor;
  const exported = docEditor.saveAsBlob("Docx");
  exported.then(async (blob) => {
    const formData = new FormData();
    formData.append("id", props.doc.id);
    formData.append("file", blob, `sample.docx`);
    docStore.updateDocument(formData).then((res) => {
      if (res.code === 0) {
        close();
      }
    });
  });
};
</script>
<style scoped>
.input-bordered :deep(.v-field) {
  border: 1px solid #dfdfdf !important;
  border-radius: 8px !important;
  background-color: white !important;
  min-height: 40px;
  font-size: 14px;
  font-family: "Poppins", sans-serif;
}
</style>
