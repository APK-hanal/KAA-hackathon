// State Variables
let currentResults = [];
let activeQuizAgency = null;

const QUESTIONS = [
    {
        id: "q1",
        question: "Did the agency ask for payment before signing a written contract?",
        points: 25,
        reason: "Asking for payment prior to signing a valid employment agreement is a major illegal scam signal."
    },
    {
        id: "q2",
        question: "Is promised salary 30%+ higher than typical market rate for this role?",
        points: 15,
        reason: "Unrealistic wage promises are frequently used to entice vulnerable workers."
    },
    {
        id: "q3",
        question: "Did they pressure you to decide or pay quickly (e.g. 'offer expires today')?",
        points: 15,
        reason: "Artificial pressure tactics aim to prevent workers from verifying information."
    },
    {
        id: "q4",
        question: "Did they refuse to give you a physical copy of the contract to review at home?",
        points: 20,
        reason: "Legitimate agencies always allow candidates to keep copy of employment terms."
    },
    {
        id: "q5",
        question: "Does the agency lack a physical registered office (operates via phone/social media only)?",
        points: 15,
        reason: "Unlicensed brokers operate solely via mobile phones or unregistered social media pages."
    },
    {
        id: "q6",
        question: "Did they request payment to a personal bank account/mobile wallet instead of official agency account?",
        points: 20,
        reason: "Personal account transfers circumvent legal financial accountability."
    },
    {
        id: "q7",
        question: "Were you promised a job or country inconsistent with your visa type (e.g. tourist visa for work)?",
        points: 15,
        reason: "Traveling on tourist visas for overseas employment bypasses DoFE legal protections."
    }
];

// DOM References
const searchForm = document.getElementById('searchForm');
const searchInput = document.getElementById('searchInput');
const resultsContainer = document.getElementById('resultsContainer');

const quizModal = document.getElementById('quizModal');
const quizForm = document.getElementById('quizForm');
const quizAgencyName = document.getElementById('quizAgencyName');
const quizScoreText = document.getElementById('quizScoreText');
const quizMeterBar = document.getElementById('quizMeterBar');
const submitQuizBtn = document.getElementById('submitQuizBtn');

const shareModal = document.getElementById('shareModal');
const shareTextarea = document.getElementById('shareTextarea');
const copyShareBtn = document.getElementById('copyShareBtn');

const smsModal = document.getElementById('smsModal');
const openSmsModalBtn = document.getElementById('openSmsModalBtn');
const smsForm = document.getElementById('smsForm');
const smsInput = document.getElementById('smsInput');
const smsDisplayOutgoing = document.getElementById('smsDisplayOutgoing');
const smsDisplayIncoming = document.getElementById('smsDisplayIncoming');

// Event Listeners
searchForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const query = searchInput.value.trim();
    if (!query) return;

    resultsContainer.innerHTML = `<div class="text-center py-8 text-slate-500 animate-pulse font-medium">Querying official DoFE database...</div>`;

    try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
        const data = await res.json();
        currentResults = data.results || [];
        renderResults(currentResults, query);
    } catch (err) {
        resultsContainer.innerHTML = `<div class="p-4 bg-red-50 text-red-700 rounded-lg border border-red-200">Failed to connect to backend server.</div>`;
    }
});

