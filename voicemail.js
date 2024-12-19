let mediaRecorder;
let audioChunks = [];

export async function startRecording() {
    return new Promise(async (resolve, reject) => {
        const recordingLength = 10
        try {
            // Reset chunks array
            audioChunks = [];

            // Get microphone access
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            mediaRecorder = new MediaRecorder(stream);

            // Handle incoming audio chunks
            mediaRecorder.ondataavailable = (event) => {
                audioChunks.push(event.data);
            };

            // Handle recording stop
            mediaRecorder.onstop = async () => {
                const audioBlob = new Blob(audioChunks, { type: 'audio/mp3' });
                await uploadAudio(audioBlob);
                // Stop all tracks to release microphone
                mediaRecorder.stream.getTracks().forEach(track => track.stop());
            };

            // Start recording in 1-second chunks
            mediaRecorder.start(1000);
            console.log("Started recording!");

            // Start countdown
            let secondsLeft = recordingLength;
            const countdownInterval = setInterval(() => {
                secondsLeft--;
                console.log(`${secondsLeft} seconds left`);

                // Update display - assuming you add a span with id="countdown" to your HTML
                const countdownDisplay = document.getElementById('countdown');
                if (countdownDisplay) {
                    countdownDisplay.textContent = `Recording: ${secondsLeft} seconds left`;
                }

                if (secondsLeft <= 0) {
                    clearInterval(countdownInterval);
                }
            }, 1000);

            // Stop after 30 seconds
            setTimeout(() => {
                mediaRecorder.stop();
                clearInterval(countdownInterval);
                console.log("Recording complete!");

                // Clear countdown display
                const countdownDisplay = document.getElementById('countdown');
                if (countdownDisplay) {
                    countdownDisplay.textContent = 'Recording complete!';
                    // Clear the message after 2 seconds
                    setTimeout(() => {
                        countdownDisplay.textContent = '';
                    }, 2000);
                }
                resolve()
            }, recordingLength * 1000);

        } catch (error) {
            console.error('Error accessing microphone:', error);
            const countdownDisplay = document.getElementById('countdown');
            if (countdownDisplay) {
                countdownDisplay.textContent = 'Error: Could not access microphone';
            }
            reject(error)
        }
    })

}

export async function playLatestVoicemail() {
    try {
        /*const response = await fetch('localhost:8080');*/
        const response = await fetch('https://camille.rcdis.co/messages');
        const data = await response.json();
        return data.map((message, index) => 
            `Message ${index + 1}: ${message.text} (${message.timestamp})`
        ).join('<br><br>');
    } catch (error) {
        console.error('Error playing voicemail:', error);
        sayThis.text = "Error playing voicemail";
        window.speechSynthesis.speak(sayThis);
    }
}

async function uploadAudio(audioBlob) {
    if (audioBlob.size > 10 * 1024 * 1024) {
        console.error('File too large');
        return;
      }
    try {
        const formData = new FormData();
        formData.append('audio', audioBlob, 'recording.mp3');

        const response = await fetch('https://camille.rcdis.co/messages', {
        /*const response = await fetch('localhost:8080', {*/
            method: 'POST',
            body: formData
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        console.log('Upload successful!');
    } catch (error) {
        console.error('Error uploading audio:', error);
    }
}