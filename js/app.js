// js/app.js
// Production v6.0 - Fix GVG Styles (Inline Tailwind) & Activity Search

// 1. 強制檢查 Config
if (typeof window.AppConfig === 'undefined') {
    console.error("Config not loaded.");
    document.body.innerHTML = '<div style="padding: 50px; text-align: center; color: red; font-size: 20px; font-weight: bold;">錯誤：config.js 未載入。<br><span style="font-size:14px; color:black;">請檢查 HTML 檔案，確認 config.js 放在 app.js 之前。</span></div>';
    throw new Error("Critical Error: AppConfig is missing.");
}

const Cfg = window.AppConfig;
const { COLLECTION_NAMES, SEED_DATA, SEED_GROUPS, SEED_ACTIVITIES, JOB_STRUCTURE, JOB_STYLES } = Cfg;

const App = {
    db: null, auth: null,
    members: [], groups: [], activities: [], history: [],
    raidThemes: ['GVG 攻城戰', '公會副本', '野外王'], 
    currentTab: 'home', 
    currentFilter: 'all', currentJobFilter: 'all', 
    
    currentSquadRoleFilter: 'all', 
    currentModalRoleFilter: 'all', 
    currentSquadDateFilter: 'all', 
    currentSquadSubjectFilter: 'all',

    mode: 'demo', userRole: 'guest',
    currentSquadMembers: [], currentActivityWinners: [], tempWinnerSelection: [],
    leaves: [], 
    BASE_TIME: new Date('2023-01-01').getTime(),
    CLEANUP_DAYS: 14, 

    init: async function() {
        try {
            this.loadLocalState();
            this.initFirebase();
            this.updateAdminUI();
            this.populateJobSelects();
            this.switchTab('home'); 
        } catch (e) { console.error("App Init Error:", e); }
    },

    normalizeMemberData: function(m) {
        const seedList = Cfg.SEED_DATA || [];
        const seedIndex = seedList.findIndex(seed => seed.id === m.id);
        if (seedIndex !== -1) return { ...m, createdAt: this.BASE_TIME + (seedIndex * 1000) };
        return { ...m, createdAt: m.createdAt || Date.now() };
    },

    loadLocalState: function() {
        const savedRole = localStorage.getItem('row_user_role');
        if (savedRole && ['admin', 'master', 'commander'].includes(savedRole)) this.userRole = savedRole;
        
        const storedMem = localStorage.getItem('row_local_members');
        const storedGrp = localStorage.getItem('row_local_groups');
        const storedAct = localStorage.getItem('row_local_activities');
        const storedLeaves = localStorage.getItem('row_local_leaves');
        const storedHistory = localStorage.getItem('row_mod_history');
        const storedThemes = localStorage.getItem('row_local_themes');
        
        this.members = storedMem ? JSON.parse(storedMem).map(m => this.normalizeMemberData(m)) : (Cfg.SEED_DATA || []).map(m => this.normalizeMemberData(m));
        this.groups = storedGrp ? JSON.parse(storedGrp) : (Cfg.SEED_GROUPS || []);
        this.activities = storedAct ? JSON.parse(storedAct) : (Cfg.SEED_ACTIVITIES || []);
        this.leaves = storedLeaves ? JSON.parse(storedLeaves) : [];
        this.history = storedHistory ? JSON.parse(storedHistory) : [];
        if (storedThemes) this.raidThemes = JSON.parse(storedThemes);
        
        this.cleanOldHistory();
        this.members = this.sortMembers(this.members);
    },

    initFirebase: function() {
        let config = null;
        const storedConfig = localStorage.getItem('row_firebase_config');
        try { if (storedConfig) config = JSON.parse(storedConfig); else if (Cfg.FIREBASE_CONFIG && Cfg.FIREBASE_CONFIG.apiKey) config = Cfg.FIREBASE_CONFIG; } catch (e) {}
        if (config && config.apiKey) {
            try {
                if (typeof firebase !== 'undefined' && !firebase.apps.length) {
                    firebase.initializeApp(config);
                    this.auth = firebase.auth();
                    this.db = firebase.firestore();
                    this.mode = 'firebase';
                    this.syncWithFirebase();
                } else if (typeof firebase === 'undefined') { console.warn("Firebase SDK missing."); this.mode = 'demo'; }
            } catch (e) { console.error(e); this.mode = 'demo'; }
        } else { this.mode = 'demo'; }
    },
    
    syncWithFirebase: function() {
        if (!this.db || this.mode !== 'firebase') return;
        const cols = Cfg.COLLECTION_NAMES; if(!cols) return; 
        this.db.collection(cols.MEMBERS).onSnapshot(snap => { const rawArr = []; snap.forEach(d => rawArr.push({ id: d.id, ...d.data() })); this.members = this.sortMembers(rawArr.map(m => this.normalizeMemberData(m))); this.saveLocal('members'); this.render(); });
        this.db.collection(cols.GROUPS).onSnapshot(snap => { const arr = []; snap.forEach(d => arr.push({ id: d.id, ...d.data() })); this.groups = arr; this.saveLocal('groups'); this.render(); });
        this.db.collection(cols.ACTIVITIES).onSnapshot(snap => { const arr = []; snap.forEach(d => arr.push({ id: d.id, ...d.data() })); this.activities = arr; this.saveLocal('activities'); this.render(); });
        this.db.collection('leaves').onSnapshot(snap => { const arr = []; snap.forEach(d => { arr.push({ ...d.data(), id: d.id }); }); this.leaves = arr; this.saveLocal('leaves'); this.renderLeaveList(); });
        this.db.collection('history').orderBy('timestamp', 'desc').limit(50).onSnapshot(snap => { const arr = []; snap.forEach(d => arr.push(d.data())); this.history = arr; this.saveLocal('history'); if(document.getElementById('historyModal') && !document.getElementById('historyModal').classList.contains('hidden')) { this.showHistoryModal(); } });
    },

    sortMembers: function(membersArray) {
        return membersArray.sort((a, b) => {
            const timeA = a.createdAt || 0, timeB = b.createdAt || 0;
            if (timeA !== timeB) return timeA - timeB; 
            return (a.id || '').localeCompare(b.id || '');
        });
    },

    saveLocal: function(key = 'all') {
        if (this.mode === 'demo') {
            if (key === 'members' || key === 'all') localStorage.setItem('row_local_members', JSON.stringify(this.members));
            if (key === 'groups' || key === 'all') localStorage.setItem('row_local_groups', JSON.stringify(this.groups));
            if (key === 'activities' || key === 'all') localStorage.setItem('row_local_activities', JSON.stringify(this.activities));
            if (key === 'leaves' || key === 'all') localStorage.setItem('row_local_leaves', JSON.stringify(this.leaves));
            if (key === 'themes' || key === 'all') localStorage.setItem('row_local_themes', JSON.stringify(this.raidThemes));
            localStorage.setItem('row_mod_history', JSON.stringify(this.history));
            this.render();
        }
    },
    
    cleanOldHistory: function() {
        const now = Date.now();
        const cutoff = now - (this.CLEANUP_DAYS * 24 * 60 * 60 * 1000);
        this.history = this.history.filter(log => log.timestamp >= cutoff);
        if (this.mode === 'demo') this.saveLocal('history'); 
    },
    
    logChange: function(action, details, targetId) {
        const log = { timestamp: Date.now(), user: this.userRole, action, details, targetId: targetId || 'N/A' };
        if (this.mode === 'firebase' && this.db) { this.db.collection('history').add(log); } 
        else { this.cleanOldHistory(); this.history.unshift(log); this.saveLocal('history'); }
    },

    openLoginModal: function() {
        if(this.userRole !== 'guest') { if(confirm("確定要登出嗎？")) { this.userRole = 'guest'; localStorage.removeItem('row_user_role'); this.updateAdminUI(); this.switchTab('home'); } } 
        else { document.getElementById('loginForm').reset(); this.showModal('loginModal'); }
    },

    handleLogin: function() {
        const u = document.getElementById('loginUser').value, p = document.getElementById('loginPass').value;
        let role = 'guest';
        if (u === 'poppy' && p === '123456') role = 'master';
        else if (u === 'yuan' && p === '123456') role = 'admin';
        else if (u === 'commander' && p === '123456') role = 'commander';
        else { alert("帳號或密碼錯誤"); return; }
        this.userRole = role; localStorage.setItem('row_user_role', this.userRole);
        this.closeModal('loginModal'); this.updateAdminUI(); alert(`登入成功！身分：${role}`);
    },
    
    updateAdminUI: function() {
        const btn = document.getElementById('adminToggleBtn'), adminControls = document.getElementById('adminControls');
        if (btn) {
            if(this.userRole !== 'guest') { btn.classList.add('admin-mode-on'); btn.innerHTML = '<i class="fas fa-sign-out-alt"></i>'; } 
            else { btn.classList.remove('admin-mode-on'); btn.innerHTML = '<i class="fas fa-user-shield"></i>'; }
        }
        if (['master', 'admin'].includes(this.userRole)) { if(adminControls) adminControls.classList.remove('hidden'); } else { if(adminControls) adminControls.classList.add('hidden'); }
        const rankSelect = document.getElementById('rank'), lockIcon = document.getElementById('rankLockIcon');
        if (this.userRole === 'master') { if (rankSelect) rankSelect.disabled = false; if (lockIcon) lockIcon.className = "fas fa-unlock text-blue-500 text-xs ml-2"; } 
        else { if (rankSelect) rankSelect.disabled = true; if (lockIcon) lockIcon.className = "fas fa-lock text-slate-300 text-xs ml-2"; }
        const addSubBtn = document.getElementById('addSubjectBtn'), delSubBtn = document.getElementById('delSubjectBtn');
        if (addSubBtn) { if (this.userRole === 'master') addSubBtn.classList.remove('hidden'); else addSubBtn.classList.add('hidden'); }
        if (delSubBtn) { if (this.userRole === 'master') delSubBtn.classList.remove('hidden'); else delSubBtn.classList.add('hidden'); }
        this.render();
    },

    switchTab: function(tab) {
        this.currentTab = tab;
        ['home','members','groups','activity', 'leave'].forEach(v => { const el = document.getElementById('view-'+v); if(el) el.classList.add('hidden'); });
        
        if(tab === 'gvg' || tab === 'groups') { 
            const groupView = document.getElementById('view-groups'); 
            if(groupView) groupView.classList.remove('hidden'); 
            const titleEl = document.getElementById('groupViewTitle');
            const panelEl = document.getElementById('groupControlPanel');
            const squadModalTitle = document.getElementById('squadModalTitle');
            
            if(tab === 'gvg') {
                if(titleEl) titleEl.innerText = '團體戰分組';
                if(squadModalTitle) squadModalTitle.innerText = '團體戰管理';
                if(panelEl) { panelEl.classList.remove('border-l-green-500'); panelEl.classList.add('border-l-red-500'); }
            } else {
                if(titleEl) titleEl.innerText = '固定團列表';
                if(squadModalTitle) squadModalTitle.innerText = '固定團管理';
                if(panelEl) { panelEl.classList.remove('border-l-red-500'); panelEl.classList.add('border-l-green-500'); }
            }
        } else { const targetView = document.getElementById('view-'+tab); if(targetView) targetView.classList.remove('hidden'); }
        
        const navContainer = document.getElementById('nav-container');
        if(navContainer) navContainer.classList.toggle('hidden', tab === 'home');
        document.querySelectorAll('.nav-pill').forEach(b => b.classList.remove('active'));
        const activeBtn = document.getElementById('tab-' + tab); if(activeBtn) activeBtn.classList.add('active');
        
        const adminWarning = document.getElementById('adminWarning');
        if (tab === 'gvg' && !['master', 'admin', 'commander'].includes(this.userRole)) { if(adminWarning) adminWarning.classList.remove('hidden'); } else { if(adminWarning) adminWarning.classList.add('hidden'); }
        
        const activityWarning = document.getElementById('activityAdminWarning'), addActivityBtn = document.getElementById('addActivityBtn');
        if (tab === 'activity') {
            if (this.userRole === 'master') { if(addActivityBtn) addActivityBtn.classList.remove('hidden'); if(activityWarning) activityWarning.classList.add('hidden'); } 
            else { if(addActivityBtn) addActivityBtn.classList.add('hidden'); if(activityWarning) activityWarning.classList.remove('hidden'); }
        }
        
        if (tab === 'leave') this.initLeaveForm();
        this.render();
    },

    handleMainAction: function() { 
        if(this.currentTab === 'members') this.openAddModal();
        else if(this.currentTab === 'gvg' || this.currentTab === 'groups') {
            if(['master', 'admin', 'commander'].includes(this.userRole)) this.openSquadModal(); 
            else alert("權限不足：僅有管理人員可建立隊伍");
        }
        else if(this.currentTab === 'activity') {
            if(this.userRole === 'master') this.openActivityModal();
            else alert("權限不足：僅有會長可建立活動");
        }
    },
    
    render: function() {
        if (this.currentTab === 'members') this.renderMembers();
        else if (this.currentTab === 'gvg' || this.currentTab === 'groups') this.renderSquads();
        else if (this.currentTab === 'activity') this.renderActivities();
        const cnt = document.querySelector('#view-home .ro-menu-btn .ro-btn-content p'); if (cnt) cnt.innerText = `Guild Members (${this.members.length})`;
    },

    toggleLeaveForm: function() { document.getElementById('leaveFormContainer').classList.toggle('hidden'); },
    togglePreLeaveMode: function() {
        const isPre = document.getElementById('isPreLeave').checked;
        const subSelect = document.getElementById('leaveSubjectSelect'), arrow = document.getElementById('subjectArrow'), searchInput = document.getElementById('preLeaveSearchInput');
        if (isPre) {
            subSelect.innerHTML = '<option value="PRE_LEAVE" selected>全日 (不分主題)</option>'; subSelect.disabled = true; subSelect.classList.add('bg-orange-50', 'text-orange-500');
            if(arrow) arrow.classList.add('hidden'); if(searchInput) { searchInput.classList.remove('hidden'); searchInput.value = ''; searchInput.focus(); }
            this.renderPreLeaveOptions('');
        } else {
            subSelect.classList.remove('bg-orange-50', 'text-orange-500'); if(arrow) arrow.classList.remove('hidden'); if(searchInput) searchInput.classList.add('hidden');
            this.updateLeaveSubjectSelect(); 
        }
    },
    renderPreLeaveOptions: function(searchTerm = "") {
        const memSelect = document.getElementById('leaveMemberSelect'); memSelect.disabled = false; memSelect.innerHTML = '<option value="" disabled selected>選擇人員...</option>';
        const term = searchTerm.toLowerCase(); const sorted = [...this.members].sort((a,b) => a.gameName.localeCompare(b.gameName));
        const filtered = sorted.filter(m => m.gameName.toLowerCase().includes(term) || (m.lineName && m.lineName.toLowerCase().includes(term)));
        if (filtered.length === 0) { memSelect.innerHTML = '<option value="" disabled>無符合搜尋結果</option>'; } 
        else { filtered.forEach(m => { memSelect.innerHTML += `<option value="${m.id}">${m.gameName}</option>`; }); }
    },
    initLeaveForm: function() {
        const d = document.getElementById('leaveDateInput'), n = document.getElementById('leaveNote'), s = document.getElementById('leaveSubjectSelect'), m = document.getElementById('leaveMemberSelect');
        d.value = new Date().toISOString().split('T')[0]; n.value = ''; s.innerHTML = '<option value="" disabled selected>請先選日期</option>'; s.disabled = true; m.innerHTML = '<option value="" disabled selected>請先選主題</option>'; m.disabled = true;
        document.getElementById('isPreLeave').checked = false; document.getElementById('leaveFormContainer').classList.add('hidden'); document.getElementById('leaveSuccessMsg').classList.add('hidden');
        const searchInput = document.getElementById('preLeaveSearchInput'); if(searchInput) searchInput.classList.add('hidden');
        const fs = document.getElementById('leaveFilterSubject'); if(fs) { let opts = '<option value="">所有主題</option>'; opts += '<option value="預先請假">預先請假</option>'; opts += this.raidThemes.map(t => `<option value="${t}">${t}</option>`).join(''); fs.innerHTML = opts; }
        const filterDateInput = document.getElementById('leaveFilterDate'); if(filterDateInput) filterDateInput.value = '';
        this.updateLeaveSubjectSelect(); this.renderLeaveList();
    },
    updateLeaveSubjectSelect: function() {
        if(document.getElementById('isPreLeave').checked) return;
        const date = document.getElementById('leaveDateInput').value, s = document.getElementById('leaveSubjectSelect'); s.innerHTML = '<option value="" disabled selected>請選擇主題...</option>';
        if (!date) { s.disabled = true; return; }
        const activeSubjects = new Set(); this.groups.filter(g => g.type === 'gvg' && g.date === date).forEach(g => { if (g.subject) activeSubjects.add(g.subject); });
        if (activeSubjects.size === 0) { s.innerHTML = '<option value="" disabled selected>該日無活動 (可選預先請假)</option>'; s.disabled = true; } 
        else { activeSubjects.forEach(sub => s.innerHTML += `<option value="${sub}">${sub}</option>`); s.disabled = false; }
    },
    updateLeaveMemberSelect: function() {
        if(document.getElementById('isPreLeave').checked) return; 
        const date = document.getElementById('leaveDateInput').value, sub = document.getElementById('leaveSubjectSelect').value, m = document.getElementById('leaveMemberSelect'); m.innerHTML = '<option value="" disabled selected>選擇人員...</option>';
        if (!date || !sub) { m.disabled = true; return; }
        const tg = this.groups.filter(g => g.type === 'gvg' && g.date === date && g.subject === sub);
        const validMembers = new Set(); tg.forEach(g => g.members.forEach(mm => validMembers.add(typeof mm === 'string' ? mm : mm.id)));
        if (validMembers.size === 0) { m.disabled = true; } else { m.disabled = false; validMembers.forEach(mid => { const mem = this.members.find(x => x.id === mid); if (mem) { let isLeave = false; for(let g of tg) { const mObj = g.members.find(gm => (typeof gm === 'string' ? gm : gm.id) === mid); if (typeof mObj === 'object' && mObj.status === 'leave') isLeave = true; } m.innerHTML += `<option value="${mid}">${mem.gameName} ${isLeave ? '(已請假)' : ''}</option>`; } });}
    },
    handleLeaveSubmit: function() {
        const d = document.getElementById('leaveDateInput').value, n = document.getElementById('leaveNote').value, mid = document.getElementById('leaveMemberSelect').value;
        const isPre = document.getElementById('isPreLeave').checked; const s = isPre ? '預先請假' : document.getElementById('leaveSubjectSelect').value;
        if (!d || !mid) { alert("請完整填寫日期與人員"); return; } if (!isPre && !s) { alert("請選擇主題"); return; }
        let success = false; const memName = this.members.find(m => m.id === mid)?.gameName || mid;
        if (isPre) { const leaveId = 'l_' + Date.now(); const newLeave = { id: leaveId, memberId: mid, date: d, note: n, type: 'pre-leave' }; if (this.mode === 'firebase') { this.db.collection('leaves').doc(leaveId).set(newLeave); } else { this.leaves.push(newLeave); this.saveLocal('leaves'); } success = true; } 
        else { const targetGroups = this.groups.filter(g => g.type === 'gvg' && g.date === d && g.subject === s); if (targetGroups.length === 0) { alert("找不到該主題的隊伍"); return; } targetGroups.forEach(group => { const idx = group.members.findIndex(m => (typeof m === 'string' ? m : m.id) === mid); if (idx !== -1) { let m = group.members[idx]; if (typeof m === 'string') { m = { id: m, status: 'leave', subId: null, leaveDate: d, leaveNote: n }; } else { m.status = 'leave'; m.leaveDate = d; m.leaveNote = n; } group.members[idx] = m; this.saveGroupUpdate(group); success = true; } }); }
        if (success) { this.logChange('新增請假', `${d} ${s} - ${n}`, memName); const msg = document.getElementById('leaveSuccessMsg'); msg.classList.remove('hidden'); setTimeout(() => msg.classList.add('hidden'), 3000); this.toggleLeaveForm(); this.renderLeaveList(); } else { alert("發生錯誤：無法寫入請假紀錄"); }
    },
    renderLeaveList: function() {
        const container = document.getElementById('leaveListGrid'), noMsg = document.getElementById('noLeaveMsg');
        const sName = document.getElementById('leaveSearch').value.toLowerCase(), fDate = document.getElementById('leaveFilterDate').value, fSub = document.getElementById('leaveFilterSubject').value;
        let allLeaves = [];
        this.groups.forEach(g => { if (!g.members || g.type !== 'gvg') return; g.members.forEach(m => { const isObj = typeof m !== 'string'; if (isObj && m.status === 'leave') { const memProfile = this.members.find(x => x.id === m.id); if (memProfile) { allLeaves.push({ source: 'group', groupId: g.id, groupName: g.name, subject: g.subject || 'GVG 攻城戰', date: g.date || '未設定', memberId: memProfile.id, gameName: memProfile.gameName, mainClass: memProfile.mainClass, note: m.leaveNote || '', subId: m.subId }); } } }); });
        this.leaves.forEach(l => { const memProfile = this.members.find(x => x.id === l.memberId); if (memProfile) { allLeaves.push({ source: 'pre', id: l.id, groupName: '全日請假', subject: '預先請假', date: l.date, memberId: memProfile.id, gameName: memProfile.gameName, mainClass: memProfile.mainClass, note: l.note || '', subId: null }); } });
        const filtered = allLeaves.filter(L => { const matchName = L.gameName.toLowerCase().includes(sName); const matchDate = fDate ? L.date === fDate : true; const matchSubject = fSub ? (fSub === '預先請假' ? L.source === 'pre' : L.subject === fSub) : true; return matchName && matchDate && matchSubject; });
        filtered.sort((a, b) => new Date(b.date) - new Date(a.date)); document.getElementById('leaveCountBadge').innerText = `${filtered.length} 人`;
        if (filtered.length === 0) { container.innerHTML = ''; noMsg.classList.remove('hidden'); return; } noMsg.classList.add('hidden');
        container.innerHTML = filtered.map(L => {
            const subMem = L.subId ? this.members.find(m => m.id === L.subId) : null;
            const subText = subMem ? `<span class="text-blue-600"><i class="fas fa-exchange-alt mr-1"></i>替補: ${subMem.gameName}</span>` : (L.source==='pre' ? '-' : '<span class="text-red-400">尚未指定替補</span>');
            const safeGameName = (L.gameName || '').replace(/'/g, "\\'").replace(/"/g, '&quot;');
            const deleteAction = L.source === 'group' ? `app.cancelLeave('${L.groupId}', '${L.memberId}', '${safeGameName}')` : `app.cancelPreLeave('${L.id}', '${safeGameName}')`;
            return `<div class="bg-white p-4 rounded-xl shadow-sm border-l-4 ${L.source==='pre'?'border-l-gray-500':'border-l-orange-500'} flex justify-between items-start relative overflow-hidden"><div class="absolute right-0 top-0 p-2 opacity-10 text-6xl text-orange-200"><i class="fas fa-coffee"></i></div><div class="relative z-10"><div class="flex items-center gap-2 mb-1"><span class="font-bold text-slate-800 text-lg">${L.gameName}</span><span class="text-xs bg-slate-100 text-slate-500 px-2 py-0.5 rounded">${L.mainClass.split('(')[0]}</span></div><div class="text-xs text-slate-500 font-bold mb-1"><span class="bg-slate-100 px-1 rounded mr-1">${L.subject}</span> ${L.groupName}</div><div class="text-sm bg-orange-50 text-orange-800 px-3 py-2 rounded-lg inline-block mb-2"><div class="font-bold flex items-center"><i class="far fa-calendar-alt mr-2"></i>${L.date}</div><div class="text-xs mt-1 opacity-80">${L.note || '無備註'}</div></div><div class="text-xs font-bold bg-white border border-slate-100 rounded px-2 py-1 w-fit shadow-sm">${subText}</div></div><button onclick="${deleteAction}" class="text-slate-300 hover:text-red-500 p-2 transition z-20" title="取消請假"><i class="fas fa-times"></i></button></div>`;
        }).join('');
    },
    cancelLeave: function(groupId, memberId, memberName) { if (!confirm(`確定要取消 ${memberName} 的請假紀錄嗎？`)) return; const group = this.groups.find(g => g.id === groupId); if (!group) return; const idx = group.members.findIndex(m => (typeof m === 'string' ? m : m.id) === memberId); if (idx === -1) return; let m = group.members[idx]; m.status = 'pending'; m.leaveDate = null; m.leaveNote = null; group.members[idx] = m; this.saveGroupUpdate(group); this.logChange('取消請假', `已取消 ${memberName} 在 ${group.name} 的請假`, memberId); this.renderLeaveList(); },
    cancelPreLeave: function(leaveId, memberName) { if (!confirm(`確定要取消 ${memberName} 的預先請假嗎？`)) return; if (this.mode === 'firebase') { this.db.collection('leaves').doc(leaveId).delete().then(() => { this.leaves = this.leaves.filter(l => l.id !== leaveId); this.logChange('取消預假', `已取消 ${memberName} 的預先請假`, 'N/A'); this.renderLeaveList(); }).catch(err => { alert("刪除失敗：" + err); }); } else { this.leaves = this.leaves.filter(l => l.id !== leaveId); this.saveLocal('leaves'); this.logChange('取消預假', `已取消 ${memberName} 的預先請假`, 'N/A'); this.renderLeaveList(); } },

    renderMembers: function() { const grid = document.getElementById('memberGrid'); const searchVal = document.getElementById('searchInput').value.toLowerCase(); let filtered = this.members.filter(item => { const fullText = (item.lineName + item.gameName + item.mainClass + item.role + (item.intro||"")).toLowerCase(); return fullText.includes(searchVal) && (this.currentFilter === 'all' || item.role.includes(this.currentFilter) || (this.currentFilter === '坦' && item.mainClass.includes('坦'))) && (this.currentJobFilter === 'all' || (item.mainClass||"").startsWith(this.currentJobFilter)); }); document.getElementById('memberCount').innerText = `Total: ${filtered.length}`; ['dps','sup','tank'].forEach(k => document.getElementById('stat-'+k).innerText = this.members.filter(d => d.role.includes(k==='dps'?'輸出':k==='sup'?'輔助':'坦')).length); grid.innerHTML = filtered.map((item, idx) => this.createCardHTML(item, idx)).join(''); },
    createCardHTML: function(item, idx) { const mainJob = item.mainClass ? item.mainClass.split('(')[0] : ''; const style = Cfg.JOB_STYLES.find(s => s.key.some(k => mainJob.includes(k))) || { class: 'bg-job-default', icon: 'fa-user' }; let rankBadge = item.rank === '會長' ? `<span class="rank-badge rank-master">會長</span>` : item.rank === '指揮官' ? `<span class="rank-badge rank-commander">指揮官</span>` : item.rank === '資料管理員' ? `<span class="rank-badge rank-admin">管理</span>` : ''; const memberSquads = this.groups.filter(g => g.members.some(m => (typeof m === 'string' ? m : m.id) === item.id)); const squadBadges = memberSquads.map(s => { const color = s.type === 'gvg' ? 'bg-red-50 text-red-600 border-red-100' : 'bg-green-50 text-green-600 border-green-100'; return `<span class="${color} text-[10px] px-1.5 rounded border truncate inline-block max-w-[80px]">${s.name}</span>`; }).join(''); const getRoleBadge = (r) => r.includes('輸出') ? `<span class="tag tag-dps">${r}</span>` : r.includes('坦') ? `<span class="tag tag-tank">${r}</span>` : r.includes('輔助') ? `<span class="tag tag-sup">${r}</span>` : ''; return `<div class="card member-card border-l-4 ${style.class.replace('bg-', 'border-')}" onclick="app.openEditModal('${item.id}')"><div class="job-icon-box"><i class="fas ${style.icon} opacity-80 group-hover:scale-110 transition"></i></div><div class="flex-grow p-2.5 flex flex-col justify-between min-w-0"><div><div class="flex justify-between items-start pr-6"><div class="flex items-center gap-1 min-w-0">${rankBadge}<h3 class="font-bold text-slate-700 text-base truncate">${item.gameName || '未命名'}</h3></div>${getRoleBadge(item.role)}</div><div class="text-xs font-bold text-slate-400 mt-0.5">${item.mainClass || '未定'}</div></div><div class="flex justify-between items-end mt-1"><div class="flex flex-col gap-1 w-full mr-1"><div class="flex items-center text-[10px] text-slate-400 font-mono bg-white border border-slate-100 rounded px-1.5 py-0.5 w-fit hover:bg-slate-50 copy-tooltip" onclick="event.stopPropagation(); app.copyText(this, '${item.lineName}')"><i class="fab fa-line mr-1 text-green-500"></i> ${item.lineName}</div><div class="tag-area">${squadBadges}</div></div>${item.intro ? `<i class="fas fa-info-circle text-blue-200 hover:text-blue-500" title="${item.intro}"></i>` : ''}</div></div></div>`; },
    setFilter: function(f) { this.currentFilter = f; document.querySelectorAll('.filter-btn').forEach(b => b.className = (b.innerText.includes(f==='all'?'全部':f)||(f==='坦'&&b.innerText.includes('坦克'))||(f==='待定'&&b.innerText.includes('待定'))) ? "px-4 py-1.5 rounded-full text-sm font-bold bg-slate-800 text-white transition whitespace-nowrap filter-btn active shadow-md" : "px-4 py-1.5 rounded-full text-sm font-bold bg-white text-slate-600 border border-slate-200 hover:bg-blue-50 transition whitespace-nowrap filter-btn"); this.renderMembers(); },
    setJobFilter: function(j) { this.currentJobFilter = j; this.renderMembers(); },
    setSquadRoleFilter: function(f) { this.currentSquadRoleFilter = f; this.renderSquads(); },
    setModalRoleFilter: function(f) { this.currentModalRoleFilter = f; this.renderSquadMemberSelect(); const btns = document.querySelectorAll('#modalFilterContainer button'); btns.forEach(b => { const isActive = (b.getAttribute('data-filter') === f); const activeClass = b.getAttribute('data-active-class'); b.className = isActive ? `px-3 py-1 rounded text-xs font-bold shadow-sm transition whitespace-nowrap active:scale-95 ${activeClass}` : `px-3 py-1 rounded text-xs font-bold bg-white text-slate-600 border border-slate-200 hover:bg-slate-50 transition whitespace-nowrap`; }); },
    setSquadDateFilter: function(val) { this.currentSquadDateFilter = val; this.renderSquads(); },
    setSquadSubjectFilter: function(val) { this.currentSquadSubjectFilter = val; this.renderSquads(); },
    populateJobSelects: function() { const baseSelect = document.getElementById('baseJobSelect'), filterSelect = document.getElementById('filterJob'); if(baseSelect) { baseSelect.innerHTML = '<option value="" disabled selected>選擇職業</option>'; Object.keys(Cfg.JOB_STRUCTURE).forEach(j => baseSelect.innerHTML += `<option value="${j}">${j}</option>`); } if(filterSelect) { filterSelect.innerHTML = '<option value="all">所有職業</option>'; Object.keys(Cfg.JOB_STRUCTURE).forEach(j => filterSelect.innerHTML += `<option value="${j}">${j}</option>`); } },
    updateSubJobSelect: function() { const b = document.getElementById('baseJobSelect').value, s = document.getElementById('subJobSelect'); s.innerHTML = '<option value="" disabled selected>選擇流派</option>'; if (Cfg.JOB_STRUCTURE[b]) { s.disabled = false; Cfg.JOB_STRUCTURE[b].forEach(sub => s.innerHTML += `<option value="${b}(${sub})">${sub}</option>`); } else s.disabled = true; },
    toggleJobInputMode: function() { document.getElementById('subJobInput').classList.toggle('hidden'); document.getElementById('subJobSelectWrapper').classList.toggle('hidden'); },
    
    openAddModal: function() { document.getElementById('memberForm').reset(); document.getElementById('editId').value = ''; document.getElementById('deleteBtnContainer').innerHTML = ''; document.getElementById('baseJobSelect').value = ""; this.updateSubJobSelect(); document.getElementById('subJobSelectWrapper').classList.remove('hidden'); document.getElementById('subJobInput').classList.add('hidden'); app.showModal('editModal'); },
    openEditModal: function(id) {
        const item = this.members.find(d => d.id === id); if (!item) return;
        document.getElementById('editId').value = item.id;
        document.getElementById('lineName').value = item.lineName; document.getElementById('gameName').value = item.gameName;
        document.getElementById('role').value = item.role.split(/[ ,]/)[0]||'待定'; document.getElementById('rank').value = item.rank || '成員'; document.getElementById('intro').value = item.intro;
        const baseSelect = document.getElementById('baseJobSelect'), subSelect = document.getElementById('subJobSelect'), subInput = document.getElementById('subJobInput'), wrapper = document.getElementById('subJobSelectWrapper'), btn = document.getElementById('toggleJobBtn');
        const fullJob = item.mainClass || '', match = fullJob.match(/^([^(]+)\(([^)]+)\)$/);
        if (['master', 'admin'].includes(this.userRole)) btn.classList.remove('hidden'); else btn.classList.add('hidden');
        subInput.classList.add('hidden'); wrapper.classList.remove('hidden');
        if (match && Cfg.JOB_STRUCTURE[match[1]]) { baseSelect.value = match[1]; this.updateSubJobSelect(); subSelect.value = fullJob; }
        else { const potential = fullJob.split('(')[0]; if (Cfg.JOB_STRUCTURE[potential]) { baseSelect.value = potential; this.updateSubJobSelect(); subSelect.value = fullJob; } else if (['master', 'admin'].includes(this.userRole)) { baseSelect.value = ""; subInput.value = fullJob; subInput.classList.remove('hidden'); wrapper.classList.add('hidden'); } else { baseSelect.value = ""; subSelect.disabled = true; } }
        this.updateAdminUI(); document.getElementById('deleteBtnContainer').innerHTML = ['master', 'admin'].includes(this.userRole) ? `<button type="button" onclick="app.deleteMember('${item.id}')" class="text-red-500 text-sm hover:underline">刪除成員</button>` : '';
        app.showModal('editModal');
    },
    saveMemberData: async function() {
        const id = document.getElementById('editId').value;
        let mainClass = !document.getElementById('subJobInput').classList.contains('hidden') ? document.getElementById('subJobInput').value : document.getElementById('subJobSelect').value;
        const baseJob = document.getElementById('baseJobSelect').value;
        if ((!mainClass || mainClass === "選擇流派") && baseJob) mainClass = baseJob;
        if (!mainClass) mainClass = "待定";
        const memberData = { lineName: document.getElementById('lineName').value, gameName: document.getElementById('gameName').value, mainClass, role: document.getElementById('role').value, rank: document.getElementById('rank').value, intro: document.getElementById('intro').value };
        if (!id) { memberData.createdAt = Date.now(); await this.addMember(memberData); } else { const originalMember = this.members.find(m => m.id === id); memberData.createdAt = originalMember ? originalMember.createdAt : Date.now(); await this.updateMember(id, memberData); }
        this.logChange(id?'成員更新':'新增成員', `${memberData.gameName}`, id || memberData.gameName); this.closeModal('editModal');
    },
    addMember: async function(m) { if (this.mode === 'firebase') { await this.db.collection(Cfg.COLLECTION_NAMES.MEMBERS).add(m); } else { m.id = 'm_' + Date.now(); this.members.push(m); this.members = this.sortMembers(this.members); this.saveLocal('members'); } },
    updateMember: async function(id, m) { if (this.mode === 'firebase') { await this.db.collection(Cfg.COLLECTION_NAMES.MEMBERS).doc(id).update(m); } else { const idx = this.members.findIndex(d => d.id === id); if (idx !== -1) { this.members[idx] = { ...this.members[idx], ...m }; this.members = this.sortMembers(this.members); this.saveLocal('members'); } } },
    deleteMember: async function(id) {
        if (!['master', 'admin'].includes(this.userRole)) return; if (!confirm("確定要刪除這位成員嗎？")) return;
        if (this.mode === 'firebase') { await this.db.collection(Cfg.COLLECTION_NAMES.MEMBERS).doc(id).delete(); } 
        this.members = this.members.filter(d => d.id !== id); 
        this.groups.forEach(g => { g.members = g.members.filter(m => (typeof m === 'string' ? m : m.id) !== id); if (g.leaderId === id) { g.leaderId = null; } });
        this.activities.forEach(a => { a.winners = a.winners.map(w => { if (w.memberId === id) { return { ...w, memberId: id, isRetired: true }; } return w; }); });
        this.saveLocal();
        if (this.mode === 'firebase') { this.groups.forEach(async g => { await this.db.collection(Cfg.COLLECTION_NAMES.GROUPS).doc(g.id).update({ members: g.members, leaderId: g.leaderId }); }); this.activities.forEach(async a => { await this.db.collection(Cfg.COLLECTION_NAMES.ACTIVITIES).doc(a.id).update({ winners: a.winners }); }); }
        this.logChange('成員刪除', `ID: ${id}`, id); this.closeModal('editModal');
    },

    // 2. 修正 GVG 團體戰版面跑位 (關鍵修改：強制 Tailwind 樣式，不依賴外部 CSS)
    renderSquads: function() {
        const type = this.currentTab === 'gvg' ? 'gvg' : 'groups';
        const search = document.getElementById('groupSearchInput').value.toLowerCase();
        const canEdit = ['master', 'admin', 'commander'].includes(this.userRole);
        
        let allGroups = this.groups.filter(g => (g.type || 'gvg') === type);
        const uniqueDates = [...new Set(allGroups.map(g => g.date).filter(d => d))].sort().reverse();
        const themes = this.raidThemes;

        let visibleGroups = allGroups.filter(g => {
            const matchSearch = !search || g.name.toLowerCase().includes(search) || g.members.some(m => { 
                const mem = this.members.find(x => x.id === (typeof m === 'string' ? m : m.id)); 
                return mem && (mem.gameName.toLowerCase().includes(search) || (mem.mainClass||'').toLowerCase().includes(search) || (mem.role||'').includes(search)); 
            });
            const matchDate = this.currentSquadDateFilter === 'all' || g.date === this.currentSquadDateFilter;
            const matchSubject = this.currentSquadSubjectFilter === 'all' || (g.subject || 'GVG 攻城戰') === this.currentSquadSubjectFilter;
            return matchSearch && matchDate && matchSubject;
        });

        const grid = document.getElementById('squadGrid'), emptyMsg = document.getElementById('noSquadsMsg');
        grid.innerHTML = '';

        // [Fix] 強制佔滿整行 (col-span-full) 防止跑版
        const controlsContainer = document.createElement('div');
        controlsContainer.className = "col-span-1 lg:col-span-2 flex flex-col md:flex-row gap-3 mb-4 p-1 w-full";
        
        const dateOptions = uniqueDates.map(d => `<option value="${d}" ${this.currentSquadDateFilter === d ? 'selected' : ''}>${d}</option>`).join('');
        const dateSelectHTML = `<div class="relative min-w-[160px]"><div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400"><i class="far fa-calendar-alt"></i></div><select onchange="app.setSquadDateFilter(this.value)" class="pl-9 pr-4 py-2 w-full bg-white border border-slate-200 rounded-xl text-sm font-bold text-slate-700 outline-none focus:ring-2 focus:ring-blue-200 appearance-none shadow-sm cursor-pointer hover:bg-slate-50 transition"><option value="all">所有日期</option>${dateOptions}</select><div class="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-slate-400 text-xs"><i class="fas fa-chevron-down"></i></div></div>`;

        const subjectOptions = themes.map(t => `<option value="${t}" ${this.currentSquadSubjectFilter === t ? 'selected' : ''}>${t}</option>`).join('');
        const subjectSelectHTML = `<div class="relative min-w-[160px]"><div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400"><i class="fas fa-tag"></i></div><select onchange="app.setSquadSubjectFilter(this.value)" class="pl-9 pr-4 py-2 w-full bg-white border border-slate-200 rounded-xl text-sm font-bold text-slate-700 outline-none focus:ring-2 focus:ring-blue-200 appearance-none shadow-sm cursor-pointer hover:bg-slate-50 transition"><option value="all">所有主題</option>${subjectOptions}</select><div class="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-slate-400 text-xs"><i class="fas fa-chevron-down"></i></div></div>`;

        const filters = [{id: 'all', label: '全部', color: 'bg-slate-800 text-white'}, {id: '輸出', label: '輸出', color: 'bg-red-500 text-white'}, {id: '輔助', label: '輔助', color: 'bg-green-500 text-white'}, {id: '坦', label: '坦克', color: 'bg-blue-500 text-white'}];
        const roleBtnsHTML = `<div class="flex gap-2 overflow-x-auto pb-1 no-scrollbar flex-grow md:justify-end">` + filters.map(f => { const isActive = this.currentSquadRoleFilter === f.id; const styleClass = isActive ? f.color : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'; return `<button onclick="app.setSquadRoleFilter('${f.id}')" class="px-4 py-2 rounded-xl text-sm font-bold shadow-sm transition whitespace-nowrap active:scale-95 ${styleClass}">${f.label}</button>`; }).join('') + `</div>`;

        controlsContainer.innerHTML = dateSelectHTML + subjectSelectHTML + roleBtnsHTML;
        
        if (allGroups.length > 0 || this.currentSquadDateFilter !== 'all' || this.currentSquadSubjectFilter !== 'all') { 
            grid.appendChild(controlsContainer); 
        }

        if (visibleGroups.length === 0) { emptyMsg.classList.remove('hidden'); return; }
        emptyMsg.classList.add('hidden');

        const groupsHTML = visibleGroups.map(group => {
            const groupMembers = (group.members || []).map(m => { const id = typeof m === 'string' ? m : m.id; const status = typeof m === 'string' ? 'pending' : (m.status || 'pending'); const subId = typeof m === 'string' ? null : (m.subId || null); const mem = this.members.find(x => x.id === id); return mem ? { ...mem, status, subId } : null; }).filter(x => x);
            const isGVG = type === 'gvg';
            const list = groupMembers.map(m => {
                if (this.currentSquadRoleFilter !== 'all') { const filterKey = this.currentSquadRoleFilter; const match = m.role.includes(filterKey) || (filterKey === '坦' && m.mainClass.includes('坦')); if (!match) return ''; }
                const job = (m.mainClass || '').split('(')[0]; 
                let borderColor = 'border-l-slate-300', roleColor = 'text-slate-400';
                if (m.role.includes('輸出')) { borderColor = 'border-l-red-400'; roleColor = 'text-red-500'; }
                else if (m.role.includes('坦')) { borderColor = 'border-l-blue-400'; roleColor = 'text-blue-500'; }
                else if (m.role.includes('輔助')) { borderColor = 'border-l-green-400'; roleColor = 'text-green-500'; }

                let actionUI = "", rowClass = "";
                if (isGVG) {
                    if (m.status === 'leave') rowClass = "row-leave";
                    let subUI = "";
                    if (m.status === 'leave') {
                        if (canEdit) { 
                            let busyIds = [];
                            if (group.date) { this.groups.forEach(g => { if (g.type === (group.type||'gvg') && g.date === group.date && g.id !== group.id) { g.members.forEach(gm => { const mid = typeof gm === 'string' ? gm : gm.id; busyIds.push(mid); if (typeof gm === 'object' && gm.subId) { busyIds.push(gm.subId); } }); } }); }
                            const otherMembers = this.members.filter(x => { const inCurrent = groupMembers.some(gm => gm.id === x.id); const isBusy = busyIds.includes(x.id); const isMe = x.id === m.subId; if (isMe) return true; if (inCurrent) return false; if (isBusy) return false; return true; });
                            const options = otherMembers.map(om => `<option value="${om.id}" ${om.id === m.subId ? 'selected' : ''}>${om.gameName}</option>`).join(''); 
                            subUI = `<select class="sub-select" onchange="app.updateGvgSub('${group.id}', '${m.id}', this.value)" onclick="event.stopPropagation()"><option value="">選擇替補...</option>${options}</select>`; 
                        } else if (m.subId) { const subMem = this.members.find(x => x.id === m.subId); if (subMem) subUI = `<span class="text-blue-500 text-xs mr-2">⇋ ${subMem.gameName}</span>`; }
                    }
                    actionUI = `<div class="flex items-center gap-2">${subUI}<div class="gvg-light bg-light-yellow ${m.status === 'leave' ? 'active' : ''}" title="請假"></div><div class="gvg-light ${m.status === 'ready' ? 'bg-light-green active' : 'bg-light-red'}" title="狀態" onclick="event.stopPropagation(); app.toggleGvgStatus('${group.id}', '${m.id}', 'ready_toggle')"></div></div>`;
                } else { actionUI = `<span class="text-xs text-slate-300 font-mono">ID:${m.id.slice(-3)}</span>`; }

                return `<div class="flex items-center justify-between text-sm py-2.5 border-b border-slate-100 last:border-b-0 hover:bg-slate-50 px-3 transition border-l-4 ${borderColor} ${rowClass}"><div class="flex items-center gap-3 min-w-0"><div class="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-xs font-bold ${roleColor}">${m.role.substring(0,1)}</div><div class="flex flex-col min-w-0"><span class="text-slate-800 font-bold truncate member-name">${m.gameName}</span><span class="text-[10px] text-slate-400 font-mono">${job}</span></div></div>${actionUI}</div>`;
            }).join('');

            // [Fix] 直接使用 Tailwind 樣式，不再依賴不穩定的外部 class
            const headerClass = isGVG ? 'bg-red-50 p-4 border-b border-red-100 rounded-t-xl' : 'bg-blue-50 p-4 border-b border-blue-100 rounded-t-xl';
            const cardClass = isGVG ? 'bg-white rounded-xl shadow-md border border-slate-200 border-l-4 border-l-red-500 flex flex-col h-full' : 'bg-white rounded-xl shadow-sm border border-blue-100 flex flex-col h-full'; 
            
            const editBtn = canEdit ? `<button onclick="app.openSquadModal('${group.id}')" class="text-slate-400 hover:text-blue-600 p-1"><i class="fas fa-cog"></i></button>` : '';
            const copyBtn = `<button onclick="app.copySquadList('${group.id}')" class="text-slate-400 hover:text-green-600 p-1 ml-2" title="複製隊伍"><i class="fas fa-copy"></i></button>`;
            const leader = group.leaderId ? (this.members.find(m => m.id === group.leaderId)?.gameName || '未知') : '未指定';
            const dateBadge = group.date ? `<span class="text-[10px] bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full mr-2"><i class="far fa-calendar-alt mr-1"></i>${group.date}</span>` : '';
            const subjectBadge = group.subject ? `<span class="text-[10px] bg-purple-100 text-purple-800 px-2 py-0.5 rounded-full"><i class="fas fa-tag mr-1"></i>${group.subject}</span>` : '';
            let footer = "";
            if (isGVG) { const readyCount = groupMembers.filter(m => m.status === 'ready').length; const leaveCount = groupMembers.filter(m => m.status === 'leave').length; footer = `<div class="bg-white p-3 border-t border-slate-100 flex justify-between items-center shrink-0 text-xs font-bold text-slate-500 mt-auto rounded-b-xl"><span class="text-blue-600">👑 隊長: ${leader}</span><div class="flex gap-2"><span class="text-green-600">🟢 ${readyCount}</span><span class="text-yellow-600">🟡 ${leaveCount}</span></div></div>`; } 
            else { footer = `<div class="bg-white p-3 border-t border-slate-100 flex justify-between items-center shrink-0 text-xs font-bold text-slate-500 mt-auto rounded-b-xl"><span class="text-blue-600">👑 隊長: ${leader}</span><span class="text-slate-400">成員 ${groupMembers.length} 人</span></div>`; }
            return `<div class="${cardClass}"><div class="${headerClass} flex justify-between items-center"><div><div class="flex items-center mb-1">${dateBadge}${subjectBadge}</div><h3 class="text-xl font-bold text-slate-800">${group.name}</h3><p class="text-xs mt-1 italic text-slate-500">${group.note||''}</p></div><div class="flex items-center">${copyBtn}${editBtn}</div></div><div class="flex-grow overflow-y-auto max-h-80 custom-scrollbar">${list.length ? list : '<p class="text-sm text-slate-400 text-center py-4">無成員 (或被篩選隱藏)</p>'}</div>${footer}</div>`;
        }).join('');
        grid.insertAdjacentHTML('beforeend', groupsHTML);
    },

    toggleGvgStatus: function(groupId, memberId, action) {
        const group = this.groups.find(g => g.id === groupId); if(!group) return;
        const index = group.members.findIndex(m => (typeof m === 'string' ? m : m.id) === memberId);
        if (index === -1) return;
        let m = group.members[index]; if (typeof m === 'string') m = { id: m, status: 'pending', subId: null };
        if (action === 'leave') { return; } 
        else if (action === 'ready_toggle') { if (m.status === 'leave') return; m.status = (m.status === 'ready') ? 'pending' : 'ready'; }
        group.members[index] = m; 
        this.saveGroupUpdate(group);
        this.logChange('狀態更新', `${this.members.find(u=>u.id===memberId)?.gameName} -> ${m.status}`, memberId);
    },
    updateGvgSub: function(groupId, memberId, subId) {
        const group = this.groups.find(g => g.id === groupId); if(!group) return;
        const index = group.members.findIndex(m => (typeof m === 'string' ? m : m.id) === memberId); if (index === -1) return;
        let m = group.members[index]; if (typeof m === 'string') m = { id: m, status: 'pending' }; m.subId = subId; 
        group.members[index] = m; 
        this.saveGroupUpdate(group);
        this.logChange('替補更新', `隊伍 ${group.name} 成員變更替補`, memberId);
    },
    saveGroupUpdate: function(group) { if (this.mode === 'firebase') this.db.collection(Cfg.COLLECTION_NAMES.GROUPS).doc(group.id).update({ members: group.members }); else this.saveLocal('groups'); },
    addCustomSubject: function() { const newSub = prompt("請輸入新主題名稱："); if (newSub && !this.raidThemes.includes(newSub)) { this.raidThemes.push(newSub); this.saveLocal('themes'); this.renderSubjectOptions(newSub); this.logChange('新增主題', newSub, 'SYSTEM'); } },
    
    deleteCustomSubject: function() {
        const select = document.getElementById('squadSubject'); const target = select.value;
        const defaults = ['GVG 攻城戰']; 
        if(defaults.includes(target)) { alert("系統預設主題無法刪除！"); return; }
        const isUsed = this.groups.some(g => g.subject === target);
        if(isUsed) { alert(`主題「${target}」尚有隊伍正在使用，無法刪除！`); return; }
        if(!confirm(`確定要永久刪除主題「${target}」嗎？`)) return;
        this.raidThemes = this.raidThemes.filter(t => t !== target); this.saveLocal('themes'); this.renderSubjectOptions(); 
        this.logChange('刪除主題', target, 'SYSTEM');
    },
    renderSubjectOptions: function(selectedVal) { const select = document.getElementById('squadSubject'); if (!select) return; select.innerHTML = this.raidThemes.map(t => `<option value="${t}">${t}</option>`).join(''); if (selectedVal) select.value = selectedVal; },
    openSquadModal: function(id) {
        const type = this.currentTab === 'gvg' ? 'gvg' : 'groups'; if(!['master', 'admin', 'commander'].includes(this.userRole)) return; 
        document.getElementById('squadId').value = id || ''; document.getElementById('squadType').value = type; document.getElementById('memberSearch').value = ''; document.getElementById('squadModalTitle').innerText = id ? '編輯隊伍' : '新增隊伍';
        this.currentModalRoleFilter = 'all'; const searchInput = document.getElementById('memberSearch');
        if (searchInput && !document.getElementById('modalFilterContainer')) { const filterDiv = document.createElement('div'); filterDiv.id = 'modalFilterContainer'; filterDiv.className = "flex gap-2 mb-2 mt-2"; const filters = [{id: 'all', label: '全部', class: 'bg-slate-800 text-white'}, {id: '輸出', label: '輸出', class: 'bg-red-500 text-white'}, {id: '輔助', label: '輔助', class: 'bg-green-500 text-white'}, {id: '坦', label: '坦克', class: 'bg-blue-500 text-white'}]; filterDiv.innerHTML = filters.map(f => `<button type="button" data-filter="${f.id}" data-active-class="${f.class}" onclick="app.setModalRoleFilter('${f.id}')" class="px-3 py-1 rounded text-xs font-bold transition whitespace-nowrap ${f.id==='all'? f.class : 'bg-white text-slate-600 border border-slate-200'}">${f.label}</button>`).join(''); searchInput.parentNode.insertAdjacentElement('afterend', filterDiv); }
        this.renderSubjectOptions();
        if(id) {
            const g = this.groups.find(g => g.id === id); document.getElementById('squadName').value = g.name; document.getElementById('squadNote').value = g.note; document.getElementById('squadDate').value = g.date || ''; document.getElementById('squadSubject').value = g.subject || 'GVG 攻城戰'; document.getElementById('deleteSquadBtnContainer').innerHTML = `<button type="button" onclick="app.deleteSquad('${id}')" class="text-red-500 text-sm hover:underline">解散</button>`;
            this.currentSquadMembers = g.members.map(m => typeof m === 'string' ? {id: m, status: 'pending'} : m);
            this.renderSquadMemberSelect(); this.updateLeaderOptions(); const leaderSelect = document.getElementById('squadLeader'); if(leaderSelect) leaderSelect.value = g.leaderId || "";
        } else {
            document.getElementById('squadName').value = ''; document.getElementById('squadNote').value = ''; document.getElementById('squadDate').value = new Date().toISOString().split('T')[0]; document.getElementById('squadSubject').value = 'GVG 攻城戰'; document.getElementById('deleteSquadBtnContainer').innerHTML = ''; this.currentSquadMembers = []; this.renderSquadMemberSelect();
        }
        app.showModal('squadModal');
    },
    toggleSquadMember: function(id) { const index = this.currentSquadMembers.findIndex(m => m.id === id); const limit = this.currentTab === 'gvg' ? 5 : 12; if (index > -1) { this.currentSquadMembers.splice(index, 1); } else { if (this.currentSquadMembers.length >= limit) { alert(`此類型隊伍最多 ${limit} 人`); return; } this.currentSquadMembers.push({ id: id, status: 'pending' }); } this.renderSquadMemberSelect(); },
    
    renderSquadMemberSelect: function() {
        const search = document.getElementById('memberSearch').value.toLowerCase(); 
        const targetDate = document.getElementById('squadDate').value;
        const currentSquadId = document.getElementById('squadId').value;
        const currentType = document.getElementById('squadType').value;
        let availableMembers = [...this.members];
        const preLeaveMembers = this.leaves.filter(l => l.date === targetDate).map(l => l.memberId);
        let busyMembers = [];
        if (currentType === 'gvg' && targetDate) {
            this.groups.forEach(g => {
                if (g.type === 'gvg' && g.date === targetDate && g.id !== currentSquadId) {
                    g.members.forEach(m => { const mid = typeof m === 'string' ? m : m.id; busyMembers.push(mid); if (typeof m === 'object' && m.subId) { busyMembers.push(m.subId); } });
                }
            });
        }
        const filtered = availableMembers.filter(m => { const matchSearch = (m.gameName + m.lineName + m.mainClass + (m.role||'')).toLowerCase().includes(search); let matchRole = true; if (this.currentModalRoleFilter !== 'all') { const f = this.currentModalRoleFilter; matchRole = m.role.includes(f) || (f === '坦' && m.mainClass.includes('坦')); } return matchSearch && matchRole; });
        const isSelected = (mid) => this.currentSquadMembers.some(sm => sm.id === mid); filtered.sort((a,b) => (isSelected(a.id) === isSelected(b.id)) ? 0 : isSelected(a.id) ? -1 : 1);
        document.getElementById('selectedCount').innerText = `${this.currentSquadMembers.length}/${this.currentTab === 'gvg' ? 5 : 12}`;
        document.getElementById('squadMemberSelect').innerHTML = filtered.map(m => { 
            const checked = isSelected(m.id); 
            const style = Cfg.JOB_STYLES.find(s => s.key.some(k => (m.mainClass||'').includes(k))) || { class: 'bg-job-default', icon: 'fa-user' }; 
            const isLeave = preLeaveMembers.includes(m.id);
            const isBusy = busyMembers.includes(m.id);
            const isUnavailable = isLeave || isBusy;
            const disabledClass = isUnavailable ? 'opacity-50 cursor-not-allowed bg-slate-100' : 'hover:bg-slate-50 bg-white cursor-pointer';
            const clickAction = isUnavailable ? '' : `onchange="app.toggleSquadMember('${m.id}')"`;
            let nameSuffix = '';
            if (isLeave) nameSuffix = ' <span class="text-red-500 font-bold text-[10px]">(請假)</span>';
            else if (isBusy) nameSuffix = ' <span class="text-blue-500 font-bold text-[10px]">(他隊/替補)</span>';
            return `<label class="flex items-center space-x-2 p-2 rounded border border-blue-100 transition select-none ${checked ? 'bg-blue-50 border-blue-300' : disabledClass}"><input type="checkbox" value="${m.id}" class="rounded text-blue-500" ${checked?'checked':''} ${isUnavailable?'disabled':''} ${clickAction}><div class="w-6 h-6 rounded-full flex items-center justify-center text-xs ${style.class.replace('bg-', 'text-')} bg-opacity-20"><i class="fas ${style.icon}"></i></div><div class="min-w-0 flex-grow"><div class="text-xs font-bold text-slate-700 truncate">${m.gameName}${nameSuffix}</div><div class="text-[10px] text-slate-400">${m.mainClass.split('(')[0]} <span class="${m.role.includes('輸出')?'text-red-400':m.role.includes('坦')?'text-blue-400':'text-green-400'}">${m.role}</span></div></div></label>`; 
        }).join('');
        this.updateLeaderOptions();
    },
    updateLeaderOptions: function() {
        const select = document.getElementById('squadLeader'); if (!select) return;
        const currentVal = select.value; select.innerHTML = '<option value="">未指定</option>';
        this.currentSquadMembers.forEach(sm => { const mid = (typeof sm === 'string') ? sm : sm.id; const mem = this.members.find(m => m.id === mid); if (mem) { const opt = document.createElement('option'); opt.value = mem.id; opt.innerText = mem.gameName; select.appendChild(opt); } });
        if (currentVal && this.currentSquadMembers.some(sm => (typeof sm === 'string' ? sm : sm.id) === currentVal)) { select.value = currentVal; } else { select.value = ""; }
    },
    saveSquad: async function() {
        if (!['master', 'admin', 'commander'].includes(this.userRole)) return;
        const id = document.getElementById('squadId').value; const type = document.getElementById('squadType').value; const name = document.getElementById('squadName').value; const note = document.getElementById('squadNote').value; const leaderId = document.getElementById('squadLeader').value; const date = document.getElementById('squadDate').value; const subject = document.getElementById('squadSubject').value; const selectedMembers = [...this.currentSquadMembers];
        if(!name) { alert("請輸入隊伍名稱"); return; } if (type === 'gvg' && !date) { alert("團體戰必須選擇日期"); return; }
        const squadData = { name, note, members: selectedMembers, type, leaderId, date, subject }; 
        if (id) { if (this.mode === 'firebase') await this.db.collection(Cfg.COLLECTION_NAMES.GROUPS).doc(id).update(squadData); else { const idx = this.groups.findIndex(g => g.id === id); if(idx !== -1) { this.groups[idx] = { ...this.groups[idx], ...squadData }; this.saveLocal('groups'); } } } 
        else { if (this.mode === 'firebase') await this.db.collection(Cfg.COLLECTION_NAMES.GROUPS).add(squadData); else { squadData.id = 'g_' + Date.now(); this.groups.push(squadData); this.saveLocal('groups'); } }
        this.logChange(id ? '隊伍更新' : '建立隊伍', `${name} (${date})`, id || 'new'); this.closeModal('squadModal');
    },
    deleteSquad: async function(id) {
        if (!confirm("確定要解散這個隊伍嗎？")) return;
        if (this.mode === 'firebase') await this.db.collection(Cfg.COLLECTION_NAMES.GROUPS).doc(id).delete(); else { this.groups = this.groups.filter(g => g.id !== id); this.saveLocal('groups'); }
        this.logChange('解散隊伍', `ID: ${id}`, 'SYSTEM');
        this.closeModal('squadModal');
    },

    // 3. 修正 Activity 搜尋功能 & 渲染
    renderActivities: function() {
        const list = document.getElementById('activityList'), emptyMsg = document.getElementById('noActivitiesMsg');
        
        // [Fix] 讀取搜尋框內容
        const searchInput = document.getElementById('activitySearchInput');
        const searchTerm = searchInput ? searchInput.value.toLowerCase() : '';

        // [Fix] 過濾活動
        const filteredActivities = this.activities.filter(act => {
            const matchName = act.name.toLowerCase().includes(searchTerm);
            // 也搜尋得獎者
            const matchWinner = (act.winners || []).some(w => {
                const mem = this.members.find(m => m.id === w.memberId);
                return mem && mem.gameName.toLowerCase().includes(searchTerm);
            });
            return matchName || matchWinner;
        });

        if (!filteredActivities || filteredActivities.length === 0) { 
            list.innerHTML = ''; 
            if(emptyMsg) emptyMsg.classList.remove('hidden'); 
            return; 
        }
        if(emptyMsg) emptyMsg.classList.add('hidden');

        list.innerHTML = filteredActivities.map(act => {
            const winnersList = (act.winners || []).map((w, idx) => { const mem = this.members.find(m => m.id === w.memberId); const name = mem ? mem.gameName : 'Unknown'; const job = mem ? mem.mainClass : '-'; let timeStr = ""; if(w.claimedAt) { const d = new Date(w.claimedAt); timeStr = `${d.getMonth()+1}/${d.getDate()} ${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`; } const isMaster = this.userRole === 'master'; const lightClass = w.claimed ? 'claimed' : 'unclaimed'; const clickAction = (isMaster && !w.claimed) ? `onclick="app.handleClaimReward('${act.id}', ${idx})"` : ''; const titleText = w.claimed ? `已於 ${timeStr} 領取` : (isMaster ? '點擊發放獎勵 (立即紀錄)' : '未領取'); return `<div class="flex justify-between items-center py-3 border-b border-slate-100 last:border-0"><div class="flex flex-col"><span class="font-bold text-slate-700 text-sm">${name}</span><span class="text-xs text-slate-400">${job}</span>${w.claimed ? `<span class="text-[10px] text-green-600 font-mono mt-1">${timeStr} 已領</span>` : ''}</div><div class="status-light ${lightClass}" ${clickAction} title="${titleText}"></div></div>`; }).join('');
            return `<div class="bg-white rounded-xl border border-yellow-200 shadow-sm overflow-hidden flex flex-col"><div class="bg-gradient-to-r from-orange-100 to-yellow-50 p-4 border-b border-yellow-200 flex justify-between items-start"><div><h3 class="font-bold text-lg text-slate-800">${act.name}</h3><p class="text-xs text-yellow-800 font-bold mt-1 bg-yellow-200 px-2 py-1 rounded inline-block">${act.note || '總獎勵詳見備註'}</p></div>${this.userRole === 'master' ? `<button onclick="app.openActivityModal('${act.id}')" class="text-slate-400 hover:text-blue-500"><i class="fas fa-edit"></i></button>` : ''}</div><div class="p-4 bg-white flex-grow">${winnersList.length ? winnersList : '<p class="text-center text-slate-400 text-sm py-4">名單確認中...</p>'}</div></div>`;
        }).join('');
    },
    handleClaimReward: async function(actId, winnerIdx) {
        if(this.userRole !== 'master') return; const actIndex = this.activities.findIndex(a => a.id === actId); if(actIndex === -1) return; let act = this.activities[actIndex]; if(!act.winners[winnerIdx]) return; act.winners[winnerIdx].claimed = true; act.winners[winnerIdx].claimedAt = Date.now(); act.winners[winnerIdx].claimedBy = 'Master';
        if (this.mode === 'firebase') { await this.db.collection(Cfg.COLLECTION_NAMES.ACTIVITIES).doc(actId).update({ winners: act.winners }); } else { this.activities[actIndex] = act; this.saveLocal('activities'); }
        this.logChange('領取獎勵', `活動 ${act.name}`, 'SYSTEM');
    },
    openActivityModal: function(id) {
        if (this.userRole !== 'master') return; document.getElementById('activityId').value = id || ''; document.getElementById('activityModalTitle').innerText = id ? '編輯' : '新增'; this.currentActivityWinners = [];
        if (id) { const act = this.activities.find(a => a.id === id); if (act) { document.getElementById('activityName').value = act.name; document.getElementById('activityNote').value = act.note; this.currentActivityWinners = act.winners ? [...act.winners] : []; document.getElementById('deleteActivityBtnContainer').innerHTML = `<button type="button" onclick="app.deleteActivity('${id}')" class="text-red-500 text-sm hover:underline">刪除活動</button>`; } } else { document.getElementById('activityName').value = ''; document.getElementById('activityNote').value = ''; document.getElementById('deleteActivityBtnContainer').innerHTML = ''; }
        this.renderActivityWinnersList(); app.showModal('activityModal');
    },
    renderActivityWinnersList: function() { const container = document.getElementById('winnerListContainer'); document.getElementById('winnerCount').innerText = this.currentActivityWinners.length; if (this.currentActivityWinners.length === 0) { container.innerHTML = '<p class="text-center text-slate-400 py-6 text-sm">請選取得獎者。</p>'; return; } container.innerHTML = this.currentActivityWinners.map((w, idx) => { const mem = this.members.find(m => m.id === w.memberId); return `<div class="flex justify-between items-center bg-yellow-50 p-2 rounded border border-yellow-100"><span class="text-sm font-bold text-slate-700">${mem ? mem.gameName : 'Unknown'}</span><button onclick="app.removeWinner(${idx})" class="text-red-400 hover:text-red-600"><i class="fas fa-times"></i></button></div>`; }).join(''); },
    removeWinner: function(idx) { this.currentActivityWinners.splice(idx, 1); this.renderActivityWinnersList(); },
    saveActivity: async function() {
        if (this.userRole !== 'master') return; const id = document.getElementById('activityId').value, name = document.getElementById('activityName').value, note = document.getElementById('activityNote').value; if (!name) { alert("請輸入活動名稱"); return; } const activityData = { name, note, winners: this.currentActivityWinners };
        if (id) { if (this.mode === 'firebase') await this.db.collection(Cfg.COLLECTION_NAMES.ACTIVITIES).doc(id).update(activityData); else { const idx = this.activities.findIndex(a => a.id === id); if (idx !== -1) { this.activities[idx] = { ...this.activities[idx], ...activityData }; this.saveLocal('activities'); } } } 
        else { if (this.mode === 'firebase') await this.db.collection(Cfg.COLLECTION_NAMES.ACTIVITIES).add(activityData); else { activityData.id = 'act_' + Date.now(); this.activities.push(activityData); this.saveLocal('activities'); } }
        this.logChange(id ? '活動更新' : '新增活動', name, 'SYSTEM'); this.closeModal('activityModal'); this.renderActivities();
    },
    deleteActivity: async function(id) { if (this.userRole !== 'master') return; if (!confirm("確定要刪除此活動嗎？")) return; if (this.mode === 'firebase') await this.db.collection(Cfg.COLLECTION_NAMES.ACTIVITIES).doc(id).delete(); else { this.activities = this.activities.filter(a => a.id !== id); this.saveLocal('activities'); } this.logChange('刪除活動', `ID: ${id}`, 'SYSTEM'); this.closeModal('activityModal'); this.renderActivities(); },
    
    openWinnerSelectionModal: function() { 
        this.tempWinnerSelection = [...this.currentActivityWinners]; 
        this.renderWinnerSelect();
        app.showModal('winnerSelectModal');
    },

    renderWinnerSelect: function() {
        const container = document.getElementById('winnerSelectGrid');
        const search = document.getElementById('winnerSearchInput').value.toLowerCase();
        let filtered = this.members.filter(m => (m.gameName + m.lineName).toLowerCase().includes(search));
        const isSelected = (mid) => this.tempWinnerSelection.some(w => w.memberId === mid);
        filtered.sort((a,b) => (isSelected(a.id) === isSelected(b.id)) ? 0 : isSelected(a.id) ? -1 : 1);
        container.innerHTML = filtered.map(m => {
            const checked = isSelected(m.id);
            return `<label class="flex items-center space-x-2 p-3 rounded border cursor-pointer transition ${checked ? 'bg-yellow-100 border-yellow-300' : 'bg-white hover:bg-slate-50 border-slate-200'}"><input type="checkbox" onchange="app.toggleWinnerSelection('${m.id}')" ${checked ? 'checked' : ''} class="rounded text-yellow-500 focus:ring-yellow-500"><span class="text-sm font-bold text-slate-700">${m.gameName}</span><span class="text-xs text-slate-400 ml-auto">${m.mainClass.split('(')[0]}</span></label>`;
        }).join('');
    },
    toggleWinnerSelection: function(mid) {
        const idx = this.tempWinnerSelection.findIndex(w => w.memberId === mid);
        if (idx !== -1) { this.tempWinnerSelection.splice(idx, 1); } 
        else { this.tempWinnerSelection.push({ memberId: mid, claimed: false, claimedAt: null }); }
        this.renderWinnerSelect();
    },
    confirmWinnerSelection: function() {
        this.currentActivityWinners = [...this.tempWinnerSelection];
        this.renderActivityWinnersList();
        this.closeModal('winnerSelectModal');
    },
    copyText: function(btn, text) {
        navigator.clipboard.writeText(text).then(() => {
            const originalHTML = btn.innerHTML;
            btn.innerHTML = '<i class="fas fa-check text-green-500"></i> Copied!';
            setTimeout(() => btn.innerHTML = originalHTML, 1500);
        });
    },
    copySquadList: function(groupId) {
        const g = this.groups.find(x => x.id === groupId);
        if(!g) return;
        const leader = this.members.find(m => m.id === g.leaderId);
        let text = `📋 ${g.name} (${g.subject || 'GVG'})\n📅 日期: ${g.date || '未定'}\n👑 隊長: ${leader ? leader.gameName : '未定'}\n\n`;
        g.members.forEach((m, i) => {
            const mid = typeof m === 'string' ? m : m.id;
            const mem = this.members.find(x => x.id === mid);
            if(mem) {
                const job = mem.mainClass.split('(')[0];
                let status = "";
                if (typeof m === 'object') {
                    if (m.status === 'leave') status = " (請假)";
                    else if (m.status === 'ready') status = " (已確認)";
                    if (m.subId) { const sub = this.members.find(s => s.id === m.subId); if (sub) status += ` -> 替補: ${sub.gameName}`; }
                }
                text += `${i+1}. ${mem.gameName} [${job}]${status}\n`;
            }
        });
        if(g.note) text += `\n📝 備註: ${g.note}`;
        navigator.clipboard.writeText(text).then(() => alert("隊伍名單已複製！"));
    },
    showModal: function(id) { document.getElementById(id).classList.remove('hidden'); document.getElementById(id).classList.add('flex'); },
    closeModal: function(id) { document.getElementById(id).classList.add('hidden'); document.getElementById(id).classList.remove('flex'); },
    showHistoryModal: function() {
        const list = document.getElementById('historyList');
        if(this.history.length === 0) { list.innerHTML = '<p class="text-center text-slate-400">尚無紀錄</p>'; }
        else {
            list.innerHTML = this.history.map(h => {
                const d = new Date(h.timestamp);
                const timeStr = `${d.getMonth()+1}/${d.getDate()} ${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`;
                return `<div class="border-b border-slate-100 py-2 last:border-0"><div class="flex justify-between"><span class="font-bold text-slate-700">${h.action}</span><span class="text-xs text-slate-400">${timeStr}</span></div><div class="text-sm text-slate-600 mt-1">${h.details}</div><div class="text-xs text-slate-300 mt-1 text-right">User: ${h.user}</div></div>`;
            }).join('');
        }
        this.showModal('historyModal');
    },
    downloadSelf: function() {
        const htmlContent = document.documentElement.outerHTML;
        const blob = new Blob([htmlContent], { type: 'text/html' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'ro_guild_backup_' + new Date().toISOString().split('T')[0] + '.html';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    },
    exportCSV: function() {
        let csvContent = "data:text/csv;charset=utf-8,\uFEFF";
        csvContent += "遊戲ID,Line名稱,職業,定位,職位,備註\n";
        this.members.forEach(m => {
            const row = [m.gameName, m.lineName, m.mainClass, m.role, m.rank, m.intro || ''].map(e => `"${e}"`).join(",");
            csvContent += row + "\n";
        });
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", "guild_members.csv");
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    },
    resetToDemo: function() {
        if(confirm("確定要重置所有資料回到初始狀態嗎？(這會清除所有本地修改)")) {
            localStorage.clear();
            location.reload();
        }
    },
    saveConfig: function() {
        const input = document.getElementById('firebaseConfigInput').value;
        if(input) {
            try {
                const config = JSON.parse(input);
                localStorage.setItem('row_firebase_config', JSON.stringify(config));
                alert("設定已儲存，請重新整理頁面以生效。");
                location.reload();
            } catch(e) { alert("JSON 格式錯誤"); }
        }
    },
    performLuckyDraw: function() {
        const search = document.getElementById('winnerSearchInput').value.toLowerCase();
        let candidates = this.members.filter(m => (m.gameName + m.lineName).toLowerCase().includes(search));
        if (candidates.length === 0) { alert("無符合條件的成員"); return; }
        const winner = candidates[Math.floor(Math.random() * candidates.length)];
        alert(`🎉 恭喜中獎：${winner.gameName}！`);
        this.toggleWinnerSelection(winner.id);
    }
};

window.app = App;
document.addEventListener('DOMContentLoaded', () => App.init());