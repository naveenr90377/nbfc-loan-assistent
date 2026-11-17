require("dotenv").config();
const { ChatGroq } = require("@langchain/groq");
const { z } = require("zod");
const { StateGraph, START, END, Annotation, MemorySaver } = require("@langchain/langgraph");
const { HumanMessage, AIMessage } = require("@langchain/core/messages");

// Model comes from .env. Check this line in the terminal if you ever get a 404 again.
const MODEL = process.env.GROQ_MODEL || "openai/gpt-oss-120b";
console.log("Groq model in use:", MODEL);

const model = new ChatGroq({
  model: MODEL,
  apiKey: process.env.GROQ_API_KEY,
  temperature: 0.1,
  maxRetries: 1, // fail fast instead of waiting through long retry back-offs
});

// ---------- Business limits and validators (one place, used everywhere) ----------
const PURPOSES = ["wedding", "medical", "education", "personal", "other"];
const LIMITS = { minIncome: 10000, minLoan: 5000, minTenure: 3, maxTenure: 60 };

const isNum = (v) => typeof v === "number" && Number.isFinite(v);
const okName = (v) => typeof v === "string" && v.trim().length >= 2;
const okIncome = (v) => isNum(v) && v >= LIMITS.minIncome;
const okLoan = (v) => isNum(v) && v >= LIMITS.minLoan;
const okTenure = (v) => isNum(v) && v >= LIMITS.minTenure && v <= LIMITS.maxTenure;
const okPurpose = (v) => PURPOSES.includes(v);

const isComplete = (d) =>
  okName(d.name) &&
  okIncome(d.income) &&
  okLoan(d.loanAmount) &&
  okTenure(d.tenureMonths) &&
  okPurpose(d.loanPurpose);

// ---------- Extraction schema ----------
// Lenient on purpose: the model may return null for missing fields.
// Business rules (minimums, allowed purposes) are enforced in applyExtraction below,
// so one bad value never throws away the good ones.
const ExtractionSchema = z.object({
  name: z.string().nullish(),
  income: z.number().nullish(),
  loanAmount: z.number().nullish(),
  tenureMonths: z.number().nullish(),
  loanPurpose: z.string().nullish(),
});

const extractor = model.withStructuredOutput(ExtractionSchema, {
  name: "loan_fields",
  method: "functionCalling",
});

function applyExtraction(current, parsed) {
  const next = { ...current };
  if (okName(parsed.name)) next.name = parsed.name.trim();
  if (okIncome(parsed.income)) next.income = parsed.income;
  if (okLoan(parsed.loanAmount)) next.loanAmount = parsed.loanAmount;
  if (okTenure(parsed.tenureMonths)) next.tenureMonths = Math.round(parsed.tenureMonths);
  const purpose =
    typeof parsed.loanPurpose === "string" ? parsed.loanPurpose.trim().toLowerCase() : "";
  if (okPurpose(purpose)) next.loanPurpose = purpose;
  return next;
}

