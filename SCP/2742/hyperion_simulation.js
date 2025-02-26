
let nodes = [];
let hyperedges = [];
let dataPackets = [];
let systemActive = true;
let particleEffects = [];
let lastFrameTime = 0;
let frameRateAdjuster = 1.0;
let creatureTarget = null;
let creatureVelocity = null;
let creatureCore = null;
let huntingNodes = [];
let creatureEnergy = 100; // Energy level - starts at maximum
let lastFeedingTime = 0; // Tracks when the creature last consumed food

function setup() {
  createCanvas(windowWidth, windowHeight);
  colorMode(HSB, 360, 100, 100, 1);
  
  initializeSystem(14);
  background(220, 70, 5);
  lastFeedingTime = frameCount;
}

function draw() {
  // Performance monitoring
  let currentTime = millis();
  let elapsed = currentTime - lastFrameTime || 0;
  lastFrameTime = currentTime;
  
  if (elapsed > 30) {
    frameRateAdjuster = max(0.5, frameRateAdjuster * 0.95);
  } else if (elapsed < 16) {
    frameRateAdjuster = min(1.0, frameRateAdjuster * 1.05);
  }
  
  // Background with fade effect
  background(220, 70, 5, 0.2);
  
  // Draw energy indicator
  drawEnergyIndicator();
  
  // Draw grid, data packets, hyperedges, nodes, particles
  drawGrid();
  drawDataPackets();
  drawHyperedges();
  drawNodes();
  updateParticleEffects();
  
  // Process system evolution if active
  if (systemActive) {
    updateCreatureTarget();
    moveCreatureTowardTarget();
    processSystem();
    updateCreatureEnergy(); // Update energy levels and handle decay
  }
  
  // Display UI
  fill(200, 80, 100);
  noStroke();
  textFont('Courier New');
  textSize(14);
  text("CLICK: ADD FOOD PACKET | SPACE: TOGGLE SYSTEM | R: RESET", 20, 30);
}

function drawEnergyIndicator() {
  // Display energy bar
  noStroke();
  fill(0, 0, 20, 0.5);
  rect(20, 60, 104, 14);
  
  // Map color from red (low) to green (high)
  let energyHue = map(creatureEnergy, 0, 100, 0, 120);
  fill(energyHue, 90, 90);
  rect(22, 62, map(creatureEnergy, 0, 100, 0, 100), 10);
  
  // Label
  fill(0, 0, 100);
  textSize(10);
  text("ENERGY", 45, 70);
}

function updateCreatureEnergy() {
  // Energy continuously decays over time
  let timeSinceFeeding = frameCount - lastFeedingTime;
  
  // Decay rate increases the longer the creature goes without food
  let baseDecayRate = 0.05;
  let starvationFactor = constrain(map(timeSinceFeeding, 0, 1000, 1, 3), 1, 3);
  
  creatureEnergy -= baseDecayRate * starvationFactor;
  creatureEnergy = constrain(creatureEnergy, 0, 100);
  
  // Handle decay based on energy levels
  if (creatureEnergy < 60) {
    // Stage 1: Decay peripheral structures
    if (frameCount % 60 === 0 && random() < map(creatureEnergy, 60, 30, 0.1, 0.5)) {
      decayPeripheralStructures();
    }
  }
  
  if (creatureEnergy < 30) {
    // Stage 2: Break connections more aggressively
    if (frameCount % 30 === 0 && random() < map(creatureEnergy, 30, 10, 0.2, 0.7)) {
      decayRandomConnections();
    }
  }
  
  if (creatureEnergy < 10) {
    // Stage 3: Critical failure - break down to individual particles
    if (frameCount % 15 === 0 && random() < map(creatureEnergy, 10, 0, 0.3, 0.9)) {
      if (hyperedges.length > 0) {
        // Remove a hyperedge
        let edgeToRemove = floor(random(hyperedges.length));
        
        // Create visual effect
        let edgeCenter = calculateEdgeCenter(hyperedges[edgeToRemove]);
        createDecayEffect(edgeCenter.x, edgeCenter.y);
        
        // Remove the hyperedge
        hyperedges.splice(edgeToRemove, 1);
      }
    }
  }
}

function calculateEdgeCenter(edge) {
  // Calculate the center of a hyperedge
  let centerX = 0, centerY = 0, count = 0;
  for (let nodeIdx of edge.nodeIndices) {
    if (nodeIdx < nodes.length) {
      centerX += nodes[nodeIdx].position.x;
      centerY += nodes[nodeIdx].position.y;
      count++;
    }
  }
  
  if (count === 0) return {x: width/2, y: height/2};
  return {x: centerX / count, y: centerY / count};
}

