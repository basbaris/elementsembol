import { initializeApp } from "https://www.gstatic.com/firebasejs/12.7.0/firebase-app.js";
import { getDatabase, ref, push, get, query, orderByChild, limitToLast, runTransaction } from "https://www.gstatic.com/firebasejs/12.7.0/firebase-database.js";

// --- DİL SİSTEMİ ---
const gameLang = localStorage.getItem("seciliDil") || "tr";
const gameDict = {
    tr: { p: "Oyuncu", r: "Aralık", g: "Grup Filtresi", c: "Kart Cifti", reset: "Yeniden Başlat / Karıştır", guest: "Misafir" },
    en: { p: "Player", r: "Range", g: "Group Filter", c: "Card Pairs", reset: "Restart / Shuffle", guest: "Guest" },
    de: { p: "Spieler", r: "Bereich", g: "Gruppenfilter", c: "Kartendeck", reset: "Neustart / Mischen", guest: "Gast" }
};

document.addEventListener('DOMContentLoaded', () => {
    const g = gameDict[gameLang];

    const mainTitle = document.getElementById('game-main-title');
    if(mainTitle) {
        const titles = { tr: "Element Avcısı", en: "Element Hunter", de: "Element Jäger" };
        mainTitle.innerText = titles[gameLang];
    }

    if(document.getElementById('game-player-label')) document.getElementById('game-player-label').innerText = g.p + ":";
    if(document.getElementById('game-range-label')) document.getElementById('game-range-label').innerText = g.r + ":";
    if(document.getElementById('game-group-label')) document.getElementById('game-group-label').innerText = g.g + ":";
    if(document.getElementById('game-pair-label')) document.getElementById('game-pair-label').innerText = g.c + ":";
    if(document.getElementById('reset-btn-text')) document.getElementById('reset-btn-text').innerText = g.reset;

    const select = document.getElementById('groupFilter');
    if(select) {
        const gruplar = {
            tr: [
                ["all","Hepsi 🌐"], 
                ["nonmetal","Ametaller 🔴"], 
                ["noble","Soygazlar 🟣"], 
                ["alkali","Alkali Metaller 🟠"], 
                ["earth","Toprak Alkali 🔵"], 
                ["metalloid","Yarı Metaller 🟢"], 
                ["transition","Geçiş Metalleri ⚫"], 
                ["post-transition","Zayıf Metaller 🟣"], 
                ["halogen", "Halojenler 🟡"], 
                ["lanthanide","Lantanitler 🟤"], 
                ["actinide","Aktinitler 🟢"]
            ],
            en: [
                ["all","All 🌐"], 
                ["nonmetal","Nonmetals 🔴"], 
                ["noble","Noble Gases 🟣"], 
                ["alkali","Alkali Metals 🟠"], 
                ["earth","Alkaline Earth 🔵"], 
                ["metalloid","Metalloids 🟢"], 
                ["transition","Transition Metals ⚫"], 
                ["post-transition","Post-transition 🟣"], 
                ["halogen", "Halogens 🟡"], 
                ["lanthanide","Lanthanides 🟤"], 
                ["actinide","Actinides 🟢"]
            ],
            de: [
                ["all","Alle 🌐"], 
                ["nonmetal","Nichtmetalle 🔴"], 
                ["noble","Edelgase 🟣"], 
                ["alkali","Alkalimetalle 🟠"], 
                ["earth","Erdalkalimetalle 🔵"], 
                ["metalloid","Halbmetalle 🟢"], 
                ["transition","Übergangsmetalle ⚫"], 
                ["post-transition","Schwachmetalle 🟣"], 
                ["halogen", "Halogene 🟡"], 
                ["lanthanide","Lanthanoide 🟤"], 
                ["actinide","Actinoide 🟢"]
            ]
        };

        select.innerHTML = gruplar[gameLang].map(item => `<option value="${item[0]}">${item[1]}</option>`).join('');
    }
});

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

function ziyaretciArtir() {
    const currentLang = localStorage.getItem("seciliDil") || "tr";
    const guestLabel = gameDict[currentLang]?.guest || "Misafir";
    
    const ziyaretRef = ref(database, 'ziyaretciSayisi');
    runTransaction(ziyaretRef, (currentValue) => {
        return (currentValue || 0) + 1;
    });
    const listeRef = ref(database, 'ziyaretciler');
    push(listeRef, {
        tarih: new Date().toLocaleString(),
        isim: localStorage.getItem("oyuncuAdi") || guestLabel
    });
}

// --- DEĞİŞKENLER ---
let timerInterval, hamleInterval, gameStartTime, startTime, selectedSymbol, selectedName;
let puan = 0, can = 3, timerStarted = false, gameActive = true, isMuted = false; let kalanHamleSuresi = 10;
window.isHardMode = false;

const correctSound = new Audio('https://assets.mixkit.co/active_storage/sfx/2013/2013-preview.mp3');
const errorSound = new Audio('https://assets.mixkit.co/active_storage/sfx/2003/2003-preview.mp3');