function renderResults(results, query) {
    if (!results || results.length === 0) {
        resultsContainer.innerHTML = `
            <div class="bg-red-50 border-2 border-red-300 rounded-xl p-6 text-center">
                <div class="inline-flex items-center justify-center w-12 h-12 bg-red-100 rounded-full text-red-600 font-bold text-xl mb-3">✕</div>
                <h3 class="text-lg font-bold text-red-900">NOT FOUND IN DOFE REGISTRY</h3>
                <p class="text-sm text-red-700 mt-1">No registered agency found matching "<strong>${escapeHtml(query)}</strong>". Do not pay any money to this entity.</p>
            </div>
        `;
        return;
    }

    resultsContainer.innerHTML = results.map((item, index) => {
        const status = item.ui_status;
        const reports = item.community_reports;
        
        let badgeStyle = "bg-emerald-100 text-emerald-800 border-emerald-300";
        let cardBorder = "border-emerald-200";
        
        if (status.color === 'yellow') {
            badgeStyle = "bg-amber-100 text-amber-800 border-amber-300";
            cardBorder = "border-amber-200";
        } else if (status.color === 'red') {
            badgeStyle = "bg-rose-100 text-rose-800 border-rose-300";
            cardBorder = "border-rose-200";
        }

        // Community Reports Summary Pill
        let reportsPill = `<span class="text-slate-400 text-xs italic">No community reports submitted yet</span>`;
        if (reports.total_count > 0) {
            let rColor = "bg-slate-100 text-slate-700 border-slate-300";
            if (reports.avg_risk_level === 'High') rColor = "bg-rose-100 text-rose-800 border-rose-300 font-bold";
            if (reports.avg_risk_level === 'Medium') rColor = "bg-amber-100 text-amber-800 border-amber-300 font-bold";
            
            reportsPill = `<span class="inline-block px-2.5 py-0.5 rounded-full text-xs border ${rColor}">
                📊 ${reports.total_count} Report(s) (Avg Risk: ${reports.avg_risk_level})
            </span>`;
        }

        return `
            <div class="bg-white rounded-xl shadow-sm border-2 ${cardBorder} p-6 transition-all">
                <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4 pb-3 border-b border-slate-100">
                    <div>
                        <span class="text-xs font-bold uppercase tracking-wider text-slate-400">License #${escapeHtml(item.permission_no || 'N/A')}</span>
                        <h2 class="text-xl font-bold text-slate-900">${escapeHtml(item.name)}</h2>
                    </div>
                    <span class="inline-block px-3 py-1 rounded-full text-xs font-bold border ${badgeStyle} self-start sm:self-center">
                        ${status.label}
                    </span>
                </div>

                <p class="text-xs text-slate-600 mb-4 bg-slate-50 p-2.5 rounded border border-slate-200 leading-relaxed">${status.description}</p>

                <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm text-slate-600 mb-5">
                    <div><strong class="text-slate-800">District:</strong> ${escapeHtml(item.district || 'N/A')}</div>
                    <div><strong class="text-slate-800">Phone:</strong> ${escapeHtml(item.telephone || item.mobile || 'Not Listed')}</div>
                    <div class="sm:col-span-2"><strong class="text-slate-800">Address:</strong> ${escapeHtml(item.address || 'Not Listed')}</div>
                </div>

                <!-- Community Reports Collapsible View -->
                <div class="border-t border-slate-100 pt-4 mb-4">
                    <div class="flex items-center justify-between cursor-pointer" onclick="toggleReportsList(${index})">
                        <div class="flex items-center gap-2">
                            <span class="text-sm font-bold text-slate-800">Community Safety Reports</span>
                            ${reportsPill}
                        </div>
                        <span class="text-xs text-blue-600 font-semibold" id="toggleReportText_${index}">View Details ▼</span>
                    </div>

                    <div id="reportsList_${index}" class="hidden mt-3 space-y-3 pt-2">
                        ${renderPastReports(reports)}
                    </div>
                </div>

                <!-- Card Action Buttons -->
                <div class="flex flex-wrap items-center justify-end gap-2 pt-3 border-t border-slate-100">
                    <button onclick="openShareModal(${index})" class="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg transition-colors">
                        📤 Share Summary
                    </button>
                    <button onclick="openQuizModal(${index})" class="px-3 py-2 bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-300 text-xs font-semibold rounded-lg transition-colors">
                        ⚠️ Evaluate / Report Scam Signs
                    </button>
                </div>
            </div>
        `;
    }).join('');
}

