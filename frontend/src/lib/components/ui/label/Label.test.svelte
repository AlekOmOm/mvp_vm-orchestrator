<!--
  Test component to demonstrate the improved Label component functionality
  This file can be used for manual testing and as usage examples
-->

<script>
  import { Label } from "./index.js";
</script>

<div class="p-8 space-y-6 max-w-md">
  <h1 class="text-2xl font-bold mb-6">Label Component Tests</h1>
  
  <!-- Test 1: Basic usage with proper 'for' attribute -->
  <div class="space-y-2">
    <h2 class="text-lg font-semibold">Basic Usage</h2>
    <Label htmlFor="email">Email Address</Label>
    <input 
      id="email" 
      type="email" 
      class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
      placeholder="Enter your email"
    />
  </div>

  <!-- Test 2: Backward compatibility with 'fors' prop -->
  <div class="space-y-2">
    <h2 class="text-lg font-semibold">Backward Compatibility (fors prop)</h2>
    <Label fors="username">Username (using deprecated 'fors')</Label>
    <input 
      id="username" 
      type="text" 
      class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
      placeholder="Enter your username"
    />
  </div>

  <!-- Test 3: Required field with indicator -->
  <div class="space-y-2">
    <h2 class="text-lg font-semibold">Required Field</h2>
    <Label htmlFor="password" required>Password</Label>
    <input 
      id="password" 
      type="password" 
      required
      class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
      placeholder="Enter your password"
    />
  </div>

  <!-- Test 4: Custom required indicator -->
  <div class="space-y-2">
    <h2 class="text-lg font-semibold">Custom Required Indicator</h2>
    <Label htmlFor="phone" required requiredIndicator=" (required)">Phone Number</Label>
    <input 
      id="phone" 
      type="tel" 
      required
      class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
      placeholder="Enter your phone number"
    />
  </div>

  <!-- Test 5: Custom styling -->
  <div class="space-y-2">
    <h2 class="text-lg font-semibold">Custom Styling</h2>
    <Label htmlFor="bio" class="text-lg font-bold text-blue-600">Bio</Label>
    <textarea 
      id="bio" 
      rows="3"
      class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
      placeholder="Tell us about yourself"
    ></textarea>
  </div>

  <!-- Test 6: Disabled form control -->
  <div class="space-y-2">
    <h2 class="text-lg font-semibold">Disabled Field</h2>
    <Label htmlFor="disabled-field">Disabled Field</Label>
    <input 
      id="disabled-field" 
      type="text" 
      disabled
      value="This field is disabled"
      class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 peer"
    />
  </div>

  <!-- Test 7: Checkbox with label -->
  <div class="space-y-2">
    <h2 class="text-lg font-semibold">Checkbox</h2>
    <div class="flex items-center space-x-2">
      <input 
        id="terms" 
        type="checkbox" 
        class="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
      />
      <Label htmlFor="terms">I agree to the terms and conditions</Label>
    </div>
  </div>

  <!-- Test 8: Radio buttons with labels -->
  <div class="space-y-2">
    <h2 class="text-lg font-semibold">Radio Buttons</h2>
    <div class="space-y-2">
      <div class="flex items-center space-x-2">
        <input 
          id="option1" 
          name="options" 
          type="radio" 
          value="option1"
          class="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
        />
        <Label htmlFor="option1">Option 1</Label>
      </div>
      <div class="flex items-center space-x-2">
        <input 
          id="option2" 
          name="options" 
          type="radio" 
          value="option2"
          class="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
        />
        <Label htmlFor="option2">Option 2</Label>
      </div>
    </div>
  </div>
</div>

<style>
  /* Additional styles for better visual testing */
  :global(.text-destructive) {
    color: #ef4444;
  }
</style>
