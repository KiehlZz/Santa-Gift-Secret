// ===== การนำเข้า Module ที่จำเป็น =====
const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const rateLimit = require('express-rate-limit');

// ===== สร้าง Express Application =====
const app = express();
const PORT = process.env.PORT || 3000;
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin2026';

// ===== Rate Limiter =====
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 นาที
    max: 100, // จำกัด 100 requests ต่อ IP
    message: { success: false, message: 'Too many requests, please try again later.' }
});

// ===== Middleware Configuration =====
// CORS Configuration
app.use(cors({
    origin: '*', // ในการ production ควรระบุ origin ที่ชัดเจน
    methods: ['GET', 'POST', 'DELETE'],
    credentials: true
}));

// Rate Limiting
app.use(limiter);

// Express JSON Parser
app.use(express.json());

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
        fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
        return true;
    } catch (error) {
        console.error('Error writing data:', error);
        return false;
    }
}

// ===== Derangement Algorithm สำหรับจับฉลาก =====
// ป้องกัน: 1) ไม่มีใครได้ของตัวเอง 2) ไม่มี 2-cycle (A↔B)
// ===== ฟังก์ชันช่วยวิเคราะห์ Cycles =====
// Cycle = วงจรของการให้ของขวัญ เช่น A → B → C → A
function findCycles(original, result) {
    const visited = new Set();
    const cycles = [];
    
    for (let i = 0; i < original.length; i++) {
        if (visited.has(i)) continue;
        
        const cycle = [];
        let current = i;
        
        // ติดตาม cycle จนกว่าจะกลับมาจุดเริ่มต้น
        while (!visited.has(current)) {
            visited.add(current);
            cycle.push(original[current]);
            
            // หาคนต่อไปใน cycle
            const receiver = result[current];
            current = original.indexOf(receiver);
        }
        
        if (cycle.length > 0) {
            cycles.push(cycle);
        }
    }
    
    return cycles;
}

// ===== Derangement Algorithm สำหรับจับฉลาก =====
function generateDerangement(arr) {
    let original = [...arr];
    let result = [...arr];
    let maxAttempts = 10000;
    let attempts = 0;

    while (attempts < maxAttempts) {
        // Fisher-Yates Shuffle
        for (let i = result.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [result[i], result[j]] = [result[j], result[i]];
        }

        let isValid = true;

        // ตรวจสอบ: ไม่มีใครได้ของตัวเอง
        for (let i = 0; i < original.length; i++) {
            if (original[i] === result[i]) {
                isValid = false;
                break;
            }
        }

        // ตรวจสอบ: ไม่มี 2-cycle
        if (isValid) {
            for (let i = 0; i < original.length; i++) {
                const giver = original[i];
                const receiver = result[i];
                
                const receiverIndex = original.indexOf(receiver);
                const receiverGivesTo = result[receiverIndex];
                
                if (receiverGivesTo === giver) {
                    isValid = false;
                    break;
                }
            }
        }

        if (isValid) {
            console.log('\n🎉 จับฉลากสำเร็จ!');
            console.log(`📊 จำนวนผู้เข้าร่วม: ${original.length} คน`);
            console.log(`🎲 ใช้ความพยายาม: ${attempts + 1} ครั้ง`);
            
            const cycles = findCycles(original, result);
            console.log(`🔄 จำนวน Cycles: ${cycles.length}`);
            
            return result;
        }

        attempts++;
    }

    console.error('❌ ไม่สามารถจับฉลากได้หลังจากพยายาม', maxAttempts, 'ครั้ง');
    return null;
}

// ========================================
// ===== API ENDPOINTS =====
// ========================================

// Health Check
app.get('/health', (req, res) => {
    res.json({ 
        success: true, 
        message: 'Server is running',
        timestamp: new Date().toISOString()
    });
});

// ===== API: ตรวจสอบรหัสผ่านแอดมิน =====
app.post('/admin/verify', (req, res) => {
    const { password } = req.body;

    if (password === ADMIN_PASSWORD) {
        res.json({
            success: true,
            message: 'เข้าสู่ระบบสำเร็จ'
        });
    } else {
        res.status(401).json({
            success: false,
            message: 'รหัสผ่านไม่ถูกต้อง'
        });
    }
});

