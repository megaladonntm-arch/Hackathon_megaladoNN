import random
import re
from typing import List, Tuple


_WORD_RE = re.compile(r"\b[\w'-]+\b", re.UNICODE)


def _extract_words(text: str) -> List[str]:
    return _WORD_RE.findall(text or "")


def get_random_words(text: str, count: int) -> Tuple[int, List[str]]:
    words = _extract_words(text)
    total = len(words)
    if total == 0 or count <= 0:
        return total, []

    if count >= total:
        shuffled = words[:]
        random.shuffle(shuffled)
        return total, shuffled

    return total, random.sample(words, count)
