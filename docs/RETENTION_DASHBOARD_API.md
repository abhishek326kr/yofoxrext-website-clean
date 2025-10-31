# Retention Dashboard API Documentation

## Overview

The Retention Dashboard API provides endpoints for tracking user engagement, loyalty progression, vault coin bonuses, badges, and personalized AI nudges. All endpoints require authentication.

## Authentication

All endpoints require a valid session cookie. Unauthenticated requests return `401 Unauthorized`.

---

## Dashboard Endpoints

### GET `/api/dashboard/overview`

**Description:** Returns comprehensive dashboard metrics including vault summary, today's earnings, and referral progress.

**Authentication:** Required

**Response:**
```json
{
  "metrics": {
    "userId": "uuid",
    "activeDays": 45,
    "currentTier": "Gold",
    "feeRate": 0.03,
    "lastActive": "2025-11-01T12:00:00Z"
  },
  "vault": {
    "totalLocked": 1500,
    "availableToClaim": 300,
    "nextUnlockDate": "2025-11-15T00:00:00Z",
    "progressPercentage": 67
  },
  "todayEarnings": 125,
  "referralProgress": {
    "activeReferrals": 3,
    "requiredForBonus": 5,
    "progressPercentage": 60,
    "currentRate": 0.02
  }
}
```

**Status Codes:**
- `200 OK` - Success
- `401 Unauthorized` - Not authenticated
- `500 Internal Server Error` - Server error

---

### GET `/api/dashboard/earnings-sources`

**Description:** Returns aggregated earnings breakdown by source for pie chart visualization.

**Authentication:** Required

**Response:**
```json
[
  { "source": "Thread Created", "amount": 450, "color": "#3b82f6" },
  { "source": "Reply Posted", "amount": 320, "color": "#10b981" },
  { "source": "Content Published", "amount": 500, "color": "#f59e0b" },
  { "source": "Answer Accepted", "amount": 200, "color": "#8b5cf6" }
]
```

---

### GET `/api/dashboard/loyalty-timeline`

**Description:** Returns tier progression timeline with benefits and fee rates.

**Authentication:** Required

**Response:**
```json
{
  "currentTier": "Gold",
  "currentDays": 45,
  "tiers": [
    {
      "tier": "Bronze",
      "minActiveDays": 0,
      "feeRate": 0.07,
      "benefits": ["Basic forum access", "Coin rewards"],
      "isCompleted": true
    },
    {
      "tier": "Silver",
      "minActiveDays": 22,
      "feeRate": 0.05,
      "benefits": ["Priority support", "5% fee reduction"],
      "isCompleted": true
    },
    {
      "tier": "Gold",
      "minActiveDays": 45,
      "feeRate": 0.03,
      "benefits": ["Featured content", "3% fee rate"],
      "isCompleted": false,
      "isCurrent": true
    }
  ],
  "nextTierBadge": "Expert Trader (50 replies)"
}
```

---

### GET `/api/dashboard/activity-heatmap`

**Description:** Returns hourly activity patterns for the past 30 days.

**Authentication:** Required

**Response:**
```json
[
  { "hour": 9, "dayOfWeek": 1, "actionCount": 15 },
  { "hour": 14, "dayOfWeek": 3, "actionCount": 23 },
  { "hour": 20, "dayOfWeek": 5, "actionCount": 8 }
]
```

**Notes:**
- `dayOfWeek`: 0 (Sunday) to 6 (Saturday)
- `hour`: 0 (midnight) to 23 (11 PM)
- `actionCount`: Number of actions during that hour

---

### GET `/api/dashboard/badges`

**Description:** Returns user badges with progress toward unearned badges.

**Authentication:** Required

**Response:**
```json
{
  "earned": [
    {
      "badgeType": "first_post",
      "badgeName": "First Steps",
      "badgeDescription": "Created your first thread",
      "coinReward": 50,
      "unlockedAt": "2025-10-15T10:30:00Z"
    }
  ],
  "available": [
    {
      "badgeType": "reply_streak",
      "badgeName": "Reply Master",
      "badgeDescription": "Post 50 replies",
      "coinReward": 200,
      "progress": {
        "current": 32,
        "required": 50,
        "percentage": 64
      }
    }
  ]
}
```

---

### GET `/api/dashboard/referrals`

**Description:** Returns detailed referral statistics.

**Authentication:** Required

**Response:**
```json
{
  "totalReferrals": 8,
  "activeReferrals": 3,
  "permanentRateUnlocked": false,
  "currentRate": 0.02,
  "potentialRate": 0.05,
  "referralList": [
    {
      "username": "trader123",
      "joinedAt": "2025-10-20T15:00:00Z",
      "isActive": true,
      "totalEarnings": 450
    }
  ]
}
```

---

### POST `/api/dashboard/vault/claim`

**Description:** Claims all available unlocked vault coins.

