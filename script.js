import { GoogleGenerativeAI } from "@google-ai/generativelanguage";

const API_KEY = "AIzaSyCu8lb-Mjm2Y_WPGVHmlAO0yAcc2bBAl0A"; // api key
const genAI = new GoogleGenerativeAI(API_KEY);
const model = genAI.GenerativeModel({ model: "gemini-pro-vision" });

const video = document.getElementById('videoElement');
const startButton = document.getElementById('startButton');
const finishButton = document.getElementById('finishButton');
const transcriptionBox = document.getElementById('transcriptionBox');
const copyButton = document.getElementById('copyButton');

let isTranscribing = false;
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
    transcriptionBox.value = "";
    currentTranscription = "";

    // **IMPORTANT:** Placeholder for actual API integration.
    console.log("Transcription started.");

    transcriptionInterval = setInterval(() => {
        const newText = `[TRANSCRIBING] New text line ${Math.floor(Math.random() * 100)}. `;
        currentTranscription += newText;
        transcriptionBox.value = currentTranscription;
        transcriptionBox.scrollTop = transcriptionBox.scrollHeight;
    }, 1500);
    }
});

finishButton.addEventListener('click', () => {
    if (isTranscribing) {
    isTranscribing = false;
    startButton.disabled = false;
    finishButton.disabled = true;

    // **IMPORTANT:** Placeholder for stopping API call.
    clearInterval(transcriptionInterval);
    console.log("Transcription finished.");
    currentTranscription += "[TRANSCRIPTION FINISHED]\n";
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
  
    const prompt = "The following image contains a mathematical equation. Please transcribe this equation into LaTeX code.";
  
    try {
    //   const response = await fetch("https://generativelanguage.googleapis.com/v1beta/models/gemini-pro-vision:generateContent?key=YOUR_API_KEY", {
    //     method: "POST",
    //     headers: {
    //       "Content-Type": "application/json"
    //     },
    //     body: JSON.stringify({
    //       contents: [
    //         {
    //           parts: [
    //             {
    //               inlineData: {
    //                 mimeType: "image/png",
    //                 data: base64Image
    //               }
    //             },
    //             {
    //               text: prompt
    //             }
    //           ]
    //         }
    //       ]
    //     })
    //   });

    const result = await model.generateContent({
      contents: [
        {
          parts: [
            {
              inlineData: {
                mimeType: "image/png", // Adjust if your image is a different type (e.g., image/jpeg)
                data: base64Image,
              },
            },
            { text: prompt },
          ],
        },
      ],
    });
  
    //   const result = await response.json();
      const latex = result.candidates?.[0]?.content?.parts?.[0]?.text;
  
      if (latex) {
        console.log("LaTeX:", latex);
        transcriptionBox.value = latex;
      } else {
        transcriptionBox.value = "No LaTeX found in response.";
      }
    } catch (error) {
      console.error("Error:", error);
      transcriptionBox.value = "Error during transcription.";
    }
  }
  

// import { GoogleGenerativeAI } from "@google-ai/generativelanguage";
// import fs from 'fs'; // For reading the image file

// // Replace with your actual API key
// const API_KEY = "YOUR_API_KEY";
// const genAI = new GoogleGenerativeAI(API_KEY);
// const model = genAI.GenerativeModel({ model: "gemini-pro-vision" });

// async function transcribeEquationImage(imagePath) {
//   try {
//     const imageFile = fs.readFileSync(imagePath);
//     const base64Image = Buffer.from(imageFile).toString('base64');

//     const prompt = "The following image contains a mathematical equation. Please transcribe this equation into LaTeX code.";

//     const result = await model.generateContent({
//       contents: [
//         {
//           parts: [
//             {
//               inlineData: {
//                 mimeType: "image/png", // Adjust if your image is a different type (e.g., image/jpeg)
//                 data: base64Image,
//               },
//             },
//             { text: prompt },
//           ],
//         },
//       ],
//     });

//     const responseText = result.response?.candidates?.[0]?.content?.parts?.[0]?.text;

//     if (responseText) {
//       console.log("LaTeX Transcription:", responseText);
//       return responseText;
//     } else {
//       console.log("No LaTeX transcription found in the response.");
//       return null;
//     }
//   } catch (error) {
//     console.error("Error transcribing image:", error);
//     return null;
//   }
// }