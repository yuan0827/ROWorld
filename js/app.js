// js/app.js
import { jobData, firebaseConfig, initialMembers } from './config.js';

const app = {
    data: {
        members: [],
        leaveRecords: [],
        squads: [],
        activities: [],
        customSquadSubjects: ['GVG', 'PVE', '副本', 'MVP', '爬塔'],
        history: []
    },
    user: null, 
    db: null,
    unsubscribe: null,
    currentTab: 'home',
    filterJob: 'all',
    filterRole: 'all',
    currentSquadId: null,
    currentActivityId: null,
    tempWinners: [],

    init() {
        this.loadFirebaseConfig();
    },

    loadFirebaseConfig() {
        // 優先讀取 LocalStorage 的設定
        let config = localStorage.getItem('ro_firebase_config');
        
        // 如果沒有，則使用 config.js 裡面的預設值 (您提供的)
        if (!config && firebaseConfig) {
            config = JSON.stringify(firebaseConfig);
            // 存入 LocalStorage 以便之後編輯
            localStorage.setItem('ro_firebase_config', config);
        }

        if (config) {
            try {
                const parsedConfig = JSON.parse(config);
                firebase.initializeApp(parsedConfig);
                this.db = firebase.firestore();
                this.setupRealtimeListener();
                document.getElementById('firebaseConfigInput').value = JSON.stringify(parsedConfig, null, 2);
            } catch (e) {
                console.error("Firebase init failed:", e);
                this.loadLocalData();
            }
        } else {
            this.loadLocalData();
        }
        this.renderJobOptions();
    },

    setupRealtimeListener() {
        if (!this.db) return;
        document.body.classList.add('is-rendering');
        this.unsubscribe = this.db.collection('guildData').doc('main').onSnapshot(doc => {
            if (doc.exists) {
                this.data = doc.data();
                if (!this.data.history) this.data.history = []; 
                // 防止資料庫為空時沒有成員
                if ((!this.data.members || this.data.members.length === 0) && initialMembers) {
                     console.log("Database empty, merging initial members...");
                     this.data.members = initialMembers;
                }
            } else {
                // 文檔不存在，使用預設資料初始化
                if (initialMembers) this.data.members = initialMembers;
                this.saveData(); 
            }
            this.renderAll();
            document.body.classList.remove('is-rendering');
        }, err => {
            console.error(err);
            this.showToast('連線中斷，切換為本地模式', 'error');
            document.body.classList.remove('is-rendering');
            this.loadLocalData();
        });
    },

    loadLocalData() {
        const local = localStorage.getItem('ro_guild_data');
        if (local) {
            this.data = JSON.parse(local);
        } else {
            // 如果連本地都沒資料，就載入 config.js 裡的 73 人
            if (initialMembers) {
                this.data.members = [...initialMembers];
                this.showToast('已載入預設 73 位成員');
            }
        }
        if (!this.data.history) this.data.history = [];
        this.renderAll();
    },

    saveData() {
        if (this.db) {
            this.db.collection('guildData').doc('main').set(this.data)
                .catch(e => this.showToast('儲存失敗', 'error'));
        } else {
            localStorage.setItem('ro_guild_data', JSON.stringify(this.data));
        }
        this.renderAll();
    },

    saveConfig() {
        const input = document.getElementById('firebaseConfigInput').value;
        try {
            JSON.parse(input); 
            localStorage.setItem('ro_firebase_config', input);
            location.reload();
        } catch (e) {
            this.showToast('JSON 格式錯誤', 'error');
        }
    },

    resetToDemo() {
        if(confirm('確定清除設定並重置？')) {
            localStorage.removeItem('ro_firebase_config');
            localStorage.removeItem('ro_guild_data');
            location.reload();
        }
    },

    logHistory(action) {
        const record = {
            time: new Date().toLocaleString('zh-TW'),
            user: this.user ? this.user.role : '訪客',
            action: action
        };
        if (!this.data.history) this.data.history = [];
        this.data.history.unshift(record);
        if (this.data.history.length > 50) this.data.history.pop();
    },

    showHistoryModal() {
        const list = document.getElementById('historyList');
        list.innerHTML = (this.data.history || []).map(h => `
            <div class="text-sm border-b border-slate-100 pb-2">
                <div class="flex justify-between text-slate-400 text-xs mb-1">
                    <span>${h.time}</span>
                    <span class="font-bold">${h.user}</span>
                </div>
                <div class="text-slate-700">${h.action}</div>
            </div>
        `).join('') || '<div class="text-center text-slate-400 py-4">無紀錄</div>';
        this.showModal('historyModal');
    },

    renderAll() {
        this.renderMembers();
        this.renderLeaveList();
        this.renderSquads();
        this.renderActivities();
        this.checkAdminUI();
    },

    switchTab(tab) {
        document.querySelectorAll('main > div').forEach(el => el.classList.add('hidden'));
        document.getElementById(`view-${tab}`).classList.remove('hidden');
        
        document.querySelectorAll('.nav-pill').forEach(el => {
            el.classList.remove('bg-slate-800', 'text-white', 'shadow-md');
            el.classList.add('text-slate-500', 'hover:bg-slate-100');
        });
        const activeBtn = document.getElementById(`tab-${tab}`);
        if(activeBtn) {
            activeBtn.classList.add('bg-slate-800', 'text-white', 'shadow-md');
            activeBtn.classList.remove('text-slate-500', 'hover:bg-slate-100');
        }

        this.currentTab = tab;
        
        // Main Action Button Logic
        const fab = document.getElementById('mainActionBtn');
        if (tab === 'home') {
            fab.classList.add('hidden');
        } else {
            fab.classList.remove('hidden');
             // 根據不同分頁設定按鈕顏色
            fab.className = `fab-btn w-14 h-14 rounded-full flex items-center justify-center text-xl shadow-lg active:scale-90 transition border-4 border-slate-100 ${
                tab === 'members' ? 'bg-blue-600 text-white hover:bg-blue-700' :
                tab === 'gvg' ? 'bg-red-600 text-white hover:bg-red-700' :
                tab === 'leave' ? 'bg-orange-500 text-white hover:bg-orange-600' :
                tab === 'groups' ? 'bg-green-600 text-white hover:bg-green-700' :
                tab === 'activity' ? 'bg-yellow-500 text-white hover:bg-yellow-600' : 'bg-slate-800 text-white'
            }`;
            // 設定圖示
            fab.innerHTML = `<i class="fas fa-plus"></i>`;
        }
    },

    handleMainAction() {
        if (this.currentTab === 'members') this.openEditModal();
        if (this.currentTab === 'gvg') this.switchTab('groups');
        if (this.currentTab === 'leave') this.toggleLeaveForm();
        if (this.currentTab === 'groups') this.openSquadModal('fixed'); 
        if (this.currentTab === 'activity') this.openActivityModal();
    },

    // --- Auth ---
    openLoginModal() {
        if (this.user) {
            if(confirm('確定登出？')) {
                this.user = null;
                this.showToast('已登出');
                this.checkAdminUI();
            }
        } else {
            this.showModal('loginModal');
        }
    },
    
    handleLogin() {
        const u = document.getElementById('loginUser').value;
        const p = document.getElementById('loginPass').value;
        if (u === 'admin' && p === '8888') {
            this.user = { role: 'admin' };
            this.showToast('管理員登入成功');
            this.closeModal('loginModal');
            document.getElementById('loginUser').value = '';
            document.getElementById('loginPass').value = '';
        } else if (u === 'master' && p === '0000') {
            this.user = { role: 'master' };
            this.showToast('會長登入成功');
            this.closeModal('loginModal');
        } else {
            this.showToast('帳號或密碼錯誤', 'error');
        }
        this.checkAdminUI();
    },

    isAdmin() { return this.user && (this.user.role === 'admin' || this.user.role === 'master'); },
    isMaster() { return this.user && this.user.role === 'master'; },
    isAdminOrMaster() { return this.isAdmin(); },

    checkAdminUI() {
        const btn = document.getElementById('adminToggleBtn');
        const controls = document.getElementById('adminControls');
        const groupWarning = document.getElementById('adminWarning');
        
        if (this.user) {
            btn.classList.add('text-blue-600', 'bg-blue-50');
            btn.innerHTML = '<i class="fas fa-user-check"></i>';
            controls.classList.remove('hidden');
            if(groupWarning) groupWarning.classList.add('hidden');
        } else {
            btn.classList.remove('text-blue-600', 'bg-blue-50');
            btn.innerHTML = '<i class="fas fa-user-shield"></i>';
            controls.classList.add('hidden');
            if(groupWarning) groupWarning.classList.remove('hidden');
        }
        
        // Activity View Permission Warning
        const actWarning = document.getElementById('activityAdminWarning');
        const addActBtn = document.getElementById('addActivityBtn');
        if (this.isMaster()) {
            if(actWarning) actWarning.classList.add('hidden');
            if(addActBtn) addActBtn.classList.remove('hidden');
        } else {
            if(actWarning) actWarning.classList.remove('hidden');
            if(addActBtn) addActBtn.classList.add('hidden');
        }

        this.renderMembers(); 
        this.renderSquads();
        this.renderActivities();
    },

    // --- Members ---
    renderJobOptions() {
        const baseSel = document.getElementById('baseJobSelect');
        baseSel.innerHTML = Object.keys(jobData).map(j => `<option value="${j}">${j}</option>`).join('');
        this.updateSubJobSelect();
    },

    updateSubJobSelect() {
        const base = document.getElementById('baseJobSelect').value;
        const subSel = document.getElementById('subJobSelect');
        const subs = jobData[base] || [];
        subSel.innerHTML = subs.map(s => `<option value="${s}">${s}</option>`).join('');
    },
    
    toggleJobInputMode() {
        const wrapper = document.getElementById('subJobSelectWrapper');
        const input = document.getElementById('subJobInput');
        const btn = document.getElementById('toggleJobBtn');
        
        if (input.classList.contains('hidden')) {
            wrapper.classList.add('hidden');
            input.classList.remove('hidden');
            input.focus();
            btn.classList.add('text-blue-500', 'bg-blue-100');
        } else {
            wrapper.classList.remove('hidden');
            input.classList.add('hidden');
            btn.classList.remove('text-blue-500', 'bg-blue-100');
        }
    },

    renderMembers() {
        const grid = document.getElementById('memberGrid');
        const term = document.getElementById('searchInput').value.toLowerCase();
        
        let filtered = this.data.members.filter(m => {
            const matchText = m.gameName.toLowerCase().includes(term) || m.lineName.toLowerCase().includes(term) || m.baseJob.includes(term) || m.subJob.includes(term);
            const matchJob = this.filterJob === 'all' || m.role === this.filterJob;
            return matchText && matchJob;
        });

        // 排序：會長 -> 指揮官 -> 資料管理員 -> 成員
        const rankOrder = { '會長': 0, '指揮官': 1, '資料管理員': 2, '成員': 3 };
        filtered.sort((a, b) => (rankOrder[a.rank] || 3) - (rankOrder[b.rank] || 3));

        // 統計
        document.getElementById('memberCount').innerText = `Total: ${filtered.length}`;
        document.getElementById('stat-dps').innerText = filtered.filter(m => m.role === '輸出').length;
        document.getElementById('stat-sup').innerText = filtered.filter(m => m.role === '輔助').length;
        document.getElementById('stat-tank').innerText = filtered.filter(m => m.role === '坦').length;

        grid.innerHTML = '';
        if (filtered.length === 0) {
            document.getElementById('noMemberMsg').classList.remove('hidden');
        } else {
            document.getElementById('noMemberMsg').classList.add('hidden');
            filtered.forEach(m => {
                const isVIP = m.rank !== '成員';
                const vipBadge = isVIP ? `<span class="absolute top-2 right-2 px-2 py-0.5 rounded-full text-[10px] font-bold ${m.rank==='會長'?'bg-yellow-100 text-yellow-700':m.rank==='指揮官'?'bg-red-100 text-red-700':'bg-blue-100 text-blue-700'}">${m.rank}</span>` : '';
                
                grid.innerHTML += `
                <div onclick="app.openEditModal('${m.id}')" class="bg-white rounded-2xl p-4 shadow-sm border border-slate-100 relative hover:shadow-md transition cursor-pointer group">
                    ${vipBadge}
                    <div class="flex items-center gap-3 mb-2">
                        <div class="w-10 h-10 rounded-xl flex items-center justify-center text-lg font-bold shadow-sm ${m.role==='輸出'?'bg-red-50 text-red-600':m.role==='輔助'?'bg-green-50 text-green-600':m.role==='坦'?'bg-blue-50 text-blue-600':'bg-gray-100 text-gray-500'}">
                            ${m.gameName[0]}
                        </div>
                        <div>
                            <div class="font-black text-slate-700 leading-tight">${m.gameName}</div>
                            <div class="text-xs text-slate-400 font-bold">${m.lineName}</div>
                        </div>
                    </div>
                    <div class="flex items-center gap-2 mb-2">
                        <span class="text-xs font-bold px-2 py-1 rounded-lg bg-slate-50 text-slate-600 border border-slate-200">${m.baseJob}</span>
                        <span class="text-xs font-bold px-2 py-1 rounded-lg bg-slate-50 text-slate-600 border border-slate-200">${m.subJob}</span>
                    </div>
                    <div class="text-xs text-slate-400 truncate font-medium">${m.intro || '...'}</div>
                </div>`;
            });
        }
    },

    setJobFilter(val) { this.filterJob = val; this.renderMembers(); },
    setFilter(role) { this.filterJob = role; this.renderMembers(); },

    openEditModal(id = null) {
        if (!this.isAdmin()) return; // 權限

        const form = document.getElementById('memberForm');
        form.reset();
        document.getElementById('editId').value = '';
        document.getElementById('deleteBtnContainer').innerHTML = '';
        
        // 切換回選單模式
        document.getElementById('subJobSelectWrapper').classList.remove('hidden');
        document.getElementById('subJobInput').classList.add('hidden');

        // 權限控制
        const rankSelect = document.getElementById('rank');
        const rankLock = document.getElementById('rankLockIcon');
        
        if (this.isMaster()) {
            rankSelect.disabled = false;
            rankSelect.classList.remove('bg-gray-50', 'text-gray-400');
            rankLock.classList.add('hidden');
        } else {
            rankSelect.disabled = true;
            rankSelect.classList.add('bg-gray-50', 'text-gray-400');
            rankLock.classList.remove('hidden');
        }

        if (id) {
            const m = this.getMember(id);
            if (m) {
                document.getElementById('editId').value = m.id;
                document.getElementById('gameName').value = m.gameName;
                document.getElementById('lineName').value = m.lineName;
                document.getElementById('baseJobSelect').value = m.baseJob;
                this.updateSubJobSelect();
                
                // 檢查 subJob 是否在清單內
                const subOptions = Array.from(document.getElementById('subJobSelect').options).map(o => o.value);
                if (subOptions.includes(m.subJob)) {
                     document.getElementById('subJobSelect').value = m.subJob;
                } else {
                    // 自定義流派，切換到輸入模式
                    this.toggleJobInputMode();
                    document.getElementById('subJobInput').value = m.subJob;
                }

                document.getElementById('role').value = m.role;
                document.getElementById('rank').value = m.rank;
                document.getElementById('intro').value = m.intro || '';
                
                if (this.isAdmin()) {
                    document.getElementById('deleteBtnContainer').innerHTML = `<button type="button" onclick="app.deleteMember('${id}')" class="text-red-400 text-xs font-bold hover:bg-red-50 px-3 py-2 rounded-lg">刪除成員</button>`;
                }
            }
        } else {
             // 新增模式，會長可選，其他人預設成員
             rankSelect.value = '成員';
        }
        this.showModal('editModal');
    },

    saveMemberData() {
        const id = document.getElementById('editId').value;
        const subInput = document.getElementById('subJobInput');
        const subVal = subInput.classList.contains('hidden') ? document.getElementById('subJobSelect').value : subInput.value;

        const member = {
            id: id || Date.now().toString(),
            gameName: document.getElementById('gameName').value,
            lineName: document.getElementById('lineName').value,
            baseJob: document.getElementById('baseJobSelect').value,
            subJob: subVal,
            role: document.getElementById('role').value,
            rank: document.getElementById('rank').value,
            intro: document.getElementById('intro').value
        };

        if (id) {
            const index = this.data.members.findIndex(m => m.id === id);
            this.data.members[index] = member;
            this.logHistory(`修改成員: ${member.gameName}`);
        } else {
            this.data.members.push(member);
            this.logHistory(`新增成員: ${member.gameName}`);
        }
        this.saveData();
        this.closeModal('editModal');
        this.showToast('儲存成功');
    },

    deleteMember(id) {
        if(confirm('確定刪除此成員？')) {
            const m = this.getMember(id);
            this.data.members = this.data.members.filter(m => m.id !== id);
            this.logHistory(`刪除成員: ${m ? m.gameName : id}`);
            this.saveData();
            this.closeModal('editModal');
            this.showToast('成員已刪除');
        }
    },

    // --- Leave ---
    toggleLeaveForm() {
        const form = document.getElementById('leaveFormContainer');
        form.classList.toggle('hidden');
        if (!form.classList.contains('hidden')) {
            document.getElementById('leaveDateInput').valueAsDate = new Date();
            this.updateLeaveSubjectSelect();
        }
    },

    togglePreLeaveMode() {
        const isPre = document.getElementById('isPreLeave').checked;
        const input = document.getElementById('preLeaveSearchInput');
        const select = document.getElementById('leaveMemberSelect');
        
        if (isPre) {
            input.classList.remove('hidden');
            select.innerHTML = '<option value="">請搜尋並選擇成員</option>';
            select.disabled = false; 
        } else {
            input.classList.add('hidden');
            this.updateLeaveMemberSelect(); // 回復正常邏輯
        }
    },

    renderPreLeaveOptions(val) {
        const select = document.getElementById('leaveMemberSelect');
        if (!val) { select.innerHTML = '<option value="">請輸入關鍵字</option>'; return; }
        
        const matches = this.data.members.filter(m => m.gameName.includes(val) || m.lineName.includes(val));
        select.innerHTML = matches.map(m => `<option value="${m.id}">${m.gameName} (${m.lineName})</option>`).join('');
    },

    updateLeaveSubjectSelect() {
        const dateStr = document.getElementById('leaveDateInput').value;
        const subjectSel = document.getElementById('leaveSubjectSelect');
        const memberSel = document.getElementById('leaveMemberSelect');
        
        subjectSel.innerHTML = '<option value="" disabled selected>選擇主題</option>';
        memberSel.disabled = true;

        if (!dateStr) return;

        // 找出當天所有活動 (Squads)
        const squads = this.data.squads.filter(s => s.date === dateStr);
        if (squads.length > 0) {
            const subjects = [...new Set(squads.map(s => s.subject))];
            subjects.forEach(sub => {
                subjectSel.innerHTML += `<option value="${sub}">${sub}</option>`;
            });
            subjectSel.disabled = false;
        } else {
            subjectSel.innerHTML = '<option value="" disabled>當日無活動</option>';
            subjectSel.disabled = true;
        }
    },

    updateLeaveMemberSelect() {
        if (document.getElementById('isPreLeave').checked) return; // 預先請假模式不跑這段

        const dateStr = document.getElementById('leaveDateInput').value;
        const subject = document.getElementById('leaveSubjectSelect').value;
        const memberSel = document.getElementById('leaveMemberSelect');

        memberSel.innerHTML = '<option value="" disabled selected>載入中...</option>';
        memberSel.disabled = true;

        if (!dateStr || !subject) return;

        // 找出該主題所有隊伍的成員 ID
        const relatedSquads = this.data.squads.filter(s => s.date === dateStr && s.subject === subject);
        let memberIds = [];
        relatedSquads.forEach(s => memberIds.push(...s.members));
        memberIds = [...new Set(memberIds)]; // 去重

        if (memberIds.length > 0) {
            memberSel.innerHTML = memberIds.map(mid => {
                const m = this.getMember(mid);
                return m ? `<option value="${mid}">${m.gameName}</option>` : '';
            }).join('');
            memberSel.disabled = false;
        } else {
            memberSel.innerHTML = '<option value="" disabled>無相關成員</option>';
        }
    },

    handleLeaveSubmit() {
        const date = document.getElementById('leaveDateInput').value;
        const subject = document.getElementById('leaveSubjectSelect').value;
        const memberId = document.getElementById('leaveMemberSelect').value;
        const note = document.getElementById('leaveNote').value;
        const isPre = document.getElementById('isPreLeave').checked;

        if (!date || (!isPre && !subject) || !memberId) return this.showToast('請完整填寫', 'error');

        const finalSubject = isPre ? '預先請假' : subject;

        this.data.leaveRecords.push({
            id: Date.now().toString(),
            date,
            subject: finalSubject,
            memberId,
            note
        });
        
        const m = this.getMember(memberId);
        this.logHistory(`新增請假: ${m ? m.gameName : 'Unknown'} (${date})`);

        this.saveData();
        this.toggleLeaveForm();
        this.showToast('請假成功');
        
        // 自動刷新列表
        document.getElementById('leaveFilterDate').value = date;
        this.renderLeaveList();
    },

    renderLeaveList() {
        const list = document.getElementById('leaveListGrid');
        const search = document.getElementById('leaveSearch').value.toLowerCase();
        const dateFilter = document.getElementById('leaveFilterDate').value;
        const subjectFilter = document.getElementById('leaveFilterSubject').value;

        // Update Filters
        const subjects = [...new Set(this.data.leaveRecords.map(r => r.subject))];
        const subSel = document.getElementById('leaveFilterSubject');
        if (subSel.options.length <= 1) { // 避免無限重繪
             subSel.innerHTML = '<option value="">所有主題</option>' + subjects.map(s => `<option value="${s}">${s}</option>`).join('');
        }

        let filtered = this.data.leaveRecords.filter(r => {
            const m = this.getMember(r.memberId);
            const nameMatch = m && (m.gameName.includes(search) || m.lineName.includes(search));
            const dateMatch = !dateFilter || r.date === dateFilter;
            const subMatch = !subjectFilter || r.subject === subjectFilter;
            return nameMatch && dateMatch && subMatch;
        });

        filtered.sort((a, b) => new Date(b.date) - new Date(a.date)); // 日期新到舊

        document.getElementById('leaveCountBadge').innerText = `${filtered.length} 人`;

        list.innerHTML = '';
        if (filtered.length === 0) {
            document.getElementById('noLeaveMsg').classList.remove('hidden');
        } else {
            document.getElementById('noLeaveMsg').classList.add('hidden');
            filtered.forEach(r => {
                const m = this.getMember(r.memberId);
                if (!m) return;
                list.innerHTML += `
                    <div class="bg-white rounded-xl p-3 shadow-sm border border-slate-100 flex justify-between items-center group">
                        <div class="flex items-center gap-3">
                            <div class="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center font-bold text-slate-500 text-sm">
                                ${r.date.slice(5).replace('-','/')}
                            </div>
                            <div>
                                <div class="font-bold text-slate-700 flex items-center gap-2">
                                    ${m.gameName}
                                    <span class="text-[10px] px-1.5 py-0.5 bg-orange-100 text-orange-600 rounded">${r.subject}</span>
                                </div>
                                <div class="text-xs text-slate-400">${r.note || '無備註'}</div>
                            </div>
                        </div>
                        <button onclick="app.deleteLeave('${r.id}')" class="text-slate-300 hover:text-red-400 p-2 opacity-0 group-hover:opacity-100 transition"><i class="fas fa-trash-alt"></i></button>
                    </div>
                `;
            });
        }
    },

    deleteLeave(id) {
        if(confirm('刪除此請假紀錄？')) {
            this.data.leaveRecords = this.data.leaveRecords.filter(r => r.id !== id);
            this.saveData();
            this.renderLeaveList();
        }
    },

    // --- Squads ---
    renderSquads() {
        const grid = document.getElementById('squadGrid');
        const term = document.getElementById('groupSearchInput').value.toLowerCase();
        
        let filtered = this.data.squads.filter(s => s.name.toLowerCase().includes(term) || s.subject.includes(term));
        filtered.sort((a, b) => new Date(b.date) - new Date(a.date));

        grid.innerHTML = '';
        if (filtered.length === 0) {
            document.getElementById('noSquadsMsg').classList.remove('hidden');
        } else {
            document.getElementById('noSquadsMsg').classList.add('hidden');
            filtered.forEach(s => {
                const leader = this.getMember(s.leader);
                const membersHtml = s.members.map(mid => {
                    const m = this.getMember(mid);
                    if (!m) return '';
                    
                    // 檢查該成員在該日期、該主題是否有請假
                    const isLeave = this.data.leaveRecords.some(r => r.date === s.date && r.memberId === mid && (r.subject === s.subject || r.subject === '預先請假'));
                    const statusClass = isLeave ? 'bg-red-50 text-red-400 decoration-red-400 line-through' : 'bg-slate-50 text-slate-600';
                    
                    return `<span class="inline-block px-2 py-1 rounded text-xs font-bold mr-1 mb-1 border border-slate-100 ${statusClass}">${m.gameName}</span>`;
                }).join('');

                const editAction = this.isAdminOrMaster() ? `onclick="app.openSquadModal('fixed', '${s.id}')"` : '';
                const cursorClass = this.isAdminOrMaster() ? 'cursor-pointer hover:shadow-md' : 'cursor-default opacity-80';

                grid.innerHTML += `
                    <div class="bg-white rounded-2xl p-5 shadow-sm border-l-4 border-l-green-500 border-slate-100 transition relative group ${cursorClass}" ${editAction}>
                        <div class="flex justify-between items-start mb-3">
                            <div>
                                <h3 class="font-black text-lg text-slate-700">${s.name}</h3>
                                <div class="flex items-center gap-2 text-xs font-bold text-slate-400 mt-1">
                                    <span class="bg-green-100 text-green-700 px-2 py-0.5 rounded">${s.subject}</span>
                                    <span><i class="fas fa-calendar-alt mr-1"></i>${s.date}</span>
                                </div>
                            </div>
                            <div class="text-right">
                                <div class="text-xs text-slate-400 font-bold mb-1">隊長</div>
                                <div class="font-bold text-slate-700">${leader ? leader.gameName : '未定'}</div>
                            </div>
                        </div>
                        <div class="mb-3 flex flex-wrap gap-1">${membersHtml}</div>
                        <div class="text-xs text-slate-400 font-medium bg-slate-50 p-2 rounded-lg">${s.note || '無備註'}</div>
                    </div>
                `;
            });
        }
    },

    openSquadModal(type, id = null) {
        if (!this.isAdminOrMaster()) return;

        this.currentSquadId = id;
        document.getElementById('squadType').value = type;
        document.getElementById('squadMemberSelect').innerHTML = ''; // Clear first

        // Render Subjects
        this.renderSubjectOptions();

        if (id) {
            const s = this.data.squads.find(Sq => Sq.id === id);
            document.getElementById('squadModalTitle').innerText = '編輯隊伍';
            document.getElementById('squadName').value = s.name;
            document.getElementById('squadDate').value = s.date;
            document.getElementById('squadSubject').value = s.subject;
            document.getElementById('squadNote').value = s.note;
            
            // Render Leader Options & Set Value
            this.renderSquadLeaderSelect(s.members, s.leader);

            // Render Members & Check
            this.renderSquadMemberSelect(s.members);

            document.getElementById('deleteSquadBtnContainer').innerHTML = `<button type="button" onclick="app.deleteSquad('${id}')" class="text-red-400 text-xs font-bold hover:bg-red-50 px-3 py-2 rounded-lg">刪除隊伍</button>`;
        } else {
            document.getElementById('squadModalTitle').innerText = '新增隊伍';
            document.getElementById('squadName').value = '';
            document.getElementById('squadDate').value = new Date().toISOString().split('T')[0];
            document.getElementById('squadNote').value = '';
            document.getElementById('squadLeader').innerHTML = '<option value="">請先選擇隊員</option>';
            this.renderSquadMemberSelect([]);
            document.getElementById('deleteSquadBtnContainer').innerHTML = '';
        }

        this.showModal('squadModal');
    },

    renderSubjectOptions() {
        const sel = document.getElementById('squadSubject');
        sel.innerHTML = this.data.customSquadSubjects.map(s => `<option value="${s}">${s}</option>`).join('');
    },

    addCustomSubject() {
        const val = prompt('輸入新主題名稱:');
        if(val && !this.data.customSquadSubjects.includes(val)) {
            this.data.customSquadSubjects.push(val);
            this.saveData();
            this.renderSubjectOptions();
            document.getElementById('squadSubject').value = val;
        }
    },
    
    deleteCustomSubject() {
        const val = document.getElementById('squadSubject').value;
        if(confirm(`刪除主題 "${val}"？`)) {
            this.data.customSquadSubjects = this.data.customSquadSubjects.filter(s => s !== val);
            this.saveData();
            this.renderSubjectOptions();
        }
    },

    renderSquadMemberSelect(checkedIds = []) {
        const container = document.getElementById('squadMemberSelect');
        const term = document.getElementById('memberSearch').value.toLowerCase();
        
        let html = '';
        let count = 0;

        // Group members by role for better selection
        const roles = ['坦克', '輔助', '輸出', '待定'];
        const membersByRole = {};
        
        this.data.members.forEach(m => {
            const role = m.role === '坦' ? '坦克' : m.role;
            if(!membersByRole[role]) membersByRole[role] = [];
            membersByRole[role].push(m);
        });

        roles.forEach(role => {
            const ms = membersByRole[role] || [];
            const filteredMs = ms.filter(m => m.gameName.toLowerCase().includes(term));
            
            if(filteredMs.length > 0) {
                html += `<div class="col-span-full text-xs font-bold text-slate-400 mt-2 mb-1 pl-1">${role}</div>`;
                filteredMs.forEach(m => {
                    const isChecked = checkedIds.includes(m.id) ? 'checked' : '';
                    if(isChecked) count++;
                    html += `
                        <label class="flex items-center p-2 rounded-lg border border-slate-100 hover:bg-blue-50 cursor-pointer transition ${isChecked ? 'bg-blue-50 border-blue-200' : 'bg-white'}">
                            <input type="checkbox" name="squadMember" value="${m.id}" ${isChecked} class="w-4 h-4 text-blue-600 rounded mr-2" onchange="app.updateSquadLeaderOptions()">
                            <div>
                                <div class="font-bold text-sm text-slate-700">${m.gameName}</div>
                                <div class="text-[10px] text-slate-400">${m.baseJob}</div>
                            </div>
                        </label>
                    `;
                });
            }
        });

        container.innerHTML = html;
        document.getElementById('selectedCount').innerText = count;
    },

    updateSquadLeaderOptions() {
        const checkboxes = document.querySelectorAll('input[name="squadMember"]:checked');
        const ids = Array.from(checkboxes).map(c => c.value);
        const currentLeader = document.getElementById('squadLeader').value;
        
        this.renderSquadLeaderSelect(ids, currentLeader);
        document.getElementById('selectedCount').innerText = ids.length;
    },

    renderSquadLeaderSelect(memberIds, selectedId) {
        const sel = document.getElementById('squadLeader');
        if (memberIds.length === 0) {
            sel.innerHTML = '<option value="">未指定</option>';
            return;
        }
        
        let html = '<option value="">未指定</option>';
        memberIds.forEach(id => {
            const m = this.getMember(id);
            if(m) {
                html += `<option value="${id}" ${id === selectedId ? 'selected' : ''}>${m.gameName}</option>`;
            }
        });
        sel.innerHTML = html;
    },

    saveSquad() {
        const checkboxes = document.querySelectorAll('input[name="squadMember"]:checked');
        const members = Array.from(checkboxes).map(c => c.value);
        const name = document.getElementById('squadName').value;
        
        if (!name) return this.showToast('請輸入隊伍名稱', 'error');

        const squad = {
            id: this.currentSquadId || Date.now().toString(),
            name: name,
            date: document.getElementById('squadDate').value,
            subject: document.getElementById('squadSubject').value,
            leader: document.getElementById('squadLeader').value,
            members: members,
            note: document.getElementById('squadNote').value,
            type: document.getElementById('squadType').value
        };

        if (this.currentSquadId) {
            const idx = this.data.squads.findIndex(s => s.id === this.currentSquadId);
            this.data.squads[idx] = squad;
            this.logHistory(`更新隊伍: ${squad.name}`);
        } else {
            this.data.squads.push(squad);
            this.logHistory(`新增隊伍: ${squad.name}`);
        }

        this.saveData();
        this.closeModal('squadModal');
        this.showToast('隊伍儲存成功');
    },

    deleteSquad(id) {
        if(confirm('確定刪除此隊伍？')) {
            const s = this.data.squads.find(sq => sq.id === id);
            this.data.squads = this.data.squads.filter(sq => sq.id !== id);
            this.logHistory(`刪除隊伍: ${s ? s.name : id}`);
            this.saveData();
            this.closeModal('squadModal');
            this.showToast('隊伍已刪除');
        }
    },

    // --- Activities ---
    // [Updated V5.2] 渲染活動列表 (含搜尋與日期)
    renderActivities() {
        const container = document.getElementById('activityList');
        const searchTerm = (document.getElementById('activitySearchInput')?.value || '').toLowerCase().trim();
        
        let list = this.data.activities || [];
        // 依日期排序 (新到舊)
        list.sort((a, b) => new Date(b.date || '2000-01-01') - new Date(a.date || '2000-01-01'));

        if (searchTerm) {
            list = list.filter(act => {
                const matchName = (act.name || '').toLowerCase().includes(searchTerm);
                const matchWinner = (act.winners || []).some(w => {
                    const member = this.getMember(w.id);
                    const name = member ? (member.gameName + member.lineName) : '未知';
                    return name.toLowerCase().includes(searchTerm);
                });
                return matchName || matchWinner;
            });
        }

        container.innerHTML = '';
        
        if (list.length === 0) {
            document.getElementById('noActivitiesMsg').classList.remove('hidden');
            return;
        }
        document.getElementById('noActivitiesMsg').classList.add('hidden');

        list.forEach(act => {
            const dateStr = act.date ? act.date.replace(/-/g, '/') : '無日期';
            const winnersHtml = (act.winners || []).map(w => {
                const m = this.getMember(w.id);
                const displayName = m ? m.gameName : '未知成員';
                return `<span class="inline-block bg-yellow-100 text-yellow-700 text-xs px-2 py-1 rounded-lg font-bold mr-1 mb-1 border border-yellow-200">${displayName}</span>`;
            }).join('');

            const deleteBtn = this.isMaster() ? 
                `<button onclick="app.confirmDeleteActivity('${act.id}')" class="text-slate-300 hover:text-red-400 p-2"><i class="fas fa-trash-alt"></i></button>` : '';

            const editAction = this.isMaster() ? `onclick="app.openActivityModal('${act.id}')"` : '';
            const cursorClass = this.isMaster() ? 'cursor-pointer hover:shadow-md' : 'cursor-default';

            container.innerHTML += `
                <div class="bg-white rounded-2xl p-4 shadow-sm border border-slate-100 flex flex-col relative group transition-all duration-300 ${cursorClass}" ${editAction}>
                    <div class="flex justify-between items-start mb-2">
                        <div>
                            <span class="text-[10px] font-bold text-slate-400 bg-slate-100 px-2 py-0.5 rounded-md mb-1 inline-block tracking-wide">${dateStr}</span>
                            <h3 class="font-black text-slate-700 text-lg leading-tight">${act.name}</h3>
                        </div>
                        ${deleteBtn}
                    </div>
                    <p class="text-xs text-slate-500 mb-3 font-bold line-clamp-2">${act.note || '無說明'}</p>
                    <div class="mt-auto pt-2 border-t border-slate-50">
                        <div class="flex flex-wrap">${winnersHtml || '<span class="text-xs text-slate-300 font-bold">尚無得獎者</span>'}</div>
                    </div>
                </div>
            `;
        });
    },

    // [Updated V5.2] 開啟活動 Modal (含日期初始值)
    openActivityModal(id = null) {
        if(!this.isMaster()) return; 

        this.currentActivityId = id;
        this.tempWinners = []; 

        if (id) {
            const act = this.data.activities.find(a => a.id === id);
            if (act) {
                document.getElementById('activityName').value = act.name;
                document.getElementById('activityNote').value = act.note || '';
                document.getElementById('activityDate').value = act.date || new Date().toISOString().split('T')[0];
                this.tempWinners = [...(act.winners || [])];
            }
        } else {
            document.getElementById('activityName').value = '';
            document.getElementById('activityNote').value = '';
            document.getElementById('activityDate').value = new Date().toISOString().split('T')[0];
            this.tempWinners = [];
        }

        this.renderWinnerList();
        document.getElementById('deleteActivityBtnContainer').innerHTML = id ? 
            `<button type="button" onclick="app.confirmDeleteActivity('${id}')" class="text-red-400 text-xs font-bold hover:bg-red-50 px-3 py-2 rounded-lg">刪除此活動</button>` : '';
        
        this.showModal('activityModal');
    },

    // [Updated V5.2] 儲存活動 (含日期)
    saveActivity() {
        const name = document.getElementById('activityName').value.trim();
        const note = document.getElementById('activityNote').value.trim();
        const date = document.getElementById('activityDate').value;

        if (!name) return this.showToast('請輸入活動名稱', 'error');
        if (!date) return this.showToast('請選擇日期', 'error');

        if (this.currentActivityId) {
            const index = this.data.activities.findIndex(a => a.id === this.currentActivityId);
            if (index !== -1) {
                this.data.activities[index] = {
                    ...this.data.activities[index],
                    name,
                    note,
                    date,
                    winners: this.tempWinners
                };
                this.logHistory(`更新活動: ${name}`);
            }
        } else {
            const newActivity = {
                id: Date.now().toString(),
                name,
                note,
                date,
                winners: this.tempWinners
            };
            this.data.activities.push(newActivity);
            this.logHistory(`新增活動: ${name}`);
        }

        this.saveData();
        this.closeModal('activityModal');
        this.renderActivities();
        this.showToast('活動儲存成功');
    },

    confirmDeleteActivity(id) {
        event.stopPropagation();
        if(confirm('刪除此活動？')) {
            this.data.activities = this.data.activities.filter(a => a.id !== id);
            this.saveData();
            this.renderActivities();
            this.closeModal('activityModal'); 
        }
    },

    // Winner Selection Logic
    openWinnerSelectionModal() {
        this.showModal('winnerSelectionModal');
        this.renderWinnerMemberSelect();
    },

    renderWinnerMemberSelect() {
        const grid = document.getElementById('winnerSelectGrid');
        const term = document.getElementById('winnerSearchInput').value.toLowerCase();
        
        // Exclude already selected
        const selectedIds = this.tempWinners.map(w => w.id);
        
        const candidates = this.data.members.filter(m => 
            !selectedIds.includes(m.id) && 
            (m.gameName.toLowerCase().includes(term) || m.lineName.toLowerCase().includes(term))
        );

        grid.innerHTML = candidates.map(m => `
            <label class="flex items-center p-3 rounded-xl border border-slate-100 hover:bg-yellow-50 cursor-pointer transition">
                <input type="checkbox" name="winnerCandidate" value="${m.id}" class="w-5 h-5 text-yellow-500 rounded mr-3">
                <div class="font-bold text-slate-700">${m.gameName}</div>
            </label>
        `).join('') || '<div class="col-span-full text-center text-slate-400 py-4">查無成員</div>';
    },

    performLuckyDraw() {
        const grid = document.getElementById('winnerSelectGrid');
        const checkboxes = grid.querySelectorAll('input[type="checkbox"]');
        const available = Array.from(checkboxes).filter(cb => !cb.checked);
        
        if (available.length === 0) return this.showToast('無可選成員', 'error');
        
        // Random pick one
        const winner = available[Math.floor(Math.random() * available.length)];
        winner.checked = true;
        winner.closest('label').classList.add('bg-yellow-100', 'border-yellow-300', 'scale-105');
        setTimeout(() => winner.closest('label').classList.remove('scale-105'), 200);
    },

    confirmWinnerSelection() {
        const checkboxes = document.querySelectorAll('input[name="winnerCandidate"]:checked');
        checkboxes.forEach(cb => {
            this.tempWinners.push({ id: cb.value });
        });
        
        this.closeModal('winnerSelectionModal');
        this.renderWinnerList();
    },

    renderWinnerList() {
        const container = document.getElementById('winnerListContainer');
        const countSpan = document.getElementById('winnerCount');
        
        countSpan.innerText = this.tempWinners.length;
        
        container.innerHTML = this.tempWinners.map((w, index) => {
            const m = this.getMember(w.id);
            if(!m) return '';
            return `
                <div class="flex justify-between items-center bg-slate-50 px-3 py-2 rounded-lg">
                    <span class="font-bold text-slate-700 text-sm">${m.gameName}</span>
                    <button onclick="app.removeTempWinner(${index})" class="text-slate-400 hover:text-red-400"><i class="fas fa-times"></i></button>
                </div>
            `;
        }).join('');
    },

    removeTempWinner(index) {
        this.tempWinners.splice(index, 1);
        this.renderWinnerList();
    },

    // --- Utils ---
    getMember(id) { return this.data.members.find(m => m.id === id); },
    
    showModal(id) { document.getElementById(id).classList.remove('hidden'); },
    closeModal(id) { document.getElementById(id).classList.add('hidden'); },
    
    showToast(msg, type = 'success') {
        const toast = document.getElementById('globalToast');
        const icon = document.getElementById('toastIcon');
        document.getElementById('toastMsg').innerText = msg;
        
        if (type === 'error') {
            icon.className = 'fas fa-exclamation-circle text-red-400';
        } else {
            icon.className = 'fas fa-check-circle text-green-400';
        }
        
        toast.classList.remove('opacity-0', 'translate-y-4', 'pointer-events-none');
        setTimeout(() => {
            toast.classList.add('opacity-0', 'translate-y-4', 'pointer-events-none');
        }, 3000);
    },

    // --- Import/Export ---
    exportDataJSON() {
        const blob = new Blob([JSON.stringify(this.data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `ro_guild_data_${new Date().toISOString().slice(0,10)}.json`;
        a.click();
    },

    importDataJSON() {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'application/json';
        input.onchange = e => {
            const file = e.target.files[0];
            const reader = new FileReader();
            reader.onload = event => {
                try {
                    this.data = JSON.parse(event.target.result);
                    this.saveData();
                    alert('匯入成功');
                } catch (err) {
                    alert('格式錯誤');
                }
            };
            reader.readAsText(file);
        };
        input.click();
    },

    exportCSV() {
        let csv = '\uFEFF遊戲ID,Line暱稱,職業,流派,定位,職位,備註\n';
        this.data.members.forEach(m => {
            csv += `${m.gameName},${m.lineName},${m.baseJob},${m.subJob},${m.role},${m.rank},${m.intro || ''}\n`;
        });
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `ro_members_${new Date().toISOString().slice(0,10)}.csv`;
        a.click();
    }
};

window.app = app;
document.addEventListener('DOMContentLoaded', () => app.init());