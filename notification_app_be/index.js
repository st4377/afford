// notification_app_be/index.js
// Basic Express backend for Notification System

const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(bodyParser.json());

// In-memory notifications store (for demo only)
let notifications = [];

// Health check or root route
app.get('/', (req, res) => {
  res.send('Notification backend is running.');
});

// Get notifications for a user
app.get('/api/notifications/:userId', (req, res) => {
  const userId = req.params.userId;
  const userNotifications = notifications.filter(n => n.userId === userId);
  res.json({ notifications: userNotifications });
});

// Mark notification as read
app.post('/api/notifications/:userId/read', (req, res) => {
  const { notificationId } = req.body;
  notifications = notifications.map(n =>
    n.id === notificationId ? { ...n, is_read: true } : n
  );
  res.json({ success: true });
});

// Notify all (bulk notification)
app.post('/api/notifications/notify_all', (req, res) => {
  const { student_ids, message } = req.body;
  const newNotifications = student_ids.map(id => ({
    id: `${id}_${Date.now()}`,
    userId: id,
    type: 'Bulk',
    message,
    is_read: false,
    timestamp: new Date().toISOString(),
  }));
  notifications = notifications.concat(newNotifications);
  res.json({ success: true, notified: student_ids.length });
});

// Handle missing userId
app.get('/api/notifications/', (req, res) => {
  res.status(400).json({ error: 'User ID is required in the URL.' });
});

app.listen(PORT, () => {
  console.log(`Notification backend running on port ${PORT}`);
});
