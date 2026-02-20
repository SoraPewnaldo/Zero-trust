pipeline {
    agent any

    tools {
        nodejs 'node' // ensure Node.js tool is configured in Jenkins under Global Tool Configuration with name 'node'
    }

    environment {
        CI = 'true'
    }

    stages {
        stage('Checkout') {
            steps {
                checkout scm
            }
        }

        stage('Install Dependencies') {
            parallel {
                stage('Frontend Dependencies') {
                    steps {
                        dir('.') {
                            sh 'npm install'
                        }
                    }
                }
                stage('Backend Dependencies') {
                    steps {
                        dir('server') {
                            sh 'npm install'
                        }
                    }
                }
                stage('Trust Engine Dependencies') {
                    steps {
                        dir('trust_engine') {
                            sh 'python3 -m pip install -r requirements.txt'
                        }
                    }
                }
            }
        }

        stage('Lint & Build Frontend') {
            steps {
                dir('.') {
                    sh 'npm run build'
                }
            }
        }

        // Add additional testing stages here if testing scripts are defined in package.json/pytest

        // Example Docker Deployment Stage (Optional/Manual trigger)
        stage('Docker Build & Deploy') {
            when {
                // To only run if this was manually triggered or merged to main
                // branch 'main' 
                expression { false } // Disabled by default to prevent accidental deployments
            }
            steps {
                sh 'docker-compose up -d --build'
            }
        }
    }

    post {
        always {
            cleanWs()
            echo 'Pipeline execution complete.'
        }
        success {
            echo 'Jenkins pipeline completed successfully!'
        }
        failure {
            echo 'Jenkins pipeline failed. Check logs for details.'
        }
    }
}
