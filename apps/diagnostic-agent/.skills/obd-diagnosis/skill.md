---
name: obd-diagnosis
description: Interpret OBD-II diagnostic trouble codes and provide diagnostic guidance
---

# OBD Diagnosis Skill

Use this skill when the customer provides OBD-II diagnostic trouble codes.

## Code Structure

### Code Format: XNNNN

- **First character (type)**:
  - P = Powertrain (engine, transmission)
  - B = Body (HVAC, airbags, lighting)
  - C = Chassis (ABS, stability control)
  - U = Network (communication between modules)

- **Second character (origin)**:
  - 0 = Generic (SAE standard)
  - 1 = Manufacturer-specific
  - 2-3 = Varies by manufacturer

- **Third character (subsystem)**:
  - For P codes:
    - 1, 2 = Fuel and air metering
    - 3 = Ignition system
    - 4 = Emissions controls
    - 5 = Speed/idle control
    - 6 = Computer systems
    - 7, 8 = Transmission

## Diagnostic Approach

### 1. Look Up the Code

Use `lookupObdCode` tool for common codes.

### 2. Understand Context

Ask about:

- When did the light come on?
- Any performance changes?
- Recent repairs or maintenance?
- Has this code appeared before?

### 3. Identify Root Cause vs Symptom

Many codes are symptoms of underlying issues:

- P0300 (random misfire) could be caused by ignition, fuel, or mechanical issues
- P0420 (catalyst efficiency) is often caused by upstream problems
- Multiple codes may share a root cause

### 4. Consider Related Codes

Codes often come in clusters:

- P0171 + P0174 = System lean on both banks → vacuum leak or MAF issue
- P0301-P0304 = Misfires on specific cylinders → individual cylinder issues
- Multiple U codes = Communication problem affecting many modules

## Severity Classification

### Critical (Stop Driving)

- Misfire codes with flashing CEL
- Oil pressure codes
- Overheating codes
- Brake system codes

### High (Service Soon)

- Catalyst efficiency (P0420/P0430)
- Transmission codes
- Fuel system lean/rich
- Ignition system codes

### Medium (Schedule Service)

- EVAP system codes
- Sensor circuit codes
- Secondary air codes
- EGR codes

### Low (Monitor)

- Occasional pending codes
- Minor sensor codes
- After clearing, doesn't return

## Common Code Families

### Misfire Codes (P0300-P0312)

- Check spark plugs, coils, injectors
- Compression test if persistent
- May indicate head gasket if coolant loss

### Oxygen Sensor Codes (P0130-P0167)

- Upstream sensors affect fuel trim
- Downstream sensors monitor catalyst
- Often caused by exhaust leaks first

### EVAP Codes (P0440-P0457)

- Often just a loose gas cap
- Check filler neck and hoses
- Can indicate purge valve issues

### Catalyst Codes (P0420-P0439)

- Usually indicates cat failure
- But check upstream issues first
- Exhaust leaks can cause false codes

## Response Format

When interpreting codes, provide:

1. **Code Breakdown**: What each code means
2. **Likely Causes**: Most common reasons (in order of likelihood)
3. **Severity Rating**: Critical / High / Medium / Low
4. **DIY Checks**: What the customer can verify
5. **Professional Diagnosis**: What a shop would check
6. **Related Symptoms**: What else to look for

## Example Response

"You've provided code **P0171** - System Too Lean (Bank 1).

**What This Means**: The engine is receiving more air than fuel on one side of
the engine. The computer is trying to compensate by adding fuel but has reached
its limit.

**Likely Causes** (most to least common):

1. Vacuum leak (intake manifold gasket, vacuum hoses)
2. Faulty Mass Air Flow (MAF) sensor
3. Fuel delivery issue (weak pump, clogged filter, failing injector)
4. Exhaust leak before O2 sensor

**Severity: Medium** - Safe to drive short-term but fuel economy and performance
suffer. Can cause catalyst damage if ignored.

**DIY Checks**:

- Listen for hissing sounds under the hood
- Check for cracked or disconnected vacuum hoses
- Clean the MAF sensor with MAF-specific cleaner

**Professional Diagnosis**: Smoke test for vacuum leaks, fuel pressure test,
live data review.

Do you have any other codes? And have you noticed any performance issues like
rough idle or hesitation?"
