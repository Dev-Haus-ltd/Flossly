<template>
    <v-dialog :model-value="props.modelValue" max-width="95%" persistent >
      <v-card class="d-flex flex-column rounded-xl" style="min-height: 400px; overflow: hidden;" >
        <!-- Header -->
        <div class="pa-4 d-flex justify-space-between align-center bg-white">
          <h3 class="dialog-title">Flossly Tool Box</h3>
          <v-btn flat icon size="32" @click="$emit('close')">
            <v-icon size="20">mdi-close</v-icon>
          </v-btn>
        </div>
     <div style="height: 100%; overflow: auto;">

         <!-- Content with background image -->
         <div class="dialog-content">
           <div class="overlay-content text-center">
             <h2 class="dialog-subtitle">
               Explore powerful apps built for your needs
             </h2>
             <v-text-field
  v-model="search"
  placeholder="Search"
  density="comfortable"
  hide-details
  class="input-bordered mt-4 mx-auto white-placeholder"
  width="638"
  variant="solo"
  flat
>
  <!-- use slot instead of prepend-inner-icon prop -->
  <template #prepend-inner>
    <!-- set color/style directly so scoped css can't block it -->
    <v-icon size="20" color="white" >mdi-magnify</v-icon>
  </template>
</v-text-field>
           </div>
         </div>
   
         <!-- Cards Section -->
         <div class="pa-6 mt-6">
           <v-row align="stretch">
             <v-col
               v-for="(app, index) in filteredApps"
               :key="index" 
               cols="12"
               sm="6"
               md="3"
               class="d-flex"
             >
               <DashBoardFlosslyAppCard
                 :title="app.title"
                 :img="app.img"
                 :details="app.details"
                 :downloads="app.downloads"
               />
             </v-col>
           </v-row>
         </div>
     </div>
      </v-card>
    </v-dialog>
  </template>
  
  <script setup>
import labImg from "@/assets/icons/dashBoard/toolBox/lab.svg"
import stockImg from "@/assets/icons/dashBoard/toolBox/stock.svg"
import twoothMatchImg from "@/assets/icons/dashBoard/toolBox/twooth.svg"
import payrollImg from "@/assets/icons/dashBoard/toolBox/payroll.svg"
import invoiceImg from "@/assets/icons/dashBoard/toolBox/invoice.svg"
import cpdCoursesImg from "@/assets/icons/dashBoard/toolBox/cpd.svg"
import patientPortalImg from "@/assets/icons/dashBoard/toolBox/patient.svg"
import clockInImg from "@/assets/icons/dashBoard/toolBox/clock.svg"
import emailMarketingImg from "@/assets/icons/dashBoard/toolBox/email.svg"
import socialMediaImg from "@/assets/icons/dashBoard/toolBox/social.svg"
import teamChatImg from "@/assets/icons/dashBoard/toolBox/team.svg"


  const props = defineProps({
    modelValue: Boolean,
  });
  const emit = defineEmits(["close"]);
  
  const search = ref("");
  const apps = ref([]);
  
  onMounted(() => {
    // Mock data, replace with API call later
    apps.value = [
      {
        title: "Lab management",
        img: labImg,
        details: "A smart lab management app that streamlines case tracking, communication, and workflow for dental clinics and labs",
        downloads: "540",
      },
      {
        title: "Stock management",
        img: stockImg,
        details: "An intuitive stock management app that helps dental clinics track, control, and optimize their inventory with ease",
        downloads: "890",
      },
      {
        title: "Twooth match",
        img: twoothMatchImg,
        details: "An AI-powered recruitment app that intelligently matches candidates with the right jobs for faster and smarter hiring.",
        downloads: "650",
      },
      {
        title: "Payroll management",
        img: payrollImg,
        details: "A payroll management app that automates salary calculations, compliance, and payments for hassle-free staff management",
        downloads: "650",
      },
      {
        title: "Invoice management",
        img: invoiceImg,
        details: "An invoice management app that simplifies billing, payment tracking, and reporting for smoother financial operations",
        downloads: "650",
      },
      {
        title: "CPD Courses",
        img: cpdCoursesImg,
        details: "A CPD courses app that helps dental professionals access, track, and manage continuing education with ease",
        downloads: "650",
      },
      {
        title: "Patient Portal",
        img: patientPortalImg,
        details: "A patient portal app that enables secure access to records, appointments, and communication for improved dental care engagement",
        downloads: "650",
      },
      {
        title: "Clock In and Clock Out",
        img: clockInImg,
        details: "A staff punctuality app that tracks attendance, work hours, and timeliness to boost accountability and efficiency",
        downloads: "650",
      },
      {
        title: "Email Marketing Campaign",
        img: emailMarketingImg,
        details: "An email marketing app that empowers dental clinics to create, automate, and track campaigns for better patient engagement",
        downloads: "650",
      },
      {
        title: "Social Media Scheduling",
        img: socialMediaImg,
        details: "A social media scheduler app that streamlines planning, automating, and tracking posts to boost online presence effortlessly",
        downloads: "650",
      },
      {
        title: "Team Chat & Social",
        img: teamChatImg,
        details: "A team chat app that replaces WhatsApp with secure, professional messaging and group collaboration for clinics",
        downloads: "650",
      },
    
    ];
  });
  const filteredApps = computed(() => {
  if (!search.value) return apps.value;
  return apps.value.filter(app =>
    app.title.toLowerCase().includes(search.value.toLowerCase()) ||
    app.details.toLowerCase().includes(search.value.toLowerCase())
  );
});
  </script>
  
  <style scoped>
  .dialog-title {
    font-weight: 600;
    font-size: 18px;
    margin: 0;
  }
  
  .dialog-content {
    background: url('@/assets/images/dashboard/toolbox-bg.svg') no-repeat center center;
    background-size: cover;
    height: 220px;
    width: 100%;
    position: relative;
    display: flex;
    justify-content: center;
    align-items: center;
  }
  
  .overlay-content {
    display: flex;
    flex-direction: column;
    align-items: center;
  }
  
  .dialog-subtitle {
    font-weight: 700;
    font-size: 24px;
    color: #fff;
    margin-bottom: 16px;
  }
  
  .input-bordered :deep(.v-field) {
    border: 1px solid #ffffff !important;
    border-radius: 8px !important;
    background-color: transparent !important;
    min-height: 40px;
    font-size: 14px;
    color: white !important; /* text color */
  }
  
  .input-bordered :deep(input::placeholder) {
    color: white !important;
    opacity: 1;
  }
  .input-bordered :deep(.v-field__prepend-inner .v-icon) {
    color: white !important;
}
  </style>
  