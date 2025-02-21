package NBodyProblem;

import processing.core.PApplet;
import processing.core.PVector;

import java.util.ArrayList;
import java.util.List;

import static NBodyProblem.Constants.*;

public class NBodySimulation extends PApplet {
    List<Body> nbodies;
    List<Star> stars = new ArrayList<>();

    @Override
    public void settings() {
        size(WIDTH, HEIGHT);
    }

    @Override
    public void setup() {
        noStroke();
        frameRate(FRAME_RATE);
        generateStars();

        // Initial Configuration - Equilateral triangle
        float radius = 150; // Distance from the center
        PVector center = new PVector((float) width / 2, (float) height / 2);

        // Position bodies in an equilateral triangle
        PVector p1 = new PVector(center.x + radius * cos(PI / 6), center.y - radius * sin(PI / 6));
        PVector p2 = new PVector(center.x - radius * cos(PI / 6), center.y - radius * sin(PI / 6));
        PVector p3 = new PVector(center.x, center.y + radius);

        // Assign initial velocities
        float speed = 1.2f;
        PVector v1 = new PVector(-speed * cos(PI / 3), speed * sin(PI / 3));
        PVector v2 = new PVector(speed * cos(PI / 3), speed * sin(PI / 3));
        PVector v3 = new PVector(0, -speed * 2);

        Body body1 = new Body(p1.x, p1.y, 15, v1, color(255, 123, 0));
        Body body2 = new Body(p2.x, p2.y, 14, v2, color(255, 221, 0));
        Body body3 = new Body(p3.x, p3.y, 13, v3, color(14, 107, 168));

        nbodies = List.of(body1, body2, body3);
    }

    // Generate stars once and store positions + twinkle properties
    void generateStars() {
        for (int i = 0; i < BACKGROUND_STAR_COUNT; i++) {
            float x = random(width);
            float y = random(height);
            float brightness = random(150, 255);
            float speedOffset = random(0, QUARTER_PI); // Different phase for each star
            stars.add(new Star(x, y, brightness, speedOffset));
        }
    }

    @Override
    public void draw() {
        drawSpaceBackground();

        // Compute bounding box
        float minX = Float.MAX_VALUE, maxX = Float.MIN_VALUE;
        float minY = Float.MAX_VALUE, maxY = Float.MIN_VALUE;

        for (Body body : nbodies) {
            if (body.position.x < minX) minX = body.position.x;
            if (body.position.x > maxX) maxX = body.position.x;
            if (body.position.y < minY) minY = body.position.y;
            if (body.position.y > maxY) maxY = body.position.y;
        }

        // Compute center and span
        float centerX = (minX + maxX) / 2;
        float centerY = (minY + maxY) / 2;
        float spanX = maxX - minX;
        float spanY = maxY - minY;

        // Determine scaling factor based on the largest span
        float scaleFactor = 1.0f;
        float padding = 50;
        float targetWidth = width - padding;
        float targetHeight = height - padding;

        if (spanX > targetWidth || spanY > targetHeight) {
            scaleFactor = min(targetWidth / spanX, targetHeight / spanY);
        }

        // Apply transformation
        pushMatrix();
        translate((float) width / 2, (float) height / 2);
        scale(scaleFactor);
        translate(-centerX, -centerY);

        for (int i = 0; i < nbodies.size(); i++) {
            for (int j = i + 1; j < nbodies.size(); j++) {
                Body body1 = nbodies.get(i);
                Body body2 = nbodies.get(j);

                PVector force = body1.attract(body2);
                body2.applyForce(force);
                body1.applyForce(force.mult(-1));
            }
        }

        // Update and display all bodies
        for (Body body : nbodies) {
            body.update();
            body.display(this);
        }

        if (SAVE_VIDEO) {
            if (frameCount <= TOTAL_FRAMES) {
                saveFrame("output/frame_###.png");
            } else {
                exit();
            }
        }

        popMatrix();
    }

    // Draw stars with smooth brightness transitions
    void drawSpaceBackground() {
        background(0);

        for (int i = 0; i < height; i++) {
            float inter = map(i, 0, height, 0, 1);
            int c = lerpColor(color(10, 10, 30), color(20, 0, 50), inter);
            stroke(c);
            line(0, i, width, i);
        }

        fill(255);
        noStroke();
        for (Star star : stars) {
            float twinkle = sin(frameCount * 2.02f + star.speedOffset) * 50; // Smooth transition
            float brightness = constrain(star.baseBrightness + twinkle, 150, 255);
            fill(brightness);
            ellipse(star.position.x, star.position.y, random(1, 3), random(1, 3));
        }
    }

    public static void main(String[] args) {
        PApplet.main("NBodyProblem.NBodySimulation");
    }
}