function renderPastReports(reports) {
    if (!reports || reports.total_count === 0) {
        return `
            <div class="p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-500 italic text-center">
                No reports submitted for this agency yet. (Note: Zero reports does not guarantee safety).
            </div>
        `;
    }

    return reports.list.map(r => {
        let badge = "bg-emerald-100 text-emerald-800";
        if (r.risk_level === 'Medium') badge = "bg-amber-100 text-amber-800";
        if (r.risk_level === 'High') badge = "bg-rose-100 text-rose-800 font-bold";

        const flaggedAnswers = (r.answers_json || []).filter(a => a.flagged);

        return `
            <div class="p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs space-y-1.5">
                <div class="flex justify-between items-center">
                    <span class="px-2 py-0.5 rounded text-[10px] font-bold ${badge}">
                        ${r.risk_level.toUpperCase()} RISK (Score: ${r.risk_score})
                    </span>
                    <span class="text-[10px] text-slate-400">${new Date(r.created_at).toLocaleDateString()}</span>
                </div>

                ${r.comment ? `<p class="text-slate-700 font-medium italic">"${escapeHtml(r.comment)}"</p>` : ''}

                ${flaggedAnswers.length > 0 ? `
                    <div class="text-[11px] text-slate-600 mt-1">
                        <strong class="text-slate-700">Triggered Warning Signs:</strong>
                        <ul class="list-disc pl-4 space-y-0.5 mt-0.5 text-slate-600">
                            ${flaggedAnswers.map(a => `<li>${escapeHtml(a.question)} (+${a.points} pts)</li>`).join('')}
                        </ul>
                    </div>
                ` : '<div class="text-[10px] text-slate-400">No scam warning triggers flagged in evaluation.</div>'}
            </div>
        `;
    }).join('');
}

function toggleReportsList(index) {
    const el = document.getElementById(`reportsList_${index}`);
    const txt = document.getElementById(`toggleReportText_${index}`);
    if (el.classList.contains('hidden')) {
        el.classList.remove('hidden');
        txt.innerText = 'Hide Details ▲';
    } else {
        el.classList.add('hidden');
        txt.innerText = 'View Details ▼';
    }
}

// QUESTIONNAIRE LOGIC
function openQuizModal(index) {
    activeQuizAgency = currentResults[index];
    quizAgencyName.innerText = `Reporting: ${activeQuizAgency.name}`;

    // Render Form Questions
    quizForm.innerHTML = QUESTIONS.map((q) => `
        <div class="p-3.5 bg-slate-50 border border-slate-200 rounded-lg text-xs sm:text-sm">
            <p class="font-semibold text-slate-800 mb-2">${q.question}</p>
            <div class="flex gap-4">
                <label class="inline-flex items-center gap-1.5 cursor-pointer">
                    <input type="radio" name="${q.id}" value="yes" onchange="recalculateScore()" class="text-blue-600 focus:ring-blue-500">
                    <span class="font-medium text-slate-700">Yes (+${q.points} pts)</span>
                </label>
                <label class="inline-flex items-center gap-1.5 cursor-pointer">
                    <input type="radio" name="${q.id}" value="no" onchange="recalculateScore()" checked class="text-slate-600 focus:ring-slate-500">
                    <span class="text-slate-600">No</span>
                </label>
            </div>
        </div>
    `).join('');

    document.getElementById('quizComment').value = '';
    recalculateScore();
    quizModal.classList.remove('hidden');
}

function calculateCurrentQuiz() {
    let score = 0;
    const answers = [];

    QUESTIONS.forEach(q => {
        const selected = quizForm.querySelector(`input[name="${q.id}"]:checked`)?.value;
        const isYes = selected === 'yes';
        if (isYes) score += q.points;

        answers.push({
            question: q.question,
            flagged: isYes,
            points: isYes ? q.points : 0,
            reason: q.reason
        });
    });

    let level = "Low";
    if (score >= 56) level = "High";
    else if (score >= 26) level = "Medium";

    return { score, level, answers };
}

function recalculateScore() {
    const { score, level } = calculateCurrentQuiz();
    
    quizScoreText.innerText = `${score} Points (${level} Risk)`;
    
    // Normalize bar width up to 100 max
    const percentage = Math.min(score, 100);
    quizMeterBar.style.width = `${percentage}%`;

    if (level === 'High') {
        quizMeterBar.className = "risk-meter-bar bg-rose-600 h-full";
        quizScoreText.className = "text-rose-700 font-bold";
    } else if (level === 'Medium') {
        quizMeterBar.className = "risk-meter-bar bg-amber-500 h-full";
        quizScoreText.className = "text-amber-700 font-bold";
    } else {
        quizMeterBar.className = "risk-meter-bar bg-emerald-500 h-full";
        quizScoreText.className = "text-emerald-700 font-bold";
    }
}

