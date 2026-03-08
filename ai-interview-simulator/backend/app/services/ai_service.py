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
from dotenv import load_dotenv

# Load .env relative to this file's location so the key is always available
load_dotenv(os.path.join(os.path.dirname(__file__), '..', '..', '.env'))

GEMINI_MODEL = "gemini-2.0-flash-lite"

def _get_gemini_model():
    """Get a freshly configured Gemini model, reading the key at call time."""
    key = os.getenv("GEMINI_API_KEY", "")
    if not key:
        return None
    genai.configure(api_key=key)
    return genai.GenerativeModel(GEMINI_MODEL)
    
# Diverse topic pools to pick from, ensuring question variety
QUESTION_TOPICS = {
    "Software Developer": [
        "system design", "data structures", "algorithms", "debugging", "code review",
        "API design", "database optimization", "concurrency", "security", "testing",
        "CI/CD pipelines", "cloud architecture", "microservices", "performance tuning",
        "refactoring legacy code", "team collaboration", "agile process", "technical debt"
    ],
    "HR": [
        "recruitment strategy", "employee retention", "conflict resolution", "performance reviews",
        "onboarding", "diversity & inclusion", "HR analytics", "compensation strategy",
        "leadership development", "change management", "workplace culture", "labor law"
    ],
    "Marketing": [
        "brand strategy", "digital campaigns", "SEO", "content marketing", "data analytics",
        "social media growth", "customer journey mapping", "A/B testing", "influencer marketing",
        "email marketing", "product launches", "competitive analysis", "market segmentation"
    ]
}

async def generate_questions(domain: str, difficulty: str, resume_text: str = None, session_id: int = None) -> List[str]:
    context = DOMAIN_CONTEXTS.get(domain, {}).get(difficulty, f"{difficulty} level {domain}")
    
    import random
    # Pick 5 random topics to focus questions on — this is the key to variety
    all_topics = QUESTION_TOPICS.get(domain, QUESTION_TOPICS["Software Developer"])
    chosen_topics = random.sample(all_topics, min(5, len(all_topics)))
    topics_str = ", ".join(chosen_topics)
    
    # Unique seed per session
    seed = session_id if session_id else random.randint(10000, 99999)

    resume_context = ""
    if resume_text:
        resume_context = f"\n\nCANDIDATE'S RESUME:\n{resume_text[:3000]}\n\nTailor questions to their specific skills and experience above."

    prompt = f"""You are an expert technical interviewer. Generate exactly 5 UNIQUE interview questions for a {context} position.

Focus these questions specifically on these topics: {topics_str}

Session ID: {seed}{resume_context}

Strict rules:
- Cover ONLY the listed focus topics above
- NO generic questions like 'Tell me about yourself' or 'What are your strengths?'
- Each question must test a different topic from the focus list
- Questions must be specific, scenario-based, and thought-provoking
- Difficulty must match: {difficulty} level

Return ONLY a raw JSON array of 5 strings:
["question1", "question2", "question3", "question4", "question5"]"""

    model = _get_gemini_model()
    if not model:
        print("WARNING: GEMINI_API_KEY not found, using fallback questions")
        return get_fallback_questions(domain, difficulty)

    try:
        print(f"INFO: Generating AI questions for {domain}/{difficulty} (seed={seed}, topics={topics_str})")
        response = await asyncio.to_thread(
            model.generate_content,
            prompt,
            generation_config=genai.types.GenerationConfig(
                temperature=0.95,
                response_mime_type="application/json"
            )
        )
        
        content = response.text.replace("```json", "").replace("```", "").strip()
        questions = json.loads(content)
        if isinstance(questions, list) and len(questions) == 5:
            print(f"INFO: Successfully generated {len(questions)} AI questions")
            return questions
        else:
            print(f"WARNING: Unexpected response format: {questions}")
    except Exception as e:
        print(f"ERROR: Gemini API error (generate): {e}")
        import traceback
        print(traceback.format_exc())

    print("WARNING: Falling back to hardcoded questions")
    return get_fallback_questions(domain, difficulty)

async def evaluate_answer(question: str, answer: str, domain: str, difficulty: str,
                           duration_seconds: float = 0) -> Dict[str, Any]:
    filler_count, filler_list = count_filler_words(answer)
    wpm = calculate_wpm(answer, duration_seconds)

    model = _get_gemini_model()
    if not model:
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

    # Dynamic feedback based on word count and quality
    if word_count < 20:
        feedback = "Your response was quite brief. In a real interview, try to expand more on your thought process and provide specific context."
    elif filler_count > 5:
        feedback = "You have the right ideas, but the delivery was slightly hindered by filler words. Focusing on steady pacing will make your points much more impactful."
    elif word_count > 100:
        feedback = "Excellent depth! You provided a very thorough explanation. Just ensure you keep the 'STAR' method in mind to keep your answers structured."
    else:
        feedback = "A solid, well-rounded answer. You covered the basics effectively. To reach the 'Expert' level, try to talk more about the specific outcomes of your actions."

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
        "feedback": feedback,
        "filler_words": filler_count,
        "filler_word_list": list(set(filler_list)),
        "words_per_minute": wpm,
        "improvement_tips": tips
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
    import random
    base_questions = questions.get(domain, questions["Software Developer"]).get(
        difficulty, questions["Software Developer"]["Intermediate"]
    )
    # Shuffle fallback questions so they aren't always in the same order
    shuffled = list(base_questions)
    random.shuffle(shuffled)
    return shuffled
