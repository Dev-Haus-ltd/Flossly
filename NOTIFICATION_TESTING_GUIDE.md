# 🧪 FCM Notification Testing Guide

Complete step-by-step guide to test all 17 notifications.

---

## 🔧 **Prerequisites**

Before testing, ensure:
1. ✅ You're logged in to the app
2. ✅ Notification permission is granted (check browser address bar)
3. ✅ FCM token is saved (check browser console for "Token saved to backend successfully")
4. ✅ Open browser DevTools > Console to see notification logs

---

## 📱 **General Module (2 notifications)**

### 1. Welcome – Subscription Confirmed ✅
**Expected:** "Welcome to Flossly 🎉" / "Your subscription is active — tap to log in."

**How to Test:**
```javascript
// Option 1: Manually trigger (in browser console)
await $fetch('/api/stripe/webhook', {
  method: 'POST',
  body: {
    type: 'customer.subscription.created',
    data: {
      object: {
        customer: 'YOUR_STRIPE_CUSTOMER_ID',
        status: 'active'
      }
    }
  }
});

// Option 2: Complete actual subscription flow
// 1. Go to signup page
// 2. Complete payment with test card: 4242 4242 4242 4242
// 3. Wait for Stripe webhook to trigger notification
```

**Verification:**
- ✅ Notification appears in browser
- ✅ Title: "Welcome to Flossly 🎉"
- ✅ Body: "Your subscription is active — tap to log in."

---

### 2. Portal Ready – Book Training 🎉
**Expected:** "Your portal is ready 🎉" / "Book your training session."

**How to Test:**
1. Login as **Admin**
2. Go to **Practice Profile** or **Settings**
3. Complete all required setup steps
4. Set practice status to **"Active"**
5. Notification should trigger

**Alternative - Manual Trigger:**
```javascript
// In browser console (logged in as user to receive notification)
await $fetch('/api/notifications/test-portal-ready', {
  method: 'POST'
});
```

**Verification:**
- ✅ Title: "Your portal is ready 🎉"
- ✅ Body: "Book your training session."
- ✅ Contains training URL in notification data

---

## ✅ **Tasks Module (3 notifications)**

### 5. New Task Assigned 📌
**Expected:** "New task assigned 📌" / "[Task Name] is waiting for you."

**How to Test:**
1. Login as **User A**
2. Go to **Tasks** section
3. Click **"Create New Task"**
4. Fill in task details:
   - Title: "Test Notification Task"
   - Assign to: **User B** (another team member)
5. Click **"Create"** or **"Save"**
6. **User B** should receive notification

**Verification:**
- ✅ User B receives notification
- ✅ Title: "New task assigned 📌"
- ✅ Body: "Test Notification Task is waiting for you."
- ✅ Clicking notification navigates to task details

---

### 6. Task Reminder (Overdue) ⏰
**Expected:** "You have overdue tasks ⏰" / "Tap to review now."

**How to Test:**

**Option 1: Create Overdue Task**
1. Go to **Tasks**
2. Create a new task assigned to yourself
3. Set **Due Date** to yesterday or earlier
4. Save the task
5. Wait for scheduler to run (runs daily) OR manually trigger:

```javascript
// Manually trigger in browser console
await $fetch('/api/tasks/send-overdue-reminders', {
  method: 'POST'
});
```

**Option 2: Direct Function Call (Backend)**
```javascript
// In server console or create test script
import { sendTaskOverdueReminderNotification } from './server/utils/fcmNotification.js';

await sendTaskOverdueReminderNotification({
  userId: YOUR_USER_ID,
  taskIds: [TASK_ID],
  count: 1
});
```

**Verification:**
- ✅ Title: "You have overdue tasks ⏰"
- ✅ Body: "Tap to review now."

---

### 7. Task Completed ✅
**Expected:** "Task completed ✅" / "[Task Name] has been finished."

**How to Test:**
1. Go to **Tasks**
2. Find any task (or create one assigned to someone else)
3. Click on the task
4. Change status to **"Completed"** or click **"Mark as Complete"**
5. Save changes
6. Assigned users/watchers should receive notification

**Verification:**
- ✅ Title: "Task completed ✅"
- ✅ Body: "[Task Name] has been finished."

---

## 📊 **CRM Module (4 notifications)**

### 8. New Lead Added 🆕
**Expected:** "New lead added 🆕" / "[Lead Name] is now in your CRM."

