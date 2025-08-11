# 🔄 Complete System Flow Diagram

## Full Application Flow

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
    
    subgraph "Monitoring & Logging"
        Prometheus[📊 Prometheus<br/>Metrics Collection]
        Grafana[📈 Grafana<br/>Dashboards]
        ELK[📝 ELK Stack<br/>Log Management]
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
    
    %% Monitoring connections
    MainAPI -.->|Metrics| Prometheus
    ImageAPI -.->|Metrics| Prometheus
    PostgreSQL -.->|Metrics| Prometheus
    Redis -.->|Metrics| Prometheus
    RabbitMQ -.->|Metrics| Prometheus
    
    MainAPI -.->|Logs| ELK
    ImageAPI -.->|Logs| ELK
    FirebaseWorker -.->|Logs| ELK
    
    Prometheus -->|Visualize| Grafana
    
    classDef client fill:#e3f2fd,stroke:#1976d2
    classDef service fill:#e8f5e8,stroke:#388e3c
    classDef data fill:#f3e5f5,stroke:#7b1fa2
    classDef external fill:#fff3e0,stroke:#f57c00
    classDef monitor fill:#ffebee,stroke:#d32f2f
    classDef worker fill:#e0f2f1,stroke:#00695c
    
    class Mobile,Web,Admin client
    class MainAPI,ImageAPI,Nginx service
    class PostgreSQL,Redis,FileSystem data
    class Firebase,EmailSvc,SMS,PaymentGW external
    class Prometheus,Grafana,ELK monitor
    class FirebaseWorker,UserWorker,BookingWorker,EventWorker,NotificationWorker worker
```

## User Registration & Authentication Flow

```mermaid
sequenceDiagram
    participant U as User (Mobile/Web)
    participant N as Nginx
    participant API as Main Backend
    participant DB as PostgreSQL
    participant RMQ as RabbitMQ
    participant FW as Firebase Worker
    participant FB as Firebase Service
    participant Socket as Socket.IO

    Note over U,Socket: User Registration Flow
    
    U->>N: POST /api/users/register
    N->>API: Forward request
    API->>API: Validate input data
    API->>DB: Store user data (pending)
    DB->>API: User created with temp status
    
    API->>RMQ: Publish firebase_task (register)
    API->>U: Registration initiated
    
    RMQ->>FW: Consume registration task
    FW->>FB: Create Firebase user
    FB->>FW: User created successfully
    FW->>DB: Update user status (active)
    FW->>Socket: Emit user_activated event
    
    Socket->>U: Real-time notification (registration complete)
    
    Note over U,Socket: User Login Flow
    
    U->>N: POST /api/users/login
    N->>API: Forward request
    API->>DB: Verify credentials
    DB->>API: User authenticated
    API->>API: Generate JWT token
    API->>U: Return token + user data
    
    U->>Socket: Connect with JWT token
    Socket->>API: Verify token
    API->>Socket: Token valid
    Socket->>U: Connected & authenticated
```

## Image Upload & Listing Creation Flow

```mermaid
sequenceDiagram
    participant U as User
    participant N as Nginx
    participant IMG as Image Service
    participant FS as File System
    participant API as Main Backend
    participant DB as PostgreSQL
    participant RMQ as RabbitMQ
    participant NW as Notification Worker
    participant Socket as Socket.IO

    Note over U,Socket: Image Upload & Listing Creation
    
    U->>N: POST /upload (main_image + sub_images)
    N->>IMG: Forward to image service
    IMG->>IMG: Validate files (type, size)
    IMG->>FS: Save images with unique names
    FS->>IMG: Files saved successfully
    IMG->>U: Return image URLs
    
    U->>N: POST /api/listings (with image URLs)
    N->>API: Forward request
    API->>API: Validate listing data
    API->>DB: Create listing record
    DB->>API: Listing created
    
    API->>RMQ: Publish notification_task (new listing)
    API->>U: Listing created successfully
    
    RMQ->>NW: Consume notification task
    NW->>DB: Get admin users
    NW->>Socket: Emit new_listing event to admins
    Socket->>Admin: Real-time notification
    
    NW->>NW: Send email to relevant users
    NW->>API: Notification task completed
