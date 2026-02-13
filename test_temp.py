from google import genai
import os
from dotenv import load_dotenv

load_dotenv()
API_KEY = os.getenv("GEMINI_API_KEY")
client = genai.Client(api_key=API_KEY)


try:
    response = client.models.generate_content(
        model="models/gemini-2.5-flash",
        contents="Give me a random number between 1 and 100",
        config={
            'temperature': 0.1
        }
    )
    print("Success with dict config")
    print(response.text)
except Exception as e:
    print(f"Failed with dict config: {e}")

try:
    from google.genai import types
    response = client.models.generate_content(
        model="models/gemini-2.5-flash",
        contents="Give me a random number between 1 and 100",
        config=types.GenerateContentConfig(temperature=0.1)
    )
    print("Success with types.GenerateContentConfig")
    print(response.text)
except Exception as e:
    print(f"Failed with types.GenerateContentConfig: {e}")
