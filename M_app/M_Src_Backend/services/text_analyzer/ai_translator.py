import os
from dotenv import load_dotenv
from .ai_text_analyzer import MegaladoNNTranslator

# Load environment variables
load_dotenv()


def get_translator(target_language: str) -> MegaladoNNTranslator:
    api_key = os.getenv("OPENROUTER_API_KEY")
    if not api_key:
        raise RuntimeError("Missing OPENROUTER_API_KEY environment variable. Please set it in .env file.")
    return MegaladoNNTranslator(api_key=api_key, target_language=target_language)
