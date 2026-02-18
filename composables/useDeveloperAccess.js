import { useAuthStore } from '@/stores/auth';

// Developer emails whitelist - centralized configuration
export const DEVELOPER_EMAILS = [
  'info@dev-haus.co.uk',
  'newadmin@yopmail.com',

  // Add more developer emails here
];

export const useDeveloperAccess = () => {
  const authStore = useAuthStore();

  const isDeveloper = computed(() => {
    return authStore.getIsDeveloper;
  });

  const checkDeveloperAccess = (redirectPath = '/') => {
    if (!isDeveloper.value) {
      const router = useRouter();
      router.push(redirectPath);
      return false;
    }
    return true;
  };

  return {
    isDeveloper,
    checkDeveloperAccess,
    DEVELOPER_EMAILS
  };
};