function createDecayEffect(x, y) {
  // Create visual effect for decay
  for (let i = 0; i < 10; i++) {
    let angle = random(TWO_PI);
    let speed = random(0.5, 2);
    let velocity = p5.Vector.fromAngle(angle).mult(speed);
    
    particleEffects.push({
      position: createVector(x, y),
      velocity: velocity,
      life: 1.0,
      decay: random(0.03, 0.06),
      size: random(2, 5),
      hue: 0, // Red for decay
      saturation: 100,
      brightness: 90,
      type: 'circle'
    });
  }
}

function decayPeripheralStructures() {
  // Find peripheral structures - edges with fewer connections
  
  // Calculate how many times each node appears in hyperedges
  let nodeConnectionCounts = new Array(nodes.length).fill(0);
  for (let edge of hyperedges) {
    for (let nodeIdx of edge.nodeIndices) {
      if (nodeIdx < nodes.length) {
        nodeConnectionCounts[nodeIdx]++;
      }
    }
  }
  
  // Find edges with mostly peripheral nodes
  for (let e = hyperedges.length - 1; e >= 0; e--) {
    let edge = hyperedges[e];
    let peripheralNodeCount = 0;
    
    for (let nodeIdx of edge.nodeIndices) {
      if (nodeIdx < nodes.length && nodeConnectionCounts[nodeIdx] === 1) {
        peripheralNodeCount++;
      }
    }
    
    // If this edge is mostly peripheral nodes, it's a candidate for removal
    if (peripheralNodeCount > edge.nodeIndices.length * 0.5) {
      // Create visual effect
      let center = calculateEdgeCenter(edge);
      createDecayEffect(center.x, center.y);
      
      // Remove the edge
      hyperedges.splice(e, 1);
      return; // Only remove one per call
    }
  }
}

function decayRandomConnections() {
  // Remove random connections/hyperedges during starvation
  if (hyperedges.length > 0) {
    let edgeIndex = floor(random(hyperedges.length));
    
    // Create visual effect
    let center = calculateEdgeCenter(hyperedges[edgeIndex]);
    createDecayEffect(center.x, center.y);
    
    // Remove the edge
    hyperedges.splice(edgeIndex, 1);
  }
}

function initializeSystem(numNodes) {
  nodes = [];
  hyperedges = [];
  particleEffects = [];
  huntingNodes = [];
  creatureEnergy = 100; // Reset energy
  
  // Create initial nodes in a tighter cluster
  for (let i = 0; i < numNodes; i++) {
    let angle = map(i, 0, numNodes, 0, TWO_PI);
    let radius = min(width, height) * 0.15;
    radius += random(-radius*0.2, radius*0.2);
    
    let x = width/2 + cos(angle) * radius;
    let y = height/2 + sin(angle) * radius;
    
    nodes.push({
      position: createVector(x, y),
      velocity: createVector(0, 0),
      target: null, // For individual node targeting
      power: 1,
      processingLoad: random(0.2, 0.8),
      pulsePhase: random(TWO_PI),
      isHunting: false // Whether this node is actively hunting food
    });
  }
  
  creatureVelocity = createVector(0, 0);
  creatureCore = createVector(width/2, height/2);
  creatureTarget = null;
  lastFeedingTime = frameCount;
  
  // Create initial network connections
  createInitialHyperedges();
}

function createInitialHyperedges() {
  // Create a core central network hub
  let coreNodes = [];
  for (let i = 0; i < min(6, nodes.length); i += 2) {
    coreNodes.push(i);
  }
  if (coreNodes.length >= 3) {
    createHyperedge(coreNodes, 180);  // Cyan central core
  }
  
  // Create network branches/limbs
  for (let i = 0; i < 3; i++) {
    let start = floor(random(nodes.length));
    let appendageNodes = [
      start, 
      (start + 2) % nodes.length, 
      (start + 4) % nodes.length
    ];
    createHyperedge(appendageNodes, 270 + i * 15);  // Purple-ish branches
  }
}

function drawGrid() {
  // Draw sparser grid lines
  stroke(210, 70, 30, 0.1);
  strokeWeight(1);
  
  let gridSize = 60;
  let centerX = width/2;
  let centerY = height/2;
  let visibleRadius = max(width, height) * 0.6;
  
  // Draw only grid lines within the visible radius
  for (let x = 0; x <= width; x += gridSize) {
    if (abs(x - centerX) < visibleRadius) {
      line(x, max(0, centerY - visibleRadius), x, min(height, centerY + visibleRadius));
    }
  }
  
  for (let y = 0; y <= height; y += gridSize) {
    if (abs(y - centerY) < visibleRadius) {
      line(max(0, centerX - visibleRadius), y, min(width, centerX + visibleRadius), y);
    }
  }
}

