async function start() {
    const video = document.getElementById('video');
    const resultText = document.createElement('div');
    document.body.appendChild(resultText);

    console.log("Loading models...");
    await faceapi.nets.tinyFaceDetector.loadFromUri('./models');
    await faceapi.nets.faceExpressionNet.loadFromUri('./models');
    console.log("Models loaded.");

    navigator.mediaDevices.getUserMedia({ video: {} })
        .then(stream => {
            video.srcObject = stream;
            console.log("Camera stream started.");
        })
        .catch(err => {
            console.error("Camera access error:", err);
        });

    video.addEventListener('play', () => {
        const displaySize = { width: video.width, height: video.height };

        setInterval(async () => {
            const detections = await faceapi
                .detectAllFaces(video, new faceapi.TinyFaceDetectorOptions())
                .withFaceExpressions();

            if (detections.length > 0) {
                // 가장 첫 번째 얼굴의 가장 높은 감정 출력
                const expressions = detections[0].expressions;
                const max = Object.entries(expressions).reduce((a, b) => a[1] > b[1] ? a : b);
                resultText.textContent = `감정: ${max[0]} (${(max[1] * 100).toFixed(1)}%)`;
            } else {
                resultText.textContent = `감지된 얼굴 없음`;
            }
        }, 500);
    });
}

start();
