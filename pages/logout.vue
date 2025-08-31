<script setup>
definePageMeta({
  layout: "default",
});
const token = useCookie("accessToken");
  const router = useRouter()

token.value = null;

  const savedRoute = localStorage.getItem("route");
   if(savedRoute==="forgetpassword"){
    router.push({ name: savedRoute, params: { step: 2 }});
  } else {
    router.push("/login");
  }

</script>
