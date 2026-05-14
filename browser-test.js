/**
 * Browser Console Test Script
 * 
 * Copy and paste this into the browser console (F12) while logged in
 * to diagnose instance listing issues
 */

// Test 1: Check authentication
console.log('=== Test 1: Authentication ===');
const { data: { user }, error: authError } = await supabase.auth.getUser();
if (authError) {
  console.error('❌ Auth error:', authError);
} else {
  console.log('✅ Authenticated as:', user.email);
  console.log('   User ID:', user.id);
}

// Test 2: Check Evolution API
console.log('\n=== Test 2: Evolution API ===');
try {
  const response = await fetch('https://evo-api.hnperformancedigital.com.br/instance/fetchInstances', {
    headers: {
      'apikey': import.meta.env.VITE_EVOLUTION_API_KEY
    }
  });
  const apiData = await response.json();
  console.log(`✅ Found ${apiData.length} instances in Evolution API:`);
  apiData.forEach(inst => {
    console.log(`   - ${inst.name} (${inst.connectionStatus})`);
  });
} catch (error) {
  console.error('❌ Evolution API error:', error);
}

// Test 3: Check Database
console.log('\n=== Test 3: Database ===');
try {
  const { data: dbData, error: dbError } = await supabase
    .from('instances')
    .select('*')
    .eq('user_id', user.id);
  
  if (dbError) {
    console.error('❌ Database error:', dbError);
  } else {
    console.log(`✅ Found ${dbData.length} instances in Database:`);
    dbData.forEach(inst => {
      console.log(`   - ${inst.instanceName} (${inst.status})`);
    });
  }
} catch (error) {
  console.error('❌ Database query error:', error);
}

// Test 4: Test sync function
console.log('\n=== Test 4: Manual Sync ===');
try {
  // Import the sync function (this assumes the module is available)
  const { syncInstancesFromAPI } = await import('./services/instanceService.ts');
  const syncResult = await syncInstancesFromAPI(user.id);
  console.log('Sync result:', syncResult);
  
  // Check database again
  const { data: dbDataAfter } = await supabase
    .from('instances')
    .select('*')
    .eq('user_id', user.id);
  console.log(`✅ After sync: ${dbDataAfter.length} instances in Database`);
} catch (error) {
  console.error('❌ Sync error:', error);
}

console.log('\n=== Tests Complete ===');
