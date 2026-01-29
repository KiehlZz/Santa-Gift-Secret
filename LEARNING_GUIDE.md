# 📚 คู่มือการเรียนรู้โค้ด Secret Santa

## 🎯 ภาพรวมของโปรเจค

โปรเจคนี้แบ่งเป็น 2 ส่วนหลัก:
1. **Backend (Server)** - จัดการข้อมูลและ Business Logic
2. **Frontend (Client)** - แสดงผลและรับข้อมูลจากผู้ใช้

---

## 📂 ส่วนที่ 1: Backend (Server)

### ไฟล์: `server/package.json`

**ไฟล์นี้ทำอะไร:**
- จัดการ dependencies (โมดูลที่โปรเจคต้องการ)
- กำหนดคำสั่งที่ใช้รันโปรเจค

**โครงสร้าง:**
```json
{
  "dependencies": {
    "express": "^4.18.2",  // Web Framework สำหรับสร้าง API
    "cors": "^2.8.5"       // อนุญาตให้ Client เรียก API ข้าม domain
  }
}
```

**คำสั่งที่สำคัญ:**
- `npm install` - ติดตั้ง dependencies ทั้งหมด
- `npm start` - รัน Server

---

### ไฟล์: `server/server.js`

**ไฟล์นี้ทำอะไร:**
- สร้าง REST API สำหรับจัดการข้อมูล
- เก็บข้อมูลในไฟล์ JSON
- จัดการ Business Logic (เช่น Derangement Algorithm)

#### **ส่วนที่ 1: การนำเข้า Module**

```javascript
const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
```

**อธิบาย:**
- `express` - Framework สำหรับสร้าง Web Server
- `cors` - Middleware สำหรับจัดการ CORS (Cross-Origin Resource Sharing)
- `fs` - Module สำหรับจัดการไฟล์ (File System)
- `path` - Module สำหรับจัดการ path ของไฟล์

#### **ส่วนที่ 2: การตั้งค่า Express**

```javascript
const app = express();
const PORT = 3000;

app.use(cors());                    // เปิดใช้ CORS
app.use(express.json());            // แปลง JSON ใน Request Body
app.use(express.static(...));       // เสิร์ฟไฟล์ Static (HTML, CSS, JS)
```

**อธิบาย:**
- `app.use()` - ใช้สำหรับเพิ่ม Middleware
- Middleware คือฟังก์ชันที่ทำงานก่อนที่ Request จะถึง Route Handler

#### **ส่วนที่ 3: การจัดการไฟล์ Database**

```javascript
function readData() {
    // อ่านไฟล์ data.json
    // ถ้าไม่มีไฟล์ ให้สร้างใหม่
    // คืนค่าเป็น Object
}

function writeData(data) {
    // เขียนข้อมูลลงไฟล์ data.json
    // แปลง Object เป็น JSON string ก่อน
}
```

**อธิบาย:**
- ใช้ `fs.readFileSync()` สำหรับอ่านไฟล์
- ใช้ `fs.writeFileSync()` สำหรับเขียนไฟล์
- ใช้ `JSON.parse()` แปลง JSON string เป็น Object
- ใช้ `JSON.stringify()` แปลง Object เป็น JSON string

#### **ส่วนที่ 4: Derangement Algorithm**

```javascript
function generateDerangement(arr) {
    // 1. สร้างสำเนาของ array
    let original = [...arr];
    let result = [...arr];
    
    while (attempts < maxAttempts) {
        // 2. สุ่มเรียงลำดับใหม่ (Fisher-Yates Shuffle)
        for (let i = result.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [result[i], result[j]] = [result[j], result[i]];
        }
        
        // 3. ตรวจสอบว่าไม่มีใครอยู่ในตำแหน่งเดิม
        let isValid = true;
        for (let i = 0; i < original.length; i++) {
            if (original[i] === result[i]) {
                isValid = false;
                break;
            }
        }
        
        // 4. ถ้าถูกต้อง ส่งผลลัพธ์กลับ
        if (isValid) return result;
    }
}
```

**อธิบาย:**
- **Fisher-Yates Shuffle**: อัลกอริทึมสำหรับสุ่มเรียงลำดับ array
- **Derangement**: การเรียงลำดับที่ไม่มีสมาชิกตัวใดอยู่ในตำแหน่งเดิม
- วนลองสุ่มจนกว่าจะได้ผลลัพธ์ที่ถูกต้อง

