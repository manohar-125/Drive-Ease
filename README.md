# Drive-Ease

> **Official Repository:** [Drive-Ease on GitHub](https://github.com/manohar-125/Drive-Ease)

Drive-Ease is a comprehensive MERN (MongoDB, Express.js, React, Node.js) web platform for managing the driving license process, including application, learner/practical/road tests, candidate verification, admin/supervisor review, PDF reporting, and more. The system is designed to digitalize and automate the driving license workflow for both applicants and authorities.

---

## Table of Contents

- [Project Overview](#project-overview)
- [Monorepo Structure](#monorepo-structure)
  - [Backend](#backend)
  - [Frontend](#frontend)
  - [Top-level Files](#top-level-files)
- [Detailed Directory & File Reference](#detailed-directory--file-reference)
- [Environment Setup](#environment-setup)
  - [Backend Setup](#backend-setup)
  - [Frontend Setup](#frontend-setup)
- [Project Features](#project-features)
- [Tech Stack](#tech-stack)
- [Contributing](#contributing)
- [License](#license)
---

## Project Overview

Drive-Ease digitizes every aspect of the driving license process:
- **Applicants** register, submit documents, take monitored learner and practical (road) tests, and track progress.
- **Supervisors** verify candidates, upload results, and rate each road test category.
- **Admins** handle high-level management, candidate status, and PDF/license generation.

The project supports authentication, document upload, proctored tests, automatic and manual assessments, and PDF report generation.

---

## Monorepo Structure

```
Drive-Ease/
├── backend/      # All backend APIs, models, services, and configs
├── frontend/     # React-based client-side code and static assets
├── .gitignore    # Top-level git ignores for both front & back
```

### Backend

- Environment example: `.env.example`
- Main entrypoint: `server.js`
- Data, routes, models, services, uploads.
- Test questions: `data/learnerTestQuestions.json`
- Package files: `package.json`, `package-lock.json`

### Frontend

- `src/`: React components, styles, routing.
- `public/`: Static assets, HTML templates.
- `package.json`, `package-lock.json`

---

## Detailed Directory & File Reference

### Top-level files:
- [`/.gitignore`](https://github.com/manohar-125/Drive-Ease/blob/main/.gitignore)  
  *Git ignore patterns for the project.*

### `backend/`

| File/Folder         | Purpose |
|---------------------|---------|
| [.env.example](https://github.com/manohar-125/Drive-Ease/blob/main/backend/.env.example)   | Sample environment variables (secrets not included) |
| [server.js](https://github.com/manohar-125/Drive-Ease/blob/main/backend/server.js) | Main Express server: sets up API, middleware, connects to MongoDB, configures routes/services. |
| [package.json](https://github.com/manohar-125/Drive-Ease/blob/main/backend/package.json) | Backend npm dependencies and scripts. |
| [package-lock.json](https://github.com/manohar-125/Drive-Ease/blob/main/backend/package-lock.json) | Exact tree of backend dependencies.|
| `/data/`            | Contains question database for learner's test (e.g., `learnerTestQuestions.json`). |
| `/models/`          | All Mongoose (MongoDB) data models for users, applications, tests, etc. |
| `/routes/`          | REST route handlers for all resources, split by concern (e.g., users, applications, supervisors). |
| `/services/`        | Business logic and helpers for handling test evaluation, PDF generation, authentication, etc. |
| `/uploads/`         | Uploaded document/image storage (usually .gitignored). |

**Sample Backend Features Inferred:**
- REST API for all front-end calls
- Separate endpoints for user, admin, supervisor actions
- JWT authentication & middleware
- PDFKit-based generation of application summaries/results
- File uploads (using Multer or similar)
- Access controls for sensitive endpoints
- Complex validation using `validator`, `bcrypt`, JWTs, and MongoDB

### `frontend/`

| File/Folder                | Purpose |
|----------------------------|---------|
| [package.json](https://github.com/manohar-125/Drive-Ease/blob/main/frontend/package.json) | Frontend npm dependencies and scripts.|
| [package-lock.json](https://github.com/manohar-125/Drive-Ease/blob/main/frontend/package-lock.json) | Exact tree of frontend dependencies.|
| `/public/`                 | Static resources and HTML root template for React.|
| `/src/`                    | All main app code (ReactJS). Likely structure inside:<br>• components/ (dashboard, test UIs, file upload, navigation, alerts)<br>• App.js, index.js, routing setup|

#### Example Component/Feature Details (from code):
- `LearnerTest.js`: Handles the live learner’s test, displays question navigator, handles answer state, manages image-based questions, interacts with camera for proctoring, timer, and auto-submit.
- `RoadTestEvaluation.js`: For supervisor/admin to rate candidates in categories like "Vehicle Control", "Lane Discipline", "Parking Skills", etc., with rating storage and validation.
- `ApplicationDashboard.css`: CSS for applicant workflow progression, alerts, and stepper progress components.
- Many other sub-components for registration, user dashboard, supervisor review, and admin interface.

**Frontend Features:**
- Full SPA experience via React-Router and components
- Handles authentication, test-taking, progress steps, alerts
- Camera feed capture + proctoring UI
- Displays PDF links/results
- Responsive UI styling in CSS

---

## Environment Setup

### Backend Setup

1. Clone the repository:
   ```bash
   git clone https://github.com/manohar-125/Drive-Ease.git
   cd Drive-Ease/backend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Copy the env file and configure:
   ```bash
   cp .env.example .env
   # Fill in the environment variables (MongoDB URI, JWT secret, etc.)
   ```
4. Run the backend server:
   ```bash
   npm run dev   # Uses nodemon
   # or
   npm start
   ```
   The backend runs by default on `http://localhost:5001`.

### Frontend Setup

1. In a new terminal, start the frontend:
   ```bash
   cd ../frontend
   npm install
   npm start
   ```
   The app will run at `http://localhost:3000` by default.

---

## Project Features

**Applicant:**
- Account registration/login with password hashing.
- Step-by-step license application process.
- Document upload (ID proof, address, etc.).
- Live, proctored learner’s license test with image-based and MCQ questions.
- Real-time question navigation, auto-save of answers, live camera monitoring.
- Test violation detection (multiple warnings for improper test behavior).
- Road test scheduling and booking.
- Download application summary & test results as PDFs.

**Supervisor/Admin:**
- User verification workflow before tests.
- Direct API to fetch candidate data, applications, statuses.
- Road test evaluation UI (rate multiple aspects per candidate, per test).
- Authorization to approve/reject, update statuses.
- Admin dashboard for analytics, candidate tracking.

**Common/Global:**
- REST API with strong separation by concern.
- Comprehensive CSS-styled, React-based front-end.
- Role-based route protection on both front and back ends.
- PDF generation for reporting and documentation using PDFKit.
- MongoDB for persistent storage of all users, test results, statuses.
- Modular code for routes, models, and services for ease of maintenance and extension.

---

## Tech Stack

| Layer         | Technology                                      |
|---------------|-------------------------------------------------|
| Frontend      | ReactJS, CSS, HTML                              |
| Backend       | Node.js, Express.js, MongoDB, JWT, Multer, PDFKit|
| Database      | MongoDB (Mongoose ODM)                          |
| Authentication| JSON Web Tokens (JWT), bcrypt password hashing  |
| Uploads       | Multer for server-side file/image upload        |
| Styling       | Responsive CSS                                  |
| Testing       | (Add Jest/cypress descriptions if used)         |

---

## Contributing

1. Fork the repository, clone to local machine.
2. Create a new branch: `git checkout -b feature/YourFeature`.
3. Make your changes/commits. Provide clear commit messages.
4. Push your branch: `git push origin feature/YourFeature`.
5. Submit a pull request and describe your modifications.

---

## License

Distributed under the MIT License (see [LICENSE](LICENSE), if present).

---

## Additional Notes & Best Practices

- Always use environment variables for production secrets (never commit actual secrets).
- Data stored in `uploads/` and sensitive configs should not be versioned (add to `.gitignore`).
- The app is modular; each backend route/service and each frontend component is single-responsibility for maintainable scaling.
- For full function/endpoint documentation, refer to inline code comments and the appropriate folder.

---

**If you have usage questions, feature requests, or bug reports, please open an [issue](https://github.com/manohar-125/Drive-Ease/issues).**
