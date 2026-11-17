# 📋 PC-CRAFT Sprint Plan: Core Features

## 🎯 This Week's Focus: Core Feature Development

### 👥 Team Feature Assignments

| Feature | Assignee | Scope | Associated Files | UI Wireframe Reference |
| :--- | :--- | :--- | :--- | :--- |
| **Main & Login Page** | **Blando** | Frontend & Backend | `client/index.html`<br>`client/pages/login.html`<br>`client/pages/register.html` | `PC-CRAFT · Main page.png`<br>`PC-CRAFT · Login page.png` |
| **Learning Modules** | **Tortillas** | Frontend & Backend | `client/pages/modules.html`<br>`server/routes/module.routes.js`<br>`server/controllers/module.controller.js` | `PC-CRAFT · Module learning.png` |
| **Knowledge Quiz** | **Pulusan** | Frontend & Backend | `client/pages/quiz.html`<br>`server/routes/quiz.routes.js`<br>`server/controllers/quiz.controller.js` | `PC-CRAFT · Knowledge quiz.png` |
| **Learner Progress** | **Escandor** | Frontend & Backend | `client/pages/progress.html`<br>`client/pages/dashboard.html`<br>`server/routes/progress.routes.js` | `PC-CRAFT · Learner dashboard.png` |
| **3D Simulation (Assembly)** | **Blando** | **Frontend Only** | `client/pages/simulation.html`<br>`client/js/simulation/scene.js`<br>`client/js/simulation/assembly.js` | `PC-CRAFT · Assembly lab.png`<br>`PC-CRAFT · Troubleshooting lab.png` |

---

## 🧭 Project Navigation

* **Frontend (Client)**: Located in `client/`
  * Pages: `client/pages/`
  * Styling: `client/css/styles.css`
  * JavaScript logic: `client/js/`
* **Backend (Server)**: Located in `server/`
  * API Routes: `server/routes/`
  * Controllers: `server/controllers/`
  * Data Models: `server/models/`
  * Database Config: `server/config/db.js`
* **Database**: Located in `database/` (`schema.sql`, `migrations/`, `seeds/`)

---

## 🎨 UI Samples & Asset References

All reference mockups and assets are located under `client/assets/`:

* **UI Design Wireframes**: `client/assets/ui_design/`
  * `PC-CRAFT · Main page.png`
  * `PC-CRAFT · Login page.png`
  * `PC-CRAFT · Learner dashboard.png`
  * `PC-CRAFT · Module learning.png`
  * `PC-CRAFT · Knowledge quiz.png`
  * `PC-CRAFT · Assembly lab.png`
  * `PC-CRAFT · Troubleshooting lab.png`
  * `PC-CRAFT · Admin dashboard.png`
* **Logos & Images**: `client/assets/images/logos/`
* **3D Models**: `client/assets/models/glb/`
* **Textures**: `client/assets/textures/`

---

## 🚫 Git Collaboration Rules

> [!CAUTION]
> **DO NOT PUSH DIRECTLY TO `main`!**
> All work must be developed in a dedicated feature branch and merged via a **Pull Request (PR)**.

---

### 🌿 Step-by-Step Git Workflow

#### 1. Sync and Create a New Feature Branch
Always start from an updated `main` branch:
```bash
# Ensure you are on main and have the latest updates
git checkout main
git pull origin main

# Create and switch to your feature branch
# Naming format: feat/<feature-name> or <your-name>/<feature-name>
git checkout -b feat/main-page
```
*(Alternative modern command: `git switch -c feat/main-page`)*

#### 2. Verify Your Active Branch
Check that your terminal shows an asterisk `*` next to your branch:
```bash
git branch
# Output should show: * feat/main-page
```

#### 3. Stage and Commit Your Changes
Make meaningful commits describing what was added or updated:
```bash
# Check modified files
git status

# Stage changes
git add .

# Commit with a clear message
git commit -m "feat: implement main page layout and responsive navbar"
```

#### 4. Sync with Main Before Pushing (Avoid Merge Conflicts)
Before pushing, ensure your branch has the latest updates from teammates:
```bash
git pull origin main
```

#### 5. Push Your Feature Branch to Remote
Push your branch to GitHub/GitLab:
```bash
git push -u origin feat/main-page
```

#### 6. Open a Pull Request (PR)
1. Go to your repository on GitHub/GitLab.
2. Click **Compare & pull request** next to your branch.
3. Add a clear title and description of your completed tasks.
4. Request a review from the team before merging into `main`.

---

> [!IMPORTANT]
> **Summary Reminder**:
> 1. Never push to `main`.
> 2. Always pull before pushing (`git pull origin main`).
> 3. Always submit a Pull Request (PR) for review.
