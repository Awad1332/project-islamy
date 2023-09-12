

let hadeathContent = document.querySelector(".hadeath_content");
let prev = document.querySelector("#prev");
let next = document.querySelector("#next");
let num = document.querySelector("#number");

let changer = 0;

function hadeathCollect(){

    fetch("https://api.hadith.gading.dev/books/muslim?range=1-300")
    .then(response => response.json())
    .then(data => {
        let hadithes =data.data.hadiths;
        hadithChanger()

        next.addEventListener("click",() =>{
            changer == 299 ? changer = 0 : changer++
            hadithChanger()
        })
        prev.addEventListener("click",() =>{
            changer == 0 ? changer = 299 : changer--
            hadithChanger()
        })
        function hadithChanger(){
        hadeathContent.innerText = hadithes[changer].arab;
        num.innerHTML = ` 300 - ${changer + 1}`;
        }
    })

}
hadeathCollect();

// videos//////////////
let popup =document.querySelector(".popup_video");
let popupVid =document.querySelector(".popup_video video");
let videos =document.querySelectorAll(".videos video");
let closeVid =document.querySelector(".popup_video span");

videos.forEach(video =>{
    video.addEventListener("click",() =>{
        popup.style.display = "block";
        popupVid.src = video.getAttribute("src");
    })
})

closeVid.addEventListener("click",() => {
    popup.style.display = "none";
    popupVid.src = "";
})


// Api surahs quran///////////////////
let surahContainer = document.querySelector(".surahs_quran");
let popupQuran = document.querySelector(".popup_quran");
let ayatCotent = document.querySelector(".ayat");
let closeBtnPopup = document.querySelector(".icon_close");
function getQuran(){
    fetch("https://api.alquran.cloud/v1/meta")
    .then(response => response.json())
    .then(data => {
        let allSurahs = data.data.surahs.references;
        
        allSurahs.forEach(suraha => {
            surahContainer.innerHTML +=`
                <div class="surah">
                    <p>${suraha.name}</p>
                    <p>${suraha.englishName}</p>
                </div>
            `
        })
        let surahTitle = document.querySelectorAll(".surah");
        surahTitle.forEach((aya,index) => {
            aya.addEventListener("click" , () =>{
                fetch(`https://api.alquran.cloud/v1/surah/${index + 1}`)
                .then(respone => respone.json())
                .then(data => {
                    ayatCotent.innerHTML = "";
                    let ayaht = data.data.ayahs;
                    ayaht.forEach(aya => {
                        popupQuran.classList.add("active");
                        ayatCotent.innerHTML += `
                        <p>(${aya.numberInSurah})- ${aya.text}</p>
                        
                        `;
                    })
                })
            })
        })
        
        
    })
}
getQuran();

closeBtnPopup.addEventListener("click",()=> {
    popupQuran.classList.remove("active");
})

// Api pray time///////////////////////

let preTimeBoxes = document.querySelector(".pre_time_boxes");

function getPrayTime(){
    fetch("https://api.aladhan.com/v1/timingsByCity/03-09-2023?city=cairo&country=egypt&method=8")
    .then(response => response.json())
    .then(data => {
        let preTime = data.data.timings;
        preTimeBoxes.innerHTML =""
        for(let time in preTime){
        preTimeBoxes.innerHTML +=`
                    <div class="box">
                        <h3>${time}</h3>
                        <p>${preTime[time]}</p>
                    </div>
        `
        }
    })
}

getPrayTime();


// toggle 

let toggle = document.querySelector(".icon_toggle");
let menuLinks =document.querySelector(".menu-links");
toggle.addEventListener("click",() => {
    menuLinks.classList.toggle("show");
})
