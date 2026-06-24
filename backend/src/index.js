import "dotenv/config";
import express from "express";
import cors from "cors";
import OpenAI from "openai";
import { v4 as uuidv4 } from "uuid";
import { SYSTEM_PROMPT } from "./systemPrompt.js";
import { getConversationMessages, saveConversationMessage } from "./storage.js";

const app = express();
const port = process.env.PORT || 8787;

app.use(express.json({ limit: "12mb" }));
app.use(
  cors({
    origin: process.env.ALLOWED_ORIGIN || "*",
  })
);

app.get("/", (_req, res) => {
  res.json({
    service: "LookBook Smart Pricing AI Backend",
    status: "ok",
    endpoint: "POST /api/valuate",
  });
});

app.get("/health", (_req, res) => {
  res.json({ status: "ok" });
});

const outputSchema = {
  name: "lookbook_price_estimate",
  strict: true,
  schema: {
    type: "object",
    properties: {
      suggested_price: { type: "number" },
      range: {
        type: "object",
        properties: {
          min: { type: "number" },
          max: { type: "number" },
        },
        required: ["min", "max"],
        additionalProperties: false,
      },
      motivation: { type: "string" },
      selling_tips: {
        type: "array",
        items: { type: "string" },
      },
    },
    required: ["suggested_price", "range", "motivation", "selling_tips"],
    additionalProperties: false,
  },
};

app.post("/api/valuate", async (req, res) => {
  try {
    if (!process.env.OPENAI_API_KEY) {
      return res.status(500).json({ error: "OPENAI_API_KEY non configurata." });
    }

    const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

    const {
      sessionId: rawSessionId,
      category,
      brand,
      condition,
      imageBase64,
      imageMimeType,
    } = req.body;

    if (!category || !brand || !condition || !imageBase64 || !imageMimeType) {
      return res.status(400).json({
        error:
          "Campi richiesti mancanti: category, brand, condition, imageBase64, imageMimeType.",
      });
    }

    const sessionId = rawSessionId || uuidv4();
    const previousMessages = await getConversationMessages(sessionId);

    const userPayload = {
      category,
      brand,
      condition,
      market: "Italia",
      previous_context: previousMessages,
    };

    await saveConversationMessage(sessionId, {
      role: "user",
      content: userPayload,
    });

    const imageDataUrl = `data:${imageMimeType};base64,${imageBase64}`;

    const completion = await client.chat.completions.create({
      model: process.env.OPENAI_MODEL || "gpt-4.1-mini",
      response_format: {
        type: "json_schema",
        json_schema: outputSchema,
      },
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        {
          role: "user",
          content: [
            {
              type: "text",
              text: `Valuta il capo con questi dati: ${JSON.stringify(userPayload)}`,
            },
            {
              type: "image_url",
              image_url: {
                url: imageDataUrl,
              },
            },
          ],
        },
      ],
    });

    const rawText = completion.choices?.[0]?.message?.content || "{}";
    const estimate = JSON.parse(rawText);

    await saveConversationMessage(sessionId, {
      role: "assistant",
      content: estimate,
    });

    return res.json({
      sessionId,
      estimate,
    });
  } catch (error) {
    console.error("Pricing endpoint error:", error);
    return res.status(500).json({
      error: "Errore durante la valutazione AI.",
      details: error?.message || "Unknown error",
    });
  }
});

app.listen(port, () => {
  console.log(`LookBook backend attivo su http://localhost:${port}`);
});
