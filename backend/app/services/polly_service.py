"""
AWS Polly Service - Text-to-Speech
==================================

This service handles converting text to speech using AWS Polly.
Used to speak interviewer questions to users in voice mode.

Author: LLM Interview Simulator Team
"""

import boto3
import json
import os
from typing import Optional
from dotenv import load_dotenv

load_dotenv()

# Initialize Polly client
polly_client = boto3.client('polly', region_name=os.getenv('AWS_REGION', 'us-east-1'))


class PollyService:
    """Service for text-to-speech conversion using AWS Polly."""
    
    def __init__(self):
        self.polly = polly_client
    
    def synthesize_speech(
        self, 
        text: str, 
        voice_id: str = "Joanna",
        output_format: str = "mp3"
    ) -> Optional[bytes]:
        """
        Convert text to speech using AWS Polly.
        
        Args:
            text: The text to convert to speech
            voice_id: AWS Polly voice ID (default: Joanna - female, neutral)
            output_format: Output format (mp3, ogg_vorbis, pcm)
            
        Returns:
            Audio data as bytes, or None if error
        """
        try:
            response = self.polly.synthesize_speech(
                Text=text,
                VoiceId=voice_id,
                OutputFormat=output_format,
                Engine='neural'  # Use neural engine for better quality
            )
            
            # Return the audio stream
            return response['AudioStream'].read()
            
        except Exception as e:
            print(f"Error synthesizing speech: {str(e)}")
            return None
    
    def get_available_voices(self, language_code: str = "en-US") -> list:
        """
        Get list of available voices for a language.
        
        Args:
            language_code: Language code (en-US, en-GB, etc.)
            
        Returns:
            List of available voice IDs
        """
        try:
            response = self.polly.describe_voices(LanguageCode=language_code)
            return [voice['Id'] for voice in response['Voices']]
        except Exception as e:
            print(f"Error getting voices: {str(e)}")
            return ['Joanna', 'Matthew', 'Ivy', 'Justin']  # Fallback voices
    
    def create_ssml_text(self, text: str, speed: str = "medium") -> str:
        """
        Create SSML markup for enhanced speech synthesis.
        
        Args:
            text: The text to speak
            speed: Speaking speed (x-slow, slow, medium, fast, x-fast)
            
        Returns:
            SSML-formatted string
        """
        return f"""
        <speak>
            <prosody rate="{speed}">
                {text}
            </prosody>
        </speak>
        """


# Create singleton instance
polly_service = PollyService()


def get_polly_service() -> PollyService:
    """Get the singleton Polly service instance."""
    return polly_service

