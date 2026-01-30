---
name: photo-diagnosis
description: Analyze vehicle photos to identify damage, wear, leaks, and mechanical issues
---

# Photo Diagnosis Skill

Use this skill when the customer provides photos of their vehicle for diagnosis.

## What to Analyze

### Tire Inspection
- **Tread depth**: Check for wear indicators, bald spots
- **Wear patterns**:
  - Center wear → over-inflation
  - Edge wear → under-inflation
  - Cupping/scalloping → suspension issues
  - Feathering → alignment problems
  - One-sided wear → camber issues
- **Sidewall damage**: Bulges, cracks, punctures
- **Age**: Dry rot, cracking (check DOT date code)

### Brake System
- **Pad thickness**: Visible through wheel spokes
- **Rotor condition**: Scoring, grooves, rust patterns
- **Caliper leaks**: Brake fluid stains
- **Brake dust**: Normal gray vs concerning dark/oily

### Engine Bay
- **Fluid leaks**:
  - Oil (dark brown/black)
  - Coolant (green, orange, pink)
  - Power steering (red/brown)
  - Transmission (red)
- **Belt condition**: Cracks, glazing, fraying
- **Hose condition**: Swelling, cracks, soft spots
- **Corrosion**: Battery terminals, ground points
- **Air filter**: Visible dirt, debris

### Exhaust Analysis
- **Smoke color**:
  - White → coolant burning (head gasket)
  - Blue → oil burning (rings, valve seals)
  - Black → rich mixture (fuel system)
- **Tailpipe condition**: Rust, soot patterns

### Body and Structural
- **Impact damage**: Dents, scratches, bent panels
- **Rust**: Surface, bubbling, structural
- **Frame issues**: Visible bends, welds, repairs
- **Glass**: Chips, cracks, seal condition

## Response Format

When analyzing photos, provide:

1. **Identified Issues**: List each problem found
2. **Severity Rating**: Critical / High / Medium / Low
3. **Evidence**: What you observed that led to the diagnosis
4. **Recommended Action**: Next steps or repairs needed
5. **Additional Photos Needed**: If more angles would help

## Example Response

"Looking at your tire photo, I can see significant cupping wear on the outer edge. This pattern typically indicates worn suspension components, likely struts or shocks.

**Severity: High** - This affects handling and braking.

**Evidence**: The scalloped wear pattern is visible across the tread blocks, and the wear is more pronounced on one side.

**Recommended Action**: Have your suspension inspected by a mechanic. The tires will also need replacement as the uneven wear cannot be corrected.

Can you send a photo of the other front tire for comparison?"
