import edge_tts
import uuid
import os

async def generate_audio(text: str, language: str = "English") -> str:
    """
    Generates spoken audio from text using edge-tts and returns the path to the temporary mp3 file.
    """
    # Map high level languages to edge-tts voices (these are solid reliable defaults for Edge TTS)
    voice_map = {
        "English": "en-US-ChristopherNeural", 
        "French": "fr-FR-HenriNeural",
        "Hebrew": "he-IL-AvriNeural" # Only free Hebrew voice on EdgeTTS male
    }
    
    voice = voice_map.get(language, "en-US-ChristopherNeural")
    
    # Generate unique filename
    output_filename = f"temp_tts_{uuid.uuid4().hex}.mp3"
    
    try:
        communicate = edge_tts.Communicate(text, voice)
        await communicate.save(output_filename)
        print(f"DEBUG: Audio saved locally to {output_filename}", flush=True)
        return output_filename
    except Exception as e:
        print(f"Error generating audio: {str(e)}", flush=True)
        if os.path.exists(output_filename):
            os.remove(output_filename)
        raise e
