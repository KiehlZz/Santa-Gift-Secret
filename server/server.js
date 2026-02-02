// ===== การนำเข้า Module ที่จำเป็น =====
const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

// ===== สร้าง Express Application =====
const app = express();
const PORT = process.env.PORT || 3000;

// ===== Middleware Configuration =====
// CORS: อนุญาตให้ Client จากโดเมนอื่นเรียก API ได้
app.use(cors());

// Express JSON Parser: แปลง JSON ใน Request Body ให้เป็น Object
app.use(express.json());

// ===== Routes ต้องมาก่อน Static Files =====
// (จะเพิ่ม routes ด้านล่าง)

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
    // สร้างสำเนาของอาร์เรย์เพื่อไม่ให้กระทบต้นฉบับ
    let original = [...arr];
    let result = [...arr];
    let maxAttempts = 10000; // เพิ่มจำนวนครั้งเพราะเงื่อนไขเข้มข้นขึ้น
    let attempts = 0;

    // วนลองสุ่มจนกว่าจะได้ผลลัพธ์ที่ถูกต้อง
    while (attempts < maxAttempts) {
        // Fisher-Yates Shuffle Algorithm
        for (let i = result.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            // Swap elements
            [result[i], result[j]] = [result[j], result[i]];
        }

        // ตรวจสอบเงื่อนไข 2 ข้อ
        let isValid = true;

        // เงื่อนไขที่ 1: ไม่มีใครได้ของตัวเอง (Derangement)
        for (let i = 0; i < original.length; i++) {
            if (original[i] === result[i]) {
                isValid = false;
                break;
            }
        }

        // เงื่อนไขที่ 2: ไม่มี 2-cycle (A ได้ของ B และ B ได้ของ A)
        if (isValid) {
            for (let i = 0; i < original.length; i++) {
                // หาว่า original[i] ให้ของใคร
                const giver = original[i];
                const receiver = result[i];
                
                // หาว่า receiver ให้ของใครกลับมา
                const receiverIndex = original.indexOf(receiver);
                const receiverGivesTo = result[receiverIndex];
                
                // ถ้า A ให้ B และ B ให้ A กลับมา = 2-cycle (ห้าม!)
                if (receiverGivesTo === giver) {
                    isValid = false;
                    break;
                }
            }
        }

        // ถ้าผ่านทั้ง 2 เงื่อนไข ส่งผลลัพธ์กลับ
        if (isValid) {
            // แสดงข้อมูล Debug
            console.log('\n🎉 =======================================');
            console.log('🎉 จับฉลากสำเร็จ!');
            console.log('🎉 =======================================');
            console.log(`📊 จำนวนผู้เข้าร่วม: ${original.length} คน`);
            console.log(`🎲 ใช้ความพยายาม: ${attempts + 1} ครั้ง`);
            
            // แสดงผลลัพธ์การจับฉลาก
            console.log('\n📋 ผลการจับฉลาก:');
            for (let i = 0; i < original.length; i++) {
                console.log(`   ${i + 1}. ${original[i]} → ${result[i]}`);
            }
            
            // วิเคราะห์และแสดง Cycles
            const cycles = findCycles(original, result);
            console.log('\n🔄 การวิเคราะห์ Cycles:');
            console.log(`   📌 จำนวน Cycles ทั้งหมด: ${cycles.length}`);
            
            // นับจำนวน cycles แต่ละขนาด
            const cycleSizes = {};
            cycles.forEach(cycle => {
                const size = cycle.length;
                cycleSizes[size] = (cycleSizes[size] || 0) + 1;
            });
            
            console.log('   📊 สถิติ Cycle:');
            Object.keys(cycleSizes).sort((a, b) => b - a).forEach(size => {
                const count = cycleSizes[size];
                const plural = count > 1 ? 's' : '';
                console.log(`      - ${size}-cycle: ${count} cycle${plural}`);
            });
            
            // แสดงรายละเอียดแต่ละ cycle
            console.log('\n   📝 รายละเอียด Cycles:');
            cycles.forEach((cycle, idx) => {
                const cycleStr = cycle.join(' → ') + ' → ' + cycle[0];
                console.log(`      Cycle ${idx + 1} (${cycle.length} คน): ${cycleStr}`);
            });
            
            // ตรวจสอบว่ามี 2-cycle หรือไม่ (ควรไม่มี)
            const has2Cycle = cycles.some(c => c.length === 2);
            if (has2Cycle) {
                console.log('\n   ⚠️  คำเตือน: พบ 2-cycle! (ไม่ควรเกิดขึ้น)');
            } else {
                console.log('\n   ✅ ยืนยัน: ไม่มี 2-cycle (คู่ที่แลกของกัน)');
            }
            
            console.log('🎉 =======================================\n');
            
            return result;
        }

        attempts++;
    }

    // ถ้าสุ่มไม่สำเร็จหลังพยายามหลายครั้ง
    console.error('\n❌ =======================================');
    console.error('❌ ไม่สามารถจับฉลากได้!');
    console.error('❌ =======================================');
    console.error(`พยายามแล้ว ${maxAttempts} ครั้ง แต่ไม่สามารถหาผลลัพธ์ที่เหมาะสมได้`);
    console.error('เงื่อนไข:');
    console.error('  1. ไม่มีใครได้ของตัวเอง');
    console.error('  2. ไม่มี 2-cycle (คู่ที่แลกของกัน)');
    console.error('\nแนะนำ: ลองเพิ่มจำนวนผู้เข้าร่วมหรือปรับเงื่อนไข');
    console.error('❌ =======================================\n');
    return null;
}

