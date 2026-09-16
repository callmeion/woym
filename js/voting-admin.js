// =====================================================================
// STATE
// =====================================================================
let votes = {};          // { A: 12, B: 5, ... } — mirrored live from Firebase
let historyArray = [];   // most-recent-first array of {stationCode, stationName, timestamp, source}
let currentTab = 'votingView';
let countdownTimer = null;
let dbReady = false;

const votesRef = db.ref('votes');
const historyRef = db.ref('history');
const connectedRef = db.ref('.info/connected');

// =====================================================================
// INIT
// =====================================================================
function initApp() {
    renderStationCards();

    // Make sure every station has a numeric entry (only writes missing ones)
    votesRef.once('value').then(snap => {
        const updates = {};
        STATIONS.forEach(s => {
            if (!snap.hasChild(s.code)) updates[s.code] = 0;
        });
        if (Object.keys(updates).length) votesRef.update(updates);
    });

    // Live listener: vote counts
    votesRef.on('value', snap => {
        votes = snap.val() || {};
        STATIONS.forEach(s => { if (typeof votes[s.code] !== 'number') votes[s.code] = 0; });
        dbReady = true;
        updateDashboard();
    });

    // Live listener: recent history (last 50 entries)
    historyRef.limitToLast(50).on('value', snap => {
        const arr = [];
        snap.forEach(child => {
            arr.push({ key: child.key, ...child.val() });
        });
        historyArray = arr.reverse(); // most recent first
        renderAuditLog();
    });

    // Connection status pill
    connectedRef.on('value', snap => {
        const pill = document.getElementById('connPill');
        if (!pill) return;
        if (snap.val() === true) {
            pill.className = 'conn-pill online';
            pill.innerHTML = '<span class="conn-dot"></span> เชื่อมต่อเรียลไทม์แล้ว';
        } else {
            pill.className = 'conn-pill offline';
            pill.innerHTML = '<span class="conn-dot"></span> ขาดการเชื่อมต่อ...';
        }
    });
}

// =====================================================================
// VOTING VIEW
// =====================================================================
function renderStationCards() {
    const container = document.getElementById('stationsGridContainer');
    container.innerHTML = '';

    STATIONS.forEach(station => {
        const card = document.createElement('div');
        card.className = 'station-card';
        card.id = 'card-' + station.code;
        card.onclick = () => castLikeVote(station.code);

        card.innerHTML = `
            <div class="station-letter-badge" style="background:${station.badgeBg};">${station.code}</div>
            <div class="station-avatar">${station.iconSvg}</div>
            <div class="station-name-main">${station.name}</div>
            <div class="dept-box">${station.dept}</div>
            <div class="station-languages">${station.subtitles}</div>
            <button class="like-action-btn" title="กดถูกใจ">
                <svg viewBox="0 0 24 24">
                    <path d="M1 21h4V9H1v12zm22-11c0-1.1-.9-2-2-2h-6.31l.95-4.57.03-.32c0-.41-.17-.79-.44-1.06L14.17 1 7.59 7.59C7.22 7.95 7 8.45 7 9v10c0 1.1.9 2 2 2h9c.83 0 1.54-.5 1.84-1.22l3.02-7.05c.09-.23.14-.47.14-.73v-2z"/>
                </svg>
            </button>
        `;
        container.appendChild(card);
    });
}

function castLikeVote(stationCode) {
    const station = STATIONS.find(s => s.code === stationCode);
    if (!station) return;

    const card = document.getElementById('card-' + stationCode);
    if (card) card.classList.add('disabled');

    // Atomic increment so simultaneous votes from many devices never overwrite each other
    votesRef.child(stationCode).transaction(cur => (cur || 0) + 1)
        .then(() => {
            const now = new Date();
            const timeStr = now.toLocaleDateString('th-TH') + ' ' + now.toLocaleTimeString('th-TH');
            return historyRef.push({
                stationCode: station.code,
                stationName: `ฐาน ${station.code}: ${station.name} (${station.dept})`,
                timestamp: timeStr,
                source: 'online'
            });
        })
        .then(() => {
            showSuccessFeedback(`ฐาน ${station.code}: ${station.name} (${station.dept})`);
        })
        .catch(err => {
            alert('ไม่สามารถบันทึกคะแนนได้ กรุณาตรวจสอบการเชื่อมต่ออินเทอร์เน็ต\n' + err.message);
        })
        .finally(() => {
            if (card) card.classList.remove('disabled');
        });
}

