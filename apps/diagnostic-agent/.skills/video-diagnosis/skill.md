---
name: video-diagnosis
description: Analyze vehicle videos for motion-based issues and combined audio-visual diagnosis
---

# Video Diagnosis Skill

Use this skill when the customer provides video recordings of their vehicle.

## Video Analysis Approach

### 1. Extract and Analyze Frames

Use the `extractVideoFrames` tool to capture key frames for visual analysis.

### 2. Transcribe Audio Track

If the video has audio, use the `transcribeAudio` tool to analyze sounds.

### 3. Motion Analysis

Look for issues that require motion to observe.

## What to Analyze

### Vibration Issues

- **Steering wheel shake**:
  - At highway speed → unbalanced wheels, warped rotors
  - Under braking → warped rotors
  - At idle → engine misfire, motor mount
- **Body vibration**:
  - Speed-dependent → tires, driveline
  - RPM-dependent → engine, accessories
- **Seat/floor vibration**:
  - Rear-end issues, exhaust hangers

### Steering Behavior

- **Pull to one side**:
  - Constant → alignment, tire pressure
  - Under braking → caliper issue, uneven wear
- **Wandering**:
  - Loose steering components
  - Worn tie rods, ball joints
- **Play in steering**:
  - Worn steering gear, linkage

### Exhaust Smoke Patterns

- **Startup smoke**:
  - Blue on cold start → valve seals
  - White puff that clears → normal condensation
- **Continuous smoke**:
  - White → coolant burning
  - Blue → oil consumption
  - Black → rich fuel mixture
- **Smoke under acceleration**:
  - Indicates when issue occurs

### Dashboard Warning Lights

- Capture and identify warning indicators
- Note when lights illuminate/extinguish
- Check for intermittent patterns

### Suspension Behavior

- **Body roll**: Excessive lean in corners
- **Nose dive**: Excessive dip when braking
- **Bounce test**: Multiple oscillations after bump
- **Uneven ride height**: One corner sagging

### Drivetrain Issues

- **Clunks on acceleration/deceleration**: U-joints, CV joints
- **Shudder under load**: Torque converter, clutch
- **Hesitation**: Transmission slipping

## Frame Extraction Strategy

Request frames at key moments:

1. Beginning of symptom
2. Peak of symptom
3. End of symptom
4. Multiple angles if panning

For timing:

- Short videos (< 30s): 5 frames evenly distributed
- Longer videos: Focus on symptomatic moments

## Response Format

When analyzing video, provide:

1. **Visual Findings**: What you observed in the frames
2. **Audio Findings**: What you heard (if audio present)
3. **Motion Analysis**: Issues visible in motion
4. **Combined Assessment**: How findings relate
5. **Severity Rating**: Critical / High / Medium / Low
6. **Recommended Action**: Next diagnostic steps

## Example Response

"I've analyzed your video of the steering wheel shake:

**Visual Findings**: The steering wheel oscillates approximately 1-2 inches side to side at highway
speed.

**Motion Analysis**: The vibration appears speed-dependent (worse at 60+ mph) and is not affected by
braking in this clip.

**Combined Assessment**: This pattern is consistent with wheel balance issues or tire
irregularities. The frequency of oscillation suggests front wheel imbalance.

**Severity: Medium** - Safe to drive but should be addressed for comfort and tire longevity.

**Recommended Action**:

1. Check tire pressures
2. Inspect tires for flat spots or bulges
3. Have wheels balanced
4. If persists, have tires and wheels inspected for runout

Can you send a video showing the shake while braking? This will help rule out warped rotors."
