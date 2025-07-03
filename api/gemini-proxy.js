// api/gemini-proxy.js
// Vercel 서버리스 함수: 클라이언트의 요청을 받아 Gemini API로 전달하고 응답을 반환합니다.

import { GoogleGenerativeAI } from '@google/generative-ai';

// Vercel 환경 변수에서 Gemini API 키를 가져옵니다.
// 이 키는 Vercel 대시보드의 'Environment Variables'에 설정되어야 합니다.
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

// API 키가 설정되지 않았다면 오류를 발생시킵니다.
if (!GEMINI_API_KEY) {
  console.error("GEMINI_API_KEY environment variable is not set.");
  // 실제 배포 환경에서는 이 오류가 발생하지 않도록 미리 설정해야 합니다.
}

const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

export default async function handler(req, res) {
  // POST 요청만 처리합니다.
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed', message: 'Only POST requests are allowed.' });
  }

  try {
    // 클라이언트로부터 받은 요청 본문(body)에서 prompt를 추출합니다.
    // 이 prompt는 HTML에서 생성된 전체 프롬프트 문자열입니다.
    const { prompt } = req.body;

    if (!prompt) {
      return res.status(400).json({ error: 'Bad Request', message: 'Prompt is required in the request body.' });
    }

    // Gemini API 호출을 위한 chatHistory 구성
    const chatHistory = [{ role: "user", parts: [{ text: prompt }] }];

    // Gemini API 호출
    const result = await model.generateContent({ contents: chatHistory });
    const response = await result.response;
    const text = response.text();

    // Gemini API의 응답을 클라이언트에 그대로 전달합니다.
    res.status(200).json({ text: text });

  } catch (error) {
    console.error('Error calling Gemini API from Vercel function:', error);
    // 오류 발생 시 클라이언트에 적절한 오류 메시지를 반환합니다.
    res.status(500).json({ error: 'Internal Server Error', message: error.message || 'Failed to generate content from Gemini API.' });
  }
}
