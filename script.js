import { initializeApp } from "https://www.gstatic.com/firebasejs/12.7.0/firebase-app.js";
import { getDatabase, ref, push, set, query, orderByChild, limitToLast, get } from "https://www.gstatic.com/firebasejs/12.7.0/firebase-database.js";

// --- SES AYARLARI ---
const correctSound = new Audio('https://assets.mixkit.co/active_storage/sfx/2013/2013-preview.mp3');
const errorSound = new Audio('https://assets.mixkit.co/active_storage/sfx/2003/2003-preview.mp3');
correctSound.volume = 0.5;
errorSound.volume = 0.5;
let isMuted = false;

// --- FIREBASE AYARLARI ---
const firebaseConfig = {
    apiKey: "AIzaSyDl4aJYLl4OHqqX2u0UuC34dUbpcyQdgMY",
    authDomain: "elementsembol-3c430.firebaseapp.com",
    projectId: "elementsembol-3c430",
    storageBucket: "elementsembol-3c430.firebasestorage.app",
    messagingSenderId: "925424889350",
    appId: "1:925424889350:web:b7c895898c0436631b1d87",
    measurementId: "G-5WTQFZ6Y63"
};
const app = initializeApp(firebaseConfig);
const database = getDatabase(app);

// --- DEĞİŞKENLER ---
let timerInterval = null; 
let startTime = null;
let selectedSymbol = null;
let selectedName = null;
let puan = 0;
let can = 3;
let timerStarted = false; // Süre başlangıçta kapalı, ilk tıklamayı bekler
let gameTotalStartTime = null;
let gameStartTime = null;
let gameActive = true; // Oyunun o an oynanabilir olup olmadığını tutar

