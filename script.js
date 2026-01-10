import { initializeApp } from "https://www.gstatic.com/firebasejs/12.7.0/firebase-app.js";
import { getDatabase, ref, push, set, query, orderByChild, limitToLast, get } from "https://www.gstatic.com/firebasejs/12.7.0/firebase-database.js";

// Ses efektleri (Ücretsiz ve hızlı linkler)
const correctSound = new Audio('https://assets.mixkit.co/active_storage/sfx/2013/2013-preview.mp3');
const errorSound = new Audio('https://assets.mixkit.co/active_storage/sfx/2003/2003-preview.mp3');

// Ses seviyesini biraz kısalım (isteğe bağlı)
correctSound.volume = 0.5;
errorSound.volume = 0.5;
let isMuted = false;

// Sayfa yüklendiğinde butonun çalışmasını sağla
window.addEventListener('DOMContentLoaded', () => {
    const muteBtn = document.getElementById('mute-btn');
    if (muteBtn) {
        muteBtn.onclick = () => {
            isMuted = !isMuted;
            muteBtn.innerText = isMuted ? "🔇" : "🔊";
            // Ses seviyelerini ayarla
            correctSound.muted = isMuted;
            errorSound.muted = isMuted;
            // Butona tıklandığında hafif bir şeffaflık vererek görsel geri bildirim ekleyelim
            muteBtn.style.opacity = isMuted ? "0.6" : "1";
        };
    }
});


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

// Değişkenler
let timerInterval = null; 
let startTime = null;
let selectedSymbol = null;
let selectedName = null;

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

// BAŞLANGIÇ AYARLARI
window.addEventListener('DOMContentLoaded', () => {
    const kaydedilenAd = localStorage.getItem("oyuncuAdi");
    const nameDisplay = document.getElementById("player-name");
    if (kaydedilenAd && nameDisplay) nameDisplay.innerText = kaydedilenAd;
});

// LİDERLİK TABLOSUNU ÇEKME
async function liderlikTablosunuGuncelle() {
    const skorRef = ref(database, 'skorlar');
    // Daha fazla veri çekiyoruz ki içinden benzersiz olanları ayıklayabilelim
    const sorgu = query(skorRef, orderByChild('puan'), limitToLast(50));
    
    try {
        const snapshot = await get(sorgu);
        const tbody = document.getElementById('leaderboard-body');
        if (!tbody) return;
        
        tbody.innerHTML = ""; 
        let tumSkorlar = [];

        snapshot.forEach((childSnapshot) => {
            tumSkorlar.push(childSnapshot.val());
        });

        // Puanları büyükten küçüğe sırala
        tumSkorlar.sort((a, b) => b.puan - a.puan);

        // AYNI İSİMLERİ ELİYECEK MANTIK
        let benzersizSkorlar = [];
        let isimlerSet = new Set();

        for (let s of tumSkorlar) {
            if (!isimlerSet.has(s.isim)) {
                benzersizSkorlar.push(s);
                isimlerSet.add(s.isim);
            }
            if (benzersizSkorlar.length === 10) break; // Sadece ilk 10 benzersiz kişiyi al
        }

        benzersizSkorlar.forEach((skor, index) => {
            const row = `
                <tr>
                    <td style="padding: 8px; border-bottom: 1px solid #eee; text-align: center;">${index + 1}</td>
                    <td style="padding: 8px; border-bottom: 1px solid #eee;">${skor.isim}</td>
                    <td style="padding: 8px; border-bottom: 1px solid #eee; font-weight: bold; color: #e67e22;">${skor.puan}</td>
                </tr>
            `;
            tbody.innerHTML += row;
        });
    } catch (error) {
        console.error("Skorlar çekilirken hata oluştu:", error);
    }
}

// OYUN BİTİŞ PANELİ
window.oyunBittiGoster = function(puan, sure) {
    const panel = document.getElementById('game-over-panel');
    const scoreText = document.getElementById('final-score-text');
    const waBtn = document.getElementById('whatsapp-btn');
    
    if(panel) {
        panel.style.display = 'block'; 
        scoreText.innerHTML = `Tebrikler!<br>${sure} saniyede ${puan} puan topladın!`;
        
        // WHATSAPP LİNKİ DÜZELTİLDİ
        waBtn.onclick = function() {
            const msg = `🧪 Element Avcısı Pro'da ${sure} saniyede ${puan} puan topladım! Beni geçebilir misin? 🚀\n${window.location.origin}`;
            window.open(`https://wa.me/?text=${encodeURIComponent(msg)}`, '_blank');
        };
        
        setTimeout(() => panel.scrollIntoView({ behavior: 'smooth' }), 300);
        liderlikTablosunuGuncelle(); // Tabloyu tazele
    }
}

