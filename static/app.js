/**
 * Agency Shield Nepal — Core Application Logic
 * English default with seamless Devanagari Nepali i18n switching.
 */

// i18n Dictionaries
const TRANSLATIONS = {
    en: {
        nav: { title: "Agency Shield Nepal", wizard: "Check Offer", search: "Verify Agency" },
        quiz: {
            title: "Offer Risk Questionnaire",
            subtitle: "9 research-backed questions to detect fraud and illegal recruitment patterns",
            options: { yes: "Yes", no: "No", unsure: "Unsure" },
            questions: {
                q1: { text: "Did you receive this job offer without applying — e.g. through an unsolicited Facebook/social media message or text?", reason: "⚠️ Receiving unsolicited job offers via social media is a primary tactic used by illegal brokers and scammers (+15 points)." },
                q2: { text: "Were you asked to pay any amount before you had a signed, written contract in hand?", reason: "⚠️ Requesting payment without a signed written contract is illegal under Nepal law and a major fraud indicator (+25 points)." },
                q3: { text: "Is the offered salary noticeably higher than typical pay for this type of job and destination country?", reason: "⚠️ Unreasonably high salary promises are often used as bait to trap jobseekers and collect illegal fees (+15 points)." },
                q4: { text: "Were you asked to pay through a personal bank account or personal mobile wallet, rather than the agency's official channel?", reason: "⚠️ Paying into personal bank accounts or mobile wallets leaves no legal paper trail against the manpower agency (+20 points)." },
                q5: { text: "Did they pressure you to decide or pay quickly (e.g. \"limited seats,\" \"offer expires today\")?", reason: "⚠️ Artificial urgency like 'limited seats' is a psychological pressure tactic to prevent due diligence (+15 points)." },
                q6: { text: "Did they ask you to hand over your passport permanently, or say they'd \"hold it until you return\"?", reason: "⚠️ Permanent passport confiscation is a severe danger sign associated with human trafficking and forced labor (+25 points)." },
                q7: { text: "Did they refuse to give you a copy of the contract to read at home before signing?", reason: "⚠️ Refusing to let you review contract terms at home strongly indicates deceptive clauses (+15 points)." },
                q8: { text: "Is the promised departure date unusually soon (e.g. within days/1-2 weeks) for this type of visa process?", reason: "⚠️ Promises of departure within 1-2 weeks usually signal illegal deployment on visit/tourist visas without DoFE approval (+10 points)." },
                q9: { text: "Does the agency lack a visitable physical office, operating only through phone/social media?", reason: "⚠️ Operating without a physical office allows brokers to vanish easily after taking payment (+10 points)." }
            },
            buckets: {
                low: { label: "Low Risk", badge: "Safe Signal", advice: "Standard precautions apply. Verify DoFE quota availability and Free Visa / Free Ticket provisions." },
                medium: { label: "Medium Risk", advice: "Caution required. Re-verify agency license status with DoFE and insist on stamped official bank receipts." },
                high: { label: "High Risk", badge: "Danger Signal", advice: "Do not pay any money. Multiple critical scam and trafficking red flags were detected. Report to DoFE or police." }
            }
        }
    },
    ne: {
        nav: { title: "एजेन्सी सिल्ड नेपाल", wizard: "अफर जाँच", search: "एजेन्सी खोज" },
        quiz: {
            title: "जोखिम मूल्याङ्कन प्रश्नोत्तरी",
            subtitle: "ठगी र गैरकानुनी वैदेशिक रोजगार अफर पहिचान गर्न ९ प्रश्नहरू",
            options: { yes: "हो", no: "होइन", unsure: "थाहा छैन / स्पष्ट छैन" },
            questions: {
                q1: { text: "के तपाईंले आवेदन नै नदिई यो रोजगारीको अफर पाउनुभएको हो—जस्तै फेसबुक, सामाजिक सञ्जाल वा म्यासेजमा अफर आएको हो?", reason: "⚠️ नमागीकन सामाजिक सञ्जाल वा म्यासेजमा आउने अफरहरू धेरैजसो गैरकानुनी एजेन्ट र ठगहरूले प्रयोग गर्ने तरिका हो (+१५ अंक)।" },
                q2: { text: "के हातमा हस्ताक्षर गरिएको लिखित सम्झौतापत्र (कन्ट्र्याक्ट) नपरीकनै पैसा मागिएको छ?", reason: "⚠️ लिखित सम्झौतापत्र बिना नै पैसा माग्नु गैरकानुनी हो र यो ठगीको ठूलो संकेत हो (+२५ अंक)।" },
                q3: { text: "के तोकिएको देश र कामको लागि तोकिएको तलब सामान्य दरभन्दा अस्वाभाविक रूपमा धेरै छ?", reason: "⚠️ बजारदर भन्दा अस्वाभाविक धेरै तलबको प्रलोभन देखाउनु मानिसहरूलाई फसाएर पैसा उठाउने बहाना हुन सक्छ (+१५ अंक)।" },
                q4: { text: "के एजेन्सीको आधिकारिक खाताको सट्टा कुनै व्यक्तिको व्यक्तिगत बैंक खाता वा मोबाइल वालेट (इ-सेवा/खल्ती आदि) मा पैसा बुझाउन भनिएको छ?", reason: "⚠️ व्यक्तिगत खाता वा मोबाइल वालेटमा पैसा पठाउँदा ठगी भएमा एजेन्सीविरुद्ध कानुनी प्रमाण पुग्दैन (+२० अंक)।" },
                q5: { text: "के उनीहरूले तपाईंलाई तुरुन्तै निर्णय गर्न वा पैसा बुझाउन दबाब दिएका छन् (जस्तै \"सिट सीमित छ\", \"आजै अन्तिम दिन हो\")?", reason: "⚠️ \"सिट सीमित छ\" जस्ता दबाब मानिसहरूलाई सोचविचार र बुझबुझारथ गर्न नदिन प्रयोग गरिने रणनीति हो (+१५ अंक)।" },
                q6: { text: "के उनीहरूले तपाईंको पासपोर्ट स्थायी रूपमा मागेका छन् वा \"फर्किने बेलासम्म हामी राख्छौँ\" भनेका छन्?", reason: "⚠️ पासपोर्ट नियन्त्रणमा लिनु गम्भीर खतराको घण्टी हो—यो मानव बेचबिखन र जबरजस्ती श्रम गराउनेसँग जोडिएको हुन्छ (+२५ अंक)।" },
                q7: { text: "के उनीहरूले दस्तखत गर्नुअघि सम्झौतापत्रको प्रतिलिपि घर लगेर शान्तसँग पढ्न दिन अस्वीकार गरे?", reason: "⚠️ सम्झौतापत्र घरमा लगेर पढ्न नदिनुले पछि सेवासुविधा वा सर्तहरूमा बदमासी गर्ने सम्भावना देखाउँछ (+१५ अंक)।" },
                q8: { text: "के भिसा प्रक्रियाको लागि अस्वाभाविक रूपमा चाँडै (केही दिन वा १-२ हप्ताभित्रै) उढाउँछु भनिएको छ?", reason: "⚠️ १-२ हप्तामै उढाउँछु भन्नुले श्रम स्वीकृति बिना भिजिट भिसामा पठाउन खोजेको संकेत गर्छ (+१० अंक)।" },
                q9: { text: "के उक्त एजेन्सीको जान मिल्ने आधिकारिक कार्यालय छैन र फोन वा सामाजिक सञ्जालबाट मात्र काम भइरहेको छ?", reason: "⚠️ भौतिक कार्यालय नभई फोन वा सामाजिक सञ्जालबाट मात्र चल्ने व्यक्तिहरू पैसा लिएर सहजै सम्पर्कविहीन हुने जोखिम हुन्छ (+१० अंक)।" }
            },
            buckets: {
                low: { label: "कम जोखिम (Low Risk)", badge: "सुरक्षित सङ्केत", advice: "साधारण सतर्कता अपनाउनुहोस्। आधिकारिक सरकारी कोटा र फ्री-भिसा फ्री-टिकट नियमहरू पुनः पुष्टि गर्नुहोस्।" },
                medium: { label: "मध्यम जोखिम (Medium Risk)", advice: "सावधानी अपनाउनुहोस्। DoFE दर्ता स्थिति प्रमाणित गर्नुहोस् र कुनै पनि भुक्तानीको आधिकारिक छापसहितको रसिद मात्र लिनुहोस्।" },
                high: { label: "उच्च जोखिम (High Risk)", badge: "गम्भीर खतरा", advice: "पैसा नबुझाउनुहोस्। यो अफरमा ठगी र गैरकानुनी ओसारपसारका गम्भीर संकेतहरू छन्। DoFE वा प्रहरीमा उजुरी गर्नुहोस्।" }
            }
        }
    }
};

