require("dotenv").config();

const express = require("express");
const cors = require("cors");
const { HumanMessage } = require("@langchain/core/messages");
const agent = require("./agent/loanAgent");

const app = express();

app.use(cors());
app.use(express.json());

// Health check
app.get("/", (req, res) => {
  res.json({ message: "FinEase Capital API is running" });
});

// Chat endpoint
app.post("/api/chat", async (req, res) => {
  try {
    const { message, sessionId } = req.body;

    if (!message || !sessionId) {
      return res.status(400).json({
        error: "Message and sessionId are required.",
      });
    }

    const config = {
      configurable: { thread_id: sessionId },
    };

    const result = await agent.invoke(
      {
        messages: [new HumanMessage(message)],
      },
      config
    );

    const lastMessage = result.messages[result.messages.length - 1];

    const reply =
      lastMessage && typeof lastMessage.content === "string"
        ? lastMessage.content
        : "I'm sorry, I didn't catch that.";

    // Structured assessment for the frontend and PDF generator
    const assessment = result.userData?.result || null;

    res.json({
      reply,
      assessment,
    });
  } catch (error) {
    console.error("Chat Error:", error);

    res.status(500).json({
      error: "Internal server error",
    });
  }
});

const PORT = process.env.PORT || 4000;

app.listen(PORT, () => {
  console.log(`FinEase Capital API running on port ${PORT}`);
});