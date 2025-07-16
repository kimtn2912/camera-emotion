const strainQuestions = [
  "부모님 또는 주요 보호자와의 심각한 갈등을 경험한 적이 있다.",
  "가족 중 누군가의 중증 질병이나 장애로 인해 어려움을 겪은 적이 있다.",
  "부모님의 이혼, 별거 또는 가출을 경험한 적이 있다.",
  "학교에서 왕따(집단 따돌림)를 당한 적이 있다.",
  "친구나 중요한 사람과의 심각한 관계 단절을 경험한 적이 있다.",
  "학업 성취에 대한 과도한 압박을 받아 힘들었던 적이 있다.",
  "가족의 심각한 경제적 어려움을 경험한 적이 있다.",
  "집을 잃거나 이사 등으로 안정된 거주 환경이 흔들린 적이 있다.",
  "신체적 폭력이나 위협을 직접 경험하거나 목격한 적이 있다.",
  "사랑하는 사람(가족, 친구)의 죽음이나 실종을 경험한 적이 있다."
];

// 설문 문항 생성
function generateSurvey() {
  const form = document.getElementById('strainForm');
  strainQuestions.forEach((q, idx) => {
    const div = document.createElement('div');
    div.innerHTML = `
      <p>${idx + 1}. ${q}</p>
      <label><input type="radio" name="q${idx}" value="0" checked> 아니오</label>
      <label><input type="radio" name="q${idx}" value="1"> 낮음</label>
      <label><input type="radio" name="q${idx}" value="2"> 보통</label>
      <label><input type="radio" name="q${idx}" value="3"> 높음</label>
    `;
    form.appendChild(div);
  });
}
generateSurvey();

document.getElementById('submitSurvey').addEventListener('click', () => {
  const form = document.getElementById('strainForm');
  const formData = new FormData(form);

  let surveyScore = 0;
  for (let [key, value] of formData.entries()) {
    surveyScore += parseInt(value);
  }

  const weightedSurvey = surveyScore * 0.7;
  const weightedEmotion = currentEmotionScore * 0.3;
  const total = weightedSurvey + weightedEmotion;

  let message = "";
  if (total < 10) {
    message = "주위 사람과의 대화를 통해 지금 상태를 유지하세요.";
  } else if (total < 20) {
    message = "심호흡과 함께 짧은 명상을 해보세요.";
  } else if (total < 30) {
    message = "깊게 숨 쉬고, 산책을 해보세요.";
  } else {
    message = "주위에 도움을 요청하고 스트레스 일기를 쓰며 스트레스를 줄여보세요.";
  }

  document.getElementById('finalScore').innerText =
    `총 스트레스 지수: ${total.toFixed(1)}점\n${message}`;

  // 📋 구글 시트에 기록
  fetch("https://script.google.com/macros/s/AKfycbzI9oslNtYWddANBRdveBuOh2yOkVOqiISmMt5n5wB2o9bsagmpZIOLajf2Pw9XT3NyrQ/exec", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      surveyScore: surveyScore,
      emotionScore: currentEmotionScore,
      totalScore: total
    })
  })
  .then(res => res.text())
  .then(txt => console.log("기록 성공:", txt))
  .catch(err => console.error("기록 실패:", err));
});

// 표정 점수 로직
let currentEmotionScore = 0;

async function start() {
  const video = document.getElementById('video');

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
    const canvas = faceapi.createCanvasFromMedia(video);
    document.body.append(canvas);

    const displaySize = { width: video.width, height: video.height };
    faceapi.matchDimensions(canvas, displaySize);

    setInterval(async () => {
      const detections = await faceapi.detectAllFaces(
        video,
        new faceapi.TinyFaceDetectorOptions()
      ).withFaceExpressions();

      const resized = faceapi.resizeResults(detections, displaySize);
      const ctx = canvas.getContext('2d');
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      faceapi.draw.drawDetections(canvas, resized);
      faceapi.draw.drawFaceExpressions(canvas, resized);

      if (detections.length > 0) {
        const expressions = detections[0].expressions;
        const stressRelated = (expressions.angry || 0) + (expressions.sad || 0) + (expressions.fearful || 0);
        currentEmotionScore = Math.min(10, stressRelated * 10);
      }

    }, 1000);
  });
}

start();
