// ===== การตั้งค่า API Base URL =====
const API_BASE_URL = 'http://localhost:3000/api';

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
function showRegisterView() {
    document.getElementById('register-view').classList.add('active');
    document.getElementById('result-view').classList.remove('active');
}

function showResultView() {
    document.getElementById('register-view').classList.remove('active');
    document.getElementById('result-view').classList.add('active');
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
        const response = await callAPI('/register', 'POST', { name });

        if (response.success) {
            showAlert('register-alert', `✅ ${response.message}`, 'success');
            nameInput.value = '';
            
            // บันทึกชื่อผู้ใช้ลง localStorage
            localStorage.setItem('currentUser', name);
            localStorage.setItem('registeredAt', new Date().toISOString());
            
            // แสดงข้อความเพิ่มเติม
            setTimeout(() => {
                showAlert('register-alert', 
                    'ℹ️ ชื่อของคุณถูกบันทึกแล้ว คุณสามารถปิดหน้านี้และกลับมาตรวจสอบผลภายหลังได้', 
                    'info'
                );
            }, 3000);
        } else {
            showAlert('register-alert', `⚠️ ${response.message}`, 'error');
        }
    } catch (error) {
        showAlert('register-alert', '❌ เกิดข้อผิดพลาดในการลงทะเบียน กรุณาลองใหม่อีกครั้ง', 'error');
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
                คุณ <strong style="color: var(--color-text);">${giver}</strong> จะต้องได้รับของขวัญจาก
            </p>
            <div class="gift-receiver">🎁 ${receiver} 🎁</div>
        </div>
    `;
    showResultView();
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

// ===== แสดงข้อมูลผู้ใช้ที่ลงทะเบียนไว้แล้ว =====
function showRegisteredUser() {
    const currentUser = localStorage.getItem('currentUser');
    const registeredAt = localStorage.getItem('registeredAt');
    
    if (currentUser) {
        const nameInput = document.getElementById('participant-name');
        nameInput.value = currentUser;
        
        let message = `ℹ️ คุณเคยลงทะเบียนด้วยชื่อ "${currentUser}" แล้ว`;
        if (registeredAt) {
            const date = new Date(registeredAt);
            message += `<br><small>เมื่อ: ${date.toLocaleString('th-TH')}</small>`;
        }
        message += '<br><small>หากต้องการเปลี่ยนชื่อ กรุณาแก้ไขและกดลงทะเบียนใหม่</small>';
        
        showAlert('register-alert', message, 'info');
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
        showAlert('register-alert', 
            '⚠️ ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์<br>กรุณาตรวจสอบว่าเซิร์ฟเวอร์ทำงานอยู่', 
            'error'
        );
    }
    
    // แสดงข้อมูลผู้ใช้ที่ลงทะเบียนไว้
    showRegisteredUser();
});