# 🚨 คู่มือแก้ปัญหา Deployment บน Render

## ปัญหาที่พบบ่อยและวิธีแก้ไข

### 1. Build Failed

#### อาการ:
```
Build failed with exit code 1
npm ERR! Cannot find module...
```

#### วิธีแก้:
1. ตรวจสอบว่า `package.json` และ `package-lock.json` อยู่ในโฟลเดอร์ `server/`
2. ตรวจสอบ Root Directory ใน Render ตั้งเป็น `server`
3. Build Command: `npm install`
4. Start Command: `node server.js`

---

### 2. Server ไม่ Start

#### อาการ:
```
Server failed to start
Error: Cannot find module 'express'
```

#### วิธีแก้:
1. ตรวจสอบ dependencies ใน package.json:
```json
{
  "dependencies": {
    "cors": "^2.8.5",
    "express": "^4.18.2",
    "express-rate-limit": "^8.2.1"
  }
}
```

2. Redeploy โดยคลิก "Manual Deploy" → "Clear build cache & deploy"

---

### 3. ไม่สามารถเชื่อมต่อ API

#### อาการ:
- Browser Console แสดง: `Failed to fetch`
- Connection Status: "ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์"

#### วิธีแก้:

**ตรวจสอบ API Base URL:**

ใน `admin.js` และ `participant.js`:
```javascript
// ✅ ถูกต้อง
const API_BASE_URL = window.location.origin;

// ❌ ผิด
const API_BASE_URL = 'https://santa-gift-secret.onrender.com';
```

**ตรวจสอบ CORS:**
ใน `server.js`:
```javascript
app.use(cors({
    origin: '*', // อนุญาตทุก origin
    methods: ['GET', 'POST', 'DELETE'],
    credentials: true
}));
```

---

### 4. Static Files ไม่แสดง

#### อาการ:
- หน้าเว็บแสดงเป็น JSON แทนที่จะเป็น HTML
- CSS ไม่โหลด

#### วิธีแก้:

**ตรวจสอบโครงสร้างไฟล์:**
```
project/
├── client/           ← ไฟล์ HTML, CSS, JS
│   ├── admin.html
│   ├── admin.js
│   ├── participant.html
│   ├── participant.js
│   └── styles.css
└── server/          ← โค้ด backend
    ├── server.js
    └── package.json
```

**ตรวจสอบ server.js:**
```javascript
// ✅ Static files ต้องมาหลัง API routes
app.use(express.static(path.join(__dirname, '../client')));

// Routes สำหรับ HTML
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../client/participant.html'));
});
```

---

### 5. Environment Variables ไม่ทำงาน

#### อาการ:
- ไม่สามารถ login admin ได้
- Server ใช้รหัสผ่านเริ่มต้น

#### วิธีแก้:

1. ไปที่ Render Dashboard
2. เลือก Web Service
3. ไปที่ **Environment** tab
4. เพิ่ม/แก้ไข variables:
   - `ADMIN_PASSWORD` = `your-password`
   - `NODE_ENV` = `production`
5. คลิก "Save Changes"
6. Render จะ redeploy อัตโนมัติ

---

### 6. Port Already in Use (Local Development)

#### อาการ:
```
Error: listen EADDRINUSE: address already in use :::3000
```

#### วิธีแก้:

**Windows:**
```bash
netstat -ano | findstr :3000
taskkill /PID <PID> /F
```

**Mac/Linux:**
```bash
lsof -ti:3000 | xargs kill -9
```

หรือเปลี่ยน PORT:
```bash
PORT=3001 npm start
```

---

### 7. Database (data.json) หาย

#### อาการ:
- ผู้เข้าร่วมหายหลัง restart
- ผลการจับฉลากหาย

#### สาเหตุ:
- Render Free Tier ไม่มี persistent storage
- ทุกครั้งที่ restart ไฟล์จะถูกลบ

#### วิธีแก้:
1. **สำหรับ Production จริง:** ใช้ database เช่น MongoDB, PostgreSQL
2. **สำหรับงาน one-time:** ใช้แค่ระหว่างงาน แล้ว screenshot ผลลัพธ์ไว้

---

### 8. Slow Cold Start

#### อาการ:
- เว็บไซต์ใช้เวลานาน 30-50 วินาทีในการโหลดครั้งแรก

#### สาเหตุ:
- Render Free Tier จะหยุด instance หลังไม่มีการเข้าถึง 15 นาที
- ต้อง "wake up" instance ใหม่

#### วิธีแก้:
1. **ยอมรับ:** Free tier มี limitation นี้
2. **ป้องกัน:** Upgrade เป็น Paid plan ($7/month)
3. **Workaround:** ใช้ Cron job ping ทุก 10 นาที (แต่อาจผิด ToS)

---

### 9. แอดมินเข้าไม่ได้

#### วิธีแก้:

**ตรวจสอบรหัสผ่าน:**
1. ดู Render Logs:
   - Dashboard → Logs
   - หา line: `🔐 Admin Password: xxx`

2. ถ้าไม่มี environment variable จะใช้ default: `admin2026`

3. ตั้ง ADMIN_PASSWORD ใหม่:
   - Environment tab
   - Add: `ADMIN_PASSWORD` = `your-new-password`
   - Save & Redeploy

---

### 10. CORS Error

#### อาการ:
```
Access to fetch at 'https://...' from origin '...' has been blocked by CORS policy
```

#### วิธีแก้:

ตรวจสอบ server.js:
```javascript
const cors = require('cors');

app.use(cors({
    origin: '*', // อนุญาตทุก origin
    methods: ['GET', 'POST', 'DELETE'],
    credentials: true
}));
```

ถ้าต้องการเฉพาะเจาะจง:
```javascript
app.use(cors({
    origin: 'https://your-domain.onrender.com',
    methods: ['GET', 'POST', 'DELETE'],
    credentials: true
}));
```

---

## 🔍 วิธีดู Logs บน Render

1. ไปที่ Render Dashboard
2. คลิก Web Service
3. ไปที่ tab **Logs**
4. ดู real-time logs หรือ download

**สิ่งที่ควรมองหา:**
- `✅ เชื่อมต่อ Server สำเร็จ`
- `🎉 จับฉลากสำเร็จ!`
- `❌ Error:` ต่างๆ

---

## 📞 ติดต่อ Support

หากแก้ไม่ได้:
1. ตรวจสอบ Render Status: https://status.render.com/
2. ดู Render Documentation: https://render.com/docs
3. Community Forum: https://community.render.com/
4. Support (Paid plans only): support@render.com

---

## ✅ Checklist สำหรับ Deployment

- [ ] โครงสร้างไฟล์ถูกต้อง (server/ และ client/)
- [ ] package.json มี dependencies ครบ
- [ ] Root Directory = `server`
- [ ] Build Command = `npm install`
- [ ] Start Command = `node server.js`
- [ ] Environment Variables ตั้งค่าแล้ว
- [ ] CORS configuration ถูกต้อง
- [ ] API endpoints ไม่มี /api/ prefix
- [ ] API_BASE_URL = window.location.origin
- [ ] ทดสอบ local ผ่านแล้ว

---

## 🎯 Quick Fix Commands

### Clear Cache & Redeploy
Dashboard → Manual Deploy → Clear build cache & deploy

### View Environment
Dashboard → Environment → ดู/แก้ไข variables

### Restart Service
Dashboard → Manual Deploy → Deploy latest commit

### Roll Back
Dashboard → Events → เลือก deploy ก่อนหน้า → Roll back