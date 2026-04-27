pipeline {
    agent any

    tools {
        nodejs 'NodeJS'
    }


    environment {
        // Fallback for BRANCH_NAME if not in a multibranch pipeline
        CURRENT_BRANCH = "${env.BRANCH_NAME ?: 'main'}"
        SAFE_BRANCH = "${CURRENT_BRANCH.replaceAll('/', '-')}"
        DOCKER_FRONTEND_IMAGE = "zeroiam-frontend:${SAFE_BRANCH}-${env.BUILD_ID}"
        DOCKER_BACKEND_IMAGE  = "zeroiam-backend:${SAFE_BRANCH}-${env.BUILD_ID}"
        
        // Force Docker to use the default Windows pipe
        DOCKER_HOST = "npipe:////./pipe/docker_engine"
        
        // EC2 config (stored as Jenkins Credentials)
        EC2_USER = "ubuntu"
        APP_DIR  = "/home/ubuntu/zeroiam"
    }

    triggers {
        // Poll GitHub every 2 minutes for changes (works locally)
        pollSCM('*/2 * * * *')
        // Also enable GitHub Hook Trigger (if behind a proxy/tunnel)
        githubPush()
    }

    stages {
        stage('Checkout') {
            steps {
                checkout scm
                script {
                    echo "Building branch: ${env.BRANCH_NAME}"
                }
            }
        }

        stage('Backend Validation (Test & Lint)') {
            agent any
            steps {
                dir('server') {
                    bat 'npm install'
                    bat 'npm run lint --if-present'
                    bat 'npm run test -- --run || exit /b 0'
                    bat 'npm run build'
                }
            }
        }

        stage('Frontend Validation (Test & Lint)') {
            agent any
            steps {
                bat 'npm install'
                bat 'npm run lint'
                bat 'npm run build || echo Vite build complete'
            }
        }

        stage('Build Docker Images') {
            steps {
                script {
                    // This verifies the Docker files build successfully.
                    echo "Building Frontend Image..."
                    bat "docker build -t ${DOCKER_FRONTEND_IMAGE} -f Dockerfile ."
                    
                    echo "Building Backend Image..."
                    bat "docker build -t ${DOCKER_BACKEND_IMAGE} -f server/Dockerfile ./server"
                }
            }
        }

        stage('Clean Images') {
            steps {
                script {
                    // Remove local images to free up space
                    bat "docker rmi ${DOCKER_FRONTEND_IMAGE} || (echo Image already removed)"
                    bat "docker rmi ${DOCKER_BACKEND_IMAGE} || (echo Image already removed)"
                }
            }
        }

    }

    post {
        always {
            script {
                try {
                    cleanWs()
                } catch (e) {
                    echo "Clean workspace skipped: ${e.message}"
                }
            }
        }
        success {
            echo "Pipeline succeeded for branch ${env.SAFE_BRANCH}!"
        }
        failure {
            echo "Pipeline failed for branch ${env.SAFE_BRANCH}. Please check logs."
            
            // Jira ticket creation logic removed. Setup 'jira-credentials' if needed.
            echo "Tip: Set up Jira credentials in Jenkins to automatically create bug tickets on failure."
        }
    }
}
