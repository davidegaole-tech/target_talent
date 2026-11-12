"""CV in PDF, con lo stesso impianto del modello europeo.

Il client manda le sezioni già composte (le stesse della pagina "Il tuo CV"),
così il PDF e la pagina non possono divergere.
"""
from __future__ import annotations

from io import BytesIO
from pathlib import Path

from fastapi import APIRouter, Depends, Response
from pydantic import BaseModel, Field
from reportlab.lib import colors
from reportlab.lib.enums import TA_LEFT
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle
from reportlab.lib.units import mm
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.platypus import (BaseDocTemplate, Frame, HRFlowable, Image, PageTemplate,
                                Paragraph, Spacer, Table, TableStyle)

from ..config import BASE_DIR
from ..services import Services, get_services
from .account import current_user

router = APIRouter(prefix="/api")

BODY_FONT = "Helvetica"
BOLD_FONT = "Helvetica-Bold"


def _register_fonts() -> None:
    """Usa Arial Narrow (il font del modello) se il sistema ce l'ha."""
    global BODY_FONT, BOLD_FONT
    win_fonts = Path("C:/Windows/Fonts")
    regular = win_fonts / "ARIALN.TTF"
    bold = win_fonts / "ARIALNB.TTF"
    if regular.is_file() and bold.is_file():
        try:
            pdfmetrics.registerFont(TTFont("CvNarrow", str(regular)))
            pdfmetrics.registerFont(TTFont("CvNarrow-Bold", str(bold)))
            pdfmetrics.registerFontFamily("CvNarrow", normal="CvNarrow", bold="CvNarrow-Bold",
                                          italic="CvNarrow", boldItalic="CvNarrow-Bold")
            BODY_FONT, BOLD_FONT = "CvNarrow", "CvNarrow-Bold"
        except Exception:  # pragma: no cover - dipende dal sistema
            pass


_register_fonts()


class CvRow(BaseModel):
    label: str = Field(max_length=200)
    value: str = Field(default="", max_length=4000)


class CvSection(BaseModel):
    title: str = Field(max_length=200)
    note: str | None = Field(default=None, max_length=600)
    rows: list[CvRow] = Field(default_factory=list)


class CvDocumentIn(BaseModel):
    title: str = Field(default="Formato europeo per il curriculum vitae", max_length=120)
    sections: list[CvSection] = Field(default_factory=list)


def _styles() -> dict[str, ParagraphStyle]:
    base = dict(fontName=BODY_FONT, textColor=colors.HexColor("#111111"))
    return {
        "title": ParagraphStyle("cv-title", fontName=BOLD_FONT, fontSize=10.5, leading=13,
                                alignment=TA_LEFT, textColor=colors.HexColor("#111111")),
        "section": ParagraphStyle("cv-section", fontName=BOLD_FONT, fontSize=9.5, leading=12,
                                  spaceBefore=0, spaceAfter=0, textColor=colors.HexColor("#111111")),
        "label": ParagraphStyle("cv-label", fontSize=8.6, leading=11.2, **base),
        "value": ParagraphStyle("cv-value", fontSize=8.6, leading=11.2, **base),
        "note": ParagraphStyle("cv-note", fontName=BODY_FONT, fontSize=7.8, leading=10.2,
                               textColor=colors.HexColor("#4a4a4a")),
    }


def _xml(text: str) -> str:
    return (text or "").replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;")


def _pdf_bytes(doc: CvDocumentIn) -> bytes:
    styles = _styles()
    buf = BytesIO()
    page_w, page_h = A4
    margin_x, margin_y = 16 * mm, 15 * mm

    pdf = BaseDocTemplate(buf, pagesize=A4, leftMargin=margin_x, rightMargin=margin_x,
                          topMargin=margin_y, bottomMargin=margin_y,
                          title="Curriculum vitae")
    frame = Frame(margin_x, margin_y, page_w - margin_x * 2, page_h - margin_y * 2, id="cv")
    pdf.addPageTemplates([PageTemplate(id="cv", frames=[frame])])

    story: list = []

    # Intestazione: titolo + bandiera
    flag_path = BASE_DIR / "web" / "img" / "cv-eu-flag.png"
    flag = Image(str(flag_path), width=16 * mm, height=11 * mm) if flag_path.is_file() else ""
    head = Table(
        [[Paragraph(_xml(doc.title), styles["title"]), flag]],
        colWidths=[page_w - margin_x * 2 - 20 * mm, 20 * mm],
    )
    head.setStyle(TableStyle([
        ("VALIGN", (0, 0), (-1, -1), "BOTTOM"),
        ("ALIGN", (1, 0), (1, 0), "RIGHT"),
        ("LEFTPADDING", (0, 0), (-1, -1), 0),
        ("RIGHTPADDING", (0, 0), (-1, -1), 0),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 4),
    ]))
    story.append(head)
    story.append(HRFlowable(width="100%", thickness=1.4, color=colors.HexColor("#1b2b3a"),
                            spaceBefore=0, spaceAfter=6))

    for section in doc.sections:
        story.append(Spacer(1, 5))
        story.append(Paragraph(_xml(section.title), styles["section"]))
        story.append(HRFlowable(width="100%", thickness=0.6, color=colors.HexColor("#1b2b3a"),
                                spaceBefore=2, spaceAfter=3))
        if section.note:
            story.append(Paragraph(_xml(section.note), styles["note"]))
            story.append(Spacer(1, 2))
        if section.rows:
            data = [[Paragraph(_xml(r.label), styles["label"]),
                     Paragraph(_xml(r.value) or "&nbsp;", styles["value"])]
                    for r in section.rows]
            table = Table(data, colWidths=[52 * mm, page_w - margin_x * 2 - 52 * mm])
            table.setStyle(TableStyle([
                ("VALIGN", (0, 0), (-1, -1), "TOP"),
                ("LEFTPADDING", (0, 0), (-1, -1), 0),
                ("RIGHTPADDING", (0, 0), (0, -1), 8),
                ("TOPPADDING", (0, 0), (-1, -1), 2.2),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 2.2),
            ]))
            story.append(table)

    pdf.build(story)
    return buf.getvalue()


@router.post("/cv/pdf")
def cv_pdf(body: CvDocumentIn, user: dict = Depends(current_user),
           s: Services = Depends(get_services)) -> Response:
    data = _pdf_bytes(body)
    return Response(
        content=data,
        media_type="application/pdf",
        headers={"Content-Disposition": 'attachment; filename="curriculum-vitae.pdf"'},
    )
