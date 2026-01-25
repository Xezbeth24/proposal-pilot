pipeline {
    agent any

    stages {
        stage('Checkout') {
            steps {
                checkout scm
            }
        }

        stage('Echo') {
            steps {
                sh 'echo "Jenkins pipeline is running for ProposalPilot"'
            }
        }
    }
}
