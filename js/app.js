// ** 1. Tailwind Configuration (必須放在最前面，讓 CDN 讀取擴展設置) **
tailwind.config = {
    theme: {
        extend: {
            colors: { 
                ro: { 
                    primary: '#4380D3',
                    bg: '#e0f2fe',
                }
            },
            fontFamily: {
                'cute': ['"ZCOOL KuaiLe"', '"Varela Round"', 'sans-serif']
            },
            animation: {
                'float': 'float 6s ease-in-out infinite',
                'jelly': 'jelly 2s infinite',
                'cloud-move': 'cloudMove 60s linear infinite',
                'poring-jump': 'poringJump 1s infinite alternate',
            },
            keyframes: {
                float: {
                    '0%, 100%': { transform: 'translateY(0)' },
                    '50%': { transform: 'translateY(-10px)' },
                },
                jelly: {
                    '0%, 100%': { transform: 'scale(1, 1)' },
                    '25%': { transform: 'scale(0.9, 1.1)' },
                    '50%': { transform: 'scale(1.1, 0.9)' },
                    '75%': { transform: 'scale(0.95, 1.05)' },
                },
                cloudMove: {
                    '0%': { backgroundPosition: '0 0' },
                    '100%': { backgroundPosition: '1000px 0' },
                },
                poringJump: {
                    '0%': { transform: 'translateY(0) scale(1.1, 0.9)' },
                    '100%': { transform: 'translateY(-20px) scale(0.9, 1.1)' }
                }
            }
        }
    }
}


// ** 2. 常量與初始數據 **
const DATA_VERSION = "6.0";
const JOB_STYLES = [
    { key: ['騎士'], class: 'bg-job-knight', icon: 'fa-shield-alt' }, { key: ['十字軍'], class: 'bg-job-crusader', icon: 'fa-cross' }, { key: ['鐵匠', '商人'], class: 'bg-job-blacksmith', icon: 'fa-hammer' },
    { key: ['獵人', '弓箭手'], class: 'bg-job-hunter', icon: 'fa-crosshairs' }, { key: ['詩人'], class: 'bg-job-bard', icon: 'fa-music' }, { key: ['煉金'], class: 'bg-job-alchemist', icon: 'fa-flask' },
    { key: ['神官', '服事', '牧師'], class: 'bg-job-priest', icon: 'fa-plus' }, { key: ['武僧'], class: 'bg-job-monk', icon: 'fa-fist-raised' }, { key: ['巫師', '法師'], class: 'bg-job-wizard', icon: 'fa-hat-wizard' },
    { key: ['賢者'], class: 'bg-job-sage', icon: 'fa-book' }, { key: ['槍手'], class: 'bg-job-gunslinger', icon: 'fa-bullseye' }, { key: ['舞孃'], class: 'bg-job-dancer', icon: 'fa-star' },
    { key: ['刺客', '盜賊'], class: 'bg-job-assassin', icon: 'fa-skull' }, { key: ['流氓'], class: 'bg-job-rogue', icon: 'fa-mask' }
];

const JOB_STRUCTURE = {
    "騎士": ["龍", "敏爆", "其他"], "十字軍": ["坦", "輸出", "其他"], "鐵匠": ["戰鐵", "鍛造", "其他"], "煉金": ["一般", "其他"],
    "獵人": ["鳥", "陷阱", "AD", "其他"], "詩人": ["輔助", "輸出", "其他"], "舞孃": ["輔助", "輸出", "其他"],
    "神官": ["讚美", "驅魔", "暴牧", "其他"], "武僧": ["連技", "阿修", "其他"], "巫師": ["隕石", "冰雷", "其他"],
    "賢者": ["輔助", "法系", "其他"], "刺客": ["敏爆", "毒", "雙刀", "其他"], "流氓": ["脫裝", "輸出", "弓", "其他"],
    "槍手": ["一般", "其他"], "初心者": ["超級初心者", "其他"]
};