function showSuccessFeedback(fullName) {
    const overlay = document.getElementById('successOverlay');
    document.getElementById('selectedStationText').textContent = fullName;
    overlay.classList.add('active');

    let timeLeft = 3;
    const timerEl = document.getElementById('countdownTimerText');
    timerEl.textContent = timeLeft;

    clearInterval(countdownTimer);
    countdownTimer = setInterval(() => {
        timeLeft -= 1;
        timerEl.textContent = timeLeft;
        if (timeLeft <= 0) {
            clearInterval(countdownTimer);
            overlay.classList.remove('active');
        }
    }, 1000);
}

// =====================================================================
// TAB SWITCHING & PIN
// =====================================================================
function toggleView() {
    if (currentTab === 'votingView') {
        document.getElementById('pinInput').value = '';
        document.getElementById('pinBackdrop').classList.add('active');
        setTimeout(() => document.getElementById('pinInput').focus(), 150);
    } else {
        switchTab('votingView');
    }
}

function closePinModal() {
    document.getElementById('pinBackdrop').classList.remove('active');
}

function checkPin() {
    const pin = document.getElementById('pinInput').value;
    if (pin === ADMIN_PIN) {
        closePinModal();
        switchTab('adminView');
    } else {
        alert('รหัสผ่านไม่ถูกต้อง!');
    }
}

function switchTab(tabId) {
    currentTab = tabId;
    document.querySelectorAll('.tab-view').forEach(t => t.classList.remove('active'));
    document.getElementById(tabId).classList.add('active');

    const navText = document.getElementById('navText');
    if (tabId === 'adminView') {
        navText.textContent = 'กลับสู่หน้าโหวต (Kiosk)';
        updateDashboard();
    } else {
        navText.textContent = 'หน้าสรุปผล (Admin)';
    }
}

