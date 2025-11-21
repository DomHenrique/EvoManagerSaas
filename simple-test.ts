/**
 * Simple test to check if we can import and use the API functions
 */

// Import the API client to see if there are any immediate errors
import { fetchInstances } from './services/evolutionApi';

console.log('Successfully imported fetchInstances function');

// Try to call it with a simple check
console.log('Attempting to call fetchInstances...');

// Create a simple async function to test
async function test() {
  try {
    console.log('About to call fetchInstances...');
    const result = await Promise.race([
      fetchInstances(),
      new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout after 5000ms')), 5000))
    ]);
    
    console.log('Success! Received result:', result);
  } catch (error) {
    console.error('Error in test:', error);
  }
}

test();