function updateCreatureTarget() {
  // Update creature's core position
  let centerPos = createVector(0, 0);
  for (let node of nodes) {
    centerPos.add(node.position);
  }
  centerPos.div(nodes.length);
  creatureCore = centerPos;
  
  // Find closest data packet to target
  let closestPacket = null;
  let closestDist = Infinity;
  
  for (let packet of dataPackets) {
    let d = p5.Vector.dist(creatureCore, packet.position);
    if (d < closestDist) {
      closestDist = d;
      closestPacket = packet;
    }
  }
  
  // Set target to closest food packet or random movement if none
  if (closestPacket) {
    creatureTarget = closestPacket.position.copy();
    
    // Check if we're close enough to the target to start engulfing
    if (closestDist < 120 && huntingNodes.length < 5) {
      // Send nodes to surround the food
      deployHuntingNodesAround(closestPacket);
    }
    
    // Visualize target seeking
    if (frameRateAdjuster > 0.7) {
      stroke(200, 80, 90, 0.2);
      strokeWeight(1);
      drawDashedLine(
        creatureCore.x, creatureCore.y, 
        closestPacket.position.x, closestPacket.position.y, 
        8
      );
    }
  } else {
    // If no food, maintain current target or create a new wandering target
    if (!creatureTarget || random() < 0.01) {
      creatureTarget = createVector(
        random(width * 0.2, width * 0.8),
        random(height * 0.2, height * 0.8)
      );
    }
  }
}

// Deploy nodes to engulf food
function deployHuntingNodesAround(packet) {
  // Only deploy if we're not already hunting with too many nodes
  let maxHuntingNodes = 5;
  
  // Clear old hunting nodes that are far away
  huntingNodes = huntingNodes.filter(id => {
    let node = nodes[id];
    if (!node) return false;
    
    let dist = p5.Vector.dist(node.position, packet.position);
    return dist < 150; // Keep only nodes that are still near the target
  });
  
  // Add new hunting nodes if needed
  if (huntingNodes.length < maxHuntingNodes) {
    // Find good candidate nodes - prefer nodes that:
    // 1. Are not already hunting
    // 2. Are relatively close to the target
    // 3. Are from different parts of the structure
    
    let candidates = [];
    for (let i = 0; i < nodes.length; i++) {
      if (huntingNodes.includes(i)) continue;
      
      let dist = p5.Vector.dist(nodes[i].position, packet.position);
      if (dist < 200) {
        candidates.push({
          id: i,
          distance: dist
        });
      }
    }
    
    // Sort by distance
    candidates.sort((a, b) => a.distance - b.distance);
    
    // Take some nodes from different distances to create a surrounding effect
    let numToAdd = min(maxHuntingNodes - huntingNodes.length, candidates.length);
    let step = max(1, floor(candidates.length / numToAdd));
    
    for (let i = 0; i < candidates.length && huntingNodes.length < maxHuntingNodes; i += step) {
      let id = candidates[i].id;
      huntingNodes.push(id);
      
      // Position nodes around the food in a circle
      let angle = TWO_PI * (huntingNodes.length / maxHuntingNodes);
      let radius = 30 + random(10);
      
      nodes[id].target = createVector(
        packet.position.x + cos(angle) * radius,
        packet.position.y + sin(angle) * radius
      );
      
      nodes[id].isHunting = true;
    }
    
    // If we've deployed enough nodes around food, create a hyperedge to "engulf" it
    if (huntingNodes.length >= 3) {
      createHyperedge(huntingNodes, packet.hue);
    }
  }
}

function moveCreatureTowardTarget() {
  // Only move if we have a target
  if (!creatureTarget) return;
  
  // Calculate direction toward target
  let direction = p5.Vector.sub(creatureTarget, creatureCore);
  
  // Scale distance for smoother movement
  let distance = direction.mag();
  let scaledDistance = map(distance, 0, width/2, 0.01, 0.1);
  scaledDistance = constrain(scaledDistance, 0.01, 0.1);
  
  // Update creature velocity smoothly
  direction.normalize();
  direction.mult(scaledDistance);
  creatureVelocity.lerp(direction, 0.1);
  
  // Limit creature speed
  creatureVelocity.limit(0.8);
}

function drawDashedLine(x1, y1, x2, y2, dashLength) {
  // Draw a dashed line with sci-fi aesthetic
  let d = dist(x1, y1, x2, y2);
  let dashes = d / dashLength;
  
  for (let i = 0; i <= dashes; i += 2) {
    let t1 = i / dashes;
    let t2 = min(1, (i + 1) / dashes);
    
    line(
      lerp(x1, x2, t1),
      lerp(y1, y2, t1),
      lerp(x1, x2, t2),
      lerp(y1, y2, t2)
    );
  }
}

