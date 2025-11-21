/**
 * Test file for EvoManager Instances functionality
 * This file will test the instance management features step by step
 */

import { fetchInstances } from './services/evolutionApi';

// Helper function to timeout a promise
function timeoutPromise<T>(promise: Promise<T>, ms: number): Promise<T> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      reject(new Error(`Timeout after ${ms}ms`));
    }, ms);

    promise.then(
      result => {
        clearTimeout(timer);
        resolve(result);
      },
      error => {
        clearTimeout(timer);
        reject(error);
      }
    );
  });
}

// Step 1: List instances
async function testListInstances() {
  console.log('Starting test: List Instances');

  try {
    console.log('Calling fetchInstances()...');
    console.log('Fetching instances from Evolution API...');

    // Add timeout to prevent hanging
    const instances = await timeoutPromise(fetchInstances(), 10000); // 10 second timeout

    console.log(`Successfully fetched ${instances.length} instances:`);

    if (instances.length > 0) {
      instances.forEach((instance, index) => {
        console.log(`${index + 1}. Name: ${instance.instanceName || 'N/A'}, Status: ${instance.status || 'N/A'}, ID: ${instance.instanceId || 'N/A'}`);
      });
    } else {
      console.log('No instances found or returned from the API.');
    }

  } catch (error) {
    console.error('Error fetching instances:', error);
    if (error instanceof Error) {
      console.error('Error name:', error.name);
      console.error('Error message:', error.message);
      console.error('Error stack:', error.stack);
    }
  }

  console.log('Finished test: List Instances');
}

// Main execution
async function runTests() {
  console.log('Starting EvoManager Instances Tests...\n');

  // Step 1: List instances
  await testListInstances();

  console.log('\nAll tests completed.');
}

// Run the tests
if (typeof require !== 'undefined' && require.main === module) {
  runTests();
}

export { testListInstances };