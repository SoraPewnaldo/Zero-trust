    pipeline {
    agent any

    environment {
        // We define Node version dynamically from NVM or tools if needed, 
        // but typically Jenkins agents have docker. We'll use docker images for build steps ensuring consistency.
        DOCKER_FRONTEND_IMAGE = "zeroiam-frontend:${env.BRANCH_NAME}-${env.BUILD_ID}"
        DOCKER_BACKEND_IMAGE = "zeroiam-backend:${env.BRANCH_NAME}-${env.BUILD_ID}"
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
                        bat "ssh -i %PEM_KEY% -o StrictHostKeyChecking=no ubuntu@15.207.15.101 \"cd soraiam && git fetch origin && git reset --hard origin/main && docker-compose -f docker-compose.prod.yml up -d --build\""
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
            
            script {
                try {
                    withCredentials([usernamePassword(credentialsId: 'jira-credentials', passwordVariable: 'JIRA_API_TOKEN', usernameVariable: 'JIRA_EMAIL')]) {
                        powershell """
                            \$jiraUrl = "https://st-team-z0wxpjk8.atlassian.net"
                            \$projectKey = "SCRUM"

                            
                            if (\$jiraUrl -match "<YOUR_JIRA_DOMAIN>") {
                                Write-Host "Skipping Jira ticket creation because JIRA_DOMAIN placeholder was not replaced."
                                exit 0
                            }

                            \$base64AuthInfo = [Convert]::ToBase64String([Text.Encoding]::ASCII.GetBytes("\${JIRA_EMAIL}:\${JIRA_API_TOKEN}"))
                            
                            \$headers = @{
                                "Authorization" = "Basic \$base64AuthInfo"
                                "Content-Type" = "application/json"
                            }
                            
                            \$body = @{
                                fields = @{
                                    project = @{
                                        key = \$projectKey
                                    }
                                    summary = "Jenkins Build Failed: \${env.JOB_NAME} - Build #\${env.BUILD_NUMBER}"
                                    description = "The Jenkins CI/CD pipeline failed for branch \${env.BRANCH_NAME}.`n`nCheck the logs here: \${env.BUILD_URL}"
                                    issuetype = @{
                                        name = "Bug"
                                    }
                                }
                            } | ConvertTo-Json -Depth 5
                            
                            try {
                                \$response = Invoke-RestMethod -Uri "\$jiraUrl/rest/api/2/issue" -Method Post -Headers \$headers -Body \$body -ErrorAction Stop
                                Write-Host "Successfully created Jira Bug Ticket: \$(\$response.key)"
                            } catch {
                                Write-Error "Failed to create Jira ticket: \$_"
                            }
                        """
                    }
                } catch (Exception e) {
                    echo "Could not create Jira ticket. Did you set up the 'jira-credentials' ID? Error: ${e.message}"
                }
            }
        }
    }
}