const SEED_DATA = [
    { id: "m01", lineName: "poppy🐶", gameName: "YT清燉小羔羊", mainClass: "神官(讚美)", role: "輔助", rank: "會長", intro: "公會唯一清流 出淤泥而不染" },
    { id: "m02", lineName: "#Yuan", gameName: "沐沐", mainClass: "神官(讚美)", role: "輔助", rank: "資料管理員", intro: "" },
    { id: "m03", lineName: "Lam 🦄", gameName: "孤芳自賞", mainClass: "獵人(陷阱)", role: "輸出", rank: "成員", intro: "" },
    { id: "m04", lineName: "alan", gameName: "小櫻花", mainClass: "武僧", role: "輔助", rank: "成員", intro: "待領養孤兒" },
    { id: "m05", lineName: "董宜坤", gameName: "去去彈匣清空", mainClass: "槍手", role: "輸出", rank: "成員", intro: "" },
    { id: "m06", lineName: "阿智", gameName: "恐龍跌倒", mainClass: "獵人(鳥)", role: "待定", rank: "成員", intro: "待領養孤兒" },
    { id: "m07", lineName: "佳慶", gameName: "襪子髒髒", mainClass: "神官(讚美)", role: "輔助", rank: "成員", intro: "" },
    { id: "m08", lineName: "騰億", gameName: "魅力四射", mainClass: "獵人(鳥)", role: "待定", rank: "成員", intro: "" },
    { id: "m09", lineName: "Xian", gameName: "沐瑀", mainClass: "", role: "待定", rank: "成員", intro: "" },
    { id: "m10", lineName: "咘小欣", gameName: "貓二", mainClass: "", role: "待定", rank: "成員", intro: "" },
    { id: "m11", lineName: "奕雲", gameName: "奕雲", mainClass: "", role: "待定", rank: "成員", intro: "" },
    { id: "m12", lineName: "宇", gameName: "崔月月", mainClass: "獵人(鳥)", role: "輸出", rank: "成員", intro: "" },
    { id: "m13", lineName: "宏", gameName: "魔魂大白鯊", mainClass: "獵人(鳥)", role: "輸出", rank: "成員", intro: "" },
    { id: "m14", lineName: "🐬", gameName: "貝席兒", mainClass: "煉金", role: "待定", rank: "成員", intro: "待領養孤兒" },
    { id: "m15", lineName: "賀", gameName: "渺渺喵", mainClass: "", role: "待定", rank: "成員", intro: "" },
    { id: "m16", lineName: "鄒昀諭YunYuZou", gameName: "馬爾科姆", mainClass: "獵人(鳥)", role: "待定", rank: "成員", intro: "5678不同爸爸" },
    { id: "m17", lineName: "黑輪呦", gameName: "香菜佐黑輪", mainClass: "", role: "待定", rank: "成員", intro: "" },
    { id: "m18", lineName: "Peng", gameName: "棨棨", mainClass: "十字軍(坦)", role: "坦", rank: "成員", intro: "Здравствуйте ! как дела ?" },
    { id: "m19", lineName: "江承峻", gameName: "開喜婆婆", mainClass: "", role: "待定", rank: "成員", intro: "" },
    { id: "m20", lineName: "妃Fei ", gameName: "FeiFei ", mainClass: "法師(隕)", role: "輸出", rank: "成員", intro: "" },
    { id: "m21", lineName: "古銘", gameName: "卉香", mainClass: "刺客(敏爆)", role: "輸出", rank: "成員", intro: "" },
    { id: "m22", lineName: "傑森", gameName: "傑森七七", mainClass: "神官(讚美)", role: "輔助", rank: "成員", intro: "" },
    { id: "m23", lineName: "陳嘉圻", gameName: "陳小圻", mainClass: "獵人(鳥)", role: "輸出", rank: "成員", intro: "大白鯊的朋友" },
    { id: "m24", lineName: "Leo", gameName: "藤井樹", mainClass: "法師(隕)", role: "輸出", rank: "成員", intro: "" },
    { id: "m25", lineName: "小涵", gameName: "妞妞甜八寶", mainClass: "神官(讚美)", role: "輔助", rank: "成員", intro: "大白鯊的母奶" },
    { id: "m26", lineName: "星野悠（ホシノユウ）", gameName: "", mainClass: "鐵匠", role: "待定", rank: "成員", intro: "" },
    { id: "m27", lineName: "浩", gameName: "YT泰愛玩遊戲直bo", mainClass: "槍手", role: "輸出", rank: "成員", intro: "" },
    { id: "m28", lineName: "六六", gameName: "六六", mainClass: "十字軍(坦)", role: "坦", rank: "成員", intro: "" },
    { id: "m29", lineName: "灬森灬", gameName: "大雄", mainClass: "槍手", role: "輸出", rank: "成員", intro: "待領養孤兒" },
    { id: "m30", lineName: "陳小貓", gameName: "貓璃", mainClass: "刺客", role: "輸出", rank: "成員", intro: "睡神無敵朋友" },
    { id: "m31", lineName: "pei.yu.yang", gameName: "迪卡普歐", mainClass: "鐵匠", role: "待定", rank: "成員", intro: "睡神無敵麻吉" },
    { id: "m32", lineName: "A-Wei 黃執維", gameName: "睡神無敵", mainClass: "獵人(鳥)", role: "輸出", rank: "成員", intro: "睡神就是無敵" },
    { id: "m33", lineName: "阿揚", gameName: "牧牧", mainClass: "槍手", role: "輸出", rank: "成員", intro: "待領養孤兒" },
    { id: "m34", lineName: "徐小宏🖖🏼", gameName: "莫忘中出", mainClass: "槍手", role: "輸出", rank: "成員", intro: "" },
    { id: "m35", lineName: "Wang", gameName: "極度", mainClass: "法師(念)", role: "輸出", rank: "成員", intro: "" },
    { id: "m36", lineName: "Ryan", gameName: "水鏡是條狗", mainClass: "", role: "待定", rank: "成員", intro: "" },
    { id: "m37", lineName: "兩廣寬", gameName: "新竹房仲兩廣", mainClass: "賢者", role: "輔助", rank: "成員", intro: "" },
    { id: "m38", lineName: "富邦-Shawn(小逸)", gameName: "HsuBoBo", mainClass: "刺客(敏爆)", role: "輸出", rank: "成員", intro: "" },
    { id: "m39", lineName: "成成", gameName: "該獵戶已夜梟", mainClass: "獵人(鳥)", role: "待定", rank: "成員", intro: "待領養孤兒" },
    { id: "m40", lineName: "魏駿翔", gameName: "歐洲獨角獸", mainClass: "流氓(輸出)", role: "待定", rank: "成員", intro: "" },
    { id: "m41", lineName: "Louie", gameName: "水蜜桃王", mainClass: "獵人(鳥)", role: "輸出", rank: "成員", intro: "櫻花表弟" },
    { id: "m42", lineName: "Keith-匠屋空間工作室", gameName: "潘朵拉企鵝", mainClass: "流氓(脫裝)", role: "輸出", rank: "成員", intro: "待領養孤兒, 我喜歡大叔" },
    { id: "m43", lineName: "明", gameName: "白非羽", mainClass: "槍手", role: "輔助", rank: "成員", intro: "待領養孤兒" },
    { id: "m44", lineName: "中古車採購 威霖", gameName: "Weilin", mainClass: "", role: "待定", rank: "成員", intro: "" },
    { id: "m45", lineName: "江", gameName: "蝸牛丶", mainClass: "獵人(鳥)", role: "輸出", rank: "成員", intro: "" },
    { id: "m46", lineName: "ZhenYun", gameName: "三十九度八", mainClass: "神官(讚美)", role: "輔助", rank: "成員", intro: "待領養孤兒" },
    { id: "m47", lineName: "小寶", gameName: "提摩丶", mainClass: "獵人(鳥)", role: "輸出", rank: "成員", intro: "待領養孤兒" },
    { id: "m48", lineName: "張誌恒", gameName: "珮可", mainClass: "神官(讚美)", role: "輔助", rank: "成員", intro: "待領養孤兒" },
    { id: "m49", lineName: "哈啾", gameName: "哈啾", mainClass: "", role: "待定", rank: "成員", intro: "哈啾本哈" },
    { id: "m50", lineName: "丫鵬", gameName: "長歌恨", mainClass: "獵人(鳥)", role: "待定", rank: "成員", intro: "" },
    { id: "m51", lineName: "Agera", gameName: "嘎拉", mainClass: "騎士(敏爆)", role: "待定", rank: "成員", intro: "待領養孤兒" },
    { id: "m52", lineName: "許竣凱", gameName: "老婆幫我儲一單", mainClass: "十字軍(坦)", role: "坦", rank: "成員", intro: "" },
    { id: "m53", lineName: "Wei", gameName: "冬天君", mainClass: "獵人(鳥)", role: "坦", rank: "成員", intro: "待領養孤兒" },
    { id: "m54", lineName: "Randy", gameName: "啤酒香煙法力無邊", mainClass: "十字軍(坦)", role: "坦", rank: "成員", intro: "" },
    { id: "m55", lineName: "隆", gameName: "批星戴月", mainClass: "刺客(毒)", role: "輸出", rank: "成員", intro: "大白鯊的朋友" },
    { id: "m56", lineName: "汪", gameName: "139", mainClass: "槍手", role: "輸出", rank: "成員", intro: "" },
    { id: "m57", lineName: "Jimmy Chou", gameName: "靈刀灰休", mainClass: "", role: "待定", rank: "成員", intro: "" },
    { id: "m58", lineName: "gary", gameName: "陳冠希", mainClass: "獵人(鳥)", role: "輸出", rank: "成員", intro: "大白鯊的朋友" },
    { id: "m59", lineName: "Eric", gameName: "南門小皮", mainClass: "刺客(敏爆)", role: "輸出", rank: "成員", intro: "" },
    { id: "m60", lineName: "", gameName: "Lucia", mainClass: "刺客(敏爆)", role: "輸出", rank: "成員", intro: "" },
    { id: "m61", lineName: "恩蓉MoMo", gameName: "冷炩兒", mainClass: "", role: "待定", rank: "成員", intro: "" },
    { id: "m62", lineName: "GcJie", gameName: "貓窩下的星空", mainClass: "槍手", role: "輸出", rank: "成員", intro: "待領養孤兒" },
    { id: "m63", lineName: "Sean Liou", gameName: "青川", mainClass: "獵人(鳥)", role: "輸出", rank: "成員", intro: "" },
    { id: "m64", lineName: "🐰", gameName: "初蕾丶", mainClass: "神官(讚美)", role: "輔助", rank: "成員", intro: "" },
    { id: "m65", lineName: "阿賢", gameName: "碧空炎冰", mainClass: "槍手", role: "輸出", rank: "成員", intro: "" },
    { id: "m66", lineName: "仲軒", gameName: "熊熊很大", mainClass: "法師(隕)", role: "輸出", rank: "成員", intro: "" },
    { id: "m67", lineName: "航", gameName: "小波", mainClass: "獵人(鳥)", role: "輸出", rank: "成員", intro: "" },
    { id: "m68", lineName: "Pogin", gameName: "Pogin", mainClass: "詩人", role: "輔助", rank: "成員", intro: "待領養孤兒, 哈啾老公" },
    { id: "m69", lineName: "咩假屁謀", gameName: "", mainClass: "", role: "待定", rank: "成員", intro: "" },
    { id: "m70", lineName: "廖琮昱", gameName: "果仔", mainClass: "賢者", role: "待定", rank: "成員", intro: "待領養孤兒" },
    { id: "m71", lineName: "鍾豐年", gameName: "daliesi", mainClass: "刺客(毒)", role: "輔助", rank: "成員", intro: "" },
    { id: "m72", lineName: "蔡家昕", gameName: "星夜", mainClass: "刺客(毒)", role: "輸出", rank: "成員", intro: "睡神無敵小弟" },
    { id: "m73", lineName: "NICK", gameName: "狗是水鏡", mainClass: "流氓(輸出)", role: "輸出", rank: "成員", intro: "" }
];

