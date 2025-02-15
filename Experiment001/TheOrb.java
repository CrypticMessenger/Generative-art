import processing.core.PApplet;
import processing.core.PVector;

public class TheOrb extends PApplet {
    int numIterations = 25;  // Adjusted for better spiral formation
    float scaleFactor = 1.2F; // Tweaked for smoother scaling
    float time = 0;  // Animation variable
    int totalFrames = 15*15;
    boolean saveVideo = true;

    @Override
    public void settings() {
        size(600, 600);
    }

    @Override
    public void setup() {
        noStroke();
        frameRate(30);
    }

    @Override
    public void draw() {
        loadPixels();

        for (int y = 0; y < height; y++) {
            for (int x = 0; x < width; x++) {
                float fx = (x - width / 2.0F) / width * 2.5F;
                float fy = (y - height / 2.0F) / height * 2.5F;

                PVector pos = new PVector(fx, fy);
                PVector offset = new PVector(sin(time * 0.5F), cos(time * 0.5F));
                float intensity = 0;
                float scale = 4.0F;
                float distance = pos.magSq();
                pos.div(0.7F - distance);

                for (int i = 0; i < numIterations; i++) {
                    pos = rotateVector(pos, radians(8.0F));
                    offset = rotateVector(offset, radians(5.0F));

                    PVector q = PVector.sub(PVector.mult(pos, numIterations), offset);
                    PVector sinEffect = new PVector(sin(q.x * 1.2F), cos(q.y * 1.2F)).div(scale);
                    intensity += PVector.dot(rotateVector(sinEffect, time * 2.0F), new PVector(1, -1));

                    offset.add(new PVector(cos(q.x), sin(q.y)));
                    scale *= scaleFactor;
                }

                intensity = max(1.0F - intensity * 0.5F - distance, 0F);
                float brightness = pow(intensity, 2.5F) * 255;

                int r = constrain((int) (brightness * 1.2), 0, 255);
                int g = constrain((int) (brightness * 0.6), 0, 255);
                int b = constrain((int) (brightness * 1.8), 0, 255);
                int col = color(r, g, b);

                pixels[x + y * width] = col;
            }
        }

        updatePixels();
        time += 0.05F;

        if (saveVideo) {
            if (frameCount <= totalFrames) {
                saveFrame("output/frame_###.png");
            } else {
                exit();
            }
        }
      // then run : ffmpeg -framerate 15 -i output/frame_%03d.png -c:v libx264 -pix_fmt yuv420p output_15_scifi.mp4 to get video out of frames.
    }

    PVector rotateVector(PVector v, float angle) {
        float x = v.x * cos(angle) - v.y * sin(angle);
        float y = v.x * sin(angle) + v.y * cos(angle);
        return new PVector(x, y);
    }

    public static void main(String[] args) {
        PApplet.main("TheOrb");
    }
}