// SKOR KAYDI
function skoruKaydet(gecenSure, miktar, puan) {
    const oyuncuAdi = localStorage.getItem("oyuncuAdi") || "Misafir";
    set(push(ref(database, 'skorlar')), {
        isim: oyuncuAdi,
        sure: gecenSure,
        adet: miktar,
        puan: puan,
        tarih: new Date().toLocaleString()
    });
}

function shuffle(array) {
    return array.sort(() => Math.random() - 0.5);
}

// OYUNU BAŞLAT
function initGame() {
    const symbolCol = document.getElementById('symbol-col');
    const nameCol = document.getElementById('name-col');
    const rangeVal = parseInt(document.getElementById('elementRange').value) || 118;
    const groupVal = document.getElementById('groupFilter').value;
    const countVal = parseInt(document.getElementById('elementCount').value) || 10;
    const panel = document.getElementById('game-over-panel');
    
    if(panel) panel.style.display = 'none';
    if (!symbolCol || !nameCol) return;
    
    symbolCol.innerHTML = '';
    nameCol.innerHTML = '';
    startTime = Date.now();
    
    if (timerInterval) clearInterval(timerInterval);
    timerInterval = setInterval(() => {
        const timerDisplay = document.getElementById('live-timer');
        if (timerDisplay) timerDisplay.innerText = Math.floor((Date.now() - startTime) / 1000);
    }, 1000);
    
    let pool = allElements.slice(0, Math.min(rangeVal, allElements.length));
    if (groupVal !== "all") pool = pool.filter(el => el.g === groupVal);
    
    const gamePool = shuffle([...pool]).slice(0, Math.min(countVal, pool.length));
    
    if (gamePool.length === 0) {
        symbolCol.innerHTML = "<p>Bulunamadı</p>";
        return;
    }
    
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

function checkGameOver() {
    const total = document.querySelectorAll('.card').length;
    const hidden = document.querySelectorAll('.card.hidden').length;
    
    if (hidden === total && total > 0) {
        clearInterval(timerInterval);
        const finalTime = Math.max(1, Math.floor((Date.now() - startTime) / 1000));
        const elementSayisi = total / 2;
        const havuzGenisligi = parseInt(document.getElementById('elementRange').value) || 118;
        const finalPuan = Math.floor(((elementSayisi * 1000) / finalTime) * (1 + (havuzGenisligi / 118)));
        
        skoruKaydet(finalTime, elementSayisi, finalPuan);
        window.oyunBittiGoster(finalPuan, finalTime);
    }
}

function handleCardClick() {
    if (this.classList.contains('hidden') || this.classList.contains('selected')) return;
    
    if (this.dataset.type === 'symbol') {
        if (selectedSymbol) selectedSymbol.classList.remove('selected');
        selectedSymbol = this;
    } else {
        if (selectedName) selectedName.classList.remove('selected');
        selectedName = this;
    }
    
    this.classList.add('selected');
    
    if (selectedSymbol && selectedName) {
        const s = selectedSymbol;
        const n = selectedName;
        
        if (s.dataset.match === n.dataset.match) {
            // DOĞRU EŞLEŞME
            if (!isMuted) correctSound.play(); // Sadece sessizde değilse çal
            s.classList.add('correct-flash');
            n.classList.add('correct-flash');
            setTimeout(() => {
                s.classList.add('hidden');
                n.classList.add('hidden');
                checkGameOver();
            }, 400);
        } else {
            // YANLIŞ EŞLEŞME
            if (!isMuted) errorSound.play(); // Sadece sessizde değilse çal
            s.classList.add('error-shake');
            n.classList.add('error-shake');
            setTimeout(() => {
                s.classList.remove('selected', 'error-shake');
                n.classList.remove('selected', 'error-shake');
            }, 500);
        }
        selectedSymbol = null;
        selectedName = null;
    }
}

window.initGame = initGame;
window.onload = initGame;
