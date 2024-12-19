import { startRecording, playLatestVoicemail } from './voicemail.js';
import { friendLinks } from './phonebook.js';

class TreeElement {
    constructor(el, parent = undefined) {
        this.type = el.getAttribute('data-type');
        // if link, content is URL, else it is first thing uttered
        if (this.type == "text" || this.type == "text-display" || this.type == "link-display") {
            this.content = el.querySelector(".content").innerText;
        } else if (this.type == "link") {
            this.content = el.querySelector("a").href;
        } else if (this.type == "voicemail") {
            this.content = el.querySelector(".content").innerText;
        }

        this.parent = parent;
        this.label = el.getAttribute('data-label');

        if (this.type == "link-display") {
            this.displayText = el.querySelector("a").textContent;
        }

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
        if (node.type === 'link-display'){
            menuOptions = menuOptions + `${i + 1}: <a href="${node.children[i].content}">${node.children[i].label}</a><br>`;
        } else {
            childrenMessage = childrenMessage + ` Press ${i + 1} for ${node.children[i].label}. `;
            menuOptions = menuOptions + `${i + 1}: ${node.children[i].label}<br>`;
        }
    }
    let currentMenu = `<strong>current menu </strong>: ${node.label} <br><br>`
    let zeroButtonMessage;
    if (node.label === 'home') {
        zeroButtonMessage = "";
    } else {
        zeroButtonMessage = "Press 0 to go back. ";
    }

    let myMessage = childrenMessage + zeroButtonMessage + "Press asterisk to repeat.";
    menuOptions = currentMenu + menuOptions 
    return {
        audioMessage: myMessage,
        displayMenu: menuOptions
    };
}

function createSpeech(text) {
    if (!('speechSynthesis' in window)) {
        console.error('Speech synthesis not supported');
        return null;
    }
    const sayThis = new SpeechSynthesisUtterance(text);
    sayThis.rate = 0.75;
    sayThis.onerror = (event) => {
        console.error('Speech synthesis error:', event);
    };
    return sayThis;
}

function playTone(audio){
    return new Promise(resolve =>{
      audio.play()
      audio.onended = resolve
    })
  }

function callRandomFriend() {
    const randomIndex = Math.floor(Math.random() * friendLinks.length);
    return friendLinks[randomIndex];
}


document.addEventListener('DOMContentLoaded', () => {

    const startButton = document.createElement('button');
    startButton.textContent = "Click or tap to start";
    startButton.style.position = 'fixed';
    startButton.style.top = '10px';
    startButton.style.left = '50%';
    startButton.style.transform = 'translateX(-50%)';
    startButton.style.zIndex = '1000';
    document.body.appendChild(startButton);

    const friendsContainer = document.getElementById('phonebook-container');
    friendLinks.forEach(friend => {
        friendsContainer.innerHTML += `
            <li class="node" data-type="link" data-label="${friend.name}">
                <a href="${friend.url}">${friend.name}</a>
            </li>
        `;
    });

    const homeNode = new TreeElement(document.getElementById("home"));
    homeNode.parent = homeNode;
    // play sound
    let message = generateMessage(homeNode)
    let sayThis = createSpeech(homeNode.content + message.audioMessage)

    let displayElement = document.getElementById('voicemail-display');
    let navigationMenu = `<br> {0: return ; *: repeat}`
    displayElement.innerHTML = " welcome to my website! \n (under construction) \n turn the volume UP!!!!!! <br><br>" + message.displayMenu + navigationMenu;

    let currentNode = homeNode

    startButton.addEventListener('click', () => {
        // Remove the button
        startButton.remove();
        
        // Start speech synthesis
        if ('speechSynthesis' in window) {
            window.speechSynthesis.speak(sayThis);
        }
        
        // Initialize audio elements
        buttonAudio.play().then(() => buttonAudio.pause());
        voicemailAudio.play().then(() => voicemailAudio.pause());
    });

    const buttonAudio = new Audio('/sounds/phone-press.m4a');
    const voicemailAudio = new Audio('/sounds/voicemail-tone.m4a');

    numContainer.addEventListener('pointerdown', async (e) => {
        try {
            // Ensure speech synthesis is active
            if ('speechSynthesis' in window && window.speechSynthesis.paused) {
                window.speechSynthesis.resume();
            }
    
            await playTone(buttonAudio);
            window.speechSynthesis.cancel();
            const clickedNum = e.target.dataset.num;

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
                    displayElement.innerHTML = 'invalid number clicked, please press 0 <br><br> :('
                    return;
                }

                // Handle node based on type
                if (currentNode.type === 'text' || currentNode.type === 'link-display' ) {
                    message = generateMessage(currentNode)
                    sayThis = createSpeech(currentNode.content + message.audioMessage);
                    window.speechSynthesis.speak(sayThis);
                    displayElement.innerHTML = message.displayMenu + navigationMenu
                } else if (currentNode.type === 'text-display' ) {
                    if (currentNode.label === 'call a random friend') {
                        const randomFriend = callRandomFriend();
                        message = generateMessage(currentNode)
                        displayElement.innerHTML = message.displayMenu + `calling ${randomFriend.name} .... <br>` + navigationMenu
                        sayThis = createSpeech(`calling ${randomFriend.name} ....`);
                        window.speechSynthesis.speak(sayThis);
                        setTimeout(() => {
                            window.location.href = randomFriend.url;
                        }, 2000);
                    } else {
                        message = generateMessage(currentNode)
                        sayThis = createSpeech(currentNode.content + message.audioMessage);
                        window.speechSynthesis.speak(sayThis);
                        displayElement.innerHTML = message.displayMenu + currentNode.content + '<br>' + navigationMenu
                    }
                }
                else if (currentNode.type === 'link') {
                    window.location.href = currentNode.content;
                } else if (currentNode.type === 'voicemail') {
                    const action = currentNode.label;

                    if (action === 'leave a voicemail') {

                        message = generateMessage(currentNode);
                        sayThis = createSpeech("The voicemail recording is limited to 10 seconds. Remember to leave your name and be cool.");
                        displayElement.innerHTML = message.displayMenu + `you have 10 seconds to leave a voicemail <br>` + navigationMenu;

                        const isEnded = new Promise((resolve) => {
                            sayThis.onend = resolve;
                        });

                        window.speechSynthesis.speak(sayThis);
                        await isEnded;
                        await playTone(voicemailAudio);
                        await startRecording();  

                        displayElement.innerHTML = message.displayMenu + 'done recording! <br>' + navigationMenu;

                        sayThis.text = "Done recording. Thanks for leaving a voicemail! To go back, press 0.";
                        window.speechSynthesis.speak(sayThis);

                    } else if (action === 'the last voicemails') {

                        message = generateMessage(currentNode)
                        const voicemail_text = await playLatestVoicemail()
                        displayElement.innerHTML = message.displayMenu + voicemail_text + navigationMenu;
                        
                        sayThis.text = "These are the latest voicemails. To go back, press 0.";
                        window.speechSynthesis.speak(sayThis);

                    }
                }
            } else {
                // Handle any non-number, non-asterisk input
                sayThis.text = 'invalid number clicked!';
                window.speechSynthesis.speak(sayThis);
                displayElement.innerHTML = 'invalid number clicked, please press 0 <br><br> :('
            }

        }
        catch (error) {
            console.error('Error:', error);
        }
    });
    
});