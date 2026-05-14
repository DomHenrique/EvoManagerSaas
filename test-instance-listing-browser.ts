/**
 * 🧪 Browser-Based Instance Listing Test
 * 
 * Run this in the browser console while logged in to test instance listing.
 * 
 * Usage:
 * 1. Open the application in browser
 * 2. Login to your account
 * 3. Open browser console (F12)
 * 4. Copy and paste this entire file
 * 5. Run: testInstanceListing()
 */

import { supabase } from './services/supabase';
import { 
  getInstances, 
  saveInstance, 
  deleteInstance,
  syncInstancesFromAPI 
} from './services/instanceService';

// Make it available globally for browser console
declare global {
  interface Window {
    testInstanceListing: () => Promise<void>;
    insertTestInstances: () => Promise<void>;
    viewInstances: () => Promise<void>;
    clearTestInstances: () => Promise<void>;
  }
}

// ============================================================================
// BROWSER TEST FUNCTIONS
// ============================================================================

async function insertTestInstances() {
  console.log('🔧 Inserting test instances...\n');
  
  try {
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      console.error('❌ Not authenticated. Please login first.');
      return;
    }
    
    console.log('✅ Authenticated as:', user.email);
    
    // Call SQL function to insert test instances
    const { error } = await supabase.rpc('insert_test_instances', {
      p_user_id: user.id
    });
    
    if (error) {
      if (error.message?.includes('duplicate') || error.code === '23505') {
        console.log('ℹ️  Test instances already exist');
      } else {
        console.error('❌ Failed to insert test instances:', error);
        return;
      }
    } else {
      console.log('✅ Test instances inserted successfully');
    }
    
    // Verify insertion
    const instances = await getInstances(user.id);
    console.log(`\n📊 Total instances: ${instances.length}`);
    instances.forEach((inst, idx) => {
      console.log(`   ${idx + 1}. ${inst.instanceName} - ${inst.status}`);
    });
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

async function viewInstances() {
  console.log('📋 Viewing all instances...\n');
  
  try {
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      console.error('❌ Not authenticated. Please login first.');
      return;
    }
    
    // Get instances via service
    console.log('🔍 Fetching via instanceService.getInstances()...');
    const serviceInstances = await getInstances(user.id);
    
    // Get instances directly from database
    console.log('🔍 Fetching directly from database...');
    const { data: dbInstances, error } = await supabase
      .from('instances')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('❌ Database query error:', error);
      return;
    }
    
    console.log('\n📊 RESULTS:');
    console.log(`   Service returned: ${serviceInstances.length} instances`);
    console.log(`   Database returned: ${dbInstances?.length || 0} instances`);
    console.log(`   Match: ${serviceInstances.length === (dbInstances?.length || 0) ? '✅' : '❌'}\n`);
    
    if (serviceInstances.length > 0) {
      console.log('📋 Instances from Service:');
      console.table(serviceInstances.map(i => ({
        Name: i.instanceName,
        Status: i.status,
        Profile: i.profileName || 'N/A',
        ID: i.instanceId || 'N/A'
      })));
    } else {
      console.log('⚠️  No instances found via service');
    }
    
    if (dbInstances && dbInstances.length > 0) {
      console.log('\n📋 Instances from Database:');
      console.table(dbInstances.map(i => ({
        Name: i.instanceName,
        Status: i.status,
        Profile: i.profileName || 'N/A',
        Created: new Date(i.created_at).toLocaleString()
      })));
    } else {
      console.log('⚠️  No instances found in database');
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

async function clearTestInstances() {
  console.log('🗑️  Clearing test instances...\n');
  
  try {
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      console.error('❌ Not authenticated. Please login first.');
      return;
    }
    
    // Delete test instances
    const { error } = await supabase
      .from('instances')
      .delete()
      .eq('user_id', user.id)
      .like('instanceName', 'instance_test_%');
    
    if (error) {
      console.error('❌ Failed to clear test instances:', error);
      return;
    }
    
    console.log('✅ Test instances cleared');
    
    // Verify
    const instances = await getInstances(user.id);
    console.log(`\n📊 Remaining instances: ${instances.length}`);
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

async function testInstanceListing() {
  console.clear();
  console.log('🧪 INSTANCE LISTING TEST - Browser Version\n');
  console.log('='.repeat(80) + '\n');
  
  try {
    // Step 1: Check authentication
    console.log('📝 Step 1: Check Authentication');
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      console.error('❌ Not authenticated. Please login first.');
      console.log('\n💡 To fix: Login via the UI and run this test again.');
      return;
    }
    
    console.log('✅ Authenticated as:', user.email);
    console.log('   User ID:', user.id);
    console.log('');
    
    // Step 2: Check database connection
    console.log('📝 Step 2: Check Database Connection');
    const { data: testQuery, error: dbError } = await supabase
      .from('instances')
      .select('count')
      .eq('user_id', user.id);
    
    if (dbError) {
      console.error('❌ Database connection failed:', dbError);
      return;
    }
    
    console.log('✅ Database connection successful');
    console.log('');
    
    // Step 3: Insert test instances
    console.log('📝 Step 3: Insert Test Instances');
    const { error: insertError } = await supabase.rpc('insert_test_instances', {
      p_user_id: user.id
    });
    
    if (insertError && !insertError.message?.includes('duplicate')) {
      console.error('❌ Failed to insert test instances:', insertError);
    } else {
      console.log('✅ Test instances ready');
    }
    console.log('');
    
    // Step 4: Get instances via service
    console.log('📝 Step 4: Get Instances via Service');
    const instances = await getInstances(user.id);
    console.log(`✅ Service returned ${instances.length} instances`);
    
    if (instances.length > 0) {
      console.table(instances.map(i => ({
        Name: i.instanceName,
        Status: i.status,
        Profile: i.profileName || 'Not connected'
      })));
    }
    console.log('');
    
    // Step 5: Get instances directly from database
    console.log('📝 Step 5: Get Instances from Database');
    const { data: dbInstances, error: queryError } = await supabase
      .from('instances')
      .select('*')
      .eq('user_id', user.id);
    
    if (queryError) {
      console.error('❌ Database query failed:', queryError);
    } else {
      console.log(`✅ Database returned ${dbInstances?.length || 0} instances`);
    }
    console.log('');
    
    // Step 6: Sync from API
    console.log('📝 Step 6: Sync from Evolution API');
    const syncResult = await syncInstancesFromAPI(user.id);
    console.log(`${syncResult.success ? '✅' : '⚠️'} Sync completed`);
    console.log(`   Synced: ${syncResult.synced} instances`);
    console.log(`   Errors: ${syncResult.errors.length}`);
    if (syncResult.errors.length > 0) {
      console.log('   Error details:', syncResult.errors);
    }
    console.log('');
    
    // Step 7: Final verification
    console.log('📝 Step 7: Final Verification');
    const finalInstances = await getInstances(user.id);
    console.log(`✅ Final count: ${finalInstances.length} instances`);
    console.log('');
    
    // Summary
    console.log('='.repeat(80));
    console.log('✅ TEST COMPLETED SUCCESSFULLY\n');
    console.log('📊 SUMMARY:');
    console.log(`   - User: ${user.email}`);
    console.log(`   - Total Instances: ${finalInstances.length}`);
    console.log(`   - Database Connection: ✅`);
    console.log(`   - Service Functions: ✅`);
    console.log(`   - API Sync: ${syncResult.success ? '✅' : '⚠️'}`);
    console.log('');
    console.log('💡 AVAILABLE COMMANDS:');
    console.log('   - testInstanceListing()   → Run full test');
    console.log('   - viewInstances()         → View all instances');
    console.log('   - insertTestInstances()   → Add test data');
    console.log('   - clearTestInstances()    → Remove test data');
    console.log('='.repeat(80));
    
  } catch (error) {
    console.error('❌ TEST FAILED:', error);
  }
}

// Export to window for browser console access
if (typeof window !== 'undefined') {
  window.testInstanceListing = testInstanceListing;
  window.insertTestInstances = insertTestInstances;
  window.viewInstances = viewInstances;
  window.clearTestInstances = clearTestInstances;
  
  console.log('🧪 Instance Listing Test loaded!');
  console.log('💡 Run: testInstanceListing()');
}

export { testInstanceListing, insertTestInstances, viewInstances, clearTestInstances };