const SEED_GROUPS = [];

// =======================================================
// [START] 自動連線程式碼：硬編碼 Firebase 設定檔
// =======================================================
const __firebase_config = JSON.stringify({
  "apiKey": "AIzaSyCxVEcgftiu7qmHhgLV-XaLzf6naBhaf-k",
  "authDomain": "ro123-aae1e.firebaseapp.com",
  "projectId": "ro123-aae1e",
  "storageBucket": "ro123-aae1e.firebasestorage.app",
  "messagingSenderId": "401692984816",
  "appId": "1:401692984816:web:711dacb2277b52fb7d0935",
  "measurementId": "G-SVYZGQZB83"
});
// =======================================================
// [END] 自動連線程式碼
// =======================================================


// ** 3. App 應用程式邏輯 **

const App = {
    db: null, auth: null, collectionMembers: 'members', collectionGroups: 'groups', 
    members: [], groups: [], history: [], 
    currentFilter: 'all', currentJobFilter: 'all', currentTab: 'home', mode: 'demo', currentSquadMembers: [],
    userRole: 'guest', 

    init: async function() {
        const savedRole = localStorage.getItem('row_user_role');
        if (savedRole && ['admin', 'master', 'commander'].includes(savedRole)) {
            this.userRole = savedRole;
        }
        this.loadHistory(); 

        if (typeof firebase !== 'undefined') {
            let config = null;
            // 優先從硬編碼的 __firebase_config 讀取設定
            if (typeof __firebase_config !== 'undefined' && __firebase_config) try { config = JSON.parse(__firebase_config); } catch(e) {}
            // 如果硬編碼沒有，則從本機儲存空間讀取 (這部分現在備用)
            if (!config) { const stored = localStorage.getItem('row_firebase_config'); if (stored) config = JSON.parse(stored); }
            
            if (config) { this.initFirebase(config); } else { this.initDemoMode(); }
        } else { this.initDemoMode(); }
        this.setupListeners();
        this.updateAdminUI();
        this.switchTab('home'); 
    },
    
    // ... (App.sortMembers 函式)
    sortMembers: function(membersArray) {
        return membersArray.sort((a, b) => {
            const idA = a.id;
            const idB = b.id;
            const isSeedA = /^m\d{2}$/.test(idA);
            const isSeedB = /^m\d{2}$/.test(idB);
            
            if (isSeedA && isSeedB) {
                return idA.localeCompare(idB);
            }
            if (isSeedA) return -1; 
            if (isSeedB) return 1;  
            
            return (a.gameName || '').localeCompare(b.gameName || '');
        });
    },

    // ... (App.initFirebase 函式)
    initFirebase: async function(config) {
        try {
            if (!firebase.apps.length) firebase.initializeApp(config);
            this.auth = firebase.auth(); this.db = firebase.firestore(); this.mode = 'firebase';
            if (typeof __initial_auth_token !== 'undefined' && __initial_auth_token) await this.auth.signInWithCustomToken(__initial_auth_token); else await this.auth.signInAnonymously();
            const appId = typeof __app_id !== 'undefined' ? __app_id : 'row-guild-app';
            const user = this.auth.currentUser;
            if (user) {
                const publicData = this.db.collection('artifacts').doc(appId).collection('public').doc('data');
                publicData.collection(this.collectionMembers).onSnapshot(snap => { 
                    const arr = []; snap.forEach(d => arr.push({ id: d.id, ...d.data() })); 
                    this.members = this.sortMembers(arr); 
                    if (arr.length === 0 && this.members.length === 0) this.seedFirebaseMembers(); else { this.render(); } 
                });
                publicData.collection(this.collectionGroups).onSnapshot(snap => { const arr = []; snap.forEach(d => arr.push({ id: d.id, ...d.data() })); this.groups = arr; this.render(); });
            }
        } catch (e) { console.error("Firebase Init Failed", e); this.initDemoMode(); }
    },

    // ... (App.initDemoMode 函式)
    initDemoMode: function() {
        this.mode = 'demo';
        const storedMem = localStorage.getItem('row_local_members'); const storedGrp = localStorage.getItem('row_local_groups');
        const currentVer = localStorage.getItem('row_data_ver');
        const APP_VER = '27.0'; 

        if (currentVer !== APP_VER) {
            this.members = JSON.parse(JSON.stringify(SEED_DATA));
            if (storedGrp) this.groups = JSON.parse(storedGrp); else this.groups = JSON.parse(JSON.stringify(SEED_GROUPS));
            
            localStorage.setItem('row_data_ver', APP_VER);
            this.saveLocal();
        } else {
            if (storedMem) this.members = JSON.parse(storedMem); else this.members = JSON.parse(JSON.stringify(SEED_DATA));
            if (storedGrp) this.groups = JSON.parse(storedGrp); else this.groups = JSON.parse(JSON.stringify(SEED_GROUPS));
        }
        this.members = this.sortMembers(this.members); 
        this.render();
    },

    // ... (App.seedFirebaseMembers 函式)
    seedFirebaseMembers: async function() {
        const appId = typeof __app_id !== 'undefined' ? __app_id : 'row-guild-app';
        const batch = this.db.batch();
        SEED_DATA.forEach(item => { const ref = this.db.collection('artifacts').doc(appId).collection('public').doc('data').collection(this.collectionMembers).doc(item.id); batch.set(ref, item); }); // <-- 注意: 這裡已修改為使用 item.id 作為 doc ID
        await batch.commit();
    },

    // ... (App.saveLocal 函式)
    saveLocal: function() {
        if (this.mode === 'demo') { 
            localStorage.setItem('row_local_members', JSON.stringify(this.members)); 
            localStorage.setItem('row_local_groups', JSON.stringify(this.groups)); 
            localStorage.setItem('row_mod_history', JSON.stringify(this.history)); 
            this.render(); 
        }
    },
    
    // ... (App.logChange, App.showHistoryModal, App.openLoginModal, App.handleLogin, App.updateAdminUI, App.switchTab, App.handleMainAction 函式)
    loadHistory: function() {
        if (this.mode === 'demo') {
            const storedHistory = localStorage.getItem('row_mod_history');
            if (storedHistory) this.history = JSON.parse(storedHistory);
        }
    },
    logChange: function(action, details, targetId) {
        const log = {
            timestamp: Date.now(),
            user: this.userRole,
            action: action,
            details: details,
            targetId: targetId || 'N/A'
        };
        this.history.unshift(log); 
        if (this.mode === 'demo') {
            localStorage.setItem('row_mod_history', JSON.stringify(this.history));
        }
    },
    showHistoryModal: function() {
        if (!['master', 'admin'].includes(this.userRole)) {
            alert("權限不足：僅會長及管理員可查看修改紀錄。");
            return;
        }
        this.loadHistory(); 
        const list = document.getElementById('historyList');
        list.innerHTML = this.history.map(log => {
            const date = new Date(log.timestamp).toLocaleString('zh-TW', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' });
            const color = log.action.includes('DELETE') || log.action.includes('解散') ? 'text-red-600' : log.action.includes('ADD') || log.action.includes('建立') ? 'text-green-600' : 'text-blue-600';
            return `
                <div class="p-3 bg-slate-50 border border-slate-200 rounded-lg">
                    <div class="flex justify-between items-center text-xs text-slate-500 font-mono mb-1">
                        <span>${date}</span>
                        <span class="${color} font-bold">${log.action}</span>
                    </div>
                    <p class="text-sm text-slate-800">${log.details}</p>
                    <span class="text-[10px] text-slate-400">by ${log.user} (ID: ${log.targetId})</span>
                </div>`;
        }).join('') || '<p class="text-center text-slate-400 mt-4">尚無修改紀錄。</p>';
        this.showModal('historyModal');
    },

    openLoginModal: function() {
        if(this.userRole !== 'guest') { 
            if(confirm("確定要登出嗎？")) { 
                this.userRole = 'guest'; 
                localStorage.removeItem('row_user_role'); 
                this.updateAdminUI(); 
            } 
        } else { 
            document.getElementById('loginForm').reset(); 
            this.showModal('loginModal'); 
        }
    },
    handleLogin: function() {
        const u = document.getElementById('loginUser').value; const p = document.getElementById('loginPass').value;
        if(p !== '123456') { alert("密碼錯誤"); return; }

        if(u === 'poppy') { 
            this.userRole = 'master';
            alert("會長登入成功！"); 
        } else if (u === 'yuan') { 
            this.userRole = 'admin';
            alert("資料管理員登入成功！"); 
        } else if (u === 'commander') {
            this.userRole = 'commander';
            alert("指揮官登入成功！");
        } else { 
            alert("帳號錯誤");
            return;
        }
        
        localStorage.setItem('row_user_role', this.userRole);
        this.closeModal('loginModal'); 
        this.updateAdminUI(); 
    },
    updateAdminUI: function() {
        const btn = document.getElementById('adminToggleBtn');
        const adminControls = document.getElementById('adminControls');
        
        if(this.userRole !== 'guest') {
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
        this.render();
    },

    switchTab: function(tab) {
        this.currentTab = tab;
        document.getElementById('view-home').classList.toggle('hidden', tab !== 'home');
        document.getElementById('view-members').classList.toggle('hidden', tab !== 'members');
        document.getElementById('view-groups').classList.toggle('hidden', tab !== 'gvg' && tab !== 'groups');
        
        document.getElementById('nav-container').classList.toggle('hidden', tab === 'home');

        document.querySelectorAll('.nav-pill').forEach(b => b.classList.remove('active'));
        const activeBtn = document.getElementById('tab-' + tab);
        if(activeBtn) activeBtn.classList.add('active');

        if(tab === 'gvg') {
            document.getElementById('groupViewTitle').innerText = 'GVG 攻城戰分組';
            document.getElementById('squadModalTitle').innerText = 'GVG 分組管理';
        } else if(tab === 'groups') {
            document.getElementById('groupViewTitle').innerText = '固定團列表';
            document.getElementById('squadModalTitle').innerText = '固定團管理';
        }

        this.render();
    },

    handleMainAction: function() { 
        if(this.currentTab === 'members') this.openAddModal(); 
        else if(this.currentTab === 'gvg') {
            if(['master', 'admin', 'commander'].includes(this.userRole)) this.openSquadModal(); 
            else alert("權限不足：僅有管理人員可建立 GVG 分組");
        }
        else if(this.currentTab === 'groups') {
            this.openSquadModal();
        }
    },

    saveMemberData: async function() {
        const id = document.getElementById('editId').value;
        let mainClass = "";
        const input = document.getElementById('subJobInput');
        const select = document.getElementById('subJobSelect');
        
        if (!input.classList.contains('hidden')) { 
            mainClass = input.value; 
        } else { 
            mainClass = select.value; 
        }
        
        if (!mainClass || mainClass === "" || mainClass === "先選職業" || mainClass === "選擇流派") mainClass = "待定";
        
        const member = { 
            lineName: document.getElementById('lineName').value, 
            gameName: document.getElementById('gameName').value, 
            mainClass: mainClass, 
            role: document.getElementById('role').value, 
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
            const appId = typeof __app_id !== 'undefined' ? __app_id : 'row-guild-app'; 
            await this.db.collection('artifacts').doc(appId).collection('public').doc('data').collection(this.collectionMembers).add(member); 
        } 
        else { 
            member.id = 'm_' + Date.now(); 
            this.members.push(member); 
            this.members = this.sortMembers(this.members); 
            this.saveLocal(); 
        }
    },

    // =======================================================
    // ** 【修復重點】App.updateMember 函式 **
    // 解決 ID 衝突導致的更新失敗，並確保 Modal 關閉
    // =======================================================
    updateMember: async function(id, member) {
        if (this.mode === 'firebase') { 
            const appId = typeof __app_id !== 'undefined' ? __app_id : 'row-guild-app'; 
            const docRef = this.db.collection('artifacts').doc(appId).collection('public').doc('data').collection(this.collectionMembers).doc(id);

            try {
                // 嘗試更新現有文件
                await docRef.update(member); 
            } catch (error) {
                // 如果是 "找不到文件" 錯誤 (常見於首次同步後的 ID 衝突)，則改為 set/add
                if (error.code === 'not-found' || error.message.includes('No document to update')) {
                     console.warn(`Attempted update failed for ID ${id}. Switching to set/add.`);
                     // 執行 set 操作，若文件不存在則創建它 (用 SEED_DATA 提供的 ID)
                     await docRef.set(member); 
                } else {
                    // 如果是其他錯誤，則拋出
                    throw error;
                }
            }
        } 
        else { 
            const idx = this.members.findIndex(d => d.id === id); 
            if (idx !== -1) { 
                this.members[idx] = { ...this.members[idx], ...member }; 
                this.members = this.sortMembers(this.members); 
                this.saveLocal(); 
            } 
        }
    },
    // =======================================================

    deleteMember: async function(id) {
        if (!confirm("確定要刪除這位成員嗎？")) return;
        const member = this.members.find(d => d.id === id);
        if (this.mode === 'firebase') { 
            const appId = typeof __app_id !== 'undefined' ? __app_id : 'row-guild-app'; 
            await this.db.collection('artifacts').doc(appId).collection('public').doc('data').collection(this.collectionMembers).doc(id).delete(); 
        } 
        else { 
            this.members = this.members.filter(d => d.id !== id); 
            this.groups.forEach(g => { g.members = g.members.filter(mid => (typeof mid === 'string' ? mid : mid.id) !== id); }); 
            this.saveLocal(); 
        }
        this.logChange('成員刪除', `刪除成員: ${member ? member.gameName : 'Unknown'}`, id);
        this.closeModal('editModal');
    },

    // ... (App.saveSquad 函式及其餘所有函式)
    saveSquad: async function() {
        if (!['master', 'admin', 'commander'].includes(this.userRole)) {
            alert("權限不足：僅有管理人員可建立/編輯分組"); return;
        }
        const type = this.currentTab === 'gvg' ? 'gvg' : 'misc';
        const id = document.getElementById('squadId').value;
        const name = document.getElementById('squadName').value;
        const note = document.getElementById('squadNote').value;
        
        const selectedMembers = [...this.currentSquadMembers];
        
        if(!name) { alert("請輸入隊伍名稱"); return; }
        const squadData = { name, note, members: selectedMembers, type };
        
        let action = '';
        if (id) {
            if (this.mode === 'firebase') { 
                const appId = typeof __app_id !== 'undefined' ? __app_id : 'row-guild-app'; 
                await this.db.collection('artifacts').doc(appId).collection('public').doc('data').collection(this.collectionGroups).doc(id).update(squadData); 
            } 
            else { 
                const idx = this.groups.findIndex(g => g.id === id); 
                if(idx !== -1) { this.groups[idx] = { ...this.groups[idx], ...squadData }; this.saveLocal(); } 
            }
            action = '隊伍資料更新';
        } else {
            if (this.mode === 'firebase') { 
                const appId = typeof __app_id !== 'undefined' ? __app_id : 'row-guild-app'; 
                await this.db.collection('artifacts').doc(appId).collection('public').doc('data').collection(this.collectionGroups).add(squadData); 
            } 
            else { 
                squadData.id = 'g_' + Date.now(); 
                this.groups.push(squadData); this.saveLocal(); 
            }
            action = '建立新隊伍';
        }
        this.logChange(action, `隊伍: ${name} (成員數: ${selectedMembers.length})`, id || 'new');
        this.closeModal('squadModal');
    },
    deleteSquad: async function(id) {
        if (!['master', 'admin', 'commander'].includes(this.userRole)) {
            alert("權限不足"); return;
        }

        if (!confirm("確定要解散這個隊伍嗎？")) return;
        const group = this.groups.find(g => g.id === id);
        if (this.mode === 'firebase') { 
            const appId = typeof __app_id !== 'undefined' ? __app_id : 'row-guild-app'; 
            await this.db.collection('artifacts').doc(appId).collection('public').doc('data').collection(this.collectionGroups).doc(id).delete(); 
        } 
        else { 
            this.groups = this.groups.filter(g => g.id !== id); 
            this.saveLocal(); 
        }
        this.logChange('解散隊伍', `解散隊伍: ${group ? group.name : 'Unknown'}`, id);
        this.closeModal('squadModal');
    },

    toggleMemberStatus: function(groupId, memberId) {
        const group = this.groups.find(g => g.id === groupId); 
        if(!group) return;

        const memberIndex = group.members.findIndex(m => (typeof m === 'string' ? m : m.id) === memberId);
        if (memberIndex === -1) return;
        
        let memberData = group.members[memberIndex];
        
        if (typeof memberData === 'string') memberData = { id: memberData, status: 'confirmed' };
        else memberData.status = memberData.status === 'confirmed' ? 'pending' : 'confirmed';
        
        group.members[memberIndex] = memberData;
        const squadData = { ...group };
        
        if (this.mode === 'firebase') { 
            const appId = typeof __app_id !== 'undefined' ? __app_id : 'row-guild-app';
            this.db.collection('artifacts').doc(appId).collection('public').doc('data').collection(this.collectionGroups).doc(groupId).update(squadData); 
        } else { 
            this.saveLocal(); 
        }
        this.renderSquads(); 
    },

    render: function() {
        if (this.currentTab === 'members') this.renderMembers();
        else if (this.currentTab === 'gvg' || this.currentTab === 'groups') this.renderSquads();
    },

    renderMembers: function() {
        const grid = document.getElementById('memberGrid');
        const searchVal = document.getElementById('searchInput').value.toLowerCase();
        
        let filtered = this.members.filter(item => {
            const matchText = (item.lineName + item.gameName + item.mainClass + item.role + (item.intro||"")).toLowerCase().includes(searchVal);
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
        const jobName = item.mainClass || '';
        const style = JOB_STYLES.find(s => s.key.some(k => jobName.includes(k))) || { class: 'bg-job-default', icon: 'fa-user' };
        
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

    renderSquads: function() {
        const type = this.currentTab === 'gvg' ? 'gvg' : 'misc';
        const warningMsg = document.getElementById('adminWarning');
        const search = document.getElementById('groupSearchInput').value.toLowerCase();
        
        let canEdit = true;
        if (type === 'gvg') {
            canEdit = ['master', 'admin', 'commander'].includes(this.userRole);
        }
        
        if(warningMsg) {
            if(!canEdit && type === 'gvg') warningMsg.classList.remove('hidden'); 
            else warningMsg.classList.add('hidden');
        }

        let visibleGroups = this.groups.filter(g => (g.type || 'gvg') === type);
        
        if (search) {
            visibleGroups = visibleGroups.filter(g => {
                if (g.name.toLowerCase().includes(search)) return true;
                const hasMember = g.members.some(m => {
                    const id = typeof m === 'string' ? m : m.id;
                    const mem = this.members.find(x => x.id === id);
                    return mem && (mem.gameName.toLowerCase().includes(search) || mem.mainClass.toLowerCase().includes(search));
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
                        <span class="text-xs text-slate-500 font-mono">${m.mainClass.replace(/\(.*\)/, '')}</span>
                        ${type === 'gvg' ? 
                            `<div class="text-lg cursor-pointer hover:scale-110 transition" title="${m.status==='confirmed'?'已確認出席':'未確認出席'}" 
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
                ? `<div class="font-bold text-sm ${confirmedCount === 5 ? 'text-green-600' : 'text-red-500'}">戰鬥成員: ${confirmedCount}/5</div>`
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

    copyText: function(el, text) { navigator.clipboard.writeText(text).then(() => { el.classList.add('copied'); setTimeout(() => el.classList.remove('copied'), 1500); }); },

    copySquadList: function(groupId) {
        let gid = groupId || document.getElementById('squadId').value;
        if(!gid) return;
        const group = this.groups.find(g => g.id === gid); if(!group) return;
        let text = `【${group.name}】 `;
        const memberNames = (group.members || []).map(m => { 
            const id = typeof m === 'string' ? m : m.id; 
            const mem = this.members.find(x => x.id === id); 
            return mem ? `${mem.gameName}` : 'Unknown'; 
        });
        text += memberNames.join(', ');
        navigator.clipboard.writeText(text).then(() => alert("已複製隊伍名單！"));
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
        const toggleBtn = document.getElementById('toggleJobBtn');

        baseSelect.innerHTML = '<option value="" disabled selected>選擇職業</option>';
        Object.keys(JOB_STRUCTURE).forEach(job => { 
            const opt = document.createElement('option'); 
            opt.value = job; 
            opt.innerText = job; 
            baseSelect.appendChild(opt); 
        });

        const fullJob = item.mainClass;
        const match = fullJob.match(/^([^(]+)\(([^)]+)\)$/);
        
        if (['master', 'admin'].includes(this.userRole)) { toggleBtn.classList.remove('hidden'); } else { toggleJobBtn.classList.add('hidden'); }
        
        subInput.classList.add('hidden'); 
        selectWrapper.classList.remove('hidden');

        if (match && JOB_STRUCTURE[match[1]]) {
            baseSelect.value = match[1];
            this.updateSubJobSelect();
            subSelect.value = fullJob;
        } else {
            if (['master', 'admin'].includes(this.userRole)) { 
                subInput.value = fullJob; 
                subInput.classList.remove('hidden'); 
                selectWrapper.classList.add('hidden'); 
            } else { 
                baseSelect.value = ""; 
                subSelect.innerHTML = '<option value="" disabled selected>選擇流派</option>'; 
                subSelect.disabled = true; 
            }
        }

        const rankSelect = document.getElementById('rank');
        const lockIcon = document.getElementById('rankLockIcon');
        if(this.userRole === 'master') {
            rankSelect.disabled = false;
            rankSelect.classList.remove('locked-field');
            lockIcon.className = "fas fa-unlock text-blue-500 text-xs ml-2";
        } else {
            rankSelect.disabled = true;
            rankSelect.classList.add('locked-field');
            lockIcon.className = "fas fa-lock text-slate-300 text-xs ml-2";
        }

        if (['master', 'admin'].includes(this.userRole)) {
             document.getElementById('deleteBtnContainer').innerHTML = `<button type="button" onclick="app.deleteMember('${item.id}')" class="text-red-500 text-sm hover:underline">刪除成員</button>`;
        } else {
             document.getElementById('deleteBtnContainer').innerHTML = '';
        }
        app.showModal('editModal');
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

    openSquadModal: function(id) {
        const type = this.currentTab === 'gvg' ? 'gvg' : 'misc';
        if(type === 'gvg' && !['master', 'admin', 'commander'].includes(this.userRole)) return; 

        document.getElementById('squadId').value = id || ''; document.getElementById('memberSearch').value = '';
        if(id) {
            const g = this.groups.find(g => g.id === id);
            document.getElementById('squadName').value = g.name; document.getElementById('squadNote').value = g.note;
            document.getElementById('deleteSquadBtnContainer').innerHTML = `<button type="button" onclick="app.deleteSquad('${id}')" class="text-red-500 text-sm hover:underline">解散</button>`;
            this.currentSquadMembers = JSON.parse(JSON.stringify(g.members));
        } else {
            document.getElementById('squadName').value = ''; document.getElementById('squadNote').value = '';
            document.getElementById('deleteSquadBtnContainer').innerHTML = '';
            this.currentSquadMembers = [];
        }
        this.renderSquadMemberSelect();
        app.showModal('squadModal');
    },

    toggleSquadMember: function(id) {
        const index = this.currentSquadMembers.findIndex(m => (typeof m === 'string' ? m : m.id) === id);
        if (index > -1) { 
            this.currentSquadMembers.splice(index, 1); 
        } else { 
            if (this.currentSquadMembers.length >= 5) return; 
            this.currentSquadMembers.push({ id: id, status: 'pending' }); 
        }
        this.renderSquadMemberSelect();
    },

    renderSquadMemberSelect: function() {
        const currentSquadId = document.getElementById('squadId').value;
        const currentSquadType = this.currentTab === 'gvg' ? 'gvg' : 'misc';
        const search = document.getElementById('memberSearch').value.toLowerCase();
        
        const occupiedIds = this.groups
            .filter(g => g.id !== currentSquadId && (g.type || 'gvg') === currentSquadType)
            .flatMap(g => g.members)
            .map(m => typeof m === 'string' ? m : m.id)
            .filter((value, index, self) => self.indexOf(value) === index); 

        let availableMembers = this.members.filter(m => !occupiedIds.includes(m.id));

        const filtered = availableMembers.filter(m => (m.gameName + m.lineName + m.mainClass).toLowerCase().includes(search));
        
        const isSelected = (mid) => this.currentSquadMembers.some(sm => (typeof sm === 'string' ? sm : sm.id) === mid);

        filtered.sort((a,b) => (isSelected(a.id) === isSelected(b.id)) ? 0 : isSelected(a.id) ? -1 : 1);
        
        const count = this.currentSquadMembers.length;
        const isFull = count >= 5;
        document.getElementById('selectedCount').innerText = `${count}/5`;
        document.getElementById('selectedCount').className = isFull ? "text-red-500 font-bold" : "text-blue-500 font-bold";

        document.getElementById('squadMemberSelect').innerHTML = filtered.map(m => {
            const checked = isSelected(m.id);
            const isDisabled = !checked && isFull;
            
            const jobName = m.mainClass || '';
            const style = JOB_STYLES.find(s => s.key.some(k => jobName.includes(k))) || { class: 'bg-job-default', icon: 'fa-user' };

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
    
    showModal: function(id) { document.getElementById(id).classList.remove('hidden'); },
    closeModal: function(id) { document.getElementById(id).classList.add('hidden'); },
    setupListeners: function() { /* No longer needed for form submit as we use inline onclick */ },
    
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

    exportCSV: function() {
        let csv = "\uFEFFLINE 暱稱,遊戲 ID,主職業,定位,公會職位,備註\n";
        this.members.forEach(m => csv += `"${m.lineName}","${m.gameName}","${m.mainClass}","${m.role}","${m.rank||'成員'}","${m.intro}"\n`);
        const link = document.createElement("a"); link.href = encodeURI("data:text/csv;charset=utf-8," + csv); link.download = "ROW成員.csv";
        document.body.appendChild(link); link.click(); document.body.removeChild(link);
    },
    downloadSelf: function() {
        // 為了確保下載的檔案是最新狀態的獨立檔案，需要重新生成 HTML 內容
        alert("請手動將三個檔案內容合併，再用瀏覽器本身的『另存網頁為...』功能來備份。");
    },
    saveConfig: function() {
        try { localStorage.setItem('row_firebase_config', JSON.stringify(JSON.parse(document.getElementById('firebaseConfigInput').value))); location.reload(); } catch(e) { alert("JSON 格式錯誤"); }
    },
    resetToDemo: function() { 
        localStorage.removeItem('row_firebase_config'); 
        localStorage.removeItem('row_local_members'); 
        localStorage.removeItem('row_local_groups'); 
        localStorage.removeItem('row_mod_history'); 
        location.reload(); 
    }
};

window.app = App; window.onload = () => App.init();