import os
import json
import re
import time
from typing import List, Dict, Any
import httpx

OPENAI_API_KEY = os.getenv("OPENAI_API_KEY", "")
OPENAI_API_URL = "https://api.openai.com/v1/chat/completions"

FILLER_WORDS = ["um", "uh", "like", "you know", "basically", "literally",
                "actually", "sort of", "kind of", "i mean", "right", "okay so"]

DOMAIN_CONTEXTS = {
    "Software Developer": {
        "Beginner": "entry-level software developer focusing on basic programming concepts, data structures, and algorithms",
        "Intermediate": "mid-level software developer with 2-4 years of experience in web development, APIs, and databases",
        "Advanced": "senior software engineer with expertise in system design, distributed systems, and architecture patterns"
    },
    "HR": {
        "Beginner": "entry-level HR coordinator focusing on recruitment basics, onboarding, and HR policies",
        "Intermediate": "HR business partner with experience in talent management, employee relations, and HR metrics",
        "Advanced": "senior HR director with expertise in organizational development, HR strategy, and change management"
    },
    "Marketing": {
        "Beginner": "entry-level marketing coordinator focusing on social media, content creation, and basic campaign management",
        "Intermediate": "marketing manager with experience in digital marketing, SEO, paid advertising, and analytics",
        "Advanced": "senior marketing director with expertise in brand strategy, market positioning, and growth marketing"
    }
}


def count_filler_words(text: str) -> tuple[int, List[str]]:
    text_lower = text.lower()
    found_fillers = []
    total_count = 0
    for filler in FILLER_WORDS:
        pattern = r'\b' + re.escape(filler) + r'\b'
        matches = re.findall(pattern, text_lower)
        if matches:
            found_fillers.extend(matches)
            total_count += len(matches)
    return total_count, found_fillers


def calculate_wpm(text: str, duration_seconds: float) -> float:
    if duration_seconds <= 0:
        words = len(text.split())
        estimated_duration = words / (130 / 60)
        return round((words / estimated_duration) * 60, 1) if estimated_duration > 0 else 0
    word_count = len(text.split())
    minutes = duration_seconds / 60
    return round(word_count / minutes, 1) if minutes > 0 else 0


import google.generativeai as genai
import asyncio

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "")

if GEMINI_API_KEY:
    genai.configure(api_key=GEMINI_API_KEY)
    
async def generate_questions(domain: str, difficulty: str, resume_text: str = None) -> List[str]:
    context = DOMAIN_CONTEXTS.get(domain, {}).get(difficulty, f"{difficulty} level {domain}")
    
    resume_context = ""
    if resume_text:
        print("DEBUG: Using resume for question generation")
        resume_context = f"\n\nCANDIDATE'S RESUME / BACKGROUND:\n{resume_text}\n\nPlease tailor some of the questions to the candidate's specific projects and experience while maintaining the {difficulty} level professional standards."

    prompt = f"""Generate exactly 5 interview questions for a {context} position.{resume_context}

Requirements:
- Questions must be realistic and professional
- Mix of behavioral, technical, and situational questions
- Appropriate for {difficulty} level
- Each question should be distinct and test different competencies

Return ONLY a JSON array of 5 strings, no other text:
["question1", "question2", "question3", "question4", "question5"]"""

    if not GEMINI_API_KEY or GEMINI_API_KEY == "":
        return get_fallback_questions(domain, difficulty)

    try:
        model = genai.GenerativeModel("gemini-1.5-flash")
        
        # Move synchronous blocking call to thread pool
        response = await asyncio.to_thread(
            model.generate_content,
            prompt,
            generation_config=genai.types.GenerationConfig(
                temperature=0.7,
                response_mime_type="application/json"
            )
        )
        
        content = response.text.replace("```json", "").replace("```", "").strip()
        questions = json.loads(content)
        if isinstance(questions, list) and len(questions) == 5:
            return questions
    except Exception as e:
        print(f"Gemini API error (generate): {e}")

    return get_fallback_questions(domain, difficulty)

async def evaluate_answer(question: str, answer: str, domain: str, difficulty: str,
                           duration_seconds: float = 0) -> Dict[str, Any]:
    filler_count, filler_list = count_filler_words(answer)
    wpm = calculate_wpm(answer, duration_seconds)

    if not GEMINI_API_KEY or GEMINI_API_KEY == "":
        return get_fallback_evaluation(answer, filler_count, filler_list, wpm)

    prompt = f"""You are an expert interview evaluator for {domain} positions at {difficulty} level.

QUESTION: {question}

CANDIDATE'S ANSWER: {answer}

Evaluate this answer and return ONLY a JSON object exactly matching this schema:
{{
  "technical_score": 0.0,
  "communication_score": 0.0,
  "confidence_score": 0.0,
  "feedback": "string",
  "improvement_tips": ["string"]
}}"""

    try:
        model = genai.GenerativeModel("gemini-1.5-flash")
        
        # Move synchronous blocking call to thread pool
        response = await asyncio.to_thread(
            model.generate_content,
            prompt,
            generation_config=genai.types.GenerationConfig(
                temperature=0.3,
                response_mime_type="application/json"
            )
        )
        
        content = response.text.replace("```json", "").replace("```", "").strip()
        result = json.loads(content)

        technical = float(result.get("technical_score", 0))
        communication = float(result.get("communication_score", 0))
        confidence = float(result.get("confidence_score", 0))
        overall = round((technical + communication + confidence) / 3, 1)

        return {
            "technical_score": technical,
            "communication_score": communication,
            "confidence_score": confidence,
            "overall_score": overall,
            "feedback": result.get("feedback", "No feedback provided by AI."),
            "filler_words": filler_count,
            "filler_word_list": list(set(filler_list)),
            "words_per_minute": wpm,
            "improvement_tips": result.get("improvement_tips", [])
        }
    except Exception as e:
        print(f"Gemini evaluation error: {e}")

    return get_fallback_evaluation(answer, filler_count, filler_list, wpm)


