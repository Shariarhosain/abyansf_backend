# 🏗️ System Architecture Diagrams

## High-Level System Overview

```mermaid
graph TB
    subgraph "Client Layer"
        Mobile[Mobile App<br/>Flutter/React Native]
        Web[Web App<br/>React/Vue/Angular]
        Admin[Admin Dashboard]
    end
    
    subgraph "Load Balancer"
        LB[Nginx/AWS ALB]
    end
    
    subgraph "Application Layer"
        Backend[Main Backend Service<br/>Port: 3000<br/>Express.js + Socket.IO]
        ImageService[Image Upload Service<br/>Port: 3200<br/>Express.js + Multer]
        Workers[RabbitMQ Workers<br/>Background Processing]
    end
    
    subgraph "Message Broker"
        RabbitMQ[RabbitMQ Server<br/>Port: 5672<br/>Management UI: 15672]
    end
    
    subgraph "Database Layer"
        PostgreSQL[(PostgreSQL<br/>Primary Database)]
        Redis[(Redis<br/>Session & Cache)]
    end
    
    subgraph "External Services"
        Firebase[Firebase<br/>Push Notifications<br/>User Auth]
        Email[Email Service<br/>SMTP/SendGrid]
        SMS[SMS Service<br/>Twilio/AWS SNS]
    end
    
    subgraph "Storage"
        FileSystem[Local File System<br/>Image Storage]
        S3[AWS S3<br/>Future CDN]
    end
    
    %% Client connections
    Mobile --> LB
    Web --> LB
    Admin --> LB
    
    %% Load balancer routing
    LB --> Backend
    LB --> ImageService
    
    %% Service connections
    Backend --> PostgreSQL
    Backend --> Redis
    Backend --> RabbitMQ
    ImageService --> FileSystem
    ImageService --> S3
    
    %% Worker connections
    RabbitMQ --> Workers
    Workers --> PostgreSQL
    Workers --> Firebase
    Workers --> Email
    Workers --> SMS
    
    %% Real-time connections
    Backend -.->|WebSocket| Mobile
    Backend -.->|WebSocket| Web
    Backend -.->|WebSocket| Admin
    
    classDef service fill:#e1f5fe
    classDef database fill:#f3e5f5
    classDef external fill:#fff3e0
    classDef storage fill:#e8f5e8
    
    class Backend,ImageService,Workers service
    class PostgreSQL,Redis database
    class Firebase,Email,SMS external
    class FileSystem,S3 storage
```

## Microservices Architecture

```mermaid
graph TB
    subgraph "Frontend Applications"
        MobileApp[📱 Mobile App]
        WebApp[🌐 Web Application]
        AdminPanel[👨‍💼 Admin Panel]
    end
    
    subgraph "API Gateway Layer"
        Gateway[🔀 API Gateway<br/>Nginx/Kong]
    end
    
    subgraph "Core Services"
        AuthService[🔐 Authentication Service<br/>JWT + Firebase]
        UserService[👤 User Management Service]
        CategoryService[📂 Category Service]
        ListingService[📋 Listing Service]
        BookingService[📅 Booking Service]
        NotificationService[🔔 Notification Service]
    end
    
    subgraph "Utility Services"
        ImageService[📸 Image Upload Service<br/>Port: 3200]
        EmailService[📧 Email Service]
        PaymentService[💳 Payment Service]
    end
    
    subgraph "Message Queue"
        MessageBroker[🐰 RabbitMQ<br/>Message Broker]
        Workers[⚙️ Background Workers]
    end
    
    subgraph "Data Layer"
        MainDB[(🗄️ PostgreSQL<br/>Main Database)]
        CacheDB[(⚡ Redis<br/>Cache & Sessions)]
        FileStorage[📁 File Storage<br/>Local/S3]
    end
    
    subgraph "External APIs"
        FirebaseAPI[🔥 Firebase API]
        PaymentAPI[💰 Payment Gateway]
        SMSProvider[📱 SMS Provider]
    end
    
    %% Frontend to Gateway
    MobileApp --> Gateway
    WebApp --> Gateway
    AdminPanel --> Gateway
    
    %% Gateway to Services
    Gateway --> AuthService
    Gateway --> UserService
    Gateway --> CategoryService
    Gateway --> ListingService
    Gateway --> BookingService
    Gateway --> NotificationService
    Gateway --> ImageService
    
    %% Service to Service Communication
    AuthService -.->|Async| MessageBroker
    UserService -.->|Async| MessageBroker
    BookingService -.->|Async| MessageBroker
    NotificationService -.->|Async| MessageBroker
    
    %% Message Broker to Workers
    MessageBroker --> Workers
    
    %% Workers to External Services
    Workers --> FirebaseAPI
    Workers --> EmailService
    Workers --> PaymentAPI
    Workers --> SMSProvider
    
    %% Services to Database
    AuthService --> MainDB
    UserService --> MainDB
    CategoryService --> MainDB
    ListingService --> MainDB
    BookingService --> MainDB
    NotificationService --> MainDB
    
    %% Services to Cache
    AuthService --> CacheDB
    UserService --> CacheDB
    NotificationService --> CacheDB
    
    %% Image Service to Storage
    ImageService --> FileStorage
    
    classDef frontend fill:#e3f2fd
    classDef service fill:#e8f5e8
    classDef utility fill:#fff3e0
    classDef data fill:#f3e5f5
    classDef external fill:#ffebee
    
    class MobileApp,WebApp,AdminPanel frontend
    class AuthService,UserService,CategoryService,ListingService,BookingService,NotificationService service
    class ImageService,EmailService,PaymentService utility
    class MainDB,CacheDB,FileStorage data
    class FirebaseAPI,PaymentAPI,SMSProvider external
```

