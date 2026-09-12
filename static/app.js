// GLOBAL SHARED QUESTIONS DEFINITION
const QUESTIONS = [
    { id: "q1", question: "Did the agency ask for payment before signing a written contract?", points: 25, reason: "Payment prior to signing a contract is an illegal scam signal." },
    { id: "q2", question: "Is promised salary 30%+ higher than typical market rate?", points: 15, reason: "Unrealistic wage promises are used to bait candidates." },
    { id: "q3", question: "Did they pressure you to decide or pay quickly (e.g. 'offer expires today')?", points: 15, reason: "Pressure tactics aim to prevent verification." },
    { id: "q4", question: "Did they refuse to give you a physical copy of the contract to review at home?", points: 20, reason: "Legitimate agencies permit candidates to review terms at home." },
    { id: "q5", question: "Does the agency lack a physical registered office (operates via mobile/social media only)?", points: 15, reason: "Unregistered brokers operate solely via mobile phones or social media." },
    { id: "q6", question: "Did they request payment to a personal bank account/mobile wallet?", points: 20, reason: "Personal transfers bypass legal corporate accountability." },
    { id: "q7", question: "Were you promised a job or country inconsistent with visa type (e.g. tourist visa for work)?", points: 15, reason: "Traveling on tourist visas for overseas work bypasses DoFE legal safety." }
];

// STATE MANAGEMENT
let currentSearchResults = [];
let activeQuizAgency = null;
let autocompleteDebounceTimer = null;

const wizardState = {
    step: 1,
    country: '',
    jobRole: '',
    salary: '',
    selectedAgency: null,
    quizAnswers: [],
    quizScore: 0,
    quizLevel: 'Low',
    precautionResult: null
};