// 9 Questions & Point Weights Configuration
const QUIZ_QUESTIONS = [
    { id: 'q1', pts: 15 },
    { id: 'q2', pts: 25 },
    { id: 'q3', pts: 15 },
    { id: 'q4', pts: 20 },
    { id: 'q5', pts: 15 },
    { id: 'q6', pts: 25 },
    { id: 'q7', pts: 15 },
    { id: 'q8', pts: 10 },
    { id: 'q9', pts: 10 }
];

// App Global State (Default: English)
let currentLanguage = 'en';
let currentWizardStep = 1;
let selectedWizardAgency = null;
let activeModalAgency = null;

// Mock Local DoFE Registry
const MOCK_REGISTRY = [
    { id: 101, name: 'Talent Finder Human Resources Pvt. Ltd.', license_no: 'DoFE-1420', district: 'Kathmandu', status: 'Active', phone: '+977-1-4455660' },
    { id: 102, name: 'Alpine Overseas Recruitment Pvt. Ltd.', license_no: 'DoFE-0891', district: 'Lalitpur', status: 'Active', phone: '+977-1-5522110' },
    { id: 103, name: 'Gurkha International Manpower Services', license_no: 'DoFE-0214', district: 'Pokhara', status: 'Active', phone: '+977-61-520110' },
    { id: 104, name: 'Prabhu Overseas Educational & Employment', license_no: 'DoFE-1102', district: 'Chitwan', status: 'Active', phone: '+977-56-511220' },
    { id: 105, name: 'Himalayan Job Placement Agency', license_no: 'DoFE-0544', district: 'Kathmandu', status: 'Suspended', phone: '+977-1-4223344' }
];