def get_fallback_evaluation(answer: str, filler_count: int, filler_list: List[str],
                             wpm: float) -> Dict[str, Any]:
    word_count = len(answer.split())
    technical = min(85, max(45, word_count * 1.2))
    communication = min(90, max(40, 70 - filler_count * 5 + (5 if wpm > 120 else 0)))
    confidence = min(85, max(40, 65 - filler_count * 3))
    overall = round((technical + communication + confidence) / 3, 1)

    tips = []
    if filler_count > 3:
        tips.append(f"Reduce filler words — you used {filler_count} filler words. Practice pausing instead.")
    if word_count < 50:
        tips.append("Provide more detailed answers with specific examples (STAR method).")
    if wpm > 160:
        tips.append("Slow down slightly — speaking too fast can reduce clarity.")
    if wpm < 100 and wpm > 0:
        tips.append("Try to speak with more confidence and maintain a steady pace.")
    if not tips:
        tips.append("Great response! Continue using structured answers with clear examples.")

    return {
        "technical_score": round(technical, 1),
        "communication_score": round(communication, 1),
        "confidence_score": round(confidence, 1),
        "overall_score": overall,
        "feedback": "Your answer demonstrates understanding of the topic. Consider adding more specific examples and quantifiable achievements to strengthen your response.",
        "filler_words": filler_count,
        "filler_word_list": list(set(filler_list)),
        "words_per_minute": wpm,
        "improvement_tips": tips if tips else ["Keep practicing structured responses using the STAR method."]
    }


def get_fallback_questions(domain: str, difficulty: str) -> List[str]:
    questions = {
        "Software Developer": {
            "Beginner": [
                "Can you explain the difference between a stack and a queue data structure?",
                "What is object-oriented programming and what are its four main principles?",
                "Describe the difference between GET and POST HTTP methods.",
                "What is version control and why is it important in software development?",
                "Explain what a RESTful API is and give an example of how you'd use one."
            ],
            "Intermediate": [
                "How would you design a URL shortening service like bit.ly? Walk me through your approach.",
                "Explain the differences between SQL and NoSQL databases and when to use each.",
                "What are microservices and what are the trade-offs compared to a monolithic architecture?",
                "Describe a challenging bug you debugged. What was your systematic approach?",
                "How do you ensure code quality in a team environment? What tools and processes do you use?"
            ],
            "Advanced": [
                "Design a distributed rate-limiting system that handles 1 million requests per second.",
                "How would you architect a real-time collaborative document editing system like Google Docs?",
                "Describe your approach to database sharding and the challenges you've encountered.",
                "How do you handle eventual consistency in distributed systems? Give a real-world example.",
                "Walk me through how you'd lead a major technical migration with zero downtime."
            ]
        },
        "HR": {
            "Beginner": [
                "What do you understand by the term 'employee onboarding' and why is it important?",
                "How would you handle a situation where two employees have a conflict at work?",
                "Describe the key steps in a typical recruitment process.",
                "What is the importance of maintaining employee confidentiality?",
                "How would you explain company benefits and policies to a new hire?"
            ],
            "Intermediate": [
                "How do you measure the effectiveness of a training and development program?",
                "Describe your experience with performance management systems. How do you handle poor performers?",
                "How would you develop and implement an employee retention strategy?",
                "Tell me about a time you had to navigate a complex employee relations issue.",
                "How do you ensure diversity, equity, and inclusion in the hiring process?"
            ],
            "Advanced": [
                "How would you redesign an organization's HR strategy to support rapid scaling from 200 to 2000 employees?",
                "Describe how you've used HR analytics to drive business decisions.",
                "How do you align HR strategy with overall business objectives? Give a specific example.",
                "What is your approach to organizational design during a major company transformation?",
                "How have you built and led high-performing HR teams across multiple geographies?"
            ]
        },
        "Marketing": {
            "Beginner": [
                "What is the difference between digital marketing and traditional marketing?",
                "How would you create a social media content calendar for a new product launch?",
                "Explain what SEO is and why it matters for a business.",
                "What metrics would you track to measure the success of an email marketing campaign?",
                "Describe a marketing campaign you admire and explain why it was effective."
            ],
            "Intermediate": [
                "How would you develop a go-to-market strategy for a new SaaS product?",
                "Describe your experience with A/B testing. How do you decide what to test?",
                "How do you allocate marketing budget across different channels to maximize ROI?",
                "Tell me about a campaign you ran that underperformed. What did you learn?",
                "How do you use customer data and analytics to improve marketing performance?"
            ],
            "Advanced": [
                "How would you build and scale a growth marketing engine for a startup aiming to 10x in 18 months?",
                "Describe how you've repositioned a brand in a competitive market. What was your strategy?",
                "How do you align marketing strategy with product development and sales teams?",
                "What frameworks do you use for market segmentation and targeting at scale?",
                "How have you built and led marketing organizations through periods of rapid growth?"
            ]
        }
    }
    return questions.get(domain, questions["Software Developer"]).get(
        difficulty, questions["Software Developer"]["Intermediate"]
    )
