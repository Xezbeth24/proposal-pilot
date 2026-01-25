pipeline {
    agent any

    stages {
        stage('Checkout') {
            steps {
                checkout scm
            }
        }

        stage('Install') {
            steps {
                sh 'npm install'
            }
        }

        stage('Lint') {
            steps {
                sh 'npm run lint || echo "No lint script"'
            }
        }

        stage('Build') {
            steps {
                sh 'npm run build'
            }
        }
    }
}
