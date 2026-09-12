// QUESTION DEFINITIONS FOR SCAM ASSESSMENT
const QUESTIONS = [
    { id: "q1", question: "Did the agency ask for payment before signing a written contract?", points: 25, reason: "Payment prior to signing a legal contract is illegal under DoFE regulations." },
    { id: "q2", question: "Is promised salary 30%+ higher than typical market rate?", points: 15, reason: "Unrealistic wage promises are frequently used to bait candidates." },
    { id: "q3", question: "Did they pressure you to decide or pay quickly (e.g. 'offer expires today')?", points: 15, reason: "Urgency tactics aim to prevent independent verification." },
    { id: "q4", question: "Did they refuse to give you a physical copy of the contract to review at home?", points: 20, reason: "Legitimate agencies permit candidates to review terms independently." },
    { id: "q5", question: "Does the agency lack a physical registered office (operates via mobile/social media only)?", points: 15, reason: "Unregistered sub-agents operate solely via mobile phones or social media." },
    { id: "q6", question: "Did they request payment to a personal bank account/mobile wallet?", points: 20, reason: "Personal bank transfers bypass legal corporate accountability." },
    { id: "q7", question: "Were you promised a job or country inconsistent with visa type (e.g. tourist visa)?", points: 15, reason: "Traveling on tourist visas for overseas employment bypasses legal safety." }
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
    selectedAgency: null, // Selected DB object or synthetic object
    quizAnswers: [],
    quizScore: 0,
    quizLevel: 'Low',
    precautionResult: null
};

// VIEW ROUTER
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

// FIX 1 HELPER: GET OR CONSTRUCT AGENCY DATA (FREE-TEXT SUPPORT)
function getWizardAgencyData() {
    const rawInput = document.getElementById('wizAgencyInput').value.trim();
    
    // If user clicked an autocomplete dropdown item and the text matches, return it
    if (wizardState.selectedAgency && wizardState.selectedAgency.name.toLowerCase() === rawInput.toLowerCase()) {
        return wizardState.selectedAgency;
    }
    
    // Check if typed text matches any autocomplete item in memory
    if (window.tempAutocompleteResults && window.tempAutocompleteResults.length > 0) {
        const exactMatch = window.tempAutocompleteResults.find(
            item => item.name.toLowerCase() === rawInput.toLowerCase() || item.permission_no.toLowerCase() === rawInput.toLowerCase()
        );
        if (exactMatch) {
            wizardState.selectedAgency = exactMatch;
            return exactMatch;
        }
    }

    if (!rawInput) return null;

    // Synthetic UNREGISTERED agency object for unlisted or low-similarity inputs
    return {
        id: null,
        name: rawInput,
        permission_no: "UNREGISTERED",
        district: "Not Listed",
        is_unregistered: true,
        ui_status: {
            color: "red",
            label: "NOT FOUND IN DOFE REGISTRY",
            description: "This agency name is not registered with Nepal's Department of Foreign Employment. Operating without an official license is illegal."
        },
        community_reports: { total_count: 0, avg_risk_level: "N/A", list: [] }
    };
}

// WIZARD STEP NAVIGATION
function goToWizardStep(stepNum) {
    // Validate Step 1 before advancing
    if (stepNum > 1 && wizardState.step === 1) {
        const agencyData = getWizardAgencyData();
        if (!agencyData || !agencyData.name.trim()) {
            alert("Please enter a recruiting agency name to proceed.");
            return;
        }
        wizardState.selectedAgency = agencyData;
    }

    wizardState.step = stepNum;

    // Update Progress Indicator UI
    const stepTitles = ["Offer Details", "DoFE License Check", "Scam Questionnaire", "Precaution Result"];
    document.getElementById('wizardStepLabel').innerText = `Step ${stepNum} of 4`;
    document.getElementById('wizardStepTitle').innerText = stepTitles[stepNum - 1];
    document.getElementById('wizardProgressBar').style.width = `${(stepNum / 4) * 100}%`;

    // Hide all step containers
    for (let i = 1; i <= 4; i++) {
        document.getElementById(`wizardStep${i}`).classList.add('hidden');
    }

    // Step-specific setup
    if (stepNum === 2) {
        renderWizardAgencyVerification();
    } else if (stepNum === 3) {
        renderWizardQuestionnaire();
    }

    document.getElementById(`wizardStep${stepNum}`).classList.remove('hidden');
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

// STEP 1: AUTOCOMPLETE AND FREE-TEXT INPUT
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
            renderAutocompleteDropdown(data.results || [], val);
        } catch (err) {
            console.error("Autocomplete fetch error:", err);
        }
    }, 250);
});

