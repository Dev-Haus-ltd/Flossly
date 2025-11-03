// composables/useAuthCheck.js
export const useAuthCheck = () => {
  const isCheckingAuth = useState('authCheckInProgress', () => true);
  const hasCheckedAuth = useState('authCheckComplete', () => false);

  const startAuthCheck = () => {
    isCheckingAuth.value = true;
    hasCheckedAuth.value = false;
  };

  const completeAuthCheck = () => {
    isCheckingAuth.value = false;
    hasCheckedAuth.value = true;
  };

  return {
    isCheckingAuth,
    hasCheckedAuth,
    startAuthCheck,
    completeAuthCheck
  };
};