// Initialize App
document.addEventListener('DOMContentLoaded', () => {
    initAutocomplete();
    initSearchForm();
    initModalEvents();
    switchLanguage('en'); // Set English as default
});

/**
 * Switch Active Language (English <-> Nepali)
 */
function switchLanguage(lang) {
    if (!TRANSLATIONS[lang]) return;
    currentLanguage = lang;

    // Toggle Button Styles
    const btnEn = document.getElementById('langBtnEn');
    const btnNe = document.getElementById('langBtnNe');

    if (btnEn && btnNe) {
        if (lang === 'en') {
            btnEn.className = "px-2.5 py-1 text-xs font-bold rounded-md transition-all bg-slate-900 text-white shadow-sm";
            btnNe.className = "px-2.5 py-1 text-xs font-bold rounded-md transition-all text-slate-600 hover:text-slate-900";
        } else {
            btnNe.className = "px-2.5 py-1 text-xs font-bold rounded-md transition-all bg-slate-900 text-white shadow-sm";
            btnEn.className = "px-2.5 py-1 text-xs font-bold rounded-md transition-all text-slate-600 hover:text-slate-900";
        }
    }

    // Re-render Active Forms/Components
    renderQuizForm('wizQuizForm', currentLanguage);
    renderQuizForm('quizForm', currentLanguage);

    // Update Headings
    const quizTitle = document.getElementById('quizTitleHeader');
    const quizSub = document.getElementById('quizSubHeader');

    if (quizTitle) quizTitle.textContent = TRANSLATIONS[lang].quiz.title;
    if (quizSub) quizSub.textContent = TRANSLATIONS[lang].quiz.subtitle;

    // Refresh step 4 results if currently viewing results
    if (currentWizardStep === 4) {
        submitWizardAssessment();
    }
}