function renderAutocompleteDropdown(results, queryText) {
    if (results.length === 0) {
        wizAutocompleteList.innerHTML = `
            <div class="p-3 text-xs text-slate-500">
                <span class="font-bold text-red-700">No match (score &lt; 80%) in DoFE records.</span><br>
                You can proceed with "<strong>${escapeHtml(queryText)}</strong>" as an unregistered entity.
            </div>
        `;
        wizAutocompleteList.classList.remove('hidden');
        window.tempAutocompleteResults = [];
        return;
    }

    wizAutocompleteList.innerHTML = results.map((item, idx) => `
        <div onclick="selectWizardAgency(${idx})" class="p-2.5 border-b border-slate-100 hover:bg-slate-50 cursor-pointer text-xs transition-colors">
            <strong class="text-slate-900 block text-sm">${escapeHtml(item.name)}</strong>
            <span class="text-slate-500">Lic #${escapeHtml(item.permission_no || 'N/A')} — ${escapeHtml(item.district || 'N/A')} (${item.similarity_score}% match)</span>
        </div>
    `).join('');
    
    window.tempAutocompleteResults = results;
    wizAutocompleteList.classList.remove('hidden');
}

function selectWizardAgency(idx) {
    const item = window.tempAutocompleteResults[idx];
    wizardState.selectedAgency = item;
    wizAgencyInput.value = item.name;

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
    let badgeStyle = "bg-emerald-50 text-emerald-800 border-emerald-300";
    let cardBorder = "border-emerald-300";
    
    if (status.color === 'yellow') {
        badgeStyle = "bg-amber-50 text-amber-800 border-amber-300";
        cardBorder = "border-amber-300";
    } else if (status.color === 'red') {
        badgeStyle = "bg-red-50 text-red-800 border-red-300 font-bold";
        cardBorder = "border-red-300";
    }

    cardContainer.innerHTML = `
        <div class="bg-white border-2 rounded-lg p-4 sm:p-5 ${cardBorder}">
            <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 mb-3">
                <div>
                    <span class="text-xs font-bold text-slate-400 uppercase">License: ${escapeHtml(item.permission_no || 'UNREGISTERED')}</span>
                    <h3 class="text-lg font-bold text-slate-900">${escapeHtml(item.name)}</h3>
                </div>
                <span class="px-2.5 py-1 rounded-full text-xs font-semibold border ${badgeStyle}">${status.label}</span>
            </div>
            <p class="text-xs text-slate-600 mb-3 leading-relaxed">${status.description}</p>
            <div class="text-xs text-slate-600 grid grid-cols-2 gap-2 pt-2 border-t border-slate-100">
                <div><strong>District:</strong> ${escapeHtml(item.district || 'Not Listed')}</div>
                <div><strong>Phone:</strong> ${escapeHtml(item.telephone || item.mobile || 'Not Listed')}</div>
            </div>
        </div>
    `;
}

