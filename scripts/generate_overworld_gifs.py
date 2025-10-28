#!/usr/bin/env python3
import os
from PIL import Image

# Configuration
FRAME_DURATION_MS = 500  # 0.5 seconds
DIRECTIONS = ["down", "up", "left"]

TRANSPARENCY_TOLERANCE = 0  # tolerance for color distance
def remove_background(img, tolerance=TRANSPARENCY_TOLERANCE):
    """Remove background using the top-left pixel color as key."""
    img = img.convert("RGBA")
    datas = img.getdata()
    bg_color = datas[0]  # top-left pixel
    new_data = []

    for item in datas:
        # Compare RGBA distance
        if all(abs(item[i] - bg_color[i]) <= tolerance for i in range(3)):
            new_data.append((0, 0, 0, 0))  # transparent
        else:
            new_data.append(item)

    img.putdata(new_data)
    return img

def make_gif(frames, save_path):
    """Create a looping GIF from a list of frames."""
    frames[0].save(
        save_path,
        save_all=True,
        append_images=frames[1:],
        duration=FRAME_DURATION_MS,
        loop=0,
        optimize=True,
        disposal=2
    )

def process_spritesheet(path, output_dir):
    """Split one spritesheet into directional GIFs with background removed."""
    img = Image.open(path).convert("RGBA")
    w, h = img.size
    frame_w = w // 6

    # Extract and clean each frame
    frames = [
        remove_background(img.crop((i * frame_w, 0, (i + 1) * frame_w, h)))
        for i in range(6)
    ]

    mapping = {
        "down": (frames[0], frames[1]),
        "up":   (frames[2], frames[3]),
        "left": (frames[4], frames[5]),
    }

    base_name = os.path.splitext(os.path.basename(path))[0]
    for direction, (f1, f2) in mapping.items():
        save_path = os.path.join(output_dir, f"{base_name}_{direction}.gif")
        make_gif([f1, f2], save_path)
        # print(f"Generated {save_path}")

from tqdm import tqdm 
if __name__ == "__main__":
    output_dir = os.getenv("OSPRITES")
    if not output_dir:
        raise EnvironmentError("Environment variable $OSPRITES is not set.")
    os.makedirs(output_dir, exist_ok=True)

    all_pngs = []
    for root, _, files in os.walk(os.getenv("ORSPRITES")):
        for file in files:
            if file.lower().endswith(".png"):
                all_pngs.append(os.path.join(root, file))

    for path in tqdm(all_pngs, desc="Overworld sprites", unit="sheet"):
        try:
            process_spritesheet(path, output_dir)
        except Exception as e:
            tqdm.write(f"Error processing {path}: {e}")
    print("Finished generating overworld gifs")
