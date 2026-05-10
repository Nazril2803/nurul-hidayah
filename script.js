// Data Awal (Contoh Jadwal)
let schedules = JSON.parse(localStorage.getItem('jadwalSiswa')) || [
    { id: 1, day: "Senin", mapel: "Matematika", start: "07:30", end: "09:00", guru: "Pak Budi" },
    { id: 2, day: "Senin", mapel: "Bahasa Indonesia", start: "09:00", end: "10:30", guru: "Bu Siti" }
];

let isVoiceOn = true;
let notifiedUpcoming = []; // Mencegah suara berulang (1 menit sebelum)
let notifiedCurrent = [];  // Mencegah suara berulang (saat mulai)
let currentFilterDay = "Senin";

// DOM Elements
const scheduleList = document.getElementById('schedule-list');
const clockEl = document.getElementById('real-time-clock');
const dayEl = document.getElementById('real-time-day');
const voiceBtn = document.getElementById('voice-toggle');
const dayButtons = document.querySelectorAll('.day-btn');

// 1. Fungsi Jam Real-time
function updateClock() {
    const now = new Date();
    const timeStr = now.toLocaleTimeString('id-ID', { hour12: false });
    const dayStr = now.toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long' });

    clockEl.innerText = timeStr;
    dayEl.innerText = dayStr;

    // Cek Notifikasi setiap detik
    checkScheduleNotif(timeStr, dayStr.split(',')[0]);
}

// 2. Fungsi Text-to-Speech
function speak(text) {
    if (!isVoiceOn) return;
    window.speechSynthesis.cancel(); // Stop suara sebelumnya
    const msg = new SpeechSynthesisUtterance(text);
    msg.lang = 'id-ID';
    msg.rate = 0.9;
    window.speechSynthesis.speak(msg);
}

// 3. Logika Notifikasi Cerdas
function checkScheduleNotif(currentTime, currentDay) {
    schedules.forEach(item => {
        if (item.day === currentDay) {
            const [h, m] = item.start.split(':');
            const startTime = `${h}:${m}:00`;
            
            // Hitung 1 menit sebelumnya
            const prevMin = new Date();
            prevMin.setHours(h, m - 1, 0);
            const alertTime = prevMin.toLocaleTimeString('id-ID', { hour12: false });

            // Notifikasi Akan Dimulai
            if (currentTime === alertTime && !notifiedUpcoming.includes(item.id)) {
                speak(`Sebentar lagi pelajaran ${item.mapel} dimulai`);
                notifiedUpcoming.push(item.id);
            }

            // Notifikasi Sedang Berlangsung
            if (currentTime === startTime && !notifiedCurrent.includes(item.id)) {
                speak(`Sekarang pelajaran ${item.mapel}`);
                notifiedCurrent.push(item.id);
                renderSchedules(); // Refresh highlight
            }
        }
    });
}

// 4. Render Jadwal ke Layar
function renderSchedules() {
    scheduleList.innerHTML = '';
    const filtered = schedules.filter(s => s.day === currentFilterDay);
    
    const now = new Date();
    const currentTime = now.getHours() * 60 + now.getMinutes();

    filtered.sort((a,b) => a.start.localeCompare(b.start)).forEach(s => {
        const [sh, sm] = s.start.split(':').map(Number);
        const [eh, em] = s.end.split(':').map(Number);
        const startTotal = sh * 60 + sm;
        const endTotal = eh * 60 + em;

        const isActive = currentTime >= startTotal && currentTime < endTotal && s.day === new Date().toLocaleDateString('id-ID', {weekday:'long'});

        const card = document.createElement('div');
        card.className = `schedule-card ${isActive ? 'active' : ''}`;
        card.innerHTML = `
            <div>
                <h4>${s.mapel}</h4>
                <small>${s.start} - ${s.end} | ${s.guru || 'Tanpa Guru'}</small>
            </div>
            <button onclick="deleteJadwal(${s.id})" style="background:none; border:none; cursor:pointer;">🗑️</button>
        `;
        scheduleList.appendChild(card);
    });
}

// 5. Fitur Tambah/Hapus Data
document.getElementById('add-btn').onclick = () => document.getElementById('modal').style.display = 'block';
document.getElementById('close-btn').onclick = () => document.getElementById('modal').style.display = 'none';

document.getElementById('save-btn').onclick = () => {
    const newJadwal = {
        id: Date.now(),
        mapel: document.getElementById('mapel-name').value,
        start: document.getElementById('start-time').value,
        end: document.getElementById('end-time').value,
        guru: document.getElementById('teacher-name').value,
        day: document.getElementById('day-select').value
    };

    if(!newJadwal.mapel || !newJadwal.start) return alert("Isi data dengan lengkap!");

    schedules.push(newJadwal);
    localStorage.setItem('jadwalSiswa', JSON.stringify(schedules));
    document.getElementById('modal').style.display = 'none';
    renderSchedules();
};

function deleteJadwal(id) {
    schedules = schedules.filter(s => s.id !== id);
    localStorage.setItem('jadwalSiswa', JSON.stringify(schedules));
    renderSchedules();
}

// 6. Event Listeners
voiceBtn.onclick = () => {
    isVoiceOn = !isVoiceOn;
    voiceBtn.innerText = isVoiceOn ? "🔊 Suara: ON" : "🔇 Suara: OFF";
};

document.getElementById('theme-toggle').onclick = () => {
    const theme = document.body.getAttribute('data-theme');
    document.body.setAttribute('data-theme', theme === 'dark' ? 'light' : 'dark');
};

dayButtons.forEach(btn => {
    btn.onclick = () => {
        dayButtons.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        currentFilterDay = btn.getAttribute('data-day');
        renderSchedules();
    };
});

// Jalankan aplikasi
setInterval(updateClock, 1000);
renderSchedules();