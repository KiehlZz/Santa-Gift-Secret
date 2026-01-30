// ===== การตั้งค่า API Base URL =====
const API_BASE_URL = 'http://localhost:3000/api';

// ===== ตัวแปรสำหรับเก็บสถานะ =====
let systemStatus = {
    isDrawn: false,
    totalParticipants: 0,
    participants: []
};

// ===== ฟังก์ชันสำหรับเรียก API =====
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
    
    setTimeout(() => {
        container.innerHTML = '';
    }, 5000);
}

// ===== ฟังก์ชันสลับหน้า =====
function showLoginView() {
    document.getElementById('login-view').classList.add('active');
    document.getElementById('admin-view').classList.remove('active');
}

function showAdminView() {
    document.getElementById('login-view').classList.remove('active');
    document.getElementById('admin-view').classList.add('active');
}

// ===== API: Login แอดมิน =====
async function adminLogin(event) {
    event.preventDefault();
    
    const passwordInput = document.getElementById('admin-password');
    const password = passwordInput.value;

    if (!password) {
        showAlert('login-alert', '⚠️ กรุณากรอกรหัสผ่าน', 'error');
        return;
    }

    try {
        const response = await callAPI('/admin/verify', 'POST', { password });

        if (response.success) {
            // บันทึก Session
            sessionStorage.setItem('adminLoggedIn', 'true');
            sessionStorage.setItem('loginTime', new Date().toISOString());
            
            showAlert('login-alert', '✅ เข้าสู่ระบบสำเร็จ!', 'success');
            
            setTimeout(() => {
                showAdminView();
                loadSystemStatus();
            }, 1000);
        } else {
            showAlert('login-alert', `⚠️ ${response.message}`, 'error');
            passwordInput.value = '';
        }
    } catch (error) {
        showAlert('login-alert', '❌ เกิดข้อผิดพลาดในการเข้าสู่ระบบ', 'error');
    }
}

// ===== ฟังก์ชัน Logout =====
function adminLogout() {
    if (confirm('ต้องการออกจากระบบแอดมินหรือไม่?')) {
        sessionStorage.removeItem('adminLoggedIn');
        sessionStorage.removeItem('loginTime');
        showLoginView();
        showAlert('login-alert', 'ℹ️ ออกจากระบบเรียบร้อยแล้ว', 'info');
    }
}

// ===== ตรวจสอบ Session =====
function checkAdminSession() {
    const isLoggedIn = sessionStorage.getItem('adminLoggedIn');
    if (isLoggedIn === 'true') {
        showAdminView();
        loadSystemStatus();
    } else {
        showLoginView();
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
        const response = await callAPI(`/participants/${encodeURIComponent(name)}`, 'DELETE');

        if (response.success) {
            showAlert('admin-alert', `✅ ${response.message}`, 'success');
            loadSystemStatus();
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
        if (!confirm('คุณได้จับฉลากไปแล้ว ต้องการจับใหม่หรือไม่?\n\n⚠️ คำเตือน: ผลลัพธ์เก่าจะถูกลบและจับใหม่ทั้งหมด')) {
            return;
        }
    }

    const button = document.getElementById('draw-button');
    const originalText = button.innerHTML;
    button.disabled = true;
    button.innerHTML = '<span>กำลังจับฉลาก... <div class="loading"></div></span>';

    try {
        const response = await callAPI('/draw', 'POST');

        if (response.success) {
            showAlert('admin-alert', 
                `✅ ${response.message}!<br><br>` +
                `📢 แจ้งให้ผู้เข้าร่วมทุกคนเข้าไปที่:<br>` +
                `<strong>${window.location.origin}/participant</strong><br>` +
                `แล้วกดปุ่ม "ตรวจสอบผลของฉัน" เพื่อดูว่าได้ของใคร`, 
                'success'
            );
            loadSystemStatus();
            
            // แสดง Alert แยก
            setTimeout(() => {
                alert(
                    '🎉 จับฉลากสำเร็จ!\n\n' +
                    '📢 แจ้งให้ผู้เข้าร่วมทุกคน:\n' +
                    `1. เข้าไปที่ ${window.location.origin}/participant\n` +
                    '2. กดปุ่ม "ตรวจสอบผลของฉัน"\n' +
                    '3. ดูว่าตัวเองได้จับฉลากได้ของใคร'
                );
            }, 1000);
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

// ===== API: รีเซ็ทระบบ =====
async function resetAll() {
    if (!confirm(
        '⚠️ คุณแน่ใจหรือไม่ที่จะรีเซ็ตทั้งหมด?\n\n' +
        'ข้อมูลที่จะถูกลบ:\n' +
        '• รายชื่อผู้เข้าร่วมทั้งหมด\n' +
        '• ผลการจับฉลาก\n' +
        '• สถานะของระบบ\n\n' +
        'การกระทำนี้ไม่สามารถยกเลิกได้!'
    )) {
        return;
    }

    try {
        const response = await callAPI('/reset', 'DELETE');

        if (response.success) {
            showAlert('admin-alert', `✅ ${response.message}`, 'success');
            loadSystemStatus();
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
        statusText.style.fontSize = '1.8rem';
    } else {
        statusText.textContent = 'รอจับฉลาก';
        statusText.style.color = 'var(--color-accent)';
        statusText.style.fontSize = '2.5rem';
    }

    // อัพเดทรายชื่อ
    const container = document.getElementById('participants-container');
    if (systemStatus.participants.length === 0) {
        container.innerHTML = `
            <p style="color: var(--color-text-dim); text-align: center; padding: 2rem;">
                ยังไม่มีผู้ลงทะเบียน
                <br><br>
                <small>แชร์ลิงค์นี้ให้พนักงาน:</small>
                <br>
                <strong style="color: var(--color-accent);">${window.location.origin}/participant</strong>
            </p>
        `;
    } else {
        container.innerHTML = systemStatus.participants.map((name, index) => `
            <div class="participant-item">
                <span class="name">${index + 1}. 👤 ${name}</span>
                <button 
                    class="delete-btn" 
                    onclick="removeParticipant('${name.replace(/'/g, "\\'")}')" 
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
    createSnowflakes();
    
    // ตรวจสอบการเชื่อมต่อ Server
    try {
        await callAPI('/status', 'GET');
        console.log('✅ เชื่อมต่อ Server สำเร็จ');
    } catch (error) {
        console.error('❌ ไม่สามารถเชื่อมต่อ Server ได้');
        showAlert('login-alert', 
            '⚠️ ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์<br>กรุณาตรวจสอบว่าเซิร์ฟเวอร์ทำงานอยู่', 
            'error'
        );
    }
    
    // ตรวจสอบ Session
    checkAdminSession();
});