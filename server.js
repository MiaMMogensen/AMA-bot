import express from "express";

const app = express();
const port = 3000;

const messages = [];

const answers = [
  {
    keywords: ["navn", "hedder"],
    answer: "Jeg hedder Mia.",
  },
  {
    keywords: ["bor", "by", "fra"],
    answer: "Jeg bor i Risskov.",
  },
  {
    keywords: ["fritid", "hobby", "kan lide"],
    answer: "Jeg kan godt lide at læse, hækle og høre musik.",
  },
  {
    keywords: ["alder", "gammel"],
    answers: ["Jeg er 26 år gammel."],
  },
];

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

app.get("/", (request, response) => {
  response.render("index", { messages, error: "" });
});

app.post("/ask", (request, response) => {
  const rawQuestion = request.body.question;
  const question = sanitizeQuestion(rawQuestion).trim();

  let error = "";

  if (!question) {
    error = "Skriv et spørgsmål, før du sender.";
  } else {
    messages.push({ type: "question", text: question });

    const answer = findAnswer(question);

    messages.push({ type: "answer", text: answer });
  }

  response.render("index", { messages, error });
});

app.listen(port, () => {
  console.log(`Server is running at http://localhost:${port}`);
});
