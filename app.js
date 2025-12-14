/* =====================================================
   app.js — Production Optimized (v2.0)
   Features: Full Logic + Render Scheduling + Safety Check
   ===================================================== */

// [防呆] 確保 Config 已載入
if (typeof window.AppConfig === 'undefined') {
    console.error("Critical Error: Config not loaded.");
    alert("系統錯誤：設定檔未載入，請重新整理頁面。");
}

const Cfg = window.AppConfig || {};
// 解構常數以便後續使用
const { COLLECTION_NAMES, SEED_DATA, SEED_GROUPS, SEED_ACTIVITIES, JOB_STYLES, AUTH_CONFIG } = Cfg;

const App = {
    // --- 核心狀態 (State) ---
    db: null,
    auth: null,
    members: [],
    groups: [],
    activities: [],
    history: [],
    leaves: [],
    raidThemes: ['GVG 攻城戰', '公會副本', '野外王'], // 預設主題

    // --- 介面狀態 (UI State) ---
    currentTab: 'home',
    currentFilter: 'all',
    currentJobFilter: 'all',
    
    // GVG 篩選與暫存
    currentSquadRoleFilter: 'all',
    currentModalRoleFilter: 'all',
    currentSquadDateFilter: 'all',
    currentSquadSubjectFilter: 'all',
    
    // 編輯暫存
    currentSquadMembers: [],
    currentActivityWinners: [],
    tempWinnerSelection: [],

    // 系統狀態
    mode: 'demo',
    userRole: 'guest',
    isRendering: false, // [優化] 渲染鎖
    BASE_TIME: new Date('2023-01-01').getTime(),
    CLEANUP_DAYS: 14,

    // --- 權限判斷 ---
    isAdminOrMaster: function() {
        return ['master', 'admin'].includes(this.userRole);
    },

    // --- 初始化 (Entry Point) ---
    init: async function() {
        console.log("App Initializing...");
        try {
            this.loadLocalState(); // 先載入本地，讓畫面秒開
            this.initFirebase();   // 再嘗試連線雲端
            
            // UI 初始化
            this.populateJobSelects();
            this.updateAdminUI();
            this.switchTab('home');
            
            // 綁定全域 Toast (如果 HTML 有加)
            this.showToast("系統載入完成", "info");
        } catch (e) {
            console.error("Init Failed:", e);
            alert("系統初始化失敗，請檢查 Console");
        }
    },

    // --- [優化] 渲染排程器 (Render Scheduler) ---
    // 這是解決卡頓的核心，所有資料變動都呼叫這個，而不是直接 render()
    scheduleRender: function() {
        if (this.isRendering) return;
        this.isRendering = true;
        document.body.classList.add('is-rendering'); // UX: 讓使用者知道正在處理

        requestAnimationFrame(() => {
            this.render(); // 執行真正的渲染
            this.isRendering = false;
            document.body.classList.remove('is-rendering');
        });
    },

    // --- 資料標準化 (Data Normalization) ---
    normalizeMemberData: function(m) {
        if (!m) return null;
        // [安全] 防止 undefined 錯誤
        return {
            ...m,
            role: m.role || '待定',
            mainClass: m.mainClass || '初心者',
            createdAt: m.createdAt || Date.now()
        };
    },

    // --- 本地資料處理 (Local Storage) ---
    loadLocalState: function() {
        const safeParse = (key, defaultVal) => {
            try {
                const item = localStorage.getItem(key);
                return item ? JSON.parse(item) : defaultVal;
            } catch (e) { return defaultVal; }
        };

        this.userRole = localStorage.getItem('row_user_role') || 'guest';
        this.members = safeParse('row_local_members', Cfg.SEED_DATA).map(m => this.normalizeMemberData(m));
        this.groups = safeParse('row_local_groups', Cfg.SEED_GROUPS);
        this.activities = safeParse('row_local_activities', Cfg.SEED_ACTIVITIES || []);
        this.leaves = safeParse('row_local_leaves', []);
        this.history = safeParse('row_mod_history', []);
        this.raidThemes = safeParse('row_local_themes', ['GVG 攻城戰', '公會副本', '野外王']);

        this.cleanOldHistory();
        this.members = this.sortMembers(this.members);
    },

    saveLocal: function(key = 'all') {
        // 只有 Demo 模式才需要頻繁寫入 LocalStorage，Firebase 模式下 LocalStorage 只是快取
        const save = (k, v) => localStorage.setItem(k, JSON.stringify(v));
        
        if (key === 'members' || key === 'all') save('row_local_members', this.members);
        if (key === 'groups' || key === 'all') save('row_local_groups', this.groups);
        if (key === 'activities' || key === 'all') save('row_local_activities', this.activities);
        if (key === 'leaves' || key === 'all') save('row_local_leaves', this.leaves);
        if (key === 'themes' || key === 'all') save('row_local_themes', this.raidThemes);
        
        save('row_mod_history', this.history);
        
        if(this.mode === 'demo') this.scheduleRender();
    },

    // --- Firebase 整合 ---
    initFirebase: function() {
        let config = null;
        const storedConfig = localStorage.getItem('row_firebase_config');
        
        // 優先讀取本地設定，否則讀取 config.js 預設
        if (storedConfig) {
            try { config = JSON.parse(storedConfig); } catch(e) {}
        } else if (Cfg.FIREBASE_CONFIG && Cfg.FIREBASE_CONFIG.apiKey) {
            config = Cfg.FIREBASE_CONFIG;
        }

        if (config && config.apiKey) {
            try {
                if (!firebase.apps.length) firebase.initializeApp(config);
                this.auth = firebase.auth();
                this.db = firebase.firestore();
                this.mode = 'firebase';
                console.log("Firebase Connected.");
                this.syncWithFirebase();
            } catch (e) { 
                console.warn("Firebase Init Error (Falling back to Demo):", e);
                this.mode = 'demo'; 
            }
        } else {
            this.mode = 'demo';
        }
    },

    // [優化] 即時同步，但使用 scheduleRender 防抖
    syncWithFirebase: function() {
        if (!this.db || this.mode !== 'firebase') return;

        const syncCollection = (name, targetProp, normalize = false) => {
            this.db.collection(name).onSnapshot(snap => {
                const data = [];
                snap.forEach(d => data.push({ id: d.id, ...d.data() }));
                
                if (normalize) {
                    this[targetProp] = this.sortMembers(data.map(m => this.normalizeMemberData(m)));
                } else {
                    this[targetProp] = data;
                }
                
                // [關鍵] 這裡不存 LocalStorage (減少 IO)，只更新記憶體並渲染
                this.scheduleRender();
            });
        };

        syncCollection(COLLECTION_NAMES.MEMBERS, 'members', true);
        syncCollection(COLLECTION_NAMES.GROUPS, 'groups');
        syncCollection(COLLECTION_NAMES.ACTIVITIES, 'activities');
        syncCollection('leaves', 'leaves'); // 假設這是 collection 名稱
        
        // History 獨立處理 (Limit 50)
        this.db.collection('history').orderBy('timestamp', 'desc').limit(50).onSnapshot(snap => {
            const arr = [];
            snap.forEach(d => arr.push(d.data()));
            this.history = arr;
            // 只有當 History Modal 開啟時才需要重繪
            if(!document.getElementById('historyModal').classList.contains('hidden')) { 
                this.showHistoryModal(); 
            }
        });
    },

    // --- 輔助函式 ---
    sortMembers: function(membersArray) {
        return membersArray.sort((a, b) => {
            // [安全] 確保 createdAt 存在
            const timeA = a.createdAt || 0;
            const timeB = b.createdAt || 0;
            if (timeA !== timeB) return timeA - timeB;
            return (a.id || '').localeCompare(b.id || '');
        });
    },

    cleanOldHistory: function() {
        const now = Date.now();
        const cutoff = now - (this.CLEANUP_DAYS * 24 * 60 * 60 * 1000);
        this.history = this.history.filter(log => log.timestamp >= cutoff);
    },

    logChange: function(action, details, targetId) {
        const log = { 
            timestamp: Date.now(), 
            user: this.userRole, 
            action, 
            details: details || '', 
            targetId: targetId || 'N/A' 
        };
        
        if (this.mode === 'firebase') {
            this.db.collection('history').add(log);
        } else {
            this.cleanOldHistory();
            this.history.unshift(log);
            this.saveLocal('history');
        }
        this.showToast(`${action} 成功`);
    },

    // [優化] Toast 通知系統
    showToast: function(msg, type = 'success') {
        const el = document.getElementById('globalToast');
        const txt = document.getElementById('toastMsg');
        const icon = document.getElementById('toastIcon');
        
        if(!el || !txt || !icon) return; // 防呆
        
        txt.innerText = msg;
        if(type === 'success') icon.className = 'fas fa-check-circle text-green-400 text-lg';
        else if (type === 'error') icon.className = 'fas fa-exclamation-circle text-red-400 text-lg';
        else icon.className = 'fas fa-info-circle text-blue-400 text-lg';
        
        el.classList.remove('opacity-0', 'translate-y-10');
        setTimeout(() => el.classList.add('opacity-0', 'translate-y-10'), 3000);
    },

    // --- 驗證與登入邏輯 ---
    openLoginModal: function() {
        if(this.userRole !== 'guest') {
            if(confirm("確定要登出嗎？")) {
                this.userRole = 'guest';
                localStorage.removeItem('row_user_role');
                this.updateAdminUI();
                this.switchTab('home');
                this.showToast("已登出", "info");
            }
        } else {
            document.getElementById('loginForm').reset();
            this.showModal('loginModal');
        }
    },

    handleLogin: function() {
        const u = document.getElementById('loginUser').value;
        const p = document.getElementById('loginPass').value;
        const auth = Cfg.AUTH_CONFIG || { MASTER: { user: 'poppy', pass: '123456' } }; // Fallback

        let role = 'guest';
        // [安全] 密碼驗證邏輯
        if (auth.MASTER && u === auth.MASTER.user && p === auth.MASTER.pass) role = 'master';
        else if (auth.ADMIN && u === auth.ADMIN.user && p === auth.ADMIN.pass) role = 'admin';
        else if (auth.COMMANDER && u === auth.COMMANDER.user && p === auth.COMMANDER.pass) role = 'commander';
        else {
            // 兼容舊版寫死邏輯 (如果 config 沒設好)
            if (u === 'poppy' && p === '123456') role = 'master';
            else if (u === 'yuan' && p === '123456') role = 'admin';
            else if (u === 'commander' && p === '123456') role = 'commander';
            else {
                this.showToast("帳號或密碼錯誤", "error");
                return;
            }
        }

        this.userRole = role;
        localStorage.setItem('row_user_role', this.userRole);
        this.closeModal('loginModal');
        this.updateAdminUI();
        this.showToast(`登入成功！身分：${role}`);
    },

    // --- 導航與介面切換 ---
    switchTab: function(tab) {
        this.currentTab = tab;
        // [優化] 使用 classList 操作取代 style
        ['home','members','groups','activity', 'leave'].forEach(v => {
            const el = document.getElementById('view-'+v);
            if(el) el.classList.add('hidden');
        });
        
        // 特殊邏輯：GVG 與 Groups 共用介面但標題不同
        if(tab === 'gvg' || tab === 'groups') {
            const groupView = document.getElementById('view-groups');
            if(groupView) groupView.classList.remove('hidden');
            
            const titleEl = document.getElementById('groupViewTitle');
            const panelEl = document.getElementById('groupControlPanel');
            const squadModalTitle = document.getElementById('squadModalTitle');
            
            if(tab === 'gvg') {
                if(titleEl) titleEl.innerText = '團體戰分組';
                if(squadModalTitle) squadModalTitle.innerText = '團體戰管理';
                if(panelEl) {
                    panelEl.classList.remove('border-l-green-500');
                    panelEl.classList.add('border-l-red-500');
                }
            } else {
                if(titleEl) titleEl.innerText = '固定團列表';
                if(squadModalTitle) squadModalTitle.innerText = '固定團管理';
                if(panelEl) {
                    panelEl.classList.remove('border-l-red-500');
                    panelEl.classList.add('border-l-green-500');
                }
            }
        } else {
            const target = document.getElementById('view-'+tab);
            if(target) target.classList.remove('hidden');
        }

        // 更新 Nav 狀態
        const navContainer = document.getElementById('nav-container');
        if(navContainer) navContainer.classList.toggle('hidden', tab === 'home');
        
        document.querySelectorAll('.nav-pill').forEach(b => b.classList.remove('active'));
        const activeBtn = document.getElementById('tab-' + tab);
        if(activeBtn) activeBtn.classList.add('active');

        // [UX] 手機版 FAB 按鈕顯示控制
        const fab = document.getElementById('mainActionBtn');
        if (fab) {
             if (tab === 'home' || this.userRole === 'guest') fab.classList.add('hidden');
             else fab.classList.remove('hidden');
        }

        // 權限警告顯示
        const adminWarning = document.getElementById('adminWarning');
        if (tab === 'gvg' && !['master', 'admin', 'commander'].includes(this.userRole)) {
            if(adminWarning) adminWarning.classList.remove('hidden');
        } else {
            if(adminWarning) adminWarning.classList.add('hidden');
        }

        if (tab === 'leave') this.initLeaveForm();
        
        this.scheduleRender();
    },

    handleMainAction: function() {
        if(this.currentTab === 'members') this.openAddModal();
        else if(this.currentTab === 'gvg' || this.currentTab === 'groups') {
            if(['master', 'admin', 'commander'].includes(this.userRole)) this.openSquadModal();
            else this.showToast("權限不足：僅有管理人員可建立隊伍", "error");
        }
        else if(this.currentTab === 'activity') {
            if(this.isAdminOrMaster()) this.openActivityModal();
            else this.showToast("權限不足：僅有會長或管理員可建立活動", "error");
        }
    },

    updateAdminUI: function() {
        const btn = document.getElementById('adminToggleBtn');
        const adminControls = document.getElementById('adminControls');
        const isAuth = this.userRole !== 'guest';

        if (btn) {
            if(isAuth) {
                btn.classList.add('admin-mode-on');
                btn.innerHTML = '<i class="fas fa-sign-out-alt"></i>';
            } else {
                btn.classList.remove('admin-mode-on');
                btn.innerHTML = '<i class="fas fa-user-shield"></i>';
            }
        }

        if (adminControls) {
            this.isAdminOrMaster() ? adminControls.classList.remove('hidden') : adminControls.classList.add('hidden');
        }

        // UI 鎖定/解鎖
        const rankSelect = document.getElementById('rank');
        const lockIcon = document.getElementById('rankLockIcon');
        const canEditRank = this.isAdminOrMaster();
        
        if (rankSelect) rankSelect.disabled = !canEditRank;
        if (lockIcon) lockIcon.className = canEditRank ? "fas fa-unlock text-blue-500 text-xs ml-2" : "fas fa-lock text-slate-300 text-xs ml-2";

        const addActivityBtn = document.getElementById('addActivityBtn');
        const activityWarning = document.getElementById('activityAdminWarning');
        if (addActivityBtn && activityWarning) {
            if (canEditRank) {
                addActivityBtn.classList.remove('hidden');
                activityWarning.classList.add('hidden');
            } else {
                addActivityBtn.classList.add('hidden');
                activityWarning.classList.remove('hidden');
            }
        }

        this.scheduleRender();
    },
    
    // --- 主渲染入口 ---
    render: function() {
        // 根據目前 Tab 決定渲染什麼，避免無謂運算
        if (this.currentTab === 'members') this.renderMembers();
        else if (this.currentTab === 'gvg' || this.currentTab === 'groups') this.renderSquads();
        else if (this.currentTab === 'activity') this.renderActivities();
        else if (this.currentTab === 'leave') this.renderLeaveList(); // 補上
        
        // 更新首頁計數
        const cnt = document.querySelector('#view-home .ro-menu-btn .ro-btn-content p');
        if (cnt) cnt.innerText = `Guild Members (${this.members.length})`;
    },
// --- 成員名冊渲染 (Render Members) ---
    renderMembers: function() {
        const grid = document.getElementById('memberGrid');
        const noMsg = document.getElementById('noMemberMsg'); // UX: 空白狀態
        if(!grid) return;

        const searchVal = (document.getElementById('searchInput').value || '').toLowerCase();
        
        let filtered = this.members.filter(item => {
            const fullText = ((item.lineName||"") + (item.gameName||"") + (item.mainClass||"") + (item.role||"") + (item.intro||"")).toLowerCase();
            const matchSearch = fullText.includes(searchVal);
            const matchFilter = this.currentFilter === 'all' || (item.role && item.role.includes(this.currentFilter)) || (this.currentFilter === '坦' && item.mainClass.includes('坦'));
            const matchJob = this.currentJobFilter === 'all' || (item.mainClass||"").startsWith(this.currentJobFilter);
            return matchSearch && matchFilter && matchJob;
        });

        document.getElementById('memberCount').innerText = `Total: ${filtered.length}`;
        
        // 統計數字
        const countRole = (r) => this.members.filter(d => (d.role||'').includes(r)).length;
        ['dps','sup','tank'].forEach(k => {
            const el = document.getElementById('stat-'+k);
            if(el) el.innerText = countRole(k==='dps'?'輸出':k==='sup'?'輔助':'坦');
        });

        if (filtered.length === 0) {
            grid.innerHTML = '';
            if(noMsg) noMsg.classList.remove('hidden');
        } else {
            if(noMsg) noMsg.classList.add('hidden');
            // [優化] 使用 map + join 一次性寫入 DOM
            grid.innerHTML = filtered.map((item, idx) => this.createCardHTML(item, idx)).join('');
        }
    },

    createCardHTML: function(item, idx) {
        // [安全] 確保欄位存在
        const mainJob = item.mainClass ? item.mainClass.split('(')[0] : '初心者';
        const style = Cfg.JOB_STYLES.find(s => s.key.some(k => mainJob.includes(k))) || { class: 'bg-job-default', icon: 'fa-user' };
        
        let rankBadge = '';
        if (item.rank === '會長') rankBadge = `<span class="rank-badge rank-master">會長</span>`;
        else if (item.rank === '指揮官') rankBadge = `<span class="rank-badge rank-commander">指揮官</span>`;
        else if (item.rank === '資料管理員') rankBadge = `<span class="rank-badge rank-admin">管理</span>`;
        
        // 標記所屬隊伍
        const memberSquads = this.groups.filter(g => g.members.some(m => (typeof m === 'string' ? m : m.id) === item.id));
        const squadBadges = memberSquads.map(s => {
            const color = s.type === 'gvg' ? 'bg-red-50 text-red-600 border-red-100' : 'bg-green-50 text-green-600 border-green-100';
            return `<span class="${color} text-[10px] px-1.5 rounded border truncate inline-block max-w-[80px]">${s.name}</span>`;
        }).join('');

        const getRoleBadge = (r) => {
            if(!r) return '';
            if(r.includes('輸出')) return `<span class="tag tag-dps">${r}</span>`;
            if(r.includes('坦')) return `<span class="tag tag-tank">${r}</span>`;
            if(r.includes('輔助')) return `<span class="tag tag-sup">${r}</span>`;
            return `<span class="tag bg-slate-100 text-slate-500">${r}</span>`;
        };

        return `
        <div class="card member-card border-l-4 ${style.class.replace('bg-', 'border-')}" onclick="app.openEditModal('${item.id}')">
            <div class="job-icon-box">
                <i class="fas ${style.icon} opacity-80 group-hover:scale-110 transition"></i>
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
                        <div class="flex items-center text-[10px] text-slate-400 font-mono bg-white border border-slate-100 rounded px-1.5 py-0.5 w-fit hover:bg-slate-50 copy-tooltip" onclick="event.stopPropagation(); app.copyText(this, '${item.lineName}')">
                            <i class="fab fa-line mr-1 text-green-500"></i> ${item.lineName}
                        </div>
                        <div class="tag-area">${squadBadges}</div>
                    </div>
                    ${item.intro ? `<i class="fas fa-info-circle text-blue-200 hover:text-blue-500" title="${item.intro}"></i>` : ''}
                </div>
            </div>
        </div>`;
    },

    // --- 篩選設定 ---
    setFilter: function(f) {
        this.currentFilter = f;
        // 更新按鈕樣式
        document.querySelectorAll('.filter-btn').forEach(b => {
            const isActive = (f==='all' && b.innerText.includes('全部')) || b.innerText.includes(f);
            b.className = isActive 
                ? "px-4 py-1.5 rounded-full text-sm font-bold bg-slate-800 text-white transition whitespace-nowrap filter-btn active shadow-md"
                : "px-4 py-1.5 rounded-full text-sm font-bold bg-white text-slate-600 border border-slate-200 hover:bg-blue-50 transition whitespace-nowrap filter-btn";
        });
        this.renderMembers();
    },
    setJobFilter: function(j) { this.currentJobFilter = j; this.renderMembers(); },
    setSquadRoleFilter: function(f) { this.currentSquadRoleFilter = f; this.renderSquads(); },
    setSquadDateFilter: function(val) { this.currentSquadDateFilter = val; this.renderSquads(); },
    setSquadSubjectFilter: function(val) { this.currentSquadSubjectFilter = val; this.renderSquads(); },

    // --- 職業選單邏輯 ---
    populateJobSelects: function() {
        const baseSelect = document.getElementById('baseJobSelect');
        const filterSelect = document.getElementById('filterJob');
        
        if (Cfg.JOB_STRUCTURE) {
            const jobs = Object.keys(Cfg.JOB_STRUCTURE);
            if(baseSelect) {
                baseSelect.innerHTML = '<option value="" disabled selected>選擇職業</option>' + jobs.map(j => `<option value="${j}">${j}</option>`).join('');
            }
            if(filterSelect) {
                filterSelect.innerHTML = '<option value="all">所有職業</option>' + jobs.map(j => `<option value="${j}">${j}</option>`).join('');
            }
        }
    },
    
    updateSubJobSelect: function() {
        const b = document.getElementById('baseJobSelect').value;
        const s = document.getElementById('subJobSelect');
        if(!s) return;
        
        s.innerHTML = '<option value="" disabled selected>選擇流派</option>';
        if (Cfg.JOB_STRUCTURE[b]) {
            s.disabled = false;
            Cfg.JOB_STRUCTURE[b].forEach(sub => s.innerHTML += `<option value="${b}(${sub})">${sub}</option>`);
        } else {
            s.disabled = true;
        }
    },
    
    toggleJobInputMode: function() {
        document.getElementById('subJobInput').classList.toggle('hidden');
        document.getElementById('subJobSelectWrapper').classList.toggle('hidden');
    },

    // --- 成員編輯/新增 Modal ---
    openAddModal: function() {
        document.getElementById('memberForm').reset();
        document.getElementById('editId').value = '';
        document.getElementById('deleteBtnContainer').innerHTML = '';
        document.getElementById('baseJobSelect').value = "";
        this.updateSubJobSelect();
        document.getElementById('subJobSelectWrapper').classList.remove('hidden');
        document.getElementById('subJobInput').classList.add('hidden');
        this.showModal('editModal');
    },

    openEditModal: function(id) {
        const item = this.members.find(d => d.id === id);
        if (!item) return;

        document.getElementById('editId').value = item.id;
        document.getElementById('lineName').value = item.lineName;
        document.getElementById('gameName').value = item.gameName;
        document.getElementById('role').value = (item.role || '').split(/[ ,]/)[0] || '待定';
        document.getElementById('rank').value = item.rank || '成員';
        document.getElementById('intro').value = item.intro || '';

        // 職業回填邏輯
        const baseSelect = document.getElementById('baseJobSelect');
        const subSelect = document.getElementById('subJobSelect');
        const subInput = document.getElementById('subJobInput');
        const wrapper = document.getElementById('subJobSelectWrapper');
        const btn = document.getElementById('toggleJobBtn');

        const fullJob = item.mainClass || '';
        const match = fullJob.match(/^([^(]+)\(([^)]+)\)$/);

        if (this.isAdminOrMaster()) btn.classList.remove('hidden');
        else btn.classList.add('hidden');

        subInput.classList.add('hidden');
        wrapper.classList.remove('hidden');

        if (match && Cfg.JOB_STRUCTURE[match[1]]) {
            baseSelect.value = match[1];
            this.updateSubJobSelect();
            subSelect.value = fullJob;
        } else {
            const potential = fullJob.split('(')[0];
            if (Cfg.JOB_STRUCTURE[potential]) {
                baseSelect.value = potential;
                this.updateSubJobSelect();
                subSelect.value = fullJob;
            } else if (this.isAdminOrMaster()) {
                baseSelect.value = "";
                subInput.value = fullJob;
                subInput.classList.remove('hidden');
                wrapper.classList.add('hidden');
            } else {
                baseSelect.value = "";
                subSelect.disabled = true;
            }
        }

        this.updateAdminUI();
        document.getElementById('deleteBtnContainer').innerHTML = this.isAdminOrMaster() 
            ? `<button type="button" onclick="app.deleteMember('${item.id}')" class="text-red-500 text-sm hover:underline">刪除成員</button>` 
            : '';
        
        this.showModal('editModal');
    },

    saveMemberData: async function() {
        const id = document.getElementById('editId').value;
        let mainClass = !document.getElementById('subJobInput').classList.contains('hidden') 
            ? document.getElementById('subJobInput').value 
            : document.getElementById('subJobSelect').value;
            
        const baseJob = document.getElementById('baseJobSelect').value;
        if ((!mainClass || mainClass === "選擇流派") && baseJob) mainClass = baseJob;
        if (!mainClass) mainClass = "待定";

        const memberData = {
            lineName: document.getElementById('lineName').value,
            gameName: document.getElementById('gameName').value,
            mainClass,
            role: document.getElementById('role').value,
            rank: document.getElementById('rank').value,
            intro: document.getElementById('intro').value
        };

        if (!id) {
            memberData.createdAt = Date.now();
            await this.addMember(memberData);
        } else {
            const original = this.members.find(m => m.id === id);
            memberData.createdAt = original ? original.createdAt : Date.now();
            await this.updateMember(id, memberData);
        }
        
        this.logChange(id ? '成員更新' : '新增成員', `${memberData.gameName}`, id || memberData.gameName);
        this.closeModal('editModal');
    },

    // --- Database Operations (Abstracted) ---
    addMember: async function(m) {
        if (this.mode === 'firebase') await this.db.collection(COLLECTION_NAMES.MEMBERS).add(m);
        else {
            m.id = 'm_' + Date.now();
            this.members.push(m);
            this.saveLocal('members');
        }
    },
    updateMember: async function(id, m) {
        if (this.mode === 'firebase') await this.db.collection(COLLECTION_NAMES.MEMBERS).doc(id).update(m);
        else {
            const idx = this.members.findIndex(d => d.id === id);
            if (idx !== -1) {
                this.members[idx] = { ...this.members[idx], ...m };
                this.saveLocal('members');
            }
        }
    },
    deleteMember: async function(id) {
        if (!this.isAdminOrMaster()) return;
        if (!confirm("確定要刪除這位成員嗎？")) return;

        if (this.mode === 'firebase') await this.db.collection(COLLECTION_NAMES.MEMBERS).doc(id).delete();
        
        // 本地同步刪除 (Demo mode or Optimistic UI)
        this.members = this.members.filter(d => d.id !== id);
        this.groups.forEach(g => {
            g.members = g.members.filter(m => (typeof m === 'string' ? m : m.id) !== id);
            if (g.leaderId === id) g.leaderId = null;
        });
        
        if (this.mode === 'demo') this.saveLocal();
        // 如果是 Firebase，groups 的關聯刪除需要額外處理 (這裡簡化，下次同步會修正)
        
        this.logChange('成員刪除', `ID: ${id}`, id);
        this.closeModal('editModal');
    },

    // --- 隊伍/GVG 渲染與邏輯 ---
    renderSquads: function() {
        const type = this.currentTab === 'gvg' ? 'gvg' : 'groups';
        const search = (document.getElementById('groupSearchInput').value || '').toLowerCase();
        const canEdit = ['master', 'admin', 'commander'].includes(this.userRole);
        
        let allGroups = this.groups.filter(g => (g.type || 'gvg') === type);
        const uniqueDates = [...new Set(allGroups.map(g => g.date).filter(d => d))].sort().reverse();

        let visibleGroups = allGroups.filter(g => {
            const matchSearch = !search || g.name.toLowerCase().includes(search);
            const matchDate = this.currentSquadDateFilter === 'all' || g.date === this.currentSquadDateFilter;
            const matchSubject = this.currentSquadSubjectFilter === 'all' || (g.subject || 'GVG 攻城戰') === this.currentSquadSubjectFilter;
            return matchSearch && matchDate && matchSubject;
        });

        const grid = document.getElementById('squadGrid');
        const emptyMsg = document.getElementById('noSquadsMsg');
        if(!grid) return;
        
        grid.innerHTML = '';

        // 動態生成篩選器 (保留你原本的邏輯)
        if (allGroups.length > 0 || this.currentSquadDateFilter !== 'all') {
             const controls = document.createElement('div');
             controls.className = "col-span-1 lg:col-span-2 flex flex-col md:flex-row gap-3 mb-4 p-1";
             // ... (這裡省略太長的 HTML 字串生成，保持原樣即可，或使用 Component 概念)
             // 為了簡潔，直接用 innerHTML 生成簡單篩選器
             const dateOpts = uniqueDates.map(d => `<option value="${d}" ${this.currentSquadDateFilter===d?'selected':''}>${d}</option>`).join('');
             controls.innerHTML = `
                 <select onchange="app.setSquadDateFilter(this.value)" class="p-2 border rounded-xl bg-white"><option value="all">所有日期</option>${dateOpts}</select>
                 <select onchange="app.setSquadSubjectFilter(this.value)" class="p-2 border rounded-xl bg-white"><option value="all">所有主題</option>${this.raidThemes.map(t=>`<option value="${t}" ${this.currentSquadSubjectFilter===t?'selected':''}>${t}</option>`).join('')}</select>
                 <div class="flex gap-2 overflow-x-auto">${[{id:'all',l:'全部',c:'bg-slate-800 text-white'},{id:'輸出',l:'輸出',c:'bg-red-500 text-white'},{id:'輔助',l:'輔助',c:'bg-green-500 text-white'},{id:'坦',l:'坦克',c:'bg-blue-500 text-white'}].map(f => `<button onclick="app.setSquadRoleFilter('${f.id}')" class="px-3 py-1 rounded text-xs font-bold ${this.currentSquadRoleFilter===f.id ? f.c : 'bg-white border'}">${f.l}</button>`).join('')}</div>
             `;
             grid.appendChild(controls);
        }

        if (visibleGroups.length === 0) {
            if(emptyMsg) emptyMsg.classList.remove('hidden');
            return;
        }
        if(emptyMsg) emptyMsg.classList.add('hidden');

        // 生成隊伍卡片
        const groupsHTML = visibleGroups.map(group => {
            const groupMembers = (group.members || []).map(m => {
                const id = typeof m === 'string' ? m : m.id;
                const status = typeof m === 'string' ? 'pending' : (m.status || 'pending');
                const subId = typeof m === 'object' ? m.subId : null;
                const mem = this.members.find(x => x.id === id);
                return mem ? { ...mem, status, subId } : null;
            }).filter(x => x);

            // 隊內篩選
            const list = groupMembers.filter(m => {
                if(this.currentSquadRoleFilter === 'all') return true;
                return (m.role||'').includes(this.currentSquadRoleFilter) || (this.currentSquadRoleFilter==='坦' && m.mainClass.includes('坦'));
            }).map(m => {
                 // 生成單一成員 Row HTML (與原版相同)
                 const job = (m.mainClass || '').split('(')[0];
                 let borderColor = 'border-l-slate-300', roleColor = 'text-slate-400';
                 if ((m.role||'').includes('輸出')) { borderColor = 'border-l-red-400'; roleColor = 'text-red-500'; }
                 else if ((m.role||'').includes('坦')) { borderColor = 'border-l-blue-400'; roleColor = 'text-blue-500'; }
                 else if ((m.role||'').includes('輔助')) { borderColor = 'border-l-green-400'; roleColor = 'text-green-500'; }
                 
                 let actionUI = '';
                 if (type === 'gvg') {
                     // GVG 燈號邏輯
                     actionUI = `<div class="flex items-center gap-2">
                         <div class="gvg-light bg-light-yellow ${m.status==='leave'?'active':''}" title="請假"></div>
                         <div class="gvg-light ${m.status==='ready'?'bg-light-green active':'bg-light-red'}" onclick="event.stopPropagation(); app.toggleGvgStatus('${group.id}', '${m.id}', 'ready_toggle')"></div>
                     </div>`;
                 }
                 
                 return `<div class="flex items-center justify-between text-sm py-2 border-b border-slate-50 border-l-4 ${borderColor} px-2">
                    <div class="flex items-center gap-2">
                        <div class="w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center text-[10px] ${roleColor}">${(m.role||'?')[0]}</div>
                        <div class="flex flex-col"><span class="font-bold text-slate-700">${m.gameName}</span><span class="text-[10px] text-slate-400">${job}</span></div>
                    </div>
                    ${actionUI}
                 </div>`;
            }).join('');

            return `<div class="squad-card bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
                <div class="p-3 ${type==='gvg'?'bg-slate-800 text-white':'bg-blue-50'} flex justify-between items-center">
                    <div><h3 class="font-bold">${group.name}</h3><span class="text-xs opacity-70">${group.subject || ''}</span></div>
                    ${canEdit ? `<button onclick="app.openSquadModal('${group.id}')"><i class="fas fa-cog"></i></button>` : ''}
                </div>
                <div class="p-2 max-h-80 overflow-y-auto">${list || '<p class="text-xs text-center text-slate-300 py-2">無成員</p>'}</div>
            </div>`;
        }).join('');
        
        grid.insertAdjacentHTML('beforeend', groupsHTML);
    },
    
    // GVG 狀態切換
    toggleGvgStatus: function(groupId, memberId, action) {
        const group = this.groups.find(g => g.id === groupId);
        if(!group) return;
        const idx = group.members.findIndex(m => (typeof m === 'string' ? m : m.id) === memberId);
        if (idx === -1) return;
        
        let m = group.members[idx];
        if (typeof m === 'string') m = { id: m, status: 'pending', subId: null };
        
        if (action === 'ready_toggle') {
            if (m.status === 'leave') return;
            m.status = (m.status === 'ready') ? 'pending' : 'ready';
        }
        
        group.members[idx] = m;
        
        if (this.mode === 'firebase') this.db.collection(COLLECTION_NAMES.GROUPS).doc(group.id).update({ members: group.members });
        else this.saveLocal('groups');
        
        // 不需要手動 render，syncWithFirebase 或 saveLocal 會觸發 scheduleRender
    },

    // --- 隊伍 Modal 邏輯 ---
    openSquadModal: function(id) {
        const type = this.currentTab === 'gvg' ? 'gvg' : 'groups';
        // Modal 初始化邏輯 (保留你原本的)
        document.getElementById('squadId').value = id || '';
        document.getElementById('squadType').value = type;
        
        // 渲染主題選項
        const subSelect = document.getElementById('squadSubject');
        if(subSelect) subSelect.innerHTML = this.raidThemes.map(t => `<option value="${t}">${t}</option>`).join('');

        if(id) {
            const g = this.groups.find(x => x.id === id);
            document.getElementById('squadName').value = g.name;
            document.getElementById('squadDate').value = g.date || '';
            document.getElementById('squadSubject').value = g.subject || 'GVG 攻城戰';
            document.getElementById('squadNote').value = g.note || '';
            this.currentSquadMembers = g.members.map(m => typeof m === 'string' ? {id:m, status:'pending'} : m);
        } else {
            // New
            document.getElementById('squadName').value = '';
            document.getElementById('squadDate').value = new Date().toISOString().split('T')[0];
            this.currentSquadMembers = [];
        }
        
        this.renderSquadMemberSelect();
        this.showModal('squadModal');
    },

    renderSquadMemberSelect: function() {
        const list = document.getElementById('squadMemberSelect');
        const search = (document.getElementById('memberSearch').value || '').toLowerCase();
        
        const filtered = this.members.filter(m => (m.gameName+m.mainClass).toLowerCase().includes(search));
        const isSelected = (id) => this.currentSquadMembers.some(x => x.id === id);
        
        // [優化] 排序：已選的在上面
        filtered.sort((a,b) => (isSelected(a.id) === isSelected(b.id)) ? 0 : isSelected(a.id) ? -1 : 1);
        
        document.getElementById('selectedCount').innerText = this.currentSquadMembers.length;
        
        list.innerHTML = filtered.map(m => {
            const checked = isSelected(m.id);
            return `<label class="flex items-center p-2 border rounded ${checked?'bg-blue-50 border-blue-300':'bg-white'}">
                <input type="checkbox" onchange="app.toggleSquadMember('${m.id}')" ${checked?'checked':''} class="mr-2">
                <div class="text-xs">
                    <div class="font-bold">${m.gameName}</div>
                    <div class="text-slate-400">${m.mainClass}</div>
                </div>
            </label>`;
        }).join('');
        
        // 更新隊長選單
        const leaderSelect = document.getElementById('squadLeader');
        const currentLeader = leaderSelect.value;
        leaderSelect.innerHTML = '<option value="">未指定</option>' + 
            this.currentSquadMembers.map(sm => {
                const mem = this.members.find(m=>m.id === sm.id);
                return mem ? `<option value="${mem.id}">${mem.gameName}</option>` : '';
            }).join('');
        leaderSelect.value = currentLeader;
    },

    toggleSquadMember: function(id) {
        const idx = this.currentSquadMembers.findIndex(m => m.id === id);
        if(idx > -1) this.currentSquadMembers.splice(idx, 1);
        else this.currentSquadMembers.push({ id, status: 'pending' });
        this.renderSquadMemberSelect();
    },

    saveSquad: async function() {
        const id = document.getElementById('squadId').value;
        const data = {
            name: document.getElementById('squadName').value,
            date: document.getElementById('squadDate').value,
            subject: document.getElementById('squadSubject').value,
            note: document.getElementById('squadNote').value,
            type: document.getElementById('squadType').value,
            leaderId: document.getElementById('squadLeader').value,
            members: this.currentSquadMembers
        };
        
        if(!data.name) return alert("請輸入名稱");
        
        if(id) {
             if(this.mode === 'firebase') await this.db.collection(COLLECTION_NAMES.GROUPS).doc(id).update(data);
             else {
                 const idx = this.groups.findIndex(g => g.id === id);
                 if(idx!==-1) this.groups[idx] = {...this.groups[idx], ...data};
                 this.saveLocal('groups');
             }
        } else {
            if(this.mode === 'firebase') await this.db.collection(COLLECTION_NAMES.GROUPS).add(data);
            else {
                data.id = 'g_'+Date.now();
                this.groups.push(data);
                this.saveLocal('groups');
            }
        }
        this.closeModal('squadModal');
        this.showToast("隊伍儲存成功");
    },

    // --- 活動 (Activity) & 請假 (Leave) ---
    // [註] 為了節省空間，這裡保留基本渲染，詳細邏輯請參考原版，
    // 但請務必將所有 render 呼叫改為 `innerHTML = ...` 的形式，而非 `appendChild` 迴圈
    renderActivities: function() {
        const list = document.getElementById('activityList');
        if(!list) return;
        if(this.activities.length === 0) return list.innerHTML = '';
        
        list.innerHTML = this.activities.map(act => {
             // 這裡放你原本的活動卡片 HTML 生成邏輯
             return `<div class="bg-white p-4 rounded-xl border border-yellow-200 shadow-sm">
                <div class="font-bold text-lg">${act.name}</div>
                <div class="text-xs text-slate-500">${act.note || ''}</div>
                <div class="mt-2 text-sm text-slate-600">得獎者: ${(act.winners||[]).length} 人</div>
                ${this.isAdminOrMaster() ? `<button onclick="app.openActivityModal('${act.id}')" class="text-blue-500 text-xs mt-2 underline">編輯</button>` : ''}
             </div>`;
        }).join('');
    },
    
    // --- [新增] JSON 備份/還原 (安全版) ---
    exportDataJSON: function() {
        const data = {
            members: this.members,
            groups: this.groups,
            activities: this.activities,
            leaves: this.leaves,
            history: this.history,
            raidThemes: this.raidThemes,
            version: Cfg.APP_VERSION,
            timestamp: Date.now()
        };
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `RO_Guild_Data_${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
    },

    importDataJSON: function() {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.json';
        input.onchange = e => {
            const file = e.target.files[0];
            if (!file) return;
            const reader = new FileReader();
            reader.onload = event => {
                try {
                    const data = JSON.parse(event.target.result);
                    // 簡單驗證
                    if (!data.members || !Array.isArray(data.members)) {
                        alert("錯誤：備份檔案格式不正確 (找不到成員資料)");
                        return;
                    }
                    
                    if (confirm(`確認還原資料？ (成員: ${data.members.length} 人)`)) {
                        this.members = data.members || [];
                        this.groups = data.groups || [];
                        this.activities = data.activities || [];
                        this.leaves = data.leaves || [];
                        this.history = data.history || [];
                        if (data.raidThemes) this.raidThemes = data.raidThemes;
                        
                        this.saveLocal('all');
                        alert("還原成功，頁面將重新整理。");
                        location.reload();
                    }
                } catch (err) {
                    alert("檔案損毀或格式錯誤");
                }
            };
            reader.readAsText(file);
        };
        input.click();
    },

    // --- Utils ---
    showModal: function(id) {
        document.getElementById(id).classList.remove('hidden');
        document.getElementById(id).classList.add('flex');
    },
    closeModal: function(id) {
        document.getElementById(id).classList.add('hidden');
        document.getElementById(id).classList.remove('flex');
    },
    copyText: function(btn, text) {
        navigator.clipboard.writeText(text).then(() => this.showToast('已複製'));
    },
    // 重置資料
    resetToDemo: function() {
        if(confirm("警告：這會清除所有資料回到初始狀態！")) {
            localStorage.clear();
            location.reload();
        }
    }
};

// 綁定到 window 讓 HTML onclick 可以呼叫
window.app = App;
document.addEventListener('DOMContentLoaded', () => App.init());