const allElements = [
    { no: 1, sembol: "H", ad: { tr: "Hidrojen", en: "Hydrogen", de: "Wasserstoff" }, grup: { tr: "nonmetal", en: "nonmetal", de: "nonmetal" } },
    { no: 2, sembol: "He", ad: { tr: "Helyum", en: "Helium", de: "Helium" }, grup: { tr: "noble", en: "noble", de: "noble" } },
    { no: 3, sembol: "Li", ad: { tr: "Lityum", en: "Lithium", de: "Lithium" }, grup: { tr: "alkali", en: "alkali", de: "alkali" } },
    { no: 4, sembol: "Be", ad: { tr: "Berilyum", en: "Beryllium", de: "Beryllium" }, grup: { tr: "earth", en: "earth", de: "earth" } },
    { no: 5, sembol: "B", ad: { tr: "Bor", en: "Boron", de: "Bor" }, grup: { tr: "metalloid", en: "metalloid", de: "metalloid" } },
    { no: 6, sembol: "C", ad: { tr: "Karbon", en: "Carbon", de: "Kohlenstoff" }, grup: { tr: "nonmetal", en: "nonmetal", de: "nonmetal" } },
    { no: 7, sembol: "N", ad: { tr: "Azot", en: "Nitrogen", de: "Stickstoff" }, grup: { tr: "nonmetal", en: "nonmetal", de: "nonmetal" } },
    { no: 8, sembol: "O", ad: { tr: "Oksijen", en: "Oxygen", de: "Sauerstoff" }, grup: { tr: "nonmetal", en: "nonmetal", de: "nonmetal" } },
    { no: 9, sembol: "F", ad: { tr: "Flor", en: "Fluorine", de: "Fluor" }, grup: { tr: "halogen", en: "halogen", de: "halogen" } },
    { no: 10, sembol: "Ne", ad: { tr: "Neon", en: "Neon", de: "Neon" }, grup: { tr: "noble", en: "noble", de: "noble" } },
    { no: 11, sembol: "Na", ad: { tr: "Sodyum", en: "Sodium", de: "Natrium" }, grup: { tr: "alkali", en: "alkali", de: "alkali" } },
    { no: 12, sembol: "Mg", ad: { tr: "Magnezyum", en: "Magnesium", de: "Magnesium" }, grup: { tr: "earth", en: "earth", de: "earth" } },
    { no: 13, sembol: "Al", ad: { tr: "Alüminyum", en: "Aluminum", de: "Aluminium" }, grup: { tr: "post-transition", en: "post-transition", de: "post-transition" } },
    { no: 14, sembol: "Si", ad: { tr: "Silisyum", en: "Silicon", de: "Silicium" }, grup: { tr: "metalloid", en: "metalloid", de: "metalloid" } },
    { no: 15, sembol: "P", ad: { tr: "Fosfor", en: "Phosphorus", de: "Phosphor" }, grup: { tr: "nonmetal", en: "nonmetal", de: "nonmetal" } },
    { no: 16, sembol: "S", ad: { tr: "Kükürt", en: "Sulfur", de: "Schwefel" }, grup: { tr: "nonmetal", en: "nonmetal", de: "nonmetal" } },
    { no: 17, sembol: "Cl", ad: { tr: "Klor", en: "Chlorine", de: "Chlor" }, grup: { tr: "halogen", en: "halogen", de: "halogen" } },
    { no: 18, sembol: "Ar", ad: { tr: "Argon", en: "Argon", de: "Argon" }, grup: { tr: "noble", en: "noble", de: "noble" } },
    { no: 19, sembol: "K", ad: { tr: "Potasyum", en: "Potassium", de: "Kalium" }, grup: { tr: "alkali", en: "alkali", de: "alkali" } },
    { no: 20, sembol: "Ca", ad: { tr: "Kalsiyum", en: "Calcium", de: "Calcium" }, grup: { tr: "earth", en: "earth", de: "earth" } },
    { no: 21, sembol: "Sc", ad: { tr: "Skandiyum", en: "Scandium", de: "Scandium" }, grup: { tr: "transition", en: "transition", de: "transition" } },
    { no: 22, sembol: "Ti", ad: { tr: "Titanyum", en: "Titanium", de: "Titan" }, grup: { tr: "transition", en: "transition", de: "transition" } },
    { no: 23, sembol: "V", ad: { tr: "Vanadyum", en: "Vanadium", de: "Vanadium" }, grup: { tr: "transition", en: "transition", de: "transition" } },
    { no: 24, sembol: "Cr", ad: { tr: "Krom", en: "Chromium", de: "Chrom" }, grup: { tr: "transition", en: "transition", de: "transition" } },
    { no: 25, sembol: "Mn", ad: { tr: "Manganez", en: "Manganese", de: "Mangan" }, grup: { tr: "transition", en: "transition", de: "transition" } },
    { no: 26, sembol: "Fe", ad: { tr: "Demir", en: "Iron", de: "Eisen" }, grup: { tr: "transition", en: "transition", de: "transition" } },
    { no: 27, sembol: "Co", ad: { tr: "Kobalt", en: "Cobalt", de: "Kobalt" }, grup: { tr: "transition", en: "transition", de: "transition" } },
    { no: 28, sembol: "Ni", ad: { tr: "Nikel", en: "Nickel", de: "Nickel" }, grup: { tr: "transition", en: "transition", de: "transition" } },
    { no: 29, sembol: "Cu", ad: { tr: "Bakır", en: "Copper", de: "Kupfer" }, grup: { tr: "transition", en: "transition", de: "transition" } },
    { no: 30, sembol: "Zn", ad: { tr: "Çinko", en: "Zinc", de: "Zink" }, grup: { tr: "transition", en: "transition", de: "transition" } },
    { no: 31, sembol: "Ga", ad: { tr: "Galyum", en: "Gallium", de: "Gallium" }, grup: { tr: "post-transition", en: "post-transition", de: "post-transition" } },
    { no: 32, sembol: "Ge", ad: { tr: "Germanyum", en: "Germanium", de: "Germanium" }, grup: { tr: "metalloid", en: "metalloid", de: "metalloid" } },
    { no: 33, sembol: "As", ad: { tr: "Arsenik", en: "Arsenic", de: "Arsen" }, grup: { tr: "metalloid", en: "metalloid", de: "metalloid" } },
    { no: 34, sembol: "Se", ad: { tr: "Selenyum", en: "Selenium", de: "Selen" }, grup: { tr: "nonmetal", en: "nonmetal", de: "nonmetal" } },
    { no: 35, sembol: "Br", ad: { tr: "Brom", en: "Bromine", de: "Brom" }, grup: { tr: "halogen", en: "halogen", de: "halogen" } },
    { no: 36, sembol: "Kr", ad: { tr: "Kripton", en: "Krypton", de: "Krypton" }, grup: { tr: "noble", en: "noble", de: "noble" } },
    { no: 37, sembol: "Rb", ad: { tr: "Rubidyum", en: "Rubidium", de: "Rubidium" }, grup: { tr: "alkali", en: "alkali", de: "alkali" } },
    { no: 38, sembol: "Sr", ad: { tr: "Stronsiyum", en: "Strontium", de: "Strontium" }, grup: { tr: "earth", en: "earth", de: "earth" } },
    { no: 39, sembol: "Y", ad: { tr: "İtriyum", en: "Yttrium", de: "Yttrium" }, grup: { tr: "transition", en: "transition", de: "transition" } },
    { no: 40, sembol: "Zr", ad: { tr: "Zirkonyum", en: "Zirconium", de: "Zirconium" }, grup: { tr: "transition", en: "transition", de: "transition" } },
    { no: 41, sembol: "Nb", ad: { tr: "Niobyum", en: "Niobium", de: "Niob" }, grup: { tr: "transition", en: "transition", de: "transition" } },
    { no: 42, sembol: "Mo", ad: { tr: "Molibden", en: "Molybdenum", de: "Molybdän" }, grup: { tr: "transition", en: "transition", de: "transition" } },
    { no: 43, sembol: "Tc", ad: { tr: "Teknesyum", en: "Technetium", de: "Technetium" }, grup: { tr: "transition", en: "transition", de: "transition" } },
    { no: 44, sembol: "Ru", ad: { tr: "Rutenyum", en: "Ruthenium", de: "Ruthenium" }, grup: { tr: "transition", en: "transition", de: "transition" } },
    { no: 45, sembol: "Rh", ad: { tr: "Rodyum", en: "Rhodium", de: "Rhodium" }, grup: { tr: "transition", en: "transition", de: "transition" } },
    { no: 46, sembol: "Pd", ad: { tr: "Paladyum", en: "Palladium", de: "Palladium" }, grup: { tr: "transition", en: "transition", de: "transition" } },
    { no: 47, sembol: "Ag", ad: { tr: "Gümüş", en: "Silver", de: "Silber" }, grup: { tr: "transition", en: "transition", de: "transition" } },
    { no: 48, sembol: "Cd", ad: { tr: "Kadmiyum", en: "Cadmium", de: "Cadmium" }, grup: { tr: "transition", en: "transition", de: "transition" } },
    { no: 49, sembol: "In", ad: { tr: "İndiyum", en: "Indium", de: "Indium" }, grup: { tr: "post-transition", en: "post-transition", de: "post-transition" } },
    { no: 50, sembol: "Sn", ad: { tr: "Kalay", en: "Tin", de: "Zinn" }, grup: { tr: "post-transition", en: "post-transition", de: "post-transition" } },
    { no: 51, sembol: "Sb", ad: { tr: "Antimon", en: "Antimony", de: "Antimon" }, grup: { tr: "metalloid", en: "metalloid", de: "metalloid" } },
    { no: 52, sembol: "Te", ad: { tr: "Tellür", en: "Tellurium", de: "Tellur" }, grup: { tr: "metalloid", en: "metalloid", de: "metalloid" } },
    { no: 53, sembol: "I", ad: { tr: "İyot", en: "Iodine", de: "Iod" }, grup: { tr: "halogen", en: "halogen", de: "halogen" } },
    { no: 54, sembol: "Xe", ad: { tr: "Ksenon", en: "Xenon", de: "Xenon" }, grup: { tr: "noble", en: "noble", de: "noble" } },
    { no: 55, sembol: "Cs", ad: { tr: "Sezyum", en: "Cesium", de: "Caesium" }, grup: { tr: "alkali", en: "alkali", de: "alkali" } },
    { no: 56, sembol: "Ba", ad: { tr: "Baryum", en: "Barium", de: "Barium" }, grup: { tr: "earth", en: "earth", de: "earth" } },
    { no: 57, sembol: "La", ad: { tr: "Lantan", en: "Lanthanum", de: "Lanthan" }, grup: { tr: "lanthanide", en: "lanthanide", de: "lanthanide" } },
    { no: 58, sembol: "Ce", ad: { tr: "Seryum", en: "Cerium", de: "Cer" }, grup: { tr: "lanthanide", en: "lanthanide", de: "lanthanide" } },
    { no: 59, sembol: "Pr", ad: { tr: "Praseodim", en: "Praseodymium", de: "Praseodym" }, grup: { tr: "lanthanide", en: "lanthanide", de: "lanthanide" } },
    { no: 60, sembol: "Nd", ad: { tr: "Neodimyum", en: "Neodymium", de: "Neodym" }, grup: { tr: "lanthanide", en: "lanthanide", de: "lanthanide" } },
    { no: 61, sembol: "Pm", ad: { tr: "Prometyum", en: "Promethium", de: "Promethium" }, grup: { tr: "lanthanide", en: "lanthanide", de: "lanthanide" } },
    { no: 62, sembol: "Sm", ad: { tr: "Samaryum", en: "Samarium", de: "Samarium" }, grup: { tr: "lanthanide", en: "lanthanide", de: "lanthanide" } },
    { no: 63, sembol: "Eu", ad: { tr: "Europiyum", en: "Europium", de: "Europium" }, grup: { tr: "lanthanide", en: "lanthanide", de: "lanthanide" } },
    { no: 64, sembol: "Gd", ad: { tr: "Gadolinyum", en: "Gadolinium", de: "Gadolinium" }, grup: { tr: "lanthanide", en: "lanthanide", de: "lanthanide" } },
    { no: 65, sembol: "Tb", ad: { tr: "Terbiyum", en: "Terbium", de: "Terbium" }, grup: { tr: "lanthanide", en: "lanthanide", de: "lanthanide" } },
    { no: 66, sembol: "Dy", ad: { tr: "Disprozyum", en: "Dysprosium", de: "Dysprosium" }, grup: { tr: "lanthanide", en: "lanthanide", de: "lanthanide" } },
    { no: 67, sembol: "Ho", ad: { tr: "Holmiyum", en: "Holmium", de: "Holmium" }, grup: { tr: "lanthanide", en: "lanthanide", de: "lanthanide" } },
    { no: 68, sembol: "Er", ad: { tr: "Erbiyum", en: "Erbium", de: "Erbium" }, grup: { tr: "lanthanide", en: "lanthanide", de: "lanthanide" } },
    { no: 69, sembol: "Tm", ad: { tr: "Tulyum", en: "Thulium", de: "Thulium" }, grup: { tr: "lanthanide", en: "lanthanide", de: "lanthanide" } },
    { no: 70, sembol: "Yb", ad: { tr: "İtterbiyum", en: "Ytterbium", de: "Ytterbium" }, grup: { tr: "lanthanide", en: "lanthanide", de: "lanthanide" } },
    { no: 71, sembol: "Lu", ad: { tr: "Lutesyum", en: "Lutetium", de: "Lutetium" }, grup: { tr: "lanthanide", en: "lanthanide", de: "lanthanide" } },
    { no: 72, sembol: "Hf", ad: { tr: "Hafniyum", en: "Hafnium", de: "Hafnium" }, grup: { tr: "transition", en: "transition", de: "transition" } },
    { no: 73, sembol: "Ta", ad: { tr: "Tantal", en: "Tantalum", de: "Tantal" }, grup: { tr: "transition", en: "transition", de: "transition" } },
    { no: 74, sembol: "W", ad: { tr: "Volfram", en: "Tungsten", de: "Wolfram" }, grup: { tr: "transition", en: "transition", de: "transition" } },
    { no: 75, sembol: "Re", ad: { tr: "Renyum", en: "Rhenium", de: "Rhenium" }, grup: { tr: "transition", en: "transition", de: "transition" } },
    { no: 76, sembol: "Os", ad: { tr: "Osmiyum", en: "Osmium", de: "Osmium" }, grup: { tr: "transition", en: "transition", de: "transition" } },
    { no: 77, sembol: "Ir", ad: { tr: "İridyum", en: "Iridium", de: "Iridium" }, grup: { tr: "transition", en: "transition", de: "transition" } },
    { no: 78, sembol: "Pt", ad: { tr: "Platin", en: "Platinum", de: "Platin" }, grup: { tr: "transition", en: "transition", de: "transition" } },
    { no: 79, sembol: "Au", ad: { tr: "Altın", en: "Gold", de: "Gold" }, grup: { tr: "transition", en: "transition", de: "transition" } },
    { no: 80, sembol: "Hg", ad: { tr: "Cıva", en: "Mercury", de: "Quecksilber" }, grup: { tr: "transition", en: "transition", de: "transition" } },
    { no: 81, sembol: "Tl", ad: { tr: "Talyum", en: "Thallium", de: "Thallium" }, grup: { tr: "post-transition", en: "post-transition", de: "post-transition" } },
    { no: 82, sembol: "Pb", ad: { tr: "Kurşun", en: "Lead", de: "Blei" }, grup: { tr: "post-transition", en: "post-transition", de: "post-transition" } },
    { no: 83, sembol: "Bi", ad: { tr: "Bizmut", en: "Bismuth", de: "Wismut" }, grup: { tr: "post-transition", en: "post-transition", de: "post-transition" } },
    { no: 84, sembol: "Po", ad: { tr: "Polonyum", en: "Polonium", de: "Polonium" }, grup: { tr: "metalloid", en: "metalloid", de: "metalloid" } },
    { no: 85, sembol: "At", ad: { tr: "Astatin", en: "Astatine", de: "Astat" }, grup: { tr: "halogen", en: "halogen", de: "halogen" } },
    { no: 86, sembol: "Rn", ad: { tr: "Radon", en: "Radon", de: "Radon" }, grup: { tr: "noble", en: "noble", de: "noble" } },
    { no: 87, sembol: "Fr", ad: { tr: "Fransiyum", en: "Francium", de: "Francium" }, grup: { tr: "alkali", en: "alkali", de: "alkali" } },
    { no: 88, sembol: "Ra", ad: { tr: "Radyum", en: "Radium", de: "Radium" }, grup: { tr: "earth", en: "earth", de: "earth" } },
    { no: 89, sembol: "Ac", ad: { tr: "Aktinyum", en: "Actinium", de: "Actinium" }, grup: { tr: "actinide", en: "actinide", de: "actinide" } },
    { no: 90, sembol: "Th", ad: { tr: "Toryum", en: "Thorium", de: "Thorium" }, grup: { tr: "actinide", en: "actinide", de: "actinide" } },
    { no: 91, sembol: "Pa", ad: { tr: "Protaktinyum", en: "Protactinium", de: "Protactinium" }, grup: { tr: "actinide", en: "actinide", de: "actinide" } },
    { no: 92, sembol: "U", ad: { tr: "Uranyum", en: "Uranium", de: "Uran" }, grup: { tr: "actinide", en: "actinide", de: "actinide" } },
    { no: 93, sembol: "Np", ad: { tr: "Neptünyum", en: "Neptunium", de: "Neptunium" }, grup: { tr: "actinide", en: "actinide", de: "actinide" } },
    { no: 94, sembol: "Pu", ad: { tr: "Plütonyum", en: "Plutonium", de: "Plutonium" }, grup: { tr: "actinide", en: "actinide", de: "actinide" } },
    { no: 95, sembol: "Am", ad: { tr: "Amerikyum", en: "Americium", de: "Americium" }, grup: { tr: "actinide", en: "actinide", de: "actinide" } },
    { no: 96, sembol: "Cm", ad: { tr: "Küriyum", en: "Curium", de: "Curium" }, grup: { tr: "actinide", en: "actinide", de: "actinide" } },
    { no: 97, sembol: "Bk", ad: { tr: "Berkelyum", en: "Berkelium", de: "Berkelium" }, grup: { tr: "actinide", en: "actinide", de: "actinide" } },
    { no: 98, sembol: "Cf", ad: { tr: "Kaliforniyum", en: "Californium", de: "Californium" }, grup: { tr: "actinide", en: "actinide", de: "actinide" } },
    { no: 99, sembol: "Es", ad: { tr: "Aynştaynyum", en: "Einsteinium", de: "Einsteinium" }, grup: { tr: "actinide", en: "actinide", de: "actinide" } },
    { no: 100, sembol: "Fm", ad: { tr: "Fermiyum", en: "Fermium", de: "Fermium" }, grup: { tr: "actinide", en: "actinide", de: "actinide" } },
    { no: 101, sembol: "Md", ad: { tr: "Mendelevyum", en: "Mendelevium", de: "Mendelevium" }, grup: { tr: "actinide", en: "actinide", de: "actinide" } },
    { no: 102, sembol: "No", ad: { tr: "Nobelyum", en: "Nobelium", de: "Nobelium" }, grup: { tr: "actinide", en: "actinide", de: "actinide" } },
    { no: 103, sembol: "Lr", ad: { tr: "Lavrensiyum", en: "Lawrencium", de: "Lawrencium" }, grup: { tr: "actinide", en: "actinide", de: "actinide" } },
    { no: 104, sembol: "Rf", ad: { tr: "Rutherfordiyum", en: "Rutherfordium", de: "Rutherfordium" }, grup: { tr: "transition", en: "transition", de: "transition" } },
    { no: 105, sembol: "Db", ad: { tr: "Dubniyum", en: "Dubnium", de: "Dubnium" }, grup: { tr: "transition", en: "transition", de: "transition" } },
    { no: 106, sembol: "Sg", ad: { tr: "Seaborgiyum", en: "Seaborgium", de: "Seaborgium" }, grup: { tr: "transition", en: "transition", de: "transition" } },
    { no: 107, sembol: "Bh", ad: { tr: "Bohriyum", en: "Bohrium", de: "Bohrium" }, grup: { tr: "transition", en: "transition", de: "transition" } },
    { no: 108, sembol: "Hs", ad: { tr: "Hassiyum", en: "Hassium", de: "Hassium" }, grup: { tr: "transition", en: "transition", de: "transition" } },
    { no: 109, sembol: "Mt", ad: { tr: "Meitneriyum", en: "Meitnerium", de: "Meitnerium" }, grup: { tr: "transition", en: "transition", de: "transition" } },
    { no: 110, sembol: "Ds", ad: { tr: "Darmstadtiyum", en: "Darmstadtium", de: "Darmstadtium" }, grup: { tr: "transition", en: "transition", de: "transition" } },
    { no: 111, sembol: "Rg", ad: { tr: "Röntgenyum", en: "Roentgenium", de: "Roentgenium" }, grup: { tr: "transition", en: "transition", de: "transition" } },
    { no: 112, sembol: "Cn", ad: { tr: "Kopernikyum", en: "Copernicium", de: "Copernicium" }, grup: { tr: "transition", en: "transition", de: "transition" } },
    { no: 113, sembol: "Nh", ad: { tr: "Nihonyum", en: "Nihonium", de: "Nihonium" }, grup: { tr: "post-transition", en: "post-transition", de: "post-transition" } },
    { no: 114, sembol: "Fl", ad: { tr: "Flerovyum", en: "Flerovium", de: "Flerovium" }, grup: { tr: "post-transition", en: "post-transition", de: "post-transition" } },
    { no: 115, sembol: "Mc", ad: { tr: "Moskovyum", en: "Moscovium", de: "Moscovium" }, grup: { tr: "post-transition", en: "post-transition", de: "post-transition" } },
    { no: 116, sembol: "Lv", ad: { tr: "Livermoryum", en: "Livermorium", de: "Livermorium" }, grup: { tr: "post-transition", en: "post-transition", de: "post-transition" } },
    { no: 117, sembol: "Ts", ad: { tr: "Tennessin", en: "Tennessine", de: "Tenness" }, grup: { tr: "halogen", en: "halogen", de: "halogen" } },
    { no: 118, sembol: "Og", ad: { tr: "Oganesson", en: "Oganesson", de: "Oganesson" }, grup: { tr: "noble", en: "noble", de: "noble" } }
];

