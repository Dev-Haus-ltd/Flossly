export default defineEventHandler(() => {
  return {
    ok: true,
    hasIo: Boolean(globalThis.__flossly_io__),
  };
});