function drawNodes() {
  for (let i = 0; i < nodes.length; i++) {
    let node = nodes[i];
    
    // Calculate pulse effect
    let pulse = sin(frameCount * 0.03 + node.pulsePhase) * 0.3 + 0.7;
    
    // Hunting nodes look different - more energetic
    let isHunting = huntingNodes.includes(i);
    let hue = isHunting ? 40 : 200;
    
    // Nodes appear dimmer when energy is low
    let energyFactor = map(creatureEnergy, 0, 100, 0.5, 1);
    
    // Outer glow
    noStroke();
    fill(hue, 100, 90, 0.15 * node.power * energyFactor);
    circle(node.position.x, node.position.y, (isHunting ? 12 : 10) * pulse);
    
    // Core
    fill(hue, 50, 100, 0.9 * node.power * energyFactor);
    circle(node.position.x, node.position.y, isHunting ? 7 : 6);
    
    // Node ID
    if (node.position.x > 0 && node.position.x < width && 
        node.position.y > 0 && node.position.y < height) {
      textSize(8);
      fill(hue, 30, 100, 0.8 * energyFactor);
      text(i.toString(16).toUpperCase(), node.position.x + 8, node.position.y + 8);
    }
  }
}

function drawHyperedges() {
  for (let edge of hyperedges) {
    if (edge.nodeIndices.length < 3) continue;
    
    // Skip edges that are likely outside the view
    let inView = false;
    for (let idx of edge.nodeIndices) {
      if (idx < nodes.length) {
        let pos = nodes[idx].position;
        if (pos.x > -50 && pos.x < width + 50 && pos.y > -50 && pos.y < height + 50) {
          inView = true;
          break;
        }
      }
    }
    if (!inView) continue;
    
    // Calculate average power of this network segment
    let totalPower = 0;
    let validNodeIndices = [];
    
    for (let nodeIdx of edge.nodeIndices) {
      if (nodeIdx < nodes.length) {
        totalPower += nodes[nodeIdx].power;
        validNodeIndices.push(nodeIdx);
      }
    }
    
    if (validNodeIndices.length < 3) continue;
    
    let avgPower = totalPower / validNodeIndices.length;
    
    // Check if this is a "hunting" edge (contains hunting nodes)
    let isHuntingEdge = validNodeIndices.some(idx => huntingNodes.includes(idx));
    
    // Draw connection area - semi-transparent
    beginShape();
    noStroke();
    
    // Color based on edge type with power influence
    let hue = isHuntingEdge ? edge.baseHue : edge.baseHue;
    let brightness = map(avgPower, 0.5, 2, 60, 90);
    // Adjust transparency based on energy
    let energyFactor = map(creatureEnergy, 0, 100, 0.3, 1);
    let alpha = isHuntingEdge ? 0.25 * energyFactor : 0.15 * energyFactor; 
    
    fill(hue, 80, brightness, alpha);
    
    // Create shape from node positions
    for (let nodeIdx of validNodeIndices) {
      vertex(nodes[nodeIdx].position.x, nodes[nodeIdx].position.y);
    }
    endShape(CLOSE);
    
    // Draw connecting beams
    let beamCount = floor(validNodeIndices.length * frameRateAdjuster);
    beamCount = max(3, beamCount);
    
    for (let i = 0; i < beamCount; i++) {
      let n1 = validNodeIndices[i];
      let n2 = validNodeIndices[(i + 1) % validNodeIndices.length];
      
      // Beam effect
      drawNetworkBeam(
        nodes[n1].position.x, nodes[n1].position.y,
        nodes[n2].position.x, nodes[n2].position.y,
        hue, avgPower * energyFactor, isHuntingEdge
      );
    }
  }
}

function drawNetworkBeam(x1, y1, x2, y2, hue, power, isHunting) {
  // High-tech beam effect between nodes (optimized)
  
  // Base beam
  stroke(hue, 90, 95, 0.6 * power);
  strokeWeight(isHunting ? 2 : 1.5);
  line(x1, y1, x2, y2);
  
  // Brighter core
  stroke(hue, 50, 100, 0.8 * power);
  strokeWeight(isHunting ? 1 : 0.8);
  line(x1, y1, x2, y2);
  
  // Data flow animation along the beam
  let segments = floor(3 * frameRateAdjuster);
  let flowOffset = (frameCount * 0.05) % 1.0;
  
  for (let i = 0; i < segments; i++) {
    let t = ((i / segments) + flowOffset) % 1.0;
    let x = lerp(x1, x2, t);
    let y = lerp(y1, y2, t);
    
    noStroke();
    fill(hue, 40, 100, power * 0.8);
    circle(x, y, isHunting ? 4 : 3);
  }
}

