import requests
import urllib.parse
import uuid
import os

def generate_cover_image(title: str, text_snippet: str = "") -> str:
    """
    Calls the free pollinations.ai image API to generate a vintage book cover.
    Returns the path to the downloaded local temporary JPG file.
    """
    # Create an artistic prompt ensuring it looks like a vintage storybook
    contextual_hint = f" about {text_snippet}" if text_snippet else ""
    base_prompt = (
        f"A beautiful vintage storybook cover illustration{contextual_hint}. "
        f"The title text '{title}' is written prominently and legibly in large elegant classic typography in the center. "
        "Highly detailed, magical realism, warm library aesthetic, award-winning book cover art."
    )
    
    # URL encode the prompt
    safe_prompt = urllib.parse.quote(base_prompt)
    
    # We use a random seed so duplicate titles don't get the exact same image cached
    seed = uuid.uuid4().int % 100000 
    
    # pollinations url template
    image_url = f"https://image.pollinations.ai/prompt/{safe_prompt}?width=1024&height=1024&nologo=true&seed={seed}"
    
    output_filename = f"temp_cover_{uuid.uuid4().hex}.jpg"
    
    print(f"Generating image via Pollinations -> {image_url}")
    
    response = requests.get(image_url, timeout=45)
    
    if response.status_code == 200:
        with open(output_filename, 'wb') as f:
            f.write(response.content)
        print(f"DEBUG: Saved image chunk to {output_filename}")
        return output_filename
    else:
        raise Exception(f"Failed to generate image: Status {response.status_code}")
