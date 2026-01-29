// ===== การตั้งค่า API Base URL =====
const API_BASE_URL = 'http://localhost:3000/api';

// ===== ตัวแปรสำหรับเก็บสถานะ =====
let currentView = 'register';
let systemStatus = {
    isDrawn: false,
    totalParticipants: 0,
    participants: []
};

// ===== ฟังก์ชันสำหรับเรียก API =====

/**
 * ฟังก์ชันหลักสำหรับเรียก API แบบ Generic
 * @param {string} endpoint - API endpoint (เช่น '/status', '/register')
 * @param {string} method - HTTP Method (GET, POST, PUT, DELETE)
 * @param {object} body - ข้อมูลที่จะส่งไป (สำหรับ POST, PUT)
 */
async function callAPI(endpoint, method = 'GET', body = null) {
    try {
        const options = {
            method: method,
            headers: {
                'Content-Type': 'application/json'
            }
        };

        // ถ้ามีข้อมูลที่จะส่ง ให้แปลงเป็น JSON
        if (body) {
            options.body = JSON.stringify(body);
        }

        // เรียก API
        const response = await fetch(`${API_BASE_URL}${endpoint}`, options);
        
        // แปลง Response เป็น JSON
        const data = await response.json();

        // อัพเดทสถานะการเชื่อมต่อ
        updateConnectionStatus(true);

        return data;
    } catch (error) {
        console.error('API Error:', error);
        updateConnectionStatus(false);
        throw error;
    }
}

// ===== ฟังก์ชันอัพเดทสถานะการเชื่อมต่อ =====
function updateConnectionStatus(isConnected) {
    const statusElement = document.getElementById('connectionStatus');
    const statusText = statusElement.querySelector('.status-text');

    if (isConnected) {
        statusElement.classList.remove('error');
        statusElement.classList.add('connected');
        statusText.textContent = 'เชื่อมต่อแล้ว';
    } else {
        statusElement.classList.remove('connected');
        statusElement.classList.add('error');
        statusText.textContent = 'ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์';
    }
}

// ===== ฟังก์ชันแสดงข้อความแจ้งเตือน =====
function showAlert(containerId, message, type) {
    const container = document.getElementById(containerId);
    container.innerHTML = `
        <div class="alert alert-${type}">
            ${message}
        </div>
    `;
    
    // ลบข้อความหลัง 5 วินาที
    setTimeout(() => {
        container.innerHTML = '';
    }, 5000);
}

// ===== ฟังก์ชันสลับหน้า =====
function switchView(viewName) {
    currentView = viewName;

    // ซ่อนทุกหน้า
    document.querySelectorAll('.view').forEach(view => {
        view.classList.remove('active');
    });
    
    // ลบ active class จากทุกปุ่ม
    document.querySelectorAll('.nav-tabs button').forEach(btn => {
        btn.classList.remove('active');
    });

    // แสดงหน้าที่เลือก
    if (viewName === 'register') {
        document.getElementById('register-view').classList.add('active');
        document.getElementById('tab-register').classList.add('active');
    } else if (viewName === 'admin') {
        document.getElementById('admin-view').classList.add('active');
        document.getElementById('tab-admin').classList.add('active');
        loadSystemStatus(); // โหลดสถานะระบบ
    } else if (viewName === 'result') {
        document.getElementById('result-view').classList.add('active');
    }
}

// ===== API: โหลดสถานะระบบ =====
async function loadSystemStatus() {
    try {
        const response = await callAPI('/status', 'GET');
        
        if (response.success) {
            systemStatus = response.data;
            updateAdminView();
        }
    } catch (error) {
        showAlert('admin-alert', '⚠️ ไม่สามารถโหลดสถานะระบบได้', 'error');
    }
}

// ===== API: ลงทะเบียนผู้เข้าร่วม =====
async function registerParticipant(event) {
    event.preventDefault();
    
    const nameInput = document.getElementById('participant-name');
    const name = nameInput.value.trim();

    if (!name) {
        showAlert('register-alert', '⚠️ กรุณากรอกชื่อของคุณ', 'error');
        return;
    }

    try {
        // เรียก POST API
        const response = await callAPI('/register', 'POST', { name });

        if (response.success) {
            showAlert('register-alert', `✅ ${response.message}`, 'success');
            nameInput.value = '';
            
            // บันทึกชื่อผู้ใช้ลง localStorage เพื่อใช้ตรวจสอบผลภายหลัง
            localStorage.setItem('currentUser', name);
        } else {
            showAlert('register-alert', `⚠️ ${response.message}`, 'error');
        }
    } catch (error) {
        showAlert('register-alert', '❌ เกิดข้อผิดพลาดในการลงทะเบียน', 'error');
    }
}