#### **ส่วนที่ 5: API Endpoints**

##### **GET /api/status**

```javascript
app.get('/api/status', (req, res) => {
    const data = readData();
    res.json({
        success: true,
        data: {
            totalParticipants: data.participants.length,
            isDrawn: data.isDrawn,
            participants: data.participants
        }
    });
});
```

**อธิบาย:**
- `app.get(path, callback)` - สร้าง GET endpoint
- `req` - Request object (ข้อมูลที่ส่งมา)
- `res` - Response object (สำหรับส่งข้อมูลกลับ)
- `res.json()` - ส่งข้อมูลกลับเป็น JSON

##### **POST /api/register**

```javascript
app.post('/api/register', (req, res) => {
    const { name } = req.body;  // ดึงข้อมูลจาก Request Body
    
    if (!name || name.trim() === '') {
        return res.status(400).json({
            success: false,
            message: 'กรุณาระบุชื่อ'
        });
    }
    
    const data = readData();
    
    if (data.participants.includes(name)) {
        return res.status(400).json({
            success: false,
            message: 'ชื่อนี้ลงทะเบียนแล้ว'
        });
    }
    
    data.participants.push(name);
    writeData(data);
    
    res.status(201).json({
        success: true,
        message: 'ลงทะเบียนสำเร็จ'
    });
});
```

**อธิบาย:**
- `app.post(path, callback)` - สร้าง POST endpoint
- `req.body` - ข้อมูลที่ส่งมาใน Request Body (ต้องใช้ express.json() middleware)
- `res.status(code)` - กำหนด HTTP Status Code
  - 200: OK
  - 201: Created
  - 400: Bad Request
  - 404: Not Found
  - 500: Internal Server Error

##### **DELETE /api/participants/:name**

```javascript
app.delete('/api/participants/:name', (req, res) => {
    const { name } = req.params;  // ดึงข้อมูลจาก URL Parameter
    
    const data = readData();
    const index = data.participants.indexOf(name);
    
    if (index === -1) {
        return res.status(404).json({
            success: false,
            message: 'ไม่พบชื่อนี้ในระบบ'
        });
    }
    
    data.participants.splice(index, 1);  // ลบออกจาก array
    writeData(data);
    
    res.json({
        success: true,
        message: 'ลบชื่อเรียบร้อยแล้ว'
    });
});
```

**อธิบาย:**
- `app.delete(path, callback)` - สร้าง DELETE endpoint
- `:name` - URL Parameter (ตัวแปรใน URL)
- `req.params` - Object ที่เก็บ URL Parameters
- `array.splice(index, count)` - ลบ element ออกจาก array

#### **ส่วนที่ 6: เริ่มต้น Server**

```javascript
app.listen(PORT, () => {
    console.log(`Server กำลังทำงานที่ http://localhost:${PORT}`);
});
```

**อธิบาย:**
- `app.listen(port, callback)` - เริ่มต้น Server ที่ port ที่กำหนด
- callback ทำงานเมื่อ Server เริ่มทำงานสำเร็จ

---

## 🎨 ส่วนที่ 2: Frontend (Client)

### ไฟล์: `client/index.html`

**ไฟล์นี้ทำอะไร:**
- กำหนดโครงสร้างของหน้าเว็บ
- แบ่งเป็น 3 หน้าหลัก: ลงทะเบียน, แอดมิน, ผลลัพธ์

**โครงสร้างสำคัญ:**

```html
<!DOCTYPE html>
<html lang="th">
<head>
    <meta charset="UTF-8">
    <title>Secret Santa 2026</title>
    <link rel="stylesheet" href="styles.css">  <!-- เชื่อมโยง CSS -->
</head>
<body>
    <!-- เนื้อหาของหน้าเว็บ -->
    
    <script src="app.js"></script>  <!-- เชื่อมโยง JavaScript -->
