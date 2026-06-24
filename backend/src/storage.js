import { JSONFilePreset } from "lowdb/node";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const dbPath = path.join(__dirname, "..", "data", "conversations.json");

const defaultData = { sessions: {} };
const dbPromise = JSONFilePreset(dbPath, defaultData);

export async function saveConversationMessage(sessionId, message) {
  const db = await dbPromise;

  if (!db.data.sessions[sessionId]) {
    db.data.sessions[sessionId] = {
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      messages: [],
    };
  }

  db.data.sessions[sessionId].messages.push({
    ...message,
    timestamp: new Date().toISOString(),
  });
  db.data.sessions[sessionId].updatedAt = new Date().toISOString();

  await db.write();
}

export async function getConversationMessages(sessionId, limit = 8) {
  const db = await dbPromise;
  const session = db.data.sessions[sessionId];

  if (!session) {
    return [];
  }

  return session.messages.slice(-limit);
}