**Authentication:** Required

**Request Body:**
```json
{}
```

**Response:**
```json
{
  "success": true,
  "amount": 300,
  "newBalance": 2150,
  "message": "Successfully claimed 300 coins from vault"
}
```

**Status Codes:**
- `200 OK` - Success
- `400 Bad Request` - No coins available to claim
- `401 Unauthorized` - Not authenticated
- `500 Internal Server Error` - Server error

---

### GET `/api/dashboard/vault/summary`

**Description:** Returns detailed vault statistics.

**Authentication:** Required

**Response:**
```json
{
  "totalLocked": 1500,
  "availableToClaim": 300,
  "nextUnlockDate": "2025-11-15T00:00:00Z",
  "progressPercentage": 67,
  "recentDeposits": [
    {
      "amount": 50,
      "earnedFrom": "Thread Created",
      "depositedAt": "2025-11-01T10:00:00Z",
      "unlockAt": "2025-12-01T10:00:00Z",
      "status": "locked"
    }
  ]
}
```

---

### GET `/api/dashboard/nudges`

**Description:** Returns active AI-generated engagement nudges.

**Authentication:** Required

**Response:**
```json
[
  {
    "id": "uuid",
    "nudgeType": "post_in_category",
    "message": "Post in Expert Advisors - high engagement right now!",
    "actionUrl": "/category/expert-advisors",
    "priority": "medium",
    "createdAt": "2025-11-01T09:00:00Z"
  }
]
```

**Priority Levels:**
- `low` - Casual suggestion
- `medium` - Important recommendation
- `high` - Critical opportunity

---

### POST `/api/dashboard/nudges/:nudgeId/dismiss`

**Description:** Dismisses a specific AI nudge.

**Authentication:** Required

**URL Parameters:**
- `nudgeId` (string, required) - The UUID of the nudge to dismiss

**Request Body:**
```json
{}
```

**Response:**
```json
{
  "success": true,
  "message": "Nudge dismissed successfully"
}
```

**Status Codes:**
- `200 OK` - Success
- `404 Not Found` - Nudge not found or doesn't belong to user
- `401 Unauthorized` - Not authenticated
- `500 Internal Server Error` - Server error

---

## WebSocket Events

### Connection

**Path:** `/ws/dashboard`

**Authentication:** Socket.IO handshake with session cookie

**Client Events:**
- `join` - Join user-specific room
  ```javascript
  socket.emit('join', userId);
  ```

**Server Events:**

#### `earnings:update`
Emitted when user earns coins
```javascript
{
  "amount": 25,
  "source": "Reply Posted",
  "timestamp": "2025-11-01T12:00:00Z"
}
```

#### `vault:unlock`
Emitted when vault coins become available
```javascript
{
  "amount": 150,
  "timestamp": "2025-11-01T02:00:00Z"
}
```

#### `badge:unlock`
Emitted when user unlocks a badge
```javascript
{
  "badge": {
    "badgeName": "Reply Master",
    "coinReward": 200
  },
  "timestamp": "2025-11-01T14:30:00Z"
}
```

---

## Rate Limiting

All endpoints are subject to the application's global rate limiting:
- **Authenticated users:** 100 requests per 15 minutes
- **Unauthenticated users:** 30 requests per 15 minutes

Exceeding the limit returns `429 Too Many Requests`.

---

## Error Responses

All errors follow this format:

```json
{
  "error": "Error message description",
  "code": "ERROR_CODE",
  "details": {}
}
```

**Common Error Codes:**
- `AUTH_REQUIRED` - Authentication required
- `INVALID_REQUEST` - Invalid request parameters
- `NOT_FOUND` - Resource not found
- `RATE_LIMIT_EXCEEDED` - Too many requests
- `INTERNAL_ERROR` - Server error

---

## Testing

Example using cURL:

```bash
# Get dashboard overview
curl -X GET http://localhost:3001/api/dashboard/overview \
  -H "Cookie: connect.sid=YOUR_SESSION_COOKIE"

# Claim vault coins
curl -X POST http://localhost:3001/api/dashboard/vault/claim \
  -H "Cookie: connect.sid=YOUR_SESSION_COOKIE" \
  -H "Content-Type: application/json" \
  -d '{}'

# Dismiss AI nudge
curl -X POST http://localhost:3001/api/dashboard/nudges/NUDGE_UUID/dismiss \
  -H "Cookie: connect.sid=YOUR_SESSION_COOKIE" \
  -H "Content-Type: application/json" \
  -d '{}'
```

---

## Notes

- All dates are in ISO 8601 format (UTC)
- Coin amounts are integers (no decimals)
- Fee rates are decimals (0.07 = 7%)
- WebSocket reconnection is handled automatically by the client
- Vault unlocks occur daily at 2 AM UTC via cron job
- Vault extensions occur weekly on Sundays at 3 AM UTC for inactive users
