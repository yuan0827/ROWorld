// app.js

// --- 1. 確保配置已載入 ---
if (typeof window.AppConfig === 'undefined') {
    console.error("Configuration (config.js) not loaded. Application cannot start.");
    document.body.innerHTML = '<div style="padding: 50px; text-align: center; color: red;">錯誤：config.js 未載入或格式不正確。</div>';
}

const Config = window.AppConfig || {};
const {
    FIREBASE_CONFIG,
    COLLECTION_NAMES,
    SEED_DATA,
    SEED_GROUPS,
    SEED_ACTIVITIES, // 確保 config.js 有匯出這個
    JOB_STRUCTURE,
    JOB_STYLES
} = Config;

// --- 2. 應用程式核心邏輯 ---

const App = {
    // 初始化狀態
    db: null,
    auth: null,
    members: [],
    groups: [],
    activities: [], // 新增：活動資料
    history: [],
    currentTab: 'home',
    currentFilter: 'all',
    currentJobFilter: 'all',
    mode: 'demo',
    userRole: 'guest',
    
    // 暫存狀態
    currentSquadMembers: [],
    currentActivityWinners: [], // 新增：編輯活動時的暫存得獎者
    tempWinnerSelection: [],    // 新增：選人視窗的暫存名單

    // 初始化應用程式
    init: async function() {
        this.loadLocalState();
        this.initFirebase();
        this.updateAdminUI();
        this.populateBaseJobSelect(); // 填充職業下拉選單
        this.switchTab('home');
    },

    // 載入本地儲存的資料與權限狀態
    loadLocalState: function() {
        const savedRole = localStorage.getItem('row_user_role');
        if (savedRole && ['admin', 'master', 'commander'].includes(savedRole)) {
            this.userRole = savedRole;
        }

        const storedMem = localStorage.getItem('row_local_members');
        const storedGrp = localStorage.getItem('row_local_groups');
        const storedAct = localStorage.getItem('row_local_activities'); // 載入活動
        const storedHistory = localStorage.getItem('row_mod_history');
        
        this.members = storedMem ? JSON.parse(storedMem) : SEED_DATA;
        this.groups = storedGrp ? JSON.parse(storedGrp) : SEED_GROUPS;
        this.activities = storedAct ? JSON.parse(storedAct) : (SEED_ACTIVITIES || []); // 初始化活動
        this.history = storedHistory ? JSON.parse(storedHistory) : [];
        
        this.members = this.sortMembers(this.members);
    },

    // 初始化 Firebase
    initFirebase: function() {
        let config = null;
        const storedConfig = localStorage.getItem('row_firebase_config');

        try {
            if (storedConfig) {
                config = JSON.parse(storedConfig);
            } else if (FIREBASE_CONFIG && FIREBASE_CONFIG.apiKey) {
                config = FIREBASE_CONFIG;
                this.updateConfigInput(JSON.stringify(FIREBASE_CONFIG, null, 2));
            }
        } catch (e) {
            console.error("Error parsing Firebase config:", e);
        }

        if (config && config.apiKey) {
            try {
                if (!firebase.apps.length) firebase.initializeApp(config);
                this.auth = firebase.auth();
                this.db = firebase.firestore();
                this.mode = 'firebase';
                this.syncWithFirebase();
            } catch (e) {
                console.error("Firebase Init Failed (using Demo Mode):", e);
                this.mode = 'demo';
            }
        } else {
            this.mode = 'demo';
        }
    },
    
    // Firebase 數據同步
    syncWithFirebase: function() {
        if (!this.db || this.mode !== 'firebase') return;

        // 成員同步
        this.db.collection(COLLECTION_NAMES.MEMBERS).onSnapshot(snap => { 
            const arr = []; snap.forEach(d => arr.push({ id: d.id, ...d.data() })); 
            this.members = this.sortMembers(arr); 
            this.saveLocal('members');
            this.render(); 
        });

        // 隊伍同步
        this.db.collection(COLLECTION_NAMES.GROUPS).onSnapshot(snap => { 
            const arr = []; snap.forEach(d => arr.push({ id: d.id, ...d.data() })); 
            this.groups = arr; 
            this.saveLocal('groups');
            this.render(); 
        });

        // 活動同步 (新增)
        if (COLLECTION_NAMES.ACTIVITIES) {
            this.db.collection(COLLECTION_NAMES.ACTIVITIES).onSnapshot(snap => {
                const arr = []; snap.forEach(d => arr.push({ id: d.id, ...d.data() }));
                this.activities = arr;
                this.saveLocal('activities');
                this.render();
            });
        }
    },

    // 排序方法
    sortMembers: function(membersArray) {
        return membersArray.sort((a, b) => {
            const idA = a.id;
            const idB = b.id;
            const isSeedA = /^m\d{2}$/.test(idA);
            const isSeedB = /^m\d{2}$/.test(idB);
            
            if (isSeedA && isSeedB) return idA.localeCompare(idB);
            if (isSeedA) return -1;
            if (isSeedB) return 1;
            
            return (a.gameName || '').localeCompare(b.gameName || '');
        });
    },

    // 本地儲存
    saveLocal: function(key = 'all') {
        if (this.mode === 'demo') {
            if (key === 'members' || key === 'all') localStorage.setItem('row_local_members', JSON.stringify(this.members));
            if (key === 'groups' || key === 'all') localStorage.setItem('row_local_groups', JSON.stringify(this.groups));
            if (key === 'activities' || key === 'all') localStorage.setItem('row_local_activities', JSON.stringify(this.activities)); // 儲存活動
            localStorage.setItem('row_mod_history', JSON.stringify(this.history));
            this.render();
        }
    },
    
    // 歷史紀錄邏輯
    logChange: function(action, details, targetId) {
        const log = {
            timestamp: Date.now(),
            user: this.userRole,
            action: action,
            details: details,
            targetId: targetId || 'N/A'
        };
        this.history.unshift(log);
        this.saveLocal('history'); 
    },

    // 處理登入
    openLoginModal: function() {
        if(this.userRole !== 'guest') { 
            if(confirm("確定要登出嗎？")) { 
                this.userRole = 'guest'; 
                localStorage.removeItem('row_user_role'); 
                this.updateAdminUI(); 
                this.switchTab('home'); // 登出後切回首頁避免權限殘留
            } 
        } else { 
            document.getElementById('loginForm').reset(); 
            this.showModal('loginModal'); 
        }
    },

    handleLogin: function() {
        const u = document.getElementById('loginUser').value; 
        const p = document.getElementById('loginPass').value;
        
        let role = 'guest';
        if (u === 'poppy' && p === '123456') role = 'master';
        else if (u === 'yuan' && p === '123456') role = 'admin';
        else if (u === 'commander' && p === '123456') role = 'commander';
        else { alert("帳號或密碼錯誤"); return; }

        this.userRole = role;
        localStorage.setItem('row_user_role', this.userRole);
        this.closeModal('loginModal'); 
        this.updateAdminUI(); 
        alert(`登入成功！身分：${role}`);
    },
    
    // 更新 UI 權限顯示
    updateAdminUI: function() {
        const btn = document.getElementById('adminToggleBtn');
        const adminControls = document.getElementById('adminControls');
        const isAuth = this.userRole !== 'guest';
        
        if(isAuth) {
            btn.classList.add('admin-mode-on', 'text-blue-600'); btn.classList.remove('text-slate-400');
            btn.innerHTML = '<i class="fas fa-sign-out-alt"></i>';
        } else {
            btn.classList.remove('admin-mode-on', 'text-blue-600'); btn.classList.add('text-slate-400');
            btn.innerHTML = '<i class="fas fa-user-shield"></i>';
        }

        if (['master', 'admin'].includes(this.userRole)) {
            if (adminControls) adminControls.classList.remove('hidden');
        } else {
            if (adminControls) adminControls.classList.add('hidden');
        }
        
        // 更新 rank 選擇器
        const rankSelect = document.getElementById('rank');
        const lockIcon = document.getElementById('rankLockIcon');
        if (this.userRole === 'master') {
            if (rankSelect) rankSelect.disabled = false;
            if (lockIcon) lockIcon.className = "fas fa-unlock text-blue-500 text-xs ml-2";
        } else {
            if (rankSelect) rankSelect.disabled = true;
            if (lockIcon) lockIcon.className = "fas fa-lock text-slate-300 text-xs ml-2";
        }

        // 重新渲染以更新按鈕可見性
        this.render();
    },

    // 切換頁籤
    switchTab: function(tab) {
        this.currentTab = tab;
        
        // 隱藏所有視圖
        document.getElementById('view-home').classList.toggle('hidden', tab !== 'home');
        document.getElementById('view-members').classList.toggle('hidden', tab !== 'members');
        document.getElementById('view-groups').classList.toggle('hidden', tab !== 'gvg' && tab !== 'groups');
        document.getElementById('view-activity').classList.toggle('hidden', tab !== 'activity'); // 修正：確保活動頁面能顯示

        // 切換導航欄
        document.getElementById('nav-container').classList.toggle('hidden', tab === 'home');
        
        // 更新按鈕狀態
        document.querySelectorAll('.nav-pill').forEach(b => b.classList.remove('active'));
        const activeBtn = document.getElementById('tab-' + tab);
        if(activeBtn) activeBtn.classList.add('active');

        // GVG 權限警告
        const adminWarning = document.getElementById('adminWarning');
        if (tab === 'gvg' && !['master', 'admin', 'commander'].includes(this.userRole)) {
            if (adminWarning) adminWarning.classList.remove('hidden');
        } else {
            if (adminWarning) adminWarning.classList.add('hidden');
        }

        // 活動頁面權限警告與標題
        const activityWarning = document.getElementById('activityAdminWarning');
        const addActivityBtn = document.getElementById('addActivityBtn');
        if (tab === 'activity') {
            // 只有會長能看到新增按鈕
            if (this.userRole === 'master') {
                if(addActivityBtn) addActivityBtn.classList.remove('hidden');
                if(activityWarning) activityWarning.classList.add('hidden');
            } else {
                if(addActivityBtn) addActivityBtn.classList.add('hidden');
                if(activityWarning) activityWarning.classList.remove('hidden');
            }
        }

        // 設置標題
        if(tab === 'gvg') {
            document.getElementById('groupViewTitle').innerText = 'GVG 攻城戰分組';
            document.getElementById('squadModalTitle').innerText = 'GVG 分組管理';
        } else if(tab === 'groups') {
            document.getElementById('groupViewTitle').innerText = '固定團列表';
            document.getElementById('squadModalTitle').innerText = '固定團管理';
        }

        this.render();
    },

    // 主要動作按鈕 (右上方 + 號)
    handleMainAction: function() { 
        if(this.currentTab === 'members') {
            this.openAddModal();
        } 
        else if(this.currentTab === 'gvg' || this.currentTab === 'groups') {
            if(['master', 'admin', 'commander'].includes(this.userRole)) this.openSquadModal(); 
            else alert("權限不足：僅有管理人員可建立隊伍");
        }
        else if(this.currentTab === 'activity') {
            if(this.userRole === 'master') this.openActivityModal();
            else alert("權限不足：僅有會長可建立活動");
        }
    },
    
    // 渲染主入口
    render: function() {
        if (this.currentTab === 'members') this.renderMembers();
        else if (this.currentTab === 'gvg' || this.currentTab === 'groups') this.renderSquads();
        else if (this.currentTab === 'activity') this.renderActivities(); // 渲染活動
        
        // 更新首頁計數
        const memberCountHome = document.querySelector('#view-home .ro-menu-btn .ro-btn-content p');
        if (memberCountHome) memberCountHome.innerText = `Guild Members (${this.members.length})`;
    },

    // --- 成員相關邏輯 ---

    renderMembers: function() {
        const grid = document.getElementById('memberGrid');
        const searchVal = document.getElementById('searchInput').value.toLowerCase();
        
        let filtered = this.members.filter(item => {
            const fullText = (item.lineName + item.gameName + item.mainClass + item.role + (item.intro||"")).toLowerCase();
            const matchText = fullText.includes(searchVal);
            const matchRole = this.currentFilter === 'all' || item.role.includes(this.currentFilter) || (this.currentFilter === '坦' && item.mainClass.includes('坦'));
            const matchJob = this.currentJobFilter === 'all' || (item.mainClass||"").startsWith(this.currentJobFilter);
            return matchText && matchRole && matchJob;
        });

        document.getElementById('memberCount').innerText = `Total: ${filtered.length}`;
        document.getElementById('stat-dps').innerText = this.members.filter(d => d.role.includes('輸出')).length;
        document.getElementById('stat-sup').innerText = this.members.filter(d => d.role.includes('輔助')).length;
        document.getElementById('stat-tank').innerText = this.members.filter(d => d.role.includes('坦')).length;

        grid.innerHTML = filtered.map((item, idx) => this.createCardHTML(item, idx)).join('');
    },
    
    createCardHTML: function(item, idx) {
        const mainJob = item.mainClass ? item.mainClass.split('(')[0] : '';
        const style = JOB_STYLES.find(s => s.key.some(k => mainJob.includes(k))) || { class: 'bg-job-default', icon: 'fa-user' };
        
        let rankBadge = '';
        if(item.rank === '會長') rankBadge = `<span class="rank-badge rank-master">會長</span>`;
        else if(item.rank === '指揮官') rankBadge = `<span class="rank-badge rank-commander">指揮官</span>`;
        else if(item.rank === '資料管理員') rankBadge = `<span class="rank-badge rank-admin">管理</span>`;

        const memberSquads = this.groups.filter(g => g.members.some(m => (typeof m === 'string' ? m : m.id) === item.id));
        const squadBadges = memberSquads.map(s => {
            const color = s.type === 'gvg' ? 'bg-red-50 text-red-600 border-red-100' : 'bg-green-50 text-green-600 border-green-100';
            return `<span class="${color} text-[10px] px-1.5 rounded border truncate inline-block max-w-[80px]">${s.name}</span>`;
        }).join('');
        
        const origIndex = SEED_DATA.findIndex(s => s.id === item.id);
        const displayNo = origIndex >= 0 ? `#${(origIndex + 1).toString().padStart(2, '0')}` : "•";

        const getRoleBadge = (r) => {
            if (r.includes('輸出')) return `<span class="tag tag-dps">${r}</span>`;
            else if (r.includes('坦')) return `<span class="tag tag-tank">${r}</span>`;
            else if (r.includes('輔助')) return `<span class="tag tag-sup">${r}</span>`;
            return ''; 
        }

        return `
            <div class="card cursor-pointer group relative" onclick="app.openEditModal('${item.id}')">
                <div class="member-no">${displayNo}</div>
                <div class="job-stripe ${style.class}"></div>
                <div class="job-icon-area ${style.class} bg-opacity-20">
                    <i class="fas ${style.icon} ${style.class.replace('bg-', 'text-')} opacity-80 group-hover:scale-110 transition"></i>
                </div>
                <div class="flex-grow p-2.5 flex flex-col justify-between min-w-0">
                    <div>
                        <div class="flex justify-between items-start pr-6">
                            <div class="flex items-center gap-1 min-w-0">
                                ${rankBadge}
                                <h3 class="font-bold text-slate-700 text-base truncate">${item.gameName || '未命名'}</h3>
                            </div>
                            ${getRoleBadge(item.role)}
                        </div>
                        <div class="text-xs font-bold text-slate-400 mt-0.5">${item.mainClass || '未定'}</div>
                    </div>
                    <div class="flex justify-between items-end mt-1">
                        <div class="flex flex-col gap-1 w-full mr-1">
                               <div class="flex items-center text-[10px] text-slate-400 font-mono bg-white border border-slate-100 rounded px-1.5 py-0.5 w-fit hover:bg-slate-50 copy-tooltip" 
                                    onclick="event.stopPropagation(); app.copyText(this, '${item.lineName}')">
                                    <i class="fab fa-line mr-1 text-green-500"></i> ${item.lineName}
                                   </div>
                                   <div class="flex gap-1 overflow-hidden h-4">${squadBadges}</div>
                        </div>
                        ${item.intro ? `<i class="fas fa-info-circle text-blue-200 hover:text-blue-500" title="${item.intro}"></i>` : ''}
                    </div>
                </div>
            </div>
        `;
    },

    setFilter: function(f) {
        this.currentFilter = f;
        document.querySelectorAll('.filter-btn').forEach(b => {
            b.className = b.innerText.includes(f==='all'?'全部':f) || (f==='坦' && b.innerText.includes('坦克')) || (f==='待定' && b.innerText.includes('待定'))
            ? "px-4 py-1.5 rounded-full text-sm font-bold bg-slate-800 text-white transition whitespace-nowrap filter-btn active shadow-md" 
            : "px-4 py-1.5 rounded-full text-sm font-bold bg-white text-slate-600 border border-slate-200 hover:bg-blue-50 transition whitespace-nowrap filter-btn";
        });
        this.renderMembers();
    },

    setJobFilter: function(j) { 
        this.currentJobFilter = j; 
        this.renderMembers(); 
    },

    populateBaseJobSelect: function() {
        const baseSelect = document.getElementById('baseJobSelect');
        if (!baseSelect) return;
        baseSelect.innerHTML = '<option value="" disabled selected>選擇職業</option>';
        Object.keys(JOB_STRUCTURE).forEach(job => { 
            const opt = document.createElement('option'); 
            opt.value = job; 
            opt.innerText = job; 
            baseSelect.appendChild(opt); 
        });
    },

    updateSubJobSelect: function() {
        const baseJob = document.getElementById('baseJobSelect').value;
        const subSelect = document.getElementById('subJobSelect');
        subSelect.innerHTML = '<option value="" disabled selected>選擇流派</option>';
        if (JOB_STRUCTURE[baseJob]) {
            subSelect.disabled = false;
            JOB_STRUCTURE[baseJob].forEach(sub => { 
                const val = `${baseJob}(${sub})`; 
                const opt = document.createElement('option'); 
                opt.value = val; 
                opt.innerText = sub; 
                subSelect.appendChild(opt); 
            });
        } else { 
            subSelect.disabled = true; 
        }
    },

    toggleJobInputMode: function() {
        const input = document.getElementById('subJobInput');
        const selectWrapper = document.getElementById('subJobSelectWrapper');
        if (input.classList.contains('hidden')) { 
            input.classList.remove('hidden'); 
            selectWrapper.classList.add('hidden'); 
        } else { 
            input.classList.add('hidden'); 
            selectWrapper.classList.remove('hidden'); 
        }
    },

    openAddModal: function() { 
        document.getElementById('memberForm').reset(); 
        document.getElementById('editId').value = ''; 
        document.getElementById('deleteBtnContainer').innerHTML = ''; 
        document.getElementById('baseJobSelect').value = "";
        this.updateSubJobSelect();
        document.getElementById('subJobSelectWrapper').classList.remove('hidden');
        document.getElementById('subJobInput').classList.add('hidden');
        app.showModal('editModal'); 
    },
    
    openEditModal: function(id) {
        const item = this.members.find(d => d.id === id); if (!item) return;
        document.getElementById('editId').value = item.id;
        document.getElementById('lineName').value = item.lineName; 
        document.getElementById('gameName').value = item.gameName;
        document.getElementById('role').value = item.role.split(/[ ,]/)[0]||'待定';
        document.getElementById('rank').value = item.rank || '成員';
        document.getElementById('intro').value = item.intro;
        
        const baseSelect = document.getElementById('baseJobSelect');
        const subSelect = document.getElementById('subJobSelect');
        const subInput = document.getElementById('subJobInput');
        const selectWrapper = document.getElementById('subJobSelectWrapper');
        const toggleBtn = document.getElementById('toggleJobBtn'); // 取得按鈕 DOM

        const fullJob = item.mainClass || '';
        const match = fullJob.match(/^([^(]+)\(([^)]+)\)$/);
        
        // 修正：使用正確的變數 toggleBtn
        if (['master', 'admin'].includes(this.userRole)) { toggleBtn.classList.remove('hidden'); } 
        else { toggleBtn.classList.add('hidden'); }
        
        subInput.classList.add('hidden'); 
        selectWrapper.classList.remove('hidden');

        if (match && JOB_STRUCTURE[match[1]]) {
            baseSelect.value = match[1];
            this.updateSubJobSelect();
            subSelect.value = fullJob;
        } else {
            const potentialBaseJob = fullJob.split('(')[0];
             if (JOB_STRUCTURE[potentialBaseJob]) {
                baseSelect.value = potentialBaseJob;
                this.updateSubJobSelect();
                subSelect.value = fullJob;
             }
             else if (['master', 'admin'].includes(this.userRole)) { 
                baseSelect.value = ""; 
                subInput.value = fullJob; 
                subInput.classList.remove('hidden'); 
                selectWrapper.classList.add('hidden'); 
            } else { 
                baseSelect.value = ""; 
                subSelect.innerHTML = '<option value="" disabled selected>選擇流派</option>'; 
                subSelect.disabled = true; 
            }
        }

        this.updateAdminUI();

        if (['master', 'admin'].includes(this.userRole)) {
             document.getElementById('deleteBtnContainer').innerHTML = `<button type="button" onclick="app.deleteMember('${item.id}')" class="text-red-500 text-sm hover:underline">刪除成員</button>`;
        } else {
             document.getElementById('deleteBtnContainer').innerHTML = '';
        }
        app.showModal('editModal');
    },

    saveMemberData: async function() {
        const id = document.getElementById('editId').value;
        let mainClass = "";
        const input = document.getElementById('subJobInput');
        const select = document.getElementById('subJobSelect');
        
        if (!input.classList.contains('hidden')) { mainClass = input.value; } 
        else { mainClass = select.value; }
        
        const baseJob = document.getElementById('baseJobSelect').value;
        if (!mainClass || mainClass === "" || mainClass === "選擇流派") {
            mainClass = baseJob;
        } else if (mainClass.includes('(') === false && baseJob !== "") {
             if (!JOB_STRUCTURE[baseJob].some(j => mainClass === `${baseJob}(${j})`)) {
                mainClass = `${baseJob}(${mainClass})`;
             }
        }
        
        if (!mainClass || mainClass === "" || mainClass === "選擇職業") mainClass = "待定";
        const roleValue = document.getElementById('role').value;
        
        const member = { 
            lineName: document.getElementById('lineName').value, 
            gameName: document.getElementById('gameName').value, 
            mainClass: mainClass, 
            role: roleValue, 
            rank: document.getElementById('rank').value, 
            intro: document.getElementById('intro').value 
        };
        
        let action = '';
        if (id) { 
            await this.updateMember(id, member);
            action = '成員資料更新';
        } else { 
            await this.addMember(member); 
            action = '新增成員';
        }
        this.logChange(action, `${member.gameName} (${member.mainClass})`, id || member.gameName);
        this.closeModal('editModal');
    },

    addMember: async function(member) {
        if (this.mode === 'firebase') { 
            await this.db.collection(COLLECTION_NAMES.MEMBERS).add(member); 
        } else { 
            member.id = 'm_' + Date.now(); 
            this.members.push(member); 
            this.members = this.sortMembers(this.members); 
            this.saveLocal('members'); 
        }
    },

    updateMember: async function(id, member) {
        if (this.mode === 'firebase') { 
            await this.db.collection(COLLECTION_NAMES.MEMBERS).doc(id).update(member); 
        } else { 
            const idx = this.members.findIndex(d => d.id === id); 
            if (idx !== -1) { 
                this.members[idx] = { ...this.members[idx], ...member }; 
                this.members = this.sortMembers(this.members); 
                this.saveLocal('members'); 
            } 
        }
    },

    deleteMember: async function(id) {
        if (!['master', 'admin'].includes(this.userRole)) { alert("權限不足"); return; }
        if (!confirm("確定要刪除這位成員嗎？")) return;
        const member = this.members.find(d => d.id === id);
        if (this.mode === 'firebase') { 
            await this.db.collection(COLLECTION_NAMES.MEMBERS).doc(id).delete(); 
        } else { 
            this.members = this.members.filter(d => d.id !== id); 
            this.groups.forEach(g => { 
                g.members = g.members.filter(mid => (typeof mid === 'string' ? mid : mid.id) !== id); 
            }); 
            this.saveLocal(); 
        }
        this.logChange('成員刪除', `刪除成員: ${member ? member.gameName : 'Unknown'}`, id);
        this.closeModal('editModal');
    },

    // --- 隊伍 (Squad) 邏輯 ---

    renderSquads: function() {
        const type = this.currentTab === 'gvg' ? 'gvg' : 'groups';
        const search = document.getElementById('groupSearchInput').value.toLowerCase();
        const canEdit = ['master', 'admin', 'commander'].includes(this.userRole);
        
        let visibleGroups = this.groups.filter(g => (g.type || 'gvg') === type);
        
        if (search) {
            visibleGroups = visibleGroups.filter(g => {
                if (g.name.toLowerCase().includes(search)) return true;
                const hasMember = g.members.some(m => {
                    const id = typeof m === 'string' ? m : m.id;
                    const mem = this.members.find(x => x.id === id);
                    return mem && (mem.gameName.toLowerCase().includes(search) || (mem.mainClass||'').toLowerCase().includes(search));
                });
                return hasMember;
            });
        }

        const grid = document.getElementById('squadGrid');
        const emptyMsg = document.getElementById('noSquadsMsg');
        if (visibleGroups.length === 0) { grid.innerHTML = ''; emptyMsg.classList.remove('hidden'); return; }
        emptyMsg.classList.add('hidden');

        grid.innerHTML = visibleGroups.map(group => {
            const groupMembers = (group.members || []).map(m => {
                const id = typeof m === 'string' ? m : m.id;
                const status = typeof m === 'string' ? 'pending' : (m.status || 'pending');
                const mem = this.members.find(x => x.id === id);
                return mem ? { ...mem, status } : null;
            }).filter(x => x);

            const getRoleClass = (role) => {
                if (role.includes('輸出')) return 'role-badge-dps';
                if (role.includes('坦')) return 'role-badge-tank';
                if (role.includes('輔助')) return 'role-badge-sup';
                return 'role-badge-pending';
            };

            const getStatusIcon = (status) => {
                 const className = status === 'confirmed' ? 'status-confirmed' : 'status-pending';
                 const icon = status === 'confirmed' ? 'fa-check-circle' : 'fa-circle-xmark';
                 return `<i class="fas ${icon} ${className} transition"></i>`;
            };
            
            const list = groupMembers.map(m => `
                <div class="flex items-center justify-between text-sm py-2 border-b border-slate-200 last:border-0 hover:bg-slate-50 px-3 transition">
                    <div class="flex items-center gap-2 min-w-0">
                        <span class="${getRoleClass(m.role)} text-xs">${m.role}</span>
                        <span class="text-slate-800 font-bold truncate">${m.gameName}</span>
                    </div>
                    <div class="flex items-center gap-3">
                        <span class="text-xs text-slate-500 font-mono">${(m.mainClass||'').replace(/\(.*\)/, '')}</span>
                        ${type === 'gvg' && canEdit ? 
                            `<div class="text-lg cursor-pointer hover:scale-110 transition" title="切換出席狀態" 
                                    onclick="event.stopPropagation(); app.toggleMemberStatus('${group.id}', '${m.id}')">
                                ${getStatusIcon(m.status)}
                            </div>` 
                        : ''}
                    </div>
                </div>`).join('');
                
            const headerClass = type === 'gvg' ? 'header squad-card-gvg-header' : 'bg-blue-50 p-4 border-b border-blue-100';
            const cardClass = type === 'gvg' ? 'squad-card-gvg' : 'bg-white rounded-xl shadow-sm border border-blue-100';

            const editBtn = canEdit ? `<button onclick="app.openSquadModal('${group.id}')" class="text-slate-400 hover:text-blue-600 p-1"><i class="fas fa-cog"></i></button>` : '';
            const copyBtn = `<button onclick="app.copySquadList('${group.id}')" class="text-slate-400 hover:text-green-600 p-1 ml-2" title="複製隊伍"><i class="fas fa-copy"></i></button>`;

            const confirmedCount = groupMembers.filter(m => m.status === 'confirmed').length;
            const statusText = type === 'gvg' 
                ? `<div class="font-bold text-sm ${confirmedCount === 5 ? 'text-green-600' : 'text-red-500'}">戰鬥成員: ${confirmedCount}/${groupMembers.length} (已確認: ${confirmedCount})</div>`
                : `<div class="text-[10px] text-slate-400">成員: ${groupMembers.length}</div>`;

            return `
                <div class="${cardClass} flex flex-col h-full overflow-hidden">
                    <div class="${headerClass} p-4 flex justify-between items-center rounded-t-[7px]">
                        <div><h3 class="text-xl font-bold">${group.name}</h3><p class="text-xs mt-1 italic opacity-80">${group.note||''}</p></div>
                        <div class="flex items-center">${copyBtn}${editBtn}</div>
                    </div>
                    <div class="flex-grow p-1 overflow-y-auto max-h-80">${list.length?list:'<p class="text-sm text-slate-400 text-center py-4">無戰鬥編組</p>'}</div>
                    <div class="bg-white p-3 border-t border-slate-100 flex justify-end items-center shrink-0">
                        ${statusText}
                    </div>
                </div>`;
        }).join('');
    },

    toggleMemberStatus: function(groupId, memberId) {
        if (!['master', 'admin', 'commander'].includes(this.userRole)) return;
        const group = this.groups.find(g => g.id === groupId); if(!group) return;
        const memberIndex = group.members.findIndex(m => (typeof m === 'string' ? m : m.id) === memberId);
        if (memberIndex === -1) return;
        
        let memberData = group.members[memberIndex];
        if (typeof memberData === 'string') memberData = { id: memberData, status: 'confirmed' };
        else memberData.status = memberData.status === 'confirmed' ? 'pending' : 'confirmed';
        
        group.members[memberIndex] = memberData;
        
        if (this.mode === 'firebase') this.db.collection(COLLECTION_NAMES.GROUPS).doc(groupId).update({ members: group.members });
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
        if (index > -1) { this.currentSquadMembers.splice(index, 1); } 
        else { 
            if (this.currentSquadMembers.length >= 5 && this.currentTab === 'gvg') return; 
            this.currentSquadMembers.push({ id: id, status: 'pending' }); 
        }
        this.renderSquadMemberSelect();
    },

    renderSquadMemberSelect: function() {
        const currentSquadType = document.getElementById('squadType').value;
        const search = document.getElementById('memberSearch').value.toLowerCase();
        let availableMembers = [...this.members];
        const filtered = availableMembers.filter(m => (m.gameName + m.lineName + m.mainClass).toLowerCase().includes(search));
        
        const isSelected = (mid) => this.currentSquadMembers.some(sm => sm.id === mid);
        filtered.sort((a,b) => (isSelected(a.id) === isSelected(b.id)) ? 0 : isSelected(a.id) ? -1 : 1);
        
        const count = this.currentSquadMembers.length;
        const isFull = count >= 5 && this.currentTab === 'gvg';
        document.getElementById('selectedCount').innerText = `${count}/5`;
        document.getElementById('selectedCount').className = isFull ? "text-red-500 font-bold" : "text-blue-500 font-bold";

        document.getElementById('squadMemberSelect').innerHTML = filtered.map(m => {
            const checked = isSelected(m.id);
            const isDisabled = !checked && isFull;
            const mainJob = m.mainClass ? m.mainClass.split('(')[0] : '初心者';
            const style = JOB_STYLES.find(s => s.key.some(k => mainJob.includes(k))) || { class: 'bg-job-default', icon: 'fa-user' };

            return `
            <label class="flex items-center space-x-2 p-2 rounded border border-blue-100 transition select-none ${isDisabled ? 'opacity-50 bg-slate-50' : 'hover:bg-blue-50 bg-white cursor-pointer'}">
                <input type="checkbox" value="${m.id}" class="rounded text-blue-500 focus:ring-blue-400" ${checked?'checked':''} ${isDisabled?'disabled':''} onchange="app.toggleSquadMember('${m.id}')">
                <div class="w-6 h-6 rounded-full flex items-center justify-center text-xs ${style.class.replace('bg-', 'text-')} bg-opacity-20">
                    <i class="fas ${style.icon}"></i>
                </div>
                <div class="min-w-0 flex-grow"><div class="text-xs font-bold text-slate-700 truncate">${m.gameName} <span class="text-slate-500 font-normal text-[10px]">${m.mainClass}</span></div></div>
                <span class="text-xs ${m.role.includes('輸出')?'text-red-500':m.role.includes('輔助')?'text-green-500':m.role.includes('坦')?'text-blue-500':'text-slate-400'}">${m.role.substring(0, 1)}</span>
            </label>`;
        }).join('');
    },
    
    saveSquad: async function() {
        if (!['master', 'admin', 'commander'].includes(this.userRole)) { alert("權限不足"); return; }
        const id = document.getElementById('squadId').value;
        const type = document.getElementById('squadType').value;
        const name = document.getElementById('squadName').value;
        const note = document.getElementById('squadNote').value;
        const selectedMembers = [...this.currentSquadMembers];
        
        if(!name) { alert("請輸入隊伍名稱"); return; }
        if (type === 'gvg' && selectedMembers.length !== 5) { alert("GVG 隊伍人數必須為 5 人"); return; }
        
        const squadData = { name, note, members: selectedMembers, type };
        
        if (id) {
            if (this.mode === 'firebase') await this.db.collection(COLLECTION_NAMES.GROUPS).doc(id).update(squadData); 
            else { 
                const idx = this.groups.findIndex(g => g.id === id); 
                if(idx !== -1) { this.groups[idx] = { ...this.groups[idx], ...squadData }; this.saveLocal('groups'); } 
            }
        } else {
            if (this.mode === 'firebase') await this.db.collection(COLLECTION_NAMES.GROUPS).add(squadData); 
            else { squadData.id = 'g_' + Date.now(); this.groups.push(squadData); this.saveLocal('groups'); }
        }
        this.logChange(id ? '隊伍更新' : '建立新隊伍', `隊伍: ${name}`, id || 'new');
        this.closeModal('squadModal');
    },

    deleteSquad: async function(id) {
        if (!['master', 'admin', 'commander'].includes(this.userRole)) return;
        if (!confirm("確定要解散這個隊伍嗎？")) return;
        const group = this.groups.find(g => g.id === id);
        if (this.mode === 'firebase') await this.db.collection(COLLECTION_NAMES.GROUPS).doc(id).delete(); 
        else { this.groups = this.groups.filter(g => g.id !== id); this.saveLocal('groups'); }
        this.logChange('解散隊伍', `解散隊伍: ${group ? group.name : 'Unknown'}`, id);
        this.closeModal('squadModal');
    },

    // --- 活動 (Activity) 邏輯 (全新增補) ---

    renderActivities: function() {
        const list = document.getElementById('activityList');
        const emptyMsg = document.getElementById('noActivitiesMsg');
        
        // 防呆
        if (!this.activities) this.activities = [];

        if (this.activities.length === 0) {
            list.innerHTML = '';
            if(emptyMsg) emptyMsg.classList.remove('hidden');
            return;
        }
        if(emptyMsg) emptyMsg.classList.add('hidden');

        list.innerHTML = this.activities.map(act => `
            <div class="bg-white p-4 rounded-xl border border-yellow-200 shadow-sm relative overflow-hidden group hover:shadow-md transition">
                <div class="flex justify-between items-start mb-2">
                    <h3 class="font-bold text-lg text-slate-800">${act.name}</h3>
                    ${this.userRole === 'master' ? 
                      `<div class="flex gap-2">
                         <button onclick="app.openActivityModal('${act.id}')" class="text-slate-400 hover:text-blue-500"><i class="fas fa-edit"></i></button>
                       </div>` : ''}
                </div>
                <p class="text-sm text-slate-500 mb-3 whitespace-pre-line">${act.note || '無獎勵說明'}</p>
                <div class="bg-yellow-50 rounded-lg p-3 border border-yellow-100">
                    <div class="text-xs font-bold text-yellow-700 mb-2 flex items-center"><i class="fas fa-crown mr-1"></i> 得獎名單 (${act.winners ? act.winners.length : 0})</div>
                    <div class="flex flex-wrap gap-2">
                        ${(act.winners || []).length > 0 ? (act.winners || []).map(w => {
                            const mem = this.members.find(m => m.id === w.memberId);
                            const name = mem ? mem.gameName : 'Unknown';
                            return `<span class="bg-white border border-yellow-200 text-xs px-2 py-1 rounded-md text-slate-700 font-bold shadow-sm">${name}</span>`;
                        }).join('') : '<span class="text-xs text-slate-400 italic">尚未產生得獎者</span>'}
                    </div>
                </div>
            </div>
        `).join('');
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
                // 複製得獎者資料
                this.currentActivityWinners = act.winners ? [...act.winners] : [];
                document.getElementById('deleteActivityBtnContainer').innerHTML = `<button type="button" onclick="app.deleteActivity('${id}')" class="text-red-500 text-sm hover:underline">刪除活動</button>`;
            }
        } else {
            document.getElementById('activityName').value = '';
            document.getElementById('activityNote').value = '';
            document.getElementById('deleteActivityBtnContainer').innerHTML = '';
        }
        
        this.renderActivityWinnersList();
        this.showModal('activityModal');
    },

    // 在編輯活動視窗中，渲染目前的得獎者小列表
    renderActivityWinnersList: function() {
        const container = document.getElementById('winnerListContainer');
        const countSpan = document.getElementById('winnerCount');
        
        countSpan.innerText = this.currentActivityWinners.length;
        
        if (this.currentActivityWinners.length === 0) {
            container.innerHTML = '<p class="text-center text-slate-400 py-6 text-sm">點擊「選取得獎者」按鈕新增得獎者。</p>';
            return;
        }

        container.innerHTML = this.currentActivityWinners.map((w, idx) => {
            const mem = this.members.find(m => m.id === w.memberId);
            const name = mem ? mem.gameName : 'Unknown ID: ' + w.memberId;
            return `
                <div class="flex justify-between items-center bg-yellow-50 p-2 rounded border border-yellow-100">
                    <span class="text-sm font-bold text-slate-700">${name}</span>
                    <button onclick="app.removeWinner(${idx})" class="text-red-400 hover:text-red-600"><i class="fas fa-times"></i></button>
                </div>
            `;
        }).join('');
    },

    removeWinner: function(idx) {
        this.currentActivityWinners.splice(idx, 1);
        this.renderActivityWinnersList();
    },

    saveActivity: async function() {
        if (this.userRole !== 'master') return;
        const id = document.getElementById('activityId').value;
        const name = document.getElementById('activityName').value;
        const note = document.getElementById('activityNote').value;
        
        if (!name) { alert("請輸入活動名稱"); return; }

        const activityData = {
            name,
            note,
            winners: this.currentActivityWinners
        };

        if (id) {
            if (this.mode === 'firebase') await this.db.collection(COLLECTION_NAMES.ACTIVITIES).doc(id).update(activityData);
            else {
                const idx = this.activities.findIndex(a => a.id === id);
                if (idx !== -1) { this.activities[idx] = { ...this.activities[idx], ...activityData }; this.saveLocal('activities'); }
            }
        } else {
            if (this.mode === 'firebase') await this.db.collection(COLLECTION_NAMES.ACTIVITIES).add(activityData);
            else {
                activityData.id = 'act_' + Date.now();
                this.activities.push(activityData);
                this.saveLocal('activities');
            }
        }
        
        this.logChange(id ? '活動更新' : '建立活動', `活動: ${name}`, id || 'new');
        this.closeModal('activityModal');
        this.renderActivities();
    },

    deleteActivity: async function(id) {
        if (this.userRole !== 'master') return;
        if (!confirm("確定要刪除此活動嗎？")) return;
        
        if (this.mode === 'firebase') await this.db.collection(COLLECTION_NAMES.ACTIVITIES).doc(id).delete();
        else {
            this.activities = this.activities.filter(a => a.id !== id);
            this.saveLocal('activities');
        }
        this.closeModal('activityModal');
        this.renderActivities();
    },

    // --- 得獎者選擇視窗邏輯 ---

    openWinnerSelectionModal: function() {
        // 將目前的得獎者 ID 列表複製到暫存，用於勾選狀態
        this.tempWinnerSelection = this.currentActivityWinners.map(w => w.memberId);
        document.getElementById('winnerSearchInput').value = '';
        this.renderWinnerMemberSelect();
        this.showModal('winnerSelectionModal');
    },

    renderWinnerMemberSelect: function() {
        const search = document.getElementById('winnerSearchInput').value.toLowerCase();
        const container = document.getElementById('winnerMemberSelect');
        
        // 排序：已選的排前面，然後按名字
        let list = [...this.members].sort((a, b) => {
            const aSel = this.tempWinnerSelection.includes(a.id);
            const bSel = this.tempWinnerSelection.includes(b.id);
            if (aSel && !bSel) return -1;
            if (!aSel && bSel) return 1;
            return (a.gameName||'').localeCompare(b.gameName||'');
        });

        if (search) {
            list = list.filter(m => (m.gameName + m.lineName).toLowerCase().includes(search));
        }

        container.innerHTML = list.map(m => {
            const isSelected = this.tempWinnerSelection.includes(m.id);
            return `
                <label class="flex items-center space-x-2 p-2 rounded border transition cursor-pointer ${isSelected ? 'bg-blue-50 border-blue-200' : 'bg-white border-slate-100 hover:bg-slate-50'}">
                    <input type="checkbox" value="${m.id}" class="rounded text-blue-500" ${isSelected ? 'checked' : ''} onchange="app.toggleWinnerCandidate('${m.id}')">
                    <div class="min-w-0">
                        <div class="text-sm font-bold text-slate-700">${m.gameName}</div>
                        <div class="text-xs text-slate-400">${m.mainClass}</div>
                    </div>
                </label>
            `;
        }).join('');
    },

    toggleWinnerCandidate: function(memberId) {
        const idx = this.tempWinnerSelection.indexOf(memberId);
        if (idx === -1) {
            this.tempWinnerSelection.push(memberId);
        } else {
            this.tempWinnerSelection.splice(idx, 1);
        }
        this.renderWinnerMemberSelect();
    },

    performLuckyDraw: function() {
        const search = document.getElementById('winnerSearchInput').value.toLowerCase();
        // 只能從目前篩選清單中抽，且排除已中獎的
        const candidates = this.members.filter(m => {
            const matchesSearch = (m.gameName + m.lineName).toLowerCase().includes(search);
            const notYetSelected = !this.tempWinnerSelection.includes(m.id);
            return matchesSearch && notYetSelected;
        });

        if (candidates.length === 0) {
            alert("目前篩選範圍內沒有可供抽獎的成員！");
            return;
        }

        const luckyOne = candidates[Math.floor(Math.random() * candidates.length)];
        this.tempWinnerSelection.push(luckyOne.id);
        
        alert(`🎉 恭喜！抽中了：${luckyOne.gameName}`);
        this.renderWinnerMemberSelect();
    },

    confirmWinnerSelection: function() {
        // 將選擇的 ID 轉換為物件格式存回 currentActivityWinners
        // 這裡我們保留舊的物件(如果有額外屬性)，新增的則建立新物件
        const newWinners = this.tempWinnerSelection.map(mid => {
            const existing = this.currentActivityWinners.find(w => w.memberId === mid);
            return existing || { memberId: mid, claimed: false };
        });
        
        this.currentActivityWinners = newWinners;
        this.renderActivityWinnersList();
        this.closeModal('winnerSelectionModal');
    },

    // --- 通用工具 ---
    showHistoryModal: function() {
        if (!['master', 'admin'].includes(this.userRole)) { alert("權限不足"); return; }
        const list = document.getElementById('historyList');
        list.innerHTML = this.history.map(log => {
            const date = new Date(log.timestamp).toLocaleString('zh-TW', { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' });
            const color = log.action.includes('刪除') || log.action.includes('解散') ? 'text-red-600' : 'text-blue-600';
            return `
                <div class="p-3 bg-slate-50 border border-slate-200 rounded-lg">
                    <div class="flex justify-between items-center text-xs text-slate-500 font-mono mb-1">
                        <span>${date}</span>
                        <span class="${color} font-bold">${log.action}</span>
                    </div>
                    <p class="text-sm text-slate-800">${log.details}</p>
                    <span class="text-[10px] text-slate-400">by ${log.user}</span>
                </div>`;
        }).join('') || '<p class="text-center text-slate-400 mt-4">尚無紀錄。</p>';
        this.showModal('historyModal');
    },

    copyText: function(el, text) { 
        navigator.clipboard.writeText(text).then(() => { 
            el.classList.add('copied'); setTimeout(() => el.classList.remove('copied'), 1500); 
        }).catch(() => alert("複製失敗")); 
    },

    copySquadList: function(groupId) {
        let gid = groupId || document.getElementById('squadId').value;
        if(!gid) return;
        const group = this.groups.find(g => g.id === gid);
        const memberNames = (group.members || []).map(m => { 
            const id = typeof m === 'string' ? m : m.id; 
            const mem = this.members.find(x => x.id === id); 
            return mem ? `${mem.gameName}` : 'Unknown'; 
        });
        navigator.clipboard.writeText(`【${group.name}】 ${memberNames.join(', ')}`).then(() => alert("已複製！"));
    },

    exportCSV: function() {
        let csv = "\uFEFFLINE 暱稱,遊戲 ID,主職業,定位,公會職位,備註\n";
        this.members.forEach(m => csv += `"${m.lineName}","${m.gameName}","${m.mainClass}","${m.role}","${m.rank||'成員'}","${(m.intro||'').replace(/"/g, '""')}"\n`);
        const link = document.createElement("a"); 
        link.href = encodeURI("data:text/csv;charset=utf-8," + csv); 
        link.download = "ROW成員.csv";
        document.body.appendChild(link); link.click(); document.body.removeChild(link);
    },

    downloadSelf: function() {
        const backupData = { members: this.members, groups: this.groups, activities: this.activities, history: this.history };
        const link = document.createElement("a");
        link.href = URL.createObjectURL(new Blob([JSON.stringify(backupData, null, 2)], {type: "application/json"}));
        link.download = `ROW_Backup_${new Date().toISOString().slice(0,10)}.json`;
        document.body.appendChild(link); link.click(); document.body.removeChild(link);
    },
    
    updateConfigInput: function(str) { const el = document.getElementById('firebaseConfigInput'); if(el) el.value = str; },
    saveConfig: function() {
        try { 
            const config = JSON.parse(document.getElementById('firebaseConfigInput').value);
            if (!config.apiKey) throw new Error();
            localStorage.setItem('row_firebase_config', JSON.stringify(config)); location.reload(); 
        } catch { alert("JSON 格式錯誤！"); }
    },

    resetToDemo: function() { 
        if (!confirm("確定要重置所有資料嗎？")) return;
        localStorage.clear(); location.reload(); 
    },

    showModal: function(id) { document.getElementById(id).classList.remove('hidden'); },
    closeModal: function(id) { document.getElementById(id).classList.add('hidden'); }
};

window.app = App;
window.onload = () => App.init();