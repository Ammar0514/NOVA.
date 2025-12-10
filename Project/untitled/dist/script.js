// app.js - UI behaviour + demo logic

// Basic DOM hooks
const themeSelect = document.getElementById('themeSelect');
const body = document.body;
const metaTheme = document.getElementById('meta-theme-color');
const yearEl = document.getElementById('year');
yearEl.textContent = new Date().getFullYear();

// Theme handling: persist selection
function applyTheme(t){
  body.setAttribute('data-theme', t);
  // change theme color meta (nice on mobile)
  if(t === 'dark') metaTheme.setAttribute('content', '#081226');
  else if(t === 'aqua') metaTheme.setAttribute('content','#06b6d4');
  else if(t === 'amazon') metaTheme.setAttribute('content','#ff9900');
  else metaTheme.setAttribute('content','#ffffff');

  localStorage.setItem('nova_theme', t);
}
const saved = localStorage.getItem('nova_theme') || 'light';
themeSelect.value = saved;
applyTheme(saved);
themeSelect.addEventListener('change', () => applyTheme(themeSelect.value));

// Sign in / Sign up demo (localStorage)
const authModal = document.getElementById('authModal');
const signinBtn = document.getElementById('signinBtn');
const signupBtn = document.getElementById('signupBtn');
const closeAuth = document.getElementById('closeAuth');
const switchAuth = document.getElementById('switchAuth');
const authTitle = document.getElementById('authTitle');
const authForm = document.getElementById('authForm');
const authEmail = document.getElementById('authEmail');
const authPassword = document.getElementById('authPassword');
const authSubmit = document.getElementById('authSubmit');
const authMsg = document.getElementById('authMsg');
let authMode = 'signin';

function openAuth(mode='signin'){
  authMode = mode;
  authTitle.textContent = mode === 'signin' ? 'Sign In' : 'Sign Up';
  authSubmit.textContent = mode === 'signin' ? 'Sign In' : 'Create Account';
  authMsg.textContent = '';
  authModal.setAttribute('aria-hidden', 'false');
  authModal.style.display = 'flex';
}
function closeAuthModal(){
  authModal.setAttribute('aria-hidden','true');
  authModal.style.display = 'none';
}
signinBtn.addEventListener('click', ()=> openAuth('signin'));
signupBtn.addEventListener('click', ()=> openAuth('signup'));
closeAuth.addEventListener('click', closeAuthModal);
switchAuth.addEventListener('click', ()=> openAuth(authMode === 'signin' ? 'signup' : 'signin'));

// On submit: store minimal/local account
authForm.addEventListener('submit', (e)=>{
  e.preventDefault();
  const email = authEmail.value.trim();
  const pw = authPassword.value;
  if(authMode === 'signup'){
    // very light demo: store user in localStorage
    const users = JSON.parse(localStorage.getItem('nova_users')||'{}');
    if(users[email]){ authMsg.textContent = 'User already exists'; return; }
    users[email] = { password: pw, created: Date.now() };
    localStorage.setItem('nova_users', JSON.stringify(users));
    authMsg.textContent = 'Account created. You may sign in now.';
  } else {
    const users = JSON.parse(localStorage.getItem('nova_users')||'{}');
    if(!users[email] || users[email].password !== pw){ authMsg.textContent = 'Invalid credentials'; return; }
    authMsg.textContent = 'Signed in';
    localStorage.setItem('nova_user', email);
    // Update UI for signed in user (simple)
    signinBtn.textContent = 'Signed in';
    closeAuthModal();
  }
});

// Simple servo slider behavior
const servoSlider = document.getElementById('servoSlider');
const servoState = document.getElementById('servoState');
const servoOpenBtn = document.getElementById('servoOpenBtn');
const servoCloseBtn = document.getElementById('servoCloseBtn');

function setServo(pos){
  servoSlider.value = pos;
  servoState.textContent = pos > 10 ? 'Open' : 'Closed';
  // add event to history (demo)
  addHistory({ device: 'Local-Device', temp: curTemp || 0, level: currentLevel, rain: currentRain, servo: pos > 10 ? 'Open' : 'Closed', raw: `servo:${pos}` });
  // TODO: Send to Arduino using WebUSB API (plug your code here)
  // If you have port and writer from WebUSB, call writer or port.transferOut accordingly.
}
servoOpenBtn.addEventListener('click', ()=> setServo(95));
servoCloseBtn.addEventListener('click', ()=> setServo(0));
servoSlider.addEventListener('input', ()=> {
  servoState.textContent = servoSlider.value > 10 ? 'Open' : 'Closed';
});

