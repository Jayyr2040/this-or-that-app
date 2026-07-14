import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const app = express();
app.use(express.json());

const PORT = 3000;

// Initialize Gemini SDK with telemetry header
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    }
  }
});

// Endpoint to suggest a criterion
app.post("/api/suggest-criterion", async (req, res) => {
  try {
    const { decision, currentCriteria } = req.body;

    if (!decision || typeof decision !== "string") {
      return res.status(400).json({ error: "Decision question is required" });
    }

    const criteriaList = Array.isArray(currentCriteria) ? currentCriteria : [];

    const prompt = `You are a decision-making assistant for the "This or That" decision engine application.
The user is trying to make a decision: "${decision}".
Their current comparison criteria are: ${criteriaList.length > 0 ? criteriaList.map(c => `"${c}"`).join(", ") : "None"}.

Suggest exactly ONE relevant and insightful decision criterion (1 to 4 words) that they might have missed or should consider for this decision.
Do not suggest any criteria that are already in their list.
Ensure the suggestion is clean, professional, and directly applicable.`;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            suggestion: {
              type: Type.STRING,
              description: "A single concise criterion factor (e.g., 'Work-life balance', 'Growth potential', 'Commute time') that fits the user's decision context.",
            }
          },
          required: ["suggestion"]
        }
      }
    });

    const resultText = response.text || "{}";
    const resultObj = JSON.parse(resultText);
    const suggestion = resultObj.suggestion || "";

    res.json({ suggestion: suggestion.trim() });
  } catch (error: any) {
    console.error("Gemini suggestion error:", error);
    res.status(500).json({ error: error?.message || "Failed to generate suggestion" });
  }
});

async function startServer() {
  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
