import re


NUMBER_WORDS = {
    "one": 1,
    "two": 2,
    "three": 3,
    "four": 4,
    "five": 5,
    "six": 6,
    "seven": 7,
    "eight": 8,
    "nine": 9,
    "ten": 10
}


def normalize_score(score):

    if isinstance(score, int):
        return max(1, min(score, 10))

    if isinstance(score, float):
        return round(max(1, min(score, 10)))

    if isinstance(score, str):

        score = score.lower().strip()

        if score in NUMBER_WORDS:
            return NUMBER_WORDS[score]

        number_match = re.search(r'\d+(\.\d+)?', score)

        if number_match:
            value = float(number_match.group())
            return round(max(1, min(value, 10)))

    return 0