// =====================================================================
// DASHBOARD RENDERING
// =====================================================================
function updateDashboard() {
    const totalVotes = Object.values(votes).reduce((sum, v) => sum + (v || 0), 0);
    const totalEl = document.getElementById('totalVotesNum');
    if (totalEl) totalEl.textContent = totalVotes.toLocaleString();

    let topStation = null, maxCount = -1;
    STATIONS.forEach(s => {
        const c = votes[s.code] || 0;
        if (c > maxCount && c > 0) { maxCount = c; topStation = s; }
    });
    const topEl = document.getElementById('topStationName');
    if (topEl) topEl.textContent = topStation ? `ฐาน ${topStation.code}` : '-';

    const lastEl = document.getElementById('lastActionTime');
    if (lastEl) {
        lastEl.textContent = historyArray.length > 0
            ? (historyArray[0].timestamp.split(' ')[1] || historyArray[0].timestamp)
            : '-';
    }

    // Bars
    const barContainer = document.getElementById('barChartContainer');
    if (barContainer) {
        barContainer.innerHTML = '';
        STATIONS.forEach(st => {
            const count = votes[st.code] || 0;
            const pct = totalVotes > 0 ? ((count / totalVotes) * 100).toFixed(1) : 0;
            const item = document.createElement('div');
            item.className = 'bar-row';
            item.innerHTML = `
                <div class="bar-label">
                    <span><strong style="color:${st.badgeBg}">ฐาน ${st.code}</strong>: ${st.name} <span style="color:#0284c7; font-weight:800;">(${st.dept})</span></span>
                    <span style="color:var(--dark-cyan);">${count} ไลค์ (${pct}%)</span>
                </div>
                <div class="bar-track">
                    <div class="bar-progress" style="width: ${pct}%; background: linear-gradient(90deg, ${st.badgeBg}, #0bb8b5);"></div>
                </div>
            `;
            barContainer.appendChild(item);
        });
    }

    // Ranking table
    const tableBody = document.getElementById('rankingTableBody');
    if (tableBody) {
        tableBody.innerHTML = '';
        const sorted = [...STATIONS].sort((a, b) => (votes[b.code] || 0) - (votes[a.code] || 0));
        sorted.forEach((st, idx) => {
            const count = votes[st.code] || 0;
            const pct = totalVotes > 0 ? ((count / totalVotes) * 100).toFixed(1) : '0.0';
            const rankClass = idx === 0 ? 'top-1' : (idx === 1 ? 'top-2' : (idx === 2 ? 'top-3' : ''));
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td><span class="rank-circle ${rankClass}">${idx + 1}</span></td>
                <td>
                    <strong style="font-size:1.05rem;">ฐาน ${st.code}: ${st.name}</strong>
                    <div style="color:var(--primary-cyan); font-weight:800; font-size:0.92rem;">${st.dept}</div>
                </td>
                <td style="text-align: right; font-weight: 900; font-size:1.15rem; color:var(--dark-cyan);">${count}</td>
                <td style="text-align: right; font-weight: 800; color:var(--primary-orange);">${pct}%</td>
            `;
            tableBody.appendChild(tr);
        });
    }
}

function renderAuditLog() {
    const logScroll = document.getElementById('logScrollContainer');
    if (!logScroll) return;
    logScroll.innerHTML = '';
    if (historyArray.length === 0) {
        logScroll.innerHTML = '<div style="padding:15px; text-align:center; color:#94a3b8;">ยังไม่มีประวัติการกดไลค์</div>';
        return;
    }
    historyArray.slice(0, 30).forEach(h => {
        const el = document.createElement('div');
        const isImport = h.source === 'import';
        el.className = 'log-item' + (isImport ? ' import-log' : '');
        el.innerHTML = `
            <span>${isImport ? '📥 นำเข้า' : '👍 ถูกใจ'}: <strong>${h.stationName}</strong></span>
            <span style="color:var(--text-muted); font-size:0.85rem;">🕒 ${h.timestamp}</span>
        `;
        logScroll.appendChild(el);
    });
}

// =====================================================================
// RESET
// =====================================================================
function confirmResetVotes() {
    if (confirm("ยืนยันการล้างคะแนนทั้งหมดให้เป็น 0 และลบประวัติทั้งหมดหรือไม่?\n(การล้างจะมีผลกับทุกเครื่องที่เชื่อมต่ออยู่แบบเรียลไทม์)")) {
        const updates = {};
        STATIONS.forEach(s => updates[s.code] = 0);
        votesRef.update(updates)
            .then(() => historyRef.remove())
            .then(() => alert("ล้างคะแนนเรียบร้อยแล้ว!"))
            .catch(err => alert("เกิดข้อผิดพลาด: " + err.message));
    }
}

// =====================================================================
// EXPORT TO EXCEL (CSV, UTF-8 BOM) — same format the Import feature reads back
// =====================================================================
function exportToExcel() {
    const totalVotes = Object.values(votes).reduce((sum, v) => sum + (v || 0), 0);

    let csv = "";
    csv += "รายงานสรุปผลการประเมินความพึงพอใจฐานกิจกรรมอบรม\n";
    csv += `วันที่ออกรายงาน,${new Date().toLocaleDateString('th-TH')} ${new Date().toLocaleTimeString('th-TH')}\n`;
    csv += `ยอดผู้เข้าร่วมกดคะแนนทั้งหมด,${totalVotes} คน\n\n`;

    csv += "อันดับ,รหัสฐาน,ชื่อฐานกิจกรรม,ชื่อแผนก,จำนวนคะแนนที่ได้ (ไลค์),ร้อยละ (%)\n";
    const sorted = [...STATIONS].sort((a, b) => (votes[b.code] || 0) - (votes[a.code] || 0));
    sorted.forEach((st, idx) => {
        const count = votes[st.code] || 0;
        const pct = totalVotes > 0 ? ((count / totalVotes) * 100).toFixed(2) : "0.00";
        csv += `"${idx + 1}","ฐาน ${st.code}","${st.name}","${st.dept}","${count}","${pct}%"\n`;
    });

    csv += "\n\nประวัติการบันทึกคะแนนทั้งหมด (Audit Log)\n";
    csv += "ลำดับ,ฐานกิจกรรมที่ได้รับไลค์,วันและเวลาที่บันทึก\n";
    historyArray.slice().reverse().forEach((item, index) => {
        csv += `"${index + 1}","${item.stationName.replace(/"/g, '""')}","${item.timestamp}"\n`;
    });

    const blob = new Blob(["\uFEFF" + csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `สรุปผลประเมินฐานกิจกรรม_${new Date().toISOString().slice(0,10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

// =====================================================================
// IMPORT FROM EXCEL / CSV
// Accepts either:
//  (a) the "Audit Log" table this same app exports (preferred — keeps exact
//      per-vote timestamps and adds each as its own history entry), or
//  (b) the "อันดับ,รหัสฐาน,..." ranking summary table (fallback — adds the
//      totals as one combined entry per station).
// Either way, counts are ADDED on top of whatever is currently in the
// database — nothing is overwritten.
// =====================================================================
function openImportModal() {
    document.getElementById('importStatus').textContent = '';
    document.getElementById('importStatus').className = 'import-status';
    document.getElementById('importFileInput').value = '';
    document.getElementById('importBackdrop').classList.add('active');
}

function closeImportModal() {
    document.getElementById('importBackdrop').classList.remove('active');
}

function triggerImportFilePicker() {
    document.getElementById('importFileInput').click();
}

function handleImportFile(event) {
    const file = event.target.files[0];
    if (!file) return;

    const statusEl = document.getElementById('importStatus');
    statusEl.className = 'import-status';
    statusEl.textContent = 'กำลังอ่านไฟล์...';

    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const data = new Uint8Array(e.target.result);
            const workbook = XLSX.read(data, { type: 'array' });
            const sheetName = workbook.SheetNames[0];
            const rows = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName], { header: 1, defval: '' });
            processImportedRows(rows, statusEl);
        } catch (err) {
            statusEl.className = 'import-status error';
            statusEl.textContent = '❌ ไม่สามารถอ่านไฟล์ได้: ' + err.message;
        }
    };
    reader.onerror = function() {
        statusEl.className = 'import-status error';
        statusEl.textContent = '❌ เกิดข้อผิดพลาดขณะอ่านไฟล์';
    };
    reader.readAsArrayBuffer(file);
}

function extractStationCode(text) {
    const m = String(text).match(/ฐาน\s*([A-Fa-f])/);
    return m ? m[1].toUpperCase() : null;
}

function processImportedRows(rows, statusEl) {
    // --- Try Audit Log table first (most accurate: preserves each vote) ---
    let auditHeaderIdx = rows.findIndex(r =>
        r.some(c => String(c).includes('ฐานกิจกรรมที่ได้รับไลค์')) &&
        r.some(c => String(c).includes('วันและเวลาที่บันทึก'))
    );

    const perStationDelta = {};
    const newHistoryEntries = [];

    if (auditHeaderIdx !== -1) {
        for (let i = auditHeaderIdx + 1; i < rows.length; i++) {
            const row = rows[i];
            if (!row || row.every(c => String(c).trim() === '')) break;
            const nameCell = row[1];
            const timeCell = row[2];
            const code = extractStationCode(nameCell);
            if (!code) continue;
            perStationDelta[code] = (perStationDelta[code] || 0) + 1;
            newHistoryEntries.push({
                stationCode: code,
                stationName: String(nameCell),
                timestamp: String(timeCell || '(นำเข้าจากไฟล์)'),
                source: 'import'
            });
        }
    } else {
        // --- Fallback: ranking summary table ---
        let summaryHeaderIdx = rows.findIndex(r =>
            r.some(c => String(c).trim() === 'อันดับ') &&
            r.some(c => String(c).includes('รหัสฐาน'))
        );
        if (summaryHeaderIdx === -1) {
            statusEl.className = 'import-status error';
            statusEl.textContent = '❌ ไม่พบตารางข้อมูลที่รู้จักในไฟล์นี้ (ต้องมีคอลัมน์ "รหัสฐาน" หรือ "ฐานกิจกรรมที่ได้รับไลค์")';
            return;
        }
        const now = new Date();
        const timeStr = now.toLocaleDateString('th-TH') + ' ' + now.toLocaleTimeString('th-TH');
        for (let i = summaryHeaderIdx + 1; i < rows.length; i++) {
            const row = rows[i];
            if (!row || row.every(c => String(c).trim() === '')) break;
            const code = extractStationCode(row[1]);
            const count = parseInt(row[4], 10);
            if (!code || isNaN(count) || count <= 0) continue;
            perStationDelta[code] = (perStationDelta[code] || 0) + count;
            const station = STATIONS.find(s => s.code === code);
            newHistoryEntries.push({
                stationCode: code,
                stationName: `ฐาน ${code}: ${station ? station.name : ''} (นำเข้าข้อมูลเก่า +${count} คะแนน)`,
                timestamp: timeStr,
                source: 'import'
            });
        }
    }

    const stationsFound = Object.keys(perStationDelta);
    if (stationsFound.length === 0) {
        statusEl.className = 'import-status error';
        statusEl.textContent = '❌ ไม่พบข้อมูลคะแนนที่นำเข้าได้ในไฟล์นี้';
        return;
    }

    statusEl.textContent = 'กำลังบันทึกข้อมูลลงฐานข้อมูล...';

    // Apply vote increments via transactions
    const voteUpdates = stationsFound.map(code =>
        votesRef.child(code).transaction(cur => (cur || 0) + perStationDelta[code])
    );

    Promise.all(voteUpdates)
        .then(() => {
            // Batch-write the history entries in one update call
            const updates = {};
            newHistoryEntries.forEach(entry => {
                const key = historyRef.push().key;
                updates[key] = entry;
            });
            return historyRef.update(updates);
        })
        .then(() => {
            const summary = stationsFound.map(c => `ฐาน ${c} +${perStationDelta[c]}`).join(', ');
            statusEl.className = 'import-status success';
            statusEl.textContent = `✅ นำเข้าสำเร็จ: ${summary}`;
            setTimeout(() => closeImportModal(), 2200);
        })
        .catch(err => {
            statusEl.className = 'import-status error';
            statusEl.textContent = '❌ บันทึกข้อมูลไม่สำเร็จ: ' + err.message;
        });
}

document.addEventListener('DOMContentLoaded', function() {
    document.getElementById('pinInput').addEventListener('keyup', function(e) {
        if (e.key === 'Enter') checkPin();
    });
    initApp();
});
