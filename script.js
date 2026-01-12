import { initializeApp } from "https://www.gstatic.com/firebasejs/12.7.0/firebase-app.js";
import { getDatabase, ref, push, get, query, orderByChild, limitToLast } from "https://www.gstatic.com/firebasejs/12.7.0/firebase-database.js";

// --- KONFİGÜRASYON ---
const firebaseConfig = {
    apiKey: "AIzaSyDl4aJYLl4OHqqX2u0UuC34dUbpcyQdgMY",
    authDomain: "elementsembol-3c430.firebaseapp.com",
    databaseURL: "https://elementsembol-3c430-default-rtdb.firebaseio.com",
    projectId: "elementsembol-3c430",
    storageBucket: "elementsembol-3c430.firebasestorage.app",
    messagingSenderId: "925424889350",
    appId: "1:925424889350:web:b7c895898c0436631b1d87"
};

const app = initializeApp(firebaseConfig);
const database = getDatabase(app);

// --- DEĞİŞKENLER ---
let timerInterval, hamleInterval, gameStartTime, startTime, selectedSymbol, selectedName;
let puan = 0, can = 3, timerStarted = false, gameActive = true, isMuted = false;let kalanHamleSuresi = 10;

const correctSound = new Audio('https://assets.mixkit.co/active_storage/sfx/2013/2013-preview.mp3');
const errorSound = new Audio('https://assets.mixkit.co/active_storage/sfx/2003/2003-preview.mp3');

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

// --- FIREBASE İŞLEMLERİ ---
async function skoruKaydet(sonPuan) {
    const isim = localStorage.getItem("oyuncuAdi") || "Misafir";
    try {
        await push(ref(database, 'skorlar'), {
            isim: isim,
            puan: parseInt(sonPuan),
            tarih: new Date().toLocaleString()
        });
    } catch (e) { console.error("Kayıt hatası:", e); }
}

async function liderlikTablosunuGuncelle() {
    const tbody = document.getElementById('leaderboard-body');
    if (!tbody) return;
    try {
        const snapshot = await get(query(ref(database, 'skorlar'), orderByChild('puan'), limitToLast(50)));
        let list = [];
        snapshot.forEach(child => { list.push(child.val()); });
        list.sort((a,b) => b.puan - a.puan);
        
        let unique = [], names = new Set();
        for(let s of list) {
            let n = s.isim.trim().toLowerCase();
            if(!names.has(n)) { unique.push(s); names.add(n); }
            if(unique.length >= 10) break;
        }
        tbody.innerHTML = unique.map((s, i) => `
            <tr>
                <td style="padding:10px; text-align:center;">${i+1}</td>
                <td style="padding:10px;">${s.isim}</td>
                <td style="padding:10px; text-align:right; font-weight:bold; color:#e67e22;">${s.puan}</td>
            </tr>`).join('');
    } catch (e) { console.error("Tablo hatası:", e); }
}