submitQuizBtn.addEventListener('click', async () => {
    if (!activeQuizAgency) return;

    // Client-side throttling check (5 min block per agency in localStorage)
    const throttleKey = `report_throttle_${activeQuizAgency.id}`;
    const lastSubmit = localStorage.getItem(throttleKey);
    if (lastSubmit && (Date.now() - parseInt(lastSubmit)) < 5 * 60 * 1000) {
        alert("You have submitted a report for this agency recently. Please wait a few minutes before submitting another.");
        return;
    }

    const { score, level, answers } = calculateCurrentQuiz();
    const comment = document.getElementById('quizComment').value.trim();

    const payload = {
        agency_id: activeQuizAgency.id,
        permission_no: activeQuizAgency.permission_no || "N/A",
        risk_score: score,
        risk_level: level,
        answers: answers,
        comment: comment
    };

    try {
        submitQuizBtn.disabled = true;
        submitQuizBtn.innerText = "Submitting...";

        const res = await fetch('/api/reports', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        if (res.ok) {
            localStorage.setItem(throttleKey, Date.now().toString());
            quizModal.classList.add('hidden');
            // Re-trigger active search to update community reports immediately
            searchForm.dispatchEvent(new Event('submit'));
        } else {
            alert("Failed to save report.");
        }
    } catch (e) {
        alert("Error submitting report.");
    } finally {
        submitQuizBtn.disabled = false;
        submitQuizBtn.innerText = "Submit Report";
    }
});

document.getElementById('closeQuizModalBtn').onclick = () => quizModal.classList.add('hidden');
document.getElementById('cancelQuizBtn').onclick = () => quizModal.classList.add('hidden');

// SHARE MODAL LOGIC
function openShareModal(index) {
    const item = currentResults[index];
    const statusLabel = item.ui_status.label;
    
    const text = `✅ VERIFICATION CHECK: Agency Shield Nepal\n\nAgency: ${item.name}\nLicense #: ${item.permission_no || 'N/A'}\nStatus: ${statusLabel}\nDistrict: ${item.district || 'N/A'}\nPhone: ${item.telephone || item.mobile || 'N/A'}\n\nChecked via Agency Shield (Official DoFE Data). Verify before paying fees!`;
    
    shareTextarea.value = text;
    shareModal.classList.remove('hidden');
}

copyShareBtn.onclick = () => {
    shareTextarea.select();
    navigator.clipboard.writeText(shareTextarea.value);
    copyShareBtn.innerText = "✓ Copied to Clipboard!";
    setTimeout(() => { copyShareBtn.innerText = "📋 Copy Text to Clipboard"; }, 2000);
};

document.getElementById('closeShareModalBtn').onclick = () => shareModal.classList.add('hidden');

// SMS SIMULATOR MODAL LOGIC
openSmsModalBtn.onclick = () => smsModal.classList.remove('hidden');
document.getElementById('closeSmsModalBtn').onclick = () => smsModal.classList.add('hidden');

smsForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const query = smsInput.value.trim();
    if (!query) return;

    smsDisplayOutgoing.innerText = query;
    smsDisplayOutgoing.classList.remove('hidden');
    smsDisplayIncoming.classList.add('hidden');

    const formData = new FormData();
    formData.append('Body', query);

    try {
        const res = await fetch('/api/sms', {
            method: 'POST',
            body: formData
        });
        const replyText = await res.text();
        
        smsDisplayIncoming.innerText = replyText;
        smsDisplayIncoming.classList.remove('hidden');
    } catch (err) {
        smsDisplayIncoming.innerText = "ERROR: SMS Gateway Unreachable";
        smsDisplayIncoming.classList.remove('hidden');
    }
});

function escapeHtml(str) {
    return str ? str.replace(/[&<>"']/g, m => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m])) : '';
}