## Data Flow Architecture

```mermaid
graph LR
    subgraph "Request Flow"
        A[📱 Client Request] --> B[🔀 Load Balancer]
        B --> C[🛡️ Authentication]
        C --> D[🎯 Route Handler]
        D --> E[📋 Business Logic]
        E --> F[🗄️ Database]
        F --> G[📤 Response]
    end
    
    subgraph "Real-time Flow"
        H[🔔 Event Trigger] --> I[📡 Socket.IO Server]
        I --> J[👥 Connected Clients]
    end
    
    subgraph "Background Processing"
        K[📝 Task Creation] --> L[🐰 RabbitMQ Queue]
        L --> M[⚙️ Worker Process]
        M --> N[🎯 Task Execution]
        N --> O[✅ Completion]
    end
    
    %% Connections between flows
    E -.->|Async Tasks| L
    M -.->|Notifications| I
    F -.->|Real-time Updates| I
```

## Database Schema Architecture

```mermaid
erDiagram
    User ||--o{ Notification : receives
    User ||--o{ ListingBooking : makes
    User ||--o{ SubCategoryBooking : books
    User ||--o{ EventBooking : attends
    User ||--o{ Verification : has
    User ||--o{ Log : generates
    
    MainCategory ||--o{ SubCategory : contains
    SubCategory ||--o{ Listing : has
    SubCategory ||--o{ HeroSection : features
    
    Listing ||--o{ ListingBooking : booked_via
    Listing }o--|| SubCategory : belongs_to
    
    Event ||--o{ EventBooking : has
    
    Highlight ||--o{ User : targets
    
    User {
        string id PK
        string name
        string email UK
        string whatsapp UK
        string password
        enum role
        string profile_pic
        string gender
        datetime dateOfBirth
        string address
        boolean isActive
        string uid UK
        string fcm_token UK
        boolean paid
        string package
        boolean isVerified
        datetime createdAt
        datetime updatedAt
    }
    
    MainCategory {
        int id PK
        string name UK
        datetime createdAt
        datetime updatedAt
    }
    
    SubCategory {
        int id PK
        string name
        string description
        string image
        string contract_whatsapp
        int mainCategoryId FK
        datetime createdAt
        datetime updatedAt
    }
    
    Listing {
        string id PK
        string title
        string description
        string main_image
        json sub_images
        decimal price
        string location
        string contact_info
        boolean isActive
        int subCategoryId FK
        datetime createdAt
        datetime updatedAt
    }
    
    ListingBooking {
        string id PK
        string userId FK
        string listingId FK
        datetime booking_date
        enum status
        string notes
        datetime createdAt
        datetime updatedAt
    }
    
    Notification {
        string id PK
        string userId FK
        string title
        string message
        boolean isRead
        string role
        datetime createdAt
        datetime updatedAt
    }
```

## Security Architecture

```mermaid
graph TB
    subgraph "Client Security"
        HTTPS[🔒 HTTPS/TLS]
        CORS[🌐 CORS Policy]
        CSP[🛡️ Content Security Policy]
    end
    
    subgraph "API Security"
        JWT[🎫 JWT Authentication]
        RateLimit[⏱️ Rate Limiting]
        Validation[✅ Input Validation]
        Sanitization[🧽 Data Sanitization]
    end
    
    subgraph "Database Security"
        Encryption[🔐 Data Encryption]
        Backup[💾 Encrypted Backups]
        Access[👤 Role-based Access]
    end
    
    subgraph "Infrastructure Security"
        Firewall[🔥 Firewall Rules]
        VPN[🔑 VPN Access]
        Monitoring[👀 Security Monitoring]
        Logging[📝 Audit Logging]
    end
    
    subgraph "File Security"
        FileValidation[📄 File Type Validation]
        SizeLimit[📏 Size Limitations]
        VirusScan[🔍 Virus Scanning]
        AccessControl[🔐 Access Control]
    end
    
    Client[📱 Client] --> HTTPS
    HTTPS --> CORS
    CORS --> CSP
    CSP --> JWT
    JWT --> RateLimit
    RateLimit --> Validation
    Validation --> Sanitization
    
    Sanitization --> Encryption
    Encryption --> Backup
    Backup --> Access
    
    Access --> Firewall
    Firewall --> VPN
    VPN --> Monitoring
    Monitoring --> Logging
    
    Sanitization --> FileValidation
    FileValidation --> SizeLimit
    SizeLimit --> VirusScan
    VirusScan --> AccessControl
```

