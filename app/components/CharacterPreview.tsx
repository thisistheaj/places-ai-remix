import { useEffect, useRef } from 'react';

interface CharacterPreviewProps {
  skinNumber: string;
  size?: number;
}

export function CharacterPreview({ skinNumber, size = 32 }: CharacterPreviewProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear the canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Load the spritesheet
    const img = new Image();
    img.src = `/assets/characters/Premade_Character_32x32_${skinNumber}.png`;
    img.onload = () => {
      // Draw the specific frame (4th frame, front-facing idle)
      ctx.imageSmoothingEnabled = false; // Keep pixel art sharp
      ctx.drawImage(
        img,
        96, // Source X (3rd frame * 32)
        0,  // Source Y
        32, // Source width
        64, // Source height
        0,  // Destination X
        0,  // Destination Y
        size, // Destination width
        size * 2 // Destination height (maintain aspect ratio)
      );
    };
  }, [skinNumber, size]);

  return (
    <canvas
      ref={canvasRef}
      width={size}
      height={size * 2}
      className="pixelated" // Ensure pixel art stays sharp
    />
  );
} 