```

## Booking Process Flow

```mermaid
sequenceDiagram
    participant U as User
    participant N as Nginx
    participant API as Main Backend
    participant DB as PostgreSQL
    participant RMQ as RabbitMQ
    participant BW as Booking Worker
    participant PG as Payment Gateway
    participant NW as Notification Worker
    participant Socket as Socket.IO
    participant Email as Email Service

    Note over U,Email: Complete Booking Flow
    
    U->>N: POST /api/bookings
    N->>API: Forward booking request
    API->>DB: Check listing availability
    DB->>API: Listing available
    
    API->>DB: Create booking (pending)
    DB->>API: Booking created
    API->>RMQ: Publish booking_task (confirmation)
    API->>U: Booking initiated
    
    RMQ->>BW: Consume booking task
    BW->>PG: Process payment
    PG->>BW: Payment successful
    BW->>DB: Update booking status (confirmed)
    
    BW->>RMQ: Publish notification_task
    RMQ->>NW: Consume notification task
    
    NW->>Email: Send confirmation email
    NW->>Socket: Emit booking_confirmed event
    Socket->>U: Real-time notification
    
    BW->>API: Booking process completed
```

## Real-time Notification Flow

```mermaid
sequenceDiagram
    participant Admin as Admin User
    participant API as Main Backend
    participant DB as PostgreSQL
    participant Socket as Socket.IO Server
    participant Users as Connected Users
    participant RMQ as RabbitMQ
    participant NW as Notification Worker
    participant FB as Firebase FCM

    Note over Admin,FB: Admin Sends Notification
    
    Admin->>API: POST /api/notifications/broadcast
    API->>DB: Store notification
    DB->>API: Notification stored
    
    API->>Socket: Emit to connected users
    Socket->>Users: Real-time notification
    
    API->>RMQ: Publish push_notification task
    RMQ->>NW: Consume push task
    NW->>DB: Get user FCM tokens
    NW->>FB: Send push notifications
    FB->>Users: Push notification delivered
    
    Note over Admin,FB: User Reads Notification
    
    Users->>API: PATCH /api/notifications/:id/read
    API->>DB: Mark as read
    API->>Socket: Emit unread_count_update
    Socket->>Users: Updated unread count
```

## Error Handling & Recovery Flow

```mermaid
flowchart TD
    Start([Task/Request Initiated]) --> Process{Processing}
    Process -->|Success| Success[✅ Complete Successfully]
    Process -->|Error| ErrorType{Error Type?}
    
    ErrorType -->|Validation| ValidationError[❌ Return 400 Bad Request]
    ErrorType -->|Authentication| AuthError[❌ Return 401 Unauthorized]
    ErrorType -->|Permission| PermError[❌ Return 403 Forbidden]
    ErrorType -->|Not Found| NotFoundError[❌ Return 404 Not Found]
    ErrorType -->|Database| DBError{Database Error}
    ErrorType -->|External Service| ExtError{External Service Error}
    ErrorType -->|System| SysError{System Error}
    
    DBError -->|Connection Lost| DBRetry[🔄 Retry Connection]
    DBError -->|Query Failed| DBLog[📝 Log Error & Return 500]
    
    ExtError -->|Timeout| ExtRetry{Retry Count < 3?}
    ExtRetry -->|Yes| ExtWait[⏳ Wait & Retry]
    ExtRetry -->|No| ExtFail[❌ Return Service Unavailable]
    ExtError -->|API Error| ExtLog[📝 Log & Continue]
    
    SysError -->|Memory/CPU| SysAlert[🚨 Alert Admin]
    SysError -->|Disk Space| SysCleanup[🧹 Cleanup & Alert]
    
    DBRetry -->|Success| Process
    DBRetry -->|Failed| DBLog
    ExtWait --> ExtError
    
    ValidationError --> End([End])
    AuthError --> End
    PermError --> End
    NotFoundError --> End
    DBLog --> End
    ExtFail --> End
    ExtLog --> End
    SysAlert --> End
    SysCleanup --> End
    Success --> End
```

## Data Consistency & Transaction Flow

```mermaid
sequenceDiagram
    participant API as Backend API
    participant DB as PostgreSQL
    participant RMQ as RabbitMQ
    participant Worker as Background Worker
    participant External as External Service

    Note over API,External: Transactional Operations
    
    API->>DB: BEGIN TRANSACTION
    API->>DB: INSERT user data
    API->>DB: INSERT related records
    
    alt All operations successful
        API->>DB: COMMIT TRANSACTION
        API->>RMQ: Publish success event
        RMQ->>Worker: Process async tasks
        Worker->>External: Call external APIs
        
        alt External call fails
            Worker->>RMQ: Publish compensation event
            Note over Worker: Implement saga pattern for rollback
        end
        
    else Any operation fails
        API->>DB: ROLLBACK TRANSACTION
        API->>API: Return error to client
        Note over API: No async tasks published
    end
