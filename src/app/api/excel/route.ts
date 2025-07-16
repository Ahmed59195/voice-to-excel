import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import ExcelJS from 'exceljs';

export async function POST(req: NextRequest) {
  try {
    const { prompt } = await req.json();

    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });

    const result = await model.generateContent(`Create a table based on: ${prompt}`);
    const text = result.response.text();

    const rows = text
      .split('\n')
      .filter((line) => line.includes('|'))
      .map((line) =>
        line
          .split('|')
          .map((cell) => cell.trim())
          .filter((cell) => cell !== '')
      );

    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet('Sheet 1');
    rows.forEach((row) => sheet.addRow(row));

    const buffer = await workbook.xlsx.writeBuffer();
    return new NextResponse(buffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': 'attachment; filename="sheet.xlsx"',
      },
    });
  } catch (error) {
    console.error('Excel generation error:', error);
    return NextResponse.json({ error: 'Failed to generate sheet' }, { status: 500 });
  }
}