// ========================================
// ===== PAGE ROUTES (HTML Pages) =====
// ========================================

// หน้าแรก - Redirect ไปหน้า Participant
app.get('/', (req, res) => {
    res.redirect('/participant');
});

// หน้า Participant
app.get('/participant', (req, res) => {
    res.sendFile(path.join(__dirname, '../client/participant.html'));
});

// หน้า Admin
app.get('/admin', (req, res) => {
    res.sendFile(path.join(__dirname, '../client/admin.html'));
});

// ========================================
// ===== API ENDPOINTS (RESTful API) =====
// ========================================

// ===== รหัสผ่านแอดมิน (ในโปรเจคจริงควรเก็บใน environment variable) =====
const ADMIN_PASSWORD = 'admin2026';

// ===== API: ตรวจสอบรหัสผ่านแอดมิน =====
app.post('/api/admin/verify', (req, res) => {
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

// ===== 1. GET /api/status - ดูสถานะระบบ =====
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

// ===== 2. POST /api/register - ลงทะเบียนผู้เข้าร่วม =====
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

// ===== 3. GET /api/participants - ดูรายชื่อผู้เข้าร่วมทั้งหมด =====
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

// ===== 3.5 GET /api/admin/results - ดูผลลัพธ์ทั้งหมด (Admin only) =====
app.get('/api/admin/results', (req, res) => {
    const data = readData();
    
    if (!data.isDrawn) {
        return res.status(400).json({
            success: false,
            message: 'ยังไม่ได้จับฉลาก'
        });
    }
    
    // แปลง results เป็น array สำหรับแสดงผล
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

// ===== 4. DELETE /api/participants/:name - ลบผู้เข้าร่วม =====
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

// ===== 5. POST /api/draw - จับฉลาก =====
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

// ===== 6. GET /api/result/:name - ดูผลการจับฉลากของแต่ละคน =====
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

// ===== 7. DELETE /api/reset - รีเซ็ตทั้งหมด =====
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
        message: 'ไม่พบหน้าที่ต้องการ'
    });
});

// ===== เริ่มต้น Server =====
app.listen(PORT, () => {
    console.log(`\n🎄 =======================================`);
    console.log(`🎄 Secret Santa Server กำลังทำงาน!`);
    console.log(`🎄 =======================================\n`);
    console.log(`👥 สำหรับพนักงาน:    http://localhost:${PORT}/participant`);
    console.log(`🔐 สำหรับแอดมิน:     http://localhost:${PORT}/admin`);
    console.log(`📱 รหัสผ่านแอดมิน:   ${ADMIN_PASSWORD}\n`);
    console.log(`📋 API Endpoints:`);
    console.log(`   POST   /api/admin/verify        - ตรวจสอบรหัสแอดมิน`);
    console.log(`   GET    /api/status              - ดูสถานะระบบ`);
    console.log(`   POST   /api/register            - ลงทะเบียนผู้เข้าร่วม`);
    console.log(`   GET    /api/participants        - ดูรายชื่อทั้งหมด`);
    console.log(`   DELETE /api/participants/:name  - ลบผู้เข้าร่วม`);
    console.log(`   POST   /api/draw                - จับฉลาก`);
    console.log(`   GET    /api/result/:name        - ดูผลการจับฉลาก`);
    console.log(`   DELETE /api/reset               - รีเซ็ตระบบ`);
    console.log(`\n🎄 =======================================\n`);
});