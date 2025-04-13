import { API_KEY } from './keys.js';
// require('dotenv').config()
// const API_KEY = process.env.API_KEY;
const video = document.getElementById('videoElement');
const startButton = document.getElementById('startButton');
const finishButton = document.getElementById('finishButton');
const transcriptionBox = document.getElementById('transcriptionBox');
const copyButton = document.getElementById('copyButton');

let isTranscribing = false;
let isListening = false;
let transcriptionInterval;
let currentTranscription = "";

if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
    navigator.mediaDevices.getUserMedia({ video: true })
    .then(function(stream) {
        video.srcObject = stream;
    })
    .catch(function(error) {
        console.error("Error accessing camera: ", error);
        transcriptionBox.value = "Error accessing camera.";
        startButton.disabled = true;
        copyButton.disabled = true; // Disable copy button on camera error
    });
} else {
    transcriptionBox.value = 'Your browser does not support getUserMedia API.';
    startButton.disabled = true;
    copyButton.disabled = true; // Disable copy button if getUserMedia not supported
}

startButton.addEventListener('click', () => {
    if (!isTranscribing) {
    isTranscribing = true;
    startButton.disabled = true;
    finishButton.disabled = false;
    ttsButton.disabled = false; // enable TTS button during transcription
    transcriptionBox.value = "";
    currentTranscription = "";

    console.log("Transcription started.");
    
    transcriptionInterval = setInterval(() => {
        let newText;
        transcribeEquationFromVideo(video).then( res => {
            newText = res;
            console.log(newText);
            if (newText && (newText !== "No equation found.")) {
                currentTranscription = newText;
                // currentTranscription += newText + "\n";
                transcriptionBox.value = currentTranscription;
                transcriptionBox.scrollTop = transcriptionBox.scrollHeight;

                if (isListening) {
                    textToSpeech(newText); // Replace with your TTS function
                }
            }
        });
    }, 1000);
    }
});

ttsButton.addEventListener('click', () => {
    if (isTranscribing && !isListening) {
        ttsButton.style.backgroundColor = "#d0ffd0";
        ttsButton.innerText = "Stop Text-to-Speech";
        isListening = true;
    }
    else {
        isListening = false;
        ttsButton.innerText = "Start Text-to-Speech";
        ttsButton.style.backgroundColor = "#f0f0f0";
    }
});

finishButton.addEventListener('click', () => {
    if (isTranscribing) {
    isTranscribing = false;
    startButton.disabled = false;
    finishButton.disabled = true;
    ttsButton.disabled = true; // disable TTS button after transcription
    isListening = false;

    clearInterval(transcriptionInterval);
    console.log("Transcription finished.");
    // currentTranscription += "[TRANSCRIPTION FINISHED]\n";
    transcriptionBox.value = currentTranscription;
    }
});

copyButton.addEventListener('click', () => {
    transcriptionBox.select();
    document.execCommand('copy');
    window.getSelection().removeAllRanges();
    alert('LaTeX script copied to clipboard.');
});

async function transcribeEquationFromVideo(videoElement) {
    // Capture a frame from the video
    const canvas = document.createElement('canvas');
    canvas.width = videoElement.videoWidth;
    canvas.height = videoElement.videoHeight;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(videoElement, 0, 0, canvas.width, canvas.height);
  
    // Convert to base64 (remove data URL prefix)
    const base64Image = canvas.toDataURL('image/png').split(',')[1];
  
    // const prompt = "The following image contains a mathematical equation. Please transcribe this equation into LaTeX code.";
    const prompt = "Please transcribe text in the BLACKBOARD in the following image into LaTeX code without $ or tick. \
    ONLY GIVE ME LATEX CODE. If blackboard is black, return 'No equation found.', Result must only contain\
    ascii charactors.";
  
    try {
        const response = await fetch("https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=" + API_KEY, {
            method: "POST",
            headers: {
            "Content-Type": "application/json"
            },
            body: JSON.stringify({
                contents: [
                {
                parts: [
                    {
                    inlineData: {
                        mimeType: "image/png",
                        data: base64Image
                    }
                    },
                    {
                    text: prompt
                    }
                ]
                }
            ]
            })
        });
  
        const result = await response.json();
        const latex = result.candidates?.[0]?.content?.parts?.[0]?.text;

        if (latex) {
            console.log("LaTeX Transcription:", latex);
            return latex;
        } else {
            console.log("No LaTeX transcription found in the response.");
            return null;
        }

    } catch (error) {
        console.error("Error transcribing image:", error);
        return null;
    }
}

function textToSpeech(text) {
    if ('speechSynthesis' in window) {
        const processedText = processTextForSpeech(text);
        const utterance = new SpeechSynthesisUtterance(processedText);
    
        // speech parameters
        utterance.rate = 0.5;   // Speech rate (0.1 to 10)
        utterance.pitch = 1;    // Speech pitch (0 to 2)
        utterance.volume = 1;   // Speech volume (0 to 1)
        utterance.voice = speechSynthesis.getVoices().find(voice => voice.lang === 'en-US'); // Example: Select an English US voice
    
        speechSynthesis.speak(utterance);
    } else {
        console.error("Speech synthesis is not supported in this browser.");
    }
}

function describeSpecialCharacter(char) {
    switch (char) {
        case '.': return "dot";
        case ',': return "comma";
        case '!': return "exclamation mark";
        case '?': return "question mark";
        case '@': return "at";
        case '#': return "hash";
        case '$': return "dollar";
        case '%': return "percent";
        case '&': return "ampersand";
        case '*': return "asterisk";
        case '(': return "open parenthesis";
        case ')': return "close parenthesis";
        case '-': return "hyphen";
        case '_': return "underscore";
        case '+': return "plus";
        case '=': return "equals";
        case '/': return "slash";
        case '\\': return "backslash";
        case '<': return "less than";
        case '>': return "greater than";
        case '{': return "open brace";
        case '}': return "close brace";
        case '[': return "open bracket";
        case ']': return "close bracket";
        case ':': return "colon";
        case ';': return "semicolon";
        case '"': return "quotation mark";
        case "'": return "apostrophe";
        case '`': return "backtick";
        case '~': return "tilde";
        case '|': return "pipe";
        case '^': return "caret";
        // Add more cases as needed
        default: return char; // If no specific description, just say the character
    }
}

function processTextForSpeech(text) {
    let output = "";
    for (let i = 0; i < text.length; i++) {
      const char = text[i];
      if (/[a-zA-Z0-9\s]/.test(char)) { // If it's an alphanumeric character or whitespace
        output += char;
      } else {
        output += " " + describeSpecialCharacter(char) + " "; // Add space for separation
      }
    }
    console.log("Processed text for speech:", output);
    return output.trim();
}
  