# Affordmed – Backend Track

## Overview
This project is a submission for the Affordmed Campus Hiring Evaluation (Backend Track). It demonstrates a robust notification system with logging middleware, backend and frontend microservices, and a complete system design as per the provided requirements.

---

## Project Structure
```
├── logging_middleware/         # Reusable logging middleware (Node.js)
├── vehicle_maintenance_scheduler/ # (Placeholder for other assignment modules)
├── notification_system_design.md  # Complete system design (Stages 1–6)
├── notification_app_be/       # Backend microservice (Node.js/Express)
├── notification_app_fe/       # Frontend microservice (HTML/JS)
├── .gitignore
```

---

## Features
- **Logging Middleware:**
  - Reusable, production-grade logging for backend apps
  - Posts logs to Affordmed evaluation server as per API specs
- **Backend Microservice:**
  - RESTful API for notifications (add, fetch, mark as read)
  - In-memory store for demo/testing
  - CORS enabled for frontend integration
- **Frontend Microservice:**
  - Simple HTML/JS UI to add and view notifications
  - Supports bulk notification and per-user fetch
- **System Design:**
  - notification_system_design.md covers API, DB, scaling, performance, and reliability (Stages 1–6)

---

## How to Run
### 1. Backend
```
cd notification_app_be
npm install express body-parser cors
node index.js
```
- Runs on http://localhost:3001

### 2. Frontend
- Open notification_app_fe/index.html in your browser (or use Live Server/VS Code extension)
- Use the UI to add and fetch notifications

---

## Logging Middleware Usage
- See logging_middleware/index.js for usage instructions
- Integrate with your backend by importing and calling the `Log` function

---

## Registration & Authentication
- Register for API credentials using the provided script (register_affordmed.js)
- Use your clientID and clientSecret for authentication with Affordmed APIs

---

## Screenshots
- See attached screenshots for working demo and API responses

---

## Notes
- No personal or company information is present in the repo or commit messages
- All code is modular, commented, and follows best practices
- For evaluation only; in-memory stores are used for demo purposes

---

## Author
- [Your Roll Number] (per submission guidelines)

---

## License
This project is for Affordmed evaluation purposes only.
