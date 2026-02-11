from flask import Flask, render_template, request, jsonify
from google import genai
from pypdf import PdfReader
import os
from dotenv import load_dotenv

# ======================
# Load environment vars
# ======================
load_dotenv()

app = Flask(__name__)

UPLOAD_FOLDER = "uploads"
os.makedirs(UPLOAD_FOLDER, exist_ok=True)
app.config["UPLOAD_FOLDER"] = UPLOAD_FOLDER

# ======================
# Gemini Client
# ======================
API_KEY = os.getenv("GEMINI_API_KEY")
if not API_KEY:
    raise ValueError("GEMINI_API_KEY not set in .env file")

client = genai.Client(api_key=API_KEY)
print("\n=== AVAILABLE GEMINI MODELS FOR THIS API KEY ===")
for m in client.models.list():
    print(m.name)
print("=== END OF MODEL LIST ===\n")


# ======================
# PDF Text Extraction
# ======================
def extract_text_from_pdf(path):
    reader = PdfReader(path)
    text = ""
    for page in reader.pages:
        text += page.extract_text() or ""
    return text

# ======================
# Routes
# ======================
@app.route("/")
def home():
    return render_template("index.html")


@app.route("/analyze", methods=["POST"])
def analyze():
    try:
        if "resume" not in request.files or "jd" not in request.form:
            return jsonify({"error": "Resume or Job Description missing"}), 400

        file = request.files["resume"]
        jd_text = request.form["jd"]

        if not file.filename.endswith(".pdf"):
            return jsonify({"error": "Only PDF files are allowed"}), 400

        path = os.path.join(app.config["UPLOAD_FOLDER"], file.filename)
        file.save(path)

        resume_text = extract_text_from_pdf(path)
        os.remove(path)

        if not resume_text.strip():
            return jsonify({"error": "Could not extract text from resume"}), 400

        prompt = f"""
You are an expert resume reviewer.

IMPORTANT RULES:
- Use SIMPLE English
- Add a blank line between each bullet point
- Do NOT use markdown like ** or ###
- Use short sentences
- Each bullet point must be on a new line
- Leave one empty line between sections

Return the output in EXACTLY this format:

Resume Score: <number>

JD Match Percentage: <number>%

Strengths:
👉 Point 1

👉 Point 2

Missing Skills:
👉 Point 1

👉 Point 2

Improvement Suggestions:
👉 Suggestion with a clear example

👉 Suggestion with a clear example

ATS Optimization Tips:
👉 Tip 1

👉 Tip 2

RESUME:
{resume_text}

JOB DESCRIPTION:
{jd_text}
"""


        # ✅ CORRECT MODEL
        response = client.models.generate_content(
            model="models/gemini-2.5-flash",
            contents=prompt
        )

        result_text = response.candidates[0].content.parts[0].text


        # ✅ CORRECT RESPONSE EXTRACTION
        result_text = response.candidates[0].content.parts[0].text

        return jsonify({"result": result_text})

    except Exception as e:
        return jsonify({"error": str(e)}), 500


# ======================
# Run App
# ======================
if __name__ == "__main__":
    app.run(debug=True)
