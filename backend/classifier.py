import os
import json
from typing import List
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

@app.get("/")
async def root():
    return {"status": "Alive", "message": "Budget Backend is running!"}
# uvicorn classifier:app --reload