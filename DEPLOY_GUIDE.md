# 🚀 คู่มือการ Deploy Secret Santa 2026

## 📖 Deploy คืออะไร?

**Deploy (การติดตั้ง/เผยแพร่)** คือการนำโปรแกรมที่เขียนเสร็จแล้วไปติดตั้งบน Server จริง เพื่อให้คนอื่นเข้าถึงได้ผ่านอินเทอร์เน็ต

### ทำไมต้อง Deploy?

**ก่อน Deploy:**
- โปรแกรมรันแค่ `localhost` (คอมพิวเตอร์ของคุณ)
- เข้าถึงได้แค่ `http://localhost:3000`
- คนอื่นเข้าไม่ได้ (เว้นแต่จะอยู่ LAN เดียวกัน)

**หลัง Deploy:**
- โปรแกรมรันบน Cloud Server
- มี URL จริง เช่น `https://secret-santa-2026.onrender.com`
- ใครก็เข้าได้จากทั่วโลก (มีอินเทอร์เน็ต)

---

## 🏆 แนะนำ Platform สำหรับ Deploy

### 1. **Render** ⭐⭐⭐⭐⭐ (แนะนำที่สุด)
- ✅ **ฟรี** (มี Free Tier)
- ✅ ใช้งานง่ายที่สุด
- ✅ Deploy Node.js ได้ตรงๆ
- ✅ มี PostgreSQL ฟรี (ถ้าต้องการใช้ Database)
- ⚠️ Free Tier จะ sleep หลังไม่ใช้งาน 15 นาที (ต้องรอ 30 วิเพื่อ wake up)

### 2. **Railway** ⭐⭐⭐⭐
- ✅ ฟรี 500 ชั่วโมง/เดือน ($5 credit)
- ✅ ใช้งานง่าย
- ✅ รวดเร็ว
- ⚠️ ต้องใส่ Credit Card (ไม่มีค่าใช้จ่ายถ้าไม่เกิน limit)

### 3. **Heroku** ⭐⭐⭐
- ⚠️ ไม่มี Free Tier แล้ว (ต้องจ่าย $5-7/เดือน)
- ✅ มีชื่อเสียง stable
- ✅ Documentation ดี

### 4. **Vercel** ⭐⭐⭐
- ✅ ฟรี
- ✅ เหมาะสำหรับ Frontend + Serverless
- ⚠️ ไม่เหมาะกับ Backend แบบ Express (ต้องแปลงเป็น Serverless)

---

## 📝 วิธี Deploy บน Render (แนะนำ)

### ขั้นตอนที่ 1: เตรียมโค้ด

#### 1.1 สร้าง Account GitHub
1. ไปที่ https://github.com
2. Sign up (สมัครฟรี)
3. ยืนยัน Email

#### 1.2 อัพโหลดโค้ดขึ้น GitHub

```bash
# เข้าไปในโฟลเดอร์โปรเจค
cd secret-santa-app

# เริ่มต้น Git
git init

# สร้างไฟล์ .gitignore
echo "node_modules/" > .gitignore
echo "data.json" >> .gitignore

# เพิ่มไฟล์ทั้งหมด
git add .

# Commit
git commit -m "Initial commit"

# สร้าง Repository ใหม่บน GitHub
# (ทำผ่านเว็บ github.com -> New repository -> ตั้งชื่อ "secret-santa-app")

# เชื่อมโยงกับ GitHub
git remote add origin https://github.com/YOUR_USERNAME/secret-santa-app.git

# Push ขึ้น GitHub
git push -u origin main
```

#### 1.3 แก้ไขไฟล์ให้พร้อม Deploy

**เพิ่มใน `server/package.json`:**
```json
{
  "scripts": {
    "start": "node server.js"
  },
  "engines": {
    "node": ">=18.0.0"
  }
}
```

**แก้ไข `server/server.js`:**
```javascript
// เปลี่ยนจาก
const PORT = 3000;

// เป็น
const PORT = process.env.PORT || 3000;
```

**สร้างไฟล์ `render.yaml`** ในโฟลเดอร์หลัก:
```yaml
services:
  - type: web
    name: secret-santa-app
    env: node
    buildCommand: cd server && npm install
    startCommand: cd server && npm start
    envVars:
      - key: NODE_ENV
        value: production
```

