import pytest
from pydantic import ValidationError

from app.schemas import FlashcardsOut, QuizOut, SummaryOut, quiz_schema

from .conftest import SUMMARY, make_cards, make_quiz


def test_valid_payloads_pass() -> None:
    SummaryOut.model_validate(SUMMARY)
    QuizOut.model_validate(make_quiz(3))
    FlashcardsOut.model_validate(make_cards(4))


def test_quiz_three_options_fails() -> None:
    data = make_quiz(3)
    data["questions"][0]["options"] = ["a", "b", "c"]
    with pytest.raises(ValidationError):
        QuizOut.model_validate(data)


def test_quiz_answer_out_of_range_fails() -> None:
    data = make_quiz(3)
    data["questions"][1]["answer"] = 5
    with pytest.raises(ValidationError):
        QuizOut.model_validate(data)


@pytest.mark.parametrize("model,data,field", [
    (QuizOut, make_quiz(3), "title"),
    (SummaryOut, SUMMARY, "keyPoints"),
    (FlashcardsOut, make_cards(4), "cards"),
])
def test_missing_fields_fail(model, data, field) -> None:
    data = dict(data)
    data.pop(field)
    with pytest.raises(ValidationError):
        model.model_validate(data)


def test_quiz_question_missing_explanation_key_is_tolerated_but_q_is_required() -> None:
    data = make_quiz(3)
    del data["questions"][0]["q"]
    with pytest.raises(ValidationError):
        QuizOut.model_validate(data)


def test_json_schema_shape() -> None:
    s = quiz_schema()
    item = s["properties"]["questions"]["items"]
    assert item["properties"]["options"]["minItems"] == 4
    assert item["properties"]["answer"]["maximum"] == 3
