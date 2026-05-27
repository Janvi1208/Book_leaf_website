const Anthropic = require("@anthropic-ai/sdk");
const { BOOKLEAF_KNOWLEDGE_BASE } = require("../config/knowledgeBase");

let client = null;

function getClient() {
  const apiKey = process.env.GROQ_API_KEY || process.env.ANTHROPIC_API_KEY;
  if (!client && apiKey) {
    client = new Anthropic({ apiKey });
  }
  return client;
}

const CATEGORIES = [
  "Royalty & Payments",
  "ISBN & Metadata Issues",
  "Printing & Quality",
  "Distribution & Availability",
  "Book Status & Production Updates",
  "General Inquiry",
];

const PRIORITIES = ["Critical", "High", "Medium", "Low"];

/**
 * Classify a ticket and assign priority in a single API call (cost-efficient)
 */
async function classifyTicket(subject, description) {
  const ai = getClient();

  if (!ai) {
    return {
      category: "General Inquiry",
      priority: "Medium",
      ai_used: false,
      error: "AI service not configured",
    };
  }

  try {
    const prompt = `You are a support ticket classifier for BookLeaf, an Indian book publishing platform.

Classify this support ticket into EXACTLY one category and one priority level.

CATEGORIES: ${CATEGORIES.join(" | ")}

PRIORITY LEVELS:
- Critical: Payment not received, legal threats, account access blocked, urgent financial loss
- High: ISBN/metadata errors, distribution failures, significant delays (>30 days overdue)
- Medium: Status update requests, moderate delays, non-urgent feature requests
- Low: General questions, bio updates, minor informational requests

TICKET:
Subject: ${subject}
Description: ${description}

Respond ONLY with valid JSON in this exact format, no other text:
{"category": "<category>", "priority": "<priority>", "reasoning": "<one sentence>"}`;

    const response = await ai.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 200,
      messages: [{ role: "user", content: prompt }],
    });

    const text = response.content[0].text.trim();
    const result = JSON.parse(text);

    if (!CATEGORIES.includes(result.category))
      result.category = "General Inquiry";
    if (!PRIORITIES.includes(result.priority)) result.priority = "Medium";

    return { ...result, ai_used: true };
  } catch (err) {
    console.error("AI classification error:", err.message);
    return {
      category: heuristicCategory(subject + " " + description),
      priority: heuristicPriority(subject + " " + description),
      ai_used: false,
      error: err.message,
    };
  }
}

/**
 * Generate a draft response for an admin
 */
async function generateDraftResponse(ticket, author, book) {
  const ai = getClient();

  if (!ai) {
    return {
      draft: null,
      ai_used: false,
      error: "AI service not configured. Please write a response manually.",
    };
  }

  try {
    // Only include the knowledge base and minimal ticket context — not full history
    const bookContext = book
      ? `The ticket relates to the book: "${book.title}" (ISBN: ${book.isbn}, Status: ${book.status}, Genre: ${book.genre}, Published: ${book.publication_date})`
      : "The ticket is a general/account-level query.";

    const prompt = `You are a professional support representative at BookLeaf, an Indian book publishing platform.
Write a helpful, empathetic, and specific draft response to this author support ticket.

AUTHOR: ${author.name}
${bookContext}

TICKET CATEGORY: ${ticket.category}
TICKET PRIORITY: ${ticket.priority}
SUBJECT: ${ticket.subject}
DESCRIPTION: ${ticket.description}

BOOKLEAF KNOWLEDGE BASE:
${BOOKLEAF_KNOWLEDGE_BASE}

INSTRUCTIONS:
1. Address the author by their first name
2. Acknowledge their specific concern
3. Provide a concrete, actionable response using information from the knowledge base
4. Include specific timelines, steps, or contact details where applicable
5. End with a reassurance and offer for further help
6. Keep the tone professional but warm — not robotic
7. Do NOT use generic filler phrases like "I hope this email finds you well"
8. Length: 3-5 short paragraphs

Write ONLY the response body, no subject line, no "Dear [Name]:" salutation line (just start with their first name), no sign-off signature.`;

    const response = await ai.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 600,
      messages: [{ role: "user", content: prompt }],
    });

    return {
      draft: response.content[0].text.trim(),
      ai_used: true,
    };
  } catch (err) {
    console.error("AI draft error:", err.message);
    return {
      draft: null,
      ai_used: false,
      error: err.message,
    };
  }
}

// Heuristic fallbacks if AI is unavailable
function heuristicCategory(text) {
  const t = text.toLowerCase();
  if (/royalt|payment|paid|payout|money|amount|earning/.test(t))
    return "Royalty & Payments";
  if (/isbn|metadata|title|genre|category|description|cover/.test(t))
    return "ISBN & Metadata Issues";
  if (/print|quality|paper|binding|typo|error in book/.test(t))
    return "Printing & Quality";
  if (/distribut|amazon|flipkart|availab|store|not showing/.test(t))
    return "Distribution & Availability";
  if (/status|review|progress|timeline|production|publish/.test(t))
    return "Book Status & Production Updates";
  return "General Inquiry";
}

function heuristicPriority(text) {
  const t = text.toLowerCase();
  if (
    /urgent|critical|months|legal|overdue|not received|6 month|blocked/.test(t)
  )
    return "Critical";
  if (/week|wrong|error|missing|not showing|3 month/.test(t)) return "High";
  if (/update|delay|status|when/.test(t)) return "Medium";
  return "Low";
}

module.exports = { classifyTicket, generateDraftResponse };
