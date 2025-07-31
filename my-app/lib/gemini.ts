// lib/gemini.ts
import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

export async function inferDataTypeWithGemini(columnName: string): Promise<string> {
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

    const prompt = `What is the best data type (string, number, boolean, or date) for a field named "${columnName}"? Return only one word: string, number, boolean, or date.`;

    const result = await model.generateContent(prompt);
    const text = result.response.text().toLowerCase().trim();

    if (["string", "number", "boolean", "date"].includes(text)) {
        return text;
    }

    return "string"; // fallback
}
