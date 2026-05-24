const feedback = [];
const decisions = [];
let currentBrief = null;
let feedbackSeq = 1;

const feedbackTable = document.getElementById('feedbackTable');
const decisionTable = document.getElementById('decisionTable');

async function api(type, method = 'GET', body) {
  const res = await fetch(`/api/data?type=${type}`, {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) throw new Error((await res.json()).error || 'API request failed');
  return res.json();
}

function safe(text) {
  return String(text ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

function renderFeedback() {
  feedbackTable.innerHTML = '';
  feedback.forEach((item, i) => {
    const row = document.createElement('tr');
    row.innerHTML = `
      <td>${safe(item.fbId)}</td>
      <td>${safe(item.section)}</td>
      <td>${safe(item.reviewer)}</td>
      <td>${safe(item.priority)}</td>
      <td>${safe(item.comment)}</td>
      <td><select data-index="${i}" class="statusSelect">${['Open', 'Accepted', 'Rejected', 'Needs Clarification'].map(s => `<option ${item.status === s ? 'selected' : ''}>${s}</option>`).join('')}</select></td>
      <td><button class="delete" data-delete="${i}">Delete</button></td>`;
    feedbackTable.appendChild(row);
  });

  document.querySelectorAll('.statusSelect').forEach(el => el.addEventListener('change', async (e) => {
    const item = feedback[e.target.dataset.index];
    item.status = e.target.value;
    await api('feedback', 'PATCH', { id: item.recordId, fields: { Status: item.status } });
  }));

  document.querySelectorAll('[data-delete]').forEach(el => el.addEventListener('click', async (e) => {
    const idx = Number(e.target.dataset.delete);
    const item = feedback[idx];
    await api('feedback', 'DELETE', { id: item.recordId });
    feedback.splice(idx, 1);
    renderFeedback();
  }));
}

function renderDecisions() {
  decisionTable.innerHTML = decisions.map(d =>
    `<tr><td>${safe(d.date)}</td><td>${safe(d.decision)}</td><td>${safe(d.owner)}</td><td>${safe(d.rationale)}</td><td>${safe(d.assets)}</td></tr>`).join('');
}

function renderBrief() {
  const target = document.getElementById('briefPreview');
  if (!currentBrief) {
    target.classList.add('muted');
    target.textContent = 'No brief saved yet.';
    return;
  }
  target.classList.remove('muted');
  target.textContent = `${currentBrief.Campaign} | ${currentBrief.Product} | KPI: ${currentBrief.KPI} | Audience: ${currentBrief.Audience} | Launch: ${currentBrief.LaunchDate} | DRI: ${currentBrief.DRI}`;
}

document.getElementById('briefForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const data = new FormData(e.target);
  const fields = {
    Campaign: data.get('campaign'), Product: data.get('product'), Objective: data.get('objective'), KPI: data.get('kpi'),
    Audience: data.get('audience'), CoreMessage: data.get('message'), LaunchDate: data.get('launchDate'), DRI: data.get('dri'),
    Status: document.getElementById('campaignStatus').value,
  };
  await api('brief', 'POST', fields);
  currentBrief = fields;
  renderBrief();
  e.target.reset();
});

document.getElementById('feedbackForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const data = new FormData(e.target);
  const fbId = `FB-${String(feedbackSeq++).padStart(3, '0')}`;
  const fields = { FBID: fbId, Section: data.get('section'), Reviewer: data.get('reviewer'), Priority: data.get('priority'), Comment: data.get('comment'), Status: 'Open' };
  const saved = await api('feedback', 'POST', fields);
  feedback.unshift({
    recordId: saved.id, fbId, section: fields.Section, reviewer: fields.Reviewer, priority: fields.Priority, comment: fields.Comment, status: 'Open',
  });
  renderFeedback();
  e.target.reset();
});

document.getElementById('decisionForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const data = new FormData(e.target);
  const fields = {
    Date: new Date().toISOString().slice(0, 10), Decision: data.get('decision'), Owner: data.get('owner'), Rationale: data.get('rationale'), Assets: data.get('assets'),
  };
  await api('decisions', 'POST', fields);
  decisions.unshift({ date: fields.Date, decision: fields.Decision, owner: fields.Owner, rationale: fields.Rationale, assets: fields.Assets });
  renderDecisions();
  e.target.reset();
});

(async function init() {
  try {
    const [fb, dc, br] = await Promise.all([api('feedback'), api('decisions'), api('brief')]);
    feedback.push(...fb.map(r => ({
      recordId: r.id,
      fbId: r.fields.FBID || `FB-${String(feedbackSeq++).padStart(3, '0')}`,
      section: r.fields.Section || '', reviewer: r.fields.Reviewer || '', priority: r.fields.Priority || 'P2', comment: r.fields.Comment || '', status: r.fields.Status || 'Open',
    })));
    decisions.push(...dc.map(r => ({
      date: r.fields.Date || '', decision: r.fields.Decision || '', owner: r.fields.Owner || '', rationale: r.fields.Rationale || '', assets: r.fields.Assets || '',
    })));
    currentBrief = br[0]?.fields || null;
    renderFeedback();
    renderDecisions();
    renderBrief();
  } catch (err) {
    document.getElementById('briefPreview').textContent = `Connect Airtable by setting Vercel env vars. (${err.message})`;
  }
})();
