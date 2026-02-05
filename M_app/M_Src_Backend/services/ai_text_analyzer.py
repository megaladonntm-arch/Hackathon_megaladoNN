import os
import re

from openai import OpenAI


class MegaladoNNTranslator:
    def __init__(
        self,
        api_key: str,
        target_language: str,
        *,
        model: str | None = None,
        base_url: str | None = None,
    ):
        self.client = OpenAI(
            base_url=base_url or os.getenv("OPENROUTER_BASE_URL", "https://openrouter.ai/api/v1"),
            api_key=api_key
            ,
        )
        self.target_language = target_language
        self.model = model or os.getenv("TRANSLATION_MODEL", "tngtech/deepseek-r1t2-chimera:free")
        self.small_talk_pattern = re.compile(
            r"\b(hi|hello|hey|how are you|yo|privet|zdravstvuy|kak dela)\b",
         
            re.IGNORECASE,
        )

    def set_language(self, language: str):
        self.target_language = language

    def translate(self, text: str) -> str:
        if self._is_small_talk(text):
            return "Please provide a text to translate."

        response = self.client.chat.completions.create(
            model=self.model,
            messages=[
                {
                    "role": "system",
                    "content": (
                        "You are a professional translator. "
                        f"Translate the text strictly into {self.target_language}. "
                        "No explanations. No extra words. Only translated text."
                    ),
                },
                {"role": "user", "content": text},
            ],
        )

        return response.choices[0].message.content.strip()

    def _is_small_talk(self, text: str) -> bool:
        return bool(self.small_talk_pattern.search(text or ""))