function drawDataPackets() {
  for (let packet of dataPackets) {
    // Only render packets that are in view
    if (packet.position.x < -20 || packet.position.x > width + 20 || 
        packet.position.y < -20 || packet.position.y > height + 20) {
      continue;
    }
    
    // Outer glow
    noStroke();
    fill(packet.hue, 100, 100, 0.2);
    circle(packet.position.x, packet.position.y, 16);
    
    // Core
    fill(packet.hue, 90, 100, 0.9);
    circle(packet.position.x, packet.position.y, 8);
    
    // Highlight
    fill(packet.hue, 50, 100);
    circle(packet.position.x - 2, packet.position.y - 2, 3);
    
    // Only add detail effects if we have performance headroom
    if (frameRateAdjuster > 0.8) {
      // Data visualization
      stroke(packet.hue, 90, 100, 0.7);
      strokeWeight(1);
      let size = 12;
      for (let i = 0; i < 3; i++) {
        let angle = frameCount * 0.1 + (TWO_PI / 3) * i;
        let sx = packet.position.x + cos(angle) * size;
        let sy = packet.position.y + sin(angle) * size;
        line(packet.position.x, packet.position.y, sx, sy);
      }
    }
  }
}

function updateParticleEffects() {
  // Maximum particles based on performance
  let maxParticles = floor(100 * frameRateAdjuster);
  
  // Remove excess particles if needed
  if (particleEffects.length > maxParticles) {
    particleEffects.splice(maxParticles);
  }
  
  for (let i = particleEffects.length - 1; i >= 0; i--) {
    let p = particleEffects[i];
    
    // Skip particles that are offscreen
    if (p.position.x < -20 || p.position.x > width + 20 || 
        p.position.y < -20 || p.position.y > height + 20) {
      particleEffects.splice(i, 1);
      continue;
    }
    
    // Update position
    p.position.add(p.velocity);
    
    // Update life
    p.life -= p.decay;
    
    // Remove dead particles
    if (p.life <= 0) {
      particleEffects.splice(i, 1);
      continue;
    }
    
    // Draw particle
    noStroke();
    fill(p.hue, p.saturation, p.brightness, p.life);
    
    if (p.type === 'square') {
      rectMode(CENTER);
      let size = p.size * p.life;
      rect(p.position.x, p.position.y, size, size);
    } else {
      circle(p.position.x, p.position.y, p.size * p.life);
    }
  }
}

function processSystem() {
  // Update network dynamics
  updateNetwork();
  
  // Process data packet interactions
  processDataPackets();
  
  // Apply hypergraph rewriting rules less frequently based on performance
  if (frameCount % max(10, floor(20 / frameRateAdjuster)) === 0) {
    applyNetworkReconfiguration();
  }
}