</body>
</html>
```

**อธิบาย:**
- `<link>` - เชื่อมโยงไฟล์ CSS
- `<script>` - เชื่อมโยงไฟล์ JavaScript
- HTML Elements มี `id` และ `class` สำหรับให้ CSS และ JS อ้างอิง

---

### ไฟล์: `client/styles.css`

**ไฟล์นี้ทำอะไร:**
- จัดการหน้าตาของเว็บไซต์
- กำหนดสี, ฟอนต์, เอฟเฟกต์

**โครงสร้างสำคัญ:**

```css
:root {
    /* CSS Variables - ตัวแปรที่ใช้ซ้ำได้ */
    --color-primary: #C41E3A;
    --color-secondary: #165B33;
}

.btn {
    background: var(--color-primary);  /* ใช้ตัวแปร */
    transition: all 0.3s ease;         /* เอฟเฟกต์การเปลี่ยนแปลง */
}

.btn:hover {
    transform: translateY(-2px);       /* เลื่อนขึ้นเมื่อ hover */
}

@keyframes fadeIn {
    from { opacity: 0; }
    to { opacity: 1; }
}
```

**อธิบาย:**
- **CSS Variables**: ตัวแปรที่ประกาศด้วย `--` และใช้ด้วย `var()`
- **Pseudo-classes**: `:hover`, `:active`, `:focus` เป็นต้น
- **Animations**: ใช้ `@keyframes` และ `animation` property

---

### ไฟล์: `client/app.js`

**ไฟล์นี้ทำอะไร:**
- จัดการ Logic ของหน้าเว็บ
- เรียก API จาก Server
- อัพเดท UI ตามข้อมูลที่ได้รับ

#### **ส่วนที่ 1: การตั้งค่า**

```javascript
const API_BASE_URL = 'http://localhost:3000/api';

let systemStatus = {
    isDrawn: false,
    totalParticipants: 0,
    participants: []
};
```

**อธิบาย:**
- ประกาศตัวแปรสำหรับเก็บ Base URL ของ API
- ประกาศตัวแปรสำหรับเก็บสถานะของระบบ

#### **ส่วนที่ 2: ฟังก์ชันเรียก API**

```javascript
async function callAPI(endpoint, method = 'GET', body = null) {
    try {
        const options = {
            method: method,
            headers: {
                'Content-Type': 'application/json'
            }
        };
        
        if (body) {
            options.body = JSON.stringify(body);
        }
        
        const response = await fetch(`${API_BASE_URL}${endpoint}`, options);
        const data = await response.json();
        
        return data;
    } catch (error) {
        console.error('API Error:', error);
        throw error;
    }
}
```

**อธิบาย:**
- **async/await**: ใช้สำหรับจัดการ Asynchronous Operations
- **fetch()**: ฟังก์ชันสำหรับเรียก API (built-in ใน Browser)
- **try/catch**: จัดการ Error

**การใช้งาน:**

```javascript
// GET Request
const data = await callAPI('/status', 'GET');

// POST Request
const data = await callAPI('/register', 'POST', { name: 'Alice' });