// VIEW NAVIGATION ROUTER
function navTo(viewName) {
    document.getElementById('landingView').classList.add('hidden');
    document.getElementById('wizardView').classList.add('hidden');
    document.getElementById('searchView').classList.add('hidden');

    if (viewName === 'wizard') {
        document.getElementById('wizardView').classList.remove('hidden');
        if (wizardState.step === 1) goToWizardStep(1);
    } else if (viewName === 'search') {
        document.getElementById('searchView').classList.remove('hidden');
    } else {
        document.getElementById('landingView').classList.remove('hidden');
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

// WIZARD STEP NAVIGATION
function goToWizardStep(stepNum) {
    // Validate Step 1 before advancing
    if (stepNum > 1 && wizardState.step === 1) {
        if (!wizardState.selectedAgency) {
            alert("Please search and select a recruiting agency from the list before proceeding.");
            return;
        }
    }

    wizardState.step = stepNum;

    // Update Progress Bar UI
    const stepTitles = ["Offer Details", "DoFE Registry Check", "Scam Questionnaire", "Precaution Result"];
    document.getElementById('wizardStepLabel').innerText = `Step ${stepNum} of 4`;
    document.getElementById('wizardStepTitle').innerText = stepTitles[stepNum - 1];
    document.getElementById('wizardProgressBar').style.width = `${(stepNum / 4) * 100}%`;

    // Hide all step panels
    for (let i = 1; i <= 4; i++) {
        document.getElementById(`wizardStep${i}`).classList.add('hidden');
    }

    // Step-specific initializations
    if (stepNum === 2) {
        renderWizardAgencyVerification();
    } else if (stepNum === 3) {
        renderWizardQuestionnaire();
    }

    document.getElementById(`wizardStep${stepNum}`).classList.remove('hidden');
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

// STEP 1: AGENCY AUTOCOMPLETE
const wizAgencyInput = document.getElementById('wizAgencyInput');
const wizAutocompleteList = document.getElementById('wizAutocompleteList');

wizAgencyInput.addEventListener('input', (e) => {
    const val = e.target.value.trim();
    clearTimeout(autocompleteDebounceTimer);

    if (val.length < 2) {
        wizAutocompleteList.classList.add('hidden');
        return;
    }

    autocompleteDebounceTimer = setTimeout(async () => {
        try {
            const res = await fetch(`/api/search?q=${encodeURIComponent(val)}`);
            const data = await res.json();
            renderAutocompleteDropdown(data.results || []);
        } catch (err) {
            console.error("Autocomplete fetch error:", err);
        }
    }, 250);
});

function renderAutocompleteDropdown(results) {
    if (results.length === 0) {
        wizAutocompleteList.innerHTML = `<div class="p-3 text-xs text-slate-500 italic">No matching registered agency found in DoFE database.</div>`;
        wizAutocompleteList.classList.remove('hidden');
        return;
    }

    wizAutocompleteList.innerHTML = results.map((item, idx) => `
        <div onclick="selectWizardAgency(${idx})" class="p-3 border-b border-slate-100 hover:bg-blue-50 cursor-pointer text-xs transition-colors">
            <strong class="text-slate-900 block text-sm">${escapeHtml(item.name)}</strong>
            <span class="text-slate-500">Lic #${escapeHtml(item.permission_no || 'N/A')} — ${escapeHtml(item.district || 'N/A')}</span>
        </div>
    `).join('');
    
    // Store temporary reference for index lookup
    window.tempAutocompleteResults = results;
    wizAutocompleteList.classList.remove('hidden');
}

function selectWizardAgency(idx) {
    const item = window.tempAutocompleteResults[idx];
    wizardState.selectedAgency = item;

    document.getElementById('wizSelectedAgencyName').innerText = item.name;
    document.getElementById('wizSelectedAgencyLic').innerText = `Lic #${item.permission_no || 'N/A'}`;
    
    document.getElementById('wizSelectedAgencyBadge').classList.remove('hidden');
    wizAgencyInput.classList.add('hidden');
    wizAutocompleteList.classList.add('hidden');
}

function clearSelectedAgency() {
    wizardState.selectedAgency = null;
    wizAgencyInput.value = '';
    wizAgencyInput.classList.remove('hidden');
    document.getElementById('wizSelectedAgencyBadge').classList.add('hidden');
}

// STEP 2: INLINE AGENCY VERIFICATION CARD
function renderWizardAgencyVerification() {
    const item = wizardState.selectedAgency;
    const cardContainer = document.getElementById('wizAgencyVerificationCard');

    if (!item) return;

    const status = item.ui_status;
    let badgeStyle = "bg-emerald-100 text-emerald-800 border-emerald-300";
    
    if (status.color === 'yellow') badgeStyle = "bg-amber-100 text-amber-800 border-amber-300";
    if (status.color === 'red') badgeStyle = "bg-rose-100 text-rose-800 border-rose-300";

    cardContainer.innerHTML = `
        <div class="bg-slate-50 border-2 rounded-xl p-5 border-slate-200">
            <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 mb-3">
                <div>
                    <span class="text-xs font-bold text-slate-400 uppercase">Permission No: ${escapeHtml(item.permission_no || 'N/A')}</span>
                    <h3 class="text-lg font-bold text-slate-900">${escapeHtml(item.name)}</h3>
                </div>
                <span class="px-3 py-1 rounded-full text-xs font-bold border ${badgeStyle}">${status.label}</span>
            </div>
            <p class="text-xs text-slate-600 mb-3 leading-relaxed">${status.description}</p>
            <div class="text-xs text-slate-600 grid grid-cols-2 gap-2 pt-2 border-t border-slate-200">
                <div><strong>District:</strong> ${escapeHtml(item.district || 'N/A')}</div>
                <div><strong>Phone:</strong> ${escapeHtml(item.telephone || item.mobile || 'N/A')}</div>
            </div>
        </div>
    `;
}

// STEP 3: QUESTIONNAIRE
function renderWizardQuestionnaire() {
    const form = document.getElementById('wizQuizForm');
    form.innerHTML = QUESTIONS.map((q) => `
        <div class="p-3.5 bg-slate-50 border border-slate-200 rounded-lg text-xs sm:text-sm">
            <p class="font-semibold text-slate-800 mb-2">${q.question}</p>
            <div class="flex gap-4">
                <label class="inline-flex items-center gap-1.5 cursor-pointer">
                    <input type="radio" name="wiz_${q.id}" value="yes" class="text-blue-600 focus:ring-blue-500">
                    <span class="font-medium text-slate-700">Yes (+${q.points} pts)</span>
                </label>
                <label class="inline-flex items-center gap-1.5 cursor-pointer">
                    <input type="radio" name="wiz_${q.id}" value="no" checked class="text-slate-600 focus:ring-slate-500">
                    <span class="text-slate-600">No</span>
                </label>
            </div>
        </div>
    `).join('');
}

function submitWizardAssessment() {
    let score = 0;
    const answers = [];

    QUESTIONS.forEach(q => {
        const selected = document.querySelector(`input[name="wiz_${q.id}"]:checked`)?.value;
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

    wizardState.quizScore = score;
    wizardState.quizLevel = level;
    wizardState.quizAnswers = answers;

    // Calculate Combined Precaution Level
    wizardState.precautionResult = calculateCombinedPrecaution(
        wizardState.selectedAgency.ui_status,
        score,
        level
    );

    renderWizardResult();
    goToWizardStep(4);
}

// STEP 4: COMBINED PRECAUTION LEVEL LOGIC
function calculateCombinedPrecaution(agencyStatus, quizScore, quizLevel) {
    const isUnlicensedOrBlocked = (agencyStatus.color === 'red');
    const isIncompleteData = (agencyStatus.color === 'yellow');

    if (isUnlicensedOrBlocked) {
        return {
            level: 'HIGH',
            color: 'rose',
            reasons: ['Agency is NOT FOUND, SUSPENDED, or UNLICENSED in official DoFE records.'],
            action: 'Multiple serious red flags. Do not pay anything or sign anything until you verify this agency directly through DoFE\'s office.'
        };
    }

    if (quizLevel === 'High') {
        return {
            level: 'HIGH',
            color: 'rose',
            reasons: ['Agency is registered, but your offer details flagged multiple severe scam warning signs.'],
            action: 'Multiple serious red flags. Do not pay anything or sign anything until you verify this agency directly through DoFE\'s office.'
        };
    }

    if (quizLevel === 'Medium' || isIncompleteData) {
        const reasons = [];
        if (isIncompleteData) reasons.push('Agency is active but missing verified contact details in DoFE registry.');
        if (quizLevel === 'Medium') reasons.push('Your offer details flagged concerning payment or contract pressure tactics.');

        return {
            level: 'MEDIUM',
            color: 'amber',
            reasons: reasons,
            action: 'Some concerning signs. Verify the contract in person at the agency\'s office before paying, and consider getting a second opinion from DoFE directly.'
        };
    }

    return {
        level: 'LOW',
        color: 'emerald',
        reasons: ['Agency is verified active and no major offer scam patterns were flagged.'],
        action: 'This offer shows no major red flags. Still get everything in writing before paying anything.'
    };
}

function renderWizardResult() {
    const res = wizardState.precautionResult;
    const banner = document.getElementById('wizPrecautionBanner');
    const reasonsList = document.getElementById('wizReasonsList');
    const actionAdvice = document.getElementById('wizActionAdvice');

    if (res.level === 'HIGH') {
        banner.className = "p-6 rounded-xl border-2 text-center bg-rose-50 border-rose-300 text-rose-900";
        banner.innerHTML = `<h3 class="text-2xl font-black text-rose-700">PRECAUTION LEVEL: HIGH RISK</h3><p class="text-xs font-semibold text-rose-800">Proceed with extreme caution. High probability of fraud.</p>`;
    } else if (res.level === 'MEDIUM') {
        banner.className = "p-6 rounded-xl border-2 text-center bg-amber-50 border-amber-300 text-amber-900";
        banner.innerHTML = `<h3 class="text-2xl font-black text-amber-700">PRECAUTION LEVEL: MEDIUM RISK</h3><p class="text-xs font-semibold text-amber-800">Caution advised. Certain warning signals detected.</p>`;
    } else {
        banner.className = "p-6 rounded-xl border-2 text-center bg-emerald-50 border-emerald-300 text-emerald-900";
        banner.innerHTML = `<h3 class="text-2xl font-black text-emerald-700">PRECAUTION LEVEL: LOW RISK</h3><p class="text-xs font-semibold text-emerald-800">No major red flags detected in DoFE database or offer quiz.</p>`;
    }

    reasonsList.innerHTML = res.reasons.map(r => `<li>${escapeHtml(r)}</li>`).join('');
    actionAdvice.innerText = res.action;
}

async function submitWizardReport() {
    const comment = document.getElementById('wizReportComment').value.trim();
    const btn = document.getElementById('wizSubmitReportBtn');

    const payload = {
        agency_id: wizardState.selectedAgency.id,
        permission_no: wizardState.selectedAgency.permission_no || "N/A",
        risk_score: wizardState.quizScore,
        risk_level: wizardState.quizLevel,
        answers: wizardState.quizAnswers,
        comment: comment
    };

    try {
        btn.disabled = true;
        btn.innerText = "Submitting Report...";

        const res = await fetch('/api/reports', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        if (res.ok) {
            btn.className = "w-full bg-slate-800 text-emerald-400 font-bold py-3 rounded-lg text-sm";
            btn.innerText = "✓ Submitted as Anonymous Community Safety Report";
        } else {
            alert("Failed to submit report.");
            btn.disabled = false;
            btn.innerText = "Submit as Anonymous Community Safety Report";
        }
    } catch (e) {
        alert("Error connecting to server.");
        btn.disabled = false;
        btn.innerText = "Submit as Anonymous Community Safety Report";
    }
}


// STANDALONE AGENCY SEARCH ENGINE (RETAINED)
const searchForm = document.getElementById('searchForm');
const searchInput = document.getElementById('searchInput');
const resultsContainer = document.getElementById('resultsContainer');

searchForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const query = searchInput.value.trim();
    if (!query) return;

    resultsContainer.innerHTML = `<div class="text-center py-8 text-slate-500 animate-pulse font-medium">Querying official DoFE database...</div>`;

    try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
        const data = await res.json();
        currentSearchResults = data.results || [];
        renderSearchResults(currentSearchResults, query);
    } catch (err) {
        resultsContainer.innerHTML = `<div class="p-4 bg-red-50 text-red-700 rounded-lg border border-red-200">Failed to connect to backend server.</div>`;
    }
});

function renderSearchResults(results, query) {
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
        return `<div class="p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-500 italic text-center">No reports submitted for this agency yet. (Zero reports does not guarantee safety).</div>`;
    }

    return reports.list.map(r => {
        let badge = "bg-emerald-100 text-emerald-800";
        if (r.risk_level === 'Medium') badge = "bg-amber-100 text-amber-800";
        if (r.risk_level === 'High') badge = "bg-rose-100 text-rose-800 font-bold";

        const flaggedAnswers = (r.answers_json || []).filter(a => a.flagged);

        return `
            <div class="p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs space-y-1.5">
                <div class="flex justify-between items-center">
                    <span class="px-2 py-0.5 rounded text-[10px] font-bold ${badge}">${r.risk_level.toUpperCase()} RISK (Score: ${r.risk_score})</span>
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

// MODALS LOGIC (Share, SMS, Standalone Quiz)
function openShareModal(index) {
    const item = currentSearchResults[index];
    const statusLabel = item.ui_status.label;
    const text = `✅ VERIFICATION CHECK: Agency Shield Nepal\n\nAgency: ${item.name}\nLicense #: ${item.permission_no || 'N/A'}\nStatus: ${statusLabel}\nDistrict: ${item.district || 'N/A'}\nPhone: ${item.telephone || item.mobile || 'N/A'}\n\nChecked via Agency Shield (Official DoFE Data). Verify before paying fees!`;
    
    document.getElementById('shareTextarea').value = text;
    document.getElementById('shareModal').classList.remove('hidden');
}

document.getElementById('copyShareBtn').onclick = () => {
    const textarea = document.getElementById('shareTextarea');
    textarea.select();
    navigator.clipboard.writeText(textarea.value);
    document.getElementById('copyShareBtn').innerText = "✓ Copied to Clipboard!";
    setTimeout(() => { document.getElementById('copyShareBtn').innerText = "📋 Copy Text to Clipboard"; }, 2000);
};

document.getElementById('closeShareModalBtn').onclick = () => document.getElementById('shareModal').classList.add('hidden');

// SMS Simulator Modal
document.getElementById('openSmsModalBtn').onclick = () => document.getElementById('smsModal').classList.remove('hidden');
document.getElementById('closeSmsModalBtn').onclick = () => document.getElementById('smsModal').classList.add('hidden');

document.getElementById('smsForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const query = document.getElementById('smsInput').value.trim();
    if (!query) return;

    const out = document.getElementById('smsDisplayOutgoing');
    const inc = document.getElementById('smsDisplayIncoming');

    out.innerText = query;
    out.classList.remove('hidden');
    inc.classList.add('hidden');

    const formData = new FormData();
    formData.append('Body', query);

    try {
        const res = await fetch('/api/sms', { method: 'POST', body: formData });
        const replyText = await res.text();
        inc.innerText = replyText;
        inc.classList.remove('hidden');
    } catch (err) {
        inc.innerText = "ERROR: Gateway unreachable";
        inc.classList.remove('hidden');
    }
});

// Standalone Quiz Modal
function openQuizModal(index) {
    activeQuizAgency = currentSearchResults[index];
    document.getElementById('quizAgencyName').innerText = `Reporting: ${activeQuizAgency.name}`;

    const form = document.getElementById('quizForm');
    form.innerHTML = QUESTIONS.map((q) => `
        <div class="p-3.5 bg-slate-50 border border-slate-200 rounded-lg text-xs sm:text-sm">
            <p class="font-semibold text-slate-800 mb-2">${q.question}</p>
            <div class="flex gap-4">
                <label class="inline-flex items-center gap-1.5 cursor-pointer">
                    <input type="radio" name="${q.id}" value="yes" onchange="recalculateStandaloneQuiz()" class="text-blue-600 focus:ring-blue-500">
                    <span class="font-medium text-slate-700">Yes (+${q.points} pts)</span>
                </label>
                <label class="inline-flex items-center gap-1.5 cursor-pointer">
                    <input type="radio" name="${q.id}" value="no" onchange="recalculateStandaloneQuiz()" checked class="text-slate-600 focus:ring-slate-500">
                    <span class="text-slate-600">No</span>
                </label>
            </div>
        </div>
    `).join('');

    document.getElementById('quizComment').value = '';
    recalculateStandaloneQuiz();
    document.getElementById('quizModal').classList.remove('hidden');
}

function recalculateStandaloneQuiz() {
    let score = 0;
    QUESTIONS.forEach(q => {
        const selected = document.querySelector(`input[name="${q.id}"]:checked`)?.value;
        if (selected === 'yes') score += q.points;
    });

    let level = "Low";
    if (score >= 56) level = "High";
    else if (score >= 26) level = "Medium";

    document.getElementById('quizScoreText').innerText = `${score} Points (${level} Risk)`;
    document.getElementById('quizMeterBar').style.width = `${Math.min(score, 100)}%`;
}

document.getElementById('closeQuizModalBtn').onclick = () => document.getElementById('quizModal').classList.add('hidden');
document.getElementById('cancelQuizBtn').onclick = () => document.getElementById('quizModal').classList.add('hidden');

function escapeHtml(str) {
    return str ? str.replace(/[&<>"']/g, m => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m])) : '';
}