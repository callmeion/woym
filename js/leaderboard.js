let lastVotesSnapshot = {};

function renderLeaderboard(votes) {
    const sorted = [...STATIONS].sort((a, b) => (votes[b.code] || 0) - (votes[a.code] || 0));
    const top3 = sorted.slice(0, 3);
    const rest = sorted.slice(3, 6);

    // ---- Podium (order visually as 2nd, 1st, 3rd via CSS 'order') ----
    const podiumWrap = document.getElementById('podiumWrap');
    podiumWrap.innerHTML = '';
    const medals = ['🥇', '🥈', '🥉'];

    top3.forEach((st, idx) => {
        const count = votes[st.code] || 0;
        const slot = document.createElement('div');
        slot.className = `podium-slot rank-${idx + 1}`;
        slot.innerHTML = `
            ${idx === 0 ? '<div class="podium-crown">👑</div>' : ''}
            <span class="podium-medal">${medals[idx]}</span>
            <div class="podium-letter" style="background:${st.badgeBg};">${st.code}</div>
            <div class="podium-name">${st.name}</div>
            <div class="podium-dept">${st.dept}</div>
            <div class="podium-score">${count}</div>
            <div class="podium-score-label">คะแนนโหวต</div>
        `;
        podiumWrap.appendChild(slot);
    });

    // Fill placeholders if fewer than 3 stations have votes/exist
    while (podiumWrap.children.length < 3) {
        const idx = podiumWrap.children.length;
        const slot = document.createElement('div');
        slot.className = `podium-slot rank-${idx + 1}`;
        slot.innerHTML = `<span class="podium-medal">${medals[idx]}</span><div class="podium-name">รอผลโหวต...</div>`;
        podiumWrap.appendChild(slot);
    }

    // ---- Runner-up 4-6 ----
    const runnerGrid = document.getElementById('runnerGrid');
    runnerGrid.innerHTML = '';
    rest.forEach((st, idx) => {
        const count = votes[st.code] || 0;
        const card = document.createElement('div');
        card.className = 'runner-card';
        card.style.borderLeftColor = st.badgeBg;
        card.innerHTML = `
            <div class="runner-rank">${idx + 4}</div>
            <div class="runner-letter" style="background:${st.badgeBg};">${st.code}</div>
            <div class="runner-info">
                <div class="runner-name">${st.name}</div>
                <div class="runner-dept">${st.dept}</div>
            </div>
            <div class="runner-score">${count}</div>
        `;
        runnerGrid.appendChild(card);
    });

    document.getElementById('lbUpdatedTime').textContent = new Date().toLocaleTimeString('th-TH');
    lastVotesSnapshot = { ...votes };
}

function initLeaderboard() {
    const votesRef = db.ref('votes');
    votesRef.on('value', snap => {
        const votes = snap.val() || {};
        STATIONS.forEach(s => { if (typeof votes[s.code] !== 'number') votes[s.code] = 0; });
        renderLeaderboard(votes);
    });

    db.ref('.info/connected').on('value', snap => {
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

document.addEventListener('DOMContentLoaded', initLeaderboard);
