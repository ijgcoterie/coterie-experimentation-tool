# Multi-Variate Testing Guide

This guide explains how to use the multi-variate testing features in Coterie's Client-Side Experimentation tool.

## What are Multi-Variate Tests?

While A/B tests compare just two variations (control vs. treatment), multi-variate tests allow you to test multiple variations simultaneously. This enables you to:

- Test more than two variations of a feature
- Test different implementation approaches
- Allocate traffic differently across variations
- Create sophisticated experimental designs

## Creating a Multi-Variate Test

1. Go to the **Experiments** page and click "New Experiment"
2. Fill in the experiment details and targeting criteria
3. In the **Experiment Variations** section:
   - By default, you'll see "Control" and "Treatment" variations
   - Click "Add Variation" to add more test variations
   - Set the traffic allocation percentage for each variation
   - Add custom JavaScript code for each variation

## Variation Configuration

Each variation has the following properties:

- **Name**: A descriptive name for the variation (e.g., "Red Button", "Large Font", etc.)
- **Traffic Allocation**: Percentage of eligible users who will see this variation
- **JavaScript Code**: Custom code that will be executed when a user is assigned to this variation

## Best Practices

1. **Create a true control group**: Always include a control variation with no changes.
2. **Limit variations**: While you can create many variations, we recommend limiting to 5 or fewer to ensure statistical significance.
3. **Equal allocation** is recommended for most tests, but you can adjust for specific scenarios.
4. **Clear variation names** help with analysis and reporting.
5. **Test one factor at a time** when possible to make results easier to interpret.

## Accessing Variation Information in Code

In your variation code, you can access information about the current variation:

```javascript
// Access the experiment context
const experiment = window.__COTERIE_EXPERIMENT__;

if (experiment) {
  console.log(`Running experiment: ${experiment.id}`);
  console.log(`Assigned variation: ${experiment.variation}`);
  
  // Perform variation-specific code
  if (experiment.variation === 'treatment_a') {
    // Do something specific to treatment A
  } else if (experiment.variation === 'treatment_b') {
    // Do something specific to treatment B
  }
}
```

## Analyzing Results

When analyzing results, the system will:

1. Track key metrics for each variation
2. Compare each variation against the control
3. Calculate statistical significance
4. Identify the best-performing variation

## Migration from A/B Tests

Existing A/B tests are automatically migrated to the multi-variate format with two variations (Control and Treatment). You can:

1. Keep using them as-is
2. Add new variations to existing tests
3. Adjust traffic allocation for existing variations

## Technical Implementation

Multi-variate tests are implemented through Statsig Layers, where:

- Each experiment is a Layer
- Each variation is represented as a Layer Rule
- Traffic is allocated according to the weight of each variation
- Code execution respects the assigned variation

## Troubleshooting

If you encounter issues with multi-variate tests:

1. Check browser console for errors
2. Verify that the variation code is valid JavaScript
3. Ensure total traffic allocation adds up to 100%
4. Confirm targeting rules are working as expected