function updateNetwork() {
  // Different movement for hunting vs. non-hunting nodes
  
  // Update hunting nodes first - they go to their targets
  for (let i = 0; i < nodes.length; i++) {
    let node = nodes[i];
    if (node.isHunting && node.target) {
      // Move toward specific target more aggressively
      let toTarget = p5.Vector.sub(node.target, node.position);
      let dist = toTarget.mag();
      
      if (dist > 5) {
        toTarget.normalize();
        toTarget.mult(0.2 + node.power * 0.1);
        node.velocity.add(toTarget);
      }
    } else {
      // Non-hunting nodes follow overall creature movement
      node.velocity.add(p5.Vector.mult(creatureVelocity, 2));
    }
  }
  
  // Apply cohesion forces to maintain structure
  for (let edge of hyperedges) {
    let connectedNodes = edge.nodeIndices.filter(i => i < nodes.length);
    
    if (connectedNodes.length < 3) continue;
    
    // Calculate centroid
    let centroid = createVector(0, 0);
    for (let nodeIdx of connectedNodes) {
      centroid.add(nodes[nodeIdx].position);
    }
    centroid.div(connectedNodes.length);
    
    // Apply forces - weaker for hunting nodes to allow them to stretch out
    for (let nodeIdx of connectedNodes) {
      let node = nodes[nodeIdx];
      let toCenter = p5.Vector.sub(centroid, node.position);
      let distance = toCenter.mag();
      
      toCenter.normalize();
      let strength = constrain(distance * 0.004, 0, 0.15);
      
      // Hunting nodes have weaker cohesion so they can stretch toward food
      if (node.isHunting) {
        strength *= 0.3;
      }
      
      // Low energy means weaker cohesion as structure breaks down
      let energyFactor = map(creatureEnergy, 0, 100, 0.3, 1);
      strength *= energyFactor;
      
      toCenter.mult(strength);
      node.velocity.add(toCenter);
    }
  }
  
  // Node repulsion with spatial partitioning
  let gridSize = 80;
  let grid = {};
  
  // Place nodes in grid cells
  for (let i = 0; i < nodes.length; i++) {
    let node = nodes[i];
    let cellX = floor(node.position.x / gridSize);
    let cellY = floor(node.position.y / gridSize);
    let cellKey = cellX + "," + cellY;
    
    if (!grid[cellKey]) grid[cellKey] = [];
    grid[cellKey].push(i);
  }
  
  // Check only nodes in nearby cells
  for (let i = 0; i < nodes.length; i++) {
    let node1 = nodes[i];
    let cellX = floor(node1.position.x / gridSize);
    let cellY = floor(node1.position.y / gridSize);
    
    // Check surrounding cells
    for (let dx = -1; dx <= 1; dx++) {
      for (let dy = -1; dy <= 1; dy++) {
        let neighborKey = (cellX + dx) + "," + (cellY + dy);
        let neighborNodes = grid[neighborKey];
        
        if (neighborNodes) {
          for (let j of neighborNodes) {
            if (i !== j) {
              let node2 = nodes[j];
              let between = p5.Vector.sub(node1.position, node2.position);
              let distance = between.mag();
              
              if (distance < 60) {
                between.normalize();
                let strength = map(distance, 0, 60, 0.08, 0);
                
                // Weaker repulsion between hunting nodes to allow clustering
                if (node1.isHunting && node2.isHunting) {
                  strength *= 0.5;
                }
                
                between.mult(strength);
                node1.velocity.add(between);
              }
            }
          }
        }
      }
    }
  }
  
  // Update node positions
  for (let node of nodes) {
    // Apply damping
    node.velocity.mult(0.94);
    
    // Boundary forces
    let buffer = 50;
    if (node.position.x < buffer) node.velocity.x += 0.05;
    if (node.position.x > width - buffer) node.velocity.x -= 0.05;
    if (node.position.y < buffer) node.velocity.y += 0.05;
    if (node.position.y > height - buffer) node.velocity.y -= 0.05;
    
    // Update position
    node.position.add(node.velocity);
    
    // Slowly decrease power over time
    node.power = max(0.5, node.power - 0.002);
  }
}

function processDataPackets() {
  for (let p = dataPackets.length - 1; p >= 0; p--) {
    let packet = dataPackets[p];
    
    // Check for packet consumption - two ways to consume:
    // 1. Inside a hyperedge
    // 2. Surrounded by enough hunting nodes
    
    let consumePacket = false;
    
    // Check if surrounded by hunting nodes
    let huntingNodesNear = 0;
    for (let id of huntingNodes) {
      if (id < nodes.length) {
        let d = p5.Vector.dist(packet.position, nodes[id].position);
        if (d < 40) {
          huntingNodesNear++;
        }
      }
    }
    
    if (huntingNodesNear >= 3) {
      consumePacket = true;
    }
    
    // Check if inside any hyperedge
    if (!consumePacket) {
      for (let edge of hyperedges) {
        if (isPointInPolygon(packet.position, edge.nodeIndices)) {
          consumePacket = true;
          break;
        }
      }
    }
    
    if (consumePacket) {
      // Create consumption effect
      createDataIntegrationEffect(packet.position.x, packet.position.y, packet.hue, frameRateAdjuster);
      
      // Boost energy when consuming food
      creatureEnergy += 20;
      creatureEnergy = min(creatureEnergy, 100);
      
      // Update last feeding time
      lastFeedingTime = frameCount;
      
      // Boost nearby nodes
      for (let i = 0; i < nodes.length; i++) {
        let node = nodes[i];
        let distance = p5.Vector.dist(packet.position, node.position);
        if (distance < 120) {
          let boost = map(distance, 0, 120, 0.5, 0);
          node.power += boost;
          node.power = constrain(node.power, 0.5, 2);
          
          node.pulsePhase = frameCount * 0.1;
        }
      }
      
      // Sometimes add a new node after consuming
      if (random() < 0.3 * frameRateAdjuster && nodes.length < 25) {
        addNetworkNode(packet.position.x, packet.position.y, 40, packet.hue);
      }
      
      // Reset hunting nodes that were targeting this packet
      for (let id of huntingNodes) {
        if (id < nodes.length) {
          nodes[id].isHunting = false;
          nodes[id].target = null;
        }
      }
      huntingNodes = [];
      
      // Remove the packet
      dataPackets.splice(p, 1);
      
      // Update target since this one is consumed
      creatureTarget = null;
    }
  }
}

