import asyncio
import json
import sys
import os

# Ensure the backend directory is in the path so we can import app modules
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), 'backend')))

from app.services.ai_service import generate_questions, evaluate_answer

async def test_gemini():
    print("Testing generate_questions...")
    try:
         questions = await generate_questions("Software Engineering", "Intermediate")
         print("Generated Questions:")
         print(json.dumps(questions, indent=2))
         
         if not isinstance(questions, list) or len(questions) != 5:
             print("FAILED: Did not return exactly 5 list items.")
             return
         
         print("\nTesting evaluate_answer...")
         eval_result = await evaluate_answer(
             question=questions[0],
             answer="Well, um, I think software engineering is about writing code and stuff. Like, you know, making apps that people use on their phones.",
             domain="Software Engineering",
             difficulty="Intermediate",
             duration_seconds=15.0
         )
         print("Evaluation Result:")
         print(json.dumps(eval_result, indent=2))
         
         if "technical_score" not in eval_result or "improvement_tips" not in eval_result:
             print("FAILED: Missing schema keys in evaluation result.")
             return
             
         print("\nGEMINI API TEST SUCCESSFUL!")
    except Exception as e:
         print(f"FAILED with unexpected exception: {e}")

if __name__ == "__main__":
    asyncio.run(test_gemini())