**How to Test:**
1. Go to **CRM** or **Leads** section
2. Click **"Add New Lead"**
3. Fill in lead details:
   - Name: "John Doe"
   - Email: john@example.com
   - Phone: 1234567890
4. **Assign to:** Select team member(s)
5. Click **"Save"** or **"Create Lead"**
6. Assigned users receive notification

**Verification:**
- ✅ Assigned users receive notification
- ✅ Title: "New lead added 🆕"
- ✅ Body: "John Doe is now in your CRM."

---

### 9. Lead Status Changed 🔄
**Expected:** "Lead updated 🔄" / "[Lead Name] moved to [Status]."

**How to Test:**
1. Go to **CRM** → **Leads**
2. Click on any existing lead
3. Change **Status** field:
   - From: "New" → To: "Contacted"
   - Or any status change
4. Click **"Save"** or **"Update"**
5. Assigned users receive notification

**Verification:**
- ✅ Title: "Lead updated 🔄"
- ✅ Body: "[Lead Name] moved to Contacted." (or whatever status)

---

### 10. Automation Message Sent ✅
**Expected:** "Automation sent ✅" / "Message delivered to [Lead Name]."

**How to Test:**
1. Go to **CRM** → **Automations**
2. Create or trigger an automation:
   - Select a lead
   - Choose automation template (email/WhatsApp)
   - Send message
3. When message sends successfully, notification triggers

**Alternative - Manually Trigger:**
```javascript
// In browser console
await $fetch('/api/lead/test-automation-sent', {
  method: 'POST',
  body: {
    leadId: LEAD_ID,
    leadName: 'John Doe'
  }
});
```

**Verification:**
- ✅ Title: "Automation sent ✅"
- ✅ Body: "Message delivered to [Lead Name]."

---

### 11. Automation Message Failed ⚠️
**Expected:** "Automation failed ⚠️" / "Message not delivered."

**How to Test:**
1. Go to **CRM** → **Automations**
2. Create automation with **invalid data**:
   - Invalid email address
   - Invalid phone number
3. Attempt to send
4. When send fails, notification triggers

**OR use test endpoint:**
```javascript
// In browser console
await $fetch('/api/lead/test-automation-failed', {
  method: 'POST',
  body: {
    leadId: LEAD_ID,
    leadName: 'John Doe'
  }
});
```

**Verification:**
- ✅ Title: "Automation failed ⚠️"
- ✅ Body: "Message not delivered."

---

## 📅 **Rota/HR/Leave Module (4 notifications)**

### 12. New Rota Published 📅
**Expected:** "New rota available 📅" / "Check your upcoming shifts."

**How to Test:**
1. Login as **Admin/Manager**
2. Go to **Team** → **Rota Management**
3. Create a new rota/schedule:
   - Select week
   - Add shifts for team members
4. Click **"Publish Rota"** or change status to **"Active"**
5. Assigned team members receive notification

**Verification:**
- ✅ Title: "New rota available 📅"
- ✅ Body: "Check your upcoming shifts."

---

### 13. Upcoming Shift Reminder ⏳
**Expected:** "Shift reminder ⏳" / "You're scheduled on [Date]."

**How to Test:**

**Option 1: Create Shift for Tomorrow**
1. Go to **Rota Management**
2. Create a shift for **tomorrow**
3. Assign to yourself or team member
4. Wait for scheduler (runs daily at 9 AM) OR manually trigger:

**Option 2: Manual Trigger**
```javascript
// Create test script: test-shift-reminder.js
import { sendShiftReminderNotification } from './server/utils/fcmNotification.js';

await sendShiftReminderNotification({
  userId: YOUR_USER_ID,
  shiftDate: 'Tomorrow',
  shiftTime: '9:00 AM'
});
```

**Verification:**
- ✅ Title: "Shift reminder ⏳"
- ✅ Body: "You're scheduled on [Date]."

---

### 14. Leave Approved ✅
**Expected:** "Leave approved ✅" / "Your schedule has been updated."

**How to Test:**
1. **As Employee:**
   - Go to **Team** → **Holiday/Leave**
   - Click **"Request Leave"**
   - Select dates
   - Submit request

2. **As Admin/Manager:**
   - Go to leave requests
   - Find the pending request
   - Click **"Approve"**
   - Employee receives notification

**Verification:**
- ✅ Title: "Leave approved ✅"
- ✅ Body: "Your schedule has been updated."

---

### 15. Leave Denied ❌
**Expected:** "Leave request update ❌" / "Please review the decision."

**How to Test:**
1. **As Employee:**
   - Submit leave request (same as above)