// --- FIREBASE İŞLEMLERİ ---
async function skoruKaydet(sonPuan) {
    const currentLang = localStorage.getItem("seciliDil") || "tr";
    const guestLabel = gameDict[currentLang]?.guest || "Misafir";
    const isim = localStorage.getItem("oyuncuAdi") || guestLabel;

    try {
        await push(ref(database, 'skorlar'), {
            isim: isim,
            puan: Number(sonPuan),
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

async function oyunuBitir() {
    gameActive = false;
    if (timerInterval) clearInterval(timerInterval);
    
    const currentLang = localStorage.getItem("seciliDil") || "tr";
    const bitisMetinleri = {
        tr: { bitti: "Oyun Bitti!", puan: "Puan", sure: "Süre", sn: "sn", paylas: "Skorunu Paylaş", tablo: "🏆 Dünya Sıralaması", kapat: "Kapat", waText: "Arkadaşlarına Meydan Oku!" },
        en: { bitti: "Game Over!", puan: "Score", sure: "Time", sn: "sec", paylas: "Share Score", tablo: "🏆 World Ranking", kapat: "Close", waText: "Challenge Your Friends!" },
        de: { bitti: "Spiel Vorbei!", puan: "Punkt", sure: "Zeit", sn: "sek", paylas: "Score Teilen", tablo: "🏆 Weltrangliste", kapat: "Schließen", waText: "Fordere deine Freunde heraus!" }
    };
    const bm = bitisMetinleri[currentLang];

    const toplamSure = document.getElementById('live-timer').innerText;
    const finalPuan = puan;
    
    const panel = document.getElementById('game-over-panel');
    const scoreText = document.getElementById('final-score-text');
    const panelTitle = document.querySelector('#game-over-panel h2');
    const waBtnText = document.getElementById('wa-btn-text'); 
    const waBtn = document.getElementById('whatsapp-btn');
    const leaderboardTitle = document.querySelector('#leaderboard-section h3');
    const closeBtn = document.querySelector('#game-over-panel button[onclick*="location.reload()"]');
    
    if (panel && scoreText) {
        panel.style.display = 'block';
        if(panelTitle) panelTitle.innerText = bm.bitti;
        
        // WhatsApp Buton Yazısı ve Dil Desteği
        if(waBtnText) {
            waBtnText.innerText = bm.waText; // Burada 3. maddeyi uyguladık
            waBtnText.style.color = "white";
        }
        
        if(leaderboardTitle) leaderboardTitle.innerText = bm.tablo;
        
        // Kapat Butonunu Ana Sayfaya Yönlendirme (Senin istediğin düzeltme)
        if (closeBtn) {
            closeBtn.innerText = bm.kapat;
            closeBtn.onclick = () => {
                window.location.href = "index.html";
            };
        }
        
        scoreText.innerHTML = `${bm.puan}: <b>${finalPuan}</b> <br> ${bm.sure}: <b>${toplamSure}</b> ${bm.sn}`;
    }

    // Oyun Sonu WhatsApp Paylaşım Linki
    if (waBtn) {
        waBtn.onclick = () => {
            const mesajlar = {
                tr: `Element Avcısı Pro'da ${finalPuan} puan topladım! 🧪 Sen kaç yapabilirsin? 🚀 https://elementsembol.vercel.app`,
                en: `I scored ${finalPuan} points in Element Hunter Pro! 🧪 Can you beat me? 🚀 https://elementsembol.vercel.app`,
                de: `Ich habe ${finalPuan} Punkte in Element Jäger Pro erzielt! 🧪 Schaffst du mehr? 🚀 https://elementsembol.vercel.app`
            };
            window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(mesajlar[currentLang])}`, '_blank');
        };
    }

    await skoruKaydet(finalPuan);
    await liderlikTablosunuGuncelle();

    // Otomatik yönlendirme (3 saniye sonra rekorlar sayfasına atar)
    setTimeout(() => {
        if (document.getElementById('game-over-panel').style.display === 'block') {
            window.location.href = "index.html";
        }
    }, 5000); 
}

function hamleZamanlayiciBaslat() {
    if (hamleInterval) clearInterval(hamleInterval);
    const wrapper = document.getElementById('progress-wrapper');
    const bar = document.getElementById('progress-bar');
    const bonusText = document.getElementById('bonus-text');
    if (wrapper) wrapper.style.display = 'block';
    kalanHamleSuresi = 10;
    hamleInterval = setInterval(() => {
        kalanHamleSuresi -= 0.1;
        let yuzde = (kalanHamleSuresi / 10) * 100;
        if (bar) {
            bar.style.width = yuzde + "%";
            if (yuzde > 60) bar.style.backgroundColor = "#27ae60";
            else if (yuzde > 30) bar.style.backgroundColor = "#f1c40f";
            else bar.style.backgroundColor = "#e74c3c";
        }
        if (bonusText) bonusText.innerText = "%" + Math.max(0, Math.floor(yuzde));
        if (kalanHamleSuresi <= 0) clearInterval(hamleInterval);
    }, 100);
}

function initGame() {
    isHardMode = localStorage.getItem('zorModSecimi') === 'true';
    const currentLang = localStorage.getItem("seciliDil") || "tr";
    const arayuzMetinleri = {
        tr: { puan: "Puan", can: "Can", sure: "Süre", bonus: "Hamle Bonusu", sn: "sn" },
        en: { puan: "Score", can: "Lives", sure: "Time", bonus: "Move Bonus", sn: "sec" },
        de: { puan: "Punkt", can: "Leben", sure: "Zeit", bonus: "Zugbonus", sn: "sek" }
    };
    const m = arayuzMetinleri[currentLang];

    if(document.getElementById('label-puan')) document.getElementById('label-puan').innerText = m.puan;
    if(document.getElementById('label-can')) document.getElementById('label-can').innerText = m.can;
    if(document.getElementById('label-sure')) document.getElementById('label-sure').innerText = m.sure;
    if(document.getElementById('label-hamle-bonusu')) document.getElementById('label-hamle-bonusu').innerText = m.bonus + ":";
    if(document.getElementById('label-sn-unit')) document.getElementById('label-sn-unit').innerText = m.sn;
 
    if (hamleInterval) clearInterval(hamleInterval);
    if (timerInterval) clearInterval(timerInterval);
    
    const sCol = document.getElementById('symbol-col');
    const nCol = document.getElementById('name-col');
    if (!sCol || !nCol) return;

    puan = 0; can = 3; timerStarted = false; gameActive = true;
    document.getElementById('puan-degeri').innerText = "0";
    document.getElementById('can-degeri').innerText = "❤️".repeat(3);
    document.getElementById('live-timer').innerText = "0";

    const range = parseInt(document.getElementById('elementRange').value) || 118;
    const count = parseInt(document.getElementById('elementCount').value) || 10;
    const group = document.getElementById('groupFilter').value;

    let pool = allElements.slice(0, range);
    if (group !== "all") pool = pool.filter(el => el.grup.en === group);
    
    const gamePool = pool.sort(() => Math.random() - 0.5).slice(0, count);
    sCol.innerHTML = ''; nCol.innerHTML = '';

    gamePool.sort(() => Math.random() - 0.5).forEach(el => {
        sCol.appendChild(createCard(el.sembol, 'symbol', el.sembol, el.grup.en, isHardMode));
    });
    gamePool.sort(() => Math.random() - 0.5).forEach(el => {
        nCol.appendChild(createCard(el.ad, 'name', el.sembol, el.grup.en, isHardMode));
    });
    
    if (typeof liderlikTablosunuGuncelle === "function") liderlikTablosunuGuncelle();
}

function createCard(txt, type, mid, grp, zorModMu) {
    const d = document.createElement('div');
    d.classList.add('card');
    
    // ZOR MOD KONTROLÜ
    // Hem parametreyi, hem hafızayı, hem de global değişkeni kontrol eder
    const isHard = zorModMu === true || 
                   localStorage.getItem('zorModSecimi') === 'true' || 
                   window.isHardMode === true;

    if (isHard) {
        // Zor moddaysa renk grubunu ekleme, sadece hard-mode sınıfını ekle
        d.classList.add('hard-mode');
    } else if (grp) {
        // Zor mod değilse normal renk grubunu ekle
        d.classList.add(`group-${grp}`);
    }
    
    const dil = localStorage.getItem("seciliDil") || "tr";
    if (type === 'name') {
        d.innerText = (typeof txt === 'object') ? (txt[dil] || txt["tr"]) : txt; 
    } else {
        d.innerText = txt;
    }
    d.dataset.match = mid;
    d.dataset.type = type;
    d.onclick = handleCardClick;
    return d;
}



function handleCardClick() {
    if (!gameActive || this.classList.contains('hidden') || this.classList.contains('selected')) return;
    const zorModAktifMi = localStorage.getItem('zorModSecimi') === 'true';

    if (!timerStarted) {
        timerStarted = true;
        gameStartTime = Date.now();
        hamleZamanlayiciBaslat();
        timerInterval = setInterval(() => {
            const timerEl = document.getElementById('live-timer-text');
            if(timerEl) timerEl.innerText = Math.floor((Date.now() - gameStartTime) / 1000);
        }, 1000);
    }

    if (this.dataset.type === 'symbol') {
        if (selectedSymbol) {
            selectedSymbol.classList.remove('selected');
            if (zorModAktifMi) { selectedSymbol.style.outline = ""; selectedSymbol.style.boxShadow = ""; }
        }
        selectedSymbol = this;
    } else {
        if (selectedName) {
            selectedName.classList.remove('selected');
            if (zorModAktifMi) { selectedName.style.outline = ""; selectedName.style.boxShadow = ""; }
        }
        selectedName = this;
    }

    this.classList.add('selected');
    if (zorModAktifMi) {
        this.style.setProperty("outline", "3px solid #f1c40f", "important");
        this.style.setProperty("box-shadow", "0 0 20px #f1c40f", "important");
    }

    if (selectedSymbol && selectedName) {
        const s = selectedSymbol, n = selectedName;
        if (s.dataset.match === n.dataset.match) {
            if (!isMuted) correctSound.play();
            let bonusCarpani = Math.max(0.1, kalanHamleSuresi / 10);
            let temelPuan = 1000;
            let havuzGenisligi = parseInt(document.getElementById('elementRange').value) || 118;
            let yeniPuan = Math.floor(temelPuan * bonusCarpani * (1 + (havuzGenisligi / 118)));
            if (zorModAktifMi) yeniPuan = yeniPuan * 2;
            puan += yeniPuan;
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
            if (zorModAktifMi) { s.style.outline = ""; s.style.boxShadow = ""; n.style.outline = ""; n.style.boxShadow = ""; }
            const tempS = s, tempN = n;
            selectedSymbol = null; selectedName = null;
            if (can <= 0) { 
                if (hamleInterval) clearInterval(hamleInterval);
                setTimeout(() => { oyunuBitir(); }, 500);
            } else {
                setTimeout(() => { tempS.classList.remove('selected', 'error-shake'); tempN.classList.remove('selected', 'error-shake'); }, 500);
            }
        }
    }
}

window.addEventListener('DOMContentLoaded', () => {
    ziyaretciArtir();
    const mBtn = document.getElementById('mute-btn');
    if (mBtn) mBtn.onclick = () => { isMuted = !isMuted; mBtn.innerText = isMuted ? "🔇" : "🔊"; };

    const pDisp = document.getElementById("player-name");
    if (pDisp) {
        const currentLang = localStorage.getItem("seciliDil") || "tr";
        const guestText = gameDict[currentLang]?.guest || "Misafir";
        pDisp.innerText = localStorage.getItem("oyuncuAdi") || guestText;
    }

    if (document.querySelector('.game-container')) initGame();
});

    // WhatsApp Paylaşım Fonksiyonu
    const waBtn = document.getElementById('main-wa-share');
    if (waBtn) {
        waBtn.onclick = function() {
            const lang = localStorage.getItem("seciliDil") || "tr";
            const messages = {
                tr: "Element Avcısı'nda kimya rekorlarını altüst ediyorum! 🧪 Sen kaç puan yapabilirsin? Hemen dene: https://elementsembol.vercel.app",
                en: "I'm breaking chemistry records in Element Hunter Pro! 🧪 Can you beat my score? Try now: https://elementsembol.vercel.app",
                de: "Ich breche Chemie-Rekorde in Element Jäger Pro! 🧪 Kannst du meine Punktzahl schlagen? Jetzt probieren: https://elementsembol.vercel.app"
            };
            window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(messages[lang])}`, '_blank');
        };
    }

// script.js içindeki setLanguage fonksiyonunun en doğru hali:
function setLanguage(lang) {
    // 1. Seçilen dili hafızaya kaydet
    localStorage.setItem("seciliDil", lang);
    
    // 2. Sayfadaki butonların aktiflik durumunu güncelle (Görsel geri bildirim)
    document.querySelectorAll('.language-selector button').forEach(btn => {
        btn.classList.remove('active');
        const bayrak = (lang === 'tr' ? '🇹🇷' : lang === 'en' ? '🇺🇸' : '🇩🇪');
        if (btn.innerText.includes(bayrak)) btn.classList.add('active');
    });

    // 3. EĞER index.html sayfasındaysak arayüzü güncelle
    // (Aşağıdaki kontrol döngüye girmeyi engeller)
    if (typeof updateIndexPageLabels === 'function') {
        updateIndexPageLabels(lang);
    }
    
    // 4. EĞER game.html sayfasındaysak oyunu veya etiketleri güncelle
    if (document.querySelector('.game-container')) {
        initGame(); // Oyunu yeni dille tekrar başlatır veya etiketleri günceller
    }
}

// Fonksiyonları global yapalım
window.setLanguage = setLanguage;
window.initGame = initGame;
