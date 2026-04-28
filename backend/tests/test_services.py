import pytest
import json
from unittest.mock import patch, MagicMock

from app.services.ai_service import AIService

def test_ai_service_refine_text_mocked():
    """Unit test for refine_text_story using a mock, so no API calls are made."""
    ai_service = AIService()
    
    # Create a mock response
    mock_response = MagicMock()
    mock_response.text = json.dumps({
        "suggested_title": "A Walk in the Park",
        "cleaned_text": "I went for a walk in the park. It was a beautiful day."
    })
    
    # Patch the gemini client generate_content method
    with patch.object(ai_service.client.models, 'generate_content', return_value=mock_response):
        result = ai_service.refine_text_story("i went to the park today it was nice")
        
        assert result["suggested_title"] == "A Walk in the Park"
        assert result["cleaned_text"] == "I went for a walk in the park. It was a beautiful day."


@pytest.mark.integration
def test_ai_service_refine_text_live():
    """Integration test that actually calls the Gemini API to verify the response format."""
    ai_service = AIService()
    
    # We send a small, predefined prompt to Gemini to save tokens but verify functionality
    test_input = "um yeah i think i went to the store to buy some apples but they were out of stock"
    
    try:
        result = ai_service.refine_text_story(test_input, language="English")
        
        assert "suggested_title" in result
        assert "cleaned_text" in result
        assert len(result["cleaned_text"]) > 10
    except ValueError as e:
        if "API_KEY" in str(e):
            pytest.skip("Skipping live integration test because GEMINI_API_KEY is missing.")
        raise e
