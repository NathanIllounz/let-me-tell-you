import pytest
import os
import sys

# Add the parent directory to sys.path to import worker.py
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

@pytest.mark.asyncio
@pytest.mark.integration
async def test_narrator_integration_elevenlabs():
    try:
        from tts_engine import generate_audio
    except ImportError:
        pytest.skip("Skipping ElevenLabs integration test because edge_tts is not installed.")
    """Integration test to verify TTS is working."""
    test_text = "This is a short test."
    
    try:
        mp3_path = await generate_audio(test_text)
        assert mp3_path is not None
        assert os.path.exists(mp3_path)
        assert os.path.getsize(mp3_path) > 0
        
        # Cleanup
        os.remove(mp3_path)
    except Exception as e:
        if "API_KEY" in str(e) or "ELEVENLABS" in str(e):
            pytest.skip("Skipping ElevenLabs integration test because ELEVENLABS_API_KEY is missing.")
        raise e