### ขั้นตอนที่ 2: Deploy บน Render

#### 2.1 สร้าง Account Render
1. ไปที่ https://render.com
2. Sign up ด้วย GitHub account
3. Authorize Render เข้าถึง GitHub

#### 2.2 สร้าง Web Service
1. คลิก **"New +"** → **"Web Service"**
2. เลือก Repository ที่สร้างไว้ (`secret-santa-app`)
3. ตั้งค่าดังนี้:
   - **Name**: `secret-santa-2026` (หรือชื่อที่ต้องการ)
   - **Region**: Singapore (ใกล้ที่สุด)
   - **Branch**: `main`
   - **Root Directory**: `server`
   - **Environment**: `Node`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Instance Type**: `Free`

4. คลิก **"Create Web Service"**

#### 2.3 รอ Deploy (ประมาณ 3-5 นาที)

Render จะ:
1. Clone โค้ดจาก GitHub
2. ติดตั้ง Dependencies (`npm install`)
3. รัน Server (`npm start`)
4. ให้ URL สำหรับเข้าถึง

#### 2.4 ได้ URL แล้ว! 🎉

คุณจะได้ URL แบบนี้:
```
https://secret-santa-2026.onrender.com
```

**ทดสอบ:**
- หน้าพนักงาน: `https://secret-santa-2026.onrender.com/participant`
- หน้าแอดมิน: `https://secret-santa-2026.onrender.com/admin`

### ขั้นตอนที่ 3: แก้ไข API URL ใน Frontend

**แก้ไขในไฟล์:**
- `client/participant.js`
- `client/admin.js`

**เปลี่ยนจาก:**
```javascript
const API_BASE_URL = 'http://localhost:3000/api';
```

**เป็น:**
```javascript
// ใช้ URL ที่ได้จาก Render (เปลี่ยนตามของคุณ)
const API_BASE_URL = 'https://secret-santa-2026.onrender.com/api';

// หรือใช้แบบ Dynamic (แนะนำ)
const API_BASE_URL = window.location.hostname === 'localhost' 
    ? 'http://localhost:3000/api'
    : `${window.location.origin}/api`;
```

**Commit และ Push:**
```bash
git add .
git commit -m "Update API URL for production"
git push
```

Render จะ Auto-deploy ใหม่อัตโนมัติ!

---

## 🔧 การจัดการหลัง Deploy

### การอัพเดทโค้ด
```bash
# แก้โค้ดในเครื่อง
# แล้ว commit และ push

git add .
git commit -m "ข้อความอธิบายการแก้ไข"
git push

# Render จะ auto-deploy ภายใน 2-3 นาที
```

### การดู Logs (Debug)
1. เข้า Render Dashboard
2. คลิกที่ Web Service ของคุณ
3. ไปที่แท็บ **"Logs"**
4. จะเห็น console.log() และ error messages

### การตั้งค่า Environment Variables
1. เข้า Render Dashboard
2. คลิกที่ Web Service
3. ไปที่ **"Environment"**
4. เพิ่มตัวแปร เช่น:
   - `ADMIN_PASSWORD=รหัสผ่านแอดมิน`
   - `NODE_ENV=production`

---

## 💾 การจัดการข้อมูล (Data Persistence)

### ปัญหา: ข้อมูลหายเมื่อ Restart

Render Free Tier จะ restart service เป็นระยะ ทำให้ไฟล์ `data.json` หาย

### วิธีแก้: ใช้ Database จริง

#### ตัวเลือก 1: MongoDB Atlas (ฟรี)

**ขั้นตอน:**
1. สมัคร https://www.mongodb.com/cloud/atlas
2. สร้าง Cluster ฟรี
3. ได้ Connection String
4. ติดตั้ง `mongoose` ใน project
5. แก้โค้ดให้ใช้ MongoDB แทน JSON file

**ตัวอย่างโค้ด:**
```javascript
const mongoose = require('mongoose');

// เชื่อมต่อ MongoDB
mongoose.connect(process.env.MONGODB_URI);

// สร้าง Schema
const ParticipantSchema = new mongoose.Schema({
    name: String,
    receiver: String
});

const Participant = mongoose.model('Participant', ParticipantSchema);
```

#### ตัวเลือก 2: PostgreSQL บน Render (ฟรี)