// --- OYUN BİTİŞ PANELİ VE WHATSAPP ---
async function oyunuBitir() {
    gameActive = false;
    if (timerInterval) clearInterval(timerInterval);
    
    const toplamSure = document.getElementById('live-timer').innerText;
    const finalPuan = puan;
    
    // Paneli göster ve bilgileri yaz
    const panel = document.getElementById('game-over-panel');
    const scoreText = document.getElementById('final-score-text');
    
    if (panel && scoreText) {
        panel.style.display = 'block';
        scoreText.innerHTML = `Puan: <b>${finalPuan}</b> <br> Süre: <b>${toplamSure}</b> sn`;
    }

    // WhatsApp Butonu Ayarı
    const waBtn = document.getElementById('whatsapp-btn');
    if (waBtn) {
       waBtn.onclick = () => {
        // Linki tırnak işaretlerinin içine, mesajın sonuna ekliyoruz
            const mesaj = `Element Avcısı Pro'da ${finalPuan} puan topladım! ⚡ Hamle hızım ve bilgimle periyodik tabloyu ${toplamSure} saniyede tamamladım. Sen benden hızlı olabilir misin? 🚀 https://elementsembol.vercel.app`;
 
             window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(mesaj)}`, '_blank');
         };
    }


    // Kaydet ve Tabloyu Yenile
    await skoruKaydet(finalPuan);
    liderlikTablosunuGuncelle();
}

function hamleZamanlayiciBaslat() {
    if (hamleInterval) clearInterval(hamleInterval);
    
    const wrapper = document.getElementById('progress-wrapper');
    const bar = document.getElementById('progress-bar');
    const bonusText = document.getElementById('bonus-text');
    
    if (wrapper) wrapper.style.display = 'block';
    
    kalanHamleSuresi = 10; // Her yeni hamle için 10 saniyeden başla
    
    hamleInterval = setInterval(() => {
        kalanHamleSuresi -= 0.1;
        let yuzde = (kalanHamleSuresi / 10) * 100;
        
        if (bar) {
            bar.style.width = yuzde + "%";
            // Renk değişimi
            if (yuzde > 60) bar.style.backgroundColor = "#27ae60";
            else if (yuzde > 30) bar.style.backgroundColor = "#f1c40f";
            else bar.style.backgroundColor = "#e74c3c";
        }
        
        if (bonusText) bonusText.innerText = "%" + Math.max(0, Math.floor(yuzde));

        if (kalanHamleSuresi <= 0) {
            clearInterval(hamleInterval);
            // Süre biterse bonus %0 olur ama oyun devam eder
        }
    }, 100);
}

// --- OYUN MANTIĞI ---
function initGame() {
    if (hamleInterval) clearInterval(hamleInterval);
    const wrapper = document.getElementById('progress-wrapper');
    if (wrapper) wrapper.style.display = 'none';
    const sCol = document.getElementById('symbol-col');
    const nCol = document.getElementById('name-col');
    const panel = document.getElementById('game-over-panel');
    if (!sCol || !nCol) return;

    if (panel) panel.style.display = 'none'; // Yeni oyunda paneli gizle
    puan = 0; can = 3; timerStarted = false; gameActive = true;
    if (timerInterval) clearInterval(timerInterval);

    document.getElementById('puan-degeri').innerText = "0";
    document.getElementById('can-degeri').innerText = "❤️".repeat(3);
    document.getElementById('live-timer').innerText = "0";

    const range = parseInt(document.getElementById('elementRange').value) || 118;
    const count = parseInt(document.getElementById('elementCount').value) || 10;
    const group = document.getElementById('groupFilter').value;

    let pool = allElements.slice(0, range);
    if (group !== "all") pool = pool.filter(el => el.g === group);
    const gamePool = pool.sort(() => Math.random() - 0.5).slice(0, count);
    
    sCol.innerHTML = ''; nCol.innerHTML = '';
    [...gamePool].sort(() => Math.random() - 0.5).forEach(el => sCol.appendChild(createCard(el.s, 'symbol', el.s, el.g)));
    [...gamePool].sort(() => Math.random() - 0.5).forEach(el => nCol.appendChild(createCard(el.n, 'name', el.s, el.g)));
    
    liderlikTablosunuGuncelle();
}

function createCard(txt, type, mid, grp) {
    const d = document.createElement('div');
    d.className = `card group-${grp}`;
    d.innerText = txt;
    d.dataset.match = mid;
    d.dataset.type = type;
    d.onclick = handleCardClick;
    return d;
}

function handleCardClick() {
    if (!gameActive || this.classList.contains('hidden') || this.classList.contains('selected')) return;

    if (!timerStarted) {
        timerStarted = true;
        gameStartTime = Date.now();
        startTime = Date.now();
        hamleZamanlayiciBaslat();
        timerInterval = setInterval(() => {
            const timerEl = document.getElementById('live-timer');
            if(timerEl) timerEl.innerText = Math.floor((Date.now() - gameStartTime) / 1000);
        }, 1000);
    }

    if (this.dataset.type === 'symbol') {
        if (selectedSymbol) selectedSymbol.classList.remove('selected');
        selectedSymbol = this;
    } else {
        if (selectedName) selectedName.classList.remove('selected');
        selectedName = this;
    }
    this.classList.add('selected');

    if (selectedSymbol && selectedName) {
        const s = selectedSymbol, n = selectedName;
        if (s.dataset.match === n.dataset.match) {
            if (!isMuted) correctSound.play();
            let bonusCarpani = Math.max(0.1, kalanHamleSuresi / 10);
            let temelPuan = 1000;
            let havuzGenisligi = parseInt(document.getElementById('elementRange').value) || 118;
            puan += Math.floor(temelPuan * bonusCarpani * (1 + (havuzGenisligi / 118)));
            
            document.getElementById('puan-degeri').innerText = puan;
            hamleZamanlayiciBaslat();
            s.classList.add('correct-flash'); n.classList.add('correct-flash');
            selectedSymbol = null; selectedName = null;

            setTimeout(() => {
                s.classList.add('hidden'); n.classList.add('hidden');
                if (document.querySelectorAll('.card:not(.hidden)').length === 0) {
                  if (hamleInterval) clearInterval(hamleInterval);
                    oyunuBitir();
                }
            }, 400);
        } else {
            if (!isMuted) errorSound.play();
            s.classList.add('error-shake'); n.classList.add('error-shake');
            can--;
            document.getElementById('can-degeri').innerText = "❤️".repeat(Math.max(0, can));
            selectedSymbol = null; selectedName = null;
            if (can <= 0) { 
            if (hamleInterval) clearInterval(hamleInterval);
                setTimeout(() => { oyunuBitir(); }, 500);
            } else {
                setTimeout(() => {
                    s.classList.remove('selected', 'error-shake');
                    n.classList.remove('selected', 'error-shake');
                }, 500);
            }
        }
    }
}

window.addEventListener('DOMContentLoaded', () => {
    const mBtn = document.getElementById('mute-btn');
    if (mBtn) {
        mBtn.onclick = () => {
            isMuted = !isMuted;
            mBtn.innerText = isMuted ? "🔇" : "🔊";
        };
    }
    const pDisp = document.getElementById("player-name");
    if (pDisp) pDisp.innerText = localStorage.getItem("oyuncuAdi") || "Misafir";
}
 if (document.querySelector('.game-container')) {
        initGame();
    }
});

window.initGame = initGame;
