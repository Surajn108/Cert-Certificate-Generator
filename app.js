/* ═══════════════════════════════════════
   CertGen — Certificate Generator System
   app.js — All logic
═══════════════════════════════════════ */

// ── Storage ──────────────────────────────────────────────────────────────────
const DB_KEY = 'certgen_records';

function getRecords() {
  try { return JSON.parse(localStorage.getItem(DB_KEY) || '[]'); } catch { return []; }
}

function saveRecords(records) {
  localStorage.setItem(DB_KEY, JSON.stringify(records));
}

// ── ID Generator ─────────────────────────────────────────────────────────────
const ID_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

function generateId() {
  let id = 'CERT-';
  for (let i = 0; i < 8; i++) id += ID_CHARS[Math.floor(Math.random() * ID_CHARS.length)];
  return id;
}

let currentId = generateId();

function refreshId() {
  currentId = generateId();
  document.getElementById('cert-id-display').textContent = currentId;
  document.getElementById('prev-id').textContent = currentId;
  buildQR(currentId, 'qr-preview');
}

// ── QR Code ───────────────────────────────────────────────────────────────────
function buildQR(text, containerId) {
  const el = document.getElementById(containerId);
  if (!el) return;
  el.innerHTML = '';
  try {
    new QRCode(el, {
      text: `${location.origin}${location.pathname}?verify=${text}`,
      width: 52, height: 52,
      colorDark: '#1A1614', colorLight: '#FFFEF9',
      correctLevel: QRCode.CorrectLevel.M
    });
  } catch(e) {}
}

// ── Live Preview ──────────────────────────────────────────────────────────────
function livePreview() {
  const name  = document.getElementById('inp-name').value.trim()  || 'Recipient Name';
  const role  = document.getElementById('inp-role').value.trim()  || 'Role / Title';
  const event = document.getElementById('inp-event').value.trim() || 'Event / Internship Name';
  const org   = document.getElementById('inp-org').value.trim()   || 'Issuing Organisation';
  const date  = document.getElementById('inp-date').value;

  document.getElementById('prev-name').textContent  = name;
  document.getElementById('prev-role').textContent  = role;
  document.getElementById('prev-event').textContent = event;
  document.getElementById('prev-org').textContent   = org;
  document.getElementById('prev-id').textContent    = currentId;
  document.getElementById('cert-id-display').textContent = currentId;

  if (date) {
    document.getElementById('prev-date').textContent =
      new Date(date + 'T00:00:00').toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' });
  }
}

// ── Validate ──────────────────────────────────────────────────────────────────
function validate() {
  const fields = ['inp-name','inp-role','inp-event','inp-date'];
  for (const f of fields) {
    if (!document.getElementById(f).value.trim()) return false;
  }
  return true;
}

function showMsg(text, type) {
  const el = document.getElementById('form-msg');
  el.textContent = text;
  el.className = 'form-msg ' + type;
  el.classList.remove('hidden');
  setTimeout(() => el.classList.add('hidden'), 4000);
}

// ── Issue Certificate ─────────────────────────────────────────────────────────
function issueCertificate() {
  if (!validate()) { showMsg('Please fill in all required fields.', 'error'); return; }

  const record = {
    id:       currentId,
    name:     document.getElementById('inp-name').value.trim(),
    role:     document.getElementById('inp-role').value.trim(),
    event:    document.getElementById('inp-event').value.trim(),
    org:      document.getElementById('inp-org').value.trim() || 'TechCorp Academy',
    date:     document.getElementById('inp-date').value,
    issuedAt: new Date().toISOString(),
    status:   'active'
  };

  const records = getRecords();
  records.unshift(record);
  saveRecords(records);

  showMsg(`Certificate ${record.id} saved successfully!`, 'success');

  // Reset for next certificate
  currentId = generateId();
  document.getElementById('cert-id-display').textContent = currentId;
  buildQR(currentId, 'qr-preview');

  renderTable();
  updateStats();
}

// ── PDF Download ──────────────────────────────────────────────────────────────
async function downloadPDF() {
  if (!validate()) { showMsg('Fill in all required fields first.', 'error'); return; }
  livePreview();

  const cert = document.getElementById('certificate');
  showMsg('Generating PDF…', 'success');

  await new Promise(r => setTimeout(r, 200));

  const canvas = await html2canvas(cert, {
    scale: 2, useCORS: true, backgroundColor: '#FFFEF9', logging: false
  });

  const { jsPDF } = window.jspdf;
  const pdf = new jsPDF({ orientation: 'landscape', unit: 'px', format: [794, 560] });
  pdf.addImage(canvas.toDataURL('image/jpeg', 0.95), 'JPEG', 0, 0, 794, 560);

  const name = document.getElementById('inp-name').value.trim() || 'certificate';
  pdf.save(`${currentId}_${name.replace(/\s+/g,'_')}.pdf`);
}

