require("dotenv").config();
const express = require("express");
const cors = require("cors");
const multer = require("multer");
const pdf = require("pdf-parse");
const { OpenAI } = require("openai");
const bcrypt = require("bcrypt");
const db = require("./config/db");
const app = express();
const upload = multer({
  limits: { fileSize: 50 * 1024 * 1024 } // 50 MB
});
app.use(cors());
app.use(express.json());

/* ---------------------- OPENAI CLIENT ---------------------- */
const client = new OpenAI({
  apiKey: process.env.GROQ_API_KEY,
  baseURL: "https://api.groq.com/openai/v1",
});

async function getAIResponse(prompt) {
  const completion = await client.chat.completions.create({
    model: process.env.AI_MODEL,
    messages: [
      {
        role: "user",
        content: prompt
      }
    ]
  });
  return completion.choices[0].message.content;
}

/* ---------------------- SIGNUP / REGISTER ---------------------- */
app.post("/api/signup", async (req, res) => {
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ error: "All fields are required" });
    }
    const hashedPassword = await bcrypt.hash(password, 10);
    const sql = "INSERT INTO users(name,email,password) VALUES(?,?,?)";
    db.query(sql, [name, email, hashedPassword], (err, result) => {
      if (err) {
        console.error(err);
        return res.status(500).json({ error: err.message });
      }
      res.json({ success: true, message: "Registration Successful!", name });
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post("/api/register", async (req, res) => {
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ error: "All fields are required" });
    }
    const hashedPassword = await bcrypt.hash(password, 10);
    const sql = "INSERT INTO users(name,email,password) VALUES(?,?,?)";
    db.query(sql, [name, email, hashedPassword], (err, result) => {
      if (err) {
        console.error(err);
        return res.status(500).json({ error: err.message });
      }
      res.json({ success: true, message: "Registration Successful!", name });
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/* ---------------------- RESET PASSWORD ---------------------- */
app.post("/api/reset-password", async (req, res) => {
  try {
    const { email, newPassword } = req.body;
    if (!email || !newPassword) {
      return res.status(400).json({ error: "Email and new password are required" });
    }
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    const sql = "UPDATE users SET password = ? WHERE email = ?";
    db.query(sql, [hashedPassword, email], (err, result) => {
      if (err) {
        console.error(err);
        return res.status(500).json({ error: "Database error during password reset" });
      }
      if (result.affectedRows === 0) {
        return res.status(404).json({ error: "Email not found" });
      }
      res.json({ success: true, message: "Password updated successfully!" });
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/* ---------------------- LOGIN ---------------------- */
app.post("/api/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: "Email and password required" });
    }
    const sql = "SELECT * FROM users WHERE email=?";
    db.query(sql, [email], async (err, result) => {
      if (err) {
        console.error(err);
        return res.status(500).json({ error: "Database Error" });
      }
      if (result.length === 0) {
        return res.status(401).json({ error: "Email not found" });
      }
      const match = await bcrypt.compare(password, result[0].password);
      if (!match) {
        return res.status(401).json({ error: "Wrong Password" });
      }
      res.json({ success: true, message: "Login Successful", user: result[0], name: result[0].name });
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/* ---------------------- AI TUTOR ROUTE (FORCED POINTERS FORMAT) ---------------------- */
app.post("/api/ai-tutor", upload.single("file"), async (req, res) => {
  try {
    const { text, subject, activePlan } = req.body || {};
    let parsedActivePlan = null;
    if (activePlan) {
      try {
        parsedActivePlan = typeof activePlan === "string" ? JSON.parse(activePlan) : activePlan;
      } catch (e) {
        parsedActivePlan = null;
      }
    }
    const planContext = parsedActivePlan ? `\nACTIVE STUDY PLAN:\n${JSON.stringify(parsedActivePlan, null, 2)}\n` : "";
    const userQuestion = text || "Analyze the attached file and explain its content.";
    
    // Strict prompt forcing clear bullet points / pointers output
    const prompt = `
You are an intelligent AI Tutor for a student studying ${subject || "General"}.
${planContext}
STUDENT QUESTION / TOPIC: ${userQuestion}

STRICT FORMATTING RULES:
1. Do NOT use horizontal markdown tables or single compressed lines.
2. Structure your response entirely using clear, formatted bullet points / pointers and short subheadings.
3. For each main concept or question, provide:
   - **Main Concept Name**
   - 📌 **Key Summary:** (2-3 bullet points)
   - ❓ **Quick Check Questions:** (Numbered list: 1, 2, 3...)
4. Keep line breaks between every section and bullet point so it renders clearly.
`;
    let reply = "";
    if (req.file && req.file.mimetype.startsWith("image/")) {
      const base64Image = req.file.buffer.toString("base64");
      const imageUrl = `data:${req.file.mimetype};base64,${base64Image}`;
      const completion = await client.chat.completions.create({
        model: "qwen/qwen3.6-27b",
        messages: [
          {
            role: "user",
            content: [
              { type: "text", text: prompt },
              { type: "image_url", image_url: { url: imageUrl } }
            ]
          }
        ]
      });
      reply = completion.choices[0].message.content;
    } else {
      reply = await getAIResponse(prompt);
    }
    res.json({ success: true, reply });
  } catch (err) {
    console.error("AI Tutor Error:", err);
    res.status(500).json({ success: false, error: err.message || "AI Tutor failed to generate a response." });
  }
});

app.post("/api/generate-image", async (req, res) => {
  try {
    const { prompt } = req.body;
    if (!prompt) {
      return res.status(400).json({ success: false, error: "Prompt is required for image generation." });
    }
    
    // Automatically injects educational context and styling for project presentation
    const academicEnhancement = "clean educational vector diagram, textbook illustration style, minimalist white background, high resolution, professional academic visual";
    const combinedPrompt = `${prompt.trim()}, ${academicEnhancement}`;
    
    const cleanPrompt = encodeURIComponent(combinedPrompt);
    const seed = Math.floor(Math.random() * 100000);
    
    const imageUrl = `https://image.pollinations.ai/prompt/${cleanPrompt}?width=1024&height=768&seed=${seed}&model=flux&nologo=true`;
    
    res.json({
      success: true,
      imageUrl: imageUrl
    });
  } catch (err) {
    console.error("Image Generation Error:", err);
    res.status(500).json({ success: false, error: err.message || "Failed to generate image." });
  }
});
/* ---------------------- SUMMARIZE TEXT ---------------------- */
app.post("/api/summarize-text", upload.single("file"), async (req, res) => {
  try {
    const body = req.body || {};
    const text = body.text;
    const subject = body.subject;
    const activePlan = body.activePlan;
    if (!text) {
      return res.status(400).json({ error: "Text field is required for summarization." });
    }
    const parsedActivePlan = activePlan ? (typeof activePlan === 'string' ? JSON.parse(activePlan) : activePlan) : null;
    const planContext = parsedActivePlan ? `Active Study Plan context: ${JSON.stringify(parsedActivePlan)}` : "";
    
    const prompt = `Subject: ${subject || "General"}\n${planContext}\nSummarize the following text using clear bullet points and pointers:\n\n${text}`;
    const reply = await getAIResponse(prompt);
    res.json({ success: true, reply });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/* ---------------------- SUMMARIZE FILE ---------------------- */
app.post("/api/summarize-file", upload.single("file"), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: "No file uploaded" });
    const body = req.body || {};
    const subject = body.subject;
    const activePlan = body.activePlan;
    const parsedActivePlan = activePlan ? JSON.parse(activePlan) : null;
    const planContext = parsedActivePlan ? `Active Study Plan context: ${JSON.stringify(parsedActivePlan)}` : "";
    const promptPrefix = `Subject: ${subject || "General"}\n${planContext}\nSummarize the following study document/image using clear bullet points and pointers:`;
    let reply = "";
    if (req.file.mimetype.startsWith("image/")) {
      const base64Image = req.file.buffer.toString("base64");
      const imageUrl = `data:${req.file.mimetype};base64,${base64Image}`;
      const completion = await client.chat.completions.create({
        model: "qwen/qwen3.6-27b",
        messages: [
          {
            role: "user",
            content: [
              { type: "text", text: `${promptPrefix}\nPlease analyze and summarize this image content thoroughly in bullet points.` },
              { type: "image_url", image_url: { url: imageUrl } }
            ],
          },
        ],
      });
      reply = completion.choices[0].message.content;
    } else {
      let text = "";
      if (req.file.mimetype === "application/pdf") {
        const pdfData = await pdf(req.file.buffer);
        text = pdfData.text;
      } else if (req.file.mimetype === "text/plain") {
        text = req.file.buffer.toString("utf8");
      } else {
        return res.status(400).json({ error: "Only PDF, text files, or images are allowed" });
      }
      if (!text || text.trim().length === 0) {
        return res.status(400).json({ error: "Could not extract text from file. It might be scanned or empty." });
      }
      const truncatedText = text.length > 15000 ? text.substring(0, 15000) + "\n[Content truncated due to length...]" : text;
      reply = await getAIResponse(`${promptPrefix}\n\n${truncatedText}`);
    }
    res.json({ success: true, reply });
  } catch (err) {
    console.error("Summarize Error:", err);
    res.status(500).json({ error: err.message });
  }
});

/* ---------------------- QUIZ GENERATOR ---------------------- */
app.post("/api/generate-quiz", async (req, res) => {
  try {
    const { text, level, count, subject, activePlan } = req.body || {};
    const planRef = activePlan ? `Active Plan Focus: ${JSON.stringify(activePlan)}` : "";
    const prompt = `Generate exactly ${count || 5} multiple-choice questions for the subject "${subject || 'General'}" at a "${level || 'Medium'}" difficulty level based on the following context/topic: "${text}". ${planRef}
    
    You MUST output valid JSON only, structured as an array of objects with this exact schema:
    [
      {
        "question": "Question text",
        "options": ["Option A", "Option B", "Option C", "Option D"],
        "correctAnswer": "A",
        "explanation": "Explanation of the correct answer"
      }
    ]`;
    const rawReply = await getAIResponse(prompt);
    let jsonStartIndex = rawReply.indexOf('[');
    let jsonEndIndex = rawReply.lastIndexOf(']');
    if (jsonStartIndex === -1 || jsonEndIndex === -1) {
      return res.status(500).json({ error: "AI failed to format quiz properly. Try again." });
    }
    const jsonString = rawReply.substring(jsonStartIndex, jsonEndIndex + 1);
    const quizJson = JSON.parse(jsonString);
    res.json({ success: true, quiz: quizJson });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/* ---------------------- QUESTION ANSWERING ---------------------- */
app.post("/api/answer-question", async (req, res) => {
  try {
    const { context, question, subject } = req.body || {};
    if (!question || !question.trim()) {
      return res.status(400).json({ success: false, error: "Please enter a question." });
    }
    const prompt = `
You are the Question Answering module of an AI Study Assistant.
Give a CORRECT, CONCISE and EASY-TO-STUDY answer structured with bullet points.
SUBJECT: ${subject || "General"}
REFERENCE: ${context || "No reference material provided."}
QUESTION: ${question}

FORMAT:
# 🎓 Answer
## 📌 Direct Answer
- Bullet point 1
- Bullet point 2
## 📖 Key Concepts
- Concept point 1
- Concept point 2
## 💡 Example
- Simple example bullet
`;
    const reply = await getAIResponse(prompt);
    res.json({ success: true, reply });
  } catch (err) {
    console.error("Question Answering Error:", err);
    res.status(500).json({ success: false, error: err.message || "Failed to generate answer." });
  }
});

app.post("/api/generate-plan", async (req, res) => {
  try {
    const { syllabus, topics, subject, startDate, endDate, userId } = req.body || {};
    if (!syllabus || !topics || !startDate || !endDate) {
      return res.status(400).json({ error: "Syllabus, topics, start date and end date are required." });
    }
    const prompt = `
Create a detailed, practical study plan for:
- Subject: ${subject || "General"}
- Title: ${syllabus}
- Topics: ${topics}
- Timeline: ${startDate} to ${endDate}
Use Markdown structure with bullet points.
`;
    const reply = await getAIResponse(prompt);
    db.query(
      `INSERT INTO study_plans (user_id, subject, title, plan_content, created_at) VALUES (?, ?, ?, ?, NOW())`,
      [userId || 1, subject || "General", syllabus, reply],
      (err) => { if (err) console.error("Database save error:", err); }
    );
    res.json({ success: true, reply });
  } catch (err) {
    console.error("Study Plan Generation Error:", err);
    res.status(500).json({ success: false, error: err.message || "Failed to generate study plan." });
  }
});

/* ---------------------- GET HISTORY ---------------------- */
app.get("/api/history", (req, res) => {
  const { email } = req.query;
  if (!email) {
    return res.status(400).json({ error: "Email query parameter is required" });
  }
  const sql = `
    SELECT id, type, title, content, created_at 
    FROM history 
    WHERE user_email = ? 
    ORDER BY created_at DESC
  `;
  db.query(sql, [email], (err, results) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ error: err.message });
    }
    res.json({ success: true, history: results });
  });
});

/* ---------------------- SAVE HISTORY ---------------------- */
app.post("/api/history", (req, res) => {
  const { email, type, title, content } = req.body || {};
  const sql = `
    INSERT INTO history (user_email, type, title, content)
    VALUES (?, ?, ?, ?)
  `;
  db.query(sql, [email, type, title, content], (err, result) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ error: err.message });
    }
    res.json({ success: true, message: "History Saved" });
  });
});

/* ---------------------- ROOT & HANDLERS ---------------------- */
app.get("/", (req, res) => {
  res.send("Study Assistant Backend Running");
});

app.use((req, res) => {
  res.status(404).json({ error: "Endpoint Not Found" });
});

app.use((err, req, res, next) => {
  console.error("Error:", err.message);
  res.status(err.status || 500).json({ error: err.message });
});

const PORT = 5000;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});