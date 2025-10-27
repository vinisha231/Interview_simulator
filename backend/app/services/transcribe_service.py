"""
AWS Transcribe Service - Speech-to-Text
=======================================

This service handles converting speech to text using AWS Transcribe.
Used to transcribe user audio answers in voice mode.

Note: For real-time transcription, consider using AWS Transcribe Streaming.
For simpler use cases, this uses synchronous transcription.

Author: LLM Interview Simulator Team
"""

import boto3
import json
import os
import time
from typing import Optional
from dotenv import load_dotenv

load_dotenv()

# Initialize Transcribe client
transcribe_client = boto3.client('transcribe', region_name=os.getenv('AWS_REGION', 'us-east-1'))


class TranscribeService:
    """Service for speech-to-text conversion using AWS Transcribe."""
    
    def __init__(self):
        self.transcribe = transcribe_client
    
    def transcribe_audio_file(self, audio_file_path: str, language_code: str = "en-US") -> Optional[str]:
        """
        Transcribe an audio file using AWS Transcribe.
        
        Args:
            audio_file_path: Path to the audio file
            language_code: Language code (en-US, en-GB, etc.)
            
        Returns:
            Transcribed text, or None if error
        """
        try:
            job_name = f"transcribe-job-{int(time.time())}"
            
            # Start transcription job
            self.transcribe.start_transcription_job(
                TranscriptionJobName=job_name,
                Media={'MediaFileUri': audio_file_path},
                MediaFormat='webm',
                LanguageCode=language_code,
                Settings={
                    'ShowSpeakerLabels': False,
                    'MaxAlternatives': 1
                }
            )
            
            # Wait for job to complete
            while True:
                status = self.transcribe.get_transcription_job(TranscriptionJobName=job_name)
                job_status = status['TranscriptionJob']['TranscriptionJobStatus']
                
                if job_status == 'COMPLETED':
                    # Get the transcript
                    transcript_uri = status['TranscriptionJob']['Transcript']['TranscriptFileUri']
                    # In production, you'd download and parse the JSON file
                    # For now, return placeholder
                    return "[Transcription in progress - integrate with S3 to get full results]"
                    
                elif job_status == 'FAILED':
                    print(f"Transcription job failed: {status['TranscriptionJob']['FailureReason']}")
                    return None
                
                time.sleep(2)  # Wait 2 seconds before checking again
                
        except Exception as e:
            print(f"Error transcribing audio: {str(e)}")
            return None
    
    def transcribe_audio_bytes(
        self, 
        audio_bytes: bytes, 
        s3_bucket: str,
        s3_key: str,
        language_code: str = "en-US"
    ) -> Optional[str]:
        """
        Transcribe audio bytes by uploading to S3 first.
        
        Args:
            audio_bytes: Raw audio data
            s3_bucket: S3 bucket name
            s3_key: S3 object key
            language_code: Language code
            
        Returns:
            Transcribed text
        """
        import boto3
        s3 = boto3.client('s3', region_name=os.getenv('AWS_REGION', 'us-east-1'))
        
        try:
            # Upload audio to S3
            s3.put_object(Bucket=s3_bucket, Key=s3_key, Body=audio_bytes)
            
            # Get the S3 URI
            s3_uri = f"s3://{s3_bucket}/{s3_key}"
            
            # Transcribe using S3 URI
            return self.transcribe_audio_file(s3_uri, language_code)
            
        except Exception as e:
            print(f"Error transcribing from bytes: {str(e)}")
            return None
    
    def get_real_time_transcription(self):
        """
        For real-time streaming transcription.
        This would use WebSocket connection with AWS Transcribe Streaming.
        Implementation depends on frontend architecture.
        """
        # TODO: Implement WebSocket-based real-time transcription
        pass


# Create singleton instance
transcribe_service = TranscribeService()


def get_transcribe_service() -> TranscribeService:
    """Get the singleton Transcribe service instance."""
    return transcribe_service

