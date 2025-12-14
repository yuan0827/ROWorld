/* =====================================================
   app.js — Production v3.1 (Light Header Fix)
   ===================================================== */

if (typeof window.AppConfig === 'undefined') { alert("系統錯誤：設定檔未載入。"); }

const Cfg = window.AppConfig || {};
const { COLLECTION_NAMES, JOB_STYLES, AUTH_CONFIG } = Cfg;

const App = {
    // --- State ---
    db: null, auth: null,
    members: [], groups: [], activities: [], history: [], leaves: [],
    raidThemes: ['GVG 攻城戰', '公會副本', '野外王'],
    
    // UI State
    currentTab: 'home', currentFilter: 'all', currentJobFilter: 'all',
    currentSquadRoleFilter: 'all', currentModalRoleFilter: 'all',
    currentSquadDateFilter: 'all', currentSquadSubjectFilter: 'all',
    currentSquadMembers: [], currentActivityWinners: [], tempWinnerSelection: [],
    
    mode: 'demo', userRole: 'guest', isRendering: false,
    CLEANUP_DAYS: 14,

    isAdminOrMaster: function() { return ['master', 'admin'].includes(this.userRole); },

    // --- Init ---
    init: async function() {
        try {
            this.loadLocalState();
            this.initFirebase();
            this.populateJobSelects();
            this.updateAdminUI();
            this.switchTab('home');
            this.showToast("系統已就緒", "info");
        } catch (e) { console.error(e); }
    },

    scheduleRender: function() {
        if (this.isRendering) return;
        this.isRendering = true;
        document.body.classList.add('is-rendering');
        requestAnimationFrame(() => {
            this.render();
            this.isRendering = false;
            document.body.classList.remove('is-rendering');
        });
    },

    normalizeMemberData: function(m) {
        if (!m) return null;
        return { ...m, role: m.role || '待定', mainClass: m.mainClass || '初心者', createdAt: m.createdAt || Date.now() };
    },

    loadLocalState: function() {
        const safeParse = (k, d) => { try { return JSON.parse(localStorage.getItem(k)) || d; } catch(e){ return d; }};
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
        const save = (k, v) => localStorage.setItem(k, JSON.stringify(v));
        if (key === 'all') {
            save('row_local_members', this.members); save('row_local_groups', this.groups);
            save('row_local_activities', this.activities); save('row_local_leaves', this.leaves);
            save('row_local_themes', this.raidThemes); save('row_mod_history', this.history);
        } else {
            if(key==='members') save('row_local_members', this.members);
            if(key==='groups') save('row_local_groups', this.groups);
            if(key==='activities') save('row_local_activities', this.activities);
            if(key==='leaves') save('row_local_leaves', this.leaves);
        }
        if(this.mode === 'demo') this.scheduleRender();
    },

    initFirebase: function() {
        let config = null;
        try { config = JSON.parse(localStorage.getItem('row_firebase_config')); } catch(e){}
        if (!config && Cfg.FIREBASE_CONFIG && Cfg.FIREBASE_CONFIG.apiKey) config = Cfg.FIREBASE_CONFIG;
        
        if (config && config.apiKey) {
            try {
                if (!firebase.apps.length) firebase.initializeApp(config);
                this.auth = firebase.auth(); this.db = firebase.firestore();
                this.mode = 'firebase';
                this.syncWithFirebase();
            } catch (e) { this.mode = 'demo'; }
        }
    },

    syncWithFirebase: function() {
        if (!this.db || this.mode !== 'firebase') return;
        const sync = (n, p, norm) => {
            this.db.collection(n).onSnapshot(s => {
                const d = []; s.forEach(x => d.push({id:x.id, ...x.data()}));
                this[p] = norm ? this.sortMembers(d.map(m=>this.normalizeMemberData(m))) : d;
                this.scheduleRender();
            });
        };
        sync(COLLECTION_NAMES.MEMBERS, 'members', true);
        sync(COLLECTION_NAMES.GROUPS, 'groups');
        sync(COLLECTION_NAMES.ACTIVITIES, 'activities');
        sync('leaves', 'leaves');
        this.db.collection('history').orderBy('timestamp', 'desc').limit(50).onSnapshot(s => {
            const arr=[]; s.forEach(d=>arr.push(d.data())); this.history=arr;
            if(!document.getElementById('historyModal').classList.contains('hidden')) this.showHistoryModal();
        });
    },
    
    sortMembers: function(arr) { return arr.sort((a,b) => (a.createdAt||0) - (b.createdAt||0)); },
    cleanOldHistory: function() { this.history = this.history.filter(h => h.timestamp >= Date.now() - (this.CLEANUP_DAYS*86400000)); },
    logChange: function(action, details, targetId) {
        const log = { timestamp:Date.now(), user:this.userRole, action, details:details||'', targetId:targetId||'N/A' };
        if(this.mode==='firebase') this.db.collection('history').add(log);
        else { this.cleanOldHistory(); this.history.unshift(log); this.saveLocal('history'); }
        this.showToast(`${action} 成功`);
    },
    
    showToast: function(msg, type='success') {
        const el = document.getElementById('globalToast'), txt = document.getElementById('toastMsg'), icon = document.getElementById('toastIcon');
        if(!el) return;
        txt.innerText = msg;
        icon.className = type==='error' ? 'fas fa-exclamation-circle text-red-400' : 'fas fa-check-circle text-green-400';
        el.classList.remove('opacity-0', 'translate-y-4');
        setTimeout(()=>el.classList.add('opacity-0', 'translate-y-4'), 3000);
    },

    // --- Auth & Nav ---
    openLoginModal: function() {
        if(this.userRole!=='guest') {
            if(confirm("登出？")) { this.userRole='guest'; localStorage.removeItem('row_user_role'); this.updateAdminUI(); this.switchTab('home'); }
        } else { document.getElementById('loginForm').reset(); this.showModal('loginModal'); }
    },
    handleLogin: function() {
        const u = document.getElementById('loginUser').value, p = document.getElementById('loginPass').value;
        const auth = Cfg.AUTH_CONFIG || { MASTER:{user:'poppy',pass:'123456'} };
        let r = 'guest';
        if(auth.MASTER && u===auth.MASTER.user && p===auth.MASTER.pass) r='master';
        else if(auth.ADMIN && u===auth.ADMIN.user && p===auth.ADMIN.pass) r='admin';
        else if(u==='poppy' && p==='123456') r='master';
        else { this.showToast("帳號密碼錯誤", "error"); return; }
        this.userRole = r; localStorage.setItem('row_user_role', r);
        this.closeModal('loginModal'); this.updateAdminUI(); this.showToast(`登入成功: ${r}`);
    },

    switchTab: function(tab) {
        this.currentTab = tab;
        ['home','members','groups','activity','leave'].forEach(v => {
            const el = document.getElementById('view-'+v); if(el) el.classList.add('hidden');
        });
        if(tab==='gvg'||tab==='groups') {
            const grpView = document.getElementById('view-groups'); if(grpView) grpView.classList.remove('hidden');
            const title = document.getElementById('groupViewTitle'), panel = document.getElementById('groupControlPanel');
            if(tab==='gvg') {
                title.innerText = '團體戰分組'; panel.classList.remove('border-l-green-500'); panel.classList.add('border-l-red-500');
            } else {
                title.innerText = '固定團列表'; panel.classList.remove('border-l-red-500'); panel.classList.add('border-l-green-500');
            }
        } else {
            const t = document.getElementById('view-'+tab); if(t) t.classList.remove('hidden');
        }
        
        document.getElementById('nav-container').classList.toggle('hidden', tab==='home');
        document.querySelectorAll('.nav-pill').forEach(b => b.classList.remove('active'));
        const btn = document.getElementById('tab-'+tab); if(btn) btn.classList.add('active');
        
        const fab = document.getElementById('mainActionBtn');
        if(fab) fab.classList.toggle('hidden', tab==='home' || this.userRole==='guest');
        
        const warning = document.getElementById('adminWarning');
        if(warning) warning.classList.toggle('hidden', !(tab==='gvg' && !['master','admin','commander'].includes(this.userRole)));

        if(tab==='leave') this.initLeaveForm();
        this.scheduleRender();
    },

    handleMainAction: function() {
        if(this.currentTab==='members') this.openAddModal();
        else if(this.currentTab==='gvg'||this.currentTab==='groups') {
            if(['master','admin','commander'].includes(this.userRole)) this.openSquadModal();
            else this.showToast("權限不足", "error");
        } else if(this.currentTab==='activity') {
            if(this.isAdminOrMaster()) this.openActivityModal();
            else this.showToast("權限不足", "error");
        }
    },
    
    updateAdminUI: function() {
        const btn = document.getElementById('adminToggleBtn'), ctrls = document.getElementById('adminControls');
        const isAuth = this.userRole!=='guest';
        if(btn) { btn.classList.toggle('admin-mode-on', isAuth); btn.innerHTML = isAuth ? '<i class="fas fa-sign-out-alt"></i>' : '<i class="fas fa-user-shield"></i>'; }
        if(ctrls) ctrls.classList.toggle('hidden', !this.isAdminOrMaster());
        
        const rankSel = document.getElementById('rank'), lock = document.getElementById('rankLockIcon');
        if(rankSel) rankSel.disabled = !this.isAdminOrMaster();
        if(lock) lock.className = this.isAdminOrMaster() ? "fas fa-unlock text-blue-500 text-xs ml-2" : "fas fa-lock text-slate-300 text-xs ml-2";
        
        const actBtn = document.getElementById('addActivityBtn'), actWarn = document.getElementById('activityAdminWarning');
        if(actBtn) actBtn.classList.toggle('hidden', !this.isAdminOrMaster());
        if(actWarn) actWarn.classList.toggle('hidden', this.isAdminOrMaster());
        
        this.scheduleRender();
    },

    render: function() {
        if(this.currentTab==='members') this.renderMembers();
        else if(this.currentTab==='gvg'||this.currentTab==='groups') this.renderSquads();
        else if(this.currentTab==='activity') this.renderActivities();
        else if(this.currentTab==='leave') this.renderLeaveList();
        const cnt = document.querySelector('#memberCount'); if(cnt) cnt.innerText = `Total: ${this.members.length}`;
    },// --- Members Logic ---
    renderMembers: function() {
        const grid = document.getElementById('memberGrid'), noMsg = document.getElementById('noMemberMsg');
        if(!grid) return;
        const search = (document.getElementById('searchInput').value||'').toLowerCase();
        
        const filtered = this.members.filter(m => {
            const txt = ((m.lineName||"")+(m.gameName||"")+(m.mainClass||"")+(m.role||"")).toLowerCase();
            const jobMatch = this.currentJobFilter==='all' || (m.mainClass||"").startsWith(this.currentJobFilter);
            const roleMatch = this.currentFilter==='all' || (m.role||"").includes(this.currentFilter) || (this.currentFilter==='坦'&&m.mainClass.includes('坦'));
            return txt.includes(search) && jobMatch && roleMatch;
        });
        
        if(filtered.length===0) { grid.innerHTML=''; if(noMsg) noMsg.classList.remove('hidden'); }
        else {
            if(noMsg) noMsg.classList.add('hidden');
            grid.innerHTML = filtered.map(m => this.createCardHTML(m)).join('');
        }
        
        // Stats
        const count = r => this.members.filter(m=>(m.role||'').includes(r)).length;
        ['dps','sup','tank'].forEach(k => {
             const el=document.getElementById('stat-'+k); if(el) el.innerText=count(k==='dps'?'輸出':k==='sup'?'輔助':'坦');
        });
    },

    createCardHTML: function(item) {
        const mainJob = item.mainClass ? item.mainClass.split('(')[0] : '初心者';
        const style = Cfg.JOB_STYLES.find(s => s.key.some(k => mainJob.includes(k))) || { class: 'bg-job-default', icon: 'fa-user' };
        
        let rankBadge = '';
        if(item.rank==='會長') rankBadge='<span class="bg-slate-800 text-white text-[10px] px-1.5 rounded mr-1">會長</span>';
        else if(item.rank==='指揮官') rankBadge='<span class="bg-blue-600 text-white text-[10px] px-1.5 rounded mr-1">指揮</span>';
        else if(item.rank==='資料管理員') rankBadge='<span class="bg-slate-500 text-white text-[10px] px-1.5 rounded mr-1">管理</span>';

        const getRoleTag = (r) => {
            if((r||'').includes('輸出')) return `<span class="tag tag-dps">DPS</span>`;
            if((r||'').includes('坦')) return `<span class="tag tag-tank">TANK</span>`;
            if((r||'').includes('輔助')) return `<span class="tag tag-sup">SUP</span>`;
            return `<span class="tag bg-slate-100 text-slate-400">?</span>`;
        };

        return `<div class="card member-card border-l-4 ${style.class.replace('bg-', 'border-')}" onclick="app.openEditModal('${item.id}')">
            <div class="job-icon-box"><i class="fas ${style.icon}"></i></div>
            <div class="flex-grow p-3 flex flex-col justify-between min-w-0">
                <div class="flex justify-between items-start">
                    <div class="min-w-0"><div class="flex items-center mb-0.5">${rankBadge}<h3 class="font-bold text-slate-800 truncate text-sm">${item.gameName}</h3></div><p class="text-xs text-slate-400 font-bold">${item.mainClass}</p></div>
                    ${getRoleTag(item.role)}
                </div>
                <div class="flex items-center text-[10px] text-slate-400 mt-2 bg-slate-50 px-2 py-1 rounded w-fit" onclick="event.stopPropagation(); app.copyText(this, '${item.lineName}')">
                    <i class="fab fa-line text-green-500 mr-1"></i> ${item.lineName}
                </div>
            </div>
        </div>`;
    },

    // --- Editor ---
    setFilter: function(f) {
        this.currentFilter=f;
        document.querySelectorAll('.filter-btn').forEach(b => {
            const active = (f==='all' && b.innerText==='全部') || b.innerText.includes(f);
            b.className = active ? "filter-btn px-4 py-1.5 rounded-full text-sm font-bold bg-slate-800 text-white shadow-md transition" : "filter-btn px-4 py-1.5 rounded-full text-sm font-bold bg-white text-slate-600 border transition hover:bg-slate-50";
        });
        this.renderMembers();
    },
    setJobFilter: function(j) { this.currentJobFilter=j; this.renderMembers(); },

    populateJobSelects: function() {
        const bs = document.getElementById('baseJobSelect');
        if(bs && Cfg.JOB_STRUCTURE) bs.innerHTML = '<option value="" disabled selected>選擇職業</option>' + Object.keys(Cfg.JOB_STRUCTURE).map(j=>`<option value="${j}">${j}</option>`).join('');
    },
    updateSubJobSelect: function() {
        const b=document.getElementById('baseJobSelect').value, s=document.getElementById('subJobSelect');
        s.innerHTML = '<option value="" disabled selected>流派</option>';
        if(Cfg.JOB_STRUCTURE[b]) { s.disabled=false; Cfg.JOB_STRUCTURE[b].forEach(sub=>s.innerHTML+=`<option value="${b}(${sub})">${sub}</option>`); }
        else s.disabled=true;
    },
    toggleJobInputMode: function() {
        document.getElementById('subJobInput').classList.toggle('hidden');
        document.getElementById('subJobSelectWrapper').classList.toggle('hidden');
    },

    openAddModal: function() {
        document.getElementById('memberForm').reset(); document.getElementById('editId').value='';
        document.getElementById('deleteBtnContainer').innerHTML='';
        this.showModal('editModal');
    },
    openEditModal: function(id) {
        const m = this.members.find(x=>x.id===id); if(!m) return;
        document.getElementById('editId').value=m.id;
        document.getElementById('gameName').value=m.gameName; document.getElementById('lineName').value=m.lineName;
        document.getElementById('role').value=(m.role||'待定').split(' ')[0]; document.getElementById('rank').value=m.rank||'成員';
        document.getElementById('intro').value=m.intro||'';
        
        // Job Logic
        const full=m.mainClass||'', match=full.match(/^([^(]+)\(([^)]+)\)$/);
        const bs=document.getElementById('baseJobSelect'), ss=document.getElementById('subJobSelect');
        const inp=document.getElementById('subJobInput'), wrap=document.getElementById('subJobSelectWrapper');
        
        inp.classList.add('hidden'); wrap.classList.remove('hidden');
        if(match && Cfg.JOB_STRUCTURE[match[1]]) {
            bs.value=match[1]; this.updateSubJobSelect(); ss.value=full;
        } else if(Cfg.JOB_STRUCTURE[full.split('(')[0]]) {
            bs.value=full.split('(')[0]; this.updateSubJobSelect(); ss.value=full;
        } else {
            bs.value=""; inp.value=full; inp.classList.remove('hidden'); wrap.classList.add('hidden');
        }
        
        document.getElementById('deleteBtnContainer').innerHTML = this.isAdminOrMaster() ? `<button type="button" onclick="app.deleteMember('${id}')" class="text-red-400 text-sm font-bold">刪除</button>` : '';
        this.showModal('editModal');
    },
    
    saveMemberData: async function() {
        const id=document.getElementById('editId').value;
        let job = !document.getElementById('subJobInput').classList.contains('hidden') ? document.getElementById('subJobInput').value : document.getElementById('subJobSelect').value;
        if(!job) job = document.getElementById('baseJobSelect').value || "待定";
        
        const data = {
            gameName: document.getElementById('gameName').value,
            lineName: document.getElementById('lineName').value,
            mainClass: job, role: document.getElementById('role').value,
            rank: document.getElementById('rank').value, intro: document.getElementById('intro').value
        };
        
        if(!id) { data.createdAt=Date.now(); if(this.mode==='firebase') await this.db.collection(COLLECTION_NAMES.MEMBERS).add(data); else { data.id='m'+Date.now(); this.members.push(data); this.saveLocal('members'); } }
        else { if(this.mode==='firebase') await this.db.collection(COLLECTION_NAMES.MEMBERS).doc(id).update(data); else { const idx=this.members.findIndex(m=>m.id===id); this.members[idx]={...this.members[idx], ...data}; this.saveLocal('members'); } }
        this.closeModal('editModal'); this.showToast("成員已儲存");
    },
    deleteMember: async function(id) {
        if(!confirm("確定刪除?")) return;
        if(this.mode==='firebase') await this.db.collection(COLLECTION_NAMES.MEMBERS).doc(id).delete();
        else { this.members=this.members.filter(m=>m.id!==id); this.saveLocal('members'); }
        this.closeModal('editModal'); this.showToast("已刪除");
    },

    // --- Squads / GVG (Visual Updated - White Header) ---
    renderSquads: function() {
        const type = this.currentTab==='gvg'?'gvg':'groups';
        const search = (document.getElementById('groupSearchInput').value||'').toLowerCase();
        const grid = document.getElementById('squadGrid'), noMsg = document.getElementById('noSquadsMsg');
        if(!grid) return; grid.innerHTML='';

        const filtered = this.groups.filter(g => (g.type||'gvg')===type && g.name.toLowerCase().includes(search));
        if(filtered.length===0) { if(noMsg) noMsg.classList.remove('hidden'); return; }
        if(noMsg) noMsg.classList.add('hidden');

        grid.innerHTML = filtered.map(g => {
            const dateBadge = g.date ? `<span class="bg-white/50 border border-slate-200 text-slate-600 text-[10px] px-2 py-0.5 rounded font-bold mr-2">${g.date}</span>` : '';
            const editBtn = ['master','admin','commander'].includes(this.userRole) ? `<button onclick="app.openSquadModal('${g.id}')" class="text-slate-400 hover:text-slate-600"><i class="fas fa-cog"></i></button>` : '';
            
            // 這裡修改了標題配色：從黑底改成淡色系
            const headerClass = type==='gvg' ? 'bg-red-50 text-red-800 border-b border-red-100' : 'bg-blue-50 text-blue-800 border-b border-blue-100';

            const rows = (g.members||[]).map(m => {
                const id=typeof m==='string'?m:m.id, status=typeof m==='object'?m.status:'pending';
                const mem=this.members.find(x=>x.id===id); if(!mem) return '';
                
                let border='border-l-slate-300', color='text-slate-400';
                if((mem.role||'').includes('輸出')) { border='border-l-red-400'; color='text-red-500'; }
                else if((mem.role||'').includes('坦')) { border='border-l-blue-400'; color='text-blue-500'; }
                else if((mem.role||'').includes('輔助')) { border='border-l-green-400'; color='text-green-500'; }
                
                let action = '';
                if(type==='gvg') {
                    action = `<div class="flex gap-2">
                        <div class="gvg-light bg-light-yellow ${status==='leave'?'active':''}" title="請假"></div>
                        <div class="gvg-light ${status==='ready'?'bg-light-green active':'bg-light-red'}" onclick="event.stopPropagation(); app.toggleGvgStatus('${g.id}','${id}','ready')"></div>
                    </div>`;
                }

                return `<div class="flex items-center justify-between py-2.5 px-3 border-b border-slate-50 border-l-[3px] ${border} squad-member-row">
                    <div class="flex items-center gap-3">
                        <div class="w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center text-[10px] font-bold ${color}">${(mem.role||'?')[0]}</div>
                        <div class="flex flex-col"><span class="font-bold text-slate-700 text-sm">${mem.gameName}</span><span class="text-[10px] text-slate-400 font-bold">${(mem.mainClass||'').split('(')[0]}</span></div>
                    </div>
                    ${action}
                </div>`;
            }).join('');

            return `<div class="squad-card">
                <div class="p-3 ${headerClass} flex justify-between items-center">
                    <div><div class="flex items-center mb-1">${dateBadge}<span class="text-xs opacity-70">${g.subject||''}</span></div><h3 class="font-bold text-lg">${g.name}</h3></div>
                    ${editBtn}
                </div>
                <div class="bg-white min-h-[100px]">${rows || '<p class="text-center text-xs text-slate-300 py-4">無成員</p>'}</div>
            </div>`;
        }).join('');
    },

    toggleGvgStatus: function(gid, mid, act) {
        const g = this.groups.find(x=>x.id===gid); if(!g) return;
        const idx = g.members.findIndex(m => (typeof m==='string'?m:m.id)===mid); if(idx===-1) return;
        let m = g.members[idx]; if(typeof m==='string') m={id:m, status:'pending'};
        
        if(act==='ready') {
            if(m.status==='leave') return;
            m.status = m.status==='ready' ? 'pending' : 'ready';
        }
        g.members[idx]=m;
        if(this.mode==='firebase') this.db.collection(COLLECTION_NAMES.GROUPS).doc(gid).update({members:g.members});
        else this.saveLocal('groups');
    },

    // --- Squad Modal ---
    openSquadModal: function(id) {
        const type=this.currentTab==='gvg'?'gvg':'groups';
        document.getElementById('squadId').value=id||''; document.getElementById('squadType').value=type;
        const subSel = document.getElementById('squadSubject');
        subSel.innerHTML = this.raidThemes.map(t=>`<option value="${t}">${t}</option>`).join('');
        
        if(id) {
            const g = this.groups.find(x=>x.id===id);
            document.getElementById('squadName').value=g.name; document.getElementById('squadDate').value=g.date||'';
            document.getElementById('squadSubject').value=g.subject||'GVG 攻城戰'; document.getElementById('squadNote').value=g.note||'';
            this.currentSquadMembers = g.members.map(m=>typeof m==='string'?{id:m,status:'pending'}:m);
        } else {
            document.getElementById('squadName').value=''; document.getElementById('squadDate').value=new Date().toISOString().split('T')[0];
            this.currentSquadMembers = [];
        }
        this.renderSquadMemberSelect();
        
        document.getElementById('deleteSquadBtnContainer').innerHTML = id ? `<button onclick="app.deleteSquad('${id}')" class="text-red-400 font-bold text-sm">刪除隊伍</button>` : '';
        this.showModal('squadModal');
    },
    
    renderSquadMemberSelect: function() {
        const list = document.getElementById('squadMemberSelect'), search = (document.getElementById('memberSearch').value||'').toLowerCase();
        const filtered = this.members.filter(m => (m.gameName+m.mainClass).toLowerCase().includes(search));
        const isSel = (id) => this.currentSquadMembers.some(x=>x.id===id);
        filtered.sort((a,b) => isSel(b.id) - isSel(a.id));
        
        document.getElementById('selectedCount').innerText = this.currentSquadMembers.length;
        list.innerHTML = filtered.map(m => {
            const checked = isSel(m.id);
            return `<label class="flex items-center p-2 border rounded ${checked?'bg-blue-50 border-blue-200':'bg-white'} cursor-pointer">
                <input type="checkbox" onchange="app.toggleSquadMember('${m.id}')" ${checked?'checked':''} class="mr-3 text-blue-600 rounded">
                <div><div class="font-bold text-sm text-slate-700">${m.gameName}</div><div class="text-xs text-slate-400">${m.mainClass}</div></div>
            </label>`;
        }).join('');
        
        // Leader select
        const lSel = document.getElementById('squadLeader');
        lSel.innerHTML = '<option value="">未指定</option>' + this.currentSquadMembers.map(s => {
            const m=this.members.find(x=>x.id===s.id); return m?`<option value="${m.id}">${m.gameName}</option>`:'';
        }).join('');
    },
    toggleSquadMember: function(id) {
        const idx = this.currentSquadMembers.findIndex(x=>x.id===id);
        if(idx>-1) this.currentSquadMembers.splice(idx,1); else this.currentSquadMembers.push({id, status:'pending'});
        this.renderSquadMemberSelect();
    },
    saveSquad: async function() {
        const id = document.getElementById('squadId').value;
        const data = {
            name: document.getElementById('squadName').value, date: document.getElementById('squadDate').value,
            subject: document.getElementById('squadSubject').value, note: document.getElementById('squadNote').value,
            type: document.getElementById('squadType').value, leaderId: document.getElementById('squadLeader').value,
            members: this.currentSquadMembers
        };
        if(!data.name) return alert("請輸入名稱");
        
        if(!id) {
            if(this.mode==='firebase') await this.db.collection(COLLECTION_NAMES.GROUPS).add(data);
            else { data.id='g'+Date.now(); this.groups.push(data); this.saveLocal('groups'); }
        } else {
            if(this.mode==='firebase') await this.db.collection(COLLECTION_NAMES.GROUPS).doc(id).update(data);
            else { const idx=this.groups.findIndex(g=>g.id===id); this.groups[idx]={...this.groups[idx],...data}; this.saveLocal('groups'); }
        }
        this.closeModal('squadModal'); this.showToast("隊伍已儲存");
    },
    deleteSquad: async function(id) {
        if(!confirm("刪除?")) return;
        if(this.mode==='firebase') await this.db.collection(COLLECTION_NAMES.GROUPS).doc(id).delete();
        else { this.groups=this.groups.filter(g=>g.id!==id); this.saveLocal('groups'); }
        this.closeModal('squadModal'); this.showToast("已刪除");
    },// --- Leave System ---
    initLeaveForm: function() {
        document.getElementById('leaveDateInput').value = new Date().toISOString().split('T')[0];
        document.getElementById('leaveNote').value = '';
        const s = document.getElementById('leaveSubjectSelect'); s.innerHTML='<option>請選日期</option>'; s.disabled=true;
        this.updateLeaveSubjectSelect(); this.renderLeaveList();
    },
    toggleLeaveForm: function() { document.getElementById('leaveFormContainer').classList.toggle('hidden'); },
    togglePreLeaveMode: function() {
        const pre = document.getElementById('isPreLeave').checked;
        const s = document.getElementById('leaveSubjectSelect'), i = document.getElementById('preLeaveSearchInput');
        if(pre) { s.innerHTML='<option>全日</option>'; s.disabled=true; i.classList.remove('hidden'); }
        else { i.classList.add('hidden'); this.updateLeaveSubjectSelect(); }
    },
    renderPreLeaveOptions: function(val) {
        const s = document.getElementById('leaveMemberSelect'); s.disabled=false; s.innerHTML='';
        this.members.filter(m=>m.gameName.includes(val)).forEach(m => s.innerHTML+=`<option value="${m.id}">${m.gameName}</option>`);
    },
    updateLeaveSubjectSelect: function() {
        if(document.getElementById('isPreLeave').checked) return;
        const d = document.getElementById('leaveDateInput').value, s = document.getElementById('leaveSubjectSelect');
        s.innerHTML = '<option disabled selected>主題</option>';
        const subs = new Set(); this.groups.filter(g=>g.date===d).forEach(g=>subs.add(g.subject));
        if(subs.size===0) { s.innerHTML='<option>無活動</option>'; s.disabled=true; }
        else { subs.forEach(x=>s.innerHTML+=`<option value="${x}">${x}</option>`); s.disabled=false; }
    },
    updateLeaveMemberSelect: function() {
        if(document.getElementById('isPreLeave').checked) return;
        const d = document.getElementById('leaveDateInput').value, sub = document.getElementById('leaveSubjectSelect').value;
        const s = document.getElementById('leaveMemberSelect'); s.innerHTML='<option>人員</option>'; s.disabled=false;
        const target = this.groups.filter(g=>g.date===d && g.subject===sub);
        const mids = new Set(); target.forEach(g=>g.members.forEach(m=>mids.add(typeof m==='string'?m:m.id)));
        mids.forEach(id => { const m=this.members.find(x=>x.id===id); if(m) s.innerHTML+=`<option value="${m.id}">${m.gameName}</option>`; });
    },
    handleLeaveSubmit: function() {
        const d=document.getElementById('leaveDateInput').value, n=document.getElementById('leaveNote').value;
        const mid=document.getElementById('leaveMemberSelect').value, pre=document.getElementById('isPreLeave').checked;
        if(!d||!mid) return alert("資料不全");
        
        if(pre) {
            const l={id:'l'+Date.now(), memberId:mid, date:d, note:n, type:'pre'};
            if(this.mode==='firebase') this.db.collection('leaves').add(l);
            else { this.leaves.push(l); this.saveLocal('leaves'); }
        } else {
            const sub=document.getElementById('leaveSubjectSelect').value;
            const gs = this.groups.filter(g=>g.date===d && g.subject===sub);
            if(gs.length===0) return alert("無此隊伍");
            gs.forEach(g => {
                const idx = g.members.findIndex(m=>(typeof m==='string'?m:m.id)===mid);
                if(idx>-1) {
                    let m=g.members[idx]; if(typeof m==='string') m={id:m};
                    m.status='leave'; m.leaveNote=n; g.members[idx]=m;
                    if(this.mode==='firebase') this.db.collection(COLLECTION_NAMES.GROUPS).doc(g.id).update({members:g.members});
                }
            });
            if(this.mode==='demo') this.saveLocal('groups');
        }
        this.toggleLeaveForm(); this.renderLeaveList(); this.showToast("請假成功");
    },
    renderLeaveList: function() {
        const grid=document.getElementById('leaveListGrid'), no=document.getElementById('noLeaveMsg');
        if(!grid) return; grid.innerHTML='';
        const dFilter=document.getElementById('leaveFilterDate').value, nameFilter=document.getElementById('leaveSearch').value;
        
        let list = [];
        this.leaves.forEach(l => list.push({...l, source:'pre'}));
        this.groups.forEach(g => g.members.forEach(m => {
            if(typeof m==='object' && m.status==='leave') list.push({memberId:m.id, date:g.date, note:m.leaveNote, source:'group', gName:g.name});
        }));
        
        const filtered = list.filter(l => {
            const m = this.members.find(x=>x.id===l.memberId);
            return (!dFilter || l.date===dFilter) && (!nameFilter || (m&&m.gameName.includes(nameFilter)));
        });
        
        document.getElementById('leaveCountBadge').innerText = `${filtered.length} 人`;
        if(filtered.length===0) { if(no) no.classList.remove('hidden'); return; }
        if(no) no.classList.add('hidden');
        
        grid.innerHTML = filtered.map(l => {
            const m = this.members.find(x=>x.id===l.memberId);
            return `<div class="bg-white p-3 rounded-xl border-l-4 ${l.source==='pre'?'border-l-gray-400':'border-l-orange-400'} shadow-sm flex justify-between">
                <div>
                    <div class="font-bold text-slate-800">${m?m.gameName:l.memberId}</div>
                    <div class="text-xs text-slate-500">${l.date} - ${l.note||'無由'}</div>
                    ${l.source==='group'?`<div class="text-[10px] bg-slate-100 inline-block px-1 rounded">${l.gName}</div>`:''}
                </div>
                <button class="text-slate-300 hover:text-red-400" onclick="app.cancelLeave('${l.id||l.gName}', '${l.memberId}')"><i class="fas fa-times"></i></button>
            </div>`;
        }).join('');
    },
    cancelLeave: function(lid, mid) {
        if(!confirm("取消?")) return;
        if(lid.startsWith('l')) {
            if(this.mode==='firebase') this.db.collection('leaves').doc(lid).delete();
            else { this.leaves=this.leaves.filter(x=>x.id!==lid); this.saveLocal('leaves'); }
        } else {
            this.groups.forEach(g => {
                const idx=g.members.findIndex(m=>m.id===mid && m.status==='leave');
                if(idx>-1) {
                    g.members[idx].status='pending';
                    if(this.mode==='firebase') this.db.collection(COLLECTION_NAMES.GROUPS).doc(g.id).update({members:g.members});
                }
            });
            if(this.mode==='demo') this.saveLocal('groups');
        }
        this.renderLeaveList(); this.showToast("已取消");
    },

    // --- Activity ---
    renderActivities: function() {
        const grid=document.getElementById('activityList'); if(!grid) return;
        if(this.activities.length===0) { document.getElementById('noActivitiesMsg').classList.remove('hidden'); grid.innerHTML=''; return; }
        document.getElementById('noActivitiesMsg').classList.add('hidden');
        grid.innerHTML = this.activities.map(a => `
            <div class="activity-card p-4">
                <div class="font-bold text-lg text-slate-800">${a.name}</div>
                <div class="text-xs text-slate-500 mb-2">${a.note||''}</div>
                <div class="bg-yellow-50 p-2 rounded text-xs text-yellow-800 font-bold mb-2">得獎者: ${a.winners?a.winners.length:0} 人</div>
                ${this.isAdminOrMaster() ? `<button onclick="app.openActivityModal('${a.id}')" class="text-blue-500 text-xs underline">編輯</button>` : ''}
            </div>
        `).join('');
    },
    openActivityModal: function(id) {
        if(id) {
            const a = this.activities.find(x=>x.id===id);
            document.getElementById('activityName').value=a.name; document.getElementById('activityNote').value=a.note;
            document.getElementById('activityId').value=id; this.currentActivityWinners = a.winners||[];
            document.getElementById('deleteActivityBtnContainer').innerHTML = `<button onclick="app.deleteActivity('${id}')" class="text-red-400 font-bold text-sm">刪除</button>`;
        } else {
            document.getElementById('activityName').value=''; document.getElementById('activityId').value='';
            this.currentActivityWinners=[]; document.getElementById('deleteActivityBtnContainer').innerHTML='';
        }
        this.renderWinnerList(); this.showModal('activityModal');
    },
    saveActivity: async function() {
        const id=document.getElementById('activityId').value;
        const data={ name:document.getElementById('activityName').value, note:document.getElementById('activityNote').value, winners:this.currentActivityWinners };
        if(!id) {
            if(this.mode==='firebase') await this.db.collection(COLLECTION_NAMES.ACTIVITIES).add(data);
            else { data.id='a'+Date.now(); this.activities.push(data); this.saveLocal('activities'); }
        } else {
            if(this.mode==='firebase') await this.db.collection(COLLECTION_NAMES.ACTIVITIES).doc(id).update(data);
            else { const idx=this.activities.findIndex(a=>a.id===id); this.activities[idx]={...this.activities[idx],...data}; this.saveLocal('activities'); }
        }
        this.closeModal('activityModal'); this.showToast("活動已儲存");
    },
    deleteActivity: async function(id) {
        if(!confirm("刪除?")) return;
        if(this.mode==='firebase') await this.db.collection(COLLECTION_NAMES.ACTIVITIES).doc(id).delete();
        else { this.activities=this.activities.filter(a=>a.id!==id); this.saveLocal('activities'); }
        this.closeModal('activityModal'); this.showToast("已刪除");
    },
    
    // --- Winner Select ---
    openWinnerSelectionModal: function() { this.tempWinnerSelection=[...this.currentActivityWinners]; this.renderWinnerSelect(); this.showModal('winnerSelectionModal'); },
    renderWinnerSelect: function() {
        const grid=document.getElementById('winnerSelectGrid'), search=(document.getElementById('winnerSearchInput').value||'').toLowerCase();
        const filtered=this.members.filter(m=>m.gameName.toLowerCase().includes(search));
        const isSel=(id)=>this.tempWinnerSelection.some(x=>x.memberId===id);
        filtered.sort((a,b)=>isSel(b.id)-isSel(a.id));
        grid.innerHTML = filtered.map(m => {
            const checked=isSel(m.id);
            return `<label class="flex items-center p-2 border rounded ${checked?'bg-yellow-50 border-yellow-300':'bg-white'}">
                <input type="checkbox" onchange="app.toggleWinner('${m.id}')" ${checked?'checked':''} class="mr-2 rounded text-yellow-500"> ${m.gameName}
            </label>`;
        }).join('');
    },
    toggleWinner: function(id) {
        const idx=this.tempWinnerSelection.findIndex(x=>x.memberId===id);
        if(idx>-1) this.tempWinnerSelection.splice(idx,1); else this.tempWinnerSelection.push({memberId:id});
        this.renderWinnerSelect();
    },
    confirmWinnerSelection: function() { this.currentActivityWinners=[...this.tempWinnerSelection]; this.renderWinnerList(); this.closeModal('winnerSelectionModal'); },
    renderWinnerList: function() {
        const c=document.getElementById('winnerListContainer'); c.innerHTML='';
        document.getElementById('winnerCount').innerText = this.currentActivityWinners.length;
        this.currentActivityWinners.forEach(w => {
            const m=this.members.find(x=>x.id===w.memberId);
            c.innerHTML+=`<div class="bg-yellow-50 p-2 rounded text-sm flex justify-between"><span>${m?m.gameName:'未知'}</span></div>`;
        });
    },
    performLuckyDraw: function() {
        const pool=this.members.filter(m=>!this.tempWinnerSelection.some(x=>x.memberId===m.id));
        if(pool.length===0) return alert("無人可抽");
        const winner=pool[Math.floor(Math.random()*pool.length)];
        this.toggleWinner(winner.id); this.showToast(`恭喜: ${winner.gameName}`);
    },

    // --- Utils ---
    showModal: function(id) { document.getElementById(id).classList.remove('hidden'); document.getElementById(id).classList.add('flex'); },
    closeModal: function(id) { document.getElementById(id).classList.add('hidden'); document.getElementById(id).classList.remove('flex'); },
    copyText: function(el, txt) { navigator.clipboard.writeText(txt).then(()=>this.showToast("已複製")); },
    resetToDemo: function() { if(confirm("重置?")) { localStorage.clear(); location.reload(); } },
    saveConfig: function() {
        const v = document.getElementById('firebaseConfigInput').value;
        if(v) { localStorage.setItem('row_firebase_config', v); alert("已儲存,重新整理生效"); location.reload(); }
    },
    
    exportDataJSON: function() {
        const d = { members:this.members, groups:this.groups, activities:this.activities, leaves:this.leaves, history:this.history };
        const b = new Blob([JSON.stringify(d,null,2)], {type:'application/json'});
        const a = document.createElement('a'); a.href=URL.createObjectURL(b); a.download=`RO_Backup_${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a); a.click(); document.body.removeChild(a);
    },
    importDataJSON: function() {
        const i = document.createElement('input'); i.type='file'; i.accept='.json';
        i.onchange = e => {
            const f=e.target.files[0]; if(!f) return;
            const r=new FileReader(); r.onload=ev=>{
                try {
                    const d=JSON.parse(ev.target.result);
                    if(confirm(`還原 ${d.members.length} 位成員?`)) {
                        this.members=d.members||[]; this.groups=d.groups||[]; this.activities=d.activities||[];
                        this.leaves=d.leaves||[]; this.history=d.history||[];
                        this.saveLocal('all'); alert("成功"); location.reload();
                    }
                } catch(err){ alert("格式錯誤"); }
            }; r.readAsText(f);
        }; i.click();
    },
    exportCSV: function() {
        let csv = "\uFEFF遊戲ID,Line,職業,定位,職位\n";
        this.members.forEach(m => csv+=`${m.gameName},${m.lineName},${m.mainClass},${m.role},${m.rank}\n`);
        const a = document.createElement('a'); a.href='data:text/csv;charset=utf-8,'+encodeURI(csv); a.download='members.csv';
        document.body.appendChild(a); a.click(); document.body.removeChild(a);
    }
};

// 綁定 window 並啟動
window.app = App;
document.addEventListener('DOMContentLoaded', () => App.init());