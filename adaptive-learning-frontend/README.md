# Adaptive Learning Path Builder

A full-stack Adaptive Learning Path Builder built with **Angular 19** (frontend) and **Spring Boot 3 / Java** (backend).

Educators can visually design branching learning paths where learners are routed to different content based on their assessment scores.

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Angular 19, TypeScript, SCSS, SVG canvas |
| Backend | Java 23, Spring Boot 3.3, Maven |
| API | REST (JSON) |

---

## Project Structure

```
adaptive-learning-frontend/   # Angular app
adaptive-learning-backend/    # Spring Boot API
```

---

## Prerequisites

- **Node.js** v18+ and npm
- **Angular CLI** 19 (`npm install -g @angular/cli`)
- **JDK 17+** (JDK 23 recommended)
- **Maven** 3.8+

---

## Build & Run

### 1. Start the Backend

```bash
cd adaptive-learning-backend

# Build the JAR
mvn package -DskipTests

# Run (use JDK 17+)
java -jar target/adaptive-learning-backend-1.0.0.jar
```

Backend starts on **http://localhost:8080**

#### Verify API is running:
```bash
curl http://localhost:8080/api/components
curl http://localhost:8080/api/learning-paths/lp-sat-adaptive-001
```

### 2. Start the Frontend

```bash
cd adaptive-learning-frontend

# Install dependencies
npm install

# Start dev server
ng serve
```

Frontend available at **http://localhost:4200**

### 3. Production Build

```bash
# Backend
cd adaptive-learning-backend && mvn package -DskipTests

# Frontend
cd adaptive-learning-frontend && ng build --configuration=production
```

---

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/components` | Available content (units + assessments) |
| GET | `/api/learning-paths` | All learning paths |
| GET | `/api/learning-paths/{id}` | Single learning path |
| POST | `/api/learning-paths` | Create new path |
| PUT | `/api/learning-paths/{id}` | Update a path |
| DELETE | `/api/learning-paths/{id}` | Delete a path |

---

## Features

- **Visual flow canvas** — drag and drop nodes to build adaptive learning paths
- **Node types:** Start, Assessment, Unit, Group (adaptive branching)
- **SVG arrows** connecting nodes with conditional routing labels
- **Properties panel** — edit node label, description, duration, score thresholds
- **Assignment conditions** — define when a section is shown based on prior scores
- **Save Draft / Publish** — persists to backend REST API
- **Zoom & pan** — scroll and zoom the canvas; fit-to-screen button
- **Sidebar** — drag components from the available content library onto the canvas
- **Fallback data** — loads the SAT Adaptive Path demo even if backend is offline

---

## Demo Path (Pre-loaded)

The app loads a sample **SAT Adaptive Path** with:
- Math Module 1 (assessment) → routes to Easy or Advanced based on score
- Reading & Comp Module 1 (assessment) → routes to Easy or Advanced
- Complete Assessment (end node)