2. **As Admin/Manager:**
   - Find the pending request
   - Click **"Deny"** or **"Reject"**
   - Employee receives notification

**Verification:**
- ✅ Title: "Leave request update ❌"
- ✅ Body: "Please review the decision."

---

## 💬 **Support Module (2 notifications)**

### 16. Support Ticket Submitted ✅
**Expected:** "Support request received ✅" / "We'll get back to you shortly."

**How to Test:**
1. Go to **Support** or **Help** section
2. Click **"Contact Support"** or **"New Ticket"**
3. Fill in:
   - Subject: "Test notification"
   - Message: "Testing support notification"
4. Click **"Submit"** or **"Send"**
5. You should receive confirmation notification

**Verification:**
- ✅ Title: "Support request received ✅"
- ✅ Body: "We'll get back to you shortly."
- ✅ Notification navigates to support chat

---

### 17. New Support Reply 💬
**Expected:** "New support message 💬" / "A reply is waiting for you."

**How to Test:**
1. **As User:** Submit a support ticket (see above)
2. **As Admin/Support Agent:**
   - Go to support chat/tickets
   - Find the user's ticket
   - Type a reply: "Thanks for contacting us!"
   - Click **"Send"**
3. **User** receives notification

**Verification:**
- ✅ Title: "New support message 💬"
- ✅ Body: "A reply is waiting for you."
- ✅ Clicking navigates to support chat

---

## 🎯 **Quick Testing Checklist**

Use this for rapid testing:

```
General Module:
[ ] Welcome – Subscription Confirmed
[ ] Account Created
[ ] Reset Account Password
[ ] Portal Ready – Book Training

Tasks Module:
[ ] New Task Assigned
[ ] Task Reminder (Overdue)
[ ] Task Completed

CRM Module:
[ ] New Lead Added
[ ] Lead Status Changed
[ ] Automation Message Sent
[ ] Automation Message Failed

Rota/Leave Module:
[ ] New Rota Published
[ ] Upcoming Shift Reminder
[ ] Leave Approved
[ ] Leave Denied

Support Module:
[ ] Support Ticket Submitted
[ ] New Support Reply
```

---

## 🔍 **Troubleshooting**

### No Notification Received?

**Check 1: FCM Token**
```javascript
// In browser console
const health = await $fetch('/api/notifications/health-check');
console.log(health);
// Should show active tokens
```

**Check 2: Permission**
```javascript
console.log(Notification.permission); // Should be "granted"
```

**Check 3: Service Worker**
- Open DevTools → Application → Service Workers
- Should see `firebase-messaging-sw.js` active

**Check 4: Browser Console**
- Look for errors related to FCM or notifications
- Check for "Token saved successfully" message

**Check 5: Server Logs**
- Check server console for notification send confirmations
- Look for errors in FCM sending

### Notification Received but Wrong Text?

- Clear browser cache
- Hard refresh (Cmd+Shift+R / Ctrl+Shift+R)
- Re-deploy server changes
- Check that latest code is running

---

## 📝 **Testing Tips**

1. **Use Two Browser Windows:**
   - Window 1: Admin/Manager account
   - Window 2: Regular user account
   - Trigger actions in Window 1, receive in Window 2

2. **Use Incognito Mode:**
   - Test fresh user experience
   - Avoid cached data issues

3. **Check Network Tab:**
   - Monitor API calls
   - Verify notification payload

4. **Mobile Testing:**
   - Test on actual mobile devices
   - PWA notifications work differently

5. **Time-Based Notifications:**
   - Schedulers run at specific times
   - Use manual triggers for faster testing
   - Check server timezone settings

---

## 🚀 **Automated Testing Script**

Create a test script for rapid testing:

```javascript
// test-all-notifications.js
const tests = [
  {
    name: 'Task Assigned',
    endpoint: '/api/tasks',
    method: 'POST',
    body: { title: 'Test Task', assignedTo: USER_ID }
  },
  {
    name: 'Lead Created',
    endpoint: '/api/lead',
    method: 'POST',
    body: { name: 'Test Lead', assignedTo: USER_ID }
  },
  // Add more...
];

for (const test of tests) {
  console.log(`Testing: ${test.name}`);
  await $fetch(test.endpoint, {
    method: test.method,
    body: test.body
  });
  await new Promise(r => setTimeout(r, 2000)); // Wait 2s between tests
}
```

---

**Happy Testing! 🎉**

If you encounter any issues, check the main documentation: `FCM_FIXES_DOCUMENTATION.md`
