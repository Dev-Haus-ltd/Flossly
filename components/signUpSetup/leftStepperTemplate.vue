<template>
  <div class="card rounded-xl relative">
    <!-- Centered Content Box -->
    <div class="content-box">
      <h1 class="banner-heading">
        A few clicks away from tidying your dental practice.
      </h1>

      <div class="step-container">
        <div class="step">
          <div class="icon-circle">
            <img
              src="@/assets/logos/signupSetupScreen/leftStepper/clinicsetup.svg"
              alt="Step 1 Icon"
            />
          </div>
          <div class="text">
            <div class="step-title">Step 1</div>
            <div class="step-subtitle">Clinic Setup</div>
          </div>
        </div>

        <div class="step">
          <div class="icon-circle">
            <img
              src="@/assets/logos/signupSetupScreen/leftStepper/teammember.svg"
              alt="Step 2 Icon"
            />
          </div>
          <div class="text">
            <div class="step-title">Step 2</div>
            <div class="step-subtitle">Add Team Members</div>
          </div>
        </div>

        <div class="step">
          <div class="icon-circle">
            <img
              src="@/assets/logos/signupSetupScreen/leftStepper/pricing.svg"
              alt="Step 3 Icon"
            />
          </div>
          <div class="text">
            <div class="step-title">Step 3</div>
            <div class="step-subtitle">Pricing</div>
          </div>
        </div>

        <div class="step">
          <div class="icon-circle">
            <img
              src="@/assets/logos/signupSetupScreen/leftStepper/dashboard.svg"
              alt="Step 4 Icon"
            />
          </div>
          <div class="text">
            <div class="step-title">Step 4</div>
            <div class="step-subtitle">Dashboard Tour</div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.card {
  background-image: url("/assets/images/signupCard.svg");
  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;
  color: #fff;
  width: 90%;
  height: 96vh;

  /* Center the content-box */
  display: flex;
  justify-content: center;
  align-items: center;
}

.content-box {
  border: 1px solid #ffffff;
  background-color: rgba(255, 255, 255, 0.1);
  padding: 2rem 3rem;
  border-radius: 12px;
  max-width: 550px;
  width: 100%;

  display: flex;
  flex-direction: column;
  align-items: flex-start; /* left-align content */
  text-align: left;
}

.banner-heading {
  font-family: "Poppins";
  font-weight: 600;
  font-size: 44px;
  margin-bottom: 2rem;
}

.step-container {
  display: flex;
  flex-direction: column;
  gap: 2rem;
  color: white;
  width: 100%;
}

.step {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.icon-circle {
  width: 80px;
  height: 80px;
  min-width: 80px;
  border: 2px solid white;
  border-radius: 50%;
  display: flex;
  justify-content: center;
  align-items: center;
  background-color: rgba(255, 255, 255, 0.1);
}

.icon-circle img {
  width: 30px;
  height: 30px;
  object-fit: contain;
  filter: brightness(0) invert(1);
}

.text .step-title {
  font-size: 0.8rem;
  opacity: 0.7;
}

.text .step-subtitle {
  font-size: 1rem;
  font-weight: 500;
}
</style>
