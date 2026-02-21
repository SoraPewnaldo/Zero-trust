# Collaboration Guide

Welcome to the team! This repository uses a modern collaborative workflow powered by Git, Docker, and Jenkins. This ensures that everyone works in the exact same environment and our code is always tested before reaching production.

Follow these steps to get started:

## 1. Get the Code & Setup Your Branch

First, clone the repository to your local machine:

```bash
git clone https://github.com/SoraPewnaldo/Zero-trust.git
cd Zero-trust/Webapp
```

**Never develop directly on `main`.** Always create a new branch for the feature or bug you are working on. We recommend naming branches based on who is working on it or what the feature is (e.g., `feature/user-auth`, `ayush-fixes`, `bug/login-crash`).

```bash
# Create and switch to your new branch
git checkout -b <your-branch-name>
```

## 2. Start the Local Environment (Docker)

You **do not** need to install Node.js, Python, or MongoDB on your laptop. Docker handles everything!

Make sure Docker Desktop is running, then execute:

```bash
docker-compose up --build
```

_Tip: You only need the `--build` flag the very first time, or if someone adds a new dependency in `package.json` or `requirements.txt`._

**What this does:**

- Starts the **MongoDB Database** automatically.
- Starts the **Backend API** at `http://localhost:3001`.
- Starts the **Frontend** at `http://localhost:5173`.
- Starts the **Trust Engine (Python)** at `http://localhost:5000`.

**Hot-Reloading is Enabled!**
Leave that terminal window running. When you make changes to the code in your editor, the containers will automatically detect the changes and reload instantly.

## 3. Work on Your Code

Write your code, test it locally in your browser, and make sure everything is working as expected.

## 4. Save and Share Your Work

When you reach a good stopping point, save your work to GitHub.

```bash
# See what files you changed
git status

# Add your changes
git add .

# Write a descriptive commit message
git commit -m "feat: added new login button"

# Push your branch to GitHub
git push -u origin <your-branch-name>
```

## 5. Automated CI/CD (Jenkins)

Once you push your code, **Jenkins automatically takes over**.
Because we use a _Multibranch Pipeline_, Jenkins discovers your new branch instantly.

- Jenkins will build the Docker images in the cloud to ensure your code has no syntax or compile errors.
- It will run Linters (`npm run lint`) to ensure code quality.
- You can monitor the Jenkins dashboard to see if your branch gets a Green checkmark (Pass) or a Red X (Fail).

## 6. Merging to Production

When your feature is complete and Jenkins gives your branch a green checkmark:

1. Go to GitHub and open a **Pull Request (PR)** from your branch into `main`.
2. Ask another developer to review your code.
3. Once approved, merge the Pull Request.
4. _Jenkins will detect the merge to `main` and automatically deploy your new code to the production server._
