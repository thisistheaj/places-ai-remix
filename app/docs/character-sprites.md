# Character Sprite Documentation

## Sprite Sheet Layout

Each character sprite sheet is organized in a 32x64 pixel grid per frame. The sprites are designed for top-down RPG-style movement and interactions.

### Technical Details
- Frame Width: 32 pixels
- Frame Height: 64 pixels
- Spritesheet Width: 1792 pixels (56 frames per row)
- Spritesheet Height: 1312 pixels (20 rows)
- Animation Sequences: Generally 6 frames each
- File Format: PNG
- Default Character: `Premade_Character_32x32_01.png`

### Frame Organization

#### Row 1: Basic Directional Poses (frames 0-3)
- Frame 0: Face Right
- Frame 1: Face Up
- Frame 2: Face Left
- Frame 3: Face Down

#### Row 2: Idle Animations (frames 56-79)
Each direction has 6 frames of idle animation
- Frames 56-61: Idle Right
- Frames 62-67: Idle Up
- Frames 68-73: Idle Left
- Frames 74-79: Idle Down

#### Row 3: Walk Animations (frames 112-135)
Each direction has 6 frames of walking animation
- Frames 112-117: Walk Right
- Frames 118-123: Walk Up
- Frames 124-129: Walk Left
- Frames 130-135: Walk Down

#### Row 4: Sleep Animation (frames 168-173)
- Frames 168-173: Sleep sequence

#### Row 5: Sitting Poses (frames 224-235)
- Frames 224-229: Sit Right
- Frames 230-235: Sit Left

#### Row 6: Alternative Sitting Poses (frames 280-291)
- Frames 280-285: Sit Alt Right
- Frames 286-291: Sit Alt Left

#### Rows 7-20
Currently unused frames reserved for future animations

## Frame Calculation
To calculate frame numbers:
- Each row starts at: row_number * 56
- Each frame in a row adds: column_number
- Example: First frame of second row = 1 * 56 + 0 = 56 