// DELETE Request
const data = await callAPI('/participants/Alice', 'DELETE');
```

#### **ส่วนที่ 3: Event Handlers**

```javascript
async function registerParticipant(event) {
    event.preventDefault();  // ป้องกันการ reload หน้า
    
    const nameInput = document.getElementById('participant-name');
    const name = nameInput.value.trim();
    
    if (!name) {
        showAlert('register-alert', 'กรุณากรอกชื่อ', 'error');
        return;
    }
    
    try {
        const response = await callAPI('/register', 'POST', { name });
        
        if (response.success) {
            showAlert('register-alert', response.message, 'success');
            nameInput.value = '';  // ล้างฟอร์ม
        }
    } catch (error) {
        showAlert('register-alert', 'เกิดข้อผิดพลาด', 'error');
    }
}
```

**อธิบาย:**
- **event.preventDefault()**: ป้องกันพฤติกรรมเริ่มต้นของ Form (การ reload หน้า)
- **document.getElementById()**: ดึง Element จาก DOM ด้วย ID
- **element.value**: ดึงค่าจาก Input Element

#### **ส่วนที่ 4: DOM Manipulation**

```javascript
function updateAdminView() {
    // อัพเดทตัวเลข
    document.getElementById('total-participants').textContent = 
        systemStatus.totalParticipants;
    
    // อัพเดทรายชื่อ
    const container = document.getElementById('participants-container');
    
    if (systemStatus.participants.length === 0) {
        container.innerHTML = '<p>ยังไม่มีผู้ลงทะเบียน</p>';
    } else {
        container.innerHTML = systemStatus.participants.map(name => `
            <div class="participant-item">
                <span>${name}</span>
                <button onclick="removeParticipant('${name}')">ลบ</button>
            </div>
        `).join('');
    }
}
```

**อธิบาย:**
- **textContent**: เปลี่ยนข้อความใน Element
- **innerHTML**: เปลี่ยน HTML ภายใน Element
- **array.map()**: วนลูป array และสร้าง HTML สำหรับแต่ละ element
- **array.join('')**: รวม array ของ string เป็น string เดียว

#### **ส่วนที่ 5: Event Listeners**

```javascript
window.addEventListener('DOMContentLoaded', async () => {
    // โค้ดนี้ทำงานเมื่อหน้าเว็บโหลดเสร็จ
    createSnowflakes();
    
    try {
        await callAPI('/status', 'GET');
        console.log('เชื่อมต่อ Server สำเร็จ');
    } catch (error) {
        alert('ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์');
    }
});
```

**อธิบาย:**
- **DOMContentLoaded**: Event ที่เกิดขึ้นเมื่อ HTML โหลดเสร็จ
- **addEventListener()**: ผูก Event Handler เข้ากับ Element

---

## 🔄 Flow การทำงานของระบบ

### 1. การลงทะเบียน

```
User กรอกชื่อในฟอร์ม
    ↓
Frontend: จับ Submit Event
    ↓
Frontend: เรียก POST /api/register
    ↓
Backend: รับข้อมูล { name: "Alice" }
    ↓
Backend: ตรวจสอบชื่อซ้ำ
    ↓
Backend: เพิ่มชื่อเข้า participants array
    ↓
Backend: เขียนลงไฟล์ data.json
    ↓
Backend: ส่ง Response กลับ { success: true }
    ↓
Frontend: แสดงข้อความสำเร็จ
```

### 2. การจับฉลาก

```
Admin กดปุ่ม "Happy New Year 2026"
    ↓
Frontend: เรียก POST /api/draw
    ↓
Backend: อ่านรายชื่อจาก data.json
    ↓
Backend: ใช้ Derangement Algorithm สุ่มจับคู่
    ↓
Backend: บันทึกผลลัพธ์ลง data.json
    ↓
Backend: ส่ง Response { success: true }
    ↓
Frontend: แสดงข้อความสำเร็จ
```

### 3. การดูผลลัพธ์

```
User กดปุ่ม "ตรวจสอบผลของฉัน"
    ↓
Frontend: ดึงชื่อจาก localStorage
    ↓
Frontend: เรียก GET /api/result/:name
    ↓
Backend: อ่านผลลัพธ์จาก data.json
    ↓
Backend: ส่งผลลัพธ์กลับ { giver: "Alice", receiver: "Bob" }
    ↓
Frontend: แสดงผลบนหน้าจอ
```

---

## 🎓 สรุปสิ่งที่ได้เรียนรู้

### Backend Concepts
1. ✅ การสร้าง REST API ด้วย Express.js
2. ✅ HTTP Methods: GET, POST, PUT, DELETE
3. ✅ การจัดการไฟล์ด้วย Node.js
4. ✅ Middleware และการทำงานของมัน
5. ✅ Error Handling
6. ✅ อัลกอริทึม (Derangement, Fisher-Yates Shuffle)

### Frontend Concepts
1. ✅ การเรียก API ด้วย Fetch
2. ✅ Async/Await และ Promises
3. ✅ DOM Manipulation
4. ✅ Event Handling
5. ✅ Form Validation
6. ✅ LocalStorage

### Full-Stack Concepts
1. ✅ Client-Server Architecture
2. ✅ RESTful API Design
3. ✅ JSON Data Format
4. ✅ CORS และความสำคัญของมัน
5. ✅ การจัดการ State
6. ✅ Error Handling ทั้ง Client และ Server

---

**เมื่อเข้าใจโครงสร้างนี้แล้ว คุณสามารถนำไปประยุกต์ใช้กับโปรเจคอื่นๆ ได้!** 🚀