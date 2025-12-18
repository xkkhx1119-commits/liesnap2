import express from "express";
import multer from "multer";
import cors from "cors";
import OpenAI from "openai";
import fs from "fs";

const app = express();
const upload = multer();
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

app.use(cors());
app.use(express.static("public"));

app.post("/analyze", upload.single("image"), async (req, res) => {
  try {
    const imageBase64 = req.file.buffer.toString("base64");

    const prompt = `
이 사진은 산업 현장 작업 사진이다.

너는 산업안전 전문가다.
다음 기준으로 분석하라.

1. 사진 속에서 시각적으로 확인 가능한 위험요인을 모두 식별하라.
2. 각 위험요인에 대해:
   - 위험요인 설명
   - 위험성 추정 (상 / 중 / 하)
   - 위험 발생 시 예상 결과
   - 현실적인 감소대책
3. 결과는 아래 JSON 형식으로만 출력하라.

{
  "risks": [
    {
      "name": "",
      "description": "",
      "risk_level": "상|중|하",
      "consequence": "",
      "mitigation": ""
    }
  ]
}

※ 법적 판단이나 확정적 표현은 사용하지 말고,
※ 관리감독자의 판단을 보조하는 수준으로 작성하라.
    `;

    const response = await openai.responses.create({
      model: "gpt-4.1-mini",
      input: [{
        role: "user",
        content: [
          { type: "input_text", text: prompt },
          {
            type: "input_image",
            image_base64: imageBase64
          }
        ]
      }]
    });

    const output = response.output_text;
    res.json(JSON.parse(output));

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "AI 분석 중 오류 발생" });
  }
});

app.listen(3000, () => {
  console.log("AI 위험성평가 서버 실행 중 (http://localhost:3000)");
});