/**
 * SPA View Navigation
 */
function navTo(viewName) {
    const landingView = document.getElementById('landingView');
    const wizardView = document.getElementById('wizardView');
    const searchView = document.getElementById('searchView');

    if (!landingView || !wizardView || !searchView) return;

    landingView.classList.add('hidden');
    wizardView.classList.add('hidden');
    searchView.classList.add('hidden');

    if (viewName === 'wizard') {
        wizardView.classList.remove('hidden');
        goToWizardStep(1);
    } else if (viewName === 'search') {
        searchView.classList.remove('hidden');
    } else {
        landingView.classList.remove('hidden');
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

/**
 * Wizard Step Switcher
 */
function goToWizardStep(step) {
    currentWizardStep = step;

    const stepLabel = document.getElementById('wizardStepLabel');
    const stepTitle = document.getElementById('wizardStepTitle');
    const progressBar = document.getElementById('wizardProgressBar');

    const step1 = document.getElementById('wizardStep1');
    const step2 = document.getElementById('wizardStep2');
    const step3 = document.getElementById('wizardStep3');
    const step4 = document.getElementById('wizardStep4');

    if (stepLabel) stepLabel.textContent = `Step ${step} of 4`;
    if (progressBar) progressBar.style.width = `${(step / 4) * 100}%`;

    [step1, step2, step3, step4].forEach((s, idx) => {
        if (s) {
            if (idx + 1 === step) s.classList.remove('hidden');
            else s.classList.add('hidden');
        }
    });

    if (step === 1 && stepTitle) stepTitle.textContent = currentLanguage === 'ne' ? 'अफर विवरण' : 'Offer Details';
    if (step === 2) {
        if (stepTitle) stepTitle.textContent = currentLanguage === 'ne' ? 'दर्ता जाँच' : 'License Check';
        evaluateStep2AgencyStatus();
    }
    if (step === 3 && stepTitle) stepTitle.textContent = currentLanguage === 'ne' ? 'जोखिम प्रश्नोत्तरी' : 'Risk Questionnaire';
    if (step === 4 && stepTitle) stepTitle.textContent = currentLanguage === 'ne' ? 'मूल्याङ्कन नतिजा' : 'Assessment Results';

    window.scrollTo({ top: 120, behavior: 'smooth' });
}

/**
 * Autocomplete Input Handler
 */
function initAutocomplete() {
    const input = document.getElementById('wizAgencyInput');
    const listContainer = document.getElementById('wizAutocompleteList');

    if (!input || !listContainer) return;

    input.addEventListener('input', (e) => {
        const query = e.target.value.trim().toLowerCase();
        if (query.length < 2) {
            listContainer.classList.add('hidden');
            return;
        }

        const matches = MOCK_REGISTRY.filter(a => 
            a.name.toLowerCase().includes(query) || 
            a.license_no.toLowerCase().includes(query)
        );

        if (matches.length === 0) {
            listContainer.innerHTML = `
                <div class="p-3 text-xs text-slate-500 font-medium">
                    No official registry matches found. Proceed with <strong>"${e.target.value}"</strong>.
                </div>
            `;
        } else {
            listContainer.innerHTML = matches.map(a => `
                <div onclick="selectAgencyFromAutocomplete('${a.name}', '${a.license_no}', '${a.district}', '${a.status}')" class="p-3 hover:bg-slate-100 cursor-pointer border-b border-slate-100 last:border-0">
                    <div class="text-xs font-bold text-slate-900">${a.name}</div>
                    <div class="text-[11px] text-slate-500">${a.license_no} • ${a.district} • Status: ${a.status}</div>
                </div>
            `).join('');
        }
        listContainer.classList.remove('hidden');
    });

    document.addEventListener('click', (e) => {
        if (!input.contains(e.target) && !listContainer.contains(e.target)) {
            listContainer.classList.add('hidden');
        }
    });
}

function selectAgencyFromAutocomplete(name, lic, district, status) {
    selectedWizardAgency = { name, lic, district, status, matched: true };
    
    const input = document.getElementById('wizAgencyInput');
    const listContainer = document.getElementById('wizAutocompleteList');
    const badge = document.getElementById('wizSelectedAgencyBadge');
    const badgeName = document.getElementById('wizSelectedAgencyName');
    const badgeLic = document.getElementById('wizSelectedAgencyLic');

    if (input) input.value = name;
    if (listContainer) listContainer.classList.add('hidden');
    if (badgeName) badgeName.textContent = name;
    if (badgeLic) badgeLic.textContent = `${lic} (${district}) — ${status}`;
    if (badge) badge.classList.remove('hidden');
}

function clearSelectedAgency() {
    selectedWizardAgency = null;
    const input = document.getElementById('wizAgencyInput');
    const badge = document.getElementById('wizSelectedAgencyBadge');
    if (input) input.value = '';
    if (badge) badge.classList.add('hidden');
}

/**
 * Step 2: Render Agency DoFE Status
 */
function evaluateStep2AgencyStatus() {
    const card = document.getElementById('wizAgencyVerificationCard');
    const inputVal = document.getElementById('wizAgencyInput')?.value.trim() || '';

    if (!card) return;

    if (!selectedWizardAgency && inputVal) {
        const match = MOCK_REGISTRY.find(a => 
            a.name.toLowerCase() === inputVal.toLowerCase() || 
            a.license_no.toLowerCase() === inputVal.toLowerCase()
        );
        if (match) {
            selectedWizardAgency = { name: match.name, lic: match.license_no, district: match.district, status: match.status, matched: true };
        } else {
            selectedWizardAgency = { name: inputVal, lic: 'UNLICENSED / NOT FOUND', district: 'N/A', status: 'Unregistered', matched: false };
        }
    }

    if (!selectedWizardAgency) {
        selectedWizardAgency = { name: 'Unspecified Agency', lic: 'UNLICENSED / NOT FOUND', district: 'N/A', status: 'Unregistered', matched: false };
    }

    if (selectedWizardAgency.matched && selectedWizardAgency.status === 'Active') {
        card.innerHTML = `
            <div class="p-5 rounded-xl bg-emerald-50 border border-emerald-200 space-y-2">
                <div class="flex items-center gap-2 font-bold text-emerald-900 text-sm sm:text-base">
                    <svg class="w-5 h-5 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path></svg>
                    ${currentLanguage === 'ne' ? 'सरकारी दर्ता प्रमाणित (DoFE Registered)' : 'Official DoFE Registration Verified'}
                </div>
                <p class="text-xs sm:text-sm text-emerald-800 leading-relaxed">
                    <strong>${selectedWizardAgency.name}</strong> holds an active license (<strong>${selectedWizardAgency.lic}</strong>) registered in ${selectedWizardAgency.district} district.
                </p>
            </div>
        `;
    } else {
        card.innerHTML = `
            <div class="p-5 rounded-xl bg-red-50 border border-red-200 space-y-2">
                <div class="flex items-center gap-2 font-bold text-red-900 text-sm sm:text-base">
                    <svg class="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path></svg>
                    ${currentLanguage === 'ne' ? 'DoFE दर्तामा फेला परेन (+३० जोखिम अंक)' : 'NOT FOUND IN DOFE REGISTRY (+30 Risk Points Added)'}
                </div>
                <p class="text-xs sm:text-sm text-red-800 leading-relaxed">
                    <strong>"${selectedWizardAgency.name}"</strong> scored below the 80% similarity cut-off against official DoFE active license lists. Operating recruitment without a valid license is illegal under Nepal Foreign Employment Act.
                </p>
            </div>
        `;
    }
}

/**
 * Render Risk Questionnaire (Points Hidden on Input Screen)
 */
function renderQuizForm(containerId, lang = currentLanguage) {
    const container = document.getElementById(containerId);
    if (!container) return;

    const t = TRANSLATIONS[lang].quiz;

    container.innerHTML = QUIZ_QUESTIONS.map((q, idx) => `
        <div class="p-4 bg-slate-50 rounded-lg border border-slate-200 space-y-2">
            <label class="block text-xs sm:text-sm font-semibold text-slate-900 leading-snug">
                ${idx + 1}. ${t.questions[q.id].text}
            </label>
            <div class="flex items-center gap-6 pt-1">
                <label class="inline-flex items-center gap-1.5 text-xs font-medium text-slate-700 cursor-pointer">
                    <input type="radio" name="${q.id}" value="yes" class="text-slate-900 focus:ring-slate-900">
                    <span>${t.options.yes}</span>
                </label>
                <label class="inline-flex items-center gap-1.5 text-xs font-medium text-slate-700 cursor-pointer">
                    <input type="radio" name="${q.id}" value="no" checked class="text-slate-900 focus:ring-slate-900">
                    <span>${t.options.no}</span>
                </label>
                <label class="inline-flex items-center gap-1.5 text-xs font-medium text-slate-700 cursor-pointer">
                    <input type="radio" name="${q.id}" value="unsure" class="text-slate-900 focus:ring-slate-900">
                    <span>${t.options.unsure}</span>
                </label>
            </div>
        </div>
    `).join('');
}

/**
 * Recalibrated Risk Buckets: Low (0-25), Medium (30-60), High (65+)
 */
function calculateRiskLevel(score) {
    if (score <= 25) {
        return {
            level: 'low',
            badgeClass: 'bg-emerald-100 text-emerald-800 border-emerald-300',
            containerClass: 'bg-emerald-50 border-emerald-200'
        };
    } else if (score <= 60) {
        return {
            level: 'medium',
            badgeClass: 'bg-amber-100 text-amber-800 border-amber-300',
            containerClass: 'bg-amber-50 border-amber-200'
        };
    } else {
        return {
            level: 'high',
            badgeClass: 'bg-red-100 text-red-800 border-red-300',
            containerClass: 'bg-red-50 border-red-200'
        };
    }
}

/**
 * Process Submission & Build Explanations
 */
function processQuizSubmission(formId, lang = currentLanguage) {
    const form = document.getElementById(formId);
    if (!form) return null;

    const formData = new FormData(form);
    const t = TRANSLATIONS[lang].quiz;

    let score = 0;
    const flaggedReasons = [];

    if (selectedWizardAgency && !selectedWizardAgency.matched) {
        score += 30;
        flaggedReasons.push(lang === 'ne' 
            ? '⚠️ म्यानपावर वा एजेन्ट वैदेशिक रोजगार विभाग (DoFE) मा दर्ता नभएको (+३० अंक)।'
            : '⚠️ Agency or agent is not found in DoFE official active registry (+30 points).'
        );
    }

    QUIZ_QUESTIONS.forEach(q => {
        const val = formData.get(q.id);
        if (val === 'yes') {
            score += q.pts;
            flaggedReasons.push(t.questions[q.id].reason);
        } else if (val === 'unsure') {
            const partialPts = Math.round(q.pts / 2);
            score += partialPts;
            flaggedReasons.push(`${t.questions[q.id].reason} (${lang === 'ne' ? 'आंशिक सङ्केत' : 'Unsure response'})`);
        }
    });

    const assessment = calculateRiskLevel(score);
    const bucketInfo = t.buckets[assessment.level];

    return {
        score,
        maxScore: 150,
        level: assessment.level,
        bucketInfo,
        badgeClass: assessment.badgeClass,
        containerClass: assessment.containerClass,
        flaggedReasons
    };
}

/**
 * Display Results (Step 4)
 */
function submitWizardAssessment() {
    const result = processQuizSubmission('wizQuizForm');
    if (!result) return;

    goToWizardStep(4);

    const banner = document.getElementById('wizPrecautionBanner');
    const reasonsList = document.getElementById('wizReasonsList');
    const actionAdvice = document.getElementById('wizActionAdvice');

    if (banner) {
        banner.className = `p-6 rounded-xl border-2 text-center space-y-2 ${result.containerClass}`;
        banner.innerHTML = `
            <span class="inline-block text-xs font-extrabold uppercase px-3.5 py-1 rounded-full border ${result.badgeClass}">
                ${result.bucketInfo.label} — ${result.score} / 150 Points
            </span>
            <h3 class="text-xl sm:text-2xl font-bold text-slate-900">${result.bucketInfo.label}</h3>
        `;
    }

    if (reasonsList) {
        if (result.flaggedReasons.length > 0) {
            reasonsList.innerHTML = result.flaggedReasons.map(r => `
                <li class="text-xs sm:text-sm text-slate-800 font-medium leading-relaxed">${r}</li>
            `).join('');
        } else {
            reasonsList.innerHTML = `
                <li class="text-xs sm:text-sm text-emerald-800 font-medium">
                    ${currentLanguage === 'ne' ? 'कुनै पनि प्रमुख जोखिम सङ्केतहरू भेटिएनन्।' : 'No major scam red flags were detected on the risk questionnaire.'}
                </li>
            `;
        }
    }

    if (actionAdvice) {
        actionAdvice.textContent = result.bucketInfo.advice;
    }
}

function submitWizardReport() {
    const btn = document.getElementById('wizSubmitReportBtn');
    if (btn) {
        btn.textContent = currentLanguage === 'ne' ? '✓ सुरक्षा रिपोर्ट बेनामी रूपमा पेस गरियो' : '✓ Safety Report Submitted Anonymously';
        btn.classList.replace('bg-slate-900', 'bg-emerald-700');
        btn.disabled = true;
    }
}

/**
 * Standalone Search Engine
 */
function initSearchForm() {
    const form = document.getElementById('searchForm');
    const container = document.getElementById('resultsContainer');

    if (!form || !container) return;

    form.addEventListener('submit', (e) => {
        e.preventDefault();
        const query = document.getElementById('searchInput').value.trim().toLowerCase();
        if (!query) return;

        const matches = MOCK_REGISTRY.filter(a => 
            a.name.toLowerCase().includes(query) || 
            a.license_no.toLowerCase().includes(query)
        );

        if (matches.length > 0) {
            container.innerHTML = matches.map(a => `
                <div class="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div>
                        <div class="flex items-center gap-2">
                            <h3 class="font-bold text-slate-900 text-base">${a.name}</h3>
                            <span class="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                                ${a.status}
                            </span>
                        </div>
                        <p class="text-xs text-slate-500 mt-1">License: <strong>${a.license_no}</strong> • District: ${a.district} • Phone: ${a.phone}</p>
                    </div>
                    <div class="flex gap-2 w-full sm:w-auto">
                        <button onclick="openModalQuizForAgency('${a.name}')" class="flex-1 sm:flex-none px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold">
                            Run Risk Check
                        </button>
                        <button onclick="openShareModal('${a.name}', '${a.license_no}', '${a.status}')" class="px-3 py-2 border border-slate-300 rounded-lg text-xs font-semibold text-slate-700 hover:bg-slate-50">
                            Forward
                        </button>
                    </div>
                </div>
            `).join('');
        } else {
            container.innerHTML = `
                <div class="bg-red-50 p-6 rounded-xl border border-red-200 text-center space-y-3">
                    <h3 class="text-base font-bold text-red-900">NOT FOUND IN DOFE REGISTRY</h3>
                    <p class="text-xs sm:text-sm text-red-800 max-w-lg mx-auto leading-relaxed">
                        No agency matching <strong>"${query}"</strong> was found in official records.
                    </p>
                    <button onclick="navTo('wizard')" class="inline-block px-5 py-2.5 bg-red-900 text-white font-semibold text-xs rounded-lg hover:bg-red-800">
                        Launch Full Guided Assessment
                    </button>
                </div>
            `;
        }
    });
}

/**
 * Modal Manager
 */
function initModalEvents() {
    const quizModal = document.getElementById('quizModal');
    const closeQuizBtn = document.getElementById('closeQuizModalBtn');
    const cancelQuizBtn = document.getElementById('cancelQuizBtn');
    const submitQuizBtn = document.getElementById('submitQuizBtn');

    if (closeQuizBtn) closeQuizBtn.addEventListener('click', () => quizModal.classList.add('hidden'));
    if (cancelQuizBtn) cancelQuizBtn.addEventListener('click', () => quizModal.classList.add('hidden'));

    if (submitQuizBtn) {
        submitQuizBtn.addEventListener('click', () => {
            const res = processQuizSubmission('quizForm');
            if (res) {
                alert(`Assessment Complete: ${res.bucketInfo.label} (${res.score} / 150 Points)`);
                quizModal.classList.add('hidden');
            }
        });
    }

    const shareModal = document.getElementById('shareModal');
    const closeShareBtn = document.getElementById('closeShareModalBtn');
    const copyShareBtn = document.getElementById('copyShareBtn');

    if (closeShareBtn) closeShareBtn.addEventListener('click', () => shareModal.classList.add('hidden'));
    if (copyShareBtn) {
        copyShareBtn.addEventListener('click', () => {
            const textarea = document.getElementById('shareTextarea');
            if (textarea) {
                textarea.select();
                navigator.clipboard.writeText(textarea.value);
                copyShareBtn.textContent = '✓ Copied to Clipboard!';
                setTimeout(() => copyShareBtn.textContent = 'Copy Text to Clipboard', 2000);
            }
        });
    }

    const smsModal = document.getElementById('smsModal');
    const openSmsBtn = document.getElementById('openSmsModalBtn');
    const closeSmsBtn = document.getElementById('closeSmsModalBtn');
    const smsForm = document.getElementById('smsForm');

    if (openSmsBtn) openSmsBtn.addEventListener('click', () => smsModal.classList.remove('hidden'));
    if (closeSmsBtn) closeSmsBtn.addEventListener('click', () => smsModal.classList.add('hidden'));

    if (smsForm) {
        smsForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const input = document.getElementById('smsInput').value.trim();
            const outBox = document.getElementById('smsDisplayOutgoing');
            const inBox = document.getElementById('smsDisplayIncoming');

            if (!input) return;

            outBox.textContent = `SENT: ${input}`;
            outBox.classList.remove('hidden');

            const match = MOCK_REGISTRY.find(a => a.name.toLowerCase().includes(input.toLowerCase()));
            if (match) {
                inBox.textContent = `REPLY: [DOFE VERIFIED] ${match.name} (Lic: ${match.license_no}). Status: ${match.status}. Dist: ${match.district}.`;
            } else {
                inBox.textContent = `REPLY: [WARNING] "${input}" NOT FOUND in DoFE active registry. High scam risk. Do not pay cash without receipt.`;
            }
            inBox.classList.remove('hidden');
        });
    }
}

function openModalQuizForAgency(agencyName) {
    activeModalAgency = agencyName;
    const title = document.getElementById('quizAgencyName');
    const quizModal = document.getElementById('quizModal');
    if (title) title.textContent = `Risk Check: ${agencyName}`;
    renderQuizForm('quizForm', currentLanguage);
    if (quizModal) quizModal.classList.remove('hidden');
}

function openShareModal(name, lic, status) {
    const modal = document.getElementById('shareModal');
    const textarea = document.getElementById('shareTextarea');
    if (textarea) {
        textarea.value = `Agency Shield Nepal Verification Record:\n\nAgency: ${name}\nLicense: ${lic}\nDoFE Status: ${status}\n\nVerified via Agency Shield Nepal Public Safety Platform.`;
    }
    if (modal) modal.classList.remove('hidden');
}