# Notification System Design


# Stage 1

## REST API Design for Notification System

### Endpoints

1. **Get Notifications for a User**
	 - `GET /api/notifications/:userId`
	 - **Description:** Fetch all notifications for a user.
	 - **Response:**
		 ```json
		 {
			 "notifications": [
				 { "id": "...", "type": "Result", "message": "...", "timestamp": "..." },
				 ...
			 ]
		 }
		 ```

2. **Mark Notification as Read**
	 - `POST /api/notifications/:userId/read`
	 - **Description:** Mark a notification as read for a user.
	 - **Request Body:**
		 ```json
		 { "notificationId": "..." }
		 ```
	 - **Response:**
		 ```json
		 { "success": true }
		 ```

3. **Notify All (Bulk Notification)**
	 - `POST /api/notifications/notify_all`
	 - **Description:** Send a notification to multiple users (e.g., placement results).
	 - **Request Body:**
		 ```json
		 { "student_ids": ["...", "..."], "message": "..." }
		 ```
	 - **Response:**
		 ```json
		 { "success": true, "notified": 50000 }
		 ```

### Real-Time Notification Mechanism

- Use WebSockets (e.g., Socket.IO) for real-time push notifications to users.
- On new notification, emit an event to the connected user's socket.
- Fallback to polling for users not connected in real-time.

### Headers
- All endpoints require Authorization header with Bearer token.
- All responses are in JSON format with clear status and error fields.
---

---

# Stage 2

## Persistent Storage Choice

- **Recommended DB:** PostgreSQL (Relational DB)
- **Reason:**
	- Supports complex queries and indexing for fast notification retrieval.
	- Ensures data consistency and supports ACID transactions.
	- Scales well with partitioning and indexing as data grows.

## DB Schema

### notifications
| Column           | Type         | Description                        |
|------------------|--------------|------------------------------------|
| id               | UUID (PK)    | Unique notification ID              |
| user_id          | UUID         | User receiving the notification     |
| type             | VARCHAR      | Notification type (enum)            |
| message          | TEXT         | Notification message                |
| is_read          | BOOLEAN      | Read status                         |
| created_at       | TIMESTAMP    | Creation time                       |

### users
| Column           | Type         | Description                        |
|------------------|--------------|------------------------------------|
| id               | UUID (PK)    | User ID                             |
| email            | VARCHAR      | User email                          |

## Scaling Issues & Solutions

- **Problem:** As data grows, queries may slow down.
	- **Solution:**
		- Add indexes on (user_id, is_read, created_at).
		- Partition notifications table by user_id or time.
		- Archive old notifications.

- **Problem:** Write spikes (e.g., Notify All to 50,000 users).
	- **Solution:**
		- Use batch inserts and background jobs/queues.
		- Use connection pooling.

## Sample SQL Queries

**Fetch unread notifications for a user:**
```sql
SELECT * FROM notifications WHERE user_id = '...' AND is_read = false ORDER BY created_at DESC;
```

**Mark notification as read:**
```sql
UPDATE notifications SET is_read = true WHERE id = '...';
```

**Insert new notification:**
```sql
INSERT INTO notifications (id, user_id, type, message, is_read, created_at) VALUES (...);
```

---

# Stage 3

## Query Analysis & Optimization

### Given Query
```sql
SELECT * FROM notifications WHERE studentID = 1842 AND isRead = false ORDER BY createdAt DESC;
```

### Why is it slow?
- As the notifications table grows (millions of rows), scanning for a specific student and unread status becomes expensive if not indexed.
- ORDER BY on a large dataset without an index on createdAt is slow.

### Optimization

1. **Indexes:**
	- Composite index on (studentID, isRead, createdAt DESC) greatly speeds up this query.
	  ```sql
	  CREATE INDEX idx_notifications_studentid_isread_createdat ON notifications(studentID, isRead, createdAt DESC);
	  ```
2. **Query Only Needed Columns:**
	- Instead of SELECT *, fetch only required columns (e.g., id, type, message, createdAt).
3. **Pagination:**
	- Use LIMIT/OFFSET for efficient page loads.

### Indexing Advice
- Adding indexes on every column is not efficient and increases write cost and storage.
- Only index columns frequently used in WHERE, JOIN, or ORDER BY clauses.
- Composite indexes are more efficient for multi-condition queries.

### Computation Cost
- Indexes speed up reads but slow down writes (INSERT/UPDATE/DELETE).
- More indexes = more storage and maintenance overhead.

### Query to Find All Students with Placement Notification in Last 7 Days
```sql
SELECT DISTINCT studentID FROM notifications
WHERE notification_type = 'Placement'
	AND createdAt >= NOW() - INTERVAL '7 days';
```

# Stage 4

## Performance Issue

When notifications are fetched on each page load for every student, the DB is queried repeatedly, causing high load and slow user experience as the number of notifications and users grows.

## Solutions & Tradeoffs

