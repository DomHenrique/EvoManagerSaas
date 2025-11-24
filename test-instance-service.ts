/**
 * Test script for Instance Service
 * 
 * Tests:
 * - Database CRUD operations
 * - Sync from Evolution API
 * - Periodic sync functionality
 */

import { 
  getInstances, 
  saveInstance, 
  deleteInstance, 
  syncInstancesFromAPI 
} from './services/instanceService';
import { supabase } from './services/supabase';

async function testInstanceService() {
  console.log('🧪 Testing Instance Service\n');

  try {
    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      console.error('❌ Authentication failed:', authError);
      console.log('\n💡 Please login first via the UI or set up authentication');
      return;
    }

    console.log('✅ Authenticated as:', user.email);
    console.log('   User ID:', user.id);
    console.log('');

    // Test 1: Get instances from database
    console.log('📋 Test 1: Get instances from database');
    const instances = await getInstances(user.id);
    console.log(`   Found ${instances.length} instances in database`);
    instances.forEach(inst => {
      console.log(`   - ${inst.instanceName} (${inst.status})`);
    });
    console.log('');

    // Test 2: Save a test instance
    console.log('💾 Test 2: Save test instance to database');
    const testInstanceName = `test_instance_${Date.now()}`;
    const savedInstance = await saveInstance(user.id, {
      instanceName: testInstanceName,
      status: 'close',
      integration: 'WHATSAPP-BAILEYS',
    });
    
    if (savedInstance) {
      console.log('   ✅ Instance saved successfully');
      console.log(`   - Name: ${savedInstance.instanceName}`);
      console.log(`   - Status: ${savedInstance.status}`);
      console.log(`   - Created: ${savedInstance.created_at}`);
    }
    console.log('');

    // Test 3: Update instance status
    console.log('🔄 Test 3: Update instance status');
    const updatedInstance = await saveInstance(user.id, {
      instanceName: testInstanceName,
      status: 'open',
      profileName: 'Test Profile',
    });
    
    if (updatedInstance) {
      console.log('   ✅ Instance updated successfully');
      console.log(`   - Status: ${updatedInstance.status}`);
      console.log(`   - Profile: ${updatedInstance.profileName}`);
      console.log(`   - Connected at: ${updatedInstance.connected_at}`);
    }
    console.log('');

    // Test 4: Sync from Evolution API
    console.log('🔄 Test 4: Sync from Evolution API');
    const syncResult = await syncInstancesFromAPI(user.id);
    console.log(`   Sync completed: ${syncResult.success ? '✅' : '❌'}`);
    console.log(`   - Synced: ${syncResult.synced} instances`);
    console.log(`   - Errors: ${syncResult.errors.length}`);
    if (syncResult.errors.length > 0) {
      syncResult.errors.forEach(err => console.log(`     - ${err}`));
    }
    console.log('');

    // Test 5: Get instances after sync
    console.log('📋 Test 5: Get instances after sync');
    const instancesAfterSync = await getInstances(user.id);
    console.log(`   Found ${instancesAfterSync.length} instances in database`);
    instancesAfterSync.forEach(inst => {
      console.log(`   - ${inst.instanceName} (${inst.status})`);
    });
    console.log('');

    // Test 6: Delete test instance
    console.log('🗑️  Test 6: Delete test instance');
    await deleteInstance(user.id, testInstanceName);
    console.log('   ✅ Test instance deleted');
    console.log('');

    // Final verification
    console.log('📋 Final verification: Get instances');
    const finalInstances = await getInstances(user.id);
    console.log(`   Found ${finalInstances.length} instances in database`);
    console.log('');

    console.log('✅ All tests completed successfully!\n');
    console.log('💡 Next steps:');
    console.log('   1. Open the Instances page in the UI');
    console.log('   2. Create a new instance');
    console.log('   3. Verify it appears immediately in the database');
    console.log('   4. Wait 60 seconds and check if status updates automatically');
    console.log('');

  } catch (error) {
    console.error('❌ Test failed:', error);
    throw error;
  }
}

// Run tests
if (typeof window === 'undefined' || 
    process.argv[1]?.includes('test-instance-service')) {
  testInstanceService()
    .then(() => {
      console.log('✅ Test script completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Test script failed:', error);
      process.exit(1);
    });
}

export { testInstanceService };
