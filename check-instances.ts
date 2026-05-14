/**
 * Diagnostic script to check instances in Evolution API and Database
 */

import { fetchInstances as fetchInstancesFromAPI } from './services/evolutionApi';
import { getInstances, syncInstancesFromAPI } from './services/instanceService';
import { supabase } from './services/supabase';

async function checkInstances() {
  console.log('🔍 Checking Instances...\n');

  try {
    // Check Evolution API
    console.log('📡 Checking Evolution API...');
    const apiInstances = await fetchInstancesFromAPI();
    console.log(`   Found ${apiInstances.length} instances in Evolution API:`);
    apiInstances.forEach(inst => {
      console.log(`   - ${inst.instanceName} (${inst.status})`);
    });
    console.log('');

    // Check Database
    console.log('💾 Checking Database...');
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      console.error('❌ Not authenticated. Please login first via the UI.');
      console.log('   Run the app with: npm run dev');
      console.log('   Then login and run this script again.');
      return;
    }

    console.log(`✅ Authenticated as: ${user.email}`);
    console.log(`   User ID: ${user.id}\n`);

    const dbInstances = await getInstances(user.id);
    console.log(`   Found ${dbInstances.length} instances in Database:`);
    dbInstances.forEach(inst => {
      console.log(`   - ${inst.instanceName} (${inst.status})`);
    });
    console.log('');

    // Compare
    if (apiInstances.length > dbInstances.length) {
      console.log('⚠️  Database has fewer instances than Evolution API!');
      console.log('   Running sync to update database...\n');
      
      const syncResult = await syncInstancesFromAPI(user.id);
      console.log(`   Sync completed: ${syncResult.success ? '✅' : '❌'}`);
      console.log(`   - Synced: ${syncResult.synced} instances`);
      console.log(`   - Errors: ${syncResult.errors.length}`);
      if (syncResult.errors.length > 0) {
        syncResult.errors.forEach(err => console.log(`     - ${err}`));
      }
      console.log('');

      // Check again
      const dbInstancesAfter = await getInstances(user.id);
      console.log(`   Database now has ${dbInstancesAfter.length} instances:`);
      dbInstancesAfter.forEach(inst => {
        console.log(`   - ${inst.instanceName} (${inst.status})`);
      });
    } else if (apiInstances.length === 0 && dbInstances.length === 0) {
      console.log('ℹ️  No instances found in either Evolution API or Database.');
      console.log('   Create an instance via the UI to get started.');
    } else {
      console.log('✅ Database is in sync with Evolution API!');
    }

  } catch (error) {
    console.error('❌ Error:', error);
  }
}

// Run the check
checkInstances()
  .then(() => {
    console.log('\n✅ Check completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Check failed:', error);
    process.exit(1);
  });
