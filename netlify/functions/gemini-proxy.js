// netlify/functions/gemini-proxy.js
// Netlify 서버리스 함수: 클라이언트의 요청을 받아 Gemini API로 전달하고 응답을 반환합니다.

// @google/generative-ai 라이브러리를 임포트합니다.
// 이 라이브러리는 package.json의 dependencies에 명시되어야 합니다.
import { GoogleGenerativeAI } from '@google/generative-ai';

// Netlify 환경 변수에서 Gemini API 키를 가져옵니다.
// 이 키는 Netlify 대시보드의 'Site settings' -> 'Environment variables'에 설정되어야 합니다.
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

// API 키가 설정되지 않았다면 오류를 발생시킵니다.
if (!GEMINI_API_KEY) {
  console.error("GEMINI_API_KEY environment variable is not set.");
  // 실제 배포 환경에서는 이 오류가 발생하지 않도록 미리 설정해야 합니다.
}

const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

// Netlify Functions의 메인 핸들러 함수입니다.
exports.handler = async function(event, context) {
  // POST 요청만 처리합니다.
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Method Not Allowed', message: 'Only POST requests are allowed.' }),
      headers: { 'Content-Type': 'application/json' },
    };
  }

  try {
    // 클라이언트로부터 받은 요청 본문(body)에서 prompt를 추출합니다.
    // Netlify Functions의 event.body는 문자열이므로 JSON.parse가 필요합니다.
    const { prompt } = JSON.parse(event.body);

    if (!prompt) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Bad Request', message: 'Prompt is required in the request body.' }),
        headers: { 'Content-Type': 'application/json' },
      };
    }

    // Gemini API 호출을 위한 chatHistory 구성
    const chatHistory = [{ role: "user", parts: [{ text: prompt }] }];

    // Gemini API 호출
    const result = await model.generateContent({ contents: chatHistory });
    const response = await result.response;
    const text = response.text();

    // Gemini API의 응답을 클라이언트에 그대로 전달합니다.
    return {
      statusCode: 200,
      body: JSON.stringify({ text: text }),
      headers: { 'Content-Type': 'application/json' },
    };

  } catch (error) {
    console.error('Error calling Gemini API from Netlify function:', error);
    // 오류 발생 시 클라이언트에 적절한 오류 메시지를 반환합니다.
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Internal Server Error', message: error.message || 'Failed to generate content from Gemini API.' }),
      headers: { 'Content-Type': 'application/json' },
    };
  }
};
