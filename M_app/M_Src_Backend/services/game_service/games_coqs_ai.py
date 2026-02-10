from openai import OpenAI
import os
import re

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
        self.small_talk_pattern = re.compile(
            r"\b(hi|hello|hey|how are you|yo|privet|zdravstvuy|kak dela)\b",
            re.IGNORECASE,
        )

    def set_text(self, text: str):
        self.text_to_give_question_about_it = text

    def give_me_a_question(self) -> str:
        return self.client.Chat(
            model=self.model,
            messages=[
                {"role": "user", "content": self.text_to_give_question_about_it},
            ],
        ).choices[0].message.content.strip()

    def generate_questions(self) -> list[str]:
        prompt = (
            f"Berilgan matn asosida 10 ta savol tuzing. Savollar qisqa, aniq va bolalar uchun qiziqarli bo'lsin.\nMatn:\n{self.text_to_give_question_about_it}\nSavollar:"
        )
        response = self.client.Chat(
            model=self.model,
            messages=[{"role": "user", "content": prompt}],
        )
        content = response.choices[0].message.content.strip()
        questions = [q.strip() for q in re.split(r'\n|\d+\.|\d+\)', content) if q.strip()]
        return questions[:10]

    def evaluate_answer(self, question: str, answer: str) -> dict:
        score = 0
        feedback = ""
        if answer and len(answer) > 2:
            score = min(len(answer), 10)
            feedback = "Yaxshi javob!"
        else:
            feedback = "Javobni to'liqroq yozing."
        return {"score": score, "feedback": feedback}

    def get_user_progress(self, user_id: str) -> dict:
        return {"exp": 0, "level": 1}

    def add_experience(self, user_id: str, exp: int) -> dict:
        progress = self.get_user_progress(user_id)
        progress["exp"] += exp
        progress["level"] = 1 + progress["exp"] // 100
        return progress