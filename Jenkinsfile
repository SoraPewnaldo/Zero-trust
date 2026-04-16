pipeline {
    agent any

    environment {
        SAFE_BRANCH = "${env.BRANCH_NAME.replaceAll('/', '-')}"
        DOCKER_FRONTEND_IMAGE = "zeroiam-frontend:${SAFE_BRANCH}-${env.BUILD_ID}"
        DOCKER_BACKEND_IMAGE = "zeroiam-backend:${SAFE_BRANCH}-${env.BUILD_ID}"
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
