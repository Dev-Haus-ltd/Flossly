# Project: Flossly MVP

## Project Overview

This is a web application built with Nuxt 3, Vue 3, and Vuetify 3. Based on the file structure and dependencies, it appears to be a Software as a Service (SaaS) application with features including:

*   **Customer Relationship Management (CRM):**
    *   Manages leads with statuses (New, Converted, Contacted, Lost).
    *   Integrates with Meta (Facebook) to automatically fetch leads from lead generation forms.
    *   Allows for manual lead entry and assignment to team members.
    *   Provides filtering and search capabilities for leads.
    *   Includes a dashboard with lead statistics.
*   **Task Management:**
    *   Tracks tasks with statuses (Total, Completed, In Progress, Upcoming).
    *   Provides an overview of personal and team-based task statistics.
*   **Subscription Services:** The application is set up to use Stripe for subscription billing.
*   **User Authentication:** User authentication is handled via JWT (JSON Web Tokens).

### Architecture

*   **Frontend:** The frontend is built with Nuxt.js and Vue.js. The UI is implemented using the Vuetify 3 component library. The application follows a component-based architecture, with reusable components found in the `/components` directory.
*   **Backend:** The backend is built using Nuxt.js server routes, located in the `/server` directory. It appears to use a Postgres database with the Sequelize ORM.
*   **State Management:** State management is handled by Pinia. Store modules for different features (e.g., `crm.js`, `tasks.js`, `auth.js`) are located in the `/stores` directory.
*   **Styling:** The project uses SASS with Vuetify.

## Directory Structure

*   `/assets`: Contains static assets like CSS, fonts, images, and logos.
*   `/components`: Contains reusable Vue.js components, organized by feature (e.g., `crm`, `tasks`).
*   `/composables`: Contains reusable Vue.js composables (e.g., `useAuthCheck`).
*   `/layouts`: Contains the main application layouts.
*   `/pages`: Contains the application's pages, which are mapped to routes.
*   `/server`: Contains the backend API, with subdirectories for `api`, `controllers`, `models`, and `utils`.
*   `/services`: Contains services that wrap the API calls.
*   `/stores`: Contains the Pinia state management stores.

## Building and Running

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Environment Variables

The application requires several environment variables to be set. These are defined in `nuxt.config.ts`. Create a `.env` file in the root of the project and add the following variables:

```
BASE_URL=http://localhost:3000
CHATBOT_URL=
JWT_SECRET=
STRIPE_PK=
STRIPE_SK=
STRIPE_WS=
META_APP_ID=
META_APP_SECRET=
META_REDIRECT_URI=
META_VERIFY_TOKEN=
MAX_FILE_SIZE_FOR_TASK_SHEET=
GOOGLE_APPLICATION_CREDENTIALS=
GITHUB_TOKEN=
```

### 3. Run the Development Server

To start the development server, run the following command. The application will be available at `http://localhost:3000`.

```bash
npm run dev
```

### 4. Build for Production

To build the application for production, use the following command:

```bash
npm run build
```

### 5. Preview Production Build

To preview the production build locally, run:

```bash
npm run preview
```

## Development Conventions

*   **Coding Style:** While no specific linter is enforced in the `package.json`, the code is written in TypeScript and follows standard Vue.js and Nuxt.js conventions.
*   **API:** The backend API is located in the `/server` directory. API calls from the frontend are wrapped in services located in the `/services` directory.
*   **State Management:** Pinia is used for state management. Feature-specific stores (e.g., `useCrmStore`, `useTaskStore`) are used to manage application state.
*   **Component-Based Architecture:** The application is built with a component-based architecture. Feature-specific components are organized into subdirectories within the `/components` directory.
*   **Testing:** There are no testing scripts configured in `package.json`.