package NBodyProblem;

import processing.core.PApplet;
import processing.core.PVector;

import java.util.List;

import static NBodyProblem.Constants.*;
import static processing.core.PApplet.constrain;

public class Body {
    List<PVector> trail = new java.util.ArrayList<>();
    PVector position, velocity, acceleration;
    float mass;
    int col;

    Body(float x, float y, float m, PVector initialVelocity, int col) {
        this.position = new PVector(x, y);
        this.velocity = initialVelocity;
        this.acceleration = new PVector(0, 0);
        this.mass = m;
        this.col = col;
    }

    void applyForce(PVector force) {
        PVector f = PVector.div(force, mass);
        acceleration.add(f);
    }

    PVector attract(Body other) {
        PVector force = PVector.sub(this.position, other.position);
        float distance = constrain(force.mag(), 5, 50);
        float strength = (G * this.mass * other.mass) / (distance * distance);
        force.setMag(strength);
        return force;
    }

    void update() {
        // Add current position to trail before updating
        trail.add(new PVector(position.x, position.y));

        // Remove oldest point if trail is too long
        if (trail.size() > MAX_TRAIL_LENGTH) {
            trail.removeFirst();
        }

        // Existing update code
        velocity.add(PVector.mult(acceleration, DT));
        position.add(PVector.mult(velocity, DT));
        acceleration.mult(0);
    }

    void display(PApplet p) {
        // Enable glow effect
        p.blendMode(PApplet.ADD);

        // Draw trail with glow effect
        p.noFill();
        p.strokeWeight(2);
        for (int layer = 3; layer >= 0; layer--) {
            float alpha = 50 - (layer * 10);  // Adjust opacity for depth
            float strokeW = (layer + 1) * 2;  // Vary stroke width

            p.beginShape();
            for (int i = 0; i < trail.size(); i++) {
                PVector v = trail.get(i);
                float brightness = p.map(i, 0, trail.size(), 0.2f, 1.0f);
                int glowColor = p.lerpColor(p.color(0), col, brightness);
                glowColor = p.color(
                        p.red(glowColor) * 1.5f,
                        p.green(glowColor) * 1.5f,
                        p.blue(glowColor) * 1.5f,
                        alpha
                );

                p.stroke(glowColor);
                p.strokeWeight(strokeW * ((float) i / trail.size()));
                p.point(v.x, v.y);
            }
            p.endShape();
        }

        // Reset blend mode for main body
        p.blendMode(PApplet.BLEND);

        // Inner bright core
        p.noStroke();
        p.fill(p.lerpColor(col, p.color(255), 0.6f));
        p.circle(position.x, position.y, mass * 1.8f);

        // Outer glow with multiple layers
        for (int i = 1; i <= 3; i++) {
            p.fill(col, 80 - i * 20);  // Reduce opacity for outer layers
            p.circle(position.x, position.y, mass * (2 + i * 0.8f));
        }

        // Brightest center
        p.fill(255);
        p.circle(position.x, position.y, mass * 0.6f);
    }
}
