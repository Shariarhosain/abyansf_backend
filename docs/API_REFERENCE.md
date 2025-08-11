# 📚 API Documentation

## Base URLs

- **Main Backend**: `http://localhost:3000`
- **Image Service**: `http://localhost:3200`

## Authentication

Most endpoints require JWT authentication. Include the token in the Authorization header:

```
Authorization: Bearer <your-jwt-token>
```

## API Endpoints

### 🔐 Authentication

#### Register User
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

#### Login User
```http
POST /api/users/login
Content-Type: application/json

{
    "email": "john@example.com",
    "password": "password123"
}
```

### 👤 User Management

#### Get User Profile
```http
GET /api/users/profile
Authorization: Bearer <token>
```

#### Update User Profile
```http
PUT /api/users/profile
Authorization: Bearer <token>
Content-Type: application/json

{
    "name": "John Updated",
    "address": "New Address"
}
```

### 📂 Categories

#### List Categories
```http
GET /api/categories
```

#### Create Category
```http
POST /api/categories
Authorization: Bearer <token>
Content-Type: application/json

{
    "name": "New Category"
}
```

### 📋 Listings

#### List Listings
```http
GET /api/listings?page=1&limit=10&category=1
```

#### Create Listing
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

### 📅 Bookings

#### Create Booking
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

#### List User Bookings
```http
GET /api/bookings
Authorization: Bearer <token>
```

### 🔔 Notifications

#### Get Notifications
```http
GET /api/notifications?page=1&limit=20
Authorization: Bearer <token>
```

#### Mark as Read
```http
PATCH /api/notifications/:id/read
Authorization: Bearer <token>
```

### 📸 Image Upload (Port 3200)

#### Single Image Upload
```http
POST http://localhost:3200/upload-single
Content-Type: multipart/form-data

{
    "image": <file>
}
```

#### Multiple Images Upload
```http
POST http://localhost:3200/upload
Content-Type: multipart/form-data

{
    "main_image": <file>,
    "sub_images": <file[]>
}
```

#### List Images
```http
GET http://localhost:3200/images
```

#### Delete Image
```http
DELETE http://localhost:3200/delete/:filename
```

## Socket.IO Events

### Connection & Authentication

```javascript
const socket = io('http://localhost:3000');

// Authenticate
socket.emit('authenticate', { token: 'your-jwt-token' });

// Listen for authentication success
socket.on('authenticated', (data) => {
    console.log('Connected as:', data.userId, data.role);
});
```

### Real-time Events

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

## Error Responses

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

## Success Responses

Success responses follow this format:

```json
{
    "success": true,
    "data": { ... },
    "message": "Operation completed successfully"
}
```
