# 🔧 Troubleshooting Guide: Notification System Not Working

## ✅ Step-by-Step Fix Guide

### **Step 1: Check Server is Running**

Open terminal and run:
```bash
cd "d:\Office\flutter\New folder (2)\backend_branch_folder"
npm run dev
```

You should see:
```
Server is running on http://localhost:3000
Socket.IO is ready for real-time notifications
```

If you see "EADDRINUSE" error, kill the process using port 3000:
```bash
netstat -ano | findstr :3000
taskkill /PID [PID_NUMBER] /F
```

### **Step 2: Open Demo Page**

Open `notification-demo.html` in your browser or use the Simple Browser in VS Code.

### **Step 3: Test Manual Authentication (Easiest)**

1. **Select "Manual Authentication"** radio button
2. **Use demo user ID**: `demo-user123` (default)
3. **Select role**: `USER`
4. **Click "Connect & Authenticate"**

You should see:
- ✅ Status changes to "Connected as demo-user123 (USER)"
- ✅ Unread Count shows: 0

### **Step 4: Create Test Notifications**

1. **Click "Create 5 Test Notifications"** button
2. **Wait 2-3 seconds**
3. **Click "Refresh Unread Count"**

You should see:
- ✅ Unread Count changes to: 5
- ✅ Badge appears: 🔔 5

### **Step 5: Test Mark as Read**

1. **Click "Mark All as Read"**
2. **Wait 1 second**

You should see:
- ✅ Unread Count changes to: 0
- ✅ Badge disappears

## 🚨 Common Issues & Solutions

### Issue 1: "Connection Failed" or No Response

**Symptoms:**
- Status stays "Disconnected"
- No console messages

**Solutions:**
1. Check server is running on port 3000
2. Check browser console for errors (F12)
3. Try different browser
4. Disable browser extensions/ad blockers

### Issue 2: "User not found" Error

**Symptoms:**
- Error message appears
- Authentication fails

**Solutions:**
1. Use demo user IDs: `demo-user123`, `test-user1`, `user456`
2. Or create actual user in database first

### Issue 3: Unread Count Always 0

**Symptoms:**
- Connected successfully
- But unread count never changes

**Solutions:**
1. **Check browser console** (F12) for errors
2. **Create test notifications** first using the button
3. **Manually refresh** unread count
4. **Check database** - notifications might not be created

### Issue 4: Socket.IO Connection Issues

**Symptoms:**
- "Socket error" messages
- Intermittent connections

**Solutions:**
1. **Restart server**: Stop (Ctrl+C) and run `npm run dev` again
2. **Clear browser cache**: Hard refresh (Ctrl+Shift+R)
3. **Check CORS**: Server allows localhost connections

## 🔍 Debug Mode

### Enable Console Logging

Open browser console (F12) and you should see:

**When connecting:**
```
Attempting to connect with: {userId: "demo-user123", role: "USER"}
Socket connected successfully
Authentication data sent: {userId: "demo-user123", role: "USER"}
✅ Authentication successful: {userId: "demo-user123", role: "USER"}
```

**When getting unread count:**
```
📊 Unread count update: {userId: "demo-user123", unreadCount: 0, role: "USER"}
```

**When creating notifications:**
```
🔔 New notification: {id: "...", title: "Test", message: "..."}
```

### Server Logs

In your terminal, you should see:
```
Socket connected: [SOCKET_ID]
Demo user demo-user123 - returning demo unread count
User demo-user123 authenticated and joined rooms
Notification created for user demo-user123: Test Notification
```

## 🎯 Quick Test Script

If you want to test without the UI, open browser console and run:

```javascript
// Test connection
const socket = io('http://localhost:3000');

socket.on('connect', () => {
    console.log('✅ Connected');
    socket.emit('authenticate', { userId: 'demo-user123', role: 'USER' });
});

socket.on('authenticated', (data) => {
    console.log('✅ Authenticated:', data);
    socket.emit('get_unread_count');
});

socket.on('unread_count_update', (data) => {
    console.log('📊 Unread count:', data.unreadCount);
});

socket.on('error', (error) => {
    console.error('❌ Error:', error);
});
```

## 🔧 Reset Everything

If nothing works, try this reset:

1. **Stop server**: Ctrl+C in terminal
2. **Kill any remaining processes**: `taskkill /PID [PID] /F`
3. **Clear browser cache**: Ctrl+Shift+Delete
4. **Restart server**: `npm run dev`
5. **Refresh demo page**: F5
6. **Try manual authentication** with `demo-user123`

## 📞 Still Not Working?

Check these files for errors:

1. **Server console** - Any red error messages?
2. **Browser console** (F12) - Any JavaScript errors?
3. **Network tab** (F12) - Are requests failing?

### Common Error Messages & Fixes:

| Error | Solution |
|-------|----------|
| "EADDRINUSE" | Kill process using port 3000 |
| "User not found" | Use demo-user123 instead |
| "Invalid token" | Use Manual Authentication |
| "Connection failed" | Check server is running |
| "Socket error" | Restart server and browser |

## ✅ Success Indicators

You know it's working when:

1. ✅ Server starts without errors
2. ✅ Demo page connects successfully  
3. ✅ Status shows "Connected as [username]"
4. ✅ Creating notifications increases unread count
5. ✅ Marking as read decreases unread count
6. ✅ Real-time updates work instantly

The system is designed to work out of the box with demo users - no database setup required for testing! 🚀