// ===== API: โหลดรายชื่อผู้เข้าร่วม =====
async function loadParticipants() {
    try {
        const response = await callAPI('/participants', 'GET');
        
        if (response.success) {
            systemStatus.participants = response.data.participants;
            systemStatus.totalParticipants = response.data.count;
            updateAdminView();
            showAlert('admin-alert', '✅ รีเฟรชข้อมูลสำเร็จ', 'success');
        }
    } catch (error) {
        showAlert('admin-alert', '⚠️ ไม่สามารถโหลดรายชื่อได้', 'error');
    }
}

// ===== API: ลบผู้เข้าร่วม =====
async function removeParticipant(name) {
    if (!confirm(`ต้องการลบ "${name}" ออกจากรายชื่อหรือไม่?`)) {
        return;
    }

    try {
        // เรียก DELETE API
        const response = await callAPI(`/participants/${encodeURIComponent(name)}`, 'DELETE');

        if (response.success) {
            showAlert('admin-alert', `✅ ${response.message}`, 'success');
            loadSystemStatus(); // โหลดข้อมูลใหม่
        } else {
            showAlert('admin-alert', `⚠️ ${response.message}`, 'error');
        }
    } catch (error) {
        showAlert('admin-alert', '❌ เกิดข้อผิดพลาดในการลบ', 'error');
    }
}

// ===== API: จับฉลาก =====
async function drawNames() {
    if (systemStatus.totalParticipants < 2) {
        showAlert('admin-alert', '⚠️ ต้องมีผู้เข้าร่วมอย่างน้อย 2 คน', 'error');
        return;
    }

    if (systemStatus.isDrawn) {
        if (!confirm('คุณได้จับฉลากไปแล้ว ต้องการจับใหม่หรือไม่? (ข้อมูลเก่าจะถูกลบ)')) {
            return;
        }
    }

    // แสดงสถานะกำลังประมวลผล
    const button = document.getElementById('draw-button');
    const originalText = button.innerHTML;
    button.disabled = true;
    button.innerHTML = '<span>กำลังจับฉลาก... <div class="loading"></div></span>';

    try {
        // เรียก POST API
        const response = await callAPI('/draw', 'POST');

        if (response.success) {
            showAlert('admin-alert', `✅ ${response.message}! ผู้เข้าร่วมสามารถกลับมาดูผลได้แล้ว`, 'success');
            loadSystemStatus(); // โหลดข้อมูลใหม่
            alert('🎉 จับฉลากสำเร็จ!\n\nแจ้งให้ผู้เข้าร่วมทุกคนกลับมาที่หน้าลงทะเบียนและกดปุ่ม "ตรวจสอบผลของฉัน" เพื่อดูผลการจับฉลาก');
        } else {
            showAlert('admin-alert', `⚠️ ${response.message}`, 'error');
        }
    } catch (error) {
        showAlert('admin-alert', '❌ เกิดข้อผิดพลาดในการจับฉลาก', 'error');
    } finally {
        button.disabled = false;
        button.innerHTML = originalText;
    }
}

// ===== API: ตรวจสอบผลของผู้ใช้ =====
async function checkMyResult() {
    const currentUser = localStorage.getItem('currentUser');
    
    if (!currentUser) {
        showAlert('register-alert', '⚠️ กรุณาลงทะเบียนก่อนตรวจสอบผล', 'error');
        return;
    }

    try {
        // เรียก GET API
        const response = await callAPI(`/result/${encodeURIComponent(currentUser)}`, 'GET');

        if (response.success) {
            showResult(response.data.giver, response.data.receiver);
        } else {
            showAlert('register-alert', `ℹ️ ${response.message}`, 'info');
        }
    } catch (error) {
        showAlert('register-alert', '❌ เกิดข้อผิดพลาดในการตรวจสอบผล', 'error');
    }
}

// ===== ฟังก์ชันแสดงผลลัพธ์ =====
function showResult(giver, receiver) {
    const content = document.getElementById('result-content');
    content.innerHTML = `
        <div class="result-card">
            <h2>🎉 ผลการจับฉลาก</h2>
            <p style="color: var(--color-text-dim); font-size: 1.2rem; margin: 1rem 0;">
                คุณ <strong style="color: var(--color-text);">${giver}</strong> จะต้องซื้อของขวัญให้กับ
            </p>
            <div class="gift-receiver">🎁 ${receiver} 🎁</div>
            <p style="color: var(--color-text-dim); margin-top: 1rem;">
                กรุณาเก็บเป็นความลับ! 🤫
            </p>
        </div>
    `;
    switchView('result');
}

