# N-Body Simulation

simulation: https://youtube.com/shorts/_BgjO7Pkvp8?si=gTZ-RoutZyyKxVQi

## Overview
This project is an N-Body simulation using the Processing framework in Java. It simulates the gravitational interactions of celestial bodies while rendering a visually appealing space background with stars and glowing trails.

## Features
- **Gravity Simulation**: Implements Newtonian gravity to simulate interactions between multiple bodies.
- **Equilateral Triangle Initial Setup**: The simulation starts with three bodies positioned in an equilateral triangle formation.
- **Scaling and Centering**: The simulation dynamically adjusts the viewport to keep all bodies within view.
- **Background Stars**: A field of twinkling stars adds realism to the simulation.
- **Glowing Trails**: Each body leaves behind a glowing trail to visualize its movement.
- **Video Export**: Frames can be saved to create a video of the simulation.

## Installation
### Prerequisites
- Java (JDK 8 or later)
- Processing Core Library

### Steps
1. Clone the repository:
   ```sh
   git clone <repository-url>
   cd NBodyProblem
   ```
2. Import the project into an IDE like IntelliJ IDEA or Eclipse.
3. Ensure that the Processing core library is included in the project.
4. Run `NBodySimulation.java` as a Java application.

## Usage
- Run the simulation to see the celestial bodies interact under gravitational forces.
- Modify `Constants.java` to adjust:
    - Simulation window size (`WIDTH`, `HEIGHT`)
    - Gravity strength (`G`)
    - Frame rate (`FRAME_RATE`)
    - Number of background stars (`BACKGROUND_STAR_COUNT`)
    - Video capture settings (`SAVE_VIDEO`, `TOTAL_FRAMES`)

## Code Structure
- `NBodySimulation.java` - Main simulation loop and rendering logic.
- `Body.java` - Defines the properties and behaviors of celestial bodies.
- `Constants.java` - Contains global simulation parameters.
- `Star.java` - Handles the background starfield.

## Future Enhancements
- Add more bodies dynamically.
- Implement a GUI for real-time parameter adjustments.
- Introduce different gravitational laws (e.g., relativistic effects).
- Optimize performance for larger simulations.

## License
This project is open-source and licensed under the MIT License.

## Acknowledgments
- Inspired by astrophysical simulations of planetary motion.
- Built using [Processing](https://processing.org/) for graphics rendering.

