from openai import OpenAI
import re


class MegaladoNNTranslator:
    def __init__(self, api_key: str, target_language: str):
        self.client = OpenAI(
            base_url="https://openrouter.ai/api/v1",
            api_key=api_key
        )
        self.target_language = target_language
        self.small_talk_pattern = re.compile(
            r"\b(hi|hello|hey|привет|здравствуй|как дела|how are you|yo)\b",
            re.IGNORECASE
        )

    def set_language(self, language: str):
        self.target_language = language

    def translate(self, text: str) -> str:
        if self._is_small_talk(text):
            return "Я из компании MegaladoNN, дайте текст для перевода."

        response = self.client.chat.completions.create(
            model="tngtech/deepseek-r1t2-chimera:free",
            messages=[
                {
                    "role": "system",
                    "content": (
                        f"You are a professional translator. "
                        f"Translate the text strictly into {self.target_language}. "
                        f"No explanations. No extra words. Only translated text."
                    )
                },
                {
                    "role": "user",
                    "content": text
                }
            ]
        )

        return response.choices[0].message.content.strip()

    def _is_small_talk(self, text: str) -> bool:
        return bool(self.small_talk_pattern.search(text))