// ── PNG Download ──────────────────────────────────────────────────────────────
async function downloadPNG() {
  if (!validate()) { showMsg('Fill in all required fields first.', 'error'); return; }
  livePreview();

  const cert = document.getElementById('certificate');
  showMsg('Generating image…', 'success');

  await new Promise(r => setTimeout(r, 200));

  const canvas = await html2canvas(cert, {
    scale: 2, useCORS: true, backgroundColor: '#FFFEF9', logging: false
  });

  const a = document.createElement('a');
  a.href = canvas.toDataURL('image/png');
  const name = document.getElementById('inp-name').value.trim() || 'certificate';
  a.download = `${currentId}_${name.replace(/\s+/g,'_')}.png`;
  a.click();
}

// ── Admin Table ───────────────────────────────────────────────────────────────
function renderTable() {
  const query   = (document.getElementById('admin-search')?.value || '').toLowerCase();
  const records = getRecords();
  const tbody   = document.getElementById('cert-table-body');

  const filtered = query
    ? records.filter(r =>
        r.name.toLowerCase().includes(query) ||
        r.id.toLowerCase().includes(query) ||
        r.event.toLowerCase().includes(query) ||
        r.role.toLowerCase().includes(query))
    : records;

  if (!filtered.length) {
    tbody.innerHTML = `<tr class="empty-row"><td colspan="7">No certificates found.</td></tr>`;
    return;
  }

  tbody.innerHTML = filtered.map(r => {
    const dateStr = r.date
      ? new Date(r.date + 'T00:00:00').toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
      : '—';
    const isActive = r.status === 'active';
    return `
      <tr>
        <td class="id-cell">${r.id}</td>
        <td><strong>${escHtml(r.name)}</strong></td>
        <td>${escHtml(r.role)}</td>
        <td>${escHtml(r.event)}</td>
        <td>${dateStr}</td>
        <td><span class="badge ${r.status}">${r.status}</span></td>
        <td>
          <div class="tbl-actions">
            <button class="tbl-btn" onclick="reprintCert('${r.id}')">Reprint</button>
            ${isActive
              ? `<button class="tbl-btn revoke" onclick="toggleStatus('${r.id}','revoked')">Revoke</button>`
              : `<button class="tbl-btn restore" onclick="toggleStatus('${r.id}','active')">Restore</button>`
            }
            <button class="tbl-btn revoke" onclick="deleteRecord('${r.id}')">Delete</button>
          </div>
        </td>
      </tr>`;
  }).join('');
}

