from .ai_text_analyzer import MegaladoNNTranslator


def get_translator(target_language: str) -> MegaladoNNTranslator:
    api_key = "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"
    if not api_key:
        raise RuntimeError("Missing OPENROUTER_API_KEY or OPENAI_API_KEY.")
    return MegaladoNNTranslator(api_key=api_key, target_language=target_language)
