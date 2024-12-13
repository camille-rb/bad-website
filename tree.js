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
    for (let i = 0; i < node.children.length; i++) {
        childrenMessage = childrenMessage + ` for ${node.children[i].label}, press ${i + 1}.`;
    }

    let zeroButtonMessage;
    if (node.label === 'home') {
        zeroButtonMessage = "";
    } else {
        zeroButtonMessage = " to go back, press 0.";
    }

    let myMessage = childrenMessage + zeroButtonMessage + " to repeat, press asterisk.";
    return myMessage;
}

function createSpeech(text) {
    const sayThis = new SpeechSynthesisUtterance(text)
    //sayThis.voice = speechSynthesis.getVoices()[0]
    sayThis.rate = 0.8
    //sayThis.pitch = 0.8
    return sayThis
}

document.addEventListener('DOMContentLoaded', () => {
    const homeNode = new TreeElement(document.getElementById("home"));
    homeNode.parent = homeNode;

    // play sound
    let sayThis = createSpeech(homeNode.content + generateMessage(homeNode))
    window.speechSynthesis.speak(sayThis)

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
                return;
            }

            // Handle node based on type
            if (currentNode.type === 'text') {
                sayThis = createSpeech(currentNode.content + generateMessage(currentNode));
                window.speechSynthesis.speak(sayThis);
            } else if (currentNode.type === 'link') {
                window.location.href = currentNode.content;
            }
            else if (currentNode.type === 'voicemail') {
                const action = currentNode.label;
                if (action === 'leave a voicemail') {
                    sayThis = createSpeech( "The voicemail recording is limited to 30 seconds. Remember to leave your name and be cool.")
                    window.speechSynthesis.speak(sayThis);

                    const isEnded = new Promise((resolve, reject) => {
                        sayThis.onend = resolve
                    })
                    
                    await isEnded
                    await startRecording()
                    console.log("recording voice completed")
                    
                    sayThis.text = "Done recording. Thanks for leaving a voicemail! To go back, press 0.";
                    window.speechSynthesis.speak(sayThis);

                } else if (action === 'the last voicemail') {
                    const voicemail_text = await playLatestVoicemail()
                    const displayElement = document.getElementById('voicemail-display');
                    if (displayElement) {
                        displayElement.innerHTML = voicemail_text;
                    }
                    sayThis.text = "These are the latest voicemails. To go back, press 0.";
                    window.speechSynthesis.speak(sayThis);

                }
            }
        } else {
            // Handle any non-number, non-asterisk input
            sayThis.text = 'invalid number clicked!';
            window.speechSynthesis.speak(sayThis);
        }
    });
});