## Deployment Architecture

```mermaid
graph TB
    subgraph "Development Environment"
        DevLocal[💻 Local Development]
        DevDocker[🐳 Docker Compose]
    end
    
    subgraph "Staging Environment"
        StagingServer[🔧 Staging Server]
        StagingDB[(📊 Staging Database)]
        StagingRedis[(⚡ Staging Redis)]
    end
    
    subgraph "Production Environment"
        subgraph "Load Balancers"
            ALB[⚖️ Application Load Balancer]
        end
        
        subgraph "Application Servers"
            App1[🖥️ App Server 1]
            App2[🖥️ App Server 2]
            App3[🖥️ App Server 3]
        end
        
        subgraph "Database Cluster"
            PrimaryDB[(🗄️ Primary PostgreSQL)]
            ReplicaDB[(🔄 Read Replica)]
        end
        
        subgraph "Cache Layer"
            RedisCluster[(⚡ Redis Cluster)]
        end
        
        subgraph "Message Queue"
            RabbitMQCluster[🐰 RabbitMQ Cluster]
        end
        
        subgraph "Storage"
            S3Bucket[☁️ AWS S3]
            CDN[🌍 CloudFront CDN]
        end
        
        subgraph "Monitoring"
            Prometheus[📊 Prometheus]
            Grafana[📈 Grafana]
            ELK[📝 ELK Stack]
        end
    end
    
    %% Development Flow
    DevLocal --> DevDocker
    DevDocker --> StagingServer
    
    %% Staging
    StagingServer --> StagingDB
    StagingServer --> StagingRedis
    
    %% Production Flow
    StagingServer --> ALB
    ALB --> App1
    ALB --> App2
    ALB --> App3
    
    App1 --> PrimaryDB
    App2 --> PrimaryDB
    App3 --> PrimaryDB
    
    App1 --> ReplicaDB
    App2 --> ReplicaDB
    App3 --> ReplicaDB
    
    App1 --> RedisCluster
    App2 --> RedisCluster
    App3 --> RedisCluster
    
    App1 --> RabbitMQCluster
    App2 --> RabbitMQCluster
    App3 --> RabbitMQCluster
    
    App1 --> S3Bucket
    App2 --> S3Bucket
    App3 --> S3Bucket
    
    S3Bucket --> CDN
    
    %% Monitoring connections
    App1 -.-> Prometheus
    App2 -.-> Prometheus
    App3 -.-> Prometheus
    PrimaryDB -.-> Prometheus
    RedisCluster -.-> Prometheus
    RabbitMQCluster -.-> Prometheus
    
    Prometheus --> Grafana
    App1 -.-> ELK
    App2 -.-> ELK
    App3 -.-> ELK
```

## CI/CD Pipeline

```mermaid
graph LR
    subgraph "Development"
        Code[💻 Code Changes]
        Git[📝 Git Commit]
        PR[🔀 Pull Request]
    end
    
    subgraph "CI Pipeline"
        Build[🔨 Build]
        Test[🧪 Run Tests]
        Lint[🔍 Code Quality]
        Security[🔐 Security Scan]
        Docker[🐳 Docker Build]
    end
    
    subgraph "CD Pipeline"
        Deploy[🚀 Deploy to Staging]
        E2E[🎭 E2E Tests]
        Manual[👤 Manual Approval]
        Prod[🌟 Deploy to Production]
    end
    
    subgraph "Monitoring"
        Health[❤️ Health Checks]
        Metrics[📊 Metrics Collection]
        Alerts[🚨 Alerting]
        Rollback[⏪ Auto Rollback]
    end
    
    Code --> Git
    Git --> PR
    PR --> Build
    Build --> Test
    Test --> Lint
    Lint --> Security
    Security --> Docker
    Docker --> Deploy
    Deploy --> E2E
    E2E --> Manual
    Manual --> Prod
    Prod --> Health
    Health --> Metrics
    Metrics --> Alerts
    Alerts --> Rollback
    
    classDef dev fill:#e3f2fd
    classDef ci fill:#e8f5e8
    classDef cd fill:#fff3e0
    classDef monitor fill:#f3e5f5
    
    class Code,Git,PR dev
    class Build,Test,Lint,Security,Docker ci
    class Deploy,E2E,Manual,Prod cd
    class Health,Metrics,Alerts,Rollback monitor
```
