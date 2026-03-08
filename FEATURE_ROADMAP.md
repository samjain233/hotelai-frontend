# Hotel AI — Feature Roadmap

## 🔥 High-Impact Features

### 1. Real-Time Kitchen Display System (KDS)
Full-screen TV-mode dashboard for kitchen monitors with large cards, auto-refresh, audio alerts for new orders, and color-coded timers showing how long each order has been waiting.

### 2. Analytics Dashboard
- Revenue charts (daily/weekly/monthly)
- Top-selling items with ranking
- Peak ordering hours heatmap
- Average order value trends
- Room-wise order frequency

### 3. Menu Item Image Upload
Drag-and-drop image upload for menu items (currently accepts `imageUrl` but no upload UI).

### 4. Push Notifications for Guests
Browser push notifications when order status changes (Confirmed → Preparing → Ready) so guests know when food is ready.

---

## ⭐ Medium-Impact Features

### 5. Multi-Language Menu
Language switching (English, Hindi, Arabic, etc.) for international guests.

### 6. Table/Room Service Toggle
Support for dine-in table ordering via QR codes on restaurant tables (currently room-service only).

### 7. Inventory Management
Track ingredient stock. Auto-mark items "Sold Out" when stock runs low, alert admin.

### 8. Guest Feedback & Ratings
Post-delivery quick rating modal (1-5 stars + optional comment). Display ratings on admin dashboard.

### 9. Scheduled Orders
Let guests pre-order (e.g., breakfast for 7:30 AM tomorrow).

### 10. Promo Banners & Special Offers
Admin-configurable featured items or happy hour deals shown as banners on guest menu.

---

## 🤖 AI-Powered Features

### 11. AI Chatbot Concierge
In-app chatbot for:
- Menu recommendations ("What's good here?")
- Dietary filtering ("I'm vegetarian")
- Hotel FAQ ("Where's the pool?")

### 12. Smart Recommendations
"Guests who ordered X also liked Y" — suggest complementary items to increase average order value.

### 13. Demand Prediction
Predict popular items by day/time so kitchen can prep accordingly.

---

## 🛠️ Admin & Operations

### 14. Multi-Staff Roles & Permissions
Role-based access gating — kitchen staff sees only orders, managers see everything. (Roles exist in schema: `OWNER | MANAGER | KITCHEN`)

### 15. Receipt/Invoice Generation
Printable PDF receipts with hotel branding, GST details, and itemized totals.

### 16. Multi-Hotel Support
Super-admin view to manage multiple properties from one account. (Schema already has `hotelId` per entity)

### 17. Order History Export
Export orders as CSV/Excel for accounting and tax purposes.

---

## 🏨 Guest Services (High Impact)

### 18. Complaint / Feedback System
Guest submits complaints with category (Room, Food, Staff, Facilities), description, and optional photo. Admin sees a real-time complaints dashboard with priority levels (Low/Medium/High/Urgent). Status tracking: Submitted → Acknowledged → Resolving → Resolved. Auto-escalation if not addressed within 30 minutes.

### 19. Room Service Requests
Quick-tap requests: Extra towels, pillows, blankets, toiletries, iron, water bottle. Custom requests with free-text input. Real-time status tracking. ETA display ("Your request will be fulfilled in ~15 minutes").

### 20. Housekeeping Requests
"Clean my room" button with preferred time slot. "Do not disturb" toggle (syncs with staff dashboard). Request specific items: extra bedsheets, garbage pickup, minibar refill.

---

## 🌟 Guest Experience (Medium Impact)

### 21. Hotel Info & Amenities Guide
WiFi password, checkout time, breakfast hours, pool timings. Interactive map of hotel facilities. Emergency contacts, front desk number.

### 22. Spa & Activity Booking
Browse spa treatments, gym sessions, guided tours. Book time slots directly from the app.

### 23. Checkout & Bill Summary
View total bill (room charges + food orders + services). Request early/late checkout. Digital receipt generation.

### 24. In-Room Entertainment Control
Request movie channels, extra remote, AC temperature complaints.

### 25. Wake-Up Call / Alarm
Set a wake-up call request through the app.

---

## 💬 Communication

### 26. Live Chat with Front Desk
Real-time messaging with hotel staff. Pre-set quick messages: "Need help", "Taxi please", "Room key issue".

### 27. Emergency SOS Button
One-tap emergency alert to hotel security. Sends room number automatically.

---

## 📊 Admin Enhancements

### 28. Guest Satisfaction Dashboard
Average ratings, complaint trends, response times. NPS (Net Promoter Score) tracking.

### 29. Staff Task Management
Assign complaints/requests to specific staff members. Track resolution time per staff.
