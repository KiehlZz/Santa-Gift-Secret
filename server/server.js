// ===== การนำเข้า Module ที่จำเป็น =====
const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

// ===== สร้าง Express Application =====
const app = express();
const PORT = 3000;

// ===== Middleware Configuration =====
// CORS: อนุญาตให้ Client จากโดเมนอื่นเรียก API ได้
app.use(cors());

// Express JSON Parser: แปลง JSON ใน Request Body ให้เป็น Object
app.use(express.json());

// Static Files: เสิร์ฟไฟล์ HTML, CSS, JS จากโฟลเดอร์ client
app.use(express.static(path.join(__dirname, '../client')));

// ===== Path สำหรับไฟล์ Database =====
const DATA_FILE = path.join(__dirname, 'data.json');

// ===== ฟังก์ชันสำหรับอ่านข้อมูลจากไฟล์ =====
function readData() {
    try {
        // ตรวจสอบว่าไฟล์มีอยู่หรือไม่
        if (!fs.existsSync(DATA_FILE)) {
            // ถ้าไม่มี สร้างไฟล์ใหม่พร้อมข้อมูลเริ่มต้น
            const initialData = {
                participants: [],
                results: {},
                isDrawn: false
            };
            fs.writeFileSync(DATA_FILE, JSON.stringify(initialData, null, 2));
            return initialData;
        }
        
        // อ่านไฟล์และแปลง JSON เป็น Object
        const data = fs.readFileSync(DATA_FILE, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        console.error('Error reading data:', error);
        return { participants: [], results: {}, isDrawn: false };
    }
}

// ===== ฟังก์ชันสำหรับเขียนข้อมูลลงไฟล์ =====
function writeData(data) {
    try {
        // แปลง Object เป็น JSON และเขียนลงไฟล์
        // null, 2 = จัดรูปแบบ JSON ให้อ่านง่าย (indent 2 spaces)
        fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
        return true;
    } catch (error) {
        console.error('Error writing data:', error);
        return false;
    }
}

// Derangement Algorithm 
function generateDerangementNoTwoCycle(arr) {
    let original = [...arr];
    let result = [...arr];
    let maxAttempts = 2000;
    let attempts = 0;

    while (attempts < maxAttempts) {
        // Shuffle
        for (let i = result.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [result[i], result[j]] = [result[j], result[i]];
        }

        let isValid = true;

        for (let i = 0; i < original.length; i++) {
            // ❌ ห้ามได้ของตัวเอง
            if (original[i] === result[i]) {
                isValid = false;
                break;
            }

            // ❌ ห้าม 2-cycle
            const j = original.indexOf(result[i]);
            if (result[j] === original[i]) {
                isValid = false;
                break;
            }
        }

        if (isValid) {
            return result;
        }

        attempts++;
    }

    return null;
}

// ========================================
// ===== API ENDPOINTS (RESTful API) =====
// ========================================

// ===== 1. GET / - หน้าแรก =====
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../client/index.html'));
});

// ===== 2. GET /api/status - ดูสถานะระบบ =====
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

// ===== 3. POST /api/register - ลงทะเบียนผู้เข้าร่วม =====
app.post('/api/register', (req, res) => {
    const { name } = req.body;

    // ตรวจสอบว่ามีการส่งชื่อมาหรือไม่
    if (!name || name.trim() === '') {
        return res.status(400).json({
            success: false,
            message: 'กรุณาระบุชื่อ'
        });
    }

    // อ่านข้อมูลปัจจุบัน
    const data = readData();

    // ตรวจสอบว่าชื่อซ้ำหรือไม่
    if (data.participants.includes(name)) {
        return res.status(400).json({
            success: false,
            message: 'ชื่อนี้ลงทะเบียนแล้ว'
        });
    }

    // เพิ่มชื่อเข้าไป
    data.participants.push(name);
    
    // บันทึกลงไฟล์
    if (writeData(data)) {
        res.status(201).json({
            success: true,
            message: 'ลงทะเบียนสำเร็จ',
            data: {
                name: name,
                totalParticipants: data.participants.length
            }
        });
    } else {
        res.status(500).json({
            success: false,
            message: 'เกิดข้อผิดพลาดในการบันทึกข้อมูล'
        });
    }
});

// ===== 4. GET /api/participants - ดูรายชื่อผู้เข้าร่วมทั้งหมด =====
app.get('/api/participants', (req, res) => {
    const data = readData();
    
    res.json({
        success: true,
        data: {
            participants: data.participants,
            count: data.participants.length
        }
    });
});

