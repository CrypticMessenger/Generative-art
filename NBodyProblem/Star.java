package NBodyProblem;

import processing.core.PVector;

class Star {
    PVector position;
    float baseBrightness;
    float speedOffset;

    Star(float x, float y, float brightness, float offset) {
        this.position = new PVector(x, y);
        this.baseBrightness = brightness;
        this.speedOffset = offset;
    }
}