from flask import Flask, render_template, request, jsonify
from google import genai
from pypdf import PdfReader
from dotenv import load_dotenv
import os
import re
from werkzeug.utils import secure_filename

load_dotenv()

app = Flask(__name__)


UPLOAD_FOLDER = "uploads"
os.makedirs(UPLOAD_FOLDER, exist_ok=True)
app.config["UPLOAD_FOLDER"] = UPLOAD_FOLDER

API_KEY = os.getenv("GEMINI_API_KEY")
if not API_KEY:
    raise ValueError("GEMINI_API_KEY not set in .env file")

client = genai.Client(api_key=API_KEY)



def extract_text_from_pdf(path):
    reader = PdfReader(path)
    text = ""
    for page in reader.pages:
        extracted = page.extract_text()
        if extracted:
            text += extracted
    return text



def clean_text(text):
    text = text.lower()
    text = re.sub(r"[^a-z0-9\s]", " ", text)
    text = re.sub(r"\s+", " ", text)
    return text.strip()



def extract_keywords(jd_text):
    stopwords = {
        "the","and","or","to","a","of","in","for","with","on","at",
        "is","are","as","an","be","by","this","that","from","using",
        "will","must","should","required","responsible"
    }

    words = clean_text(jd_text).split()
    keywords = set()

    for word in words:
        if len(word) > 3 and word not in stopwords:
            keywords.add(word)

    return keywords



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

        if file.filename == "":
            return jsonify({"error": "No file selected"}), 400

        if not file.filename.lower().endswith(".pdf"):
            return jsonify({"error": "Only PDF files are allowed"}), 400


        filename = secure_filename(file.filename)
        path = os.path.join(app.config["UPLOAD_FOLDER"], filename)
        file.save(path)

        resume_text = extract_text_from_pdf(path)
        os.remove(path)

        if not resume_text.strip():
            return jsonify({"error": "Could not extract text from resume"}), 400

        resume_clean = clean_text(resume_text)
        jd_keywords = extract_keywords(jd_text)

        matched_keywords = set()

        for keyword in jd_keywords:
            if re.search(rf"\b{re.escape(keyword)}\b", resume_clean):
                matched_keywords.add(keyword)

        if len(jd_keywords) == 0:
            jd_percentage = 0
        else:
            jd_percentage = int((len(matched_keywords) / len(jd_keywords)) * 100)

        score = 50

        if len(resume_text) > 1500:
            score += 10

        if re.search(r"\d+", resume_text):
            score += 10

        if jd_percentage >= 80:
            score += 25
        elif jd_percentage >= 60:
            score += 15
        elif jd_percentage >= 40:
            score += 5

        score = min(score, 95)

        prompt = f"""
You are a professional resume reviewer.

IMPORTANT:
Resume Score is: {score}
JD Match Percentage is: {jd_percentage}%

DO NOT change these numbers.

Generate only:

Strengths:
👉 Point 1

👉 Point 2

Missing Skills:
👉 Point 1

👉 Point 2

Improvement Suggestions:
👉 Suggestion with example

👉 Suggestion with example

ATS Optimization Tips:
👉 Tip 1

👉 Tip 2

Use simple English.
Leave blank line between bullets.

RESUME:
{resume_text}

JOB DESCRIPTION:
{jd_text}
"""

        response = client.models.generate_content(
            model="models/gemini-2.5-flash",
            contents=prompt,
            config={"temperature": 0}
        )

        ai_text = response.text if response.text else "Could not generate analysis."

        final_output = f"""Resume Score: {score}

JD Match Percentage: {jd_percentage}%

{ai_text}
"""

        return jsonify({"result": final_output})

    except Exception as e:
        return jsonify({"error": str(e)}), 500


if __name__ == "__main__":
    app.run(debug=True)
