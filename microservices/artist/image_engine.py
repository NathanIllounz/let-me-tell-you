import requests
import urllib.parse
import urllib.request
import uuid
import os
from PIL import Image, ImageDraw, ImageFont
import textwrap
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
            
        print(f"DEBUG: Saved raw image to {output_filename}")
        
        try:
            # Post-Process with Pillow to guarantee perfect typography
            img = Image.open(output_filename)
            draw = ImageDraw.Draw(img)
            width, height = img.size
            
            # Download a premium Serif font if not cached locally
            font_path = "PlayfairDisplay-Bold.ttf"
            if not os.path.exists(font_path):
                urllib.request.urlretrieve("https://github.com/google/fonts/raw/main/ofl/playfairdisplay/PlayfairDisplay-Bold.ttf", font_path)
                
            try:
                font = ImageFont.truetype(font_path, size=75)
            except IOError:
                font = ImageFont.load_default()
            
            # Wrap text to fit beautifully
            lines = textwrap.wrap(title.upper(), width=20)
            
            # Start rendering from upper-middle
            y_text = height * 0.15 
            
            # Draw semi-transparent dark banner behind text to ensure readability anywhere
            banner_height = (len(lines) * 90) + 40
            draw.rectangle([(0, y_text - 20), (width, y_text + banner_height - 20)], fill=(20, 20, 20, 180))
            
            for line in lines:
                # get bounding box of line
                bbox = draw.textbbox((0, 0), line, font=font)
                line_width = bbox[2] - bbox[0]
                
                # Center text
                x_text = (width - line_width) / 2
                
                # Draw subtle drop shadow for elegance
                draw.text((x_text + 4, y_text + 4), line, font=font, fill=(0, 0, 0))
                # Draw main gold/cream text
                draw.text((x_text, y_text), line, font=font, fill=(245, 235, 215))
                
                y_text += 90
                
            img.save(output_filename)
            print(f"DEBUG: Burnt typography perfectly onto image!")
            
        except Exception as burn_err:
            print(f"Warning: Failed to burn typography onto image: {burn_err}")
            
        return output_filename
    else:
        raise Exception(f"Failed to generate image: Status {response.status_code}")
