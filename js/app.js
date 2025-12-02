// app.js

// --- 1. 確保配置已載入 ---
if (typeof window.AppConfig === 'undefined') {
    console.error("Configuration (config.js) not loaded.");
    document.body.innerHTML = '<div style="padding: 50px; text-align: center; color: red;">錯誤：config.js 未載入。</div>';
}

const Config = window.AppConfig || {};
const { FIREBASE_CONFIG, COLLECTION_NAMES, SEED_DATA, SEED_GROUPS, SEED_ACTIVITIES, JOB_STRUCTURE, JOB_STYLES } = Config;

// --- 2. 應用程式核心邏輯 ---

const App = {
    db: null, auth: null,
    members: [], groups: [], activities: [], history: [],
    currentTab: 'home', currentFilter: 'all', currentJobFilter: 'all',
    mode: 'demo', userRole: 'guest',
    currentSquadMembers: [], currentActivityWinners: [], tempWinnerSelection: [],

    init: async function() {
        this.loadLocalState();
        this.initFirebase();
        this.updateAdminUI();
        this.populateBaseJobSelect();
        this.switchTab('home');
    },

    loadLocalState: function() {
        const savedRole = localStorage.getItem('row_user_role');
        if (savedRole && ['admin', 'master', 'commander'].includes(savedRole)) this.userRole = savedRole;

        const storedMem = localStorage.getItem('row_local_members');
        const storedGrp = localStorage.getItem('row_local_groups');
        const storedAct = localStorage.getItem('row_local_activities');
        const storedHistory = localStorage.getItem('row_mod_history');
        
        this.members = storedMem ? JSON.parse(storedMem) : SEED_DATA;
        this.groups = storedGrp ? JSON.parse(storedGrp) : SEED_GROUPS;
        this.activities = storedAct ? JSON.parse(storedAct) : (SEED_ACTIVITIES || []);
        this.history = storedHistory ? JSON.parse(storedHistory) : [];
        this.members = this.sortMembers(this.members);
    },

    initFirebase: function() {
        let config = null;
        const storedConfig = localStorage.getItem('row_firebase_config');
        try {
            if (storedConfig) config = JSON.parse(storedConfig);
            else if (FIREBASE_CONFIG && FIREBASE_CONFIG.apiKey) config = FIREBASE_CONFIG;
        } catch (e) {}

        if (config && config.apiKey) {
            try {
                if (!firebase.apps.length) firebase.initializeApp(config);
                this.auth = firebase.auth();
                this.db = firebase.firestore();
                this.mode = 'firebase';
                this.syncWithFirebase();
            } catch (e) { this.mode = 'demo'; }
        } else { this.mode = 'demo'; }
    },
    
    syncWithFirebase: function() {
        if (!this.db || this.mode !== 'firebase') return;
        this.db.collection(COLLECTION_NAMES.MEMBERS).onSnapshot(snap => { 
            const arr = []; snap.forEach(d => arr.push({ id: d.id, ...d.data() })); 
            this.members = this.sortMembers(arr); this.saveLocal('members'); this.render(); 
        });
        this.db.collection(COLLECTION_NAMES.GROUPS).onSnapshot(snap => { 
            const arr = []; snap.forEach(d => arr.push({ id: d.id, ...d.data() })); 
            this.groups = arr; this.saveLocal('groups'); this.render(); 
        });
        if (COLLECTION_NAMES.ACTIVITIES) {
            this.db.collection(COLLECTION_NAMES.ACTIVITIES).onSnapshot(snap => {
                const arr = []; snap.forEach(d => arr.push({ id: d.id, ...d.data() }));
                this.activities = arr; this.saveLocal('activities'); this.render();
            });
        }
    },

    sortMembers: function(membersArray) {
        return membersArray.sort((a, b) => {
            const isSeedA = /^m\d{2}$/.test(a.id), isSeedB = /^m\d{2}$/.test(b.id);
            if (isSeedA && isSeedB) return a.id.localeCompare(b.id);
            if (isSeedA) return -1; if (isSeedB) return 1;
            return (a.gameName || '').localeCompare(b.gameName || '');
        });
    },

    saveLocal: function(key = 'all') {
        if (this.mode === 'demo') {
            if (key === 'members' || key === 'all') localStorage.setItem('row_local_members', JSON.stringify(this.members));
            if (key === 'groups' || key === 'all') localStorage.setItem('row_local_groups', JSON.stringify(this.groups));
            if (key === 'activities' || key === 'all') localStorage.setItem('row_local_activities', JSON.stringify(this.activities));
            localStorage.setItem('row_mod_history', JSON.stringify(this.history));
            this.render();
        }
    },
    
    logChange: function(action, details, targetId) {
        const log = { timestamp: Date.now(), user: this.userRole, action, details, targetId: targetId || 'N/A' };
        this.history.unshift(log); this.saveLocal('history'); 
    },

    openLoginModal: function() {
        if(this.userRole !== 'guest') { 
            if(confirm("確定要登出嗎？")) { this.userRole = 'guest'; localStorage.removeItem('row_user_role'); this.updateAdminUI(); this.switchTab('home'); } 
        } else { document.getElementById('loginForm').reset(); this.showModal('loginModal'); }
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
        const btn = document.getElementById('adminToggleBtn');
        const adminControls = document.getElementById('adminControls');
        const isAuth = this.userRole !== 'guest';
        
        if(isAuth) { btn.classList.add('admin-mode-on'); btn.innerHTML = '<i class="fas fa-sign-out-alt"></i>'; } 
        else { btn.classList.remove('admin-mode-on'); btn.innerHTML = '<i class="fas fa-user-shield"></i>'; }

        if (['master', 'admin'].includes(this.userRole)) { if(adminControls) adminControls.classList.remove('hidden'); } 
        else { if(adminControls) adminControls.classList.add('hidden'); }
        
        const rankSelect = document.getElementById('rank'), lockIcon = document.getElementById('rankLockIcon');
        if (this.userRole === 'master') { if (rankSelect) rankSelect.disabled = false; if (lockIcon) lockIcon.className = "fas fa-unlock text-blue-500 text-xs ml-2"; } 
        else { if (rankSelect) rankSelect.disabled = true; if (lockIcon) lockIcon.className = "fas fa-lock text-slate-300 text-xs ml-2"; }
        this.render();
    },

    switchTab: function(tab) {
        this.currentTab = tab;
        ['home','members','groups','activity'].forEach(v => document.getElementById('view-'+v).classList.add('hidden'));
        if(tab === 'gvg' || tab === 'groups') document.getElementById('view-groups').classList.remove('hidden');
        else document.getElementById('view-'+tab).classList.remove('hidden');

        document.getElementById('nav-container').classList.toggle('hidden', tab === 'home');
        document.querySelectorAll('.nav-pill').forEach(b => b.classList.remove('active'));
        const activeBtn = document.getElementById('tab-' + tab); if(activeBtn) activeBtn.classList.add('active');

        const adminWarning = document.getElementById('adminWarning');
        if (tab === 'gvg' && !['master', 'admin', 'commander'].includes(this.userRole)) { if(adminWarning) adminWarning.classList.remove('hidden'); } 
        else { if(adminWarning) adminWarning.classList.add('hidden'); }

        const activityWarning = document.getElementById('activityAdminWarning');
        const addActivityBtn = document.getElementById('addActivityBtn');
        if (tab === 'activity') {
            if (this.userRole === 'master') { if(addActivityBtn) addActivityBtn.classList.remove('hidden'); if(activityWarning) activityWarning.classList.add('hidden'); } 
            else { if(addActivityBtn) addActivityBtn.classList.add('hidden'); if(activityWarning) activityWarning.classList.remove('hidden'); }
        }

        if(tab === 'gvg') { document.getElementById('groupViewTitle').innerText = 'GVG 攻城戰分組'; document.getElementById('squadModalTitle').innerText = 'GVG 分組管理'; } 
        else if(tab === 'groups') { document.getElementById('groupViewTitle').innerText = '固定團列表'; document.getElementById('squadModalTitle').innerText = '固定團管理'; }
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

    // --- 成員相關邏輯 ---
    renderMembers: function() {
        const grid = document.getElementById('memberGrid');
        const searchVal = document.getElementById('searchInput').value.toLowerCase();
        let filtered = this.members.filter(item => {
            const fullText = (item.lineName + item.gameName + item.mainClass + item.role + (item.intro||"")).toLowerCase();
            return fullText.includes(searchVal) && (this.currentFilter === 'all' || item.role.includes(this.currentFilter) || (this.currentFilter === '坦' && item.mainClass.includes('坦')))
                && (this.currentJobFilter === 'all' || (item.mainClass||"").startsWith(this.currentJobFilter));
        });
        document.getElementById('memberCount').innerText = `Total: ${filtered.length}`;
        ['dps','sup','tank'].forEach(k => document.getElementById('stat-'+k).innerText = this.members.filter(d => d.role.includes(k==='dps'?'輸出':k==='sup'?'輔助':'坦')).length);
        grid.innerHTML = filtered.map((item, idx) => this.createCardHTML(item, idx)).join('');
    },
    
    createCardHTML: function(item, idx) {
        const mainJob = item.mainClass ? item.mainClass.split('(')[0] : '';
        const style = JOB_STYLES.find(s => s.key.some(k => mainJob.includes(k))) || { class: 'bg-job-default', icon: 'fa-user' };
        let rankBadge = item.rank === '會長' ? `<span class="rank-badge rank-master">會長</span>` : item.rank === '指揮官' ? `<span class="rank-badge rank-commander">指揮官</span>` : item.rank === '資料管理員' ? `<span class="rank-badge rank-admin">管理</span>` : '';
        const memberSquads = this.groups.filter(g => g.members.some(m => (typeof m === 'string' ? m : m.id) === item.id));
        const squadBadges = memberSquads.map(s => {
            const color = s.type === 'gvg' ? 'bg-red-50 text-red-600 border-red-100' : 'bg-green-50 text-green-600 border-green-100';
            return `<span class="${color} text-[10px] px-1.5 rounded border truncate inline-block max-w-[80px]">${s.name}</span>`;
        }).join('');
        const origIndex = SEED_DATA.findIndex(s => s.id === item.id);
        const displayNo = origIndex >= 0 ? `#${(origIndex + 1).toString().padStart(2, '0')}` : "•";
        const getRoleBadge = (r) => r.includes('輸出') ? `<span class="tag tag-dps">${r}</span>` : r.includes('坦') ? `<span class="tag tag-tank">${r}</span>` : r.includes('輔助') ? `<span class="tag tag-sup">${r}</span>` : '';

        return `
            <div class="card cursor-pointer group relative" onclick="app.openEditModal('${item.id}')">
                <div class="member-no">${displayNo}</div>
                <div class="job-stripe ${style.class}"></div>
                <div class="job-icon-area ${style.class} bg-opacity-20"><i class="fas ${style.icon} ${style.class.replace('bg-', 'text-')} opacity-80 group-hover:scale-110 transition"></i></div>
                <div class="flex-grow p-2.5 flex flex-col justify-between min-w-0">
                    <div>
                        <div class="flex justify-between items-start pr-6">
                            <div class="flex items-center gap-1 min-w-0">${rankBadge}<h3 class="font-bold text-slate-700 text-base truncate">${item.gameName || '未命名'}</h3></div>
                            ${getRoleBadge(item.role)}
                        </div>
                        <div class="text-xs font-bold text-slate-400 mt-0.5">${item.mainClass || '未定'}</div>
                    </div>
                    <div class="flex justify-between items-end mt-1">
                        <div class="flex flex-col gap-1 w-full mr-1">
                            <div class="flex items-center text-[10px] text-slate-400 font-mono bg-white border border-slate-100 rounded px-1.5 py-0.5 w-fit hover:bg-slate-50 copy-tooltip" onclick="event.stopPropagation(); app.copyText(this, '${item.lineName}')"><i class="fab fa-line mr-1 text-green-500"></i> ${item.lineName}</div>
                            <div class="flex gap-1 overflow-hidden h-4">${squadBadges}</div>
                        </div>
                        ${item.intro ? `<i class="fas fa-info-circle text-blue-200 hover:text-blue-500" title="${item.intro}"></i>` : ''}
                    </div>
                </div>
            </div>`;
    },

    // Filter & Job & Modal Logic (省略部分重複代碼，保持與原版一致邏輯)
    setFilter: function(f) { this.currentFilter = f; document.querySelectorAll('.filter-btn').forEach(b => b.className = (b.innerText.includes(f==='all'?'全部':f)||(f==='坦'&&b.innerText.includes('坦克'))||(f==='待定'&&b.innerText.includes('待定'))) ? "px-4 py-1.5 rounded-full text-sm font-bold bg-slate-800 text-white transition whitespace-nowrap filter-btn active shadow-md" : "px-4 py-1.5 rounded-full text-sm font-bold bg-white text-slate-600 border border-slate-200 hover:bg-blue-50 transition whitespace-nowrap filter-btn"); this.renderMembers(); },
    setJobFilter: function(j) { this.currentJobFilter = j; this.renderMembers(); },
    populateBaseJobSelect: function() { const s = document.getElementById('baseJobSelect'); if(s) { s.innerHTML = '<option value="" disabled selected>選擇職業</option>'; Object.keys(JOB_STRUCTURE).forEach(j => s.innerHTML += `<option value="${j}">${j}</option>`); } },
    updateSubJobSelect: function() {
        const b = document.getElementById('baseJobSelect').value, s = document.getElementById('subJobSelect');
        s.innerHTML = '<option value="" disabled selected>選擇流派</option>';
        if (JOB_STRUCTURE[b]) { s.disabled = false; JOB_STRUCTURE[b].forEach(sub => s.innerHTML += `<option value="${b}(${sub})">${sub}</option>`); } else s.disabled = true;
    },
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

        if (match && JOB_STRUCTURE[match[1]]) { baseSelect.value = match[1]; this.updateSubJobSelect(); subSelect.value = fullJob; }
        else {
            const potential = fullJob.split('(')[0];
            if (JOB_STRUCTURE[potential]) { baseSelect.value = potential; this.updateSubJobSelect(); subSelect.value = fullJob; }
            else if (['master', 'admin'].includes(this.userRole)) { baseSelect.value = ""; subInput.value = fullJob; subInput.classList.remove('hidden'); wrapper.classList.add('hidden'); }
            else { baseSelect.value = ""; subSelect.disabled = true; }
        }
        this.updateAdminUI();
        document.getElementById('deleteBtnContainer').innerHTML = ['master', 'admin'].includes(this.userRole) ? `<button type="button" onclick="app.deleteMember('${item.id}')" class="text-red-500 text-sm hover:underline">刪除成員</button>` : '';
        app.showModal('editModal');
    },

    saveMemberData: async function() {
        const id = document.getElementById('editId').value;
        let mainClass = !document.getElementById('subJobInput').classList.contains('hidden') ? document.getElementById('subJobInput').value : document.getElementById('subJobSelect').value;
        const baseJob = document.getElementById('baseJobSelect').value;
        if ((!mainClass || mainClass === "選擇流派") && baseJob) mainClass = baseJob;
        if (!mainClass) mainClass = "待定";
        const member = { lineName: document.getElementById('lineName').value, gameName: document.getElementById('gameName').value, mainClass, role: document.getElementById('role').value, rank: document.getElementById('rank').value, intro: document.getElementById('intro').value };
        
        if (id) await this.updateMember(id, member); else await this.addMember(member);
        this.logChange(id?'成員更新':'新增成員', `${member.gameName}`, id || member.gameName); this.closeModal('editModal');
    },
    addMember: async function(m) { if (this.mode === 'firebase') await this.db.collection(COLLECTION_NAMES.MEMBERS).add(m); else { m.id = 'm_' + Date.now(); this.members.push(m); this.members = this.sortMembers(this.members); this.saveLocal('members'); } },
    updateMember: async function(id, m) { if (this.mode === 'firebase') await this.db.collection(COLLECTION_NAMES.MEMBERS).doc(id).update(m); else { const idx = this.members.findIndex(d => d.id === id); if (idx !== -1) { this.members[idx] = { ...this.members[idx], ...m }; this.members = this.sortMembers(this.members); this.saveLocal('members'); } } },
    deleteMember: async function(id) {
        if (!['master', 'admin'].includes(this.userRole)) return;
        if (!confirm("確定要刪除這位成員嗎？")) return;
        if (this.mode === 'firebase') await this.db.collection(COLLECTION_NAMES.MEMBERS).doc(id).delete();
        else { this.members = this.members.filter(d => d.id !== id); this.groups.forEach(g => g.members = g.members.filter(m => (typeof m === 'string' ? m : m.id) !== id)); this.saveLocal(); }
        this.logChange('成員刪除', `ID: ${id}`, id); this.closeModal('editModal');
    },

    // --- 3. 固定團 / GVG 邏輯 ---

    renderSquads: function() {
        const type = this.currentTab === 'gvg' ? 'gvg' : 'groups';
        const search = document.getElementById('groupSearchInput').value.toLowerCase();
        const canEdit = ['master', 'admin', 'commander'].includes(this.userRole);
        
        let visibleGroups = this.groups.filter(g => (g.type || 'gvg') === type);
        if (search) {
            visibleGroups = visibleGroups.filter(g => {
                if (g.name.toLowerCase().includes(search)) return true;
                return g.members.some(m => {
                    const mem = this.members.find(x => x.id === (typeof m === 'string' ? m : m.id));
                    return mem && (mem.gameName.toLowerCase().includes(search) || (mem.mainClass||'').toLowerCase().includes(search));
                });
            });
        }

        const grid = document.getElementById('squadGrid');
        const emptyMsg = document.getElementById('noSquadsMsg');
        if (visibleGroups.length === 0) { grid.innerHTML = ''; emptyMsg.classList.remove('hidden'); return; }
        emptyMsg.classList.add('hidden');

        grid.innerHTML = visibleGroups.map(group => {
            const groupMembers = (group.members || []).map(m => {
                const id = typeof m === 'string' ? m : m.id;
                // 若物件中無 status 預設為 pending, subId 預設 null
                const status = typeof m === 'string' ? 'pending' : (m.status || 'pending');
                const subId = typeof m === 'string' ? null : (m.subId || null);
                
                const mem = this.members.find(x => x.id === id);
                return mem ? { ...mem, status, subId } : null;
            }).filter(x => x);

            // GVG 模式與 Fixed Group 模式分開渲染
            const isGVG = type === 'gvg';
            
            const list = groupMembers.map(m => {
                const job = (m.mainClass || '').split('(')[0];
                const roleColor = m.role.includes('輸出')?'text-red-500':m.role.includes('輔助')?'text-green-500':'text-blue-500';
                
                // --- GVG 專屬介面 (燈號 + 替補下拉) ---
                let actionUI = "";
                let rowClass = "";
                
                if (isGVG) {
                    if (m.status === 'leave') rowClass = "row-leave";

                    if (canEdit) {
                        // 替補選單 (只在請假時顯示)
                        let subSelectUI = "";
                        if (m.status === 'leave') {
                            const otherMembers = this.members.filter(x => !groupMembers.some(gm => gm.id === x.id) || x.id === m.subId); // 簡單過濾
                            const options = otherMembers.map(om => `<option value="${om.id}" ${om.id === m.subId ? 'selected' : ''}>${om.gameName}</option>`).join('');
                            subSelectUI = `
                            <select class="sub-select" onchange="app.updateGvgSub('${group.id}', '${m.id}', this.value)" onclick="event.stopPropagation()">
                                <option value="">選擇替補...</option>
                                ${options}
                            </select>`;
                        }

                        // 燈號按鈕 (紅綠燈 + 黃燈)
                        actionUI = `
                            <div class="flex items-center gap-1">
                                ${subSelectUI}
                                <div class="gvg-light bg-light-yellow ${m.status === 'leave' ? 'active' : ''}" 
                                     title="請假 (Leave)" 
                                     onclick="event.stopPropagation(); app.toggleGvgStatus('${group.id}', '${m.id}', 'leave')"></div>
                                <div class="gvg-light ${m.status === 'ready' ? 'bg-light-green active' : 'bg-light-red'}" 
                                     title="${m.status === 'ready' ? '準備完成 (Ready)' : '未確認 (Pending)'}" 
                                     onclick="event.stopPropagation(); app.toggleGvgStatus('${group.id}', '${m.id}', 'ready_toggle')"></div>
                            </div>
                        `;
                    } else {
                        // 唯讀模式顯示狀態
                        let statusText = m.status === 'ready' ? '<span class="text-green-500 text-xs font-bold">Ready</span>' : 
                                         m.status === 'leave' ? '<span class="text-yellow-500 text-xs font-bold">請假</span>' : 
                                         '<span class="text-red-400 text-xs">...</span>';
                        // 若有替補顯示替補名字
                        if (m.status === 'leave' && m.subId) {
                            const subMem = this.members.find(x => x.id === m.subId);
                            if(subMem) statusText += ` <span class="text-blue-500 text-xs">⇋ ${subMem.gameName}</span>`;
                        }
                        actionUI = `<div>${statusText}</div>`;
                    }
                } else {
                    // --- Fixed Group 優化介面 (純名單) ---
                    actionUI = `<span class="text-xs text-slate-300 font-mono">ID:${m.id.slice(-3)}</span>`;
                }

                return `
                <div class="flex items-center justify-between text-sm py-2.5 border-b border-slate-100 last:border-0 hover:bg-slate-50 px-3 transition ${rowClass}">
                    <div class="flex items-center gap-3 min-w-0">
                        <div class="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-xs font-bold ${roleColor}">${m.role.substring(0,1)}</div>
                        <div class="flex flex-col min-w-0">
                            <span class="text-slate-800 font-bold truncate member-name">${m.gameName}</span>
                            <span class="text-[10px] text-slate-400 font-mono">${job}</span>
                        </div>
                    </div>
                    ${actionUI}
                </div>`;
            }).join('');
                
            const headerClass = isGVG ? 'header squad-card-gvg-header' : 'bg-blue-50 p-4 border-b border-blue-100';
            const cardClass = isGVG ? 'squad-card-gvg' : 'bg-white rounded-xl shadow-sm border border-blue-100';
            const editBtn = canEdit ? `<button onclick="app.openSquadModal('${group.id}')" class="text-slate-400 hover:text-blue-600 p-1"><i class="fas fa-cog"></i></button>` : '';
            const copyBtn = `<button onclick="app.copySquadList('${group.id}')" class="text-slate-400 hover:text-green-600 p-1 ml-2" title="複製隊伍"><i class="fas fa-copy"></i></button>`;

            // 統計 (僅 GVG 顯示狀態統計)
            let footer = "";
            if (isGVG) {
                const readyCount = groupMembers.filter(m => m.status === 'ready').length;
                const leaveCount = groupMembers.filter(m => m.status === 'leave').length;
                footer = `
                <div class="bg-white p-3 border-t border-slate-100 flex justify-between items-center shrink-0 text-xs font-bold text-slate-500">
                    <span>${groupMembers.length} 人</span>
                    <div class="flex gap-2">
                        <span class="text-green-600">🟢 ${readyCount}</span>
                        <span class="text-yellow-600">🟡 ${leaveCount}</span>
                    </div>
                </div>`;
            } else {
                 footer = `
                <div class="bg-white p-2 border-t border-slate-100 text-center text-xs text-slate-400">
                    固定成員 ${groupMembers.length} 人
                </div>`;
            }

            return `
                <div class="${cardClass} flex flex-col h-full overflow-hidden">
                    <div class="${headerClass} p-4 flex justify-between items-center rounded-t-[7px]">
                        <div><h3 class="text-xl font-bold">${group.name}</h3><p class="text-xs mt-1 italic opacity-80">${group.note||''}</p></div>
                        <div class="flex items-center">${copyBtn}${editBtn}</div>
                    </div>
                    <div class="flex-grow p-1 overflow-y-auto max-h-80">${list.length?list:'<p class="text-sm text-slate-400 text-center py-4">無成員</p>'}</div>
                    ${footer}
                </div>`;
        }).join('');
    },

    // --- GVG 狀態與替補邏輯 ---
    toggleGvgStatus: function(groupId, memberId, action) {
        if (!['master', 'admin', 'commander'].includes(this.userRole)) return;
        const group = this.groups.find(g => g.id === groupId); if(!group) return;
        const index = group.members.findIndex(m => (typeof m === 'string' ? m : m.id) === memberId);
        if (index === -1) return;

        let m = group.members[index];
        if (typeof m === 'string') m = { id: m, status: 'pending', subId: null };

        // 邏輯: action == 'leave' (切換請假開關), action == 'ready_toggle' (切換紅綠燈)
        if (action === 'leave') {
            // 如果當前是請假，再次點擊取消請假(變回 pending)
            if (m.status === 'leave') { m.status = 'pending'; m.subId = null; }
            else { m.status = 'leave'; } // 設為請假
        } else if (action === 'ready_toggle') {
            if (m.status === 'leave') {
                 // 如果在請假狀態點了紅綠燈，視為取消請假並設為 Ready? 或者無效?
                 // 這裡設定為: 取消請假並變 Ready
                 m.status = 'ready'; m.subId = null;
            } else {
                // 紅綠切換
                m.status = (m.status === 'ready') ? 'pending' : 'ready';
            }
        }

        group.members[index] = m;
        this.saveGroupUpdate(group);
    },

    updateGvgSub: function(groupId, memberId, subId) {
        const group = this.groups.find(g => g.id === groupId); if(!group) return;
        const index = group.members.findIndex(m => (typeof m === 'string' ? m : m.id) === memberId);
        if (index === -1) return;

        let m = group.members[index];
        if (typeof m === 'string') m = { id: m, status: 'pending' };
        
        m.subId = subId; // 儲存替補ID
        group.members[index] = m;
        this.saveGroupUpdate(group);
    },

    saveGroupUpdate: function(group) {
        if (this.mode === 'firebase') this.db.collection(COLLECTION_NAMES.GROUPS).doc(group.id).update({ members: group.members });
        else this.saveLocal('groups');
    },
    
    openSquadModal: function(id) {
        const type = this.currentTab === 'gvg' ? 'gvg' : 'groups';
        if(!['master', 'admin', 'commander'].includes(this.userRole)) return; 

        document.getElementById('squadId').value = id || ''; 
        document.getElementById('squadType').value = type;
        document.getElementById('memberSearch').value = '';
        document.getElementById('squadModalTitle').innerText = id ? '編輯隊伍' : '新增隊伍';

        if(id) {
            const g = this.groups.find(g => g.id === id);
            document.getElementById('squadName').value = g.name; document.getElementById('squadNote').value = g.note;
            document.getElementById('deleteSquadBtnContainer').innerHTML = `<button type="button" onclick="app.deleteSquad('${id}')" class="text-red-500 text-sm hover:underline">解散</button>`;
            this.currentSquadMembers = g.members.map(m => typeof m === 'string' ? {id: m, status: 'pending'} : m);
        } else {
            document.getElementById('squadName').value = ''; document.getElementById('squadNote').value = '';
            document.getElementById('deleteSquadBtnContainer').innerHTML = '';
            this.currentSquadMembers = [];
        }
        this.renderSquadMemberSelect();
        app.showModal('squadModal');
    },

    toggleSquadMember: function(id) {
        const index = this.currentSquadMembers.findIndex(m => m.id === id);
        // GVG 限制 5 人，固定團放寬
        const limit = this.currentTab === 'gvg' ? 5 : 12;

        if (index > -1) { this.currentSquadMembers.splice(index, 1); } 
        else { 
            if (this.currentSquadMembers.length >= limit) { alert(`此類型隊伍最多 ${limit} 人`); return; }
            this.currentSquadMembers.push({ id: id, status: 'pending' }); 
        }
        this.renderSquadMemberSelect();
    },

    renderSquadMemberSelect: function() {
        const search = document.getElementById('memberSearch').value.toLowerCase();
        let availableMembers = [...this.members];
        const filtered = availableMembers.filter(m => (m.gameName + m.lineName + m.mainClass).toLowerCase().includes(search));
        const isSelected = (mid) => this.currentSquadMembers.some(sm => sm.id === mid);
        filtered.sort((a,b) => (isSelected(a.id) === isSelected(b.id)) ? 0 : isSelected(a.id) ? -1 : 1);
        
        const count = this.currentSquadMembers.length;
        const limit = this.currentTab === 'gvg' ? 5 : 12;
        document.getElementById('selectedCount').innerText = `${count}/${limit}`;
        
        document.getElementById('squadMemberSelect').innerHTML = filtered.map(m => {
            const checked = isSelected(m.id);
            const style = JOB_STYLES.find(s => s.key.some(k => (m.mainClass||'').includes(k))) || { class: 'bg-job-default', icon: 'fa-user' };
            return `
            <label class="flex items-center space-x-2 p-2 rounded border border-blue-100 transition select-none ${checked ? 'bg-blue-50 border-blue-300' : 'hover:bg-slate-50 bg-white cursor-pointer'}">
                <input type="checkbox" value="${m.id}" class="rounded text-blue-500" ${checked?'checked':''} onchange="app.toggleSquadMember('${m.id}')">
                <div class="w-6 h-6 rounded-full flex items-center justify-center text-xs ${style.class.replace('bg-', 'text-')} bg-opacity-20"><i class="fas ${style.icon}"></i></div>
                <div class="min-w-0 flex-grow"><div class="text-xs font-bold text-slate-700 truncate">${m.gameName}</div></div>
            </label>`;
        }).join('');
    },
    
    saveSquad: async function() {
        if (!['master', 'admin', 'commander'].includes(this.userRole)) return;
        const id = document.getElementById('squadId').value;
        const type = document.getElementById('squadType').value;
        const name = document.getElementById('squadName').value;
        const note = document.getElementById('squadNote').value;
        const selectedMembers = [...this.currentSquadMembers];
        
        if(!name) { alert("請輸入隊伍名稱"); return; }
        // GVG 強制 5 人檢查，其他模式則彈性
        if (type === 'gvg' && selectedMembers.length !== 5) { alert("GVG 隊伍建議為 5 人 (目前: " + selectedMembers.length + ")"); }
        
        const squadData = { name, note, members: selectedMembers, type };
        if (id) {
            if (this.mode === 'firebase') await this.db.collection(COLLECTION_NAMES.GROUPS).doc(id).update(squadData); 
            else { const idx = this.groups.findIndex(g => g.id === id); if(idx !== -1) { this.groups[idx] = { ...this.groups[idx], ...squadData }; this.saveLocal('groups'); } }
        } else {
            if (this.mode === 'firebase') await this.db.collection(COLLECTION_NAMES.GROUPS).add(squadData); 
            else { squadData.id = 'g_' + Date.now(); this.groups.push(squadData); this.saveLocal('groups'); }
        }
        this.logChange(id ? '隊伍更新' : '建立隊伍', `${name}`, id || 'new'); this.closeModal('squadModal');
    },

    deleteSquad: async function(id) {
        if (!confirm("確定要解散這個隊伍嗎？")) return;
        if (this.mode === 'firebase') await this.db.collection(COLLECTION_NAMES.GROUPS).doc(id).delete(); 
        else { this.groups = this.groups.filter(g => g.id !== id); this.saveLocal('groups'); }
        this.closeModal('squadModal');
    },

    // --- 4. 活動 (Activity) 邏輯 ---

    renderActivities: function() {
        const list = document.getElementById('activityList');
        const emptyMsg = document.getElementById('noActivitiesMsg');
        if (!this.activities || this.activities.length === 0) { list.innerHTML = ''; if(emptyMsg) emptyMsg.classList.remove('hidden'); return; }
        if(emptyMsg) emptyMsg.classList.add('hidden');

        list.innerHTML = this.activities.map(act => {
            const winnersList = (act.winners || []).map((w, idx) => {
                const mem = this.members.find(m => m.id === w.memberId);
                const name = mem ? mem.gameName : 'Unknown';
                const job = mem ? mem.mainClass : '-';
                let timeStr = "";
                if(w.claimedAt) {
                    const d = new Date(w.claimedAt);
                    timeStr = `${d.getMonth()+1}/${d.getDate()} ${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`;
                }

                const isMaster = this.userRole === 'master';
                const lightClass = w.claimed ? 'claimed' : 'unclaimed';
                // 移除 confirm 邏輯：直接綁定點擊事件
                const clickAction = (isMaster && !w.claimed) ? `onclick="app.handleClaimReward('${act.id}', ${idx})"` : '';
                const titleText = w.claimed ? `已於 ${timeStr} 領取` : (isMaster ? '點擊發放獎勵 (立即紀錄)' : '未領取');

                return `
                <div class="flex justify-between items-center py-3 border-b border-slate-100 last:border-0">
                    <div class="flex flex-col">
                        <span class="font-bold text-slate-700 text-sm">${name}</span>
                        <span class="text-xs text-slate-400">${job}</span>
                        ${w.claimed ? `<span class="text-[10px] text-green-600 font-mono mt-1">${timeStr} 已領</span>` : ''}
                    </div>
                    <div class="status-light ${lightClass}" ${clickAction} title="${titleText}"></div>
                </div>`;
            }).join('');

            return `
            <div class="bg-white rounded-xl border border-yellow-200 shadow-sm overflow-hidden flex flex-col">
                <div class="bg-gradient-to-r from-orange-100 to-yellow-50 p-4 border-b border-yellow-200 flex justify-between items-start">
                    <div>
                        <h3 class="font-bold text-lg text-slate-800">${act.name}</h3>
                        <p class="text-xs text-yellow-800 font-bold mt-1 bg-yellow-200 px-2 py-1 rounded inline-block">${act.note || '總獎勵詳見備註'}</p>
                    </div>
                    ${this.userRole === 'master' ? `<button onclick="app.openActivityModal('${act.id}')" class="text-slate-400 hover:text-blue-500"><i class="fas fa-edit"></i></button>` : ''}
                </div>
                <div class="p-4 bg-white flex-grow">
                    ${winnersList.length ? winnersList : '<p class="text-center text-slate-400 text-sm py-4">名單確認中...</p>'}
                </div>
            </div>`;
        }).join('');
    },

    handleClaimReward: async function(actId, winnerIdx) {
        if(this.userRole !== 'master') return;
        // 已移除 confirm 彈窗，直接執行
        
        const actIndex = this.activities.findIndex(a => a.id === actId);
        if(actIndex === -1) return;
        
        let act = this.activities[actIndex];
        if(!act.winners[winnerIdx]) return;

        act.winners[winnerIdx].claimed = true;
        act.winners[winnerIdx].claimedAt = Date.now();
        act.winners[winnerIdx].claimedBy = 'Master';

        if (this.mode === 'firebase') {
            await this.db.collection(COLLECTION_NAMES.ACTIVITIES).doc(actId).update({ winners: act.winners });
        } else {
            this.activities[actIndex] = act;
            this.saveLocal('activities');
        }
    },

    openActivityModal: function(id) {
        if (this.userRole !== 'master') return;
        document.getElementById('activityId').value = id || '';
        document.getElementById('activityModalTitle').innerText = id ? '編輯' : '新增';
        this.currentActivityWinners = [];

        if (id) {
            const act = this.activities.find(a => a.id === id);
            if (act) {
                document.getElementById('activityName').value = act.name;
                document.getElementById('activityNote').value = act.note;
                this.currentActivityWinners = act.winners ? [...act.winners] : [];
                document.getElementById('deleteActivityBtnContainer').innerHTML = `<button type="button" onclick="app.deleteActivity('${id}')" class="text-red-500 text-sm hover:underline">刪除活動</button>`;
            }
        } else {
            document.getElementById('activityName').value = '';
            document.getElementById('activityNote').value = '';
            document.getElementById('deleteActivityBtnContainer').innerHTML = '';
        }
        this.renderActivityWinnersList();
        app.showModal('activityModal');
    },

    renderActivityWinnersList: function() {
        const container = document.getElementById('winnerListContainer');
        document.getElementById('winnerCount').innerText = this.currentActivityWinners.length;
        if (this.currentActivityWinners.length === 0) { container.innerHTML = '<p class="text-center text-slate-400 py-6 text-sm">請選取得獎者。</p>'; return; }
        container.innerHTML = this.currentActivityWinners.map((w, idx) => {
            const mem = this.members.find(m => m.id === w.memberId);
            return `
                <div class="flex justify-between items-center bg-yellow-50 p-2 rounded border border-yellow-100">
                    <span class="text-sm font-bold text-slate-700">${mem ? mem.gameName : 'Unknown'}</span>
                    <button onclick="app.removeWinner(${idx})" class="text-red-400 hover:text-red-600"><i class="fas fa-times"></i></button>
                </div>`;
        }).join('');
    },
    removeWinner: function(idx) { this.currentActivityWinners.splice(idx, 1); this.renderActivityWinnersList(); },
    saveActivity: async function() {
        if (this.userRole !== 'master') return;
        const id = document.getElementById('activityId').value, name = document.getElementById('activityName').value, note = document.getElementById('activityNote').value;
        if (!name) { alert("請輸入活動名稱"); return; }
        const activityData = { name, note, winners: this.currentActivityWinners };
        if (id) {
            if (this.mode === 'firebase') await this.db.collection(COLLECTION_NAMES.ACTIVITIES).doc(id).update(activityData);
            else { const idx = this.activities.findIndex(a => a.id === id); if (idx !== -1) { this.activities[idx] = { ...this.activities[idx], ...activityData }; this.saveLocal('activities'); } }
        } else {
            if (this.mode === 'firebase') await this.db.collection(COLLECTION_NAMES.ACTIVITIES).add(activityData);
            else { activityData.id = 'act_' + Date.now(); this.activities.push(activityData); this.saveLocal('activities'); }
        }
        this.closeModal('activityModal'); this.renderActivities();
    },
    deleteActivity: async function(id) {
        if (this.userRole !== 'master') return; if (!confirm("確定要刪除此活動嗎？")) return;
        if (this.mode === 'firebase') await this.db.collection(COLLECTION_NAMES.ACTIVITIES).doc(id).delete();
        else { this.activities = this.activities.filter(a => a.id !== id); this.saveLocal('activities'); }
        this.closeModal('activityModal'); this.renderActivities();
    },

    // --- Winner Selection Utils (保持不變) ---
    openWinnerSelectionModal: function() { this.tempWinnerSelection = this.currentActivityWinners.map(w => w.memberId); document.getElementById('winnerSearchInput').value = ''; this.renderWinnerMemberSelect(); app.showModal('winnerSelectionModal'); },
    renderWinnerMemberSelect: function() {
        const search = document.getElementById('winnerSearchInput').value.toLowerCase();
        let list = [...this.members].sort((a, b) => { const aSel = this.tempWinnerSelection.includes(a.id), bSel = this.tempWinnerSelection.includes(b.id); return (aSel && !bSel) ? -1 : (!aSel && bSel) ? 1 : (a.gameName||'').localeCompare(b.gameName||''); });
        if (search) list = list.filter(m => (m.gameName + m.lineName).toLowerCase().includes(search));
        document.getElementById('winnerMemberSelect').innerHTML = list.map(m => {
            const isSelected = this.tempWinnerSelection.includes(m.id);
            return `<label class="flex items-center space-x-2 p-2 rounded border transition cursor-pointer ${isSelected ? 'bg-blue-50 border-blue-200' : 'bg-white border-slate-100 hover:bg-slate-50'}"><input type="checkbox" value="${m.id}" class="rounded text-blue-500" ${isSelected ? 'checked' : ''} onchange="app.toggleWinnerCandidate('${m.id}')"><div class="min-w-0"><div class="text-sm font-bold text-slate-700">${m.gameName}</div><div class="text-xs text-slate-400">${m.mainClass}</div></div></label>`;
        }).join('');
    },
    toggleWinnerCandidate: function(id) { const idx = this.tempWinnerSelection.indexOf(id); if (idx === -1) this.tempWinnerSelection.push(id); else this.tempWinnerSelection.splice(idx, 1); this.renderWinnerMemberSelect(); },
    performLuckyDraw: function() {
        const search = document.getElementById('winnerSearchInput').value.toLowerCase();
        const candidates = this.members.filter(m => (m.gameName + m.lineName).toLowerCase().includes(search) && !this.tempWinnerSelection.includes(m.id));
        if (candidates.length === 0) { alert("無人可抽！"); return; }
        const lucky = candidates[Math.floor(Math.random() * candidates.length)];
        this.tempWinnerSelection.push(lucky.id); alert(`🎉 抽中：${lucky.gameName}`); this.renderWinnerMemberSelect();
    },
    confirmWinnerSelection: function() {
        this.currentActivityWinners = this.tempWinnerSelection.map(mid => this.currentActivityWinners.find(w => w.memberId === mid) || { memberId: mid, claimed: false });
        this.renderActivityWinnersList(); this.closeModal('winnerSelectionModal');
    },

    // --- Utils ---
    showHistoryModal: function() {
        if (!['master', 'admin'].includes(this.userRole)) { alert("權限不足"); return; }
        document.getElementById('historyList').innerHTML = this.history.map(log => {
            const date = new Date(log.timestamp).toLocaleString('zh-TW', { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' });
            return `<div class="p-3 bg-slate-50 border border-slate-200 rounded-lg"><div class="flex justify-between items-center text-xs text-slate-500 font-mono mb-1"><span>${date}</span><span class="${log.action.includes('刪除')?'text-red-600':'text-blue-600'} font-bold">${log.action}</span></div><p class="text-sm text-slate-800">${log.details}</p></div>`;
        }).join('') || '<p class="text-center text-slate-400 mt-4">尚無紀錄。</p>';
        this.showModal('historyModal');
    },
    copyText: function(el, text) { navigator.clipboard.writeText(text).then(() => { el.classList.add('copied'); setTimeout(() => el.classList.remove('copied'), 1500); }).catch(() => alert("複製失敗")); },
    copySquadList: function(gid) {
        let id = gid || document.getElementById('squadId').value; if(!id) return;
        const g = this.groups.find(g => g.id === id);
        const txt = `【${g.name}】\n` + g.members.map(m => {
            const mem = this.members.find(x => x.id === (typeof m === 'string' ? m : m.id));
            const status = typeof m === 'string' ? '' : (m.status === 'leave' ? '(請假)' : m.status === 'sub' ? '(替補)' : '');
            return mem ? `${mem.gameName} ${mem.mainClass.split('(')[0]} ${status}` : 'Unknown';
        }).join('\n');
        navigator.clipboard.writeText(txt).then(() => alert("已複製隊伍名單！"));
    },
    exportCSV: function() {
        let csv = "\uFEFFLINE 暱稱,遊戲 ID,主職業,定位,公會職位,備註\n";
        this.members.forEach(m => csv += `"${m.lineName}","${m.gameName}","${m.mainClass}","${m.role}","${m.rank||'成員'}","${(m.intro||'').replace(/"/g, '""')}"\n`);
        const link = document.createElement("a"); link.href = encodeURI("data:text/csv;charset=utf-8," + csv); link.download = "ROW成員.csv"; document.body.appendChild(link); link.click(); document.body.removeChild(link);
    },
    downloadSelf: function() {
        const backupData = { members: this.members, groups: this.groups, activities: this.activities, history: this.history };
        const link = document.createElement("a"); link.href = URL.createObjectURL(new Blob([JSON.stringify(backupData, null, 2)], {type: "application/json"})); link.download = `ROW_Backup_${new Date().toISOString().slice(0,10)}.json`; document.body.appendChild(link); link.click(); document.body.removeChild(link);
    },
    updateConfigInput: function(str) { const el = document.getElementById('firebaseConfigInput'); if(el) el.value = str; },
    saveConfig: function() { try { const config = JSON.parse(document.getElementById('firebaseConfigInput').value); if (!config.apiKey) throw new Error(); localStorage.setItem('row_firebase_config', JSON.stringify(config)); location.reload(); } catch { alert("JSON 格式錯誤！"); } },
    resetToDemo: function() { if (!confirm("確定要重置所有資料嗎？")) return; localStorage.clear(); location.reload(); },
    showModal: function(id) { document.getElementById(id).classList.remove('hidden'); },
    closeModal: function(id) { document.getElementById(id).classList.add('hidden'); }
};

window.app = App;
window.onload = () => App.init();