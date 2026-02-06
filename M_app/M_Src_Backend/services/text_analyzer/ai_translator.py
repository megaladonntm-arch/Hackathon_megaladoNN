from .ai_text_analyzer import MegaladoNNTranslator


def get_translator(target_language: str) -> MegaladoNNTranslator:
    api_key = "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"
    if not api_key:
        raise RuntimeError("Missing OPENROUTER_API_KEY or OPENAI_API_KEY.")
    return MegaladoNNTranslator(api_key=api_key, target_language=target_language)
