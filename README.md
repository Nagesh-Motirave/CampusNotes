# Campus Notes Hub

A comprehensive, production-ready full-stack web application designed for students to seamlessly share, request, and discover academic notes. Built with a modern tech stack focusing on clean design, performance, and scalability.

## 🧱 Tech Stack

### Frontend
- **Framework**: React.js (Vite)
- **Styling**: Tailwind CSS v3
- **State Management**: React Context API
- **HTTP Client**: Axios
- **Routing**: React Router v6
- **Forms**: React Hook Form

### Backend Microservices
- **Framework**: Java 17 + Spring Boot 3.x
- **API Gateway**: Spring Cloud Gateway (Port 8080)
- **Auth Service**: JWT + BCrypt (Port 8081)
- **Notes Service**: CRUD, Search, Likes, Downloads (Port 8082)
- **User Service**: Profile, Gamification Leaderboard (Port 8083)
- **File Upload Service**: Cloudinary Integration (Port 8084)
- **Database**: MongoDB

## 🚀 Setup Instructions

### Prerequisites
- Node.js (v18+)
- Java 17
- Maven
- Docker & Docker Compose
- Cloudinary Account (for file uploads)

### 1. Cloudinary Configuration
Create an account on [Cloudinary](https://cloudinary.com/) and obtain your `Cloud Name`, `API Key`, and `API Secret`.
Export them as environment variables (or define them in a `.env` file at the project root for docker-compose):
```bash
export CLOUDINARY_CLOUD_NAME=your_cloud_name
export CLOUDINARY_API_KEY=your_api_key
export CLOUDINARY_API_SECRET=your_api_secret
```

### 2. Running with Docker Compose (Recommended)
You need to create a `Dockerfile` in each microservice directory (`api-gateway`, `auth-service`, `notes-service`, `user-service`, `file-upload-service`) to use Docker Compose properly. 
Sample Dockerfile for Spring Boot:
```dockerfile
FROM eclipse-temurin:17-jdk-alpine
VOLUME /tmp
COPY target/*.jar app.jar
ENTRYPOINT ["java","-jar","/app.jar"]
```
Make sure you build the `.jar` files using Maven first:
```bash
cd backend
mvn clean package -DskipTests
```
Then run docker-compose from the root directory:
```bash
docker-compose up --build
```
The API Gateway will be available at `http://localhost:8080`.

### 3. Running Frontend Locally
Open a new terminal window:
```bash
cd frontend
npm install
npm run dev
```
The frontend will start at `http://localhost:5173`.

## 📌 Architecture Notes
- All frontend requests go through the **API Gateway** (`http://localhost:8080`).
- The API Gateway handles **JWT Validation** globally and forwards the user context (`X-User-Id`, `X-User-Email`) as HTTP headers to downstream services.
- Gamification: Users earn points for uploading notes, getting likes, getting downloads, and fulfilling note requests. The `notes-service` communicates with the `user-service` internally to award these points.
