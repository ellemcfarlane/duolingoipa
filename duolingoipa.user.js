// ==UserScript==
// @name         duolingoipa
// @namespace    http://tampermonkey.net/
// @version      0.1
// @description  displays German IPA for Duolingo
// @author       Elle McFarlane
// @match        https://www.duolingo.com/*
// @grant        GM.xmlHttpRequest
// @require      http://ajax.googleapis.com/ajax/libs/jquery/3.3.1/jquery.min.js
// @downloadURL  https://gist.github.com/ellemcfarlane/5a9dd00c7a0290415848f745ecd97917/raw/duolingoipa.user.js
// ==/UserScript==

// class for Duolingo translate challenge
let TRANSLATE_CHALLENGE = "_3VFHG"

// creates url from each word on page and passes to multiAjax for full IPA display
function showIPA() {
    // create urls for each word on screen
        words = document.getElementsByClassName("TyDwn ");
        var fullIPA = "";
        var IPA = "";
        var wordstrs = "";
        var trueLen = words.length - 1
        var urls = new Array(trueLen);
        for (var i = 0; i < trueLen; i++) {
            var word = words[i].innerText;
            wordstrs += word + " ";
            var url = "https://api.pons.com/v1/dictionary?q=" + word + "&l=dees&in=de";
            urls[i] = url;
        }
    // get IPA for each word
        multiAjax(urls, fullIPA);
}

// adds html element of the IPA for the sentence to the screen
function multiAjax (urls, fullIPA) {
        if (urls.length == 0) {
            var para = document.createElement("p");
            var node = document.createTextNode(fullIPA);
            para.appendChild(node);
            var element = document.getElementsByClassName("_23gwq")[0];
            console.log(element);
            var space = document.createElement("div");
            space.classList.add("_IPA_");
            space.appendChild(para);
            element.appendChild(space);
        }
        else {
            // use ajax for asynch request of url popped from urls list
            ajax(urls.pop())
                .then(function(result) {
                var data = JSON.parse(result)
                var el = document.createElement( 'html' );
                el.innerHTML = data[0].hits[0].roms[0].headword_full;
                var phonetics = el.getElementsByClassName( 'phonetics' );
                if (phonetics.length > 0) {
                    var IPA = phonetics[0].innerText + " ";
                    fullIPA = IPA + fullIPA;
                }else{
                    fullIPA = "n/a " + fullIPA;
                }
                multiAjax(urls, fullIPA);
            })
                .catch(function() {
                console.log("error multiAjax");
            });
        }
}

// uses GM.xmlHTTpRequest to get definition object from PONS and return it in Promise object
function ajax(url) {
  return new Promise(function(resolve, reject) {
    GM.xmlHttpRequest({
        method: "GET",
        url: url,
        headers: {
            "X-Secret": "2d7e168efd03bf5e645e5aa4ad527ee7e960c6fa1598b397d9c99c384fb86efe"},
        onload: function (xhr) {resolve(xhr.responseText)},
        onerror: reject
    });
  });
}

// calls showIPA to display the IPA when translate challenge is detected
var oldclass = "";
function onChallenge(mutations) {
    var newclass = "";
    // get the translate challenge class if exists
    var challenges = document.getElementsByClassName(TRANSLATE_CHALLENGE);
    if (challenges.length > 0) {
        newclass = challenges[0].getAttribute("data-test");
        if (newclass != oldclass) {
            oldclass = newclass;
            if (challenges.length == 0) {
                return;
            }
            var challenge = challenges[0];
            // set data-test attribute to oldclass to mark as already detected
            challenge.setAttribute("data-test", oldclass);
            // display IPA
            showIPA();
        }
    }
}

// observes document body for additions
new MutationObserver(onChallenge).observe(document.body, {
    childList : true,
    subtree : true
});
