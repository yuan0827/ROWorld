<!DOCTYPE html>
<html lang="zh-Hant">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>RO:W 公會名冊 | 躺著不想動</title>
    <meta name="apple-mobile-web-app-capable" content="yes">
    <meta name="mobile-web-app-capable" content="yes">
    <meta name="theme-color" content="#A3D8F4">

    <link href="https://fonts.googleapis.com/css2?family=ZCOOL+KuaiLe&family=Varela+Round&display=swap" rel="stylesheet">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
    
    <script src="https://unpkg.com/vue@3/dist/vue.global.js"></script>
    <script src="https://cdn.tailwindcss.com"></script>

    <script src="https://www.gstatic.com/firebasejs/11.0.0/firebase-app-compat.js"></script>
    <script src="https://www.gstatic.com/firebasejs/11.0.0/firebase-database-compat.js"></script>

    <script>
        tailwind.config = {
            theme: {
                extend: {
                    colors: {
                        'ro': {
                            primary: '#4380D3',
                            'primary-dark': '#386DBB',
                            bg: '#e0f2fe',
                        },
                    },
                    fontFamily: {
                        'cute': ["ZCOOL Kuaile", "'Varela Round'", 'sans-serif'],
                    },
                    animation: {
                        'float': 'float 6s ease-in-out infinite',
                        'jelly': 'jelly 2s infinite alternate',
                        'cloud-move': 'cloudMove 60s linear infinite',
                        'poring-jump': 'poringJump 1s infinite',
                    },
                    keyframes: {
                        float: {
                            '0%, 100%': { transform: 'translateY(0)' },
                            '50%': { transform: 'translateY(-10px)' },
                        },
                        jelly: {
                            '0%, 100%': { transform: 'translateY(0)' },
                            '50%': { transform: 'translateY(-10px)' },
                        },
                        cloudMove: {
                            '0%': { transform: 'translateX(100%)' },
                            '100%': { transform: 'translateX(-100%)' },
                        },
                        poringJump: {
                            '0%, 100%': { transform: 'translateY(0)' },
                            '50%': { transform: 'translateY(-5px)' },
                        },
                    },
                }
            }
        }
    </script>

    <style>
        .loading-overlay { z-index: 9999; }
        /* 輕微的波浪背景效果 */
        .game-container::before { 
            content: ''; 
            position: fixed; 
            top: 0; 
            left: 0; 
            width: 100%; 
            height: 100%; 
            /* 注意: 此處圖片 URL 仍是預留的，您可能需要自己設定背景圖 */
            background-image: url('https://i.imgur.com/your-bg-image.png');
            background-repeat: no-repeat;
            background-position: center center;
            background-size: cover;
            opacity: 0.1; 
            z-index: -1; 
        }
        .mascot-container { transform: scale(1.05); } 
        .poporing-deco, .drops-deco { position: absolute; z-index: 5; }
        .poporing-deco { top: 0; right: 0; transform: scale(0.6); }
        .drops-deco { bottom: 0; left: 0; transform: scale(0.6); }
        /* 避免 Vue 載入前的閃爍 */
        [v-cloak] > * { display: none; }
        [v-cloak]::before { content: "Loading..."; display: block; }
        
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
        /* 確保 Font Awesome 圖示正確顯示，如果 CDN 失敗，圖示可能會跑位或顯示方塊 */
        .fa-cog, .fa-book-open, .fa-crosshairs, .fa-users {
             font-family: 'Font Awesome 6 Free';
             font-weight: 900; /* 使用 solid 風格的權重 */
        }
    </style>
</head>

<body>
    <div id="app" class="game-container w-screen h-screen overflow-y-auto bg-ro-bg flex flex-col items-center min-h-screen" v-cloak>
        <div class="fixed top-0 left-0 right-0 p-4 bg-ro-bg shadow-md flex justify-between items-center z-50"> 
            <h1 class="text-2xl font-cute text-ro-primary-dark">RO 躺著不想動</h1>
            <button @click="showModal('config')" class="text-ro-primary hover:text-ro-primary-dark transition">
                <i class="fas fa-cog text-xl"></i>
            </button>
        </div>

        <div class="pt-20 w-full flex flex-col items-center">
            <div v-show="view === 'home'" class="flex flex-col items-center justify-start h-full p-6 pb-20 w-full">
