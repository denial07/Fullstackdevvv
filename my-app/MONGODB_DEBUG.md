# MongoDB Query Commands to Check Login Alerts

If you're using MongoDB Compass or the MongoDB shell, try these queries:

## 1. Check all users and their loginAlerts status:
```javascript
db.users.find({}, {email: 1, loginAlerts: 1, trustedDevices: 1})
```

## 2. Check if any users are missing the loginAlerts field:
```javascript
db.users.find({loginAlerts: {$exists: false}})
```

## 3. Check the current state with more details:
```javascript
db.users.find().forEach(function(doc) {
    print("Email: " + doc.email + 
          ", loginAlerts: " + doc.loginAlerts + 
          " (type: " + typeof doc.loginAlerts + ")" +
          ", trustedDevices: " + (doc.trustedDevices ? doc.trustedDevices.length : 0) + " devices");
});
```

## 4. Update a specific user's loginAlerts (for testing):
```javascript
db.users.updateOne(
    {email: "admin@palletworks.sg"}, 
    {$set: {loginAlerts: false}}
)
```

## 5. Check the full document structure:
```javascript
db.users.findOne({email: "admin@palletworks.sg"})
```

## Common Issues:

1. **Wrong Database**: Make sure you're looking in the `palletworks` database, not a different one
2. **Wrong Collection**: The collection name should be `users` (lowercase)
3. **Field Hidden**: In MongoDB Compass, make sure you're viewing all fields, not just a subset
4. **Caching**: Try refreshing your MongoDB interface

## Database Connection Details:
- Database: `palletworks` 
- Collection: `users`
- The connection string from .env.local points to the correct database

## Test Results Show:
- 3 users found in the database
- All have loginAlerts: true (boolean type)
- Field exists and can be updated successfully
- Trusted devices are also working correctly