// Check if a point is inside a polygon defined by node indices
function isPointInPolygon(point, nodeIndices) {
  let x = point.x;
  let y = point.y;
  let inside = false;
  
  // Need at least 3 points to form a polygon
  let validIndices = nodeIndices.filter(idx => idx < nodes.length);
  if (validIndices.length < 3) return false;
  
  for (let i = 0, j = validIndices.length - 1; i < validIndices.length; j = i++) {
    let xi = nodes[validIndices[i]].position.x;
    let yi = nodes[validIndices[i]].position.y;
    let xj = nodes[validIndices[j]].position.x;
    let yj = nodes[validIndices[j]].position.y;
    
    let intersect = ((yi > y) != (yj > y)) && (x < (xj - xi) * (y - yi) / (yj - yi) + xi);
    if (intersect) inside = !inside;
  }
  
  return inside;
}

function createDataIntegrationEffect(x, y, hue, scale) {
  // Create particle burst effect for data integration (scaled by performance)
  let particleCount = floor(15 * scale);
  
  for (let i = 0; i < particleCount; i++) {
    let angle = random(TWO_PI);
    let speed = random(1, 3);
    let velocity = p5.Vector.fromAngle(angle).mult(speed);
    
    particleEffects.push({
      position: createVector(x, y),
      velocity: velocity,
      life: 1.0,
      decay: random(0.03, 0.06),
      size: random(3, 6),
      hue: hue,
      saturation: random(80, 100),
      brightness: 100,
      type: random() < 0.3 ? 'square' : 'circle'
    });
  }
  
  // Create expanding ring effect
  let ringCount = floor(2 * scale);
  for (let i = 0; i < ringCount; i++) {
    particleEffects.push({
      position: createVector(x, y),
      velocity: createVector(0, 0),
      life: 1.0,
      decay: 0.03 + i * 0.01,
      size: 10 + i * 15,
      hue: hue,
      saturation: 100,
      brightness: 100,
      type: 'circle'
    });
  }
}

function addNetworkNode(x, y, radius, hue) {
  let angle = random(TWO_PI);
  let distance = random(20, radius);
  let newNode = {
    position: createVector(
      x + cos(angle) * distance,
      y + sin(angle) * distance
    ),
    velocity: createVector(0, 0),
    target: null,
    power: 1.5,
    processingLoad: random(0.2, 0.8),
    pulsePhase: frameCount * 0.1,
    isHunting: false
  };
  
  nodes.push(newNode);
  
  // Connect to nearby nodes
  let nearbyNodes = findNearbyNodes(newNode.position, 100, 3);
  if (nearbyNodes.length >= 2) {
    nearbyNodes.push(nodes.length - 1);
    createHyperedge(nearbyNodes, hue);
  }
  
  // Create node spawn effect
  createNodeSpawnEffect(x, y, hue, frameRateAdjuster);
}

function createNodeSpawnEffect(x, y, hue, scale) {
  // Create digital-looking spawn effect
  let particleCount = floor(10 * scale);
  
  for (let i = 0; i < particleCount; i++) {
    let angle = random(TWO_PI);
    let speed = random(0.5, 2);
    let velocity = p5.Vector.fromAngle(angle).mult(speed);
    
    particleEffects.push({
      position: createVector(x, y),
      velocity: velocity,
      life: 1.0,
      decay: random(0.03, 0.05),
      size: random(2, 5),
      hue: hue,
      saturation: 100,
      brightness: 100,
      type: random() < 0.7 ? 'square' : 'circle' // More squares for digital feel
    });
  }
}

function findNearbyNodes(position, radius, count) {
  // Find the nearest nodes to a position
  let distances = [];
  for (let i = 0; i < nodes.length - 1; i++) {
    let d = p5.Vector.dist(position, nodes[i].position);
    if (d <= radius) {
      distances.push({index: i, distance: d});
    }
  }
  
  // Sort by distance
  distances.sort((a, b) => a.distance - b.distance);
  
  // Return the indices of the closest nodes (up to count)
  return distances.slice(0, count).map(d => d.index);
}