// History table
const historyTableBody = document.querySelector('#historyTable tbody');
function addHistory(item){
  const rows = JSON.parse(localStorage.getItem('nova_history')||'[]');
  const row = { ts: new Date().toISOString(), ...item };
  rows.unshift(row);
  localStorage.setItem('nova_history', JSON.stringify(rows.slice(0,200)));
  renderHistory();
}
function renderHistory(){
  const rows = JSON.parse(localStorage.getItem('nova_history')||'[]');
  historyTableBody.innerHTML = '';
  rows.forEach(r => {
    const tr = document.createElement('tr');
    tr.innerHTML = `<td>${new Date(r.ts).toLocaleString()}</td>
      <td>${r.device}</td>
      <td>${r.temp}</td>
      <td>${r.level}</td>
      <td>${r.rain}</td>
      <td>${r.servo}</td>
      <td>${r.raw}</td>`;
    historyTableBody.appendChild(tr);
  });
}
document.getElementById('clearHistory').addEventListener('click', ()=> { localStorage.removeItem('nova_history'); renderHistory(); });
document.getElementById('exportHistory').addEventListener('click', ()=>{
  const rows = JSON.parse(localStorage.getItem('nova_history')||'[]');
  const csv = ['Date,Device,Temp,Level,Rain,Servo,Raw', ...rows.map(r => {
    return `"${new Date(r.ts).toLocaleString()}","${r.device}",${r.temp},"${r.level}","${r.rain}","${r.servo}","${r.raw}"`;
  })].join('\n');
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a'); a.href = url; a.download = 'nova_history.csv'; a.click();
  URL.revokeObjectURL(url);
});

// Simple simulated data engine (used by simulate button)
let curTemp = 22;
let currentLevel = 'Empty';
let currentRain = 'No';
const tempValue = document.getElementById('tempValue');
const weatherValue = document.getElementById('weatherValue');
const statusValue = document.getElementById('statusValue');
const levelCard = document.getElementById('levelCard');
const rainCard = document.getElementById('rainCard');

function updateStatusUI(){
  tempValue.textContent = `${curTemp} °C`;
  weatherValue.textContent = currentRain === 'Yes' ? 'Rain' : 'Clear';
  statusValue.textContent = 'Connected (Sim)';
  levelCard.textContent = currentLevel;
  rainCard.textContent = currentRain === 'Yes' ? 'RAIN DETECTED' : 'NO RAIN';
  document.getElementById('lastUpdate').textContent = new Date().toLocaleTimeString();
}
document.getElementById('simulateBtn').addEventListener('click', ()=>{
  // cycle values
  curTemp = Math.round(15 + Math.random()*20);
  currentLevel = ['Empty','Low','Medium','High','Full'][Math.floor(Math.random()*5)];
  currentRain = Math.random()>0.6 ? 'Yes' : 'No';
  updateStatusUI();
  addHistory({ device:'Sim-Device', temp:curTemp, level:currentLevel, rain:currentRain, servo: servoSlider.value, raw: `sim:${Math.random().toFixed(2)}` });
});

// USB connect button (stub)
const connectUsbBtn = document.getElementById('connectUsbBtn');
connectUsbBtn.addEventListener('click', async ()=>{
  // This is a stub. Replace with your WebUSB code.
  // Example: prompt user, open device, start reading, then call processData for incoming text.
  // See your original example's readLoop/processData and adapt.

  // For now, we'll simulate "connected" status:
  statusValue.textContent = 'Connected (USB demo)';
  // If you want to actually implement WebUSB here, use navigator.usb.requestDevice and appropriate transfers.
  // Save port to global, then read continuously and call processIncomingData(text)
});

// Process incoming serial-style data (string)
// expected format (demo): rain,low,mid,high,full,temp
function processIncomingData(dataStr){
  // Data format: rain,low,mid,high,full,temp
  const parts = dataStr.split(',').map(p => p.trim());
  if(parts.length < 6) return;
  const rainRaw = parseInt(parts[0]);
  const low = parseInt(parts[1]);
  const mid = parseInt(parts[2]);
  const high = parseInt(parts[3]);
  const full = parseInt(parts[4]);
  const temp = parseFloat(parts[5]);
  // map
  currentRain = rainRaw < 400 ? 'Yes' : 'No';
  if(full) currentLevel = 'Full';
  else if(high) currentLevel = 'High';
  else if(mid) currentLevel = 'Medium';
  else if(low) currentLevel = 'Low';
  else currentLevel = 'Empty';
  curTemp = temp || curTemp;
  updateStatusUI();
  addHistory({ device:'USB-Device', temp:curTemp, level:currentLevel, rain:currentRain, servo: servoSlider.value, raw: dataStr });
}