// ---------- Yes / No detection (word based, so "know" or "now" never counts as "no") ----------
const STARTS_NO = /^\s*(no|nope|not|wrong|incorrect|don'?t)\b/i;
const SAYS_YES = /\b(yes|yeah|yep|yup|correct|confirm|confirmed)\b/i;

// The assistant's most recent question, so a bare "30000" is understood in context
function lastAssistantText(messages) {
  for (let i = messages.length - 1; i >= 0; i--) {
    const m = messages[i];
    if (typeof m._getType === "function" && m._getType() === "ai") return String(m.content);
  }
  return "";
}

const AgentState = Annotation.Root({
  messages: Annotation({
    reducer: (prev, next) => [...prev, ...next],
    default: () => [],
  }),
  userData: Annotation({
    reducer: (prev, next) => ({ ...prev, ...next }),
    default: () => ({}),
  }),
});

// ---- NODE 1: EXTRACT ----
async function extractNode(state) {
  const lastMsg = String(state.messages[state.messages.length - 1].content);
  const current = state.userData || {};

  // Application already processed: no need to call the LLM again
  if (current.result) return { userData: {} };

  // 1. Handle confirmation first
  if (isComplete(current) && !current.confirmed) {
    if (STARTS_NO.test(lastMsg)) {
      return {
        userData: {
          confirmed: false,
          name: undefined,
          income: undefined,
          loanAmount: undefined,
          tenureMonths: undefined,
          loanPurpose: undefined,
        },
      };
    }
    if (SAYS_YES.test(lastMsg)) {
      return { userData: { confirmed: true } };
    }
  }

  // 2. LLM extraction (structured output, no manual JSON parsing)
  const collected = {
    name: current.name,
    income: current.income,
    loanAmount: current.loanAmount,
    tenureMonths: current.tenureMonths,
    loanPurpose: current.loanPurpose,
  };

  const prompt = `Extract loan application details from the customer's latest message.
Only fill a field if the customer clearly gave it; otherwise leave it null.
Rules:
1. Convert "lakh" to 100000 and "k" to 1000. Convert years to months.
2. loanPurpose must be one of: wedding, medical, education, personal, other.
3. income is the MONTHLY income in rupees.
4. If the message is a bare number, use the assistant's last question to decide which field it answers.

Already collected: ${JSON.stringify(collected)}
Assistant's last question: "${lastAssistantText(state.messages)}"
Customer's latest message: "${lastMsg}"`;

  try {
    const parsed = await extractor.invoke([new HumanMessage(prompt)]);
    return { userData: applyExtraction(current, parsed) };
  } catch (e) {
    console.warn("Extraction error:", e.message);
    return { userData: {} };
  }
}

// ---- ROUTER ----
function routeAfterExtract(state) {
  const d = state.userData;
  if (d.result) return "closing";
  if (isComplete(d) && !d.confirmed) return "confirm";
  if (isComplete(d) && d.confirmed) return "evaluate";
  return "ask";
}

// ---- NODE 2: ASK ----
function askNode(state) {
  const d = state.userData;
  let question;
  if (!okName(d.name)) question = "To get started, what is your full name?";
  else if (!okIncome(d.income))
    question = `Thanks ${d.name}! What is your approximate monthly income in rupees?`;
  else if (!okPurpose(d.loanPurpose))
    question = "What is this loan for? (wedding, medical, education, personal, or other)";
  else if (!okLoan(d.loanAmount) && okTenure(d.tenureMonths))
    question = "How much loan do you need? (minimum Rs 5,000)";
  else if (okLoan(d.loanAmount) && !okTenure(d.tenureMonths))
    question = "For how many months would you like the loan? (3 to 60 months)";
  else question = "How much loan do you need, and for how many months? (e.g., '2 lakh for 24 months')";

  return { messages: [new AIMessage(question)] };
}

// ---- NODE 3: CONFIRM ----
function confirmNode(state) {
  const d = state.userData;
  return {
    messages: [
      new AIMessage(
        `Just to confirm: Name: ${d.name}, Income: ₹${d.income}, Loan: ₹${d.loanAmount} for ${d.loanPurpose} for ${d.tenureMonths} months. Is this correct? (Reply Yes or No)`
      ),
    ],
  };
}

// ---- NODE 4: EVALUATE (deterministic math, no LLM) ----
function evaluateNode(state) {
  const { income, loanAmount, tenureMonths, loanPurpose } = state.userData;

  // Demo policy rates (not real NBFC pricing)
  let rate = 0.12;
  if (loanPurpose === "medical") rate = 0.1;
  if (loanPurpose === "education") rate = 0.09;
  if (loanPurpose === "wedding") rate = 0.11;

  const r = rate / 12;
  const pow = Math.pow(1 + r, tenureMonths);
  const emi = Math.round((loanAmount * r * pow) / (pow - 1));

  const rules = [];
  if (income < 25000) rules.push("Monthly income must be at least Rs 25,000.");
  if (emi > income * 0.5) rules.push("EMI cannot exceed 50% of your monthly income.");
  if (loanAmount > income * 20) rules.push("Loan amount cannot exceed 20x your monthly income.");

  return {
    userData: {
      ...state.userData,
      result: { eligible: rules.length === 0, emi, rules, interestRate: rate },
    },
  };
}

// ---- NODE 5: EXPLAIN (LLM wording only; numbers and decision come from evaluate) ----
async function explainNode(state) {
  const res = state.userData.result;
  const ratePct = (res.interestRate * 100).toFixed(1);

  const nextStep = !res.eligible
    ? "Since you were not eligible, I recommend trying a lower loan amount or a longer tenure, or uploading your latest salary slip for manual review."
    :`Great news! Your application meets our current eligibility criteria. Your estimated EMI is Rs ${res.emi.toLocaleString("en-IN")} per month at ${ratePct}% interest. Explore your loan assessment details and take the next step with confidence!`

  // Used if the LLM is down, or if it drops the EMI figure
  const fallback = res.eligible
    ? `Good news! Your loan is provisionally approved. Your EMI will be Rs ${res.emi} per month at ${ratePct}% interest. ${nextStep}`
    : `We are unable to approve this request right now. ${res.rules.join(" ")} ${nextStep}`;

  const prompt = `You are a friendly, professional loan officer at FinEase Capital.
Explain this decision in 2-3 simple sentences. DO NOT change the numbers or the decision.

Decision: ${res.eligible ? "APPROVED" : "REJECTED"}
EMI: Rs ${res.emi}/month at ${ratePct}% interest.
Reason: ${res.rules.join(" ") || "You meet all our policy requirements."}

Action: ${nextStep}`;

  try {
    const response = await model.invoke([new HumanMessage(prompt)]);
    const text = typeof response.content === "string" ? response.content.trim() : "";
    const keepsEmi = text.replace(/,/g, "").includes(String(res.emi));
    return { messages: [new AIMessage(text && keepsEmi ? text : fallback)] };
  } catch (e) {
    console.warn("Explain error:", e.message);
    return { messages: [new AIMessage(fallback)] };
  }
}

// ---- NODE 6: CLOSING ----
function closingNode() {
  return {
    messages: [
      new AIMessage("Your application has been fully processed. Thank you for choosing FinEase Capital!"),
    ],
  };
}

// ---- BUILD THE GRAPH ----
const workflow = new StateGraph(AgentState)
  .addNode("extract", extractNode)
  .addNode("ask", askNode)
  .addNode("confirm", confirmNode)
  .addNode("evaluate", evaluateNode)
  .addNode("explain", explainNode)
  .addNode("closing", closingNode)
  .addEdge(START, "extract")
  .addConditionalEdges("extract", routeAfterExtract, {
    ask: "ask",
    confirm: "confirm",
    evaluate: "evaluate",
    closing: "closing",
  })
  .addEdge("ask", END)
  .addEdge("confirm", END)
  .addEdge("evaluate", "explain")
  .addEdge("explain", END)
  .addEdge("closing", END);

const checkpointer = new MemorySaver();
const agent = workflow.compile({ checkpointer });

module.exports = agent;