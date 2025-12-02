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
const DATA_VERSION = "6.5"; // 更新版本：精確時間排序版
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

// 初始名單 (程式會依照此順序寫入時間戳記，間隔1秒，確保 #01 就是第一個)
const SEED_DATA = [
    { lineName: "poppy🐶", gameName: "YT清燉小羔羊", mainClass: "神官(讚美)", role: "輔助", rank: "會長", intro: "公會唯一清流 出淤泥而不染" },
    { lineName: "#Yuan", gameName: "沐沐", mainClass: "神官(讚美)", role: "輔助", rank: "資料管理員", intro: "" },
    { lineName: "Lam 🦄", gameName: "孤芳自賞", mainClass: "獵人(陷阱)", role: "輸出", rank: "成員", intro: "" },
    { lineName: "alan", gameName: "小櫻花", mainClass: "武僧", role: "輔助", rank: "成員", intro: "待領養孤兒" },
    { lineName: "董宜坤", gameName: "去去彈匣清空", mainClass: "槍手", role: "輸出", rank: "成員", intro: "" },
    { lineName: "阿智", gameName: "恐龍跌倒", mainClass: "獵人(鳥)", role: "待定", rank: "成員", intro: "待領養孤兒" },
    { lineName: "佳慶", gameName: "襪子髒髒", mainClass: "神官(讚美)", role: "輔助", rank: "成員", intro: "" },
    { lineName: "騰億", gameName: "魅力四射", mainClass: "獵人(鳥)", role: "待定", rank: "成員", intro: "" },
    { lineName: "Xian", gameName: "沐瑀", mainClass: "", role: "待定", rank: "成員", intro: "" },
    { lineName: "咘小欣", gameName: "貓二", mainClass: "", role: "待定", rank: "成員", intro: "" },
    { lineName: "奕雲", gameName: "奕雲", mainClass: "", role: "待定", rank: "成員", intro: "" },
    { lineName: "宇", gameName: "崔月月", mainClass: "獵人(鳥)", role: "輸出", rank: "成員", intro: "" },
    { lineName: "宏", gameName: "魔魂大白鯊", mainClass: "獵人(鳥)", role: "輸出", rank: "成員", intro: "" },
    { lineName: "🐬", gameName: "貝席兒", mainClass: "煉金", role: "待定", rank: "成員", intro: "待領養孤兒" },
    { lineName: "賀", gameName: "渺渺喵", mainClass: "", role: "待定", rank: "成員", intro: "" },
    { lineName: "鄒昀諭YunYuZou", gameName: "馬爾科姆", mainClass: "獵人(鳥)", role: "待定", rank: "成員", intro: "5678不同爸爸" },
    { lineName: "黑輪呦", gameName: "香菜佐黑輪", mainClass: "", role: "待定", rank: "成員", intro: "" },
    { lineName: "Peng", gameName: "棨棨", mainClass: "十字軍(坦)", role: "坦", rank: "成員", intro: "Здравствуйте ! как дела ?" },
    { lineName: "江承峻", gameName: "開喜婆婆", mainClass: "", role: "待定", rank: "成員", intro: "" },
    { lineName: "妃Fei ", gameName: "FeiFei ", mainClass: "法師(隕)", role: "輸出", rank: "成員", intro: "" },
    { lineName: "古銘", gameName: "卉香", mainClass: "刺客(敏爆)", role: "輸出", rank: "成員", intro: "" },
    { lineName: "傑森", gameName: "傑森七七", mainClass: "神官(讚美)", role: "輔助", rank: "成員", intro: "" },
    { lineName: "陳嘉圻", gameName: "陳小圻", mainClass: "獵人(鳥)", role: "輸出", rank: "成員", intro: "大白鯊的朋友" },
    { lineName: "Leo", gameName: "藤井樹", mainClass: "法師(隕)", role: "輸出", rank: "成員", intro: "" },
    { lineName: "小涵", gameName: "妞妞甜八寶", mainClass: "神官(讚美)", role: "輔助", rank: "成員", intro: "大白鯊的母奶" },
    { lineName: "星野悠（ホシノユウ）", gameName: "", mainClass: "鐵匠", role: "待定", rank: "成員", intro: "" },
    { lineName: "浩", gameName: "YT泰愛玩遊戲直bo", mainClass: "槍手", role: "輸出", rank: "成員", intro: "" },
    { lineName: "六六", gameName: "六六", mainClass: "十字軍(坦)", role: "坦", rank: "成員", intro: "" },
    { lineName: "灬森灬", gameName: "大雄", mainClass: "槍手", role: "輸出", rank: "成員", intro: "待領養孤兒" },
    { lineName: "陳小貓", gameName: "貓璃", mainClass: "刺客", role: "輸出", rank: "成員", intro: "睡神無敵朋友" },
    { lineName: "pei.yu.yang", gameName: "迪卡普歐", mainClass: "鐵匠", role: "待定", rank: "成員", intro: "睡神無敵麻吉" },
    { lineName: "A-Wei 黃執維", gameName: "睡神無敵", mainClass: "獵人(鳥)", role: "輸出", rank: "成員", intro: "睡神就是無敵" },
    { lineName: "阿揚", gameName: "牧牧", mainClass: "槍手", role: "輸出", rank: "成員", intro: "待領養孤兒" },
    { lineName: "徐小宏🖖🏼", gameName: "莫忘中出", mainClass: "槍手", role: "輸出", rank: "成員", intro: "" },
    { lineName: "Wang", gameName: "極度", mainClass: "法師(念)", role: "輸出", rank: "成員", intro: "" },
    { lineName: "Ryan", gameName: "水鏡是條狗", mainClass: "", role: "待定", rank: "成員", intro: "" },
    { lineName: "兩廣寬", gameName: "新竹房仲兩廣", mainClass: "賢者", role: "輔助", rank: "成員", intro: "" },
    { lineName: "富邦-Shawn(小逸)", gameName: "HsuBoBo", mainClass: "刺客(敏爆)", role: "輸出", rank: "成員", intro: "" },
    { lineName: "成成", gameName: "該獵戶已夜梟", mainClass: "獵人(鳥)", role: "待定", rank: "成員", intro: "" },
    { lineName: "魏駿翔", gameName: "歐洲獨角獸", mainClass: "流氓(輸出)", role: "待定", rank: "成員", intro: "" },
    { lineName: "Louie", gameName: "水蜜桃王", mainClass: "獵人(鳥)", role: "輸出", rank: "成員", intro: "櫻花表弟" },
    { lineName: "Keith-匠屋空間工作室", gameName: "潘朵拉企鵝", mainClass: "流氓(脫裝)", role: "輸出", rank: "成員", intro: "待領養孤兒, 我喜歡大叔" },
    { lineName: "明", gameName: "白非羽", mainClass: "槍手", role: "輔助", rank: "成員", intro: "待領養孤兒" },
    { lineName: "中古車採購 威霖", gameName: "Weilin", mainClass: "", role: "待定", rank: "成員", intro: "" },
    { lineName: "江", gameName: "蝸牛丶", mainClass: "獵人(鳥)", role: "輸出", rank: "成員", intro: "" },
    { lineName: "ZhenYun", gameName: "三十九度八", mainClass: "神官(讚美)", role: "輔助", rank: "成員", intro: "待領養孤兒" },
    { lineName: "小寶", gameName: "提摩丶", mainClass: "獵人(鳥)", role: "輸出", rank: "成員", intro: "待領養孤兒" },
    { lineName: "張誌恒", gameName: "珮可", mainClass: "神官(讚美)", role: "輔助", rank: "成員", intro: "待領養孤兒" },
    { lineName: "哈啾", gameName: "哈啾", mainClass: "", role: "待定", rank: "成員", intro: "哈啾本哈" },
    { lineName: "丫鵬", gameName: "長歌恨", mainClass: "獵人(鳥)", role: "待定", rank: "成員", intro: "" },
    { lineName: "Agera", gameName: "嘎拉", mainClass: "騎士(敏爆)", role: "待定", rank: "成員", intro: "待領養孤兒" },
    { lineName: "許竣凱", gameName: "老婆幫我儲一單", mainClass: "十字軍(坦)", role: "坦", rank: "成員", intro: "" },
    { lineName: "Wei", gameName: "冬天君", mainClass: "獵人(鳥)", role: "坦", rank: "成員", intro: "待領養孤兒" },
    { lineName: "Randy", gameName: "啤酒香煙法力無邊", mainClass: "十字軍(坦)", role: "坦", rank: "成員", intro: "" },
    { lineName: "隆", gameName: "批星戴月", mainClass: "刺客(毒)", role: "輸出", rank: "成員", intro: "大白鯊的朋友" },
    { lineName: "汪", gameName: "139", mainClass: "槍手", role: "輸出", rank: "成員", intro: "" },
    { lineName: "Jimmy Chou", gameName: "靈刀灰休", mainClass: "", role: "待定", rank: "成員", intro: "" },
    { lineName: "gary", gameName: "陳冠希", mainClass: "獵人(鳥)", role: "輸出", rank: "成員", intro: "大白鯊的朋友" },
    { lineName: "Eric", gameName: "南門小皮", mainClass: "刺客(敏爆)", role: "輸出", rank: "成員", intro: "" },
    { lineName: "", gameName: "Lucia", mainClass: "刺客(敏爆)", role: "輸出", rank: "成員", intro: "" },
    { lineName: "恩蓉MoMo", gameName: "冷炩兒", mainClass: "", role: "待定", rank: "成員", intro: "" },
    { lineName: "GcJie", gameName: "貓窩下的星空", mainClass: "槍手", role: "輸出", rank: "成員", intro: "待領養孤兒" },
    { lineName: "Sean Liou", gameName: "青川", mainClass: "獵人(鳥)", role: "輸出", rank: "成員", intro: "" },
    { lineName: "🐰", gameName: "初蕾丶", mainClass: "神官(讚美)", role: "輔助", rank: "成員", intro: "" },
    { lineName: "阿賢", gameName: "碧空炎冰", mainClass: "槍手", role: "輸出", rank: "成員", intro: "" },
    { lineName: "仲軒", gameName: "熊熊很大", mainClass: "法師(隕)", role: "輸出", rank: "成員", intro: "" },
    { lineName: "航", gameName: "小波", mainClass: "獵人(鳥)", role: "輸出", rank: "成員", intro: "" },
    { lineName: "Pogin", gameName: "Pogin", mainClass: "詩人", role: "輔助", rank: "成員", intro: "待領養孤兒, 哈啾老公" },
    { lineName: "咩假屁謀", gameName: "", mainClass: "", role: "待定", rank: "成員", intro: "" },
    { lineName: "廖琮昱", gameName: "果仔", mainClass: "賢者", role: "待定", rank: "成員", intro: "待領養孤兒" },
    { lineName: "鍾豐年", gameName: "daliesi", mainClass: "刺客(毒)", role: "輔助", rank: "成員", intro: "" },
    { lineName: "蔡家昕", gameName: "星夜", mainClass: "刺客(毒)", role: "輸出", rank: "成員", intro: "睡神無敵小弟" },
    { lineName: "NICK", gameName: "狗是水鏡", mainClass: "流氓(輸出)", role: "輸出", rank: "成員", intro: "" }
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
            if (typeof __firebase_config !== 'undefined' && __firebase_config) {
                try { config = JSON.parse(__firebase_config); } catch(e) { console.error("Config Error:", e); }
            }
            if (!config) { 
                const stored = localStorage.getItem('row_firebase_config'); 
                if (stored) {
                    try { config = JSON.parse(stored); } catch(e) { localStorage.removeItem('row_firebase_config'); }
                }
            }
            
            if (config) { this.initFirebase(config); } else { this.initDemoMode(); }
        } else { 
            this.initDemoMode(); 
        }
        this.setupListeners();
        this.updateAdminUI();
        this.switchTab('home'); 
    },
    
    // =======================================================
    // ** 【關鍵優化】sortMembers 函式 **
    // 強制使用毫秒精確度排序，確保 #01, #02... 順序絕對正確
    // =======================================================
    sortMembers: function(membersArray) {
        return membersArray.sort((a, b) => {
            const getTime = (m) => {
                if (m.createdAt === null) return Date.now(); 
                
                // 處理 Firebase Timestamp 物件 (seconds + nanoseconds)
                if (typeof m.createdAt === 'object') {
                    // 如果有 toMillis 函式就用，否則手動計算毫秒
                    if (typeof m.createdAt.toMillis === 'function') return m.createdAt.toMillis();
                    if (m.createdAt.seconds !== undefined) {
                        return m.createdAt.seconds * 1000 + (m.createdAt.nanoseconds || 0) / 1000000;
                    }
                }
                
                // 處理純數字或 Date 字串
                return new Date(m.createdAt).getTime() || 0; 
            };

            const timeA = getTime(a);
            const timeB = getTime(b);
            
            // 升序排列 (最舊的排第一，最新的排最後)
            if (timeA !== timeB) return timeA - timeB;
            
            // 萬一時間完全相同，用名稱備案
            return (a.gameName || '').localeCompare(b.gameName || '');
        });
    },
    // =======================================================

    initFirebase: async function(config) {
        try {
            if (!firebase.apps.length) firebase.initializeApp(config);
            this.auth = firebase.auth(); this.db = firebase.firestore(); this.mode = 'firebase';
            
            try {
                if (typeof __initial_auth_token !== 'undefined' && __initial_auth_token) {
                    await this.auth.signInWithCustomToken(__initial_auth_token);
                } else {
                    await this.auth.signInAnonymously();
                }
            } catch(authErr) { console.error("Auth failed:", authErr); }

            const appId = typeof __app_id !== 'undefined' ? __app_id : 'row-guild-app';
            const publicData = this.db.collection('artifacts').doc(appId).collection('public').doc('data');
            
            publicData.collection(this.collectionMembers).onSnapshot(snap => { 
                const arr = []; snap.forEach(d => arr.push({ id: d.id, ...d.data() })); 
                this.members = this.sortMembers(arr); 
                if (snap.size === 0) this.seedFirebaseMembers(); else { this.render(); } 
            }, err => console.error("Firestore Members Error:", err));

            publicData.collection(this.collectionGroups).onSnapshot(snap => { 
                const arr = []; snap.forEach(d => arr.push({ id: d.id, ...d.data() })); 
                this.groups = arr; 
                this.render(); 
            }, err => console.error("Firestore Groups Error:", err));

        } catch (e) { 
            console.error("Firebase Init Failed", e); 
            this.initDemoMode(); 
        }
    },

    initDemoMode: function() {
        this.mode = 'demo';
        try {
            const storedMem = localStorage.getItem('row_local_members'); 
            const storedGrp = localStorage.getItem('row_local_groups');
            const currentVer = localStorage.getItem('row_data_ver');
            const APP_VER = '27.0'; 

            if (currentVer !== APP_VER) {
                this.members = JSON.parse(JSON.stringify(SEED_DATA));
                this.members = this.members.map((m, i) => ({...m, createdAt: Date.now() + i * 1000}));
                
                if (storedGrp) { try { this.groups = JSON.parse(storedGrp); } catch(e) { this.groups = []; } } 
                else { this.groups = JSON.parse(JSON.stringify(SEED_GROUPS)); }
                
                localStorage.setItem('row_data_ver', APP_VER);
                this.saveLocal();
            } else {
                if (storedMem) { try { this.members = JSON.parse(storedMem); } catch(e) { this.members = JSON.parse(JSON.stringify(SEED_DATA)); } }
                else { this.members = JSON.parse(JSON.stringify(SEED_DATA)); }
                
                if (storedGrp) { try { this.groups = JSON.parse(storedGrp); } catch(e) { this.groups = JSON.parse(JSON.stringify(SEED_GROUPS)); } }
                else { this.groups = JSON.parse(JSON.stringify(SEED_GROUPS)); }
            }
        } catch(e) {
            console.error("Demo init error", e);
            this.members = JSON.parse(JSON.stringify(SEED_DATA));
            this.groups = [];
        }
        this.members = this.sortMembers(this.members); 
        this.render();
    },

    // =======================================================
    // ** 【修復項目】App.seedFirebaseMembers 函式 **
    // 確保初始化寫入時間間隔為 1000ms (1秒)，防止排序混亂
    // =======================================================
    seedFirebaseMembers: async function() {
        const appId = typeof __app_id !== 'undefined' ? __app_id : 'row-guild-app';
        const batch = this.db.batch();
        const now = Date.now(); 
        
        SEED_DATA.forEach((item, index) => { 
            const ref = this.db.collection('artifacts').doc(appId).collection('public').doc('data').collection(this.collectionMembers).doc(); 
            const { id, ...data } = item;
            
            // ** 關鍵：間隔 1000ms **
            data.createdAt = new Date(now + index * 1000); 
            
            batch.set(ref, data); 
        });
        
        await batch.commit();
        console.log("Seed data written with random IDs and 1s sequential timestamps.");
    },
    // =======================================================

    saveLocal: function() {
        if (this.mode === 'demo') { 
            localStorage.setItem('row_local_members', JSON.stringify(this.members)); 
            localStorage.setItem('row_local_groups', JSON.stringify(this.groups)); 
            localStorage.setItem('row_mod_history', JSON.stringify(this.history)); 
            this.render(); 
        }
    },
    
    // ... (loadHistory, logChange, showHistoryModal, openLoginModal, handleLogin, updateAdminUI, switchTab, handleMainAction 保持不變，省略以節省篇幅，但請確保完整貼上之前的版本) ...
    loadHistory: function() {
        if (this.mode === 'demo') {
            const storedHistory = localStorage.getItem('row_mod_history');
            if (storedHistory) { try { this.history = JSON.parse(storedHistory); } catch(e) { this.history = []; } }
        }
    },
    logChange: function(action, details, targetId) {
        const log = { timestamp: Date.now(), user: this.userRole, action: action, details: details, targetId: targetId || 'N/A' };
        this.history.unshift(log); 
        if (this.mode === 'demo') { localStorage.setItem('row_mod_history', JSON.stringify(this.history)); }
    },
    showHistoryModal: function() {
        if (!['master', 'admin'].includes(this.userRole)) { alert("權限不足"); return; }
        this.loadHistory(); 
        const list = document.getElementById('historyList');
        list.innerHTML = this.history.map(log => {
            const date = new Date(log.timestamp).toLocaleString('zh-TW', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' });
            const color = log.action.includes('DELETE') || log.action.includes('解散') ? 'text-red-600' : 'text-blue-600';
            return `<div class="p-3 bg-slate-50 border border-slate-200 rounded-lg"><div class="flex justify-between items-center text-xs text-slate-500 font-mono mb-1"><span>${date}</span><span class="${color} font-bold">${log.action}</span></div><p class="text-sm text-slate-800">${log.details}</p><span class="text-[10px] text-slate-400">by ${log.user} (ID: ${log.targetId})</span></div>`;
        }).join('') || '<p class="text-center text-slate-400 mt-4">尚無修改紀錄。</p>';
        this.showModal('historyModal');
    },
    openLoginModal: function() {
        if(this.userRole !== 'guest') { 
            if(confirm("確定要登出嗎？")) { this.userRole = 'guest'; localStorage.removeItem('row_user_role'); this.updateAdminUI(); } 
        } else { document.getElementById('loginForm').reset(); this.showModal('loginModal'); }
    },
    handleLogin: function() {
        const u = document.getElementById('loginUser').value; const p = document.getElementById('loginPass').value;
        if(p !== '123456') { alert("密碼錯誤"); return; }
        if(u === 'poppy') this.userRole = 'master'; else if (u === 'yuan') this.userRole = 'admin'; else if (u === 'commander') this.userRole = 'commander'; else { alert("帳號錯誤"); return; }
        localStorage.setItem('row_user_role', this.userRole);
        this.closeModal('loginModal'); this.updateAdminUI(); alert("登入成功！");
    },
    updateAdminUI: function() {
        const btn = document.getElementById('adminToggleBtn'); const adminControls = document.getElementById('adminControls');
        if(this.userRole !== 'guest') { btn.classList.add('admin-mode-on', 'text-blue-600'); btn.innerHTML = '<i class="fas fa-sign-out-alt"></i>'; } 
        else { btn.classList.remove('admin-mode-on', 'text-blue-600'); btn.innerHTML = '<i class="fas fa-user-shield"></i>'; }
        if (['master', 'admin'].includes(this.userRole)) adminControls.classList.remove('hidden'); else adminControls.classList.add('hidden');
        this.render();
    },
    switchTab: function(tab) {
        this.currentTab = tab;
        document.getElementById('view-home').classList.toggle('hidden', tab !== 'home');
        document.getElementById('view-members').classList.toggle('hidden', tab !== 'members');
        document.getElementById('view-groups').classList.toggle('hidden', tab !== 'gvg' && tab !== 'groups');
        document.getElementById('nav-container').classList.toggle('hidden', tab === 'home');
        document.querySelectorAll('.nav-pill').forEach(b => b.classList.remove('active'));
        document.getElementById('tab-' + tab)?.classList.add('active');
        if(tab === 'gvg') { document.getElementById('groupViewTitle').innerText = 'GVG 攻城戰分組'; document.getElementById('squadModalTitle').innerText = 'GVG 分組管理'; } 
        else if(tab === 'groups') { document.getElementById('groupViewTitle').innerText = '固定團列表'; document.getElementById('squadModalTitle').innerText = '固定團管理'; }
        this.render();
    },
    handleMainAction: function() { 
        if(this.currentTab === 'members') this.openAddModal(); 
        else if(this.currentTab === 'gvg' || this.currentTab === 'groups') {
            if(['master', 'admin', 'commander'].includes(this.userRole)) this.openSquadModal(); else alert("權限不足");
        }
    },

    saveMemberData: async function() {
        const id = document.getElementById('editId').value;
        const gameName = document.getElementById('gameName').value.trim();
        const lineName = document.getElementById('lineName').value.trim();
        if (!gameName || !lineName) { alert("請輸入完整資料"); return; }

        let mainClass = "";
        const input = document.getElementById('subJobInput');
        const select = document.getElementById('subJobSelect');
        if (!input.classList.contains('hidden')) mainClass = input.value; else mainClass = select.value;
        if (!mainClass) mainClass = "待定";
        
        const member = { 
            lineName: lineName, gameName: gameName, mainClass: mainClass, 
            role: document.getElementById('role').value, rank: document.getElementById('rank').value, intro: document.getElementById('intro').value 
        };
        
        try {
            if (id) { await this.updateMember(id, member); } 
            else { await this.addMember(member); }
            this.closeModal('editModal');
        } catch(e) { console.error(e); alert("儲存失敗"); }
    },

    // =======================================================
    // ** 【修復項目】App.addMember 函式 **
    // 新增成員時，自動加上伺服器時間戳記 (serverTimestamp)
    // =======================================================
    addMember: async function(member) {
        if (this.mode === 'firebase') { 
            const appId = typeof __app_id !== 'undefined' ? __app_id : 'row-guild-app'; 
            // 加上 createdAt 時間戳記
            const newDoc = {
                ...member,
                createdAt: firebase.firestore.FieldValue.serverTimestamp() 
            };
            await this.db.collection('artifacts').doc(appId).collection('public').doc('data').collection(this.collectionMembers).add(newDoc); 
        } 
        else { 
            member.id = 'm_' + Date.now(); 
            member.createdAt = Date.now(); // Demo 模式時間
            this.members.push(member); 
            this.members = this.sortMembers(this.members); 
            this.saveLocal(); 
        }
    },

    updateMember: async function(id, member) {
        if (this.mode === 'firebase') { 
            const appId = typeof __app_id !== 'undefined' ? __app_id : 'row-guild-app'; 
            const docRef = this.db.collection('artifacts').doc(appId).collection('public').doc('data').collection(this.collectionMembers).doc(id);
            try { await docRef.update(member); } 
            catch (error) {
                if (error.code === 'not-found' || error.message.includes('No document')) {
                     // 如果找不到文件，改為 set，並補上時間戳記
                     await docRef.set({ ...member, createdAt: firebase.firestore.FieldValue.serverTimestamp() }); 
                } else { throw error; }
            }
        } 
        else { 
            const idx = this.members.findIndex(d => d.id === id); 
            if (idx !== -1) { this.members[idx] = { ...this.members[idx], ...member }; this.saveLocal(); } 
        }
    },

    deleteMember: async function(id) {
        if (!confirm("確定要刪除這位成員嗎？")) return;
        try {
            if (this.mode === 'firebase') { 
                const appId = typeof __app_id !== 'undefined' ? __app_id : 'row-guild-app'; 
                const docRef = this.db.collection('artifacts').doc(appId).collection('public').doc('data');
                const batch = this.db.batch();
                batch.delete(docRef.collection(this.collectionMembers).doc(id)); 
                const groupsSnap = await docRef.collection(this.collectionGroups).get(); 
                groupsSnap.forEach(groupDoc => {
                    const groupData = groupDoc.data();
                    const filtered = (groupData.members || []).filter(m => (typeof m === 'string' ? m : m.id) !== id);
                    if (filtered.length !== (groupData.members || []).length) batch.update(groupDoc.ref, { members: filtered });
                });
                await batch.commit();
            } else { 
                this.members = this.members.filter(d => d.id !== id); 
                this.groups.forEach(g => { g.members = g.members.filter(mid => (typeof mid === 'string' ? mid : mid.id) !== id); }); 
                this.saveLocal(); 
            }
            this.closeModal('editModal');
        } catch(e) { console.error(e); alert("刪除失敗"); }
    },

    // ... (saveSquad, deleteSquad, toggleMemberStatus, render 保持不變，請確保包含) ...
    saveSquad: async function() {
        if (!['master', 'admin', 'commander'].includes(this.userRole)) { alert("權限不足"); return; }
        const id = document.getElementById('squadId').value;
        const name = document.getElementById('squadName').value;
        const note = document.getElementById('squadNote').value;
        if(!name) { alert("請輸入隊伍名稱"); return; }
        const squadData = { name, note, members: [...this.currentSquadMembers], type: this.currentTab === 'gvg' ? 'gvg' : 'misc' };
        
        try {
            if (this.mode === 'firebase') { 
                const appId = typeof __app_id !== 'undefined' ? __app_id : 'row-guild-app'; 
                const ref = this.db.collection('artifacts').doc(appId).collection('public').doc('data').collection(this.collectionGroups);
                if(id) await ref.doc(id).update(squadData); else await ref.add(squadData);
            } else { 
                if(id) { const idx = this.groups.findIndex(g=>g.id===id); if(idx!==-1) this.groups[idx] = {...this.groups[idx], ...squadData}; }
                else { squadData.id = 'g_'+Date.now(); this.groups.push(squadData); }
                this.saveLocal();
            }
            this.closeModal('squadModal');
        } catch(e) { console.error(e); alert("儲存失敗"); }
    },
    deleteSquad: async function(id) {
        if (!['master', 'admin', 'commander'].includes(this.userRole)) { alert("權限不足"); return; }
        if (!confirm("確定要解散嗎？")) return;
        try {
            if (this.mode === 'firebase') {
                const appId = typeof __app_id !== 'undefined' ? __app_id : 'row-guild-app';
                await this.db.collection('artifacts').doc(appId).collection('public').doc('data').collection(this.collectionGroups).doc(id).delete();
            } else { this.groups = this.groups.filter(g => g.id !== id); this.saveLocal(); }
            this.closeModal('squadModal');
        } catch(e) { console.error(e); }
    },
    toggleMemberStatus: function(groupId, memberId) {
        const group = this.groups.find(g => g.id === groupId); if(!group) return;
        const idx = group.members.findIndex(m => (typeof m === 'string' ? m : m.id) === memberId); if (idx === -1) return;
        let mem = group.members[idx];
        if (typeof mem === 'string') mem = { id: mem, status: 'confirmed' }; else mem.status = mem.status === 'confirmed' ? 'pending' : 'confirmed';
        group.members[idx] = mem;
        if (this.mode === 'firebase') {
            const appId = typeof __app_id !== 'undefined' ? __app_id : 'row-guild-app';
            this.db.collection('artifacts').doc(appId).collection('public').doc('data').collection(this.collectionGroups).doc(groupId).update({members: group.members});
        } else { this.saveLocal(); }
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

    // =======================================================
    // ** 【最終修復】App.createCardHTML 函式 **
    // 依據「排序後的順序」自動產生序號 (#01, #02...)
    // 這樣刪除中間的人，後面的人會自動遞補號碼
    // =======================================================
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
        
        // --- 動態序號邏輯：使用列表 index + 1 ---
        // 解決「取消星星符」並「依照新增順序排列」且「刪除後自動遞補」的需求
        const displayNo = `#${(idx + 1).toString().padStart(2, '0')}`;
        // -------------------------

        const getRoleBadge = (r) => {
            if (r.includes('輸出')) return `<span class="tag tag-dps">${r}</span>`;
            else if (r.includes('坦')) return `<span class="tag tag-tank">${r}</span>`;
            else if (r.includes('輔助')) return `<span class="tag tag-sup">${r}</span>`;
            return ''; 
        }

        return `
            <div class="card cursor-pointer group relative" onclick="app.openEditModal('${item.id}')">
                <div class="member-no text-xs font-cute font-bold">${displayNo}</div>
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

    copyText: function(el, text) { navigator.clipboard.writeText(text).then(() => { el.classList.add('copied'); setTimeout(() => el.classList.remove('copied'), 1500); }); },
    copySquadList: function(groupId) {
        const group = this.groups.find(g => g.id === (groupId || document.getElementById('squadId').value)); if(!group) return;
        const names = (group.members||[]).map(m => { const id = typeof m === 'string' ? m : m.id; const mem = this.members.find(x => x.id === id); return mem ? mem.gameName : 'Unknown'; });
        navigator.clipboard.writeText(`【${group.name}】 ${names.join(', ')}`).then(() => alert("已複製！"));
    },
    
    openAddModal: function() { 
        document.getElementById('memberForm').reset(); document.getElementById('editId').value = ''; document.getElementById('deleteBtnContainer').innerHTML = ''; 
        document.getElementById('baseJobSelect').value = ""; this.updateBaseJobSelect(); this.updateSubJobSelect(); 
        document.getElementById('subJobSelectWrapper').classList.remove('hidden'); document.getElementById('subJobInput').classList.add('hidden');
        
        // ** 新增時鎖定職位 **
        const rankSelect = document.getElementById('rank'); const lockIcon = document.getElementById('rankLockIcon');
        rankSelect.value = '成員';
        if(this.userRole === 'master') { rankSelect.disabled = false; rankSelect.classList.remove('locked-field'); lockIcon.className = "fas fa-unlock text-blue-500 text-xs ml-2"; } 
        else { rankSelect.disabled = true; rankSelect.classList.add('locked-field'); lockIcon.className = "fas fa-lock text-slate-300 text-xs ml-2"; }

        app.showModal('editModal'); 
    },
    openEditModal: function(id) {
        if (!id) return; const item = this.members.find(d => d.id === id); if (!item) return;
        document.getElementById('editId').value = item.id;
        document.getElementById('lineName').value = item.lineName; document.getElementById('gameName').value = item.gameName;
        document.getElementById('role').value = item.role.split(/[ ,]/)[0]||'待定'; document.getElementById('rank').value = item.rank || '成員'; document.getElementById('intro').value = item.intro;
        
        const baseSelect = document.getElementById('baseJobSelect'); const subInput = document.getElementById('subJobInput');
        this.updateBaseJobSelect();
        const match = item.mainClass.match(/^([^(]+)\(([^)]+)\)$/);
        const canEdit = ['master', 'admin'].includes(this.userRole);
        document.getElementById('toggleJobBtn').classList.toggle('hidden', !canEdit);

        if (match && JOB_STRUCTURE[match[1]]) {
            baseSelect.value = match[1]; this.updateSubJobSelect(); document.getElementById('subJobSelect').value = item.mainClass;
            subInput.classList.add('hidden'); document.getElementById('subJobSelectWrapper').classList.remove('hidden');
        } else {
            if (canEdit) { 
                baseSelect.value = ""; this.updateSubJobSelect(); subInput.value = item.mainClass; 
                subInput.classList.remove('hidden'); document.getElementById('subJobSelectWrapper').classList.add('hidden'); 
            } else { baseSelect.value = ""; this.updateSubJobSelect(); }
        }
        
        const rankSelect = document.getElementById('rank'); const lockIcon = document.getElementById('rankLockIcon');
        if(this.userRole === 'master') { rankSelect.disabled = false; rankSelect.classList.remove('locked-field'); lockIcon.className = "fas fa-unlock text-blue-500 text-xs ml-2"; } 
        else { rankSelect.disabled = true; rankSelect.classList.add('locked-field'); lockIcon.className = "fas fa-lock text-slate-300 text-xs ml-2"; }
        
        if (['master', 'admin'].includes(this.userRole)) document.getElementById('deleteBtnContainer').innerHTML = `<button type="button" onclick="app.deleteMember('${item.id}')" class="text-red-500 text-sm hover:underline">刪除成員</button>`;
        else document.getElementById('deleteBtnContainer').innerHTML = '';
        app.showModal('editModal');
    },
    updateBaseJobSelect: function() {
         const base = document.getElementById('baseJobSelect'); base.innerHTML = '<option value="" disabled selected>選擇職業</option>';
         Object.keys(JOB_STRUCTURE).forEach(job => { const opt = document.createElement('option'); opt.value = job; opt.innerText = job; base.appendChild(opt); });
    },
    updateSubJobSelect: function() {
        const base = document.getElementById('baseJobSelect').value; const sub = document.getElementById('subJobSelect');
        sub.innerHTML = '<option value="" disabled selected>選擇流派</option>';
        if (JOB_STRUCTURE[base]) { sub.disabled = false; JOB_STRUCTURE[base].forEach(s => { const opt = document.createElement('option'); opt.value = `${base}(${s})`; opt.innerText = s; sub.appendChild(opt); }); } 
        else { sub.disabled = true; }
    },
    toggleJobInputMode: function() {
        const i = document.getElementById('subJobInput'); const w = document.getElementById('subJobSelectWrapper');
        i.classList.toggle('hidden'); w.classList.toggle('hidden');
    },
    openSquadModal: function(id) {
        if(!['master', 'admin', 'commander'].includes(this.userRole)) return;
        document.getElementById('squadId').value = id || ''; document.getElementById('memberSearch').value = '';
        if(id) {
            const g = this.groups.find(g => g.id === id); document.getElementById('squadName').value = g.name; document.getElementById('squadNote').value = g.note;
            document.getElementById('deleteSquadBtnContainer').innerHTML = `<button type="button" onclick="app.deleteSquad('${id}')" class="text-red-500 text-sm hover:underline">解散</button>`;
            this.currentSquadMembers = JSON.parse(JSON.stringify(g.members));
        } else {
            document.getElementById('squadName').value = ''; document.getElementById('squadNote').value = '';
            document.getElementById('deleteSquadBtnContainer').innerHTML = '';
            this.currentSquadMembers = [];
        }
        this.renderSquadMemberSelect(); app.showModal('squadModal');
    },
    toggleSquadMember: function(id) {
        const idx = this.currentSquadMembers.findIndex(m => (typeof m === 'string' ? m : m.id) === id);
        if (idx > -1) this.currentSquadMembers.splice(idx, 1); 
        else if (this.currentSquadMembers.length < 5) this.currentSquadMembers.push({ id: id, status: 'pending' });
        this.renderSquadMemberSelect();
    },
    renderSquadMemberSelect: function() {
        const sid = document.getElementById('squadId').value; const type = this.currentTab === 'gvg' ? 'gvg' : 'misc'; const search = document.getElementById('memberSearch').value.toLowerCase();
        const occupied = this.groups.filter(g => g.id !== sid && (g.type || 'gvg') === type).flatMap(g => g.members).map(m => typeof m === 'string' ? m : m.id);
        const avail = this.members.filter(m => !occupied.includes(m.id)).filter(m => (m.gameName+m.lineName).toLowerCase().includes(search));
        const isSel = (mid) => this.currentSquadMembers.some(sm => (typeof sm === 'string' ? sm : sm.id) === mid);
        avail.sort((a,b) => isSel(a.id) === isSel(b.id) ? 0 : isSel(a.id) ? -1 : 1);
        const count = this.currentSquadMembers.length;
        document.getElementById('selectedCount').innerText = `${count}/5`; document.getElementById('selectedCount').className = count>=5?"text-red-500 font-bold":"text-blue-500 font-bold";
        document.getElementById('squadMemberSelect').innerHTML = avail.map(m => {
            const checked = isSel(m.id); const style = JOB_STYLES.find(s => s.key.some(k => m.mainClass.includes(k))) || { class: 'bg-job-default', icon: 'fa-user' };
            return `<label class="flex items-center space-x-2 p-2 rounded border border-blue-100 transition select-none ${!checked&&count>=5?'opacity-50 bg-slate-50':'hover:bg-blue-50 bg-white cursor-pointer'}"><input type="checkbox" value="${m.id}" class="rounded text-blue-500 focus:ring-blue-400" ${checked?'checked':''} ${!checked&&count>=5?'disabled':''} onchange="app.toggleSquadMember('${m.id}')"><div class="w-6 h-6 rounded-full flex items-center justify-center text-xs ${style.class.replace('bg-', 'text-')} bg-opacity-20"><i class="fas ${style.icon}"></i></div><div class="min-w-0 flex-grow"><div class="text-xs font-bold text-slate-700 truncate">${m.gameName} <span class="text-slate-500 font-normal text-[10px]">${m.mainClass}</span></div></div><span class="text-xs ${m.role.includes('輸出')?'text-red-500':m.role.includes('輔助')?'text-green-500':'text-blue-500'}">${m.role.substring(0, 1)}</span></label>`;
        }).join('');
    },
    showModal: function(id) { document.getElementById(id).classList.remove('hidden'); },
    closeModal: function(id) { document.getElementById(id).classList.add('hidden'); },
    setupListeners: function() {},
    setFilter: function(f) { this.currentFilter = f; this.renderMembers(); },
    setJobFilter: function(j) { this.currentJobFilter = j; this.renderMembers(); },
    exportCSV: function() {
        let csv = "\uFEFFLINE 暱稱,遊戲 ID,主職業,定位,公會職位,備註\n";
        this.members.forEach(m => csv += `"${m.lineName}","${m.gameName}","${m.mainClass}","${m.role}","${m.rank||'成員'}","${m.intro}"\n`);
        const link = document.createElement("a"); link.href = encodeURI("data:text/csv;charset=utf-8," + csv); link.download = "ROW成員.csv";
        document.body.appendChild(link); link.click(); document.body.removeChild(link);
    },
    downloadSelf: function() { alert("請使用瀏覽器的「另存新檔」功能備份。"); },
    saveConfig: function() { try { localStorage.setItem('row_firebase_config', JSON.stringify(JSON.parse(document.getElementById('firebaseConfigInput').value))); location.reload(); } catch(e) { alert("JSON 格式錯誤"); } },
    resetToDemo: function() { localStorage.removeItem('row_firebase_config'); localStorage.removeItem('row_local_members'); localStorage.removeItem('row_local_groups'); localStorage.removeItem('row_mod_history'); location.reload(); }
};

window.app = App; window.onload = () => App.init();