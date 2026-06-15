<template>
  <div>
    <div id="swagger-ui" />
  </div>
</template>

<script setup>
definePageMeta({ layout: false })

useHead({
  title: 'Flossly API Docs',
  link: [
    {
      rel: 'stylesheet',
      href: 'https://unpkg.com/swagger-ui-dist@5/swagger-ui.css',
    },
  ],
  script: [
    {
      src: 'https://unpkg.com/swagger-ui-dist@5/swagger-ui-bundle.js',
      body: true,
      defer: false,
    },
  ],
})

onMounted(() => {
  const init = () => {
    if (!window.SwaggerUIBundle) {
      setTimeout(init, 150)
      return
    }
    window.SwaggerUIBundle({
      url: '/api/openapi-spec',
      dom_id: '#swagger-ui',
      deepLinking: true,
      presets: [
        window.SwaggerUIBundle.presets.apis,
        window.SwaggerUIBundle.SwaggerUIStandalonePreset,
      ],
      plugins: [window.SwaggerUIBundle.plugins.DownloadUrl],
      layout: 'BaseLayout',
      tryItOutEnabled: true,
      requestInterceptor: (req) => {
        const token = useCookie('accessToken').value
        if (token) req.headers['Authorization'] = `Bearer ${token}`
        return req
      },
    })
  }
  init()
})
</script>

<style>
body {
  margin: 0;
}
#swagger-ui .topbar {
  background-color: #0061fb;
}
#swagger-ui .topbar .download-url-wrapper .select-label select,
#swagger-ui .topbar .download-url-wrapper input {
  border: 2px solid rgba(255, 255, 255, 0.5);
}
</style>