1. ใน Render Dashboard คลิก **"New +"** → **"PostgreSQL"**
2. ได้ Connection String
3. ติดตั้ง `pg` ใน project
4. แก้โค้ดให้ใช้ PostgreSQL

---

## 🔐 Security Best Practices

### 1. ซ่อนรหัสผ่านแอดมิน
```javascript
// server/server.js
// เปลี่ยนจาก
const ADMIN_PASSWORD = 'admin2026';

// เป็น
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin2026';
```

**ตั้งค่าใน Render:**
- Environment Variables → Add
- Key: `ADMIN_PASSWORD`
- Value: `รหัสผ่านที่แข็งแกร่ง`

### 2. ใช้ HTTPS
- Render ให้ HTTPS ฟรี (มี SSL Certificate)
- URL จะเป็น `https://` โดยอัตโนมัติ

### 3. Rate Limiting
```bash
npm install express-rate-limit
```

```javascript
const rateLimit = require('express-rate-limit');

const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 นาที
    max: 100 // จำกัด 100 requests ต่อ IP
});

app.use('/api/', limiter);
```

---

## 📊 Monitoring

### 1. Render Dashboard
- ดู CPU, Memory usage
- ดู Request count
- ดู Error rate

### 2. Google Analytics (ถ้าต้องการ)
เพิ่มใน `<head>` ของ HTML:
```html
<!-- Google Analytics -->
<script async src="https://www.googletagmanager.com/gtag/js?id=G-XXXXXXXXXX"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());
  gtag('config', 'G-XXXXXXXXXX');
</script>
```

---

## 🐛 Troubleshooting

### ปัญหา: Application Error (500)
**วิธีแก้:**
1. ดู Logs ใน Render
2. เช็ค `package.json` มี `start` script หรือไม่
3. เช็ค PORT ใช้ `process.env.PORT`

### ปัญหา: Build Failed
**วิธีแก้:**
1. เช็ค `package.json` dependencies ครบหรือไม่
2. ลอง `npm install` ในเครื่องก่อน
3. ดู Build Logs

### ปัญหา: ไม่เชื่อมต่อ Frontend-Backend
**วิธีแก้:**
1. เช็ค CORS middleware
2. เช็ค API_BASE_URL ถูกต้องหรือไม่
3. เช็ค Browser Console (F12) ดู error

### ปัญหา: Service Sleep (Free Tier)
**วิธีแก้:**
- Free Tier จะ sleep หลัง 15 นาทีไม่ใช้งาน
- ต้องรอ 30 วิ เพื่อ wake up
- **แนวทางแก้:**
  - Upgrade to Paid Plan ($7/month)
  - ใช้ [UptimeRobot](https://uptimerobot.com/) ping ทุก 5 นาที (ฟรี)

---

## 💰 ค่าใช้จ่าย

### Render Free Tier
- ✅ Free Web Service 1 instance
- ✅ 750 ชั่วโมง/เดือน
- ✅ 512 MB RAM
- ⚠️ จะ sleep หลังไม่ใช้งาน 15 นาที
- ⚠️ Shared CPU

### Render Paid ($7/month)
- ✅ Always on (ไม่ sleep)
- ✅ 512 MB RAM
- ✅ Dedicated CPU

---

## 📱 แชร์ลิงค์ให้พนักงาน

หลัง Deploy แล้ว ให้แชร์ลิงค์นี้:

**สำหรับพนักงาน:**
```
https://YOUR-APP-NAME.onrender.com/participant
```

**สำหรับแอดมิน:**
```
https://YOUR-APP-NAME.onrender.com/admin
รหัสผ่าน: admin2026 (หรือที่ตั้งไว้)
```

---

## 🎓 สรุป

**Deploy = ทำให้คนอื่นเข้าถึงโปรแกรมได้จากอินเทอร์เน็ต**

**ขั้นตอนหลัก:**
1. อัพโหลดโค้ดขึ้น GitHub
2. สร้าง Web Service บน Render
3. แก้ API URL ให้ชี้ไปที่ Production
4. แชร์ลิงค์ให้พนักงาน

**ใช้เวลาทั้งหมด:** 15-30 นาที (ครั้งแรก)

ขอให้ Deploy สำเร็จครับ! 🚀