function applyNetworkReconfiguration() {
  // Only reconfigure if we have enough energy
  let reconfigThreshold = 20;
  if (creatureEnergy < reconfigThreshold) return;
  
  let ruleChoice = random();
  
  // Rule 1: High-power nodes form new connections
  if (ruleChoice < 0.4) {
    let highPowerNodes = [];
    for (let i = 0; i < nodes.length; i++) {
      if (nodes[i].power > 1.3) {
        highPowerNodes.push(i);
      }
    }
    
    if (highPowerNodes.length >= 3) {
      let shuffled = [...highPowerNodes];
      shuffleArray(shuffled);
      let subset = shuffled.slice(0, min(5, shuffled.length));
      
      if (subset.length >= 3) {
        createHyperedge(subset, random([50, 140, 200, 280, 320])); // Digital color palette
        
        // Reconfiguration uses a small amount of energy
        creatureEnergy -= 0.5;
      }
    }
  }
  // Rule 2: Split large network segments
  else if (ruleChoice < 0.7 && frameRateAdjuster > 0.7) {
    let largeEdges = hyperedges.filter(e => e.nodeIndices.length > 5);
    
    if (largeEdges.length > 0) {
      let edgeToSplit = random(largeEdges);
      let nodeIndices = [...edgeToSplit.nodeIndices];
      
      // Shuffle and split
      shuffleArray(nodeIndices);
      let splitPoint = floor(nodeIndices.length / 2);
      
      let group1 = nodeIndices.slice(0, splitPoint);
      let group2 = nodeIndices.slice(splitPoint);
      
      if (group1.length >= 3 && group2.length >= 3) {
        createHyperedge(group1, (edgeToSplit.baseHue + 20) % 360);
        createHyperedge(group2, (edgeToSplit.baseHue - 20) % 360);
        
        // Reconfiguration uses a small amount of energy
        creatureEnergy -= 0.5;
      }
    }
  }
  // Rule 3: Form triangular connections
  else if (frameRateAdjuster > 0.6) {
    for (let attempts = 0; attempts < 3; attempts++) {
      let i = floor(random(nodes.length));
      let nearbyNodes = findNearbyNodes(nodes[i].position, 120, 3);
      
      if (nearbyNodes.length >= 2) {
        nearbyNodes.push(i);
        
        // Check if this exact hyperedge already exists
        let alreadyExists = false;
        for (let edge of hyperedges) {
          if (arraysHaveSameElements(edge.nodeIndices, nearbyNodes)) {
            alreadyExists = true;
            break;
          }
        }
        
        if (!alreadyExists && nearbyNodes.length >= 3) {
          createHyperedge(nearbyNodes, random([40, 160, 200, 280]));
          
          // Reconfiguration uses a small amount of energy
          creatureEnergy -= 0.3;
          break;
        }
      }
    }
  }
  
  // Limit total hyperedges for performance
  if (hyperedges.length > 25) {
    hyperedges.splice(0, hyperedges.length - 25);
  }
}

function createHyperedge(nodeIndices, hue) {
  hyperedges.push({
    nodeIndices: nodeIndices,
    baseHue: hue % 360
  });
}

function mousePressed() {
  if (mouseY > 50) {
    dataPackets.push({
      position: createVector(mouseX, mouseY),
      hue: random([40, 60, 140, 190, 280, 320]) // Digital color palette
    });
    
    // Create insertion effect
    createDataInsertionEffect(mouseX, mouseY, frameRateAdjuster);
    
    // Limit number of data packets
    if (dataPackets.length > 6) {
      dataPackets.shift();
    }
    
    // Set as target immediately
    creatureTarget = createVector(mouseX, mouseY);
  }
}

function createDataInsertionEffect(x, y, scale) {
  // Ring effect
  let ringCount = floor(2 * scale);
  for (let i = 0; i < ringCount; i++) {
    particleEffects.push({
      position: createVector(x, y),
      velocity: createVector(0, 0),
      life: 1.0,
      decay: 0.03 + i * 0.01,
      size: 15 + i * 10,
      hue: 60,
      saturation: 100,
      brightness: 100,
      type: 'circle'
    });
  }
  
  // Particle burst
  let particleCount = floor(8 * scale);
  for (let i = 0; i < particleCount; i++) {
    let angle = random(TWO_PI);
    let speed = random(1, 2.5);
    let velocity = p5.Vector.fromAngle(angle).mult(speed);
    
    particleEffects.push({
      position: createVector(x, y),
      velocity: velocity,
      life: 1.0,
      decay: random(0.03, 0.06),
      size: random(2, 5),
      hue: 60,
      saturation: 100,
      brightness: 100,
      type: random() < 0.5 ? 'square' : 'circle'
    });
  }
}

function keyPressed() {
  if (key === ' ') {
    systemActive = !systemActive;
  } else if (key === 'r' || key === 'R') {
    initializeSystem(14);
    dataPackets = [];
    particleEffects = [];
  }
}

// Helper function to shuffle array
function shuffleArray(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}

// Helper function to compare arrays regardless of order
function arraysHaveSameElements(arr1, arr2) {
  if (arr1.length !== arr2.length) return false;
  
  let a1 = [...arr1].sort();
  let a2 = [...arr2].sort();
  
  for (let i = 0; i < a1.length; i++) {
    if (a1[i] !== a2[i]) return false;
  }
  
  return true;
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
}