const allElements = [
    {s:"H",n:"Hidrojen",g:"nonmetal"},{s:"He",n:"Helyum",g:"noble"},{s:"Li",n:"Lityum",g:"alkali"},{s:"Be",n:"Berilyum",g:"earth"},
    {s:"B",n:"Bor",g:"metalloid"},{s:"C",n:"Karbon",g:"nonmetal"},{s:"N",n:"Azot",g:"nonmetal"},{s:"O",n:"Oksijen",g:"nonmetal"},
    {s:"F",n:"Flor",g:"nonmetal"},{s:"Ne",n:"Neon",g:"noble"},{s:"Na",n:"Sodyum",g:"alkali"},{s:"Mg",n:"Magnezyum",g:"earth"},
    {s:"Al",n:"Alüminyum",g:"post"},{s:"Si",n:"Silisyum",g:"metalloid"},{s:"P",n:"Fosfor",g:"nonmetal"},{s:"S",n:"Kükürt",g:"nonmetal"},
    {s:"Cl",n:"Klor",g:"nonmetal"},{s:"Ar",n:"Argon",g:"noble"},{s:"K",n:"Potasyum",g:"alkali"},{s:"Ca",n:"Kalsiyum",g:"earth"},
    {s:"Sc",n:"Skandiyum",g:"transition"},{s:"Ti",n:"Titanyum",g:"transition"},{s:"V",n:"Vanadyum",g:"transition"},{s:"Cr",n:"Krom",g:"transition"},
    {s:"Mn",n:"Mangan",g:"transition"},{s:"Fe",n:"Demir",g:"transition"},{s:"Co",n:"Kobalt",g:"transition"},{s:"Ni",n:"Nikel",g:"transition"},
    {s:"Cu",n:"Bakır",g:"transition"},{s:"Zn",n:"Çinko",g:"transition"},{s:"Ga",n:"Galyum",g:"post"},{s:"Ge",n:"Germanyum",g:"metalloid"},
    {s:"As",n:"Arsenik",g:"metalloid"},{s:"Se",n:"Selenyum",g:"nonmetal"},{s:"Br",n:"Brom",g:"nonmetal"},{s:"Kr",n:"Kripton",g:"noble"},
    {s:"Rb",n:"Rubidyum",g:"alkali"},{s:"Sr",n:"Stronsiyum",g:"earth"},{s:"Y",n:"İtriyum",g:"transition"},{s:"Zr",n:"Zirkonyum",g:"transition"},
    {s:"Nb",n:"Niyobyum",g:"transition"},{s:"Mo",n:"Molibden",g:"transition"},{s:"Tc",n:"Teknesyum",g:"transition"},{s:"Ru",n:"Rutenyum",g:"transition"},
    {s:"Rh",n:"Rodyum",g:"transition"},{s:"Pd",n:"Paladyum",g:"transition"},{s:"Ag",n:"Gümüş",g:"transition"},{s:"Cd",n:"Kadmiyum",g:"transition"},
    {s:"In",n:"İndiyum",g:"post"},{s:"Sn",n:"Kalay",g:"post"},{s:"Sb",n:"Antimon",g:"metalloid"},{s:"Te",n:"Tellür",g:"metalloid"},
    {s:"I",n:"İyot",g:"nonmetal"},{s:"Xe",n:"Ksenon",g:"noble"},{s:"Cs",n:"Sezyum",g:"alkali"},{s:"Ba",n:"Baryum",g:"earth"},
    {s:"La",n:"Lantan",g:"lanthanide"},{s:"Ce",n:"Seryum",g:"lanthanide"},{s:"Pr",n:"Praseodim",g:"lanthanide"},{s:"Nd",n:"Neodim",g:"lanthanide"},
    {s:"Pm",n:"Prometyum",g:"lanthanide"},{s:"Sm",n:"Samaryum",g:"lanthanide"},{s:"Eu",n:"Europiyum",g:"lanthanide"},{s:"Gd",n:"Gadoliniyum",g:"lanthanide"},
    {s:"Tb",n:"Terbiyum",g:"lanthanide"},{s:"Dy",n:"Disprozyum",g:"lanthanide"},{s:"Ho",n:"Holmiyum",g:"lanthanide"},{s:"Er",n:"Erbiyum",g:"lanthanide"},
    {s:"Tm",n:"Tulyum",g:"lanthanide"},{s:"Yb",n:"İtterbiyum",g:"lanthanide"},{s:"Lu",n:"Lutesyum",g:"lanthanide"},{s:"Hf",n:"Hafniyum",g:"transition"},
    {s:"Ta",n:"Tantal",g:"transition"},{s:"W",n:"Volfram",g:"transition"},{s:"Re",n:"Renyum",g:"transition"},{s:"Os",n:"Osmiyum",g:"transition"},
    {s:"Ir",n:"İridyum",g:"transition"},{s:"Pt",n:"Platin",g:"transition"},{s:"Au",n:"Altın",g:"transition"},{s:"Hg",n:"Civa",g:"transition"},
    {s:"Tl",n:"Talyum",g:"post"},{s:"Pb",n:"Kurşun",g:"post"},{s:"Bi",n:"Bizmut",g:"post"},{s:"Po",n:"Polonyum",g:"post"},
    {s:"At",n:"Astatin",g:"metalloid"},{s:"Rn",n:"Radon",g:"noble"},{s:"Fr",n:"Fransiyum",g:"alkali"},{s:"Ra",n:"Radyum",g:"earth"},
    {s:"Ac",n:"Aktinyum",g:"actinide"},{s:"Th",n:"Toryum",g:"actinide"},{s:"Pa",n:"Protaktinyum",g:"actinide"},{s:"U",n:"Uranyum",g:"actinide"},
    {s:"Np",n:"Neptünyum",g:"actinide"},{s:"Pu",n:"Plütonyum",g:"actinide"},{s:"Am",n:"Amerikyum",g:"actinide"},{s:"Cm",n:"Küriyum",g:"actinide"},
    {s:"Bk",n:"Berkelyum",g:"actinide"},{s:"Cf",n:"Kaliforniyum",g:"actinide"},{s:"Es",n:"Aynştaynyum",g:"actinide"},{s:"Fm",n:"Fermiyum",g:"actinide"},
    {s:"Md",n:"Mendelevyum",g:"actinide"},{s:"No",n:"Nobelyum",g:"actinide"},{s:"Lr",n:"Lavrensiyum",g:"actinide"},{s:"Rf",n:"Rutherfordiyum",g:"transition"},
    {s:"Db",n:"Dubniyum",g:"transition"},{s:"Sg",n:"Seaborgiyum",g:"transition"},{s:"Bh",n:"Bohriyum",g:"transition"},{s:"Hs",n:"Hassiyum",g:"transition"},
    {s:"Mt",n:"Meitneriyum",g:"transition"},{s:"Ds",n:"Darmstadtiyum",g:"transition"},{s:"Rg",n:"Röntgenyum",g:"transition"},{s:"Cn",n:"Kopernikyum",g:"transition"},
    {s:"Nh",n:"Nihonyum",g:"post"},{s:"Fl",n:"Flerovyum",g:"post"},{s:"Mc",n:"Moskovyum",g:"post"},{s:"Lv",n:"Livermoryum",g:"post"},
    {s:"Ts",n:"Tennessin",g:"nonmetal"},{s:"Og",n:"Oganesson",g:"noble"}
];

