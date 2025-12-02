// config.js

// 應用程式的靜態配置、集合名稱和初始資料。

// --- 全域應用程式設定 ---
// 這是您提供的 Firebase 配置，已使用 const 而非 export const
const FIREBASE_CONFIG = {
    apiKey: "AIzaSyCxVEcgftiu7qmHhgLV-XaLzf6naBhaf-k",
    authDomain: "ro123-aae1e.firebaseapp.com",
    projectId: "ro123-aae1e",
    storageBucket: "ro123-aae1e.firebasestorage.app",
    messagingSenderId: "401692984816",
    appId: "1:401692984816:web:711dacb2277b52fb7d0935",
    measurementId: "G-SVYZGQZB83"
};

const APP_ENV = 'production';

// --- Firebase / Firestore Configuration ---
const COLLECTION_NAMES = {
    MEMBERS: 'members',
    GROUPS: 'groups',
    ACTIVITIES: 'activities', 
};

// --- Job / Role Configuration ---
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

// --- Seed Data (初始資料) ---
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
    { id: "m70", lineName: "廖琮昱", gameName: "果仔", mainClass: "賢者", role: "待定", rank: "成員", intro: "" },
    { id: "m71", lineName: "鍾豐年", gameName: "daliesi", mainClass: "刺客(毒)", role: "輔助", rank: "成員", intro: "" },
    { id: "m72", lineName: "蔡家昕", gameName: "星夜", mainClass: "刺客(毒)", role: "輸出", rank: "成員", intro: "睡神無敵小弟" },
    { id: "m73", lineName: "NICK", gameName: "狗是水鏡", mainClass: "流氓(輸出)", role: "輸出", rank: "成員", intro: "" }
];

const SEED_GROUPS = [];

const SEED_ACTIVITIES = [
    {
        id: "a01",
        name: "聖誕節造型大賽",
        note: "評選最佳聖誕裝扮的成員，可獲得隨機稀有卡片一張。",
        winners: [
            { memberId: "m01", claimed: true, claimedBy: "poppy🐶", claimedAt: Date.now() - 86400000 * 3 },
            { memberId: "m20", claimed: false, claimedBy: null, claimedAt: null }
        ]
    },
    {
        id: "a02",
        name: "GVG 傷害王競賽",
        note: "輸出榜第一名的獎勵：現金 1,000,000 Zeny。",
        winners: [
            { memberId: "m32", claimed: true, claimedBy: "poppy🐶", claimedAt: Date.now() }
        ]
    }
];

const APP_VERSION = '7.0';

// 將所有配置變數掛載到全域物件 (window.AppConfig)，供 app.js 存取
window.AppConfig = {
    FIREBASE_CONFIG,
    APP_ENV,
    COLLECTION_NAMES,
    JOB_STYLES,
    JOB_STRUCTURE,
    SEED_DATA,
    SEED_GROUPS,
    SEED_ACTIVITIES,
    APP_VERSION
};