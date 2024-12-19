import { startRecording, playLatestVoicemail } from './voicemail.js';


class TreeElement {
    constructor(el, parent = undefined) {
        this.type = el.getAttribute('data-type');
        // if link, content is URL, else it is first thing uttered
        if (this.type == "text") {
            this.content = el.querySelector(".content").innerText;
        } else if (this.type == "link") {
            this.content = el.querySelector("a").href;
        } else if (this.type == "voicemail") {
            this.content = el.querySelector(".content").innerText;
        }

        this.parent = parent;
        this.label = el.getAttribute('data-label');

        const HTMLchildren = Array.from(el.querySelectorAll(":scope > .node"))
        this.children = HTMLchildren.map(childEl => {
            return new TreeElement(childEl, this);
        })
    }
}

function generateMessage(node) {
    let childrenMessage = "";
    let menuOptions = "";
    for (let i = 0; i < node.children.length; i++) {
        childrenMessage = childrenMessage + ` Press ${i + 1} for ${node.children[i].label}. `;
        menuOptions = menuOptions + `${i + 1}: ${node.children[i].label}<br>`;
    }
    currentMenu = `menu: ${node.label} <br>`
    let zeroButtonMessage;
    if (node.label === 'home') {
        zeroButtonMessage = "";
    } else {
        zeroButtonMessage = "Press 0 to go back. ";
    }

    let myMessage = childrenMessage + zeroButtonMessage + "Press asterisk to repeat.";
    menuOptions = currentMenu + menuOptions + `<br> {0: return ; *: repeat}`
    return {
        audioMessage: myMessage,
        displayMenu: menuOptions
    };
}

function createSpeech(text) {
    const sayThis = new SpeechSynthesisUtterance(text)
    //sayThis.voice = speechSynthesis.getVoices()[0]
    sayThis.rate = 0.75
    //sayThis.pitch = 0.8
    return sayThis
}

document.addEventListener('DOMContentLoaded', () => {
    const homeNode = new TreeElement(document.getElementById("home"));
    homeNode.parent = homeNode;

    // play sound
    let message = generateMessage(homeNode)
    let sayThis = createSpeech(homeNode.content + message.audioMessage)
    window.speechSynthesis.speak(sayThis)

    let displayElement = document.getElementById('voicemail-display');
    displayElement.innerHTML = " welcome to my website! \n (under construction) \n turn the volume UP!!!!!! <br>" + message.displayMenu;

    const numContainer = document.querySelector('#numContainer');
    let clickedNum;

    let currentNode = homeNode

    numContainer.addEventListener('click', async (e) => {
        window.speechSynthesis.cancel();
        clickedNum = e.target.dataset.num;

        // Handle asterisk
        if (clickedNum === '*') {
            window.speechSynthesis.speak(sayThis);
            return;
        }

        // Handle numbers
        const num = Number(clickedNum);
        if (!isNaN(num)) {
            if (num === 0) {
                currentNode = currentNode.parent;
            } else if (num <= currentNode.children.length && num > 0) {
                currentNode = currentNode.children[num - 1];
            } else {
                sayThis = createSpeech('invalid number clicked!')
                window.speechSynthesis.speak(sayThis);
                displayElement.innerHTML = 'invalid number clicked :('
                return;
            }

            // Handle node based on type
            if (currentNode.type === 'text') {
                message = generateMessage(currentNode)
                sayThis = createSpeech(currentNode.content + message.audioMessage);
                window.speechSynthesis.speak(sayThis);
                displayElement.innerHTML = message.displayMenu
            } else if (currentNode.type === 'link') {
                window.location.href = currentNode.content;
            }
            else if (currentNode.type === 'voicemail') {
                const action = currentNode.label;
                if (action === 'leave a voicemail') {
                    sayThis = createSpeech( "The voicemail recording is limited to 10 seconds. Remember to leave your name and be cool.")
                    window.speechSynthesis.speak(sayThis);
                    displayElement.innerHTML = 'recording message ...'
                    const isEnded = new Promise((resolve, reject) => {
                        sayThis.onend = resolve
                    })
                    
                    await isEnded
                    await startRecording()
                    displayElement.innerHTML = 'recording completed'
                    
                    sayThis.text = "Done recording. Thanks for leaving a voicemail! To go back, press 0.";
                    window.speechSynthesis.speak(sayThis);

                } else if (action === 'the last voicemail') {
                    const voicemail_text = await playLatestVoicemail()
                    displayElement.innerHTML = voicemail_text;
                    
                    sayThis.text = "These are the latest voicemails. To go back, press 0.";
                    window.speechSynthesis.speak(sayThis);

                }
            }
        } else {
            // Handle any non-number, non-asterisk input
            sayThis.text = 'invalid number clicked!';
            window.speechSynthesis.speak(sayThis);
            displayElement.innerHTML = 'invalid number clicked :('
        }
    });
});