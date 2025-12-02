
<html lang="zh-TW">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
    <title>RO:W 公會名冊 | 躺著不想動</title>
    
    <meta name="apple-mobile-web-app-capable" content="yes">
    <meta name="mobile-web-app-capable" content="yes">
    <meta name="theme-color" content="#A3D8F4">

    <link href="https://fonts.googleapis.com/css2?family=ZCOOL+KuaiLe&family=Varela+Round&display=swap" rel="stylesheet">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">

    <script src="https://unpkg.com/vue@3/dist/vue.global.js"></script>
    <script src="https://cdn.tailwindcss.com"></script>

    <script src="https://www.gstatic.com/firebasejs/11.6.1/firebase-app-compat.js"></script>
    <script src="https://www.gstatic.com/firebasejs/11.6.1/firebase-auth-compat.js"></script>
    <script src="https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore-compat.js"></script>
    
    <script>
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
    </script>
    <style>
        /* RO World Style Background */
        body { 
            background-color: #A3D8F4; 
            background: linear-gradient(180deg, #87CEFA 0%, #E0F7FA 100%);
            color: #334155; 
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; 
            -webkit-tap-highlight-color: transparent; 
            overflow-x: hidden;
        }
        
        /* Animated Clouds Background */
        .bg-clouds {
            position: fixed; top: 0; left: 0; width: 100%; height: 100%; pointer-events: none; z-index: -1;
            background-image: url("data:image/svg+xml,%3Csvg width='100' height='100' viewBox='0 0 100 100' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M20,60 Q30,50 40,60 T60,60 T80,60' fill='none' stroke='white' stroke-width='2' opacity='0.4'/%3E%3C/svg%3E");
            background-size: 200px 200px;
            animation: cloudMove 60s linear infinite;
        }

        input, select, textarea { font-size: 16px !important; }

        /* --- 職業配色 --- */
        .bg-job-knight { background-color: #ff9999; color: #7f1d1d; }
        .bg-job-crusader { background-color: #ff6666; color: #450a0a; }
        .bg-job-blacksmith { background-color: #ffcc99; color: #7c2d12; }
        .bg-job-hunter { background-color: #ffff99; color: #713f12; }
        .bg-job-bard { background-color: #ffcc00; color: #713f12; }
        .bg-job-alchemist { background-color: #ff9933; color: #431407; }
        .bg-job-priest { background-color: #ccffcc; color: #064e3b; }
        .bg-job-monk { background-color: #99cc99; color: #064e3b; }
        .bg-job-wizard { background-color: #ccffff; color: #0c4a6e; }
        .bg-job-sage { background-color: #66ccff; color: #0c4a6e; }
        .bg-job-gunslinger { background-color: #ffccff; color: #831843; }
        .bg-job-dancer { background-color: #ff66cc; color: #500724; }
        .bg-job-assassin { background-color: #e6ccff; color: #581c87; }
        .bg-job-rogue { background-color: #b366ff; color: #3b0764; }
        .bg-job-default { background-color: #cbd5e1; color: #475569; }

        /* UI Elements */
        .card { 
            background: white; border: 1px solid #bfdbfe; border-radius: 12px; overflow: hidden;
            transition: transform 0.1s, box-shadow 0.1s; display: flex; align-items: stretch; height: 95px;
            box-shadow: 0 4px 6px -1px rgba(59, 130, 246, 0.1);
        }
        .card:active { transform: scale(0.96); }
        
        .job-stripe { width: 6px; flex-shrink: 0; }
        .job-icon-area { width: 60px; display: flex; align-items: center; justify-content: center; font-size: 1.8rem; flex-shrink: 0; background-color: #f0f9ff; border-right: 1px solid #e0f2fe; }
        
        .tag { font-size: 0.7rem; padding: 2px 6px; border-radius: 4px; font-weight: bold; margin-left: 4px; }
        .tag-dps { background: #fee2e2; color: #991b1b; }
        .tag-sup { background: #dcfce7; color: #166534; }
        .tag-tank { background: #dbeafe; color: #1e40af; }
        
        .rank-badge { font-size: 0.6rem; padding: 1px 4px; border-radius: 3px; font-weight: bold; text-transform: uppercase; margin-right: 4px; border: 1px solid transparent; }
        .rank-master { background: #fef3c7; color: #b45309; border-color: #fcd34d; }
        .rank-commander { background: #fee2e2; color: #b91c1c; border-color: #fca5a5; }
        .rank-admin { background: #e0e7ff; color: #4338ca; border-color: #a5b4fc; }
        .rank-member { display: none; }

        .member-no { position: absolute; top: 0; right: 0; background-color: #e0f2fe; color: #64748b; font-size: 0.65rem; padding: 2px 6px; border-bottom-left-radius: 8px; font-family: monospace; }
        .modal-overlay { z-index: 100 !important; }
        .scroll-hide::-webkit-scrollbar { display: none; }
        
        .nav-pill { 
            padding: 8px 16px; font-weight: 700; color: #64748b; border-radius: 20px; 
            transition: all 0.2s; white-space: nowrap; font-size: 0.9rem;
            background: rgba(255,255,255,0.5);
        }
        .nav-pill.active { background-color: #3b82f6; color: white; shadow: 0 4px 6px -1px rgba(59, 130, 246, 0.3); }
        
        .copy-tooltip { position: relative; cursor: pointer; }
        .copy-tooltip::after { content: "已複製"; position: absolute; top: -30px; left: 50%; transform: translateX(-50%); background: #334155; color: white; padding: 4px 8px; border-radius: 4px; font-size: 12px; opacity: 0; transition: opacity 0.2s; pointer-events: none; white-space: nowrap; z-index: 10; }
        .copy-tooltip.copied::after { opacity: 1; }

        .admin-mode-on { color: #3b82f6 !important; background-color: #eff6ff; border: 1px solid #bfdbfe !important; }
        .locked-field { opacity: 0.6; cursor: not-allowed; background-color: #f1f5f9; }

        /* --- Game Style Home Page --- */
        .game-container {
            background: rgba(255, 255, 255, 0.6);
            backdrop-filter: blur(10px);
            border-radius: 20px;
            padding: 20px;
            box-shadow: 0 8px 32px rgba(31, 38, 135, 0.15);
            border: 2px solid rgba(255, 255, 255, 0.8);
            position: relative;
            overflow: hidden;
        }

        /* 修正 SVG 標題跑位 (Layout Shift Fix) */
        .aspect-2-1 {
            position: relative;
            width: 100%;
            padding-bottom: 50%; /* 300x150 比例 */
        }
        .aspect-2-1 svg {
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
        }
        .mascot-wrapper { position: relative; width: 280px; height: 200px; margin: 0 auto; z-index: 10; }
        .mascot-container { transform: scale(1.05); } 


        /* Game Menu Buttons */
        .ro-menu-btn {
            position: relative;
            background: linear-gradient(180deg, #FDFBF7 0%, #D4D4D4 100%);
            border: 2px solid #78350F; /* Wood brown border */
            border-radius: 12px;
            box-shadow: 
                inset 0 2px 0 rgba(255,255,255,0.8),
                0 4px 0 #5D2E0E, /* 3D Depth */
                0 6px 10px rgba(0,0,0,0.2);
            height: 80px;
            display: flex;
            align-items: center;
            padding: 0 20px;
            margin-bottom: 16px;
            transition: all 0.1s;
            cursor: pointer;
        }
        .ro-menu-btn:active {
            transform: translateY(4px);
            box-shadow: 0 0 0 #5D2E0E;
        }
        .ro-menu-btn .icon-box {
            width: 48px; height: 48px;
            background: linear-gradient(135deg, #60A5FA 0%, #2563EB 100%);
            border: 2px solid #93C5FD;
            border-radius: 8px;
            display: flex; align-items: center; justify-content: center;
            margin-right: 15px;
            box-shadow: inset 0 0 10px rgba(0,0,0,0.3);
            color: white; font-size: 24px;
        }
        /* Variant colors */
        .btn-gvg .icon-box { background: linear-gradient(135deg, #F87171 0%, #DC2626 100%); border-color: #FECACA; }
        .btn-grp .icon-box { background: linear-gradient(135deg, #4ADE80 0%, #16A34A 100%); border-color: #BBF7D0; }

        .ro-menu-btn h3 { font-size: 1.2rem; font-weight: 900; color: #451a03; text-shadow: 0 1px 0 rgba(255,255,255,0.8); margin: 0; }
        .ro-menu-btn p { font-size: 0.75rem; color: #78350f; margin: 0; font-weight: bold; }
        
        /* Poring Decoration */
        .poring-deco {
            position: absolute;
            bottom: 10px;
            width: 40px; height: 35px;
            background: #FCA5A5;
            border-radius: 50% 50% 45% 45%;
            border: 2px solid #B91C1C;
            animation: poring-jump 1s infinite alternate;
            z-index: 5;
        }
        .poring-deco::before { /* Eyes */
            content: ''; position: absolute; top: 10px; left: 8px; width: 4px; height: 8px; background: #7F1D1D; border-radius: 50%;
            box-shadow: 20px 0 0 #7F1D1D;
        }
        .poring-deco::after { /* Mouth */
            content: ''; position: absolute; top: 22px; left: 16px; width: 8px; height: 4px; 
            border-bottom: 2px solid #7F1D1D; border-radius: 50%;
        }
        
        .drops-deco {
            background: #FDBA74; border-color: #C2410C;
            width: 35px; height: 30px;
            left: 20px;
            animation-delay: 0.5s;
        }
        .poporing-deco {
            background: #86EFAC; border-color: #15803D;
            right: 20px;
            animation-delay: 0.2s;
        }
        
        /* --- GVG 視覺優化新增的樣式 --- */
        .squad-card-gvg {
            background: #fdfcf9; /* 淺米白 */
            border: 3px solid #78350F; /* 木紋棕邊框 */
            border-radius: 10px;
            box-shadow: 0 4px 0 #5D2E0E, 0 8px 15px rgba(0,0,0,0.2); /* 3D 效果 */
            position: relative;
            transition: transform 0.2s;
        }
        .squad-card-gvg:hover {
            transform: translateY(-2px);
            box-shadow: 0 6px 0 #5D2E0E, 0 10px 20px rgba(0,0,0,0.3);
        }

        .squad-card-gvg .header {
            background: linear-gradient(180deg, #FEE2E2 0%, #FCA5A5 100%); /* 戰鬥紅漸變 */
            border-bottom: 2px solid #F87171;
            color: #991B1B; /* 深紅文字 */
        }
        
        /* 職業定位標籤 */
        .role-badge-dps { background: #FCA5A5; color: #991B1B; padding: 2px 6px; border-radius: 4px; font-weight: bold; }
        .role-badge-sup { background: #BBF7D0; color: #065F46; padding: 2px 6px; border-radius: 4px; font-weight: bold; }
        .role-badge-tank { background: #BFDBFE; color: #1E40AF; padding: 2px 6px; border-radius: 4px; font-weight: bold; }
        .role-badge-pending { background: #e5e7eb; color: #4b5563; padding: 2px 6px; border-radius: 4px; font-weight: bold; }

        /* 狀態指示燈 */
        .status-confirmed { color: #34D399; } /* 綠色 */
        .status-pending { color: #F87171; } /* 紅色 */

         /* 確保 Font Awesome 圖示正確顯示 (優化) */
        .fa-cog, .fa-book-open, .fa-crosshairs, .fa-users, .fa-plus, .fa-user-shield {
             font-family: 'Font Awesome 6 Free';
             font-weight: 900; 
        }
    </style>
</head>
<body class="min-h-screen flex flex-col pb-10">

    <div class="bg-clouds"></div>

 <header class="sticky top-0 z-50 w-full shadow-md">
        <nav class="bg-white/90 backdrop-blur border-b border-white/50 px-4 py-3 flex justify-between items-center safe-area-top w-full"> 
            <div class="w-full mx-auto max-w-7xl flex justify-between items-center">
                <div class="flex items-center space-x-3 cursor-pointer" onclick="app.switchTab('home')">
                    <div class="w-9 h-9 bg-gradient-to-br from-blue-400 to-cyan-400 rounded-xl flex items-center justify-center text-white font-bold text-lg shadow-md shadow-blue-200 border border-white font-cute">
                        RO
                    </div>
                    <div>
                        <h1 class="text-lg font-black text-slate-700 leading-tight tracking-tight font-cute">躺著不想動</h1>
                    </div>
                </div>
                <div class="flex items-center space-x-2">
                    <button onclick="app.openLoginModal()" id="adminToggleBtn" class="p-2 text-slate-400 hover:text-blue-500 transition rounded-xl border border-transparent" title="管理登入"><i class="fas fa-user-shield"></i></button>
                    <div id="adminControls" class="flex items-center space-x-2 hidden">
                        <div class="relative group">
                            <button class="p-2 text-slate-500 hover:text-blue-600 transition bg-blue-50 rounded-lg" title="下載/匯出"><i class="fas fa-download"></i></button>
                            <div class="absolute right-0 top-full mt-2 w-48 bg-white border border-slate-200 rounded-lg shadow-xl overflow-hidden hidden group-hover:block z-[60]">
                                <button onclick="app.downloadSelf()" class="w-full text-left px-4 py-3 hover:bg-slate-50 text-sm text-slate-700 flex items-center"><i class="fas fa-file-code mr-2 text-blue-500"></i> 下載本網頁</button>
                                <button onclick="app.exportCSV()" class="w-full text-left px-4 py-3 hover:bg-slate-50 text-sm text-slate-700 flex items-center border-t border-slate-100"><i class="fas fa-file-csv mr-2 text-green-500"></i> 匯出 CSV</button>
                            </div>
                        </div>
                        <button onclick="app.showModal('configModal')" class="p-2 text-slate-400 hover:text-blue-500 transition rounded-xl" title="設定"><i class="fas fa-cog"></i></button>
                    </div>
                    <button onclick="app.handleMainAction()" class="bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-lg shadow-blue-200 px-3 py-2 rounded-xl font-bold transition flex items-center text-sm transform active:scale-95 border-b-4 border-blue-700" title="新增"><i class="fas fa-plus"></i></button>
                </div>
            </div>
        </nav>

        <div class="bg-white/30 backdrop-blur border-b border-white/40 z-40" id="nav-container">
            <div class="mx-auto max-w-7xl px-4 py-2 flex space-x-2 overflow-x-auto scroll-hide w-full"> 
                <button onclick="app.switchTab('home')" id="tab-home" class="nav-pill"><i class="fas fa-home mr-1"></i> 首頁</button>
                <button onclick="app.switchTab('members')" id="tab-members" class="nav-pill"><i class="fas fa-users mr-1"></i> 名冊</button>
                <button onclick="app.switchTab('gvg')" id="tab-gvg" class="nav-pill"><i class="fas fa-shield-alt mr-1"></i> GVG</button>
                <button onclick="app.switchTab('groups')" id="tab-groups" class="nav-pill"><i class="fas fa-campground mr-1"></i> 固定團</button>
            </div>
        </div>
    </header>
    <main class="flex-grow mx-auto p-4 md:p-6 space-y-6 max-w-7xl safe-area-bottom w-full">
        
        <div id="view-home" class="animate-fade-in relative">
            
            <div class="text-center py-2 mb-2">
                <div class="mascot-wrapper flex flex-col items-center justify-center pt-8 md:pt-16">
                    <div class="mascot-container animate-jelly aspect-2-1 w-4/5 max-w-md mx-auto">
                        <svg viewBox="0 0 300 150" class="drop-shadow-2xl">
                            <defs>
                                <linearGradient id="orangeGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                                    <stop offset="0%" stop-color="#FDBA74" />
                                    <stop offset="100%" stop-color="#EA580C" />
                                </linearGradient>
                                <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
                                    <feGaussianBlur stdDeviation="3" result="blur" />
                                    <feComposite in="SourceGraphic" in2="blur" operator="over" />
                                </filter>
                            </defs>
                            <text x="50%" y="60%" text-anchor="middle" dominant-baseline="middle" 
                                  font-family="'ZCOOL KuaiLe', 'Arial Rounded MT Bold', sans-serif" 
                                  font-weight="900" font-size="85" 
                                  stroke="#431407" stroke-width="14" stroke-linejoin="round"
                                  fill="#431407">
                                    躺平
                            </text>
                            <text x="50%" y="60%" text-anchor="middle" dominant-baseline="middle" 
                                  font-family="'ZCOOL KuaiLe', 'Arial Rounded MT Bold', sans-serif" 
                                  font-weight="900" font-size="85" 
                                  fill="url(#orangeGrad)"
                                  stroke="#FFF7ED" stroke-width="4">
                                    躺平
                            </text>
                            <path d="M90,45 Q110,35 130,45" fill="none" stroke="white" stroke-width="5" stroke-linecap="round" opacity="0.6" />
                            <path d="M180,45 Q200,35 220,45" fill="none" stroke="white" stroke-width="5" stroke-linecap="round" opacity="0.6" />
                            
                            <text x="240" y="30" font-size="30" font-weight="bold" fill="#3B82F6" stroke="white" stroke-width="1">
                                <animate attributeName="opacity" values="0;1;0" dur="2s" repeatCount="indefinite"/>
                                <animate attributeName="y" values="30;10" dur="2s" repeatCount="indefinite"/>
                                Z
                            </text>
                        </svg>
                    </div>
                </div>
            </div>

            <div class="game-container max-w-md mx-auto">
                <div class="poring-deco drops-deco"></div>
                <div class="poring-deco poporing-deco"></div>

                <div onclick="app.switchTab('members')" class="ro-menu-btn group">
                    <div class="icon-box"><i class="fas fa-book-open"></i></div>
                    <div class="ro-btn-content">
                        <h3>成員名冊</h3>
                        <p>Guild Members (73)</p>
                    </div>
                </div>

                <div onclick="app.switchTab('gvg')" class="ro-menu-btn btn-gvg group">
                    <div class="icon-box"><i class="fas fa-shield-alt"></i></div>
                    <div class="ro-btn-content">
                        <h3>GVG 分組</h3>
                        <p>War of Emperium</p>
                    </div>
                </div>

                <div onclick="app.switchTab('groups')" class="ro-menu-btn btn-grp group">
                    <div class="icon-box"><i class="fas fa-fire"></i></div>
                    <div class="ro-btn-content">
                        <h3>固定團</h3>
                        <p>Dungeons & Party</p>
                    </div>
                </div>
            </div>
        </div>

        <div id="view-members" class="animate-fade-in hidden">
            <div class="flex justify-between items-center mb-4">
                <h2 class="text-xl font-bold text-slate-700 flex items-center"><i class="fas fa-scroll mr-2 text-yellow-600"></i>成員名冊</h2>
                <button onclick="app.handleMainAction()" class="bg-blue-500 hover:bg-blue-600 text-white shadow-lg px-3 py-2 rounded-xl font-bold transition text-sm active:scale-95"><i class="fas fa-user-plus mr-1"></i> 新增</button>
            </div>
            
            <div class="flex flex-col gap-3 mb-4 bg-white p-3 rounded-2xl border border-blue-100 shadow-sm">
                <div class="relative w-full">
                    <i class="fas fa-search absolute left-3 top-3 text-blue-300"></i>
                    <input type="text" id="searchInput" oninput="app.renderMembers()" placeholder="搜尋名字、職業..." class="w-full bg-blue-50/50 border border-blue-100 text-slate-800 rounded-xl pl-10 pr-4 py-2.5 focus:ring-2 focus:ring-blue-400 outline-none transition appearance-none placeholder-blue-300">
                </div>
                <div class="relative w-full">
                    <select id="filterJob" onchange="app.setJobFilter(this.value)" class="w-full bg-slate-50 border border-blue-100 rounded-xl p-2.5 appearance-none outline-none cursor-pointer focus:ring-2 focus:ring-blue-400 text-slate-700 font-bold">
                        <option value="all">所有職業</option>
                        <option value="騎士">騎士</option><option value="十字軍">十字軍</option>
                        <option value="鐵匠">鐵匠</option><option value="煉金">煉金</option>
                        <option value="獵人">獵人</option><option value="詩人">詩人</option><option value="舞孃">舞孃</option>
                        <option value="槍手">槍手</option>
                        <option value="神官">神官</option><option value="武僧">武僧</option>
                        <option value="巫師">巫師</option><option value="賢者">賢者</option>
                        <option value="刺客">刺客</option><option value="流氓">流氓</option>
                        <option value="初心者">初心者</option>
                    </select>
                    <i class="fas fa-chevron-down absolute right-3 top-3.5 text-slate-400 pointer-events-none"></i>
                </div>
                <div class="flex gap-2 overflow-x-auto pb-1 scroll-hide">
                    <button onclick="app.setFilter('all')" class="px-4 py-1.5 rounded-full text-sm font-bold bg-slate-800 text-white transition whitespace-nowrap filter-btn active shadow-md">全部</button>
                    <button onclick="app.setFilter('輸出')" class="px-4 py-1.5 rounded-full text-sm font-bold bg-white text-slate-600 border border-slate-200 hover:bg-blue-50 transition whitespace-nowrap filter-btn">輸出</button>
                    <button onclick="app.setFilter('輔助')" class="px-4 py-1.5 rounded-full text-sm font-bold bg-white text-slate-600 border border-slate-200 hover:bg-blue-50 transition whitespace-nowrap filter-btn">輔助</button>
                    <button onclick="app.setFilter('坦')" class="px-4 py-1.5 rounded-full text-sm font-bold bg-white text-slate-600 border border-slate-200 hover:bg-blue-50 transition whitespace-nowrap filter-btn">坦克</button>
                    <button onclick="app.setFilter('待定')" class="px-4 py-1.5 rounded-full text-sm font-bold bg-white text-slate-600 border border-slate-200 hover:bg-blue-50 transition whitespace-nowrap filter-btn">待定</button>
                </div>
            </div>

            <div class="flex justify-between text-xs text-slate-500 mb-2 px-2 font-mono">
                <span id="memberCount">Total: 0</span>
                <div class="space-x-1">
                    <span class="bg-red-100 text-red-700 px-1.5 py-0.5 rounded">DPS:<span id="stat-dps" class="font-bold ml-1">0</span></span>
                    <span class="bg-green-100 text-green-700 px-1.5 py-0.5 rounded">SUP:<span id="stat-sup" class="font-bold ml-1">0</span></span>
                    <span class="bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded">TNK:<span id="stat-tank" class="font-bold ml-1">0</span></span>
                </div>
            </div>
            <div id="memberGrid" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3"></div>
        </div>

        <div id="view-groups" class="hidden">
            <div class="flex justify-between items-center mb-4">
                <h2 class="text-xl font-bold text-slate-700" id="groupViewTitle">分組列表</h2>
                <div class="flex gap-2">
                     <div class="relative w-36"><i class="fas fa-search absolute left-3 top-2.5 text-blue-300 text-xs"></i><input type="text" id="groupSearchInput" oninput="app.renderSquads()" placeholder="搜尋..." class="w-full bg-blue-50/50 border border-blue-100 text-slate-800 rounded-lg pl-8 pr-3 py-2 text-xs focus:ring-2 focus:ring-blue-400 outline-none transition appearance-none placeholder-blue-300"></div>
                     <button onclick="app.handleMainAction()" class="bg-blue-500 hover:bg-blue-600 text-white shadow-lg px-3 py-2 rounded-xl font-bold transition text-sm active:scale-95"><i class="fas fa-plus mr-1"></i> 建隊</button>
                </div>
            </div>
            <div id="adminWarning" class="bg-yellow-50 border border-yellow-200 text-yellow-800 p-3 rounded-xl mb-4 text-xs flex items-center hidden">
                <i class="fas fa-lock mr-2 text-lg"></i> 
                <div>
                    <div class="font-bold">權限受限</div>
                    <div>僅有 會長、指揮官、管理員 可編輯此頁面。</div>
                </div>
            </div>
            <div id="squadGrid" class="grid grid-cols-1 lg:grid-cols-2 gap-4"></div>
            <div id="noSquadsMsg" class="hidden text-center py-20 text-slate-400">
                <div class="text-6xl mb-4 text-slate-200"><i class="fas fa-box-open"></i></div>
                <p class="text-slate-400 font-bold">目前沒有隊伍</p>
                <p class="text-xs mt-1 text-slate-400">點擊右上方按鈕建立新隊伍</p>
            </div>
        </div>
    </main>

    <div id="loginModal" class="modal-overlay fixed inset-0 bg-black/60 backdrop-blur-sm hidden flex items-center justify-center p-4 z-[70]">
        <div class="bg-white rounded-3xl w-full max-w-sm shadow-2xl p-6 relative border-4 border-white ring-4 ring-blue-100">
            <button onclick="app.closeModal('loginModal')" class="absolute top-4 right-4 text-slate-400 hover:text-slate-800 p-2"><i class="fas fa-times"></i></button>
            <div class="text-center mb-6">
                <div class="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 text-3xl mx-auto mb-3 border-4 border-white shadow-md"><i class="fas fa-user-lock"></i></div>
                <h3 class="text-xl font-black text-slate-800">管理員登入</h3>
                <p class="text-xs text-slate-500 mt-1">Verify Access</p>
            </div>
            <form id="loginForm" class="space-y-4" onsubmit="event.preventDefault(); app.handleLogin();">
                <input type="text" id="loginUser" class="w-full bg-slate-50 border-2 border-slate-200 rounded-xl p-3 text-slate-800 focus:border-blue-500 outline-none font-bold" placeholder="帳號">
                <input type="password" id="loginPass" class="w-full bg-slate-50 border-2 border-slate-200 rounded-xl p-3 text-slate-800 focus:border-blue-500 outline-none font-bold" placeholder="密碼">
                <button type="submit" class="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-lg mt-2 active:scale-95 transition border-b-4 border-blue-800">確認登入</button>
            </form>
        </div>
    </div>

    <div id="editModal" class="modal-overlay fixed inset-0 bg-black/50 backdrop-blur-sm hidden flex items-center justify-center p-4">
        <div class="bg-white rounded-3xl w-full max-w-lg shadow-2xl p-6 relative max-h-[90vh] overflow-y-auto border-4 border-white">
            <button onclick="app.closeModal('editModal')" class="absolute top-4 right-4 text-slate-400 hover:text-slate-800 p-2"><i class="fas fa-times text-xl"></i></button>
            <h3 class="text-xl font-bold text-slate-800 mb-6 border-b-2 border-dashed border-slate-200 pb-3">成員資料</h3>
            <form id="memberForm" class="space-y-4" onsubmit="return false;">
                <input type="hidden" id="editId">
                <div class="grid grid-cols-2 gap-4">
                    <div><label class="block text-xs text-slate-500 mb-1 font-bold">遊戲 ID</label><input type="text" id="gameName" class="w-full bg-slate-50 border-2 border-slate-200 rounded-xl p-3 focus:border-blue-500 outline-none font-bold" required></div>
                    <div><label class="block text-xs text-slate-500 mb-1 font-bold">LINE 暱稱</label><input type="text" id="lineName" class="w-full bg-slate-50 border-2 border-slate-200 rounded-xl p-3 focus:border-blue-500 outline-none" required></div>
                </div>
                
                <div class="grid grid-cols-2 gap-4">
                    <div>
                        <label class="block text-xs text-slate-500 mb-1 font-bold">職業大類</label>
                        <div class="relative">
                            <select id="baseJobSelect" class="w-full bg-slate-50 border-2 border-slate-200 rounded-xl p-3 appearance-none outline-none focus:border-blue-500 font-bold" onchange="app.updateSubJobSelect()">
                                <option value="" disabled selected>選擇職業</option>
                            </select>
                            <i class="fas fa-chevron-down absolute right-3 top-4 text-slate-400 pointer-events-none"></i>
                        </div>
                    </div>
                    <div>
                        <label class="block text-xs text-slate-500 mb-1 font-bold">流派 (可手動)</label>
                        <div class="flex gap-1">
                            <div class="relative w-full" id="subJobSelectWrapper">
                                <select id="subJobSelect" class="w-full bg-slate-50 border-2 border-slate-200 rounded-xl p-3 appearance-none outline-none focus:border-blue-500 disabled:bg-slate-100 font-bold">
                                    <option value="" disabled selected>先選職業</option>
                                </select>
                                <i class="fas fa-chevron-down absolute right-3 top-4 text-slate-400 pointer-events-none"></i>
                            </div>
                            <input type="text" id="subJobInput" class="w-full bg-slate-50 border-2 border-slate-200 rounded-xl p-3 outline-none focus:border-blue-500 hidden" placeholder="輸入流派">
                            <button type="button" onclick="app.toggleJobInputMode()" id="toggleJobBtn" class="bg-slate-100 text-slate-500 px-3 rounded-xl border-2 border-slate-200 hidden"><i class="fas fa-pen"></i></button>
                        </div>
                    </div>
                </div>

                <div class="grid grid-cols-2 gap-4">
                    <div>
                        <label class="block text-xs text-slate-500 mb-1 font-bold">定位</label>
                        <select id="role" class="w-full bg-slate-50 border-2 border-slate-200 rounded-xl p-3 focus:border-blue-500 outline-none">
                            <option value="輸出">輸出 (DPS)</option>
                            <option value="輔助">輔助 (Sup)</option>
                            <option value="坦">坦克 (Tank)</option>
                            <option value="待定">待定 (Unknown)</option>
                        </select>
                    </div>
                    <div>
                         <label class="block text-xs text-slate-500 mb-1 font-bold flex items-center">公會職位 <i class="fas fa-lock text-slate-300 text-xs ml-2" id="rankLockIcon"></i></label>
                         <select id="rank" class="w-full bg-white border border-blue-200 rounded-lg p-2.5 text-slate-800 focus:border-blue-500 outline-none disabled:bg-transparent disabled:border-none disabled:p-0 disabled:font-bold disabled:text-slate-600 disabled:mt-2">
                             <option value="成員">成員 (Member)</option>
                             <option value="會長">會長 (Master)</option>
                             <option value="指揮官">指揮官 (Commander)</option>
                             <option value="資料管理員">資料管理員 (Admin)</option>
                         </select>
                    </div>
                </div>

                <div><label class="block text-xs text-slate-500 mb-1 font-bold">備註</label><textarea id="intro" rows="3" class="w-full bg-slate-50 border-2 border-slate-200 rounded-xl p-3 focus:border-blue-500 outline-none"></textarea></div>
                <div class="flex justify-between items-center mt-6 pt-4 border-t-2 border-dashed border-slate-200">
                     <div id="deleteBtnContainer"></div>
                     <div class="flex gap-3"><button type="button" onclick="app.closeModal('editModal')" class="px-4 py-2 text-slate-500 hover:text-slate-800 font-bold">取消</button><button type="button" onclick="app.saveMemberData()" class="px-6 py-2 bg-blue-500 hover:bg-blue-600 text-white font-bold rounded-xl shadow-lg active:scale-95 transition border-b-4 border-blue-700">儲存</button></div>
                </div>
            </form>
        </div>
    </div>

    <div id="squadModal" class="modal-overlay fixed inset-0 bg-black/50 backdrop-blur-sm hidden flex items-center justify-center p-4">
        <div class="bg-white rounded-3xl w-full max-w-2xl shadow-2xl p-6 relative flex flex-col max-h-[90vh] border-4 border-white">
            <button onclick="app.closeModal('squadModal')" class="absolute top-4 right-4 text-slate-400 hover:text-slate-800 p-2"><i class="fas fa-times text-xl"></i></button>
            <h3 class="text-xl font-bold text-slate-800 mb-4 border-b-2 border-dashed border-slate-200 pb-3"><i class="fas fa-users-cog mr-2 text-blue-500"></i><span id="squadModalTitle">隊伍管理</span></h3>
            
            <div class="flex justify-between items-center mb-3">
                <h4 class="text-sm font-bold text-slate-600">隊伍資訊</h4>
                <button onclick="app.copySquadList()" class="bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs font-bold py-1 px-3 rounded-lg border border-slate-300 flex items-center transition"><i class="fas fa-copy mr-1"></i> 複製名單</button>
            </div>

            <div class="space-y-4 mb-4">
                <input type="hidden" id="squadId">
                <input type="hidden" id="squadType">
                <div class="grid grid-cols-3 gap-4">
                    <div class="col-span-2"><label class="block text-xs text-slate-500 mb-1 font-bold">隊伍名稱</label><input type="text" id="squadName" class="w-full bg-slate-50 border-2 border-slate-200 rounded-xl p-3 font-bold outline-none focus:border-blue-500" placeholder="例如：進攻 A 隊"></div>
                    <div><label class="block text-xs text-slate-500 mb-1 font-bold">備註</label><input type="text" id="squadNote" class="w-full bg-slate-50 border-2 border-slate-200 rounded-xl p-3 outline-none focus:border-blue-500" placeholder="守城 / 遊走"></div>
                </div>
            </div>

            <div class="flex-grow overflow-hidden flex flex-col">
                <label class="block text-xs text-slate-500 mb-2 font-bold flex justify-between items-center">
                    <span>勾選隊員 (已選: <span id="selectedCount" class="text-blue-600 font-bold">0/5</span>)</span>
                    <input type="text" id="memberSearch" oninput="app.renderSquadMemberSelect()" placeholder="搜尋..." class="bg-slate-50 border border-slate-300 rounded-lg px-3 py-1 text-xs text-slate-800 w-32 appearance-none">
                </label>
                <div id="squadMemberSelect" class="flex-grow overflow-y-auto bg-slate-50 border border-slate-200 rounded-xl p-2 grid grid-cols-1 md:grid-cols-2 gap-2 max-h-[300px] touch-pan-y"></div>
            </div>

            <div class="flex justify-between items-center mt-6 pt-4 border-t-2 border-dashed border-slate-200 shrink-0">
                 <div id="deleteSquadBtnContainer"></div>
                 <div class="flex gap-3"><button type="button" onclick="app.closeModal('squadModal')" class="px-4 py-2 text-slate-500 hover:text-slate-800 font-bold">取消</button><button type="button" onclick="app.saveSquad()" class="px-6 py-2 bg-blue-500 hover:bg-blue-600 text-white font-bold rounded-xl shadow-lg active:scale-95 transition border-b-4 border-blue-700">儲存</button></div>
            </div>
        </div>
    </div>

    <div id="configModal" class="modal-overlay fixed inset-0 bg-black/50 hidden flex items-center justify-center p-4">
        <div class="bg-white rounded-3xl w-full max-w-md p-6 relative border-4 border-white">
            <button onclick="app.closeModal('configModal')" class="absolute top-4 right-4 text-slate-400 hover:text-slate-800 p-2"><i class="fas fa-times text-xl"></i></button>
            <h3 class="text-xl font-bold text-slate-800 mb-4">設定</h3>
            <div class="space-y-4">
                 <button onclick="app.showHistoryModal()" class="w-full text-left p-4 bg-slate-50 hover:bg-slate-100 rounded-xl flex items-center transition border border-slate-200">
                    <div class="w-10 h-10 bg-yellow-100 text-yellow-600 rounded-full flex items-center justify-center mr-3"><i class="fas fa-history"></i></div>
                    <div><div class="font-bold text-slate-700">修改紀錄</div><div class="text-xs text-slate-500">僅會長/管理員可看</div></div>
                </button>
                <button onclick="app.downloadSelf()" class="w-full text-left p-4 bg-slate-50 hover:bg-slate-100 rounded-xl flex items-center transition border border-slate-200"><div class="w-10 h-10 bg-green-100 text-green-600 rounded-full flex items-center justify-center mr-3"><i class="fas fa-download"></i></div><div><div class="font-bold text-slate-700">下載備份</div><div class="text-xs text-slate-500">將目前的網頁存成新檔案</div></div></button>
                <button onclick="app.exportCSV()" class="w-full text-left p-4 bg-slate-50 hover:bg-slate-100 rounded-xl flex items-center transition border border-slate-200"><div class="w-10 h-10 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mr-3"><i class="fas fa-file-csv"></i></div><div><div class="font-bold text-slate-700">匯出 Excel</div><div class="text-xs text-slate-500">將名單匯出為 CSV 格式</div></div></button>
            </div>
            <div class="mt-6 pt-4 border-t border-slate-100">
                <p class="text-xs font-bold text-slate-500 mb-2">雲端同步金鑰 (Firebase)</p>
                <textarea id="firebaseConfigInput" rows="3" class="w-full bg-slate-50 border border-slate-300 rounded-xl p-3 text-xs text-slate-600 font-mono mb-4 appearance-none" placeholder='{ "apiKey": "..." }'></textarea>
                <div class="flex justify-between items-center"><button onclick="app.resetToDemo()" class="text-red-400 text-xs hover:text-red-600">重置資料</button><button onclick="app.saveConfig()" class="px-4 py-2 bg-slate-800 text-white rounded-xl hover:bg-black transition shadow-lg">連線</button></div>
            </div>
        </div>
    </div>

    <div id="historyModal" class="modal-overlay fixed inset-0 bg-black/50 backdrop-blur-sm hidden flex items-center justify-center p-4">
        <div class="bg-white rounded-3xl w-full max-w-lg shadow-2xl p-6 relative max-h-[90vh] overflow-y-auto border-4 border-white">
            <button onclick="app.closeModal('historyModal')" class="absolute top-4 right-4 text-slate-400 hover:text-slate-800 p-2"><i class="fas fa-times text-xl"></i></button>
            <h3 class="text-xl font-bold text-slate-800 mb-4 border-b-2 border-dashed border-slate-200 pb-3"><i class="fas fa-history mr-2 text-yellow-600"></i>修改紀錄</h3>
            <div id="historyList" class="space-y-3">
                <p class="text-center text-slate-400">載入中...</p>
            </div>
            <div id="historyError" class="bg-red-50 p-3 rounded-xl text-red-700 hidden"></div>
        </div>
    </div>

    <script>
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
            { id: "m73", lineName: "NICK", gameName: "狗是水鏡", mainClass: "流氓(輸出)", role: "輸出", rank: "成員", intro: "水鏡是條狗" }
        ];

        const SEED_GROUPS = [];

        const App = {
            db: null, auth: null, collectionMembers: 'members', collectionGroups: 'groups', 
            members: [], groups: [], history: [], // Added history array
            currentFilter: 'all', currentJobFilter: 'all', currentTab: 'home', mode: 'demo', currentSquadMembers: [],
            userRole: 'guest', 

            init: async function() {
                const savedRole = localStorage.getItem('row_user_role');
                if (savedRole && ['admin', 'master', 'commander'].includes(savedRole)) {
                    this.userRole = savedRole;
                }
                this.loadHistory(); // Load history on init

                if (typeof firebase !== 'undefined') {
                    let config = null;
                    if (typeof __firebase_config !== 'undefined' && __firebase_config) try { config = JSON.parse(__firebase_config); } catch(e) {}
                    if (!config) { const stored = localStorage.getItem('row_firebase_config'); if (stored) config = JSON.parse(stored); }
                    if (config) { this.initFirebase(config); } else { this.initDemoMode(); }
                } else { this.initDemoMode(); }
                this.setupListeners();
                this.updateAdminUI();
                this.switchTab('home'); 
            },
            
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

            seedFirebaseMembers: async function() {
                const appId = typeof __app_id !== 'undefined' ? __app_id : 'row-guild-app';
                const batch = this.db.batch();
                SEED_DATA.forEach(item => { const ref = this.db.collection('artifacts').doc(appId).collection('public').doc('data').collection(this.collectionMembers).doc(); batch.set(ref, item); });
                await batch.commit();
            },

            saveLocal: function() {
                if (this.mode === 'demo') { 
                    localStorage.setItem('row_local_members', JSON.stringify(this.members)); 
                    localStorage.setItem('row_local_groups', JSON.stringify(this.groups)); 
                    localStorage.setItem('row_mod_history', JSON.stringify(this.history)); 
                    this.render(); 
                }
            },
            
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
                
                // 修正處: 確保 nav-container 始終可見
                document.getElementById('nav-container').classList.remove('hidden'); 

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
            updateMember: async function(id, member) {
                if (this.mode === 'firebase') { 
                    const appId = typeof __app_id !== 'undefined' ? __app_id : 'row-guild-app'; 
                    await this.db.collection('artifacts').doc(appId).collection('public').doc('data').collection(this.collectionMembers).doc(id).update(member); 
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
                let html = document.documentElement.outerHTML;
                html = html.replace(/const SEED_DATA = \[[\s\S]*?\];/, `const SEED_DATA = ${JSON.stringify(this.members)};`);
                html = html.replace(/const SEED_GROUPS = \[[\s\S]*?\];/, `const SEED_GROUPS = ${JSON.stringify(this.groups)};`);
                const link = document.createElement("a"); link.href = URL.createObjectURL(new Blob([html], {type: "text/html"})); link.download = `ROW_Manager_${new Date().toISOString().split('T')[0]}.html`;
                document.body.appendChild(link); link.click(); document.body.removeChild(link);
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
    </script>
</body>
</html>
