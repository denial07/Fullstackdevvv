import axios from "axios";

const GEMINI_API_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent";

export const generateGeminiResponse = async (userInput: string) => {
    const apiKey = process.env.GEMINI_API_KEY;

    const response = await axios.post(
        `${GEMINI_API_URL}?key=${apiKey}`,
        {
            contents: [
                {
                    role: "user",
                    parts: [{ text: userInput }],
                },
            ],
        },
        {
            headers: {
                "Content-Type": "application/json",
            },
        }
    );

    return response.data.candidates[0]?.content?.parts[0]?.text || "No response.";
};