// --- SAYFA YÜKLENDİĞİNDE BUTON VE İSİM AYARLARI ---
window.addEventListener('DOMContentLoaded', () => {
    const muteBtn = document.getElementById('mute-btn');
    if (muteBtn) {
        muteBtn.onclick = () => {
            isMuted = !isMuted;
            muteBtn.innerText = isMuted ? "🔇" : "🔊";
            correctSound.muted = isMuted;
            errorSound.muted = isMuted;
            muteBtn.style.opacity = isMuted ? "0.6" : "1";
        };
    }
    const kaydedilenAd = localStorage.getItem("oyuncuAdi");
    const nameDisplay = document.getElementById("player-name");
    if (kaydedilenAd && nameDisplay) nameDisplay.innerText = kaydedilenAd;
});

// --- SKOR KAYIT VE LİDERLİK TABLOSU ---
async function liderlikTablosunuGuncelle() {
    const skorRef = ref(database, 'skorlar');
    const sorgu = query(skorRef, orderByChild('puan'), limitToLast(50));
    try {
        const snapshot = await get(sorgu);
        const tbody = document.getElementById('leaderboard-body');
        if (!tbody) return;
        tbody.innerHTML = ""; 
        let tumSkorlar = [];
        snapshot.forEach((childSnapshot) => { tumSkorlar.push(childSnapshot.val()); });
        tumSkorlar.sort((a, b) => b.puan - a.puan);
        let benzersizSkorlar = [];
        let isimlerSet = new Set();
        for (let s of tumSkorlar) {
            if (!isimlerSet.has(s.isim)) {
                benzersizSkorlar.push(s);
                isimlerSet.add(s.isim);
            }
            if (benzersizSkorlar.length === 10) break;
        }
        benzersizSkorlar.forEach((skor, index) => {
            const row = `<tr><td style="padding:8px; border-bottom:1px solid #eee; text-align:center;">${index+1}</td><td style="padding:8px; border-bottom:1px solid #eee;">${skor.isim}</td><td style="padding:8px; border-bottom:1px solid #eee; font-weight:bold; color:#e67e22;">${skor.puan}</td></tr>`;
            tbody.innerHTML += row;
        });
    } catch (error) { console.error("Skor çekme hatası:", error); }
}

function skoruKaydet(puanDegeri) {
    const oyuncuAdi = localStorage.getItem("oyuncuAdi") || "Misafir";
    push(ref(database, 'skorlar'), {
        isim: oyuncuAdi,
        puan: puanDegeri,
        tarih: new Date().toLocaleStrin()
    });
}

// --- OYUN MANTIĞI ---
function shuffle(array) { return array.sort(() => Math.random() - 0.5); }

function initGame() {
    const symbolCol = document.getElementById('symbol-col');
    const nameCol = document.getElementById('name-col');
    const rangeVal = parseInt(document.getElementById('elementRange').value) || 118;
    const groupVal = document.getElementById('groupFilter').value;
    const countVal = parseInt(document.getElementById('elementCount').value) || 10;
    
    // Değerleri sıfırla
    puan = 0;
    can = 3;
    gameActive = true; // Her yeni oyunda kilidi aç
    // 
    timerStarted = false;
    if (timerInterval) clearInterval(timerInterval);
    document.getElementById('puan-degeri').innerText = "0";
    document.getElementById('can-degeri').innerText = "❤️".repeat(can);
    document.getElementById('live-timer').innerText = "0";
    
    if (!symbolCol || !nameCol) return;
    symbolCol.innerHTML = '';
    nameCol.innerHTML = '';
    
    let pool = allElements.slice(0, Math.min(rangeVal, allElements.length));
    if (groupVal !== "all") pool = pool.filter(el => el.g === groupVal);
    
    const gamePool = shuffle([...pool]).slice(0, Math.min(countVal, pool.length));
    if (gamePool.length === 0) { symbolCol.innerHTML = "<p>Bulunamadı</p>"; return; }
    
    shuffle([...gamePool]).forEach(el => symbolCol.appendChild(createCard(el.s, 'symbol', el.s, el.g)));
    shuffle([...gamePool]).forEach(el => nameCol.appendChild(createCard(el.n, 'name', el.s, el.g)));
    
    selectedSymbol = null;
    selectedName = null;
}

function createCard(text, type, matchId, group) {
    const div = document.createElement('div');
    div.classList.add('card', 'group-' + group);
    div.innerText = text;
    div.dataset.match = matchId;
    div.dataset.type = type;
    div.onclick = handleCardClick;
    return div;
}