1. **Caching:**
	- Cache recent notifications per user in an in-memory store (e.g., Redis).
	- Reduces DB hits for frequent queries.
	- **Tradeoff:** Cache invalidation complexity when new notifications arrive or are marked as read.


2. **Pagination & Lazy Loading:**
	- Fetch notifications in small batches (e.g., 20 at a time) as the user scrolls.
	- Reduces data transferred and DB load per request.
	- **Tradeoff:** Slightly more complex frontend logic.

3. **Read Replicas:**
	- Use read replicas to distribute DB read load.
	- **Tradeoff:** Slight replication lag, eventual consistency for reads.

4. **Pre-aggregation:**
	- Maintain a summary table for unread notification counts per user.
	- **Tradeoff:** Extra storage and update logic.

5. **Asynchronous Processing:**
	- Use background jobs to precompute or batch notification delivery.
	- **Tradeoff:** Slight delay in notification delivery.
---

# Stage 5

## Notify All Implementation & Reliability

### Pseudocode
```python
def notify_all(student_ids: list, message: str):
	for student_id in student_ids:
		try:
			send_email(student_id, message)  # Calls Email API
			save_to_db(student_id, message)  # DB insert
			push_to_app(student_id, message) # Real-time notification (WebSocket)
		except Exception as e:
			log_error(student_id, str(e))
```

### Observed Shortcomings
- If send_email fails for some students, those students miss notifications.
- Partial failures are not retried, and the process may not be idempotent.
- Logging errors is not enough; failed notifications should be retried.

### Redesign for Reliability & Speed
- Use a message queue (e.g., RabbitMQ) to enqueue notification jobs for each student.
- Workers consume jobs and perform email, DB, and app push independently.
- Track status and retry failed jobs automatically.
- Decouple DB save and notification send for better throughput.
- Optionally, batch DB inserts and email sends for efficiency.

### Should DB save and sending happen together?
- No. Decouple for reliability. Save to DB first, then send notifications. If sending fails, retry without duplicating DB entries.

---

# Stage 6

## Priority Inbox: Top N Unread Notifications

### Requirement
- Show top N most important unread notifications, sorted by weight (Placement > Result > Event) and recency.

### Approach
1. Fetch all unread notifications for the user from the API.
2. Assign weights: Placement=3, Result=2, Event=1.
3. Sort by (weight DESC, timestamp DESC).
4. Return top N.

### Sample Code (JavaScript)
```js
function getPriorityInbox(notifications, N) {
  const weights = { Placement: 3, Result: 2, Event: 1 };
  return notifications
	.filter(n => !n.is_read)
	.map(n => ({ ...n, weight: weights[n.type] || 0 }))
	.sort((a, b) => b.weight - a.weight || new Date(b.timestamp) - new Date(a.timestamp))
	.slice(0, N);
}
```

### Efficient Maintenance
- Use a min-heap of size N for streaming updates.
- On new notification, insert if higher priority than current min.
- Remove lowest if heap exceeds N.

### Handling Continuous Arrival
- Always keep heap updated as new notifications arrive.
- For each user, maintain a small in-memory or cache structure for their top N.

---

## Recommendation
- Combine caching (for most recent notifications), pagination, and read replicas for best performance at scale.
- Monitor cache hit rates and DB load to tune strategy.

---

# Stage 2

## Persistent Storage Choice

- **Recommended DB:** PostgreSQL (Relational DB)
- **Reason:**
	- Supports complex queries and indexing for fast notification retrieval.
	- Ensures data consistency and supports ACID transactions.
	- Scales well with partitioning and indexing as data grows.

## DB Schema

### notifications
| Column           | Type         | Description                        |
|------------------|--------------|------------------------------------|
| id               | UUID (PK)    | Unique notification ID              |
| user_id          | UUID         | User receiving the notification     |
| type             | VARCHAR      | Notification type (enum)            |
| message          | TEXT         | Notification message                |
| is_read          | BOOLEAN      | Read status                         |
| created_at       | TIMESTAMP    | Creation time                       |

### users
| Column           | Type         | Description                        |
|------------------|--------------|------------------------------------|
| id               | UUID (PK)    | User ID                             |
| email            | VARCHAR      | User email                          |

## Scaling Issues & Solutions

- **Problem:** As data grows, queries may slow down.
	- **Solution:**
		- Add indexes on (user_id, is_read, created_at).
		- Partition notifications table by user_id or time.
		- Archive old notifications.

- **Problem:** Write spikes (e.g., Notify All to 50,000 users).
	- **Solution:**
		- Use batch inserts and background jobs/queues.
		- Use connection pooling.

## Sample SQL Queries

**Fetch unread notifications for a user:**
```sql
SELECT * FROM notifications WHERE user_id = '...' AND is_read = false ORDER BY created_at DESC;
```

**Mark notification as read:**
```sql
UPDATE notifications SET is_read = true WHERE id = '...';
```

**Insert new notification:**
```sql
INSERT INTO notifications (id, user_id, type, message, is_read, created_at) VALUES (...);
```

---