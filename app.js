/**
 * MATH 202 PORTAL — CLIENT ENGINE
 * Handles SPA navigation, theme switching, module tutorials,
 * interactive study mode, CBT exam simulator, palette, and AI teacher prompt.
 */

(function () {
  'use strict';

  // --- Global Application State ---
  const state = {
    currentView: 'home-view',
    quizMode: 'study', // 'study' or 'exam'
    activeModuleFilter: 'all',
    questions: [],
    filteredQuestions: [],
    currentIndex: 0,
    userAnswers: {}, // questionId -> selectedOption
    flaggedQuestions: new Set(),
    examActive: false,
    examTimerSeconds: 0,
    examTimerInterval: null,
    examStartTime: 0,
    examConfig: {
      questionCount: 50,
      timeMinutes: 50,
      moduleId: 'all'
    },
    theme: 'light'
  };

  // --- DOM Elements Cache ---
  const dom = {
    themeToggle: document.getElementById('theme-toggle'),
    mobileMenuBtn: document.getElementById('mobile-menu-btn'),
    mainNav: document.getElementById('main-nav'),
    navBrand: document.getElementById('nav-brand'),
    views: document.querySelectorAll('.app-view'),
    navButtons: document.querySelectorAll('.nav-btn'),

    // Home View
    homeStartStudy: document.getElementById('home-start-study'),
    homeStartExam: document.getElementById('home-start-exam'),
    homeBrowseModules: document.getElementById('home-browse-modules'),
    cardStudyMode: document.getElementById('card-study-mode'),
    cardExamMode: document.getElementById('card-exam-mode'),
    cardCourseModules: document.getElementById('card-course-modules'),
    cardAiTeacher: document.getElementById('card-ai-teacher'),

    // Modules View
    modulesContainer: document.getElementById('modules-container'),

    // Tutorial View
    tutorialBackBtn: document.getElementById('tutorial-back-btn'),
    tutModuleTag: document.getElementById('tut-module-tag'),
    tutReadingTime: document.getElementById('tut-reading-time'),
    tutTakeQuizBtn: document.getElementById('tut-take-quiz-btn'),
    tutTitle: document.getElementById('tut-title'),
    tutSubtitle: document.getElementById('tut-subtitle'),
    tutBody: document.getElementById('tut-body'),
    tutQCount: document.getElementById('tut-q-count'),
    tutBottomQuizBtn: document.getElementById('tut-bottom-quiz-btn'),

    // Quiz View
    quizModeBadge: document.getElementById('quiz-mode-badge'),
    moduleSelect: document.getElementById('module-select'),
    qCounter: document.getElementById('q-counter'),
    progressBarFill: document.getElementById('progress-bar-fill'),
    examTimer: document.getElementById('exam-timer'),
    timerDigits: document.getElementById('timer-digits'),
    pillStudy: document.getElementById('pill-study'),
    pillExam: document.getElementById('pill-exam'),
    btnSubmitExam: document.getElementById('btn-submit-exam'),
    btnFlagQuestion: document.getElementById('btn-flag-question'),
    btnToggleExplainer: document.getElementById('btn-toggle-explainer'),
    qModuleBadge: document.getElementById('q-module-badge'),
    qSourceBadge: document.getElementById('q-source-badge'),
    questionText: document.getElementById('question-text'),
    optionsContainer: document.getElementById('options-container'),
    feedbackBanner: document.getElementById('feedback-banner'),
    feedbackIcon: document.getElementById('feedback-icon'),
    feedbackTitle: document.getElementById('feedback-title'),
    feedbackMessage: document.getElementById('feedback-message'),
    explainerDrawer: document.getElementById('explainer-drawer'),
    explainerBody: document.getElementById('explainer-body'),
    btnCloseExplainer: document.getElementById('btn-close-explainer'),
    btnPrevQ: document.getElementById('btn-prev-q'),
    btnNextQ: document.getElementById('btn-next-q'),
    currentQNum: document.getElementById('current-q-num'),
    totalQCount: document.getElementById('total-q-count'),
    paletteGrid: document.getElementById('palette-grid'),
    paletteSubmitBtn: document.getElementById('palette-submit-btn'),

    // Modals
    examConfigModal: document.getElementById('exam-config-modal'),
    examConfigClose: document.getElementById('exam-config-close'),
    examCancelBtn: document.getElementById('exam-cancel-btn'),
    examStartConfirmedBtn: document.getElementById('exam-start-confirmed-btn'),
    examQCountSelect: document.getElementById('exam-q-count-select'),
    examTimeSelect: document.getElementById('exam-time-select'),
    examModuleSelect: document.getElementById('exam-module-select'),

    examResultsModal: document.getElementById('exam-results-modal'),
    examResultsClose: document.getElementById('exam-results-close'),
    resScorePercent: document.getElementById('res-score-percent'),
    resGradeTitle: document.getElementById('res-grade-title'),
    resCorrectCount: document.getElementById('res-correct-count'),
    resTotalCount: document.getElementById('res-total-count'),
    resTimeTaken: document.getElementById('res-time-taken'),
    modulePerformanceBars: document.getElementById('module-performance-bars'),
    resRetakeBtn: document.getElementById('res-retake-btn'),
    resReviewAllBtn: document.getElementById('res-review-all-btn'),

    // AI Teacher View
    btnCopyPrompt: document.getElementById('btn-copy-prompt'),
    promptPreviewText: document.getElementById('prompt-preview-text'),
    toastContainer: document.getElementById('toast-container')
  };

  // --- Initialization ---
  function init() {
    loadQuestions();
    initTheme();
    bindEvents();
    renderModulesList();
    renderAITeacherPrompt();
    applyModuleFilter('all');
  }

  // --- Load Questions from math202_questions.js ---
  function loadQuestions() {
    if (window.MATH202_QUESTIONS && Array.isArray(window.MATH202_QUESTIONS)) {
      state.questions = window.MATH202_QUESTIONS;
      console.log(`Successfully loaded ${state.questions.length} MATH 202 questions.`);
    } else {
      console.error('MATH202_QUESTIONS not found on window object.');
    }
  }

  // --- Theme Management ---
  function initTheme() {
    const savedTheme = localStorage.getItem('math202_theme') || 'light';
    setTheme(savedTheme);
  }

  function setTheme(theme) {
    state.theme = theme;
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('math202_theme', theme);
  }

  function toggleTheme() {
    const nextTheme = state.theme === 'light' ? 'dark' : 'light';
    setTheme(nextTheme);
  }

  // --- SPA View Navigation ---
  function switchView(viewId) {
    state.currentView = viewId;
    dom.views.forEach(v => v.classList.remove('active'));
    const target = document.getElementById(viewId);
    if (target) {
      target.classList.add('active');
    }

    // Update nav active states
    dom.navButtons.forEach(btn => {
      btn.classList.remove('active');
      if (btn.getAttribute('data-view') === viewId) {
        // Match mode if quiz
        if (viewId === 'quiz-view') {
          const btnMode = btn.getAttribute('data-mode');
          if (btnMode === state.quizMode) {
            btn.classList.add('active');
          }
        } else {
          btn.classList.add('active');
        }
      }
    });

    // Close mobile menu if open
    dom.mainNav.classList.remove('open');

    // Scroll to top
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  // --- Event Bindings ---
  function bindEvents() {
    // Theme toggle
    dom.themeToggle.addEventListener('click', toggleTheme);

    // Mobile menu toggle
    dom.mobileMenuBtn.addEventListener('click', () => {
      dom.mainNav.classList.toggle('open');
    });

    // Brand click -> Home
    dom.navBrand.addEventListener('click', () => switchView('home-view'));

    // Navigation buttons
    dom.navButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        const viewId = btn.getAttribute('data-view');
        const mode = btn.getAttribute('data-mode');
        if (viewId === 'quiz-view' && mode) {
          setQuizMode(mode);
        }
        switchView(viewId);
      });
    });

    // Home View CTA buttons
    dom.homeStartStudy.addEventListener('click', () => {
      setQuizMode('study');
      switchView('quiz-view');
    });
    dom.homeStartExam.addEventListener('click', () => {
      setQuizMode('exam');
      switchView('quiz-view');
    });
    dom.homeBrowseModules.addEventListener('click', () => switchView('modules-view'));

    dom.cardStudyMode.addEventListener('click', () => {
      setQuizMode('study');
      switchView('quiz-view');
    });
    dom.cardExamMode.addEventListener('click', () => {
      setQuizMode('exam');
      switchView('quiz-view');
    });
    dom.cardCourseModules.addEventListener('click', () => switchView('modules-view'));
    dom.cardAiTeacher.addEventListener('click', () => switchView('ai-teacher-view'));

    // Tutorial View navigation
    dom.tutorialBackBtn.addEventListener('click', () => switchView('modules-view'));
    dom.tutTakeQuizBtn.addEventListener('click', () => {
      const modId = dom.tutTakeQuizBtn.getAttribute('data-module-id');
      launchQuizForModule(modId);
    });
    dom.tutBottomQuizBtn.addEventListener('click', () => {
      const modId = dom.tutTakeQuizBtn.getAttribute('data-module-id');
      launchQuizForModule(modId);
    });

    // Quiz Controls Bar
    dom.pillStudy.addEventListener('click', () => setQuizMode('study'));
    dom.pillExam.addEventListener('click', () => setQuizMode('exam'));

    dom.moduleSelect.addEventListener('change', (e) => {
      applyModuleFilter(e.target.value);
    });

    // Question Navigation & Controls
    dom.btnPrevQ.addEventListener('click', () => navigateQuestion(-1));
    dom.btnNextQ.addEventListener('click', () => navigateQuestion(1));
    dom.btnFlagQuestion.addEventListener('click', toggleFlagCurrentQuestion);
    dom.btnToggleExplainer.addEventListener('click', toggleExplainerDrawer);
    dom.btnCloseExplainer.addEventListener('click', () => {
      dom.explainerDrawer.style.display = 'none';
    });

    // Exam Submission
    dom.btnSubmitExam.addEventListener('click', promptSubmitExam);
    dom.paletteSubmitBtn.addEventListener('click', promptSubmitExam);

    // Exam Config Modal
    dom.examConfigClose.addEventListener('click', () => {
      dom.examConfigModal.style.display = 'none';
    });
    dom.examCancelBtn.addEventListener('click', () => {
      dom.examConfigModal.style.display = 'none';
    });
    dom.examStartConfirmedBtn.addEventListener('click', startConfiguredExam);

    // Exam Results Modal
    dom.examResultsClose.addEventListener('click', () => {
      dom.examResultsModal.style.display = 'none';
    });
    dom.resRetakeBtn.addEventListener('click', () => {
      dom.examResultsModal.style.display = 'none';
      openExamConfigModal();
    });
    dom.resReviewAllBtn.addEventListener('click', () => {
      dom.examResultsModal.style.display = 'none';
      setQuizMode('study'); // Switch to study review mode
      renderQuestion(0);
      showToast('Switched to Review Mode. All answers and explainers are unlocked.');
    });

    // AI Teacher Copy Prompt
    dom.btnCopyPrompt.addEventListener('click', copyAIPromptToClipboard);
  }

  // --- Render Course Modules Hub ---
  function renderModulesList() {
    if (!window.MATH202_TUTORIALS) return;

    dom.modulesContainer.innerHTML = '';
    const tuts = window.MATH202_TUTORIALS;

    for (let id = 1; id <= 6; id++) {
      const mod = tuts[id];
      if (!mod) continue;

      const card = document.createElement('div');
      card.className = 'module-card';
      card.innerHTML = `
        <div class="module-card-top">
          <span class="module-id-badge">Module ${mod.module_id}</span>
          <span class="module-meta-info">${mod.reading_time} &bull; ${mod.question_count} Qs</span>
        </div>
        <h3 class="module-title">${mod.title.replace(/^Module \d+:\s*/, '')}</h3>
        <p class="module-desc">${mod.summary}</p>
        <div class="module-card-actions">
          <button class="btn btn-outline btn-sm btn-read-tut" data-module-id="${mod.module_id}">
            Read Tutorial
          </button>
          <button class="btn btn-primary btn-sm btn-take-quiz" data-module-id="${mod.module_id}">
            Take Quiz (${mod.question_count} Qs)
          </button>
        </div>
      `;

      card.querySelector('.btn-read-tut').addEventListener('click', () => openTutorial(mod.module_id));
      card.querySelector('.btn-take-quiz').addEventListener('click', () => launchQuizForModule(mod.module_id));

      dom.modulesContainer.appendChild(card);
    }
  }

  // --- Open Tutorial Reader ---
  function openTutorial(moduleId) {
    const mod = window.MATH202_TUTORIALS && window.MATH202_TUTORIALS[moduleId];
    if (!mod) return;

    dom.tutModuleTag.textContent = `Module ${mod.module_id}`;
    dom.tutReadingTime.textContent = mod.reading_time;
    dom.tutTitle.textContent = mod.title;
    dom.tutSubtitle.textContent = mod.subtitle;
    dom.tutQCount.textContent = mod.question_count;
    dom.tutTakeQuizBtn.setAttribute('data-module-id', mod.module_id);
    dom.tutBottomQuizBtn.setAttribute('data-module-id', mod.module_id);
    dom.tutBody.innerHTML = mod.content_html;

    switchView('tutorial-view');
  }

  // --- Launch Quiz Filtered to Specific Module ---
  function launchQuizForModule(moduleId) {
    dom.moduleSelect.value = String(moduleId);
    applyModuleFilter(String(moduleId));
    setQuizMode('study');
    switchView('quiz-view');
    showToast(`Loaded Module ${moduleId} practice questions.`);
  }

  // --- Filter Questions by Module ---
  function applyModuleFilter(moduleId) {
    state.activeModuleFilter = moduleId;
    if (moduleId === 'all') {
      state.filteredQuestions = [...state.questions];
    } else {
      const mId = parseInt(moduleId, 10);
      state.filteredQuestions = state.questions.filter(q => q.module_id === mId);
    }

    state.currentIndex = 0;
    renderPaletteGrid();
    renderQuestion(0);
  }

  // --- Switch Quiz Mode (Study vs Exam) ---
  function setQuizMode(mode) {
    state.quizMode = mode;
    if (mode === 'study') {
      dom.pillStudy.classList.add('active');
      dom.pillExam.classList.remove('active');
      dom.quizModeBadge.textContent = 'Study Mode';
      dom.examTimer.style.display = 'none';
      dom.btnSubmitExam.style.display = 'none';
      stopExamTimer();
      renderQuestion(state.currentIndex);
    } else {
      dom.pillExam.classList.add('active');
      dom.pillStudy.classList.remove('active');
      dom.quizModeBadge.textContent = 'CBT Exam Mode';
      dom.examTimer.style.display = 'flex';
      dom.btnSubmitExam.style.display = 'inline-flex';
      openExamConfigModal();
    }
  }

  // --- Exam Configuration Modal ---
  function openExamConfigModal() {
    dom.examConfigModal.style.display = 'flex';
    dom.examModuleSelect.value = state.activeModuleFilter;
  }

  function startConfiguredExam() {
    const qCount = parseInt(dom.examQCountSelect.value, 10);
    const timeMins = parseInt(dom.examTimeSelect.value, 10);
    const modFilter = dom.examModuleSelect.value;

    state.examConfig.questionCount = qCount;
    state.examConfig.timeMinutes = timeMins;
    state.examConfig.moduleId = modFilter;

    // Filter questions
    let candidatePool = [];
    if (modFilter === 'all') {
      candidatePool = [...state.questions];
    } else {
      const mId = parseInt(modFilter, 10);
      candidatePool = state.questions.filter(q => q.module_id === mId);
    }

    // Shuffle pool
    candidatePool = shuffleArray(candidatePool);

    // Slice to selected count
    state.filteredQuestions = candidatePool.slice(0, Math.min(qCount, candidatePool.length));
    state.currentIndex = 0;
    state.userAnswers = {};
    state.flaggedQuestions.clear();
    state.examActive = true;
    state.examStartTime = Date.now();

    dom.examConfigModal.style.display = 'none';
    dom.moduleSelect.value = modFilter;

    // Start timer
    if (timeMins > 0) {
      state.examTimerSeconds = timeMins * 60;
      updateTimerDisplay();
      startExamTimer();
    } else {
      dom.timerDigits.textContent = 'Untimed';
    }

    renderPaletteGrid();
    renderQuestion(0);
    showToast(`Exam Started: ${state.filteredQuestions.length} Questions | ${timeMins > 0 ? timeMins + ' Mins' : 'Untimed'}`);
  }

  function startExamTimer() {
    stopExamTimer();
    state.examTimerInterval = setInterval(() => {
      state.examTimerSeconds--;
      updateTimerDisplay();

      if (state.examTimerSeconds <= 300) {
        dom.timerDigits.classList.add('warning');
      }

      if (state.examTimerSeconds <= 0) {
        stopExamTimer();
        alert('Time is up! Your exam will now be automatically submitted.');
        submitExam();
      }
    }, 1000);
  }

  function stopExamTimer() {
    if (state.examTimerInterval) {
      clearInterval(state.examTimerInterval);
      state.examTimerInterval = null;
    }
    dom.timerDigits.classList.remove('warning');
  }

  function updateTimerDisplay() {
    const mins = Math.floor(state.examTimerSeconds / 60);
    const secs = state.examTimerSeconds % 60;
    dom.timerDigits.textContent = `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  }

  // --- Render Question ---
  function renderQuestion(index) {
    if (!state.filteredQuestions || state.filteredQuestions.length === 0) {
      dom.questionText.textContent = 'No questions found for the selected module.';
      dom.optionsContainer.innerHTML = '';
      return;
    }

    if (index < 0) index = 0;
    if (index >= state.filteredQuestions.length) index = state.filteredQuestions.length - 1;
    state.currentIndex = index;

    const q = state.filteredQuestions[index];
    const qTotal = state.filteredQuestions.length;

    // Update Header and Counter
    dom.qCounter.textContent = `Question ${index + 1} of ${qTotal}`;
    dom.currentQNum.textContent = index + 1;
    dom.totalQCount.textContent = qTotal;
    dom.progressBarFill.style.width = `${((index + 1) / qTotal) * 100}%`;

    dom.qModuleBadge.textContent = q.module_title || `Module ${q.module_id}`;
    dom.qSourceBadge.textContent = q.source || 'FUTO MATH 202';
    dom.questionText.textContent = q.question;

    // Flag status
    if (state.flaggedQuestions.has(q.id)) {
      dom.btnFlagQuestion.classList.add('flagged');
      dom.btnFlagQuestion.innerHTML = '<span class="flag-icon">⚑</span> Flagged';
    } else {
      dom.btnFlagQuestion.classList.remove('flagged');
      dom.btnFlagQuestion.innerHTML = '<span class="flag-icon">⚑</span> Flag';
    }

    // Explainer Content
    dom.explainerBody.innerHTML = parseMarkdownToHtml(q.explanation);

    // Options Rendering
    renderOptions(q);

    // Navigation buttons state
    dom.btnPrevQ.disabled = (index === 0);
    if (index === qTotal - 1) {
      dom.btnNextQ.textContent = state.quizMode === 'exam' ? 'Review & Submit' : 'Finish';
    } else {
      dom.btnNextQ.textContent = 'Next →';
    }

    // Hide drawer and feedback initially for unviewed questions
    dom.explainerDrawer.style.display = 'none';

    // Highlight palette grid item
    updatePaletteActiveChip(index);
  }

  // --- Render Options ---
  function renderOptions(q) {
    dom.optionsContainer.innerHTML = '';
    const selected = state.userAnswers[q.id];
    const isAnswered = selected !== undefined;

    // Study mode feedback banner handling
    if (state.quizMode === 'study' && isAnswered) {
      const isCorrect = (selected === q.answer);
      dom.feedbackBanner.style.display = 'flex';
      dom.feedbackBanner.className = `feedback-banner ${isCorrect ? 'correct' : 'incorrect'}`;
      dom.feedbackIcon.textContent = isCorrect ? '✓' : '✗';
      dom.feedbackTitle.textContent = isCorrect ? 'Correct! Outstanding Work' : 'Incorrect. Notice the Traps';
      dom.feedbackMessage.textContent = isCorrect
        ? 'Your selection is mathematically rigorous. Read the detailed explainer below for shortcuts and calculator tips.'
        : `You chose: ${selected}. The correct option is ${q.answer}. Review the detailed step-by-step derivation below.`;
      
      // Auto open explainer in study mode when answered
      dom.explainerDrawer.style.display = 'block';
    } else {
      dom.feedbackBanner.style.display = 'none';
    }

    q.options.forEach((optStr) => {
      const optItem = document.createElement('div');
      optItem.className = 'option-item';

      const prefix = optStr.substring(0, 3); // "(A)"
      const text = optStr.substring(4);

      optItem.innerHTML = `
        <span class="option-prefix">${prefix}</span>
        <span class="option-text">${escapeHtml(text)}</span>
      `;

      if (state.quizMode === 'study') {
        if (isAnswered) {
          optItem.classList.add('disabled');
          if (optStr === q.answer) {
            optItem.classList.add('correct');
          } else if (optStr === selected) {
            optItem.classList.add('incorrect');
          }
        } else {
          optItem.addEventListener('click', () => {
            selectOption(q, optStr);
          });
        }
      } else {
        // Exam Mode
        if (selected === optStr) {
          optItem.classList.add('selected');
        }
        optItem.addEventListener('click', () => {
          selectOption(q, optStr);
        });
      }

      dom.optionsContainer.appendChild(optItem);
    });
  }

  // --- Option Selection Logic ---
  function selectOption(q, optStr) {
    state.userAnswers[q.id] = optStr;

    // Update palette chip state
    const chip = document.getElementById(`q-chip-${state.currentIndex}`);
    if (chip) {
      chip.classList.add('answered');
    }

    renderQuestion(state.currentIndex);
  }

  // --- Navigate Questions ---
  function navigateQuestion(delta) {
    const newIdx = state.currentIndex + delta;
    if (newIdx >= 0 && newIdx < state.filteredQuestions.length) {
      renderQuestion(newIdx);
    } else if (newIdx >= state.filteredQuestions.length && state.quizMode === 'exam') {
      promptSubmitExam();
    }
  }

  // --- Flagging Current Question ---
  function toggleFlagCurrentQuestion() {
    if (!state.filteredQuestions[state.currentIndex]) return;
    const qid = state.filteredQuestions[state.currentIndex].id;

    if (state.flaggedQuestions.has(qid)) {
      state.flaggedQuestions.delete(qid);
    } else {
      state.flaggedQuestions.add(qid);
    }

    renderQuestion(state.currentIndex);
    renderPaletteGrid();
  }

  // --- Toggle Explainer Drawer ---
  function toggleExplainerDrawer() {
    if (dom.explainerDrawer.style.display === 'none' || !dom.explainerDrawer.style.display) {
      dom.explainerDrawer.style.display = 'block';
      dom.explainerDrawer.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    } else {
      dom.explainerDrawer.style.display = 'none';
    }
  }

  // --- Render Palette Grid ---
  function renderPaletteGrid() {
    dom.paletteGrid.innerHTML = '';
    state.filteredQuestions.forEach((q, idx) => {
      const chip = document.createElement('button');
      chip.className = 'q-chip';
      chip.id = `q-chip-${idx}`;
      chip.textContent = idx + 1;

      if (state.userAnswers[q.id]) {
        chip.classList.add('answered');
      }
      if (state.flaggedQuestions.has(q.id)) {
        chip.classList.add('flagged');
      }
      if (idx === state.currentIndex) {
        chip.classList.add('active');
      }

      chip.addEventListener('click', () => {
        renderQuestion(idx);
      });

      dom.paletteGrid.appendChild(chip);
    });
  }

  function updatePaletteActiveChip(activeIndex) {
    const chips = dom.paletteGrid.querySelectorAll('.q-chip');
    chips.forEach((c, idx) => {
      if (idx === activeIndex) {
        c.classList.add('active');
      } else {
        c.classList.remove('active');
      }
    });
  }

  // --- Exam Submission & Scoring ---
  function promptSubmitExam() {
    const totalQ = state.filteredQuestions.length;
    const answeredCount = Object.keys(state.userAnswers).length;
    const unansweredCount = totalQ - answeredCount;

    let confirmMsg = `Are you sure you want to finish and submit your CBT exam?\n\nTotal Questions: ${totalQ}\nAnswered: ${answeredCount}\nUnanswered: ${unansweredCount}`;
    if (unansweredCount > 0) {
      confirmMsg += `\n\nWarning: You still have ${unansweredCount} unanswered questions!`;
    }

    if (confirm(confirmMsg)) {
      submitExam();
    }
  }

  function submitExam() {
    stopExamTimer();
    state.examActive = false;

    const totalQ = state.filteredQuestions.length;
    let correctCount = 0;
    const moduleStats = {}; // moduleId -> { total, correct, title }

    state.filteredQuestions.forEach(q => {
      const mid = q.module_id || 1;
      const mtitle = q.module_title || `Module ${mid}`;
      if (!moduleStats[mid]) {
        moduleStats[mid] = { total: 0, correct: 0, title: mtitle };
      }
      moduleStats[mid].total++;

      if (state.userAnswers[q.id] === q.answer) {
        correctCount++;
        moduleStats[mid].correct++;
      }
    });

    const percent = Math.round((correctCount / totalQ) * 100);
    const elapsedSeconds = Math.round((Date.now() - state.examStartTime) / 1000);
    const elapsedMins = Math.floor(elapsedSeconds / 60);
    const elapsedSecsRem = elapsedSeconds % 60;

    // Populate Results Modal
    dom.resScorePercent.textContent = `${percent}%`;
    dom.resCorrectCount.textContent = correctCount;
    dom.resTotalCount.textContent = totalQ;
    dom.resTimeTaken.textContent = `${elapsedMins} min ${elapsedSecsRem} sec`;

    // Grade classification
    let gradeTitle = 'Grade: F (Needs Substantial Revision)';
    if (percent >= 70) gradeTitle = 'Grade: A (Excellent Distinction)';
    else if (percent >= 60) gradeTitle = 'Grade: B (Very Good)';
    else if (percent >= 50) gradeTitle = 'Grade: C (Credit Pass)';
    else if (percent >= 45) gradeTitle = 'Grade: D (Pass)';
    else if (percent >= 40) gradeTitle = 'Grade: E (Fair)';
    dom.resGradeTitle.textContent = gradeTitle;

    // Module Performance Breakdown Bars
    dom.modulePerformanceBars.innerHTML = '';
    Object.keys(moduleStats).sort().forEach(mid => {
      const stat = moduleStats[mid];
      const mPercent = Math.round((stat.correct / stat.total) * 100);

      const row = document.createElement('div');
      row.className = 'mod-progress-row';
      row.innerHTML = `
        <div class="mod-progress-labels">
          <span>${stat.title}</span>
          <span><strong>${stat.correct}/${stat.total}</strong> (${mPercent}%)</span>
        </div>
        <div class="mod-bar-bg">
          <div class="mod-bar-fill" style="width: ${mPercent}%;"></div>
        </div>
      `;
      dom.modulePerformanceBars.appendChild(row);
    });

    dom.examResultsModal.style.display = 'flex';
  }

  // --- External AI Teacher Prompt ---
  function renderAITeacherPrompt() {
    if (window.MATH202_STUDY_PROMPT && window.MATH202_STUDY_PROMPT.system_prompt) {
      dom.promptPreviewText.textContent = window.MATH202_STUDY_PROMPT.system_prompt;
    }
  }

  function copyAIPromptToClipboard() {
    const textToCopy = window.MATH202_STUDY_PROMPT ? window.MATH202_STUDY_PROMPT.system_prompt : '';
    if (!textToCopy) return;

    navigator.clipboard.writeText(textToCopy).then(() => {
      dom.btnCopyPrompt.innerHTML = '<span class="copy-icon">✓</span> Copied to Clipboard!';
      showToast('AI Master Prompt copied to clipboard! Paste it into ChatGPT, Claude, Gemini, or DeepSeek.');
      setTimeout(() => {
        dom.btnCopyPrompt.innerHTML = '<span class="copy-icon">📋</span> Copy Master Prompt';
      }, 3000);
    }).catch(err => {
      console.error('Failed to copy: ', err);
      showToast('Failed to copy automatically. Please select the text manually.');
    });
  }

  // --- Notification Toast ---
  function showToast(message) {
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.innerHTML = `<span>ℹ️</span> <span>${escapeHtml(message)}</span>`;
    dom.toastContainer.appendChild(toast);

    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateY(12px)';
      toast.style.transition = 'all 0.3s ease';
      setTimeout(() => toast.remove(), 300);
    }, 3500);
  }

  // --- Utility Functions ---
  function shuffleArray(arr) {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }

  function escapeHtml(str) {
    if (!str) return '';
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  // Lightweight Markdown to HTML Parser for Explanations
  function parseMarkdownToHtml(md) {
    if (!md) return '';

    let html = escapeHtml(md);

    // Section headers ### Title
    html = html.replace(/^###\s+(.*$)/gim, '<h3>$1</h3>');
    html = html.replace(/^##\s+(.*$)/gim, '<h2>$1</h2>');

    // Horizontal rules ---
    html = html.replace(/^---$/gim, '<hr>');

    // Bold text **bold**
    html = html.replace(/\*\*(.*?)\*\*/gim, '<strong>$1</strong>');

    // Bullet lists - item
    html = html.replace(/^\s*-\s+(.*$)/gim, '<li>$1</li>');
    html = html.replace(/(<li>.*<\/li>)/gims, '<ul>$1</ul>');
    // Remove nested duplicate uls
    html = html.replace(/<\/ul>\s*<ul>/gim, '');

    // Numbered lists 1. item
    html = html.replace(/^\s*\d+\.\s+(.*$)/gim, '<li>$1</li>');

    // Inline code `code`
    html = html.replace(/`([^`]+)`/gim, '<code>$1</code>');

    // Line breaks to paragraphs
    const paragraphs = html.split(/\n\s*\n/);
    return paragraphs
      .map(p => {
        p = p.trim();
        if (p.startsWith('<h3>') || p.startsWith('<h2>') || p.startsWith('<ul>') || p.startsWith('<hr>')) {
          return p;
        }
        return `<p>${p.replace(/\n/g, '<br>')}</p>`;
      })
      .join('\n');
  }

  // Initialize application once DOM is loaded
  document.addEventListener('DOMContentLoaded', init);
})();
