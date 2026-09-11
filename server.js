import express from "express";
import fs from "node:fs/promises";

const app = express();
const port = 3000;

async function loadMessages() {
  const data = await fs.readFile("./data/messages.json", "utf8");
  return JSON.parse(data);
}

async function saveMessages(messages) {
  const json = JSON.stringify(messages, null, 2);
  await fs.writeFile("./data/messages.json", json);
}

async function loadTopicStats() {
  const data = await fs.readFile("./data/topic-stats.json", "utf8");
  return JSON.parse(data);
}

async function saveTopicStats(topicStats) {
  const json = JSON.stringify(topicStats, null, 2);
  await fs.writeFile("./data/topic-stats.json", json);
}

const answers = [
  {
    category: "navn",
    keywords: ["navn", "hedder"],
    answer: "Jeg hedder Mia.",
  },
  {
    category: "bosted",
    keywords: ["bor", "by"],
    answer: "Jeg bor i Risskov.",
  },
  {
    category: "hjemsted",
    keywords: ["hjem", "fra"],
    answer: "Jeg kommer fra Lystrup.",
  },
  {
    category: "fritid",
    keywords: ["fritid", "kan lide"],
    answer: "Jeg kan godt lide at læse, hækle og høre musik.",
  },
  {
    category: "alder",
    keywords: ["alder", "gammel"],
    answer: "Jeg er 26 år gammel.",
  },
  {
    category: "farve",
    keywords: ["farve"],
    answer: "Min yndlingsfarve er grøn.",
  },
  {
    category: "søskende",
    keywords: ["søskende"],
    answer: "Jeg har 3 ældre søskende",
  },
];

function countMatches(keywords, normalizedQuestion) {
  const matches = keywords.filter((keyword) =>
    normalizedQuestion.includes(keyword),
  );

  return matches.length;
}

function normalizeQuestion(question) {
  return question.trim().toLowerCase().replace(/\s+/g, " ");
}

function findBestAnswer(question) {
  const normalizedQuestion = normalizeQuestion(question);
  let bestScore = 0;
  let bestAnswer = "Det kender jeg ikke svaret på endnu.";
  let bestCategory = "";

  for (const answerGroup of answers) {
    const score = countMatches(answerGroup.keywords, normalizedQuestion);

    if (score > bestScore) {
      bestScore = score;
      bestAnswer = answerGroup.answer;
      bestCategory = answerGroup.category;
    }
  }

  return {
    answer: bestAnswer,
    category: bestCategory,
  };
}

function findAnswer(question) {
  const normalizedQuestion = question.toLowerCase();

  for (const answerGroup of answers) {
    const hasMatch = answerGroup.keywords.some((keyword) =>
      normalizedQuestion.includes(keyword),
    );

    if (hasMatch) {
      return answerGroup.answer;
    }
  }

  return "Det kender jeg ikke svaret på endnu.";
}

function sanitizeQuestion(input) {
  return input.replace(/[\u0000-\u001F\u007F]/g, "");
}

app.use(express.static("public"));
app.use(express.urlencoded({ extended: true }));

app.set("view engine", "ejs");

app.get("/", async (request, response) => {
  const messages = await loadMessages();
  const topicStats = await loadTopicStats();

  response.render("index", { messages, error: "", topicStats });
});

app.post("/ask", async (request, response) => {
  const messages = await loadMessages();
  const topicStats = await loadTopicStats();

  const question = request.body.question.trim();
  let error = "";

  if (!question) {
    error = "Skriv et spørgsmål, før du sender.";
  } else {
    messages.push({ type: "question", text: question });

    const result = findBestAnswer(question);
    messages.push({ type: "answer", text: result.answer });

    if (result.category) {
      topicStats[result.category] = topicStats[result.category] + 1;
    }
  }

  await saveMessages(messages);
  await saveTopicStats(topicStats);

  response.render("index", { messages, error, topicStats });
});

app.post("/clear-stats", async (request, response) => {
  const topicStats = await loadTopicStats();

  for (const category of Object.keys(topicStats)) {
    topicStats[category] = 0;
  }

  await saveTopicStats(topicStats);
  response.redirect("/");
});

app.post("/clear-messages", async (request, response) => {
  await saveMessages([]);
  response.redirect("/");
});

app.listen(port, () => {
  console.log(`Server is running at http://localhost:${port}`);
});
