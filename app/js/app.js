/**
 * app.js — main SPA entry point
 * Hash-based routing: #/           → index
 *                     #/IAP19      → course index
 *                     #/IAP19/PS/PS01 → pset page
 */

import { parseSegments } from './parser.js';
import {
  getPyodide, onStatusChange, runContentPython,
  parseQuestionCode as pyParseQuestionCode,
  initPageRandom, resetPageContext,
} from './py-runner.js';
import {
  renderQuestion, renderCheckyourself, renderMath, resetQuestionCounter,
} from './questions.js';
import {
  saveScore, getPsetScores, getAllPsetScores,
  initQuestionTotal, saveAnswer, loadAnswer,
} from './storage.js';

// ── Manifest (courses + PSets) ─────────────────────────────────────────────────
let MANIFEST = null;

async function loadManifest() {
  if (MANIFEST) return MANIFEST;
  try {
    const r = await fetch('./manifest.json');
    MANIFEST = await r.json();
  } catch {
    // fallback hardcoded
    MANIFEST = {
      courses: [
        {
          id: 'IAP19',
          name: '6.s092 IAP 2019',
          psets: ['PS01','PS02','PS03','PS04','PS05','PS06','PS065','PS07','PS08',
                  'PS09','PS10','PS11','PS12','PS13','PS15','PS16','PS17','PS18',
                  'PS19','PS20','PS21','PS22','PS23','PS24','PS25','PS26','PS27'],
        },
        {
          id: 'IAP20',
          name: '6.s092 IAP 2020',
          psets: ['PS01','PS02','PS03','PS04','PS05','PS06','PS065','PS07','PS08',
                  'PS09','PS10','PS11','PS12','PS13','PS15','PS16','PS17','PS18',
                  'PS19','PS20','PS21','PS22','PS23','PS24','PS25','PS26','PS27'],
        },
      ],
    };
  }
  return MANIFEST;
}

// ── DOM helpers ───────────────────────────────────────────────────────────────
const root = document.getElementById('app-root');
const statusBadge = document.getElementById('pyodide-status');
const topNav = document.getElementById('top-nav');

function setRoot(html) {
  root.innerHTML = html;
}

function showSpinner(msg = 'Loading…') {
  root.innerHTML = `
    <div class="spinner-container">
      <div class="spinner"></div>
      <p>${msg}</p>
    </div>`;
}

// ── Pyodide status ────────────────────────────────────────────────────────────
onStatusChange((status, msg) => {
  statusBadge.textContent = status === 'ready' ? 'Python ✓' : msg;
  statusBadge.className = 'status-badge ' + status;
});

// Start loading Pyodide early (background)
getPyodide().catch(() => {});