function handleCardClick() {
    // 1. KONTROL: Eğer oyun durdurulduysa veya can bittiyse tıklamaya izin verme
    if (typeof gameActive !== 'undefined' && !gameActive) return;
    if (can <= 0) return;

    // SÜRE BAŞLATMA: İlk tıklamada hem puan süresi hem de toplam oyun süresi başlar
    if (!timerStarted) {
        timerStarted = true;
        startTime = Date.now();      // Puan hesabı için (her doğru eşleşmede sıfırlanır)
        gameStartTime = Date.now();  // Toplam oyun süresi için (sabit kalır)
        
        timerInterval = setInterval(() => {
            const timerDisplay = document.getElementById('live-timer');
            if (timerDisplay) {
                // Ekranda görünen süreyi gameStartTime üzerinden hesapla ki puan sıfırlansa da o artmaya devam etsin
                timerDisplay.innerText = Math.floor((Date.now() - gameStartTime) / 1000);
            }
        }, 1000);
    }

    // Seçili veya gizli karta tekrar tıklanmasını engelle
    if (this.classList.contains('hidden') || this.classList.contains('selected')) return;

    // Kart seçimi mantığı
    if (this.dataset.type === 'symbol') {
        if (selectedSymbol) selectedSymbol.classList.remove('selected');
        selectedSymbol = this;
    } else {
        if (selectedName) selectedName.classList.remove('selected');
        selectedName = this;
    }
    this.classList.add('selected');

    // İki kart da seçildiyse kontrol başlar
    if (selectedSymbol && selectedName) {
        const s = selectedSymbol;
        const n = selectedName;

        if (s.dataset.match === n.dataset.match) {
            // --- DOĞRU EŞLEŞME DURUMU ---
            if (!isMuted) correctSound.play();
            
            // Puan Hesaplama (Senin orijinal formülün)
            const hamleSuresi = Math.max(1, Math.floor((Date.now() - startTime) / 1000));
            const havuzGenisligi = parseInt(document.getElementById('elementRange').value) || 118;
            const hamlePuani = Math.floor((1000 / hamleSuresi) * (1 + (havuzGenisligi / 118)));
            
            puan += hamlePuani;
            const puanGosterge = document.getElementById('puan-degeri');
            if (puanGosterge) puanGosterge.innerText = puan;

            s.classList.add('correct-flash');
            n.classList.add('correct-flash');

            // Temizlik
            selectedSymbol = null;
            selectedName = null;
            startTime = Date.now(); // Bir sonraki doğru için hamle süresini sıfırla

            setTimeout(() => {
                s.classList.add('hidden');
                n.classList.add('hidden');
                checkVictory(); // Zafer kontrolü
            }, 400);

        } else {
            // --- YANLIŞ EŞLEŞME DURUMU ---
            selectedSymbol = null;
            selectedName = null;

            if (!isMuted) errorSound.play();
            s.classList.add('error-shake');
            n.classList.add('error-shake');
            
            can--;
            const canGosterge = document.getElementById('can-degeri');
            if (canGosterge) canGosterge.innerText = "❤️".repeat(Math.max(0, can));

            // CAN BİTTİ Mİ?
            if (can <= 0) {
                gameActive = false; // Oyunu anında kilitle
                clearInterval(timerInterval);
                
                // Toplam süreyi hesapla
                const toplamSure = Math.floor((Date.now() - gameStartTime) / 1000);

                setTimeout(() => {
                    alert(`OYUN BİTTİ!\n\nToplam Süre: ${toplamSure} saniye\nToplam Puan: ${puan}`);
                    skoruKaydet(puan);
                    window.location.href = "index.html";
                }, 500); 
                return; // Yanlış animasyonu bitmeden fonksiyondan çık
            }

            setTimeout(() => {
                s.classList.remove('selected', 'error-shake');
                n.classList.remove('selected', 'error-shake');
            }, 500);
        }
    }
}


function checkVictory() {
    const total = document.querySelectorAll('.card').length;
    const hidden = document.querySelectorAll('.card.hidden').length;
    if (hidden === total && total > 0) {
        clearInterval(timerInterval);
// OYUNUN TOPLAM SÜRESİNİ HESAPLIYORUZ (Süre durduğu an)
        const oyunBitisAni = Date.now();
        const toplamGecenSure = Math.floor((oyunBitisAni - gameStartTime) / 1000); 

        alert(`TEBRİKLER! Tüm elementleri buldun.\nToplam Süre: ${toplamGecenSure} saniye\nToplam Puanın: ${puan}`);
        
        skoruKaydet(puan);
        window.location.href = "index.html";
    }
}

// Global olarak tanımla
window.initGame = initGame;
window.onload = initGame;