// Allow manual trigger for demo: simulate incoming serial line
window.simulateIncoming = (line) => processIncomingData(line);

// Small helpers: download snapshot (saves JSON)
document.getElementById('downloadSnapshot').addEventListener('click', ()=>{
  const data = {
    theme: body.getAttribute('data-theme'),
    last: { temp: curTemp, level: currentLevel, rain: currentRain },
    history: JSON.parse(localStorage.getItem('nova_history')||'[]')
  };
  const blob = new Blob([JSON.stringify(data, null, 2)], {type:'application/json'});
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a'); a.href = url; a.download = 'nova_snapshot.json'; a.click();
  URL.revokeObjectURL(url);
});

// On load: render history
renderHistory();

// Set threshold (demo)
document.getElementById('setThreshold').addEventListener('click', ()=>{
  const t = document.getElementById('tempThreshold').value;
  if(t) {
    document.getElementById('alertsList').textContent = `Temp alert at ${t}°C`;
    localStorage.setItem('nova_temp_threshold', t);
  }
});

// Simple auto sign-in status
if(localStorage.getItem('nova_user')){
  signinBtn.textContent = 'Signed in';
}

// Example: where to integrate real WebUSB:
// After you get incoming text lines from the serial endpoint, call processIncomingData(line).
// e.g. processIncomingData("350,0,1,0,0,23.4")  // sample

// Shared app.js for all pages
document.addEventListener('DOMContentLoaded', ()=> {
  const themeSelect = document.getElementById('themeSelect');
  const body = document.body;
  const yearEl = document.getElementById('year');
  if(yearEl) yearEl.textContent = new Date().getFullYear();

  // apply theme from localStorage
  function applyTheme(t){
    body.setAttribute('data-theme', t || 'light');
    localStorage.setItem('nova_theme', t);
  }
  const saved = localStorage.getItem('nova_theme') || 'light';
  applyTheme(saved);
  if(themeSelect) themeSelect.value = saved;
  if(themeSelect) themeSelect.addEventListener('change', ()=> applyTheme(themeSelect.value));

  // history helpers (same as original)
  function addHistory(item){
    const rows = JSON.parse(localStorage.getItem('nova_history')||'[]');
    const row = { ts: new Date().toISOString(), ...item };
    rows.unshift(row);
    localStorage.setItem('nova_history', JSON.stringify(rows.slice(0,200)));
    if(window.renderHistory) window.renderHistory();
  }
  window.addHistory = addHistory;

  // export snapshot
  const downloadSnapshot = document.getElementById('downloadSnapshot');
  if(downloadSnapshot) downloadSnapshot.addEventListener('click', ()=>{
    const data = {
      theme: body.getAttribute('data-theme'),
      history: JSON.parse(localStorage.getItem('nova_history')||'[]')
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], {type:'application/json'});
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = 'nova_snapshot.json'; a.click();
    URL.revokeObjectURL(url);
  });

  // simple sign in status
  const signinBtn = document.getElementById('signinBtn');
  if(localStorage.getItem('nova_user') && signinBtn) signinBtn.textContent = 'Signed in';

  // render history if page has table
  window.renderHistory = function(){
    const tbody = document.querySelector('#historyTable tbody');
    if(!tbody) return;
    const rows = JSON.parse(localStorage.getItem('nova_history')||'[]');
    tbody.innerHTML = '';
    rows.forEach(r => {
      const tr = document.createElement('tr');
      tr.innerHTML = `<td>${new Date(r.ts).toLocaleString()}</td>
      <td>${r.device||''}</td>
      <td>${r.temp||''}</td>
      <td>${r.level||''}</td>
      <td>${r.rain||''}</td>
      <td>${r.servo||''}</td>
      <td>${r.raw||''}</td>`;
      tbody.appendChild(tr);
    });
  };
  window.renderHistory();

  // wire up clear/export buttons
  const clearBtn = document.getElementById('clearHistory');
  if(clearBtn) clearBtn.addEventListener('click', ()=> { localStorage.removeItem('nova_history'); window.renderHistory(); });
  const exportBtn = document.getElementById('exportHistory');
  if(exportBtn) exportBtn.addEventListener('click', ()=>{
    const rows = JSON.parse(localStorage.getItem('nova_history')||'[]');
    const csv = ['Date,Device,Temp,Level,Rain,Servo,Raw', ...rows.map(r => {
      return `"${new Date(r.ts).toLocaleString()}","${r.device||''}",${r.temp||''},"${r.level||''}","${r.rain||''}","${r.servo||''}","${r.raw||''}"`;
    })].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = 'nova_history.csv'; a.click();
    URL.revokeObjectURL(url);
  });

});