// STEP 3: QUESTIONNAIRE RENDER
function renderWizardQuestionnaire() {
    const form = document.getElementById('wizQuizForm');
    form.innerHTML = QUESTIONS.map((q) => `
        <div class="p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs sm:text-sm">
            <p class="font-semibold text-slate-800 mb-2">${q.question}</p>
            <div class="flex gap-4">
                <label class="inline-flex items-center gap-1.5 cursor-pointer">
                    <input type="radio" name="wiz_${q.id}" value="yes" class="text-slate-900 focus:ring-slate-900">
                    <span class="font-medium text-slate-800">Yes (+${q.points} pts)</span>
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

    wizardState.precautionResult = calculateCombinedPrecaution(
        wizardState.selectedAgency,
        score,
        level
    );

    renderWizardResult();
    goToWizardStep(4);
}

// STEP 4: COMBINED PRECAUTION LEVEL LOGIC
function calculateCombinedPrecaution(agencyData, quizScore, quizLevel) {
    const isUnregistered = agencyData.is_unregistered || !agencyData.id;
    const isUnlicensedOrBlocked = (agencyData.ui_status?.color === 'red') || isUnregistered;
    const isIncompleteData = (agencyData.ui_status?.color === 'yellow');

    // Rule 1: Fake / Unregistered / Suspended agency -> Automatic HIGH Precaution Level
    if (isUnlicensedOrBlocked) {
        const reasons = [];
        if (isUnregistered) {
            reasons.push(`The agency "${agencyData.name}" was NOT FOUND in official DoFE government records — this is a critical red flag.`);
        } else {
            reasons.push(`Agency license status is suspended or revoked in DoFE records.`);
        }
        if (quizLevel === 'High' || quizLevel === 'Medium') {
            reasons.push(`Additionally, your offer details flagged ${quizScore} points in scam warning patterns.`);
        }

        return {
            level: 'HIGH',
            color: 'red',
            reasons: reasons,
            action: 'Multiple serious red flags. Do NOT pay any money or sign any contract until you verify this agency directly through DoFE\'s office.'
        };
    }

    // Rule 2: Registered agency, but High Quiz Risk
    if (quizLevel === 'High') {
        return {
            level: 'HIGH',
            color: 'red',
            reasons: [
                'Agency is registered with DoFE, but your offer details flagged multiple severe scam warning signs.',
                `Questionnaire score reached ${quizScore} points (High Risk threshold).`
            ],
            action: 'Multiple serious red flags. Do NOT pay any money or sign any contract until you verify this agency directly through DoFE\'s office.'
        };
    }

    // Rule 3: Medium Risk from Quiz OR Incomplete Contact Data
    if (quizLevel === 'Medium' || isIncompleteData) {
        const reasons = [];
        if (isIncompleteData) reasons.push('Agency is listed as active but missing verified phone/address details in official DoFE registry.');
        if (quizLevel === 'Medium') reasons.push(`Your offer details flagged ${quizScore} points in payment or contract pressure tactics.`);

        return {
            level: 'MEDIUM',
            color: 'amber',
            reasons: reasons,
            action: 'Some concerning signs. Verify the contract in person at the agency\'s registered office before paying, and consider getting a second opinion from DoFE directly.'
        };
    }

    // Rule 4: Verified agency + Low Quiz Risk
    return {
        level: 'LOW',
        color: 'green',
        reasons: ['Agency is verified active and registered with DoFE, and no major offer scam patterns were flagged.'],
        action: 'This offer shows no major red flags. Still get everything in writing before paying anything.'
    };
}

function renderWizardResult() {
    const res = wizardState.precautionResult;
    const banner = document.getElementById('wizPrecautionBanner');
    const reasonsList = document.getElementById('wizReasonsList');
    const actionAdvice = document.getElementById('wizActionAdvice');

    if (res.level === 'HIGH') {
        banner.className = "p-5 rounded-lg border-2 text-center bg-red-50 border-red-300 text-red-900";
        banner.innerHTML = `<h3 class="text-xl font-extrabold text-red-800">PRECAUTION LEVEL: HIGH RISK</h3><p class="text-xs font-semibold text-red-700">High probability of fraud or unlicensed operation.</p>`;
    } else if (res.level === 'MEDIUM') {
        banner.className = "p-5 rounded-lg border-2 text-center bg-amber-50 border-amber-300 text-amber-900";
        banner.innerHTML = `<h3 class="text-xl font-extrabold text-amber-800">PRECAUTION LEVEL: MEDIUM RISK</h3><p class="text-xs font-semibold text-amber-700">Caution advised. Warning signals detected.</p>`;
    } else {
        banner.className = "p-5 rounded-lg border-2 text-center bg-emerald-50 border-emerald-300 text-emerald-900";
        banner.innerHTML = `<h3 class="text-xl font-extrabold text-emerald-800">PRECAUTION LEVEL: LOW RISK</h3><p class="text-xs font-semibold text-emerald-700">No major red flags detected in DoFE registry or offer quiz.</p>`;
    }

    reasonsList.innerHTML = res.reasons.map(r => `<li>${escapeHtml(r)}</li>`).join('');
    actionAdvice.innerText = res.action;
}

async function submitWizardReport() {
    const comment = document.getElementById('wizReportComment').value.trim();
    const btn = document.getElementById('wizSubmitReportBtn');

    const payload = {
        agency_id: wizardState.selectedAgency.id,
        permission_no: wizardState.selectedAgency.permission_no || "UNREGISTERED",
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
            btn.className = "w-full bg-slate-900 text-emerald-400 font-bold py-2.5 rounded-lg text-xs";
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


// STANDALONE AGENCY SEARCH ENGINE (UNREGISTERED NAME SUPPORT)
const searchForm = document.getElementById('searchForm');
const searchInput = document.getElementById('searchInput');
const resultsContainer = document.getElementById('resultsContainer');

searchForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const query = searchInput.value.trim();
    if (!query) return;

    resultsContainer.innerHTML = `<div class="text-center py-6 text-slate-500 font-medium text-xs">Querying official DoFE database...</div>`;

    try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
        const data = await res.json();
        currentSearchResults = data.results || [];
        renderSearchResults(currentSearchResults, query, data.match_found);
    } catch (err) {
        resultsContainer.innerHTML = `<div class="p-4 bg-red-50 text-red-700 rounded-lg border border-red-200 text-xs">Failed to connect to backend server.</div>`;
    }
});

function renderSearchResults(results, query, matchFound) {
    if (!results || results.length === 0 || !matchFound) {
        resultsContainer.innerHTML = `
            <div class="bg-red-50 border-2 border-red-300 rounded-lg p-5 text-center space-y-2">
                <span class="inline-block px-3 py-1 rounded-full text-xs font-bold bg-red-100 text-red-800 border border-red-300 uppercase">
                    NOT FOUND IN DOFE REGISTRY
                </span>
                <h3 class="text-base font-bold text-red-900">No match found for "${escapeHtml(query)}" (similarity &lt; 80%)</h3>
                <p class="text-xs text-red-700 leading-relaxed max-w-lg mx-auto">
                    This agency name is not listed in Nepal's Department of Foreign Employment records. Operating without an official DoFE license is illegal. <strong>Do not pay any money to this entity.</strong>
                </p>
                <div class="pt-2">
                    <button onclick="startWizardWithUnregistered('${escapeHtml(query)}')" class="bg-red-800 hover:bg-red-900 text-white font-semibold text-xs px-4 py-2 rounded-lg shadow-sm">
                        Analyze This Offer in Guided Flow →
                    </button>
                </div>
            </div>
        `;
        return;
    }

    resultsContainer.innerHTML = results.map((item, index) => {
        const status = item.ui_status;
        const reports = item.community_reports;
        
        let badgeStyle = "bg-emerald-50 text-emerald-800 border-emerald-300";
        let cardBorder = "border-slate-200";
        
        if (status.color === 'yellow') {
            badgeStyle = "bg-amber-50 text-amber-800 border-amber-300";
        } else if (status.color === 'red') {
            badgeStyle = "bg-red-50 text-red-800 border-red-300 font-bold";
            cardBorder = "border-red-300";
        }

        let reportsPill = `<span class="text-slate-400 text-xs italic">No reports submitted yet</span>`;
        if (reports.total_count > 0) {
            let rColor = "bg-slate-100 text-slate-700 border-slate-300";
            if (reports.avg_risk_level === 'High') rColor = "bg-red-50 text-red-800 border-red-300 font-bold";
            if (reports.avg_risk_level === 'Medium') rColor = "bg-amber-50 text-amber-800 border-amber-300 font-bold";
            
            reportsPill = `<span class="inline-block px-2 py-0.5 rounded text-[11px] border ${rColor}">
                ${reports.total_count} Report(s) (Avg Risk: ${reports.avg_risk_level})
            </span>`;
        }

        return `
            <div class="bg-white rounded-lg border ${cardBorder} p-5 space-y-3">
                <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-slate-100">
                    <div>
                        <span class="text-xs font-semibold uppercase tracking-wider text-slate-400">License #${escapeHtml(item.permission_no || 'N/A')}</span>
                        <h2 class="text-base font-bold text-slate-900">${escapeHtml(item.name)}</h2>
                    </div>
                    <span class="inline-block px-2.5 py-1 rounded-full text-xs font-semibold border ${badgeStyle} self-start sm:self-center">
                        ${status.label}
                    </span>
                </div>

                <p class="text-xs text-slate-600 bg-slate-50 p-2.5 rounded border border-slate-200 leading-relaxed">${status.description}</p>

                <div class="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-slate-600">
                    <div><strong class="text-slate-800">District:</strong> ${escapeHtml(item.district || 'N/A')}</div>
                    <div><strong class="text-slate-800">Phone:</strong> ${escapeHtml(item.telephone || item.mobile || 'Not Listed')}</div>
                </div>

                <div class="border-t border-slate-100 pt-3">
                    <div class="flex items-center justify-between cursor-pointer" onclick="toggleReportsList(${index})">
                        <div class="flex items-center gap-2">
                            <span class="text-xs font-bold text-slate-800 uppercase">Community Safety Reports</span>
                            ${reportsPill}
                        </div>
                        <span class="text-xs text-blue-700 font-semibold" id="toggleReportText_${index}">View Details ▼</span>
                    </div>

                    <div id="reportsList_${index}" class="hidden mt-3 space-y-2 pt-1">
                        ${renderPastReports(reports)}
                    </div>
                </div>

                <div class="flex flex-wrap items-center justify-end gap-2 pt-2 border-t border-slate-100">
                    <button onclick="openShareModal(${index})" class="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg transition-colors">
                        Share Summary
                    </button>
                    <button onclick="openQuizModal(${index})" class="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-lg transition-colors">
                        Evaluate / Report Offer
                    </button>
                </div>
            </div>
        `;
    }).join('');
}

function startWizardWithUnregistered(name) {
    navTo('wizard');
    document.getElementById('wizAgencyInput').value = name;
    wizardState.selectedAgency = getWizardAgencyData();
}

function renderPastReports(reports) {
    if (!reports || reports.total_count === 0) {
        return `<div class="p-2.5 bg-slate-50 border border-slate-200 rounded text-xs text-slate-500 italic text-center">No reports submitted for this agency yet. (Zero reports does not guarantee safety).</div>`;
    }

    return reports.list.map(r => {
        let badge = "bg-emerald-50 text-emerald-800 border-emerald-200";
        if (r.risk_level === 'Medium') badge = "bg-amber-50 text-amber-800 border-amber-200";
        if (r.risk_level === 'High') badge = "bg-red-50 text-red-800 border-red-200 font-bold";

        const flaggedAnswers = (r.answers_json || []).filter(a => a.flagged);

        return `
            <div class="p-2.5 bg-slate-50 border border-slate-200 rounded text-xs space-y-1">
                <div class="flex justify-between items-center">
                    <span class="px-2 py-0.5 rounded text-[10px] border ${badge}">${r.risk_level.toUpperCase()} RISK (Score: ${r.risk_score})</span>
                    <span class="text-[10px] text-slate-400">${new Date(r.created_at).toLocaleDateString()}</span>
                </div>
                ${r.comment ? `<p class="text-slate-700 italic">"${escapeHtml(r.comment)}"</p>` : ''}
                ${flaggedAnswers.length > 0 ? `
                    <div class="text-[11px] text-slate-600 pt-0.5">
                        <strong class="text-slate-700">Flagged Warning Signs:</strong>
                        <ul class="list-disc pl-4 space-y-0.5 mt-0.5 text-slate-600">
                            ${flaggedAnswers.map(a => `<li>${escapeHtml(a.question)} (+${a.points} pts)</li>`).join('')}
                        </ul>
                    </div>
                ` : ''}
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

// MODAL HANDLERS
function openShareModal(index) {
    const item = currentSearchResults[index];
    const text = `VERIFICATION CHECK: Agency Shield Nepal\n\nAgency: ${item.name}\nLicense #: ${item.permission_no || 'N/A'}\nStatus: ${item.ui_status.label}\nDistrict: ${item.district || 'N/A'}\nPhone: ${item.telephone || item.mobile || 'N/A'}\n\nChecked via Agency Shield (Official DoFE Data). Verify before paying fees!`;
    
    document.getElementById('shareTextarea').value = text;
    document.getElementById('shareModal').classList.remove('hidden');
}

document.getElementById('copyShareBtn').onclick = () => {
    const textarea = document.getElementById('shareTextarea');
    textarea.select();
    navigator.clipboard.writeText(textarea.value);
    document.getElementById('copyShareBtn').innerText = "Copied to Clipboard!";
    setTimeout(() => { document.getElementById('copyShareBtn').innerText = "Copy Text to Clipboard"; }, 2000);
};

document.getElementById('closeShareModalBtn').onclick = () => document.getElementById('shareModal').classList.add('hidden');

// SMS Simulator
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

// Standalone Risk Modal
function openQuizModal(index) {
    activeQuizAgency = currentSearchResults[index];
    document.getElementById('quizAgencyName').innerText = `Reporting: ${activeQuizAgency.name}`;

    const form = document.getElementById('quizForm');
    form.innerHTML = QUESTIONS.map((q) => `
        <div class="p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs sm:text-sm">
            <p class="font-semibold text-slate-800 mb-2">${q.question}</p>
            <div class="flex gap-4">
                <label class="inline-flex items-center gap-1.5 cursor-pointer">
                    <input type="radio" name="${q.id}" value="yes" onchange="recalculateStandaloneQuiz()" class="text-slate-900 focus:ring-slate-900">
                    <span class="font-medium text-slate-800">Yes (+${q.points} pts)</span>
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