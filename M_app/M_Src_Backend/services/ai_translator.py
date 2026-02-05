from .ai_text_analyzer import MegaladoNNTranslator


def get_translator(target_language: str) -> MegaladoNNTranslator:
    api_key = ""
    if not api_key:
        raise RuntimeError("Missing OPENROUTER_API_KEY or OPENAI_API_KEY.")
    return MegaladoNNTranslator(api_key=api_key, target_language=target_language)
