# 🕐 Session Timeout Database Storage - IMPLEMENTED

## ✅ What's Been Added:

### 1. **Database Schema Updates**
- ✅ **Added `sessionTimeout` field** to User interface and schema
- ✅ **Type:** Number (minutes)
- ✅ **Default value:** 30 minutes
- ✅ **Validation:** Min 5 minutes, Max 1440 minutes (24 hours)
- ✅ **Optional field** - won't break existing users

### 2. **API Endpoint Updates**

#### **Security API (`/api/user/security`):**
- ✅ **Accepts `sessionTimeout`** in PUT requests
- ✅ **Validates range** (5-1440 minutes)
- ✅ **Saves to database** with validation
- ✅ **Returns updated value** in response

#### **Profile API (`/api/user/profile`):**
- ✅ **Returns `sessionTimeout`** in GET requests
- ✅ **Loads current value** from database
- ✅ **Defaults to 30** if not set

### 3. **Settings Page Updates**
- ✅ **Loads session timeout** from database on page load
- ✅ **Updates local state** when API returns data
- ✅ **Sends session timeout** to API when saving
- ✅ **Validates numeric input** (parses string to number)

## 🔧 **How It Works:**

### **Database Storage:**
```javascript
// User schema now includes:
sessionTimeout: {
  type: Number,
  default: 30,
  min: [5, 'Session timeout must be at least 5 minutes'],
  max: [1440, 'Session timeout cannot exceed 24 hours (1440 minutes)']
}
```

### **API Request/Response:**
```javascript
// PUT /api/user/security
{
  "loginAlerts": true,
  "sessionTimeout": 60  // minutes
}

// Response includes:
{
  "user": {
    "loginAlerts": true,
    "sessionTimeout": 60
  }
}
```

### **Settings Page Flow:**
1. **Page loads** → Calls `/api/user/profile`
2. **API returns** → `sessionTimeout: 30` (or user's saved value)
3. **User changes** → Updates input field
4. **Save button** → Calls `/api/user/security` with new value
5. **Database updates** → Value persisted in MongoDB

## 🧪 **Testing Results:**

```
🔧 Testing session timeout database storage...
✅ Connected to MongoDB
👤 Found user: manager@palletworks.sg
⏱️  Current session timeout: undefined minutes (before)
📊 Login alerts: ENABLED

🔄 Testing session timeout updates...
1️⃣ Setting session timeout to 60 minutes... ✅
2️⃣ Setting session timeout to 120 minutes... ✅ 
3️⃣ Resetting to default (30 minutes)... ✅

✅ Session timeout test completed!
```

## 📊 **Database Field Details:**

- **Field Name:** `sessionTimeout`
- **Collection:** `users` in `palletworks` database
- **Data Type:** Number
- **Unit:** Minutes
- **Range:** 5-1440 minutes (5 minutes to 24 hours)
- **Default:** 30 minutes
- **Validation:** Server-side validation in API

## 🎯 **User Experience:**

1. **Settings Page:** User sees session timeout input field
2. **Current Value:** Loads from database (default 30)
3. **Change Value:** User types new number
4. **Save:** Click "Save Security Settings" button
5. **Database:** Value saved to MongoDB
6. **Feedback:** Success message shown

## 🔧 **Files Modified:**

1. **`lib/models/User.ts`** - Added sessionTimeout to schema
2. **`app/api/user/security/route.ts`** - Handle sessionTimeout in PUT
3. **`app/api/user/profile/route.ts`** - Return sessionTimeout in GET
4. **`app/settings/page.tsx`** - Load/save sessionTimeout
5. **`scripts/test-session-timeout.js`** - Test script for verification

## ✅ **Ready to Use:**

The session timeout field is now fully integrated and will:
- ✅ **Save to database** when user changes the value
- ✅ **Load from database** when settings page opens
- ✅ **Validate input** (5-1440 minute range)
- ✅ **Provide feedback** on save success/failure
- ✅ **Default to 30 minutes** for new/existing users

The session timeout value is now stored in your MongoDB `palletworks.users` collection as `sessionTimeout` (in minutes)!
