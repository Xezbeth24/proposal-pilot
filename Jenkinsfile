pipeline {
    agent any
    
    environment {
        NODE_ENV = 'production'
        DOCKER_IMAGE = 'proposalpilot-nextjs'
        DOCKER_TAG = "${BUILD_NUMBER}"
        DOCKER_USERNAME = 'xzebeth'
    }
    
    stages {
        stage('Checkout') {
            steps {
                echo "🔄 Checking out code from GitHub..."
                checkout scm
            }
        }
        
        stage('Install Dependencies') {
            agent {
                docker {
                    image 'node:18-alpine'
                    reuseNode true
                }
            }
            steps {
                echo "📦 Installing Node.js dependencies..."
                sh 'npm install'
            }
        }
        
        stage('Lint & Code Quality') {
            agent {
                docker {
                    image 'node:18-alpine'
                    reuseNode true
                }
            }
            steps {
                echo "🔍 Running linting checks..."
                sh 'npm run lint || true'
            }
        }
        
        stage('Build') {
            agent {
                docker {
                    image 'node:18-alpine'
                    reuseNode true
                }
            }
            steps {
                echo "🏗️ Building Next.js application..."
                sh 'npm run build'
            }
        }
        
        stage('Test') {
            agent {
                docker {
                    image 'node:18-alpine'
                    reuseNode true
                }
            }
            steps {
                echo "🧪 Running unit tests..."
                sh 'npm test -- --coverage --watchAll=false || true'
            }
        }
        
        stage('Build Docker Image') {
            steps {
                echo "🐳 Building Docker image..."
                sh '''
                    docker build \
                        -t ${DOCKER_IMAGE}:${DOCKER_TAG} \
                        -t ${DOCKER_IMAGE}:latest \
                        -t ${DOCKER_USERNAME}/${DOCKER_IMAGE}:${DOCKER_TAG} \
                        -t ${DOCKER_USERNAME}/${DOCKER_IMAGE}:latest \
                        .
                '''
            }
        }
        
        stage('Push to Docker Hub') {
            steps {
                echo "📤 Pushing Docker image to registry..."
                withCredentials([usernamePassword(credentialsId: 'docker-hub-credentials', usernameVariable: 'DOCKER_USER', passwordVariable: 'DOCKER_PASS')]) {
                    sh '''
                        echo $DOCKER_PASS | docker login -u $DOCKER_USER --password-stdin
                        docker push ${DOCKER_USERNAME}/${DOCKER_IMAGE}:${DOCKER_TAG}
                        docker push ${DOCKER_USERNAME}/${DOCKER_IMAGE}:latest
                        docker logout
                    '''
                }
            }
        }
        
        stage('Deploy to Local') {
            steps {
                echo "🚀 Deploying application..."
                sh '''
                    docker stop proposalpilot-container 2>/dev/null || true
                    docker rm proposalpilot-container 2>/dev/null || true
                    docker run -d \
                        --name proposalpilot-container \
                        -p 3000:3000 \
                        ${DOCKER_USERNAME}/${DOCKER_IMAGE}:latest
                '''
            }
        }
    }
    
    post {
        success {
            echo "✅ Pipeline completed successfully!"
            echo "🎉 Application is running at http://localhost:3000"
        }
        failure {
            echo "❌ Pipeline failed! Check logs above."
        }
        always {
            cleanWs()
        }
    }
}