// ===== API: รีเซ็ทระบบ =====
async function resetAll() {
    if (!confirm('⚠️ คุณแน่ใจหรือไม่ที่จะรีเซ็ตทั้งหมด?\n\nข้อมูลทั้งหมดจะถูกลบ รวมถึง:\n- รายชื่อผู้เข้าร่วม\n- ผลการจับฉลาก\n\nการกระทำนี้ไม่สามารถยกเลิกได้')) {
        return;
    }

    try {
        // เรียก DELETE API
        const response = await callAPI('/reset', 'DELETE');

        if (response.success) {
            showAlert('admin-alert', `✅ ${response.message}`, 'success');
            localStorage.clear(); // ลบข้อมูลใน localStorage ด้วย
            loadSystemStatus(); // โหลดข้อมูลใหม่
        } else {
            showAlert('admin-alert', `⚠️ ${response.message}`, 'error');
        }
    } catch (error) {
        showAlert('admin-alert', '❌ เกิดข้อผิดพลาดในการรีเซ็ต', 'error');
    }
}

// ===== ฟังก์ชันอัพเดทหน้าแอดมิน =====
function updateAdminView() {
    // อัพเดทสถิติ
    document.getElementById('total-participants').textContent = systemStatus.totalParticipants;
    
    const statusText = document.getElementById('status-text');
    if (systemStatus.isDrawn) {
        statusText.textContent = 'จับฉลากแล้ว';
        statusText.style.color = '#4ADE80';
    } else {
        statusText.textContent = 'รอจับฉลาก';
        statusText.style.color = 'var(--color-accent)';
    }

    // อัพเดทรายชื่อ
    const container = document.getElementById('participants-container');
    if (systemStatus.participants.length === 0) {
        container.innerHTML = `
            <p style="color: var(--color-text-dim); text-align: center; padding: 2rem;">
                ยังไม่มีผู้ลงทะเบียน
            </p>
        `;
    } else {
        container.innerHTML = systemStatus.participants.map(name => `
            <div class="participant-item">
                <span class="name">👤 ${name}</span>
                <button 
                    class="delete-btn" 
                    onclick="removeParticipant('${name}')" 
                    ${systemStatus.isDrawn ? 'disabled' : ''}
                >
                    🗑️ ลบ
                </button>
            </div>
        `).join('');
    }

    // อัพเดทปุ่มจับฉลาก
    const drawButton = document.getElementById('draw-button');
    if (systemStatus.isDrawn) {
        drawButton.innerHTML = '<span>✨ จับฉลากเสร็จแล้ว (คลิกเพื่อจับใหม่)</span>';
    } else {
        drawButton.innerHTML = '<span>🎊 Happy New Year 2026 🎊</span>';
    }
}

// ===== ฟังก์ชันสร้างเอฟเฟกต์หิมะตก =====
function createSnowflakes() {
    const container = document.getElementById('snowContainer');
    const snowflakes = ['❄', '❅', '❆'];
    const numberOfSnowflakes = 50;

    for (let i = 0; i < numberOfSnowflakes; i++) {
        const snowflake = document.createElement('div');
        snowflake.classList.add('snowflake');
        snowflake.textContent = snowflakes[Math.floor(Math.random() * snowflakes.length)];
        snowflake.style.left = Math.random() * 100 + '%';
        snowflake.style.animationDuration = (Math.random() * 3 + 2) + 's';
        snowflake.style.animationDelay = Math.random() * 5 + 's';
        snowflake.style.fontSize = (Math.random() * 10 + 10) + 'px';
        container.appendChild(snowflake);
    }
}

// ===== เริ่มต้นเมื่อโหลดหน้า =====
window.addEventListener('DOMContentLoaded', async () => {
    // สร้างเอฟเฟกต์หิมะตก
    createSnowflakes();
    
    // ตรวจสอบการเชื่อมต่อ Server
    try {
        await callAPI('/status', 'GET');
        console.log('✅ เชื่อมต่อ Server สำเร็จ');
    } catch (error) {
        console.error('❌ ไม่สามารถเชื่อมต่อ Server ได้');
        alert('⚠️ ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์\n\nกรุณาตรวจสอบว่าเซิร์ฟเวอร์ทำงานอยู่ที่ http://localhost:3000');
    }
});