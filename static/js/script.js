document.addEventListener("DOMContentLoaded", () => {
    console.log("✨ ResumeDost JS Loaded");

    const form = document.getElementById("resumeForm");
    if (form) {
        form.addEventListener("submit", handleSubmit);
    }

    initScrollAnimations();
    initHeaderScroll();
});

function initHeaderScroll() {
    const header = document.getElementById("header");

    window.addEventListener("scroll", () => {
        if (window.scrollY > 50) {
            header.classList.add("scrolled");
        } else {
            header.classList.remove("scrolled");
        }
    });
}

function initScrollAnimations() {
    const observerOptions = {
        threshold: 0.1,
        rootMargin: "0px 0px -100px 0px"
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add("active");
            }
        });
    }, observerOptions);

    document.querySelectorAll(".scroll-reveal").forEach(el => {
        observer.observe(el);
    });
}

function showAnalyzer() {
    const landing = document.querySelector(".landing");
    const analyzer = document.getElementById("analyzer");

    if (landing) {
        landing.style.opacity = "0";
        landing.style.transform = "translateY(-30px)";

        setTimeout(() => {
            landing.style.display = "none";
            if (analyzer) {
                analyzer.style.display = "block";
                analyzer.style.opacity = "0";
                analyzer.style.transform = "translateY(30px)";

                setTimeout(() => {
                    analyzer.style.transition = "all 0.6s ease";
                    analyzer.style.opacity = "1";
                    analyzer.style.transform = "translateY(0)";
                }, 50);
            }
        }, 300);
    }

    window.scrollTo({ top: 0, behavior: "smooth" });
}

function scrollToDemo() {
    const visualContainer = document.querySelector(".visual-container");
    if (visualContainer) {
        visualContainer.scrollIntoView({ behavior: "smooth", block: "center" });
    }
}

function goHome() {
    const landing = document.querySelector(".landing");
    const analyzer = document.getElementById("analyzer");
    const results = document.getElementById("results");

    if (analyzer) {
        analyzer.style.opacity = "0";
        analyzer.style.transform = "translateY(30px)";

        setTimeout(() => {
            analyzer.style.display = "none";
            if (landing) {
                landing.style.display = "grid";
                landing.style.opacity = "0";
                landing.style.transform = "translateY(-30px)";

                setTimeout(() => {
                    landing.style.transition = "all 0.6s ease";
                    landing.style.opacity = "1";
                    landing.style.transform = "translateY(0)";
                }, 50);
            }
        }, 300);
    }

    if (results) results.classList.add("hidden");

    window.scrollTo({ top: 0, behavior: "smooth" });
}

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
        showNotification("Please upload a resume and paste the job description.", "error");
        return;
    }

    status.innerText = "🔍 Analyzing resume...";
    status.style.color = "#8b5cf6";
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
                status.innerText = "⚠️ Error: " + data.error;
                status.style.color = "#ef4444";
                showNotification(data.error, "error");
                return;
            }

            status.innerText = "✅ Analysis Complete!";
            status.style.color = "#10b981";

            setTimeout(() => {
                results.classList.remove("hidden");
                initScrollAnimations();
                results.scrollIntoView({ behavior: "smooth", block: "start" });
            }, 300);

            const text = data.result || "";

            const resumeMatch = text.match(/Resume Score:\s*(\d+)/i);
            const resumeValue = resumeMatch ? parseInt(resumeMatch[1]) : null;

            if (resumeValue !== null) {
                animateScore(resumeScore, resumeValue, false);
                applyScoreColor(resumeScore, resumeValue);
            } else {
                resumeScore.innerText = "--";
            }

            const jdMatchResult = text.match(/JD Match Percentage:\s*(\d+)%/i);
            const jdValue = jdMatchResult ? parseInt(jdMatchResult[1]) : null;

            if (jdValue !== null) {
                animateScore(jdMatch, jdValue, true);
                applyScoreColor(jdMatch, jdValue);
            } else {
                jdMatch.innerText = "--%";
            }

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

            renderBoxes(strengths, strengthsText, "strength");
            renderBoxes(missing, missingText, "missing");
            renderBoxes(suggestions, suggestionsText, "example");
            renderBoxes(ats, atsText, "ats");
        })
        .catch(err => {
            console.error(err);
            status.innerText = "❌ Error occurred";
            status.style.color = "#ef4444";
            showNotification("Something went wrong. Please try again.", "error");
        });
}

function animateScore(element, targetValue, isPercentage) {
    let currentValue = 0;
    const increment = targetValue / 50;
    const duration = 1500;
    const stepTime = duration / 50;

    const timer = setInterval(() => {
        currentValue += increment;
        if (currentValue >= targetValue) {
            currentValue = targetValue;
            clearInterval(timer);
        }
        element.innerText = Math.round(currentValue) + (isPercentage ? "%" : "");
    }, stepTime);

    element.classList.add("animate");
    setTimeout(() => element.classList.remove("animate"), 600);
}

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

function extractSection(text, start, end) {
    const startIndex = text.indexOf(start);
    if (startIndex === -1) return "";

    const from = startIndex + start.length;
    const to = end ? text.indexOf(end, from) : text.length;

    return text.substring(from, to === -1 ? text.length : to).trim();
}

function cleanSectionText(text) {
    return text
        .replace(/Strengths:/gi, "")
        .replace(/Missing Skills:/gi, "")
        .replace(/Improvement Suggestions:/gi, "")
        .replace(/ATS Optimization Tips:/gi, "")
        .trim();
}

function formatText(text) {
    return text
        .replace(/-\s+/g, "• ")
        .replace(/\n{1,}/g, "\n\n")
        .trim();
}

function renderBoxes(container, text, type = "") {
    container.innerHTML = "";

    const items = text.split("\n\n")
        .map(line => line.trim())
        .filter(Boolean);

    items.forEach((line, index) => {
        const div = document.createElement("div");
        div.className = `box-item ${type}`;
        div.innerText = line.replace(/^[•👉]\s*/, "");
        div.style.opacity = "0";
        div.style.transform = "translateX(-20px)";

        container.appendChild(div);

        setTimeout(() => {
            div.style.transition = "all 0.4s ease";
            div.style.opacity = "1";
            div.style.transform = "translateX(0)";
        }, index * 100);
    });
}

function showNotification(message, type = "info") {
    const notification = document.createElement("div");
    notification.style.cssText = `
        position: fixed;
        top: 100px;
        right: 20px;
        background: ${type === "error" ? "#ef4444" : "#10b981"};
        color: white;
        padding: 16px 24px;
        border-radius: 12px;
        box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
        z-index: 10000;
        font-weight: 600;
        max-width: 400px;
        animation: slideInRight 0.3s ease;
    `;
    notification.innerText = message;

    document.body.appendChild(notification);

    setTimeout(() => {
        notification.style.animation = "slideOutRight 0.3s ease";
        setTimeout(() => notification.remove(), 300);
    }, 4000);
}

const style = document.createElement("style");
style.textContent = `
    @keyframes slideInRight {
        from {
            transform: translateX(400px);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }
    @keyframes slideOutRight {
        from {
            transform: translateX(0);
            opacity: 1;
        }
        to {
            transform: translateX(400px);
            opacity: 0;
        }
    }
`;
document.head.appendChild(style);
