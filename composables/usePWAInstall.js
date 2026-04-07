/**
 * Composable for PWA install prompt handling.
 *
 * Usage:
 *   const { canInstall, install, isInstalled } = usePWAInstall()
 *
 * - canInstall: true when the browser is ready to prompt for install
 * - isInstalled: true when running as a standalone PWA (already installed)
 * - install(): triggers the native install prompt
 */
export function usePWAInstall() {
  const deferredPrompt = ref(null);
  const canInstall = ref(false);

  const isInstalled = computed(() => {
    if (typeof window === "undefined") return false;
    return (
      window.matchMedia("(display-mode: standalone)").matches ||
      window.navigator.standalone === true
    );
  });

  const install = async () => {
    if (!deferredPrompt.value) return false;
    deferredPrompt.value.prompt();
    const { outcome } = await deferredPrompt.value.userChoice;
    deferredPrompt.value = null;
    canInstall.value = false;
    return outcome === "accepted";
  };

  onMounted(() => {
    if (isInstalled.value) return;

    window.addEventListener("beforeinstallprompt", (e) => {
      e.preventDefault();
      deferredPrompt.value = e;
      canInstall.value = true;
    });

    window.addEventListener("appinstalled", () => {
      deferredPrompt.value = null;
      canInstall.value = false;
    });
  });

  return { canInstall, isInstalled, install };
}
