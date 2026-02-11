from openai import OpenAI
import os
import re
import json


def _require_openrouter_base_url() -> str:
    value = (os.getenv("OPENROUTER_BASE_URL") or "").strip()
    if not value:
        raise RuntimeError("Missing OPENROUTER_BASE_URL environment variable.")
    return value


class AiQuestioneer:
    def __init__(
        self,
        api_key: str,
        text_to_give_question_about_it: str,
        quiz_title: str | None = None,
        *,
        model: str | None = None,
        base_url: str | None = None,
    ):
        self.client = OpenAI(
            base_url=base_url or _require_openrouter_base_url(),
            api_key=api_key,
        )
        self.text_to_give_question_about_it = text_to_give_question_about_it
        self.quiz_title = (quiz_title or "").strip()
        self.model = model or os.getenv("QUESTIONEER_MODEL", "tngtech/deepseek-r1t2-chimera:free")

    def set_text(self, text: str):
        self.text_to_give_question_about_it = text

    def set_title(self, title: str):
        self.quiz_title = (title or "").strip()

    def give_me_a_question(self) -> str:
        response = self.client.chat.completions.create(
            model=self.model,
            messages=[
                {"role": "user", "content": self.text_to_give_question_about_it},
            ],
        )
        return response.choices[0].message.content.strip()

    def _extract_json_array(self, content: str) -> list[str]:
        cleaned = (content or "").strip()
        if not cleaned:
            return []
        if "```" in cleaned:
            cleaned = re.sub(r"^```(?:json)?\s*|\s*```$", "", cleaned, flags=re.IGNORECASE | re.DOTALL).strip()
        left = cleaned.find("[")
        right = cleaned.rfind("]")
        if left == -1 or right == -1 or right <= left:
            return []
        raw = cleaned[left : right + 1]
        try:
            parsed = json.loads(raw)
        except Exception:
            return []
        if not isinstance(parsed, list):
            return []
        return [str(item).strip() for item in parsed if str(item).strip()]

    def _extract_list_lines(self, content: str) -> list[str]:
        lines = []
        for raw in (content or "").splitlines():
            line = raw.strip()
            if not line:
                continue
            line = re.sub(r"^\d+[\.\)]\s*", "", line)
            line = re.sub(r"^[-*]\s*", "", line)
            line = line.strip()
            if line:
                lines.append(line)
        return lines

    def _fallback_questions(self) -> list[str]:
        text = (self.text_to_give_question_about_it or "").strip()
        title = self.quiz_title
        seeds = []
        for part in re.split(r"[.!?]\s+|\n+", text):
            p = part.strip()
            if len(p) > 20:
                seeds.append(p)
        base = []
        if title:
            base.append(f"'{title}' mavzusining asosiy g'oyasi nima?")
        if seeds:
            for sentence in seeds[:10]:
                short = sentence[:140].rstrip(" ,;:")
                base.append(f"Quyidagi fikr nimani anglatadi: {short}?")
        defaults = [
            "Matndagi eng muhim fikr qaysi?",
            "Matnga ko'ra muallif nimani tushuntirmoqchi?",
            "Matndan bitta misol keltiring.",
            "Matndagi qaysi qism sizga eng qiziq tuyuldi?",
            "Matndan qanday xulosa qilish mumkin?",
            "Matn bo'yicha asosiy tushunchalarni sanang.",
            "Matn qaysi mavzuni yoritadi?",
            "Matndan olingan yangi bilim nima bo'ldi?",
            "Matn mazmunini 2-3 gapda ayting.",
            "Matndagi asosiy xabar nima?",
        ]
        base.extend(defaults)
        unique = []
        seen = set()
        for q in base:
            norm = q.lower()
            if norm in seen:
                continue
            seen.add(norm)
            unique.append(q.strip())
            if len(unique) == 10:
                break
        return unique

    def generate_questions(self) -> list[str]:
        title_block = f"Sarlavha: {self.quiz_title}\n" if self.quiz_title else ""
        prompt = (
            "Berilgan ma'lumot asosida aniq 10 ta viktorina savoli tuz.\n"
            "Javob faqat JSON massiv bo'lsin: [\"savol 1\", \"savol 2\", ...].\n"
            "Hech qanday izoh, markdown yoki qo'shimcha matn yozma.\n"
            "Savollar qisqa, tushunarli va bolalar uchun mos bo'lsin.\n"
            f"{title_block}"
            f"Matn:\n{self.text_to_give_question_about_it}"
        )
        response = self.client.chat.completions.create(
            model=self.model,
            messages=[
                {"role": "system", "content": "Sen viktorina savollari generatorisan. Formatga qat'iy rioya qil."},
                {"role": "user", "content": prompt},
            ],
        )
        content = response.choices[0].message.content.strip()
        questions = self._extract_json_array(content)
        if not questions:
            questions = self._extract_list_lines(content)
        cleaned = []
        seen = set()
        for q in questions:
            v = q.strip().strip('"').strip("'").strip()
            if len(v) < 8:
                continue
            norm = v.lower()
            if norm in seen:
                continue
            seen.add(norm)
            cleaned.append(v)
            if len(cleaned) == 10:
                break
        if len(cleaned) < 5:
            return self._fallback_questions()
        if len(cleaned) < 10:
            tail = self._fallback_questions()
            for q in tail:
                if q.lower() in seen:
                    continue
                cleaned.append(q)
                if len(cleaned) == 10:
                    break
        return cleaned[:10]

    def evaluate_answer(self, question: str, answer: str) -> dict:
        prompt = (
            "Foydalanuvchi javobini bahola.\n"
            "Format aniq bo'lsin:\n"
            "SCORE: <1-10>\n"
            "FEEDBACK: <qisqa izoh>\n"
            f"Savol: {question}\n"
            f"Javob: {answer}"
        )
        response = self.client.chat.completions.create(
            model=self.model,
            messages=[
                {"role": "system", "content": "Sen javob baholovchi assistentsan. Faqat kerakli formatda yoz."},
                {"role": "user", "content": prompt},
            ],
        )
        content = response.choices[0].message.content.strip()

        score = 5
        score_match = re.search(r"SCORE\s*:\s*(10|[1-9])", content, flags=re.IGNORECASE)
        if score_match:
            score = int(score_match.group(1))
        else:
            for match in re.finditer(r"\b([1-9]|10)\b", content):
                score = int(match.group(1))
                break
        feedback_match = re.search(r"FEEDBACK\s*:\s*(.+)", content, flags=re.IGNORECASE | re.DOTALL)
        feedback = feedback_match.group(1).strip() if feedback_match else content
        if not feedback:
            feedback = "Javob qabul qilindi."
        return {"score": max(1, min(score, 10)), "feedback": feedback}
