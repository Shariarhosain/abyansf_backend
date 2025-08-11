# 🚀 Abyansf Backend Application

![License](https://img.shields.io/badge/license-ISC-blue.svg)
![Node.js](https://img.shields.io/badge/node-%3E%3D18.0.0-brightgreen.svg)
![PostgreSQL](https://img.shields.io/badge/postgresql-%3E%3D13.0-blue.svg)
![RabbitMQ](https://img.shields.io/badge/rabbitmq-3.8%2B-orange.svg)

A comprehensive Node.js backend application for the Abyansf platform, featuring real-time notifications, image upload services, and microservices architecture with RabbitMQ message broker.

## 📱 App Design Showcase

### Main Screens
<div align="center">
  <img src="docs/images/Main Screen.jpg" alt="Main Screen" width="250" style="margin: 10px;"/>
  <img src="docs/images/Authentication.jpg" alt="Authentication" width="250" style="margin: 10px;"/>
  <img src="docs/images/Profile Pages.jpg" alt="Profile Pages" width="250" style="margin: 10px;"/>
</div>

### Service Screens
<div align="center">
  <img src="docs/images/Restaurants.jpg" alt="Restaurants" width="250" style="margin: 10px;"/>
  <img src="docs/images/Helicopter Tour.jpg" alt="Helicopter Tour" width="250" style="margin: 10px;"/>
  <img src="docs/images/Signle Service page.jpg" alt="Single Service Page" width="250" style="margin: 10px;"/>
</div>

### Onboarding & Forms
<div align="center">
  <img src="docs/images/Splash Screen/Onboarding Screen.jpg" alt="Onboarding Screen" width="250" style="margin: 10px;"/>
  <img src="docs/images/Splash Screen/Onboarding Screen-1.jpg" alt="Onboarding Screen 2" width="250" style="margin: 10px;"/>
  <img src="docs/images/All Form here/Request page.jpg" alt="Request Page" width="250" style="margin: 10px;"/>
</div>

### Typography & Design System
<div align="center">
  <img src="docs/images/Typography.jpg" alt="Typography" width="400" style="margin: 10px;"/>
</div>

## 🎯 App Features Supported by Backend

The backend services power all the features shown in the app designs above:

### 🔐 Authentication System
- **User Registration & Login** - Supports the authentication screens
- **Profile Management** - Powers the profile pages with image uploads
- **Role-based Access** - Admin, User, and Service Provider roles

### 🏢 Service Categories
- **Restaurant Bookings** - API endpoints for restaurant reservations
- **Helicopter Tours** - Booking system for tour packages
- **Service Listings** - Create and manage service offerings
- **Image Gallery** - Multiple image upload for each service

### 📱 Real-time Features
- **Push Notifications** - Booking confirmations and updates
- **Live Chat Support** - Socket.IO powered messaging
- **Status Updates** - Real-time booking status changes

### 🎨 Design System Integration
- **Responsive APIs** - Support for mobile and web interfaces
- **Image Optimization** - Automatic image processing and CDN serving
- **Typography Support** - Consistent API response formatting

## 📱 Frontend to Backend Flow

```mermaid
graph TB
    subgraph "Mobile App Screens"
        Auth[🔐 Authentication Screen]
        Main[🏠 Main Screen]
        Profile[👤 Profile Screen]
        Restaurant[🍽️ Restaurant Screen]
        Helicopter[🚁 Helicopter Tour]
        Service[⚙️ Service Page]
        Request[📝 Request Form]
    end
    
    subgraph "Backend APIs"
        AuthAPI[🔐 Auth API<br/>/api/users/login<br/>/api/users/register]
        ListingAPI[📋 Listing API<br/>/api/listings<br/>/api/categories]
        ProfileAPI[👤 Profile API<br/>/api/users/profile]
        BookingAPI[📅 Booking API<br/>/api/bookings]
        ImageAPI[📸 Image API<br/>/upload]
        NotificationAPI[🔔 Notification API<br/>/api/notifications]
    end
    
    subgraph "Real-time Services"
        Socket[🔌 Socket.IO<br/>Real-time Updates]
        Push[📱 Push Notifications<br/>Firebase FCM]
    end
    
    subgraph "Background Processing"
        RabbitMQ[🐰 RabbitMQ<br/>Message Broker]
        Workers[⚙️ Background Workers]
    end
    
    %% Screen to API connections
    Auth --> AuthAPI
    Main --> ListingAPI
    Profile --> ProfileAPI
    Restaurant --> BookingAPI
    Helicopter --> BookingAPI
    Service --> ImageAPI
    Request --> BookingAPI
    
    %% Real-time connections
    AuthAPI -.-> Socket
    BookingAPI -.-> Socket
    NotificationAPI -.-> Push
    
    %% Background processing
    AuthAPI --> RabbitMQ
    BookingAPI --> RabbitMQ
    RabbitMQ --> Workers
    Workers --> Push
    
    %% Styling
    classDef screen fill:#e3f2fd,stroke:#1976d2
    classDef api fill:#e8f5e8,stroke:#388e3c
    classDef realtime fill:#fff3e0,stroke:#f57c00
    classDef background fill:#f3e5f5,stroke:#7b1fa2
    
    class Auth,Main,Profile,Restaurant,Helicopter,Service,Request screen
    class AuthAPI,ListingAPI,ProfileAPI,BookingAPI,ImageAPI,NotificationAPI api
    class Socket,Push realtime
    class RabbitMQ,Workers background
```

## 🍽️ Restaurant & Tour Booking Flow

This diagram shows how the restaurant and helicopter tour screens connect to the backend:

```mermaid
sequenceDiagram
    participant U as User (Mobile App)
    participant R as Restaurant/Tour Screen
    participant API as Booking API
    participant DB as Database
    participant RMQ as RabbitMQ
    participant Worker as Booking Worker
    participant Notify as Notification Service
    participant Provider as Service Provider

    Note over U,Provider: Complete Booking Flow
    
    U->>R: Browse restaurants/tours
    R->>API: GET /api/listings?category=restaurant
    API->>DB: Query available services
    DB->>API: Return listings with images
    API->>R: Service list with photos
    R->>U: Display services grid
    
    U->>R: Select service & fill form
    R->>API: POST /api/bookings
    API->>DB: Create booking record
    DB->>API: Booking created
    
    API->>RMQ: Publish booking_confirmation
    API->>R: Booking initiated
    R->>U: Show confirmation screen
    
    RMQ->>Worker: Process booking
    Worker->>Notify: Send notifications
    Notify->>U: Push notification
    Notify->>Provider: SMS/Email alert
    
    Worker->>API: Update booking status
    API->>U: Real-time status update
```

## 📸 Image Gallery Integration

Shows how service images from the design screens are handled:

```mermaid
graph LR
    subgraph "Service Provider Flow"
        A[Service Provider] -->|Upload Images| B[Image Service<br/>Port 3200]
        B -->|Process & Store| C[File System<br/>./uploads/]
        B -->|Return URLs| D[Image URLs]
    end
    
    subgraph "Mobile App Display"
        D -->|API Response| E[Restaurant Screen<br/>Image Gallery]
        D -->|API Response| F[Helicopter Tour<br/>Photo Carousel]
        D -->|API Response| G[Service Page<br/>Image Grid]
    end
    
    subgraph "Image Processing"
        B --> H[Validation<br/>Type, Size, Format]
        H --> I[Unique Naming<br/>timestamp-random.jpg]
        I --> J[CDN Ready URLs<br/>localhost:3200/upload/...]
    end
    
    style A fill:#e3f2fd
    style E fill:#e8f5e8
    style F fill:#e8f5e8
    style G fill:#e8f5e8
    style B fill:#fff3e0
```

## 📋 Table of Contents

- [📱 App Design Showcase](#-app-design-showcase)
- [🏗️ Architecture Overview](#-architecture-overview)
- [✨ Features](#-features)
- [🛠️ Tech Stack](#-tech-stack)
- [📐 System Architecture](#-system-architecture)
- [🔄 RabbitMQ Message Flow](#-rabbitmq-message-flow)
- [📸 Image Upload Flow](#-image-upload-flow)
- [⚙️ Installation](#-installation)
- [🚀 Quick Start](#-quick-start)
- [📚 API Documentation](#-api-documentation)
- [🔧 Configuration](#-configuration)
- [🚀 Deployment Guide](#-deployment-guide)
- [🧪 Testing](#-testing)
- [📊 Monitoring](#-monitoring)
- [🛠️ Troubleshooting](#-troubleshooting)
- [📝 Contributing](#-contributing)

## 🏗️ Architecture Overview

This application follows a microservices architecture with three main services:

1. **Main Backend Service** (Port 3000) - Core API and real-time notifications
2. **Image Upload Service** (Port 3200) - Dedicated image processing and storage
3. **RabbitMQ Worker Service** - Background job processing

```mermaid
graph TB
    subgraph "Client Applications"
        Mobile[📱 Mobile App<br/>Flutter/React Native]
        Web[🌐 Web Application<br/>React/Vue/Angular]
        Admin[👨‍💼 Admin Dashboard]
    end
    
    subgraph "API Gateway & Load Balancer"
        Nginx[⚖️ Nginx<br/>Reverse Proxy<br/>SSL Termination]
    end
    
    subgraph "Backend Services"
        MainAPI[🎯 Main Backend API<br/>Port: 3000<br/>Express.js + Socket.IO]
        ImageAPI[📸 Image Upload Service<br/>Port: 3200<br/>Express.js + Multer]
    end
    
    subgraph "Message Broker System"
        RabbitMQ[🐰 RabbitMQ Server<br/>Port: 5672<br/>Message Broker]
        
        subgraph "Worker Processes"
            FirebaseWorker[🔥 Firebase Worker<br/>User Management]
            UserWorker[👤 User Worker<br/>Profile Updates]
            BookingWorker[📅 Booking Worker<br/>Confirmations]
            EventWorker[🎉 Event Worker<br/>Event Management]
            NotificationWorker[🔔 Notification Worker<br/>Push Notifications]
        end
    end
    
    subgraph "Data Storage"
        PostgreSQL[(🗄️ PostgreSQL<br/>Primary Database<br/>Users, Bookings, etc.)]
        Redis[(⚡ Redis<br/>Cache & Sessions)]
        FileSystem[📁 File System<br/>Image Storage<br/>./uploads/)]
    end
    
    subgraph "External Services"
        Firebase[🔥 Firebase<br/>Push Notifications<br/>User Authentication]
        EmailSvc[📧 Email Service<br/>SMTP/SendGrid]
        SMS[📱 SMS Service<br/>Twilio/AWS SNS]
        PaymentGW[💳 Payment Gateway<br/>Stripe/PayPal]
    end
    
    %% Client connections
    Mobile -.->|HTTPS/WSS| Nginx
    Web -.->|HTTPS/WSS| Nginx
    Admin -.->|HTTPS/WSS| Nginx
    
    %% Load balancer routing
    Nginx -->|API Requests| MainAPI
    Nginx -->|Image Uploads| ImageAPI
    Nginx -->|WebSocket| MainAPI
    
    %% Service to database connections
    MainAPI -->|Read/Write| PostgreSQL
    MainAPI -->|Cache| Redis
    ImageAPI -->|Store Files| FileSystem
    
    %% Message broker connections
    MainAPI -->|Publish Tasks| RabbitMQ
    ImageAPI -->|Publish Tasks| RabbitMQ
    
    RabbitMQ -->|Consume| FirebaseWorker
    RabbitMQ -->|Consume| UserWorker
    RabbitMQ -->|Consume| BookingWorker
    RabbitMQ -->|Consume| EventWorker
    RabbitMQ -->|Consume| NotificationWorker
    
    %% Worker connections
    FirebaseWorker -->|Read/Write| PostgreSQL
    UserWorker -->|Read/Write| PostgreSQL
    BookingWorker -->|Read/Write| PostgreSQL
    EventWorker -->|Read/Write| PostgreSQL
    NotificationWorker -->|Read/Write| PostgreSQL
    
    %% External service connections
    FirebaseWorker -->|API Calls| Firebase
    NotificationWorker -->|Send Push| Firebase
    NotificationWorker -->|Send Email| EmailSvc
    NotificationWorker -->|Send SMS| SMS
    BookingWorker -->|Process Payment| PaymentGW
    
    %% Real-time connections (dashed lines for WebSocket)
    MainAPI -.->|Real-time Events| Mobile
    MainAPI -.->|Real-time Events| Web
    MainAPI -.->|Real-time Events| Admin
    
    classDef client fill:#e3f2fd,stroke:#1976d2
    classDef service fill:#e8f5e8,stroke:#388e3c
    classDef data fill:#f3e5f5,stroke:#7b1fa2
    classDef external fill:#fff3e0,stroke:#f57c00
    classDef worker fill:#e0f2f1,stroke:#00695c
    
    class Mobile,Web,Admin client
    class MainAPI,ImageAPI,Nginx service
    class PostgreSQL,Redis,FileSystem data
    class Firebase,EmailSvc,SMS,PaymentGW external
    class FirebaseWorker,UserWorker,BookingWorker,EventWorker,NotificationWorker worker
```

## ✨ Features

### 🔐 Authentication & Authorization
- JWT-based authentication
- Role-based access control (USER, ADMIN, SUPER_ADMIN)
- Firebase integration for user management
- Email verification system

### 📱 Real-time Notifications
- Socket.IO integration for live updates
- Push notifications via Firebase
- Unread notification counts
- Role-based notification targeting

### 📸 Image Management
- Multi-file upload support
- Image compression and optimization
- CDN-ready file serving
- Automatic file cleanup

### 🏢 Business Logic
- Category and subcategory management
- Listing and booking systems
- Event management
- Highlight content management

### 🔄 Message Queue Processing
- Asynchronous task processing
- Firebase operations
- Email notifications
- Booking confirmations

## 🛠️ Tech Stack

| Technology | Purpose | Version |
|------------|---------|---------|
| **Node.js** | Runtime Environment | 18+ |
| **Express.js** | Web Framework | 5.1.0 |
| **Prisma** | Database ORM | 6.10.1 |
| **PostgreSQL** | Primary Database | 13+ |
| **RabbitMQ** | Message Broker | Latest |
| **Socket.IO** | Real-time Communication | 4.8.1 |
| **Firebase Admin** | Push Notifications | Latest |
| **Multer** | File Upload | 2.0.1 |
| **JWT** | Authentication | 9.0.2 |

## 📐 System Architecture

### Service Communication Flow

```mermaid
sequenceDiagram
    participant C as Client
    participant B as Backend Service
    participant I as Image Service
    participant R as RabbitMQ
    participant W as Workers
    participant F as Firebase
    participant D as Database

    Note over C,D: User Registration Flow
    C->>B: POST /api/users/register
    B->>D: Store user data
    B->>R: Publish firebase_task
    R->>W: Consume registration task
    W->>F: Create Firebase user
    W->>B: Update user status
    B->>C: Registration complete

    Note over C,D: Image Upload Flow
    C->>I: POST /upload
    I->>I: Process & store image
    I->>C: Return image URL
    C->>B: Use image URL in listing
    B->>D: Store listing with image URL
```

## 🔄 RabbitMQ Message Flow

### Queue Architecture

The application uses RabbitMQ for asynchronous processing with the following queues:

#### 1. Firebase Tasks Queue
```javascript
Queue: 'firebase_tasks'
Purpose: Firebase user management operations
```

#### 2. User Tasks Queue
```javascript
Queue: 'user_tasks'
Purpose: User-related background processing
```

#### 3. Booking Tasks Queue
```javascript
Queue: 'booking_tasks'
Purpose: Booking confirmations and notifications
```

#### 4. Notification Tasks Queue
```javascript
Queue: 'notification_tasks'
Purpose: Push notifications and email alerts
```

### Message Flow Diagram

```mermaid
graph LR
    A[Client Request] --> B[Backend API]
    B --> C{Task Type?}
    
    C -->|User Registration| D[Firebase Queue]
    C -->|Booking Created| E[Booking Queue]
    C -->|Send Notification| F[Notification Queue]
    C -->|User Update| G[User Queue]
    
    D --> H[Firebase Worker]
    E --> I[Booking Worker]
    F --> J[Notification Worker]
    G --> K[User Worker]
    
    H --> L[Firebase Admin SDK]
    I --> M[Database Update]
    J --> N[Push Notification]
    K --> O[User Profile Update]
    
    L --> P[Response/Callback]
    M --> P
    N --> P
    O --> P
```

### Worker Processing Flow

```mermaid
flowchart TD
    Start([Message Received]) --> Parse[Parse Message Content]
    Parse --> Validate{Valid Message?}
    Validate -->|No| Reject[Reject Message]
    Validate -->|Yes| Process{Process Type?}
    
    Process -->|Firebase| FB[Firebase Operations]
    Process -->|User| User[User Operations]
    Process -->|Booking| Book[Booking Operations]
    Process -->|Notification| Notif[Notification Operations]
    
    FB --> FBOps[Create/Update/Delete User]
    User --> UserOps[Profile Updates]
    Book --> BookOps[Booking Confirmations]
    Notif --> NotifOps[Send Push/Email]
    
    FBOps --> Success{Success?}
    UserOps --> Success
    BookOps --> Success
    NotifOps --> Success
    
    Success -->|Yes| Ack[Acknowledge Message]
    Success -->|No| Retry{Retry Count < 3?}
    
    Retry -->|Yes| Delay[Wait & Retry]
    Retry -->|No| DLQ[Dead Letter Queue]
    
    Delay --> Process
    Ack --> End([Complete])
    DLQ --> End
    Reject --> End
```

### How to Publish Messages

```javascript
import amqp from 'amqplib';

class MessagePublisher {
  constructor() {
    this.connection = null;
    this.channel = null;
  }

  async connect() {
    this.connection = await amqp.connect(RABBITMQ_URL);
    this.channel = await this.connection.createChannel();
  }

  async publishFirebaseTask(task) {
    const message = {
      type: task.type,
      ...task.data,
      timestamp: new Date().toISOString()
    };

    await this.channel.assertQueue('firebase_tasks', { durable: true });
    this.channel.sendToQueue(
      'firebase_tasks',
      Buffer.from(JSON.stringify(message)),
      { persistent: true }
    );
  }

  async publishUserTask(task) {
    const message = {
      type: task.type,
      ...task.data,
      timestamp: new Date().toISOString()
    };

    await this.channel.assertQueue('user_tasks', { durable: true });
    this.channel.sendToQueue(
      'user_tasks',
      Buffer.from(JSON.stringify(message)),
      { persistent: true }
    );
  }
}
```

### Worker Implementation Example

```javascript
// Firebase Worker
async function startFirebaseWorker(connection) {
  const channel = await connection.createChannel();
  await channel.assertQueue('firebase_tasks', { durable: true });

  console.log(`[✅] FirebaseWorker listening on queue: firebase_tasks`);

  channel.consume('firebase_tasks', async (msg) => {
    if (msg !== null) {
      const task = JSON.parse(msg.content.toString());
      console.log('[📩 Firebase Task Received]:', task);

      try {
        let result;
        switch (task.type) {
          case 'register':
            result = await authService.register(
              task.email, 
              task.password, 
              task.displayName
            );
            break;
          case 'resetPassword':
            result = await authService.resetPassword(
              task.uid, 
              task.newPassword
            );
            break;
          case 'deleteUser':
            result = await authService.deleteUser(task.uid);
            break;
          default:
            throw new Error('Unknown task type');
        }
        
        console.log('[✅ Firebase Task Result]:', result);
        channel.ack(msg);
      } catch (error) {
        console.error('[❌ Firebase Task Error]:', error);
        channel.nack(msg, false, false); // Send to DLQ
      }
    }
  });
}
```

## 📸 Image Upload Flow

### Image Service Architecture

```mermaid
graph TB
    Client[Client App] -->|POST /upload| Upload[Image Upload Endpoint]
    Upload --> Validate[File Validation]
    Validate --> Process[Image Processing]
    Process --> Store[Local Storage]
    Store --> URL[Generate URL]
    URL --> Response[Return Response]
    
    Validate -->|Invalid| Error[Error Response]
    
    subgraph "File Processing"
        Process --> Rename[Generate Unique Name]
        Rename --> Compress[Compress if needed]
        Compress --> Save[Save to Disk]
    end
    
    subgraph "URL Generation"
        URL --> BaseURL[Base URL + Filename]
        BaseURL --> CDN[CDN Ready URL]
    end
```

### Image Upload Workflow

```mermaid
sequenceDiagram
    participant C as Client
    participant I as Image Service
    participant FS as File System
    participant DB as Database (via Main API)

    Note over C,DB: Single Image Upload
    C->>I: POST /upload-single
    I->>I: Validate file type/size
    I->>FS: Save with unique name
    FS->>I: Return file path
    I->>C: Return image URL

    Note over C,DB: Multiple Images Upload
    C->>I: POST /upload (main_image + sub_images)
    I->>I: Process main image
    I->>FS: Save main image
    loop For each sub image
        I->>FS: Save sub image
    end
    I->>C: Return all image URLs

    Note over C,DB: Use in Listing Creation
    C->>DB: POST /api/listings (with image URLs)
    DB->>DB: Store listing with image references
```

### Image Service Endpoints

| Endpoint | Method | Description | Request Body |
|----------|--------|-------------|--------------|
| `/upload-single` | POST | Single file upload | FormData with 'image' field |
| `/upload` | POST | Multiple files upload | FormData with 'main_image' and 'sub_images' |
| `/upload/:filename` | GET | Serve specific image | - |
| `/images` | GET | List all images | - |
| `/images/search/:filename` | GET | Search for specific image | - |
| `/delete/:filename` | DELETE | Delete specific image | - |

### File Upload Configuration

```javascript
// Multer Configuration
const storage = multer.diskStorage({
  destination: './uploads',
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

// File size limit: 200MB
// Supported formats: JPG, JPEG, PNG, GIF, WEBP
const upload = multer({
  storage: storage,
  limits: { fileSize: 200 * 1024 * 1024 }, // 200MB
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type'), false);
    }
  }
});
```

### Usage Examples

#### Single Image Upload
```javascript
const formData = new FormData();
formData.append('image', file);

const response = await fetch('http://localhost:3200/upload-single', {
    method: 'POST',
    body: formData
});

const result = await response.json();
// Returns: { success: true, file: { url: "...", filename: "...", size: ... } }
```

#### Multiple Images Upload
```javascript
const formData = new FormData();
formData.append('main_image', mainImageFile);
formData.append('sub_images', subImage1);
formData.append('sub_images', subImage2);

const response = await fetch('http://localhost:3200/upload', {
    method: 'POST',
    body: formData
});

const result = await response.json();
// Returns: { success: true, main_image: {...}, sub_images: [...] }
```

## ⚙️ Installation

### Prerequisites

- Node.js 18+
- PostgreSQL 13+
- RabbitMQ Server
- Redis (optional, for caching)

### 1. Clone the Repository

```bash
git clone https://github.com/your-username/abyansf_backend.git
cd abyansf_backend
```

### 2. Install Dependencies

```bash
# Install backend dependencies
cd backend_branch_folder
npm install

# Install image service dependencies
cd ../img_branch_folder
npm install

# Install RabbitMQ worker dependencies
cd ../rabbitmq_branch_folder
npm install
```

### 3. Environment Setup

Create `.env` files in each service directory:

#### Backend Service (.env)
```env
# Database
DATABASE_URL="postgresql://username:password@localhost:5432/abyansf_db"

# JWT
SECRET_CODE="your-jwt-secret-key"

# Server
PORT=3000

# Firebase Admin
FIREBASE_PROJECT_ID="your-firebase-project"
FIREBASE_CLIENT_EMAIL="your-service-account-email"
FIREBASE_PRIVATE_KEY="your-private-key"

# RabbitMQ
RABBITMQ_URL="amqp://localhost:5672"
```

#### Image Service (.env)
```env
PORT=3200
BASE_URL="http://localhost:3200"
```

#### RabbitMQ Service (.env)
```env
RABBITMQ_URL="amqp://localhost:5672"
DATABASE_URL="postgresql://username:password@localhost:5432/abyansf_db"
```

### 4. Database Setup

```bash
cd backend_branch_folder
npx prisma migrate dev
npx prisma generate
```

## 🚀 Quick Start

### Start All Services

#### 1. Start RabbitMQ Server
```bash
# Using Docker
docker run -d --hostname rabbitmq --name rabbitmq -p 5672:5672 -p 15672:15672 rabbitmq:3-management

# Or using local installation
rabbitmq-server
```

#### 2. Start PostgreSQL
```bash
# Using Docker
docker run -d --name postgres -e POSTGRES_PASSWORD=password -p 5432:5432 postgres:13

# Or use your local PostgreSQL installation
```

#### 3. Start Backend Services

```bash
# Terminal 1: Main Backend Service
cd backend_branch_folder
npm run dev

# Terminal 2: Image Upload Service
cd img_branch_folder
npm start

# Terminal 3: RabbitMQ Workers
cd rabbitmq_branch_folder
npm start
```

### Verify Installation

1. **Backend API**: http://localhost:3000
2. **Image Service**: http://localhost:3200
3. **RabbitMQ Management**: http://localhost:15672 (guest/guest)

## 📚 API Documentation

### Base URLs

- **Main Backend**: `http://localhost:3000`
- **Image Service**: `http://localhost:3200`

### Authentication

Most endpoints require JWT authentication. Include the token in the Authorization header:

```
Authorization: Bearer <your-jwt-token>
```

### API Endpoints

#### 🔐 Authentication

##### Register User
```http
POST /api/users/register
Content-Type: application/json

{
    "name": "John Doe",
    "email": "john@example.com",
    "password": "password123",
    "whatsapp": "+1234567890"
}
```

##### Login User
```http
POST /api/users/login
Content-Type: application/json

{
    "email": "john@example.com",
    "password": "password123"
}
```

#### 👤 User Management

##### Get User Profile
```http
GET /api/users/profile
Authorization: Bearer <token>
```

##### Update User Profile
```http
PUT /api/users/profile
Authorization: Bearer <token>
Content-Type: application/json

{
    "name": "John Updated",
    "address": "New Address"
}
```

#### 📂 Categories

##### List Categories
```http
GET /api/categories
```

##### Create Category
```http
POST /api/categories
Authorization: Bearer <token>
Content-Type: application/json

{
    "name": "New Category"
}
```

#### 📋 Listings

##### List Listings
```http
GET /api/listings?page=1&limit=10&category=1
```

##### Create Listing
```http
POST /api/listings
Authorization: Bearer <token>
Content-Type: application/json

{
    "title": "Amazing Service",
    "description": "Service description",
    "price": 99.99,
    "main_image": "http://localhost:3200/upload/image1.jpg",
    "sub_images": ["http://localhost:3200/upload/image2.jpg"],
    "subCategoryId": 1,
    "location": "Dubai",
    "contact_info": "+1234567890"
}
```

#### 📅 Bookings

##### Create Booking
```http
POST /api/bookings
Authorization: Bearer <token>
Content-Type: application/json

{
    "listingId": "listing-id",
    "booking_date": "2025-01-15T10:00:00Z",
    "notes": "Special requirements"
}
```

##### List User Bookings
```http
GET /api/bookings
Authorization: Bearer <token>
```

#### 🔔 Notifications

##### Get Notifications
```http
GET /api/notifications?page=1&limit=20
Authorization: Bearer <token>
```

##### Mark as Read
```http
PATCH /api/notifications/:id/read
Authorization: Bearer <token>
```

#### 📸 Image Upload (Port 3200)

##### Single Image Upload
```http
POST http://localhost:3200/upload-single
Content-Type: multipart/form-data

{
    "image": <file>
}
```

##### Multiple Images Upload
```http
POST http://localhost:3200/upload
Content-Type: multipart/form-data

{
    "main_image": <file>,
    "sub_images": <file[]>
}
```

##### List Images
```http
GET http://localhost:3200/images
```

##### Delete Image
```http
DELETE http://localhost:3200/delete/:filename
```

### Socket.IO Events

#### Connection & Authentication

```javascript
const socket = io('http://localhost:3000');

// Authenticate
socket.emit('authenticate', { token: 'your-jwt-token' });

// Listen for authentication success
socket.on('authenticated', (data) => {
    console.log('Connected as:', data.userId, data.role);
});
```

#### Real-time Events

```javascript
// Unread notification count updates
socket.on('unread_count_update', (data) => {
    console.log('Unread count:', data.unreadCount);
});

// New notifications
socket.on('new_notification', (notification) => {
    console.log('New notification:', notification);
});

// Booking updates
socket.on('booking_update', (booking) => {
    console.log('Booking updated:', booking);
});
```

### Error Responses

All endpoints return errors in this format:

```json
{
    "success": false,
    "error": "Error message description",
    "statusCode": 400
}
```

Common status codes:
- `400` - Bad Request (validation errors)
- `401` - Unauthorized (missing/invalid token)
- `403` - Forbidden (insufficient permissions)
- `404` - Not Found
- `500` - Internal Server Error

### Success Responses

Success responses follow this format:

```json
{
    "success": true,
    "data": { ... },
    "message": "Operation completed successfully"
}
```

## � Deployment Guide

### Quick Deployment Checklist

- [ ] PostgreSQL Database Setup
- [ ] RabbitMQ Server Installation
- [ ] Environment Variables Configuration
- [ ] Database Migration
- [ ] Service Dependencies Installation
- [ ] Service Startup
- [ ] Health Check Verification

### Prerequisites

#### System Requirements

- **Node.js**: 18.0 or higher
- **PostgreSQL**: 13.0 or higher
- **RabbitMQ**: 3.8 or higher
- **RAM**: Minimum 4GB, Recommended 8GB
- **Storage**: Minimum 20GB free space
- **OS**: Ubuntu 20.04 LTS, CentOS 8, or similar

### Local Development Setup

#### 1. Clone Repository

```bash
git clone https://github.com/MTS-Services/abyansf_backend.git
cd abyansf_backend
```

#### 2. Install Dependencies

```bash
# Backend Service
cd backend_branch_folder
npm install

# Image Service
cd ../img_branch_folder
npm install

# RabbitMQ Workers
cd ../rabbitmq_branch_folder
npm install
```

#### 3. Database Setup

##### Install PostgreSQL

```bash
# Ubuntu/Debian
sudo apt update
sudo apt install postgresql postgresql-contrib

# Start PostgreSQL service
sudo systemctl start postgresql
sudo systemctl enable postgresql

# Create database and user
sudo -u postgres psql
CREATE DATABASE abyansf_db;
CREATE USER abyansf_user WITH PASSWORD 'your_password';
GRANT ALL PRIVILEGES ON DATABASE abyansf_db TO abyansf_user;
\q
```

#### 4. RabbitMQ Setup

##### Install RabbitMQ

```bash
# Ubuntu/Debian
sudo apt install rabbitmq-server

# Start RabbitMQ service
sudo systemctl start rabbitmq-server
sudo systemctl enable rabbitmq-server

# Enable management plugin
sudo rabbitmq-plugins enable rabbitmq_management

# Create admin user
sudo rabbitmqctl add_user admin admin123
sudo rabbitmqctl set_user_tags admin administrator
sudo rabbitmqctl set_permissions -p / admin ".*" ".*" ".*"
```

#### 5. Environment Configuration

##### Backend Service (.env)

```env
# Database Configuration
DATABASE_URL="postgresql://abyansf_user:your_password@localhost:5432/abyansf_db"

# JWT Configuration
SECRET_CODE="your-super-secret-jwt-key-min-32-characters"

# Server Configuration
PORT=3000
NODE_ENV=development

# Firebase Configuration
FIREBASE_PROJECT_ID="your-firebase-project-id"
FIREBASE_CLIENT_EMAIL="your-service-account@project.iam.gserviceaccount.com"
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYOUR_PRIVATE_KEY\n-----END PRIVATE KEY-----\n"

# RabbitMQ Configuration
RABBITMQ_URL="amqp://admin:admin123@localhost:5672"

# Email Configuration (optional)
SMTP_HOST="smtp.gmail.com"
SMTP_PORT=587
SMTP_USER="your-email@gmail.com"
SMTP_PASS="your-app-password"
```

##### Image Service (.env)

```env
# Server Configuration
PORT=3200
NODE_ENV=development

# Base URL for image serving
BASE_URL="http://localhost:3200"

# Upload Configuration
MAX_FILE_SIZE=209715200  # 200MB
UPLOAD_DIR="./uploads"
```

##### RabbitMQ Workers (.env)

```env
# RabbitMQ Configuration
RABBITMQ_URL="amqp://admin:admin123@localhost:5672"

# Database Configuration
DATABASE_URL="postgresql://abyansf_user:your_password@localhost:5432/abyansf_db"

# Firebase Configuration (same as backend)
FIREBASE_PROJECT_ID="your-firebase-project-id"
FIREBASE_CLIENT_EMAIL="your-service-account@project.iam.gserviceaccount.com"
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYOUR_PRIVATE_KEY\n-----END PRIVATE KEY-----\n"
```

#### 6. Database Migration

```bash
cd backend_branch_folder

# Generate Prisma client
npx prisma generate

# Run migrations
npx prisma migrate dev --name init

# Seed database (optional)
npx prisma db seed
```

#### 7. Start Services

##### Option 1: Manual Start (Development)

```bash
# Terminal 1: RabbitMQ Workers
cd rabbitmq_branch_folder
npm start

# Terminal 2: Image Service
cd img_branch_folder
npm start

# Terminal 3: Main Backend
cd backend_branch_folder
npm run dev
```

##### Option 2: Using PM2 (Production-like)

```bash
# Install PM2 globally
npm install -g pm2

# Create ecosystem.config.js in root
# Start all services
pm2 start ecosystem.config.js

# Monitor services
pm2 monit

# View logs
pm2 logs

# Stop all services
pm2 stop all
```

Create `ecosystem.config.js` in the root:

```javascript
module.exports = {
  apps: [
    {
      name: 'abyansf-backend',
      cwd: './backend_branch_folder',
      script: 'src/app.js',
      env: {
        NODE_ENV: 'development'
      },
      env_production: {
        NODE_ENV: 'production'
      }
    },
    {
      name: 'abyansf-images',
      cwd: './img_branch_folder',
      script: 'server.js',
      env: {
        NODE_ENV: 'development'
      },
      env_production: {
        NODE_ENV: 'production'
      }
    },
    {
      name: 'abyansf-workers',
      cwd: './rabbitmq_branch_folder',
      script: 'rabbitmq.js',
      env: {
        NODE_ENV: 'development'
      },
      env_production: {
        NODE_ENV: 'production'
      }
    }
  ]
};
```

### Production Deployment

#### Docker Deployment

Create `docker-compose.yml`:

```yaml
version: '3.8'

services:
  postgres:
    image: postgres:13
    environment:
      POSTGRES_DB: abyansf_db
      POSTGRES_USER: abyansf_user
      POSTGRES_PASSWORD: ${DB_PASSWORD}
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data

  rabbitmq:
    image: rabbitmq:3-management
    environment:
      RABBITMQ_DEFAULT_USER: admin
      RABBITMQ_DEFAULT_PASS: ${RABBITMQ_PASSWORD}
    ports:
      - "5672:5672"
      - "15672:15672"
    volumes:
      - rabbitmq_data:/var/lib/rabbitmq

  redis:
    image: redis:6-alpine
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data

  backend:
    build:
      context: ./backend_branch_folder
      dockerfile: Dockerfile
    ports:
      - "3000:3000"
    environment:
      - DATABASE_URL=postgresql://abyansf_user:${DB_PASSWORD}@postgres:5432/abyansf_db
      - RABBITMQ_URL=amqp://admin:${RABBITMQ_PASSWORD}@rabbitmq:5672
      - REDIS_URL=redis://redis:6379
    depends_on:
      - postgres
      - rabbitmq
      - redis

  image-service:
    build:
      context: ./img_branch_folder
      dockerfile: Dockerfile
    ports:
      - "3200:3200"
    volumes:
      - ./uploads:/app/uploads

  workers:
    build:
      context: ./rabbitmq_branch_folder
      dockerfile: Dockerfile
    environment:
      - DATABASE_URL=postgresql://abyansf_user:${DB_PASSWORD}@postgres:5432/abyansf_db
      - RABBITMQ_URL=amqp://admin:${RABBITMQ_PASSWORD}@rabbitmq:5672
    depends_on:
      - postgres
      - rabbitmq

volumes:
  postgres_data:
  rabbitmq_data:
  redis_data:
```

Deploy with Docker Compose:

```bash
# Create .env file for Docker Compose
echo "DB_PASSWORD=your_secure_password" > .env
echo "RABBITMQ_PASSWORD=your_rabbitmq_password" >> .env

# Build and start services
docker-compose up --build -d

# Run database migrations
docker-compose exec backend npx prisma migrate deploy

# Check service status
docker-compose ps
```

### Verification Steps

1. **Backend API**: http://localhost:3000
2. **Image Service**: http://localhost:3200
3. **RabbitMQ Management**: http://localhost:15672 (guest/guest)

#### Health Check

```bash
# Test main API
curl http://localhost:3000/api/users

# Test image upload
curl -X POST -F "image=@test.jpg" http://localhost:3200/upload-single

# Check RabbitMQ management interface
open http://localhost:15672
```

## 🧪 Testing

### API Testing with Postman

Import the provided Postman collection:
- `Highlight_API_Postman_Collection.json`

### Manual Testing

```bash
# Test main API
curl http://localhost:3000/api/users

# Test image upload
curl -X POST -F "image=@test.jpg" http://localhost:3200/upload-single

# Test RabbitMQ (check management UI)
open http://localhost:15672
```

### Automated Testing

```bash
# Run tests (when implemented)
npm test
```

## 📝 Contributing

### Development Workflow

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Code Style

- Use ESLint configuration
- Follow Prettier formatting
- Write meaningful commit messages
- Add JSDoc comments for functions

### Pull Request Guidelines

- Include description of changes
- Add tests for new features
- Update documentation
- Ensure all tests pass

## 📊 Monitoring

### Health Check Endpoints

Add to your backend service:

```javascript
app.get('/health', (req, res) => {
    res.json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        services: {
            database: 'connected',
            rabbitmq: 'connected',
            redis: 'connected'
        }
    });
});
```

### Monitoring with PM2

```bash
# Monitor all processes
pm2 monit

# Setup log rotation
pm2 install pm2-logrotate

# Setup startup script
pm2 startup
pm2 save

# Check status
pm2 status
```

### Database Backup

```bash
#!/bin/bash
# backup.sh
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/backup"
DB_NAME="abyansf_db"

# Create backup
pg_dump -h localhost -U abyansf_user $DB_NAME > $BACKUP_DIR/backup_$DATE.sql

# Keep only last 7 days
find $BACKUP_DIR -name "backup_*.sql" -mtime +7 -delete
```

## 🛠️ Troubleshooting

### Common Issues

#### 1. Database Connection Failed

```bash
# Check PostgreSQL status
sudo systemctl status postgresql

# Check connection
psql -h localhost -U abyansf_user -d abyansf_db

# Reset password
sudo -u postgres psql
ALTER USER abyansf_user PASSWORD 'new_password';
```

#### 2. RabbitMQ Connection Issues

```bash
# Check RabbitMQ status
sudo systemctl status rabbitmq-server

# Check management interface
curl http://localhost:15672

# Reset admin user
sudo rabbitmqctl delete_user admin
sudo rabbitmqctl add_user admin new_password
sudo rabbitmqctl set_user_tags admin administrator
```

#### 3. Port Already in Use

```bash
# Find process using port
lsof -i :3000
lsof -i :3200

# Kill process
kill -9 <PID>
```

#### 4. Permission Issues

```bash
# Fix upload directory permissions
sudo chown -R $USER:$USER uploads/
chmod 755 uploads/

# Fix log file permissions
sudo chown -R $USER:$USER logs/
```

### Log Locations

- **PM2 Logs**: `~/.pm2/logs/`
- **System Logs**: `/var/log/`
- **Application Logs**: `./logs/` (if configured)
- **Nginx Logs**: `/var/log/nginx/`

### Performance Monitoring

```bash
# Server resources
htop
iostat -x 1
free -h

# Application metrics
pm2 monit

# Database performance
sudo -u postgres psql -c "SELECT * FROM pg_stat_activity;"
```

### Security Checklist

- [ ] Change default passwords
- [ ] Enable firewall (ufw/iptables)
- [ ] Setup SSL certificates
- [ ] Configure CORS properly
- [ ] Enable rate limiting
- [ ] Setup log monitoring
- [ ] Regular security updates
- [ ] Backup encryption
- [ ] Environment variable security
- [ ] File upload restrictions

## 📞 Support

For support and questions:

- **Documentation**: Check the `/docs` folder
- **Issues**: Create a GitHub issue
- **Email**: support@abyansf.com

## 📄 License

This project is licensed under the ISC License - see the LICENSE file for details.

---

Made with ❤️ by the Abyansf Team
