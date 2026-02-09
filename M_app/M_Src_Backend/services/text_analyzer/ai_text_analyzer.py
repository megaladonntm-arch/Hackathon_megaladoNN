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

        max_chars = int(os.getenv("TRANSLATION_CHUNK_SIZE", "2000"))
        translated_parts: list[str] = []
        blocks = re.split(r"\n\s*\n", text or "")
        seps = re.findall(r"\n\s*\n", text or "")

        for index, block in enumerate(blocks):
            translated_parts.append(self._translate_block(block, max_chars))
            if index < len(seps):
                translated_parts.append(seps[index])

        return "".join(translated_parts).strip()

    def _translate_block(self, block: str, max_chars: int) -> str:
        trimmed = (block or "").strip()
        if not trimmed:
            return ""
        if len(trimmed) <= max_chars:
            return self._translate_chunk(trimmed)

        chunks = self._split_long_block(trimmed, max_chars)
        translations: list[str] = []
        for chunk in chunks:
            translated = self._translate_chunk(chunk)
            if translated:
                translations.append(translated.strip())
        return " ".join(translations).strip()

    def _split_long_block(self, block: str, max_chars: int) -> list[str]:
        sentences = re.split(r"(?<=[.!?])\s+", block)
        chunks: list[str] = []
        current = ""
        for sentence in sentences:
            if not sentence:
                continue
            if not current:
                current = sentence
                continue
            if len(current) + 1 + len(sentence) <= max_chars:
                current = f"{current} {sentence}"
                continue

            chunks.append(current)
            if len(sentence) <= max_chars:
                current = sentence
            else:
                for idx in range(0, len(sentence), max_chars):
                    chunks.append(sentence[idx : idx + max_chars])
                current = ""
        if current:
            chunks.append(current)
        return chunks

    def _translate_chunk(self, text: str) -> str:
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

        text_response = response.choices[0].message.content.strip()
        return text_response


    def _is_small_talk(self, text: str) -> bool:
        return bool(self.small_talk_pattern.search(text or ""))



