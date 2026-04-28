import pytest
import os
import sys

# Add the parent directory to sys.path to import worker.py
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

@pytest.mark.integration
def test_artist_integration_pollinations_ai():
    try:
        from image_engine import generate_cover_image
    except ImportError:
        pytest.skip("Skipping artist integration test because PIL or other dependency is missing.")
    """Integration test to verify Pollinations.ai image generation is working."""
    test_title = "A Test Tale"
    test_context = "A simple, flat 2D illustration of an apple, minimalistic."
    
    try:
        image_path = generate_cover_image(test_title, test_context)
        assert image_path is not None
        assert os.path.exists(image_path)
        
        # Cleanup
        os.remove(image_path)
    except Exception as e:
        pytest.fail(f"Integration test failed: {e}")
