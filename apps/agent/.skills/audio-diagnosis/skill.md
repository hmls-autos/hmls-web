---
name: audio-diagnosis
description: Interpret vehicle sounds to diagnose mechanical problems
---

# Audio Diagnosis Skill

Use this skill when the customer provides audio recordings of vehicle sounds.

## Sound Categories

### Knocking/Pinging Sounds

- **Detonation knock**: Sharp metallic pinging under load
  - Causes: Low octane fuel, carbon buildup, timing issues
  - Severity: Medium to High (engine damage risk)
- **Rod knock**: Deep rhythmic knock, increases with RPM
  - Causes: Worn rod bearings
  - Severity: Critical (stop driving immediately)
- **Piston slap**: Hollow knocking when cold, may quiet when warm
  - Causes: Worn piston skirts, excessive clearance
  - Severity: Medium (monitor closely)

### Squealing Sounds

- **Serpentine belt**: High-pitched squeal on startup or acceleration
  - Causes: Worn/loose belt, worn tensioner, misaligned pulleys
  - Severity: Medium (can leave stranded)
- **Brake squeal**: High-pitched when braking
  - Causes: Worn pads, glazed pads, dust/debris
  - Severity: Low to High (depends on pad condition)
- **Power steering whine**: Whining on turns
  - Causes: Low fluid, worn pump, air in system
  - Severity: Medium

### Grinding Sounds

- **Brake grinding**: Metal-on-metal when braking
  - Causes: Worn-through pads, damaged rotors
  - Severity: Critical (unsafe brakes)
- **Transmission grinding**: Grinding when shifting
  - Causes: Worn synchros, low fluid, clutch issues
  - Severity: High
- **CV joint grinding**: Grinding on turns
  - Causes: Worn CV joint, damaged boot
  - Severity: High (joint can fail)

### Clicking/Ticking Sounds

- **Lifter tick**: Light ticking from engine top
  - Causes: Low oil, worn lifters, oil viscosity
  - Severity: Low to Medium
- **CV joint click**: Clicking on tight turns
  - Causes: Worn outer CV joint
  - Severity: High (eventual failure)
- **Exhaust tick**: Ticking rhythm matching RPM
  - Causes: Exhaust leak at manifold
  - Severity: Low to Medium

### Humming/Whining Sounds

- **Wheel bearing hum**: Hum that changes with speed
  - Causes: Worn wheel bearing
  - Severity: High (safety issue)
- **Differential whine**: Whine from rear end
  - Causes: Low fluid, worn gears
  - Severity: Medium to High
- **Transmission whine**: Whine in specific gears
  - Causes: Worn gears, bearing issues
  - Severity: Medium

## Diagnostic Questions to Ask

1. When does the sound occur?
   - Cold start only
   - While driving
   - When braking
   - During acceleration
   - On turns

2. Does the sound change with:
   - Engine RPM
   - Vehicle speed
   - Temperature
   - Load/weight

3. Where does the sound seem to come from?
   - Front/rear
   - Left/right
   - Under hood
   - Under vehicle

## Response Format

When analyzing audio, provide:

1. **Sound Identification**: What type of sound you hear
2. **Likely Cause**: Most probable source
3. **Severity Rating**: Critical / High / Medium / Low
4. **Additional Diagnostics**: Other symptoms to check for
5. **Action Required**: Immediate steps

## Example Response

"The audio reveals a rhythmic grinding sound that increases with vehicle speed but is independent of
engine RPM. This pattern is characteristic of a wheel bearing issue.

**Likely Cause**: Worn front wheel bearing (based on sound location)

**Severity: High** - Wheel bearings can fail catastrophically, causing loss of vehicle control.

**Additional Diagnostics**: Check for play in the wheel, feel for heat after driving.

**Action Required**: Have this inspected immediately. Avoid highway driving until diagnosed."
