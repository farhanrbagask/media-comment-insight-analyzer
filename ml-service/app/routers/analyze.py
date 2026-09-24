"""
Main analyze endpoint — orchestrates the full NLP pipeline.
"""
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List, Optional

from app.services.preprocessor import preprocess_batch
from app.services.sentiment import analyze_sentiment
from app.services.keywords import extract_keywords
from app.services.topics import extract_topics
from app.services.insight import generate_insight

router = APIRouter()


class AnalyzeRequest(BaseModel):
    comments: List[str]


class CommentResult(BaseModel):
    text: str
    processed_text: str
    sentiment: str
    score: float
    topic: Optional[str] = None


class KeywordResult(BaseModel):
    keyword: str
    frequency: int
    percentage: float


class TopicResult(BaseModel):
    topic: str
    frequency: int
    percentage: float


class InsightResult(BaseModel):
    overall: str
    positive: str
    negative: str
    topics: str
    recommendation: str


class AnalyzeResponse(BaseModel):
    comments: List[CommentResult]
    keywords: List[KeywordResult]
    topics: List[TopicResult]
    insight: InsightResult


@router.post("/analyze", response_model=AnalyzeResponse)
async def analyze(request: AnalyzeRequest):
    raw_comments = request.comments

    if not raw_comments:
        raise HTTPException(status_code=400, detail="No comments provided.")

    if len(raw_comments) > 5000:
        raise HTTPException(status_code=400, detail="Too many comments. Maximum 5000 per request.")

    # 1. Preprocessing
    processed_texts = preprocess_batch(raw_comments)

    # Filter out empty texts (keep index alignment)
    valid_indices = [i for i, t in enumerate(processed_texts) if t.strip()]
    valid_texts = [processed_texts[i] for i in valid_indices]

    # 2. Sentiment analysis
    sentiment_results = analyze_sentiment(processed_texts)

    # 3. Keyword extraction (on valid processed texts)
    keywords = extract_keywords(valid_texts, top_n=20)

    # 4. Topic modeling
    per_comment_topics, topic_summary = extract_topics(valid_texts)

    # Map topics back to all comment indices
    topic_map = {}
    valid_idx_counter = 0
    for i in range(len(raw_comments)):
        if i in valid_indices:
            topic_map[i] = per_comment_topics[valid_idx_counter] if valid_idx_counter < len(per_comment_topics) else None
            valid_idx_counter += 1
        else:
            topic_map[i] = None

    # 5. Build per-comment results
    comment_results = []
    for i, (raw, processed, sent) in enumerate(zip(raw_comments, processed_texts, sentiment_results)):
        comment_results.append(CommentResult(
            text=raw,
            processed_text=processed,
            sentiment=sent["sentiment"],
            score=sent["score"],
            topic=topic_map.get(i),
        ))

    # 6. Aggregate counts
    total = len(comment_results)
    positive_count = sum(1 for c in comment_results if c.sentiment == "positive")
    neutral_count  = sum(1 for c in comment_results if c.sentiment == "neutral")
    negative_count = sum(1 for c in comment_results if c.sentiment == "negative")

    # 7. Generate insight
    comment_dicts = [c.model_dump() for c in comment_results]
    insight = generate_insight(
        total=total,
        positive_count=positive_count,
        neutral_count=neutral_count,
        negative_count=negative_count,
        keywords=keywords,
        topics=topic_summary,
        comment_details=comment_dicts,
    )

    return AnalyzeResponse(
        comments=comment_results,
        keywords=[KeywordResult(**k) for k in keywords],
        topics=[TopicResult(**t) for t in topic_summary],
        insight=InsightResult(**insight),
    )