function escHtml(s) {
  return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

function updateStats() {
  const records = getRecords();
  const active  = records.filter(r => r.status === 'active').length;
  const revoked = records.filter(r => r.status === 'revoked').length;
  document.getElementById('stat-total').textContent   = `${records.length} total`;
  document.getElementById('stat-active').textContent  = `${active} active`;
  document.getElementById('stat-revoked').textContent = `${revoked} revoked`;
}

function toggleStatus(id, newStatus) {
  const records = getRecords();
  const rec = records.find(r => r.id === id);
  if (rec) { rec.status = newStatus; saveRecords(records); renderTable(); updateStats(); }
}

function deleteRecord(id) {
  if (!confirm(`Delete certificate ${id}? This cannot be undone.`)) return;
  const records = getRecords().filter(r => r.id !== id);
  saveRecords(records);
  renderTable();
  updateStats();
}

function reprintCert(id) {
  const rec = getRecords().find(r => r.id === id);
  if (!rec) return;

  // Switch to issue view and populate fields
  showView('issue');
  document.getElementById('inp-name').value  = rec.name;
  document.getElementById('inp-role').value  = rec.role;
  document.getElementById('inp-event').value = rec.event;
  document.getElementById('inp-org').value   = rec.org || 'TechCorp Academy';
  document.getElementById('inp-date').value  = rec.date;
  currentId = rec.id;
  document.getElementById('cert-id-display').textContent = currentId;
  livePreview();
  buildQR(currentId, 'qr-preview');
}

// ── Export CSV ────────────────────────────────────────────────────────────────
function exportCSV() {
  const records = getRecords();
  if (!records.length) { alert('No records to export.'); return; }

  const header = ['ID','Name','Role','Event','Organisation','Date','Issued At','Status'];
  const rows = records.map(r => [
    r.id, r.name, r.role, r.event, r.org || '', r.date,
    new Date(r.issuedAt).toLocaleString(), r.status
  ].map(v => `"${String(v).replace(/"/g,'""')}"`));

  const csv = [header.join(','), ...rows.map(r => r.join(','))].join('\n');
  const blob = new Blob([csv], { type: 'text/csv' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `certificates_export_${Date.now()}.csv`;
  a.click();
}

// ── Verify ────────────────────────────────────────────────────────────────────
function verifyCert() {
  const input   = document.getElementById('verify-input').value.trim().toUpperCase();
  const resultEl = document.getElementById('verify-result');

  if (!input) { resultEl.innerHTML = '<p style="color:var(--red)">Please enter a Certificate ID.</p>'; resultEl.className='verify-result invalid'; resultEl.classList.remove('hidden'); return; }

  const records = getRecords();
  const rec = records.find(r => r.id === input);

  resultEl.classList.remove('hidden');

  if (!rec) {
    resultEl.className = 'verify-result invalid';
    resultEl.innerHTML = `
      <h3 style="color:var(--red)">✗ Certificate not found</h3>
      <p style="font-size:0.875rem;color:var(--text-muted)">No record exists for ID <strong>${escHtml(input)}</strong>. It may be fake or the ID is incorrect.</p>`;
    return;
  }

  const dateStr = rec.date
    ? new Date(rec.date + 'T00:00:00').toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })
    : '—';
  const issuedStr = new Date(rec.issuedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' });

  if (rec.status === 'revoked') {
    resultEl.className = 'verify-result revoked-status';
    resultEl.innerHTML = `
      <h3 style="color:#B7950B">⚠ Certificate Revoked</h3>
      <div class="vr-row"><span class="vr-label">ID</span><span>${rec.id}</span></div>
      <div class="vr-row"><span class="vr-label">Recipient</span><span>${escHtml(rec.name)}</span></div>
      <div class="vr-row"><span class="vr-label">Status</span><span style="color:var(--red);font-weight:500">REVOKED — this certificate is no longer valid.</span></div>`;
    return;
  }

  resultEl.className = 'verify-result valid';
  resultEl.innerHTML = `
    <h3 style="color:var(--green)">✓ Certificate Verified</h3>
    <div class="vr-row"><span class="vr-label">ID</span><span style="font-family:var(--font-mono);font-size:0.85rem">${rec.id}</span></div>
    <div class="vr-row"><span class="vr-label">Recipient</span><span><strong>${escHtml(rec.name)}</strong></span></div>
    <div class="vr-row"><span class="vr-label">Role</span><span>${escHtml(rec.role)}</span></div>
    <div class="vr-row"><span class="vr-label">Event</span><span>${escHtml(rec.event)}</span></div>
    <div class="vr-row"><span class="vr-label">Organisation</span><span>${escHtml(rec.org || '—')}</span></div>
    <div class="vr-row"><span class="vr-label">Completed</span><span>${dateStr}</span></div>
    <div class="vr-row"><span class="vr-label">Issued on</span><span>${issuedStr}</span></div>
    <div class="vr-row"><span class="vr-label">Status</span><span style="color:var(--green);font-weight:500">VALID &amp; ACTIVE</span></div>`;
}

// Check ?verify= query param on load
function checkVerifyParam() {
  const params = new URLSearchParams(location.search);
  const v = params.get('verify');
  if (v) {
    showView('verify');
    document.getElementById('verify-input').value = v;
    verifyCert();
  }
}

// ── View Switching ────────────────────────────────────────────────────────────
function showView(name) {
  document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
  document.querySelectorAll('.nav-tab').forEach(t => t.classList.remove('active'));
  document.getElementById('view-' + name).classList.add('active');
  const tabs = { issue: 0, admin: 1, verify: 2 };
  document.querySelectorAll('.nav-tab')[tabs[name]].classList.add('active');
  if (name === 'admin') { renderTable(); updateStats(); }
}

// ── Init ──────────────────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  // Set today's date as default
  document.getElementById('inp-date').valueAsDate = new Date();

  livePreview();
  buildQR(currentId, 'qr-preview');
  renderTable();
  updateStats();
  checkVerifyParam();
});
