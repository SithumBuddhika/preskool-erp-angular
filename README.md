# 🎓 PreSkool ERP — Modern School Management System

<p align="center">
  <img src="screenshots/preskool-brandlogo.png" alt="Preskool Brand Logo" width="75%" />
</p>

![Angular](https://img.shields.io/badge/Angular-21-DD0031?style=for-the-badge&logo=angular&logoColor=white)
![NestJS](https://img.shields.io/badge/NestJS-11-E0234E?style=for-the-badge&logo=nestjs&logoColor=white)
![Nx](https://img.shields.io/badge/Nx-Monorepo-143055?style=for-the-badge&logo=nx&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-4169E1?style=for-the-badge&logo=postgresql&logoColor=white)
![Prisma](https://img.shields.io/badge/Prisma-7-2D3748?style=for-the-badge&logo=prisma&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-5.9-3178C6?style=for-the-badge&logo=typescript&logoColor=white)
![SCSS](https://img.shields.io/badge/SCSS-Responsive_UI-CC6699?style=for-the-badge&logo=sass&logoColor=white)

## ✨ Overview

**PreSkool ERP** is a modern, full-stack **School / College Enterprise Resource Planning system** built with **Angular, NestJS, PostgreSQL, Prisma, and Nx Monorepo architecture**.

The project is designed as a professional portfolio-grade ERP platform that demonstrates:

- 🧩 Modular enterprise UI design
- ⚙️ RESTful backend architecture
- 🗄️ Relational database modeling with Prisma
- 🔐 Real authentication and admin access control
- 📊 Live dashboard analytics and reports
- 📱 Responsive desktop / tablet / mobile layouts
- 🧠 User-friendly workflows with autocomplete and relational suggestions
- 🗺️ Map-based transport route management
- 🧾 CSV export-ready reporting screens

This is not just a CRUD demo. It is a complete ERP-style product built module-by-module to reflect how a real school administration platform could be structured.

## 📚 Table of Contents

- [✨ Overview](#-overview)
- [🚀 Key Highlights](#-key-highlights)
- [🏗️ Tech Stack](#-tech-stack)
- [📌 Project Architecture](#-project-architecture)
- [🧠 Why This Project?](#-why-this-project)
- [🔐 Authentication & Admin Management](#-authentication--admin-management)
  - [Auth Features](#auth-features)
  - [Admin User Management](#admin-user-management)
  - [Email Service Notice](#-email-service-notice)
- [🧩 Core Modules](#-core-modules)
  - [1. 👥 People Management](#1--people-management)
  - [2. 🎓 Academic Management](#2--academic-management)
  - [3. 🧑‍💼 HRM Management](#3--hrm-management)
  - [4. 🏫 Management Module](#4--management-module)
    - [💰 Fees Management](#-fees-management)
    - [📚 Library Management](#-library-management)
    - [🚌 Routes Management](#-routes-management)
    - [🏨 Hostel Management](#-hostel-management)
    - [🌐 Sports Management](#-sports-management)
    - [🗓️ Event Management](#-event-management)
  - [5. 📊 Reports Module](#5--reports-module)
    - [Day-wise Matrix Reports](#day-wise-matrix-reports)
  - [6. 🖥️ Dashboards](#6--dashboards)
- [🗄️ Database Design](#-database-design)
- [🔁 REST API Structure](#-rest-api-structure)
- [📱 Responsive UI Work](#-responsive-ui-work)
- [🧭 Navigation Structure](#-navigation-structure)
- [⚙️ Local Setup](#-local-setup)
- [📦 Installation](#-installation)
  - [🐘 Start PostgreSQL with Docker](#-start-postgresql-with-docker)
- [🔐 Environment Variables](#-environment-variables)
- [🧬 Prisma Setup](#-prisma-setup)
- [▶️ Run the Frontend](#-run-the-frontend)
- [▶️ Run Backend Services](#-run-backend-services)
- [🏗️ Build](#-build)
- [🧪 Useful Nx Commands](#-useful-nx-commands)
- [🖼️ Screenshots](#-screenshots)
- [🎯 Portfolio Value](#-portfolio-value)
- [🛠️ Development Approach](#-development-approach)
- [🚀 Future Improvements](#-future-improvements)
- [🧑‍💻 Developer](#-developer)
- [⭐ Final Note](#-final-note)

---

## 🚀 Key Highlights

- ✅ **Nx Monorepo** with Angular frontend and multiple NestJS backend services
- ✅ **Angular 21 standalone components**
- ✅ **NestJS 11 service-based backend**
- ✅ **PostgreSQL + Prisma ORM**
- ✅ **JWT authentication**
- ✅ **Admin User Management**
- ✅ **Active / Inactive admin login control**
- ✅ **2-step verification support**
- ✅ **Forgot Password / Reset Password flow structure**
- ✅ **Role-ready architecture**
- ✅ **Live dashboard cards and summaries**
- ✅ **Responsive sidebar and topbar**
- ✅ **Mobile-friendly tables, modals, and forms**
- ✅ **Reports with CSV export**
- ✅ **Transport route map preview using Leaflet / OpenStreetMap**
- ✅ **Clean UI inspired by modern SaaS dashboards**

---

## 🏗️ Tech Stack

| Layer      | Technology                                   |
| ---------- | -------------------------------------------- |
| Frontend   | Angular 21                                   |
| UI Styling | SCSS, responsive custom layouts              |
| Icons      | Angular Tabler Icons                         |
| Charts     | ApexCharts / ng-apexcharts                   |
| Maps       | Leaflet + OpenStreetMap                      |
| Backend    | NestJS 11                                    |
| Database   | PostgreSQL                                   |
| ORM        | Prisma 7                                     |
| Auth       | JWT, guarded routes, admin status validation |
| Workspace  | Nx Monorepo                                  |
| Language   | TypeScript                                   |
| Dev DB     | Docker PostgreSQL                            |

---

## 📌 Project Architecture

```txt
preskool-erp-angular/
│
├── apps/
│   └── web/                         # Angular frontend application
│
├── auth-service/                    # Authentication + Admin user management
│   └── src/app/
│
├── people-service/                  # People, HRM, Management, Reports data APIs
│   └── src/app/
│
├── academic-service/                # Academic module APIs
│   └── src/app/
│
├── api-gateway/                     # Gateway-ready NestJS service
│
├── prisma/
│   └── schema.prisma                # Central database schema
│
├── docker-compose.yml               # PostgreSQL container setup
├── package.json
├── nx.json
└── README.md
```

## 🧠 Why This Project?

School ERP systems are usually large, complex, and heavily data-driven. This project was built to practice and demonstrate real-world engineering skills such as:

- Designing scalable frontend module structure
- Connecting Angular components to REST APIs
- Building relational data flows
- Handling dashboard analytics from real records
- Creating reusable UI patterns
- Managing complex forms and tables
- Building responsive admin panels
- Structuring a project for deployment and maintainability

The goal of **PreSkool ERP** is to show practical full-stack ability, not only visual UI work.

## 🔐 Authentication & Admin Management

The authentication module includes a real admin-focused workflow.

### Auth Features

- Login
- Register
- JWT-based session handling
- Protected Angular routes
- Guest-only auth pages
- Forgot Password flow
- Reset Password flow
- Email verification screen structure
- Two-step verification screen structure
- Current logged-in user profile endpoint
- Admin user management APIs

### Admin User Management

The main admin can manage other admin/test accounts:

- Create admin users
- Edit admin details
- Activate / deactivate admins
- Enable / disable 2FA
- Delete managed admin users
- Block inactive admins from logging in

This is especially useful for hosted portfolio demos where test admin accounts need to be controlled safely.

## 📧 Email Service Notice

PreSkool ERP uses the **Brevo Transactional Email API** for production email delivery. This is used by the `auth-service` to send real authentication emails such as **Forgot Password reset links** and **Two-Step Verification (2FA) OTP codes**.

The project originally used SMTP-based email delivery, but during Render deployment the email service was moved to Brevo’s HTTPS API to avoid SMTP port timeout issues on hosted environments. This makes the production email flow more reliable for deployed usage.

Required email environment variables are configured only in the Render `auth-service`:

```env
BREVO_API_KEY=your_brevo_api_key
BREVO_SENDER_EMAIL=your_verified_sender_email
BREVO_SENDER_NAME=PreSkool ERP
FRONTEND_URL=https://your-vercel-frontend-url.vercel.app
```

Users do not need Brevo accounts. Brevo is used internally by the backend, and emails are sent directly to the real email addresses stored in the ERP database.

## 🧩 Core Modules

### 1. 👥 People Management

Manage the main people records used across the ERP.

#### Included Pages

- Students
- Parents
- Guardians
- Teachers

#### Features

- Add / edit / delete records
- Search and filter records
- Status management
- Responsive data tables
- Clean form modals
- Student admission numbers
- Teacher employee numbers
- Guardian and parent relationship tracking

---

### 2. 🎓 Academic Management

Academic operations are handled as a separate module with class, subject, routine, exam, and result-related data.

#### Included Pages

- Classes
- Class Rooms
- Subjects
- Class Routine
- Exam Schedule
- Grades
- Subject Groups
- Time Table

#### Features

- Class and section management
- Room and capacity management
- Subject allocation
- Teacher suggestions / autocomplete
- Class suggestions / autocomplete
- Routine scheduling
- Exam scheduling
- Grade management
- Subject group management
- Timetable creation

The Academic module focuses on reducing manual typing errors by using suggestion-based relational fields where suitable.

---

### 3. 🧑‍💼 HRM Management

The HRM module manages staff, departments, designations, leave, attendance, and payroll.

#### Included Pages

- Departments
- Designations
- Staffs
- Holidays
- Leave
- Student Attendance
- Teacher Attendance
- Staff Attendance
- Payroll

#### Features

- Staff autocomplete in HRM workflows
- Designation autocomplete in staff forms
- Leave request tracking
- Attendance marking
- Payroll generation
- Net salary calculation
- Holiday records
- Department and designation status management

#### Payroll Logic

```txt
Net Salary = Basic Salary + Allowance - Deduction
```

Payroll records support:

- Pending
- Paid
- Failed

---

### 4. 🏫 Management Module

The Management module covers operational school services.

#### Included Pages

- Fee Groups
- Fees Collection
- Library Books
- Library Members
- Routes
- Hostels
- Sports
- Events

---

#### 💰 Fees Management

- Fee groups
- Fee collection records
- Student autocomplete
- Fee group autocomplete
- Paid / pending / partial status
- Payment method tracking
- Balance calculation
- Receipt number handling

---

#### 📚 Library Management

##### Library Books

- Book code
- Book title
- ISBN
- Author
- Category
- Publisher
- Total copies
- Available copies
- Shelf number
- Availability status

##### Library Members

- Student / Teacher / Staff member types
- Reference code support
- Member code generation
- Join date
- Active / inactive / blocked status

---

#### 🚌 Routes Management

Transport route management includes an interactive map-based preview.

##### Features

- Route code
- Route name
- Start location
- End location
- Stops
- Vehicle number
- Driver name
- Estimated distance
- Route status
- Manual map point selection
- Automatic route generation from locations
- Polyline drawing using Leaflet / OpenStreetMap

This feature gives the ERP a more realistic and modern operational management experience.

---

#### 🏨 Hostel Management

- Hostel code
- Hostel name
- Hostel type
- Warden details
- Total rooms
- Total beds
- Available beds
- Monthly fee
- Status tracking
- Bed validation

---

#### 🌐 Sports Management

- Sport code
- Sport name
- Category
- Coach
- Venue
- Practice days
- Practice time
- Maximum participants
- Current participants
- Participant validation

---

#### 🗓️ Event Management

Events are connected to dashboard calendars and upcoming event sections.

##### Event Data

- Title
- Type
- Audience
- Start date
- End date
- Time
- Location
- Organizer
- Description
- Status

##### Event Types

- Meeting
- Holiday Event
- Exam Event
- Sports Event
- General

---

### 5. 📊 Reports Module

The Reports module provides attendance and staff/teacher reporting pages with responsive layouts and CSV export support.

#### Included Reports

- Attendance Report
- Student Attendance Type
- Daily Attendance
- Student Day Wise
- Teacher Day Wise
- Teacher Report
- Staff Day Wise
- Staff Report

#### Report Features

- Summary cards
- Search and filtering
- Status filtering
- Date/month filtering
- Matrix-style day-wise attendance reports
- Sticky columns for day-wise tables
- CSV export
- Mobile card-table layouts for normal reports
- Horizontal scrolling for matrix reports

#### Day-wise Matrix Reports

The day-wise reports show attendance by month in a matrix layout:

```txt
Person | 01 | 02 | 03 | 04 | ... | Marked
```

Status indicators:

| Short Code | Meaning    |
| ---------- | ---------- |
| P          | Present    |
| A          | Absent     |
| L          | Late       |
| H          | Half Day   |
| -          | Not Marked |

---

### 6. 🖥️ Dashboards

PreSkool ERP includes multiple role-focused dashboards.

#### Included Dashboards

- Admin Dashboard
- Student Dashboard
- Teacher Dashboard
- Parent Dashboard

#### Admin Dashboard Features

- Real data summary cards
- Attendance overview
- Fee overview
- Leave requests
- Schedule calendar
- Upcoming events
- Quick action tiles
- Admin User Management
- Responsive mobile dashboard layout

#### Student Dashboard

- Student-related summary data
- Attendance overview
- Fees summary
- Library summary
- Upcoming events
- Schedule highlights

#### Teacher Dashboard

- Teacher-focused school data
- Class / subject / schedule related summaries
- Attendance-related insights

#### Parent Dashboard

- Child/student overview
- Attendance and fees-related information
- Upcoming school activities

---

## 🗄️ Database Design

The database is modeled using Prisma with PostgreSQL.

### Main Schema Areas

| Area           | Models                                                                                      |
| -------------- | ------------------------------------------------------------------------------------------- |
| Authentication | User, PasswordResetToken, LoginOtp                                                          |
| People         | Student, Parent, Guardian, Teacher                                                          |
| Academic       | SchoolClass, ClassRoom, Subject, ClassRoutine, Exam, Grade, SyllabusSubjectGroup, TimeTable |
| HRM            | Department, Designation, Staff, Holiday, StaffLeave, Payroll                                |
| Attendance     | StudentAttendance, TeacherAttendance, StaffAttendance                                       |
| Fees           | Fee, FeeGroup                                                                               |
| Library        | LibraryBook, LibraryMember                                                                  |
| Management     | TransportRoute, Hostel, Sport, SchoolEvent                                                  |

---

## 🔁 REST API Structure

The backend is divided into NestJS services.

### Auth Service

Handles:

- Authentication
- JWT user sessions
- Admin user management
- Password reset flow
- Login OTP flow
- Admin activation / deactivation

### People Service

Handles:

- Students
- Parents
- Guardians
- Teachers
- HRM records
- Attendance
- Payroll
- Fees
- Library
- Routes
- Hostels
- Sports
- Events

### Academic Service

Handles:

- Classes
- Class rooms
- Subjects
- Class routine
- Exams
- Grades
- Subject groups
- Timetables

### API Gateway

A gateway-ready NestJS application is included for future service routing and API orchestration.

---

## 📱 Responsive UI Work

The UI has been polished for:

- Desktop
- Laptop
- Tablet
- Mobile

### Responsive Improvements

- Mobile sidebar with clean navigation
- Responsive topbar
- Full-width mobile action buttons
- Scroll-safe matrix tables
- Mobile card layouts for normal tables
- Mobile-friendly modals
- Filter controls fixed for mobile height issues
- Admin dashboard mobile layout polish
- Event management mobile table/card polish
- Reports mobile and tablet cleanup

## 🧭 Navigation Structure

```txt
Dashboard
├── Admin Dashboard
├── Student Dashboard
├── Teacher Dashboard
└── Parent Dashboard

People
├── Students
├── Parents
├── Guardians
└── Teachers

Academic
├── Classes
├── Class Room
├── Subject
├── Class Routine
├── Exam Schedule
├── Grade
├── Subject Group
└── Time Table

Management
├── Fee Groups
├── Fees Collection
├── Library Books
├── Library Members
├── Routes
├── Hostels
├── Sports
└── Events

HRM
├── Staffs
├── Designations
├── Departments
├── Holidays
├── Leave
├── Student Attendance
├── Teacher Attendance
├── Staff Attendance
└── Payroll

Reports
├── Attendance Report
├── Student Attendance Type
├── Daily Attendance
├── Student Day Wise
├── Teacher Day Wise
├── Teacher Report
├── Staff Day Wise
└── Staff Report
```

## ⚙️ Local Setup

### Prerequisites

Make sure you have:

- Node.js
- npm
- Docker Desktop
- PostgreSQL or Docker PostgreSQL
- Git

## 📦 Installation

Clone the repository:

```bash
git clone https://github.com/SithumBuddhika/preskool-erp-angular.git
cd preskool-erp-angular
```

Install dependencies:

```bash
npm install
```

### 🐘 Start PostgreSQL with Docker

```bash
docker compose up -d
```

The Docker setup creates a PostgreSQL database:

```txt
Database: preskool_erp
User: postgres
Password: postgres
Port: 5432
```

---

## 🔐 Environment Variables

Create `.env` files for the backend services as required.

Example:

```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/preskool_erp"

JWT_SECRET="your_jwt_secret_here"
JWT_EXPIRES_IN="1d"

SMTP_HOST="your_smtp_host"
SMTP_PORT="587"
SMTP_USER="your_email_user"
SMTP_PASS="your_email_password"
SMTP_FROM="PreSkool ERP <noreply@preskool.local>"

FRONTEND_URL="http://localhost:4200"
```

> Keep real production secrets out of GitHub.

---

## 🧬 Prisma Setup

Generate Prisma client:

```bash
npx prisma generate
```

Apply schema to the database:

```bash
npx prisma db push
```

Optional Prisma Studio:

```bash
npx prisma studio
```

---

## ▶️ Run the Frontend

```bash
npx nx serve web
```

Frontend runs on:

```txt
http://localhost:4200
```

## ▶️ Run Backend Services

Run Auth Service:

```bash
npx nx serve auth-service
```

Run People Service:

```bash
npx nx serve people-service
```

Run Academic Service:

```bash
npx nx serve academic-service
```

Run API Gateway:

```bash
npx nx serve api-gateway
```

## 🏗️ Build

Build frontend:

```bash
npx nx build web
```

Build backend services:

```bash
npx nx build auth-service
npx nx build people-service
npx nx build academic-service
npx nx build api-gateway
```

---

## 🧪 Useful Nx Commands

View project graph:

```bash
npx nx graph
```

Show project details:

```bash
npx nx show project web
```

Run lint:

```bash
npx nx lint web
```

## 🖼️ Screenshots

### Admin Dashboard

<p align="center">
  <img src="screenshots/admin-dashboard.png" alt="Admin Dashboard" width="100%" />
</p>

### Student Dashboard

<p align="center">
  <img src="screenshots/student-dashboard.png" alt="Student Dashboard" width="100%" />
</p>

### Teacher Dashboard

<p align="center">
  <img src="screenshots/teacher-dashboard.png" alt="Teacher Dashboard" width="100%" />
</p>

### Parent Dashboard

<p align="center">
  <img src="screenshots/parent-dashboard.png" alt="Parent Dashboard" width="100%" />
</p>

### People Management

<p align="center">
  <img src="screenshots/people-management.png" alt="People Management" width="100%" />
</p>

### Academic Management

<p align="center">
  <img src="screenshots/academic-management.png" alt="Academic Management" width="100%" />
</p>

### Management Management

<p align="center">
  <img src="screenshots/management-management.png" alt="Academic Management" width="100%" />
</p>

### HRM Management

<p align="center">
  <img src="screenshots/hrm-management.png" alt="HRM Management" width="100%" />
</p>

### Reports

<p align="center">
  <img src="screenshots/reports.png" alt="Reports Module" width="100%" />
</p>

### Routes Map

<p align="center">
  <img src="screenshots/routes-map.png" alt="Routes Map" width="100%" />
</p>

### Mobile Responsive View

<p align="center">
  <img src="screenshots/mobile-responsive-view.png" alt="Mobile Responsive View 1" width="26%" />
  &nbsp;&nbsp;&nbsp;
  <img src="screenshots/mobile-responsive-view2.png" alt="Mobile Responsive View 2" width="26%" />
</p>

## 🎯 Portfolio Value

This project demonstrates practical skills in:

- Angular enterprise application structure
- Standalone component architecture
- Responsive SCSS design
- NestJS API development
- PostgreSQL database modeling
- Prisma ORM usage
- JWT authentication
- Admin access management
- Dashboard analytics
- CRUD-heavy business modules
- Map integration
- Report generation
- Monorepo project organization
- Full-stack debugging and polish

## 🛠️ Development Approach

PreSkool ERP was developed module-by-module with a focus on:

- Building real workflows instead of static pages
- Matching a polished ERP-style UI
- Keeping forms user-friendly
- Using autocomplete for relational data
- Reducing manual typing mistakes
- Making pages responsive after functionality was completed
- Preparing the project for GitHub portfolio and interview demonstration

## 🚀 Future Improvements

Planned or possible improvements:

- Production deployment
- API gateway routing improvement
- Dockerized backend services
- Role-based dashboard routing
- More advanced RBAC permissions
- Email delivery for production reset / OTP flows
- PDF exports for reports
- More chart visualizations
- Notification center
- Audit logs
- Student / parent portal enhancements
- CI/CD pipeline
- Unit and e2e test expansion

## 🧑‍💻 Developer

**Sithum Buddhika Jayalal**  
Software Engineering undergraduate at **SLIIT**, soon to begin 4th year.

- 🌐 **Portfolio:** [https://sithumjdev.vercel.app](https://sithumjdev.vercel.app)
- 💻 **GitHub:** [https://github.com/SithumBuddhika](https://github.com/SithumBuddhika)
- 🔗 **LinkedIn:** [https://www.linkedin.com/sithumbuddhika](https://www.linkedin.com/sithumbuddhika)

## ⭐ Final Note

**PreSkool ERP** is built as a full-stack learning and portfolio project to demonstrate real-world ERP development skills with a modern **Angular + NestJS + PostgreSQL** stack.

If you find this project useful or interesting, consider giving it a ⭐ on GitHub.

---
