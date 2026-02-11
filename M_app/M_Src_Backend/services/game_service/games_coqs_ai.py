from openai import OpenAI
import os
import re
from sqlalchemy.orm import Session


class AiQuestioneer:
    def __init__(
        self,
        api_key: str,
        text_to_give_question_about_it: str,
        *,
        model: str | None = None,
        base_url: str | None = None,
    ):
        self.client = OpenAI(
            base_url=base_url or os.getenv("OPENROUTER_BASE_URL", "https://openrouter.ai/api/v1"),
            api_key=api_key,
        )
        self.text_to_give_question_about_it = text_to_give_question_about_it
        self.model = model or os.getenv("Questioneer-model", "tngtech/deepseek-r1t2-chimera:free")

    def set_text(self, text: str):
        self.text_to_give_question_about_it = text

    def give_me_a_question(self) -> str:
        response = self.client.chat.completions.create(
            model=self.model,
            messages=[
                {"role": "user", "content": self.text_to_give_question_about_it},
            ],
        )
        return response.choices[0].message.content.strip()

    def generate_questions(self) -> list[str]:
        prompt = (
            f"Berilgan matn asosida 10 ta savol tuzing. Savollar qisqa, aniq va bolalar uchun qiziqarli bo'lsin.\nMatn:\n{self.text_to_give_question_about_it}\nSavollar:"
        )
        response = self.client.chat.completions.create(
            model=self.model,
            messages=[{"role": "user", "content": prompt}],
        )
        content = response.choices[0].message.content.strip()
        questions = [q.strip() for q in re.split(r'\n|\d+\.|\d+\)', content) if q.strip()]
        return questions[:10]

    def evaluate_answer(self, question: str, answer: str) -> dict:
        prompt = f"Savol: {question}\nJavob: {answer}\n\nJavobni 1-10 orasida baholang va qisqa fikiring bering."
        response = self.client.chat.completions.create(
            model=self.model,
            messages=[{"role": "user", "content": prompt}],
        )
        content = response.choices[0].message.content.strip()
        
        score = 5
        for match in re.finditer(r'\b([1-9]|10)\b', content):
            try:
                score = min(int(match.group(1)), 10)
                break
            except ValueError:
                pass
        
        return {"score": score, "feedback": content}