// ── Routing ───────────────────────────────────────────────────────────────────
function getRoute() {
  const hash = window.location.hash.replace(/^#\/?/, '');
  const parts = hash.split('/').filter(Boolean);
  return parts;
}

async function navigate() {
  const parts = getRoute();
  if (parts.length === 0) {
    await renderIndex();
  } else if (parts.length === 1) {
    await renderCourseIndex(parts[0]);
  } else if (parts.length >= 3) {
    // e.g. IAP19/PS/PS01
    await renderPsetPage(parts[0], parts.slice(1).join('/'));
  } else {
    setRoot('<p>Page not found.</p>');
  }
}

window.addEventListener('hashchange', navigate);
window.addEventListener('DOMContentLoaded', navigate);

// ── Index page ────────────────────────────────────────────────────────────────
async function renderIndex() {
  const manifest = await loadManifest();
  topNav.innerHTML = '';

  let html = '<h1 style="margin-bottom:1.5rem">6.s092 Code Checker</h1>';
  html += '<p style="margin-bottom:2rem;color:var(--text-muted)">Select a course and problem set to get started. Your progress is saved locally in your browser.</p>';

  root.innerHTML = html;

  for (const course of manifest.courses) {
    const section = document.createElement('div');
    section.className = 'course-section';
    section.innerHTML = `<h2>${course.name}</h2>`;

    const scores = await getAllPsetScores(course.id);

    const grid = document.createElement('div');
    grid.className = 'pset-grid';

    for (const pset of course.psets) {
      const sc = scores.get(pset);
      const card = document.createElement('a');
      card.className = 'pset-card' + (sc && sc.total > 0 ? ' has-score' : '');
      card.href = `#/${course.id}/PS/${pset}`;
      card.innerHTML = `
        <div class="pset-name">${pset}</div>
        <div class="pset-score">${sc && sc.total > 0 ? `${sc.earned}/${sc.total} pts` : '—'}</div>
      `;
      grid.appendChild(card);
    }

    section.appendChild(grid);
    root.appendChild(section);
  }
}

// ── Course index page ─────────────────────────────────────────────────────────
async function renderCourseIndex(courseId) {
  const manifest = await loadManifest();
  const course = manifest.courses.find(c => c.id === courseId);
  if (!course) { setRoot('<p>Course not found.</p>'); return; }

  topNav.innerHTML = `<a href="#/">← Home</a>`;
  // Redirect to index for now
  await renderIndex();
}

// ── Pset page ─────────────────────────────────────────────────────────────────
async function renderPsetPage(courseId, psetPath) {
  showSpinner('Loading problem set…');

  const manifest = await loadManifest();
  const course = manifest.courses.find(c => c.id === courseId);
  const psetName = psetPath.split('/').pop();

  // Nav
  topNav.innerHTML = `<a href="#/">Home</a> <a href="#/${courseId}">← ${course?.name || courseId}</a>`;

  // Fetch content.md
  const contentUrl = `../6s092/courses/${courseId}/${psetPath}/content.md`;
  let rawContent = '';
  try {
    const r = await fetch(contentUrl);
    if (!r.ok) throw new Error(r.statusText);
    rawContent = await r.text();
  } catch (e) {
    root.innerHTML = `<p class="feedback-msg wrong">Failed to load content: ${e.message}</p><p><a href="#/">← Back</a></p>`;
    return;
  }

  // Fetch preload.py files (course-level then PS-level)
  const preloads = [
    `../6s092/courses/${courseId}/preload.py`,
    `../6s092/courses/${courseId}/${psetPath}/preload.py`,
  ];

  await resetPageContext();
  await initPageRandom(`${courseId}/${psetPath}`);

  for (const url of preloads) {
    try {
      const r = await fetch(url);
      if (r.ok) {
        const code = await r.text();
        await runContentPython(code);
      }
    } catch { /* preload is optional */ }
  }

  // Parse segments
  const segments = parseSegments(rawContent);

  // Render page
  root.innerHTML = '';
  resetQuestionCounter();

  // Breadcrumb
  const crumb = document.createElement('div');
  crumb.className = 'breadcrumb';
  crumb.innerHTML = `<a href="#/">Home</a><span>›</span><a href="#/${courseId}">${course?.name || courseId}</a><span>›</span>${psetName}`;
  root.appendChild(crumb);

  // PSets navigation sidebar (small)
  if (course) {
    const nav = document.createElement('div');
    nav.className = 'ps-nav';
    for (const ps of course.psets) {
      const a = document.createElement('a');
      a.href = `#/${courseId}/PS/${ps}`;
      a.textContent = ps;
      if (ps === psetName) a.className = 'active';
      nav.appendChild(a);
    }
    root.appendChild(nav);
  }

  // Score bar (will be populated after render)
  const scoreBar = document.createElement('div');
  scoreBar.className = 'score-bar';
  scoreBar.innerHTML = `
    <span class="score-label">Your Progress</span>
    <span class="score-frac" id="score-frac">—</span>
    <div class="score-progress"><div class="score-progress-fill" id="score-fill" style="width:0%"></div></div>
  `;
  root.appendChild(scoreBar);

  // Content container
  const contentDiv = document.createElement('div');
  contentDiv.className = 'content-page';
  root.appendChild(contentDiv);

  // Score tracking
  let totalEarned = 0;
  let totalPoints = 0;
  let qIndex = 0;

  function updateScoreBar() {
    const frac = document.getElementById('score-frac');
    const fill = document.getElementById('score-fill');
    if (frac) frac.textContent = totalPoints > 0 ? `${totalEarned}/${totalPoints}` : '—';
    if (fill) fill.style.width = totalPoints > 0 ? `${(totalEarned / totalPoints * 100).toFixed(0)}%` : '0%';
  }

  async function onScore(qIdx, earned, total) {
    await saveScore(courseId, psetName, qIdx, earned, total);
    // Recalculate from stored scores
    const sc = await getPsetScores(courseId, psetName);
    totalEarned = sc.earned;
    totalPoints = sc.total;
    updateScoreBar();
  }

  // Process and render segments
  for (const seg of segments) {
    if (seg.type === 'markdown') {
      const div = document.createElement('div');
      div.innerHTML = marked.parse(seg.text, { breaks: false });
      contentDiv.appendChild(div);

    } else if (seg.type === 'python') {
      const result = await runContentPython(seg.code);
      if (result.error) {
        const errEl = document.createElement('div');
        errEl.className = 'feedback-msg wrong';
        errEl.textContent = '⚠ Python block error: ' + result.error;
        contentDiv.appendChild(errEl);
      }
      // Insert printed output back into the page
      for (const printed of result.output) {
        // The printed text might itself contain question blocks — parse recursively
        const innerSegments = parseSegments(printed);
        for (const inner of innerSegments) {
          await renderSegment(inner, contentDiv);
        }
      }

    } else if (seg.type === 'question') {
      await renderSegment(seg, contentDiv);

    } else if (seg.type === 'checkyourself') {
      const el = renderCheckyourself(seg.text, seg.showhide);
      contentDiv.appendChild(el);
    }
  }

  // Render math in entire content area
  renderMath(contentDiv);

  async function renderSegment(seg, container) {
    if (seg.type === 'markdown') {
      const div = document.createElement('div');
      div.innerHTML = marked.parse(seg.text, { breaks: false });
      container.appendChild(div);
    } else if (seg.type === 'python') {
      const result = await runContentPython(seg.code);
      for (const printed of result.output) {
        const inner = parseSegments(printed);
        for (const s of inner) await renderSegment(s, container);
      }
    } else if (seg.type === 'question') {
      const thisQIndex = qIndex++;
      // Parse vars from Python
      const vars = await pyParseQuestionCode(seg.code);
      if (vars._parse_error) {
        const errEl = document.createElement('div');
        errEl.className = 'feedback-msg wrong';
        errEl.textContent = '⚠ Question parse error: ' + vars._parse_error;
        container.appendChild(errEl);
        return;
      }
      const npoints = vars.csq_npoints ?? ((vars.csq_tests || vars.tests || []).length || 1);
      // Register total points immediately (shows 0/X before user answers)
      await initQuestionTotal(courseId, psetName, thisQIndex, npoints);
      // Refresh score bar to include this question's total
      const sc0 = await getPsetScores(courseId, psetName);
      totalEarned = sc0.earned;
      totalPoints = sc0.total;
      updateScoreBar();

      const savedAns = await loadAnswer(courseId, psetName, thisQIndex);
      const el = renderQuestion(seg.qtype, vars, {
        onScore: (earned, total) => onScore(thisQIndex, earned, total),
        onSaveAnswer: (data) => saveAnswer(courseId, psetName, thisQIndex, data),
        savedAnswer: savedAns,
      });
      container.appendChild(el);
      renderMath(el);
    } else if (seg.type === 'checkyourself') {
      container.appendChild(renderCheckyourself(seg.text, seg.showhide));
    }
  }
}