```

## Monitoring & Health Check Flow

```mermaid
graph TB
    subgraph "Health Monitoring"
        HC[🏥 Health Check Endpoint]
        Monitor[📊 Monitoring Service]
    end
    
    subgraph "Services Status"
        API_Status[🎯 API Status]
        DB_Status[🗄️ Database Status]
        RMQ_Status[🐰 RabbitMQ Status]
        Redis_Status[⚡ Redis Status]
        Worker_Status[⚙️ Workers Status]
    end
    
    subgraph "Metrics Collection"
        Prometheus[📈 Prometheus]
        Grafana[📊 Grafana Dashboard]
    end
    
    subgraph "Alerting"
        Alert[🚨 Alert Manager]
        Slack[💬 Slack Notifications]
        Email[📧 Email Alerts]
        PagerDuty[📟 PagerDuty]
    end
    
    HC --> API_Status
    HC --> DB_Status
    HC --> RMQ_Status
    HC --> Redis_Status
    HC --> Worker_Status
    
    Monitor --> HC
    Monitor --> Prometheus
    Prometheus --> Grafana
    
    Prometheus --> Alert
    Alert --> Slack
    Alert --> Email
    Alert --> PagerDuty
    
    API_Status -.->|Unhealthy| Alert
    DB_Status -.->|Connection Failed| Alert
    RMQ_Status -.->|Queue Overloaded| Alert
    Redis_Status -.->|Cache Miss Rate High| Alert
    Worker_Status -.->|Processing Delayed| Alert
```

## Scaling & Load Distribution

```mermaid
graph TB
    subgraph "Client Requests"
        C1[Client 1]
        C2[Client 2]
        C3[Client 3]
        Cn[Client N...]
    end
    
    subgraph "Load Balancer Layer"
        LB[⚖️ Load Balancer<br/>Nginx/HAProxy]
    end
    
    subgraph "API Instances"
        API1[🎯 API Instance 1<br/>Pod/Container]
        API2[🎯 API Instance 2<br/>Pod/Container]
        API3[🎯 API Instance 3<br/>Pod/Container]
    end
    
    subgraph "Image Service Instances"
        IMG1[📸 Image Service 1]
        IMG2[📸 Image Service 2]
    end
    
    subgraph "Worker Pool"
        W1[⚙️ Worker 1]
        W2[⚙️ Worker 2]
        W3[⚙️ Worker 3]
        W4[⚙️ Worker 4]
    end
    
    subgraph "Data Layer - Clustered"
        DBMaster[(🗄️ DB Master<br/>Write)]
        DBReplica1[(📖 DB Replica 1<br/>Read)]
        DBReplica2[(📖 DB Replica 2<br/>Read)]
        RedisCluster[(⚡ Redis Cluster)]
    end
    
    C1 --> LB
    C2 --> LB
    C3 --> LB
    Cn --> LB
    
    LB -->|Round Robin| API1
    LB -->|Round Robin| API2
    LB -->|Round Robin| API3
    
    LB -->|Sticky Sessions| IMG1
    LB -->|Sticky Sessions| IMG2
    
    API1 -->|Write| DBMaster
    API2 -->|Write| DBMaster
    API3 -->|Write| DBMaster
    
    API1 -->|Read| DBReplica1
    API2 -->|Read| DBReplica2
    API3 -->|Read| DBReplica1
    
    API1 --> RedisCluster
    API2 --> RedisCluster
    API3 --> RedisCluster
    
    API1 -.->|Publish| RMQ[🐰 RabbitMQ Cluster]
    API2 -.->|Publish| RMQ
    API3 -.->|Publish| RMQ
    
    RMQ -->|Distribute| W1
    RMQ -->|Distribute| W2
    RMQ -->|Distribute| W3
    RMQ -->|Distribute| W4
    
    DBMaster -.->|Replication| DBReplica1
    DBMaster -.->|Replication| DBReplica2
```

This comprehensive documentation provides a complete overview of your Abyansf backend system, including:

1. **Enhanced README** with proper markdown formatting and diagrams
2. **Detailed RabbitMQ flow** explaining message broker operations
3. **Image upload service flow** with step-by-step processing
4. **System architecture** showing all components and their relationships
5. **API documentation** for quick reference
6. **Deployment guide** for production setup

The diagrams use Mermaid syntax which will render beautifully in GitHub and most markdown viewers, providing visual representation of:
- System architecture
- Data flow
- Message broker operations
- Image upload processes
- Error handling
- Monitoring and scaling strategies

All documentation is structured professionally and includes practical examples and code snippets for developers to understand and work with your system effectively.
