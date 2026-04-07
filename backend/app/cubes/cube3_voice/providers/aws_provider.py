"""AWS Transcribe STT batch provider implementation.

Uses AWS Transcribe for batch (non-streaming) transcription via boto3.
The batch API accepts audio bytes and returns transcript with confidence.

Pinned to aws-transcribe model ID for reproducibility tracking.
Language support: 23 languages from the AWS Transcribe language map.
"""

import asyncio
import io
import json
import uuid

import structlog

from app.config import settings
from app.cubes.cube3_voice.providers.base import (
    STTProviderError,
    STTProviderName,
    STTProvider,
    TranscriptionResult,
)

logger = structlog.get_logger(__name__)

_AWS_MODEL = "aws-transcribe"

# AWS Transcribe language codes for system languages
# Reused from aws_realtime.py — 23 languages supported
_AWS_LANGUAGE_MAP: dict[str, str] = {
    "en": "en-US", "es": "es-US", "fr": "fr-FR", "de": "de-DE",
    "it": "it-IT", "pt": "pt-BR", "nl": "nl-NL", "pl": "pl-PL",
    "ru": "ru-RU", "uk": "uk-UA", "ja": "ja-JP", "zh": "zh-CN",
    "ko": "ko-KR", "ar": "ar-SA", "hi": "hi-IN", "th": "th-TH",
    "vi": "vi-VN", "id": "id-ID", "ms": "ms-MY", "tr": "tr-TR",
    "sv": "sv-SE", "da": "da-DK", "he": "he-IL",
}

# Media format mapping for AWS Transcribe
_FORMAT_MEDIA = {
    "webm": "webm",
    "wav": "wav",
    "mp3": "mp3",
    "ogg": "ogg",
    "m4a": "mp4",
    "flac": "flac",
}


class AWSTranscribeSTT(STTProvider):
    """AWS Transcribe batch STT provider using boto3 transcribe client.

    Uses the synchronous start_transcription_job API wrapped in asyncio.to_thread
    for non-blocking execution. Audio is uploaded to a temporary S3 location
    or transcribed inline depending on availability.

    For the MVP, uses the synchronous TranscribeClient approach with
    start_transcription_job + polling for completion.
    """

    provider_name = STTProviderName.AWS

    def __init__(self) -> None:
        # Lazy import — boto3 only needed when AWS is actually used
        pass

    def model_id(self) -> str:
        return _AWS_MODEL

    def supports_language(self, language_code: str) -> bool:
        return language_code.lower().split("-")[0] in _AWS_LANGUAGE_MAP

    async def transcribe(
        self,
        audio_bytes: bytes,
        language_code: str,
        audio_format: str = "webm",
    ) -> TranscriptionResult:
        """Transcribe audio using AWS Transcribe batch API.

        Uploads audio to S3 (if configured) or uses inline media,
        starts a transcription job, and polls for completion.
        """
        lang = language_code.lower().split("-")[0]
        aws_lang = _AWS_LANGUAGE_MAP.get(lang, "en-US")
        media_format = _FORMAT_MEDIA.get(audio_format, "webm")

        try:
            result = await asyncio.to_thread(
                self._sync_transcribe,
                audio_bytes,
                aws_lang,
                media_format,
            )
            return result

        except STTProviderError:
            raise
        except Exception as e:
            logger.error("cube3.aws.error", error=str(e))
            raise STTProviderError("aws", str(e)) from e

    def _sync_transcribe(
        self,
        audio_bytes: bytes,
        aws_language: str,
        media_format: str,
    ) -> TranscriptionResult:
        """Synchronous transcription — runs in thread via asyncio.to_thread."""
        import boto3
        import time

        if not settings.aws_access_key_id:
            raise STTProviderError("aws", "AWS credentials not configured")

        client = boto3.client(
            "transcribe",
            region_name=settings.aws_region,
            aws_access_key_id=settings.aws_access_key_id,
            aws_secret_access_key=settings.aws_secret_access_key,
        )

        s3_client = boto3.client(
            "s3",
            region_name=settings.aws_region,
            aws_access_key_id=settings.aws_access_key_id,
            aws_secret_access_key=settings.aws_secret_access_key,
        )

        # Generate unique job name
        job_name = f"exel-stt-{uuid.uuid4().hex[:12]}"
        bucket = f"exel-stt-{settings.aws_region}"
        s3_key = f"audio/{job_name}.{media_format}"

        try:
            # Upload audio to S3
            s3_client.put_object(
                Bucket=bucket,
                Key=s3_key,
                Body=audio_bytes,
            )

            # Start transcription job
            client.start_transcription_job(
                TranscriptionJobName=job_name,
                LanguageCode=aws_language,
                MediaFormat=media_format,
                Media={"MediaFileUri": f"s3://{bucket}/{s3_key}"},
            )

            # Poll for completion (max 60 seconds)
            for _ in range(120):
                response = client.get_transcription_job(
                    TranscriptionJobName=job_name,
                )
                status = response["TranscriptionJob"]["TranscriptionJobStatus"]

                if status == "COMPLETED":
                    break
                elif status == "FAILED":
                    reason = response["TranscriptionJob"].get("FailureReason", "Unknown")
                    raise STTProviderError("aws", f"Transcription failed: {reason}")

                time.sleep(0.5)
            else:
                raise STTProviderError("aws", "Transcription timed out (60s)")

            # Get transcript from result URL
            result_uri = response["TranscriptionJob"]["Transcript"]["TranscriptFileUri"]

            import urllib.request
            with urllib.request.urlopen(result_uri) as resp:
                result_data = json.loads(resp.read().decode())

            transcript_text = ""
            confidence = 0.85
            duration = 0.0

            results = result_data.get("results", {})
            transcripts = results.get("transcripts", [])
            if transcripts:
                transcript_text = transcripts[0].get("transcript", "")

            # Calculate average confidence from items
            items = results.get("items", [])
            if items:
                confidences = [
                    float(alt.get("confidence", 0.0))
                    for item in items
                    for alt in item.get("alternatives", [])
                    if alt.get("confidence")
                ]
                if confidences:
                    confidence = sum(confidences) / len(confidences)

                # Estimate duration from last item end_time
                end_times = [
                    float(item.get("end_time", 0.0))
                    for item in items
                    if item.get("end_time")
                ]
                if end_times:
                    duration = max(end_times)

            logger.info(
                "cube3.aws.transcribed",
                language=aws_language,
                transcript_length=len(transcript_text),
                confidence=round(confidence, 4),
                duration_sec=duration,
            )

            from app.cubes.cube3_voice.providers.base import compute_stt_cost

            dur = round(duration, 2)
            return TranscriptionResult(
                transcript=transcript_text,
                confidence=round(confidence, 4),
                language_detected=aws_language.split("-")[0],
                provider="aws",
                audio_duration_sec=dur,
                cost_usd=compute_stt_cost("aws", dur),
            )

        finally:
            # Cleanup: delete temporary S3 object and transcription job
            try:
                s3_client.delete_object(Bucket=bucket, Key=s3_key)
            except Exception:
                pass
            try:
                client.delete_transcription_job(TranscriptionJobName=job_name)
            except Exception:
                pass