// ===== 5. DELETE /api/participants/:name - ลบผู้เข้าร่วม =====
app.delete('/api/participants/:name', (req, res) => {
    const { name } = req.params;
    const data = readData();

    // ตรวจสอบว่าจับฉลากแล้วหรือยัง
    if (data.isDrawn) {
        return res.status(400).json({
            success: false,
            message: 'ไม่สามารถลบผู้เข้าร่วมได้หลังจากจับฉลากแล้ว'
        });
    }

    // หาตำแหน่งของชื่อ
    const index = data.participants.indexOf(name);
    
    if (index === -1) {
        return res.status(404).json({
            success: false,
            message: 'ไม่พบชื่อนี้ในระบบ'
        });
    }

    // ลบชื่อออก
    data.participants.splice(index, 1);
    
    // บันทึกลงไฟล์
    if (writeData(data)) {
        res.json({
            success: true,
            message: 'ลบชื่อเรียบร้อยแล้ว',
            data: {
                remainingParticipants: data.participants.length
            }
        });
    } else {
        res.status(500).json({
            success: false,
            message: 'เกิดข้อผิดพลาดในการบันทึกข้อมูล'
        });
    }
});

// ===== 6. POST /api/draw - จับฉลาก =====
app.post('/api/draw', (req, res) => {
    const data = readData();

    // ตรวจสอบจำนวนผู้เข้าร่วม
    if (data.participants.length < 2) {
        return res.status(400).json({
            success: false,
            message: 'ต้องมีผู้เข้าร่วมอย่างน้อย 2 คน'
        });
    }

    // สุ่มจับฉลาก
    const receivers = generateDerangement(data.participants);

    if (!receivers) {
        return res.status(500).json({
            success: false,
            message: 'เกิดข้อผิดพลาดในการจับฉลาก กรุณาลองใหม่อีกครั้ง'
        });
    }

    // สร้างผลลัพธ์เป็น Object { ผู้ให้: ผู้รับ }
    const results = {};
    data.participants.forEach((giver, index) => {
        results[giver] = receivers[index];
    });

    // บันทึกผลลัพธ์
    data.results = results;
    data.isDrawn = true;

    if (writeData(data)) {
        res.json({
            success: true,
            message: 'จับฉลากสำเร็จ',
            data: {
                totalPairs: data.participants.length,
                drawnAt: new Date().toISOString()
            }
        });
    } else {
        res.status(500).json({
            success: false,
            message: 'เกิดข้อผิดพลาดในการบันทึกข้อมูล'
        });
    }
});

// ===== 7. GET /api/result/:name - ดูผลการจับฉลากของแต่ละคน =====
app.get('/api/result/:name', (req, res) => {
    const { name } = req.params;
    const data = readData();

    // ตรวจสอบว่าจับฉลากแล้วหรือยัง
    if (!data.isDrawn) {
        return res.status(400).json({
            success: false,
            message: 'ยังไม่ได้จับฉลาก'
        });
    }

    // ตรวจสอบว่าชื่อนี้มีในระบบหรือไม่
    if (!data.participants.includes(name)) {
        return res.status(404).json({
            success: false,
            message: 'ไม่พบชื่อนี้ในระบบ'
        });
    }

    // ดึงผลลัพธ์
    const receiver = data.results[name];

    res.json({
        success: true,
        data: {
            giver: name,
            receiver: receiver
        }
    });
});

// ===== 8. DELETE /api/reset - รีเซ็ตทั้งหมด =====
app.delete('/api/reset', (req, res) => {
    const initialData = {
        participants: [],
        results: {},
        isDrawn: false
    };

    if (writeData(initialData)) {
        res.json({
            success: true,
            message: 'รีเซ็ตระบบเรียบร้อยแล้ว'
        });
    } else {
        res.status(500).json({
            success: false,
            message: 'เกิดข้อผิดพลาดในการรีเซ็ตระบบ'
        });
    }
});

// ===== Error Handling Middleware =====
// จัดการข้อผิดพลาดที่ไม่ได้คาดคิด
app.use((err, req, res, next) => {
    console.error('Error:', err);
    res.status(500).json({
        success: false,
        message: 'เกิดข้อผิดพลาดภายในเซิร์ฟเวอร์'
    });
});

// ===== 404 Handler =====
// จัดการ URL ที่ไม่มีอยู่ในระบบ
app.use((req, res) => {
    res.status(404).json({
        success: false,
        message: 'ไม่พบ API Endpoint นี้'
    });
});

// ===== เริ่มต้น Server =====
app.listen(PORT, () => {
    console.log(`🎄 Secret Santa Server กำลังทำงานที่ http://localhost:${PORT}`);
    console.log(`📋 API Documentation:`);
    console.log(`   GET    /api/status             - ดูสถานะระบบ`);
    console.log(`   POST   /api/register           - ลงทะเบียนผู้เข้าร่วม`);
    console.log(`   GET    /api/participants       - ดูรายชื่อทั้งหมด`);
    console.log(`   DELETE /api/participants/:name - ลบผู้เข้าร่วม`);
    console.log(`   POST   /api/draw               - จับฉลาก`);
    console.log(`   GET    /api/result/:name       - ดูผลการจับฉลาก`);
    console.log(`   DELETE /api/reset              - รีเซ็ตระบบ`);
});