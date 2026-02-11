// =====================
// DOM READY
// =====================
document.addEventListener("DOMContentLoaded", () => {
    console.log("JS LOADED");

    const form = document.getElementById("resumeForm");
    if (!form) return;

    form.addEventListener("submit", handleSubmit);
});

// =====================
// SHOW ANALYZER (Landing → App)
// =====================
function showAnalyzer() {
    const landing = document.querySelector(".landing");
    const analyzer = document.getElementById("analyzer");

    if (landing) landing.style.display = "none";
    if (analyzer) analyzer.style.display = "block";

    analyzer.scrollIntoView({ behavior: "smooth" });
}

// =====================
// FORM SUBMIT HANDLER
// =====================
function handleSubmit(e) {
    e.preventDefault();

    const fileInput = document.getElementById("resume");
    const jdText = document.getElementById("jd").value;
    const status = document.getElementById("status");

    const results = document.getElementById("results");
    const resumeScore = document.getElementById("resumeScore");
    const jdMatch = document.getElementById("jdMatch");

    const strengths = document.getElementById("strengths");
    const missing = document.getElementById("missing");
    const suggestions = document.getElementById("suggestions");
    const ats = document.getElementById("ats");

    if (!fileInput.files.length || !jdText.trim()) {
        alert("Please upload a resume and paste the job description.");
        return;
    }

    // Reset UI
    status.innerText = "Analyzing resume... ⏳";
    results.classList.add("hidden");

    resumeScore.innerText = "--";
    jdMatch.innerText = "--";

    strengths.innerHTML = "";
    missing.innerHTML = "";
    suggestions.innerHTML = "";
    ats.innerHTML = "";

    const formData = new FormData();
    formData.append("resume", fileInput.files[0]);
    formData.append("jd", jdText);

    fetch("/analyze", {
        method: "POST",
        body: formData
    })
    .then(res => res.json())
    .then(data => {
        if (data.error) {
            status.innerText = "⚠️ AI usage limit reached. Please try again later.";
            alert(data.error);
            return;
        }

        status.innerText = "Analysis Complete ✅";
        results.classList.remove("hidden");

        const text = data.result || "";

       // Resume Score
        const resumeMatch = text.match(/Resume Score:\s*(\d+)/i);
        const resumeValue = resumeMatch ? parseInt(resumeMatch[1]) : null;

        resumeScore.innerText = resumeValue !== null ? resumeValue : "--";
        if (resumeValue !== null) applyScoreColor(resumeScore, resumeValue);

        // JD Match
        const jdMatchResult = text.match(/JD Match Percentage:\s*(\d+)%/i);
        const jdValue = jdMatchResult ? parseInt(jdMatchResult[1]) : null;

        jdMatch.innerText = jdValue !== null ? jdValue + "%" : "--";
        if (jdValue !== null) applyScoreColor(jdMatch, jdValue);



        // Extract sections
        const strengthsText = cleanSectionText(
            formatText(extractSection(text, "Strengths:", "Missing Skills:"))
        );

        const missingText = cleanSectionText(
            formatText(extractSection(text, "Missing Skills:", "Improvement Suggestions:"))
        );

        const suggestionsText = cleanSectionText(
            formatText(extractSection(text, "Improvement Suggestions:", "ATS Optimization Tips:"))
        );

        const atsText = cleanSectionText(
            formatText(extractSection(text, "ATS Optimization Tips:", null))
        );
        function applyScoreColor(element, value) {
            element.classList.remove("score-green", "score-yellow", "score-red");

            if (value >= 80) {
                element.classList.add("score-green");
            } else if (value >= 60) {
                element.classList.add("score-yellow");
            } else {
                element.classList.add("score-red");
            }
        }


        // Apply score colors ✅
        const resumeScoreValue = parseInt(resumeScore.innerText);
        if (!isNaN(resumeScoreValue)) {
            applyScoreColor(resumeScore, resumeScoreValue);
        }

        const jdMatchValue = parseInt(jdMatch.innerText);
        if (!isNaN(jdMatchValue)) {
            applyScoreColor(jdMatch, jdMatchValue);
        }

        // Render boxes ✅
        renderBoxes(strengths, strengthsText, "strength");
        renderBoxes(missing, missingText, "missing");
        renderBoxes(suggestions, suggestionsText, "example");
        renderBoxes(ats, atsText, "ats");
    })
    .catch(err => {
        console.error(err);
        status.innerText = "Error ❌";
        alert("Something went wrong. Check console.");
    });
}

// =====================
// TEXT SECTION EXTRACTOR
// =====================
function extractSection(text, start, end) {
    const startIndex = text.indexOf(start);
    if (startIndex === -1) return "";

    const from = startIndex + start.length;
    const to = end ? text.indexOf(end, from) : text.length;

    return text.substring(from, to === -1 ? text.length : to).trim();
}

// =====================
// CLEAN HEADERS
// =====================
function cleanSectionText(text) {
    return text
        .replace(/Strengths:/gi, "")
        .replace(/Missing Skills:/gi, "")
        .replace(/Improvement Suggestions:/gi, "")
        .replace(/ATS Optimization Tips:/gi, "")
        .trim();
}

// =====================
// FORMAT TEXT
// =====================
function formatText(text) {
    return text
        .replace(/-\s+/g, "• ")
        .replace(/\n{1,}/g, "\n\n")
        .trim();
}

// =====================
// RENDER EACH SENTENCE AS A BOX
// =====================
function renderBoxes(container, text, type = "") {
    container.innerHTML = "";

    text.split("\n\n")
        .map(line => line.trim())
        .filter(Boolean)
        .forEach(line => {
            const div = document.createElement("div");
            div.className = `box-item ${type}`;
            div.innerText = line.replace(/^•\s*/, "");
            container.appendChild(div);
        });
}
function applyScoreColor(element, value) {
    element.classList.remove(
        "score-green",
        "score-yellow",
        "score-red",
        "animate"
    );

    if (value >= 80) {
        element.classList.add("score-green");
    } else if (value >= 60) {
        element.classList.add("score-yellow");
    } else {
        element.classList.add("score-red");
    }

    // animation
    setTimeout(() => element.classList.add("animate"), 50);
}
