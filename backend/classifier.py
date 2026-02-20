import os
import json
from typing import List, Optional, Any, Dict
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from google import genai 
from dotenv import load_dotenv

load_dotenv()
client = genai.Client(api_key=os.getenv("GEMINI_API"))

app = FastAPI()

origins = [
    "http://localhost:5173", 
    "https://shriyabi.github.io"
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins, 
    allow_credentials=True,
    allow_methods=["POST"],
    allow_headers=["*"],
)

class ClassifyRequest(BaseModel):
    transaction_descriptions: List[str] #starbucks
    categories: List[str]

@app.post("/classify")
async def classify_transactions(request: ClassifyRequest):
    try:
        prompt = f"""
        You are a financial classifier. 
        Map these transaction descriptions to the EXACT category names from this list: {json.dumps(request.categories)}.
        If a transaction doesn't match well, use "Uncategorized".

        Descriptions:
        {json.dumps(request.transaction_descriptions)}

        Return ONLY a valid JSON object where keys are indices (strings) and values are Category Names.
        Example: {{ "0": "Groceries", "1": "Rent" }}
        """
        response = client.models.generate_content(
            model='gemini-2.5-flash',
            contents=prompt,
            config={
                'response_mime_type': 'application/json'
            }
        )
        return json.loads(response.text)

    except Exception as e:
        print(f"AI Error: {e}")
        raise HTTPException(status_code=500, detail=f"AI Classification Failed: {str(e)}")


#generate budget template code
class GenTemplateRequest(BaseModel):
    situation: str
    net_income: float
    
@app.post("/generate-template")
async def generate_template(request: GenTemplateRequest):
    print(request.situation); 
    system_prompt = f"""
    Generate a monthly budget template based on the user's life situation.
    User Income: ${request.net_income}
    User Situation: {request.situation}

    RULES:
    1. You must come up with the categories depending on user's mandatory expenses and spending goals. 
    2. The total sum of amounts MUST equal ${request.net_income}.
    3. Return ONLY a valid JSON object.
    
    Example: {{"HOUSING": 1000, "GROCERIES": 400, "SAVINGS": 200}}
    """
    try:
        response = client.models.generate_content(
            model='gemini-2.5-flash',
            contents=system_prompt,
            config={'response_mime_type': 'application/json'}
        )
        return json.loads(response.text)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

#pydantic for request
class AnalyzeRequest(BaseModel):
    statements: List[str]
    goals: str
    income: float
    hasBudget: bool
    currentBudget: Optional[List[Dict[str, Any]]] = None

# @app.post("/analyze-spending")
# async def analyze_spending(request: AnalyzeRequest):
#     # 1. Format the budget context if it exists
#     budget_context = ""
#     if request.hasBudget and request.currentBudget:
#         # Extract just the category names and amounts to save tokens and avoid passing UI state
#         clean_budget = "\n".join([
#             f"- {item.get('category', 'Unknown')}: ${item.get('amount', 0)}" 
#             for item in request.currentBudget if item.get('isActive') is not False
#         ])
#         budget_context = f"""
#         THE USER'S CURRENT BUDGET PLAN:
#         {clean_budget}

#         YOUR TASK: Compare their actual spending from the statements against this budget plan. 
#         Identify specific categories where they are overspending or underspending.
#         """
#     else:
#         budget_context = """
#         THE USER HAS NO BUDGET PLAN.
#         YOUR TASK: Categorize their spending from the raw statements and highlight their top 3 spending areas. 
#         Suggest a baseline budget breakdown they should adopt to reach their goals.
#         """

#     # 2. Combine the statements into a readable block
#     statement_text = "\n---\n".join(request.statements)

#     # 3. Construct the Master Prompt
#     system_prompt = f"""
#     You are an expert, empathetic financial advisor analyzing a client's bank statements.

#     CLIENT PROFILE:
#     - Net Income: ${request.net_income if hasattr(request, 'net_income') else request.income} per period.
#     - Financial Goals: {request.goals}

#     {budget_context}

#     RAW BANK STATEMENTS:
#     {statement_text}

#     INSTRUCTIONS:
#     Write a comprehensive analysis addressing the user directly ("You"). 
#     Format the response using clean Markdown with headers (###), bullet points, and bold text for readability.
#     Do not use generic fluff. Be highly specific using the numbers found in their statements.
    
#     Structure your response exactly like this:
#     1. 📊 Spending Overview (Summarize what you found in the statements)
#     2. 🎯 Goal Alignment (How their spending helps or hurts their stated goals)
#     3. 💡 Budget Critique & Optimization (Address their current budget, or suggest one)
#     4. 🚀 Action Items (3 concrete steps they can take tomorrow)

#     Return ONLY a valid JSON object with a single key "analysis" containing your formatted markdown string.
#     Example: {{"analysis": "### 📊 Spending Overview\\nYou spent a lot on..."}}
#     """

#     try:
#         response = client.models.generate_content(
#             model='gemini-2.5-flash',
#             contents=system_prompt,
#             config={'response_mime_type': 'application/json'}
#         )
#         return json.loads(response.text)
#     except Exception as e:
#         print(f"AI Analysis Error: {e}")
#         raise HTTPException(status_code=500, detail=str(e))

@app.post("/analyze-spending")
async def analyze_spending(request: AnalyzeRequest):
    # 1. Format the budget context if it exists
    budget_context = ""
    if request.hasBudget and request.currentBudget:
        clean_budget = "\n".join([
            f"- {item.get('category', 'Unknown')}: ${item.get('amount', 0)}" 
            for item in request.currentBudget if item.get('isActive') is not False
        ])
        budget_context = f"""
        THE USER'S CURRENT BUDGET PLAN:
        {clean_budget}

        YOUR TASK: Compare their actual spending from the statements against this budget plan. 
        Identify specific categories where they are overspending or underspending.
        """
    else:
        budget_context = """
        THE USER HAS NO BUDGET PLAN.
        YOUR TASK: Categorize their spending from the raw statements and highlight their top 3 spending areas. 
        Suggest a baseline budget breakdown they should adopt to reach their goals.
        """

    # 2. Combine the statements
    statement_text = "\n---\n".join(request.statements)

    # 3. Construct the Master Prompt
    system_prompt = f"""
    You are an expert, empathetic financial advisor analyzing a client's bank statements.

    CLIENT PROFILE:
    - Net Income: ${request.income} per period.
    - Financial Goals: {request.goals}

    {budget_context}

    RAW BANK STATEMENTS:
    {statement_text}

    INSTRUCTIONS:
    Write a comprehensive analysis addressing the user directly ("You"). 
    Format the response using clean Markdown with headers (###), bullet points, and bold text for readability.
    Do not use generic fluff. Be highly specific using the numbers found in their statements.
    
    Structure your response exactly like this:
    1. 📊 Spending Overview
    2. 🎯 Goal Alignment
    3. 💡 Budget Critique & Optimization
    4. 🚀 Action Items

    IMPORTANT: RETURN ONLY PURE MARKDOWN TEXT. DO NOT WRAP IN JSON. DO NOT USE BACKTICKS.
    """

    try:
        print(system_prompt)
        response = client.models.generate_content(
            model='gemini-2.5-flash',
            contents=system_prompt
        )
        
        return {"analysis": response.text}
        
    except Exception as e:
        print(f"AI Analysis Error: {e}")
        raise HTTPException(status_code=500, detail=str(e))
    
@app.get("/")
async def root():
    return {"status": "Alive", "message": "Budget Backend is running!"}
# uvicorn classifier:app --reload
