import { GoogleGenerativeAI } from '@google/generative-ai';
import { NextResponse } from 'next/server';
import ExcelJS from 'exceljs';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
const model = genAI.getGenerativeModel({ model: 'models/gemini-2.0-flash' });

export async function POST(req: Request) {
  const { prompt } = await req.json();
  console.log("📥 Prompt:", prompt);

  const geminiPrompt = `
You are an assistant that converts user instructions into structured Excel data.

User instruction (can be in English or Urdu): "${prompt}"

Respond ONLY in this exact JSON format (no extra text):
{
  "headers": ["Column 1", "Column 2"],
  "rows": [["row1col1", "row1col2"], ["row2col1", "row2col2"]]
}
`;

  try {
    const result = await model.generateContent(geminiPrompt);
    const text = await result.response.text();
    console.log("🧠 Gemini Output:", text);

    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error("Gemini did not return valid JSON");

    const { headers, rows } = JSON.parse(jsonMatch[0]);
    console.log("✅ Parsed:", { headers, rows });

    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet('Sheet1');
    sheet.addRow(headers);
    rows.forEach((row: string[]) => sheet.addRow(row));

    const buffer = await workbook.xlsx.writeBuffer();

    return new NextResponse(buffer, {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': 'attachment; filename="sheet.xlsx"',
      },
    });

  } catch (err: any) {
    console.error("❌ Error:", err.message);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
