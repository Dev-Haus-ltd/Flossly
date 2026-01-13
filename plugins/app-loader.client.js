export default defineNuxtPlugin(() => {
  if (process.client) {
    // Inject loader HTML into the body immediately, before app content
    const body = document.body;
    if (body && !document.getElementById('app-loader')) {
      // Create loader container
      const loaderHTML = `
        <div id="app-loader">
          <div id="loader-container"></div>
        </div>
      `;
      body.insertAdjacentHTML('afterbegin', loaderHTML);
      
      // Load and inject lottie-player
      const container = document.getElementById('loader-container');
      
      // Function to inject lottie player
      const injectLottiePlayer = () => {
        if (container && customElements.get('lottie-player')) {
          const player = document.createElement('lottie-player');
          player.setAttribute('src', '/FlossslyLogoBlue.json');
          player.setAttribute('background', 'transparent');
          player.setAttribute('speed', '1');
          player.setAttribute('loop', '');
          player.setAttribute('autoplay', '');
          player.style.width = '200px';
          player.style.height = '200px';
          container.appendChild(player);
        } else {
          // Retry using requestAnimationFrame for smooth checking
          requestAnimationFrame(injectLottiePlayer);
        }
      };
      
      // Start trying to inject immediately
      injectLottiePlayer();
    }
  }
});
