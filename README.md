# EventVerse

EventVerse is a real-time event coordination platform built to simplify the planning and execution of events for the **IIITA community**. Instead of relying on multiple communication platforms and spreadsheets, EventVerse provides one centralized workspace where organizers, team leads, and volunteers can coordinate efficiently.

The application is intentionally minimal and focuses only on the essential workflows required to organize an event, delivering a clean, production-quality experience.

---

## 🚀 Features

- **Role-Based Access Control:** Three distinct roles — Organizer, Team Lead, and Volunteer.
- **Real-Time Communication:** Live team channels and organizer broadcasting powered by Socket.IO.
- **Dynamic Scheduling:** Create, update, and manage event schedules in real-time.
- **Centralized Dashboard:** Real-time statistics, upcoming schedules, and latest announcements.
- **Cloudinary Integration:** Seamless upload and storage of event banners directly from the client.
- **Performance Optimized:** Includes in-memory key-value caching (NodeCache) to prevent database bottlenecks during high traffic.
- **Community Restricted:** Registration is strictly locked to `@iiita.ac.in` domain emails.

---

## 🛠️ Tech Stack

- **Frontend:** React, Vite, React Router, CSS Custom Properties (Dark/Glassmorphism theme)
- **Backend:** Node.js, Express.js, Socket.IO
- **Database:** MongoDB Atlas, Mongoose
- **Storage:** Cloudinary (for image uploads)
- **Authentication:** JWT, bcryptjs

---

## ⚙️ Environment Variables

Create a `.env` file in the root of the project with the following keys:

```env
PORT=4000
NODE_ENV=development
MONGO_URI=<your_mongodb_atlas_connection_string>
JWT_SECRET=<your_secure_jwt_secret>
CLIENT_URL=http://localhost:5173

# Cloudinary (Get these from your Cloudinary console)
CLOUDINARY_CLOUD_NAME=<your_cloud_name>
CLOUDINARY_API_KEY=<your_api_key>
CLOUDINARY_API_SECRET=<your_api_secret>
```

> **Note:** EventVerse uses Unsigned Uploads from the client-side for Cloudinary. Ensure you have an unsigned upload preset named `eventverse_banners` in your Cloudinary settings.

---

## 🏃 Getting Started

### 1. Install Dependencies
Install the required packages for both the backend and frontend:
```bash
npm install
```

### 2. Start the Backend Server
The backend handles the API, database connection, and Socket.IO server on port 4000.
```bash
npm run server
```

### 3. Start the Frontend Application
In a **new terminal window**, start the Vite development server:
```bash
npm run dev
```

Visit `http://localhost:5173` in your browser.

---

## 👥 User Roles & Capabilities

- **Organizer:** Creates the event, uploads the banner, manages the schedule, adds Team Leads and Volunteers, and can post global announcements.
- **Team Lead:** Manages their specific team, can add new volunteers to their team, and oversees team-specific real-time chat.
- **Volunteer:** Can view the event schedule and communicate in their assigned team's real-time chat channel.
