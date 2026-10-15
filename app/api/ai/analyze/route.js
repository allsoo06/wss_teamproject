export const maxDuration = 60;
import { NextResponse } from "next/server";
import { askGeminiJSON } from "@/lib/gemini";

export async function POST(req) {
  try {
    const { text } = await req.json();
    if (!text || !text.trim()) {
      return NextResponse.json(
        { error: "텍스트가 비어있어요" },
        { status: 400 },
      );
    }

    const today = new Date().toLocaleDateString("sv-SE", {
      timeZone: "Asia/Seoul",
    });

    const prompt = `너는 대학생 과제 일정 관리 도우미야.
오늘 날짜는 ${today} (한국 시간)이야.
아래 과제 공지에서 정보를 추출하고, 마감일까지 현실적인 단계별 세부 일정을 만들어줘.

반드시 아래 JSON 형식으로만 답해:
{
  "title": "과제명",
  "type": "개인" 또는 "팀플",
  "dueDate": "YYYY-MM-DDTHH:mm" (공지에 없으면 오늘 기준 7일 뒤 23:59),
  "submitMethod": "제출 방식/장소 (모르면 빈 문자열)",
  "subtasks": [
    { "title": "세부 할 일", "dueDate": "YYYY-MM-DD" }
  ]
}

규칙:
- subtasks는 4~5개, 오늘 이후 ~ 마감일 이내, 날짜 오름차순
- 마감까지 기간이 짧으면 subtasks를 줄여도 됨

공지:
${text}`;

    const result = await askGeminiJSON(prompt);
    return NextResponse.json(result);
  } catch (e) {
    return NextResponse.json(
      { error: String(e.message || e) },
      { status: 500 },
    );
  }
}