// ===== GET /status - ดูสถานะระบบ =====
app.get('/status', (req, res) => {
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

// ===== POST /register - ลงทะเบียนผู้เข้าร่วม =====
app.post('/register', (req, res) => {
    const { name } = req.body;

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

// ===== GET /participants - ดูรายชื่อผู้เข้าร่วมทั้งหมด =====
app.get('/participants', (req, res) => {
    const data = readData();
    
    res.json({
        success: true,
        data: {
            participants: data.participants,
            count: data.participants.length
        }
    });
});

// ===== GET /admin/results - ดูผลลัพธ์ทั้งหมด (Admin only) =====
app.get('/admin/results', (req, res) => {
    const data = readData();
    
    if (!data.isDrawn) {
        return res.status(400).json({
            success: false,
            message: 'ยังไม่ได้จับฉลาก'
        });
    }
    
    const resultsArray = [];
    for (let giver in data.results) {
        resultsArray.push({
            giver: giver,
            receiver: data.results[giver]
        });
    }
    
    res.json({
        success: true,
        data: {
            results: resultsArray,
            totalPairs: resultsArray.length
        }
    });
});

// ===== DELETE /participants/:name - ลบผู้เข้าร่วม =====
app.delete('/participants/:name', (req, res) => {
    const { name } = req.params;
    const data = readData();

    if (data.isDrawn) {
        return res.status(400).json({
            success: false,
            message: 'ไม่สามารถลบผู้เข้าร่วมได้หลังจากจับฉลากแล้ว'
        });
    }

    const index = data.participants.indexOf(name);
    
    if (index === -1) {
        return res.status(404).json({
            success: false,
            message: 'ไม่พบชื่อนี้ในระบบ'
        });
    }

    data.participants.splice(index, 1);
    
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

// ===== POST /draw - จับฉลาก =====
app.post('/draw', (req, res) => {
    const data = readData();

    if (data.participants.length < 2) {
        return res.status(400).json({
            success: false,
            message: 'ต้องมีผู้เข้าร่วมอย่างน้อย 2 คน'
        });
    }

    const receivers = generateDerangement(data.participants);

    if (!receivers) {
        return res.status(500).json({
            success: false,
            message: 'เกิดข้อผิดพลาดในการจับฉลาก กรุณาลองใหม่อีกครั้ง'
        });
    }

    const results = {};
    data.participants.forEach((giver, index) => {
        results[giver] = receivers[index];
    });

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

// ===== GET /result/:name - ดูผลการจับฉลากของแต่ละคน =====
app.get('/result/:name', (req, res) => {
    const { name } = req.params;
    const data = readData();

    if (!data.isDrawn) {
        return res.status(400).json({
            success: false,
            message: 'ยังไม่ได้จับฉลาก'
        });
    }

    if (!data.participants.includes(name)) {
        return res.status(404).json({
            success: false,
            message: 'ไม่พบชื่อนี้ในระบบ'
        });
    }

    const receiver = data.results[name];

    res.json({
        success: true,
        data: {
            giver: name,
            receiver: receiver
        }
    });
});

// ===== DELETE /reset - รีเซ็ตทั้งหมด =====
app.delete('/reset', (req, res) => {
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

// ===== Static Files - ต้องมาหลัง API routes =====
app.use(express.static(path.join(__dirname, '../client')));

// ===== Serve HTML Files =====
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../client/participant.html'));
});

app.get('/participant', (req, res) => {
    res.sendFile(path.join(__dirname, '../client/participant.html'));
});

app.get('/admin', (req, res) => {
    res.sendFile(path.join(__dirname, '../client/admin.html'));
});

// ===== Error Handling =====
app.use((err, req, res, next) => {
    console.error('Error:', err);
    res.status(500).json({
        success: false,
        message: 'เกิดข้อผิดพลาดภายในเซิร์ฟเวอร์'
    });
});

// ===== 404 Handler =====
app.use((req, res) => {
    res.status(404).json({
        success: false,
        message: 'ไม่พบหน้าที่ต้องการ'
    });
});

// ===== เริ่มต้น Server =====
app.listen(PORT, '0.0.0.0', () => {
    console.log(`\n🎄 =======================================`);
    console.log(`🎄 Secret Santa Server กำลังทำงาน!`);
    console.log(`🎄 =======================================\n`);
    console.log(`🌐 Port: ${PORT}`);
    console.log(`🔐 Admin Password: ${ADMIN_PASSWORD}`);
    console.log(`🎄 =======================================\n`);
});