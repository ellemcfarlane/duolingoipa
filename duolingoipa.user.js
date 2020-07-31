// ==UserScript==
// @name         duolingoipa
// @namespace    http://tampermonkey.net/
// @version      1.0.1
// @description  displays German IPA for Duolingo
// @author       Elle McFarlane
// @match        https://www.duolingo.com/*
// @grant        GM.xmlHttpRequest
// @require      http://ajax.googleapis.com/ajax/libs/jquery/3.3.1/jquery.min.js
// @downloadURL  https://gist.github.com/ellemcfarlane/5a9dd00c7a0290415848f745ecd97917/raw/duolingoipa.user.js
// @updateURL  https://gist.github.com/ellemcfarlane/5a9dd00c7a0290415848f745ecd97917/raw/duolingoipa.user.js
// ==/UserScript==

// class for Duolingo translate challenge
let TRANSLATE_CHALLENGE = "r8aLd _1givS GbfJe" // challenge-translate-prompt
let WORD = "QXuFD KW8EF _1vU1C"
let INPUT_BOX = "_2mhBk _1JtWw _1tY-d _66Mfn _2NQKM"
let DIALOGUE_BOX = "_3pn3r"

/* Functions for IPA display */

function createAPIUrls() {
    let words = document.getElementsByClassName(WORD);
    let num_words = words.length;
    let urls = new Array(num_words);
    // create API urls for each word on screen
    for (let word_idx = 0; word_idx < num_words; word_idx++) {
        let word = words[word_idx].innerText;
        let url = "https://api.pons.com/v1/dictionary?q=" + word + "&l=dees&in=de";
        urls[word_idx] = url;
    }
    // get IPA for each word
    return urls;
}

function buildFullIPASentence(resps) {
    let num_resps = resps.length;
    let fullIPASentence = "";
    for (let resp_idx = 0; resp_idx < num_resps; resp_idx++) {
        let ipaData = resps[resp_idx];
        let ipaElement = document.createElement("html");
        ipaElement.innerHTML = ipaData[0].hits[0].roms[0].headword_full;
        // get IPA text and add to string fullIPASentence
        let phonetics = ipaElement.getElementsByClassName("phonetics");
        if (phonetics.length > 0) {
            let IPA = phonetics[0].innerText + " ";
            fullIPASentence += IPA;
        }else{
            // IPA not available for word
            fullIPASentence += "❌ ";
        }
    }
    return fullIPASentence;
}

function addFullIPASentenceElemToDOM(fullIPASentence) {
    let fullIPAPara = document.createElement("p");
    let fullIPANode = document.createTextNode(fullIPASentence);
    fullIPAPara.appendChild(fullIPANode);
    let dialogueBox = document.getElementsByClassName(DIALOGUE_BOX)[0];
    let fullIPADiv = document.createElement("div");
    fullIPADiv.classList.add("_IPA_");
    fullIPADiv.appendChild(fullIPAPara);
    dialogueBox.appendChild(fullIPADiv);
}

function getIPAText(url) {
  return new Promise(function(resolve, reject) {
    GM.xmlHttpRequest({
        method: "GET",
        url: url,
        headers: {
            "X-Secret": "YOUR-SECRET-HERE",
        onload: function (xhr) {resolve(xhr.responseText)},
        onerror: reject
    });
  });
}

// processes all definition responses, creates the IPA, and adds to screen
function displayIPA(urls) {
    Promise.all(urls.map(url => getIPAText(url).then(resp => JSON.parse(resp))
                         .catch(error => console.log(error))))
        .then(resps => {
        let fullIPASentence = buildFullIPASentence(resps);
        addFullIPASentenceElemToDOM(fullIPASentence);
    });
}

// oldclass is used to check if challenge is already detected (so onChallenge mutation is not called infinitely)
var oldclass = "";
// calls showIPA to display the IPA when translate challenge is detected
function onChallenge(mutations) {
    let newclass = "";
    // get the translate challenge class if exists
    let challenges = document.getElementsByClassName(TRANSLATE_CHALLENGE);
    let input_boxes = document.getElementsByClassName(INPUT_BOX);
    let translateToLang = "";
    if (input_boxes.length > 0) {
        translateToLang = input_boxes[0].getAttribute("lang");
    }
    if (challenges.length > 0 && translateToLang != "de") {
        newclass = challenges[0].getAttribute("data-test");
        if (newclass != oldclass) {
            oldclass = newclass;
            let challenge = challenges[0];
            // set data-test attribute to oldclass to mark as already detected
            challenge.setAttribute("data-test", oldclass);
            let urls = createAPIUrls();
            displayIPA(urls);
        }
    }else {
        oldclass = "";
    }
}

// observes document body for additions
new MutationObserver(onChallenge).observe(document.body, {
    childList : true,
    subtree : true
});