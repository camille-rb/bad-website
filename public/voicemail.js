let mediaRecorder;
let audioChunks = [];

export async function startRecording() {
    return new Promise(async (resolve, reject) => {
        const recordingLength = 10;
        try {
            // Reset chunks array
            audioChunks = [];

            // Request microphone with specific constraints for mobile
            const stream = await navigator.mediaDevices.getUserMedia({ 
                audio: {
                    echoCancellation: true,
                    noiseSuppression: true,
                    autoGainControl: true
                }
            });

            // Create MediaRecorder with mobile-friendly settings
            mediaRecorder = new MediaRecorder(stream, {
                mimeType: MediaRecorder.isTypeSupported('audio/webm') 
                    ? 'audio/webm' 
                    : 'audio/mp4'
            });

            // Rest of your code...
            mediaRecorder.ondataavailable = (event) => {
                audioChunks.push(event.data);
            };

            mediaRecorder.onstop = async () => {
                try {
                    const audioBlob = new Blob(audioChunks, { 
                        type: mediaRecorder.mimeType 
                    });
                    await uploadAudio(audioBlob);
                    // Stop all tracks to release microphone
                    mediaRecorder.stream.getTracks().forEach(track => track.stop());
                } catch (error) {
                    console.error('Error in onstop:', error);
                }
            };

            // Add error handling
            mediaRecorder.onerror = (event) => {
                console.error('MediaRecorder error:', event.error);
                reject(event.error);
            };

            mediaRecorder.start(1000);
            console.log("Started recording!");

            // Start countdown
            let secondsLeft = recordingLength;
            const countdownInterval = setInterval(() => {
                secondsLeft--;
                console.log(`${secondsLeft} seconds left`);

                // Update display - assuming you add a span with id="countdown" to your HTML
                const countdownDisplay = document.getElementById('voicemail-display');
                if (countdownDisplay) {
                    countdownDisplay.innerHTML = `<strong> current menu </strong>: leave a voicemail <br><br> <strong> recording... </strong> <br> ${secondsLeft} seconds left <br><br> {0: return ; *: repeat}`;
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
        const response = await fetch('https://camille.rcdis.co/messages');
        const data = await response.json();
        return data.map((message, index) => 
            `Message ${index + 1}: ${message.text} (${message.timestamp})`
        ).join('<br><br>');
    } catch (error) {
        console.error('Error playing voicemail:', error);
        return 'Error loading voicemails: ' + error.message;
    }
}

async function uploadAudio(audioBlob) {
    if (audioBlob.size > 10 * 1024 * 1024) {
        return;
    }
    try {
        const formData = new FormData();
        formData.append('audio', audioBlob, 'recording.mp3');
        
        const response = await fetch('https://camille.rcdis.co/messages', {
            method: 'POST',
            body: formData
        });
        
        const responseText = await response.text();

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

    } catch (error) {
        console.error('Error uploading audio:', error);
    }
}