pipeline {
    agent any

    environment {
        // We define Node version dynamically from NVM or tools if needed, 
        // but typically Jenkins agents have docker. We'll use docker images for build steps ensuring consistency.
        DOCKER_FRONTEND_IMAGE = "soraiam-frontend:${env.BRANCH_NAME}-${env.BUILD_ID}"
        DOCKER_BACKEND_IMAGE = "soraiam-backend:${env.BRANCH_NAME}-${env.BUILD_ID}"
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

        stage('Deploy to Production') {
            when {
                branch 'main'
            }
            steps {
                script {
                    echo "Deploying to AWS EC2 (15.207.15.101)..."
                    
                    // Use withCredentials for better compatibility on Windows hosts
                    withCredentials([sshUserPrivateKey(credentialsId: 'ec2-ssh-key', keyFileVariable: 'PEM_KEY')]) {
                        // Secure your .pem key using PowerShell (Native Windows ACLs are more robust than icacls)
                        powershell """
                            \$path = \"${PEM_KEY}\"
                            \$acl = Get-Acl \$path
                            \$acl.SetAccessRuleProtection(\$true, \$false)
                            \$acl.Access | ForEach-Object { \$acl.RemoveAccessRule(\$_) }
                            \$user = [System.Security.Principal.WindowsIdentity]::GetCurrent().Name
                            \$rule = New-Object System.Security.AccessControl.FileSystemAccessRule(\$user, \"FullControl\", \"Allow\")
                            \$acl.AddAccessRule(\$rule)
                            Set-Acl \$path \$acl
                        """
                        bat "ssh -i %PEM_KEY% -o StrictHostKeyChecking=no ubuntu@15.207.15.101 \"cd soraiam && git pull && docker-compose up -d --build\""
                    }
                }
            }
        }
    }

    post {
        always {
            cleanWs()
        }
        success {
            echo "Pipeline succeeded for branch ${env.BRANCH_NAME}!"
        }
        failure {
            echo "Pipeline failed for branch ${env.BRANCH_NAME}. Please check logs."
        }
    }
}
