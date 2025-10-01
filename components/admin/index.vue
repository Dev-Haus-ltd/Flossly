<template>
    <div class="bg-white">

        <v-container>
          <h1 class="mb-4">Admin</h1>
      
          <v-row>
            <v-col
              v-for="(item, index) in adminItems"
              :key="index"
              cols="12"
              md="2"
              class="flossly-col"
            >
              <DashBoardProductCard
                :title="item.title"
                :img="item.img"
                :colors="item.colors"
                :uid="index"
                @handle-click="showDialog"
              />
            </v-col>
          </v-row>
        </v-container>
        <DocsMyDocsAddFileDialog
      v-model="showAddFileDialog"
      :foldersList="foldersList"
      :folder="selectedFolder"
      :isSystemDocs="true"
    />
    </div>
  </template>
  
  <script setup>
  const showAddFileDialog=ref(false);
  const docStore= useDocStore();
const selectedFolder = ref(null);
const foldersList=ref([])
const adminItems = ref([
  {
    title: "Bulk upload documents",
    img: "https://cdn.lordicon.com/hbeigkvk.json", // replace with Document Upload – Outline JSON or Lottie URL
    // maybe use the “wired/outline” version: e.g. a link from lordicon.com icons
    colors: "outline:#121331",
  },
  {
    title: "Bulk upload tasks",
    img: "https://cdn.lordicon.com/qtdtmioh.json", // replace with To-Do List – Outline icon
    colors: "outline:#121331",
  },
]);
onMounted(()=>{
    getFolders()
})
const getFolders = () => {
  docStore
    .getSystemFolders()
    .then((res) => {
      if (res.code === 0) {
        foldersList.value = res.data;
      } else {
        //snack
      }
    })
    .catch((err) => {
      //snack
    });
};
  const showDialog=(uid)=>{
    if (uid===0){
        showAddFileDialog.value=true
    } else{

    }
  }
  </script>
  
  <style scoped>
  .flossly-col {
    display: flex;
    justify-content: center;
  }
  </style>
  