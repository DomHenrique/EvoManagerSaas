/**
 * Test file for EvoManager Groups functionality
 * This file will test the group management features step by step
 * with focus on permissions and admin levels within groups
 */

import { fetchGroups, fetchInstances } from './services/evolutionApi';

// Step 1: List available instances first (we need an instance name to fetch groups)
async function getAvailableInstance() {
  console.log('Getting available instances...');

  try {
    const instances = await fetchInstances();

    if (instances.length === 0) {
      console.log('No instances available to fetch groups from.');
      return null;
    }

    // Return the first available instance
    const instance = instances[0];
    console.log(`Using instance: "${instance.instanceName}" (Status: ${instance.status})`);
    return instance.instanceName;
  } catch (error) {
    console.error('Error fetching instances:', error);
    return null;
  }
}

// Step 2: Fetch groups for the selected instance
async function testListGroupsWithPermissions(instanceName: string) {
  console.log(`\nSTEP 2: List Groups with Permissions for instance "${instanceName}"`);

  try {
    console.log(`Calling fetchGroups("${instanceName}")...`);
    const groups = await fetchGroups(instanceName);

    console.log(`Successfully fetched ${groups.length} groups:`);

    if (groups.length > 0) {
      groups.forEach((group, groupIndex) => {
        console.log(`\n${groupIndex + 1}. Group: "${group.subject}"`);
        console.log(`   ID: ${group.id}`);
        console.log(`   Created: ${group.creation ? new Date(group.creation * 1000).toISOString() : 'N/A'}`);
        console.log(`   Owner: ${group.owner || 'N/A'}`);
        console.log(`   Size: ${group.size || 0} members`);

        if (group.participants && group.participants.length > 0) {
          // Count admin types
          const admins = group.participants.filter(p => p.isAdmin && !p.isSuperAdmin);
          const superAdmins = group.participants.filter(p => p.isSuperAdmin);
          const members = group.participants.filter(p => !p.isAdmin);

          console.log(`   Participants (${group.participants.length}): ${members.length} members, ${admins.length} admins, ${superAdmins.length} super admins`);

          group.participants.forEach((participant, participantIndex) => {
            const isAdmin = participant.isAdmin ? ' (ADMIN)' : '';
            const isSuperAdmin = participant.isSuperAdmin ? ' (SUPERADMIN)' : '';
            const status = `${isAdmin}${isSuperAdmin}` || ' (MEMBER)';

            console.log(`     ${participantIndex + 1}. ${participant.id}${status}`);
          });
        } else {
          console.log('   No participants data available or getParticipants was false');
        }
      });
    } else {
      console.log('No groups found for this instance.');
    }

    return groups;
  } catch (error) {
    console.error('Error fetching groups:', error);
    if (error instanceof Error) {
      console.error('Error name:', error.name);
      console.error('Error message:', error.message);
    }
    return [];
  }
}

// Main execution function
async function runGroupTests() {
  console.log('Starting EvoManager Groups and Permissions Test...\n');

  // Step 1: Get an instance to work with
  const instanceName = await getAvailableInstance();

  if (!instanceName) {
    console.log('Cannot proceed without an available instance.');
    return;
  }

  console.log('\n' + '='.repeat(60));

  // Step 2: List groups with permissions
  const groups = await testListGroupsWithPermissions(instanceName);

  // Summary
  console.log('\n' + '='.repeat(60));
  console.log('TEST SUMMARY:');
  console.log(`- Found ${groups.length} groups in instance "${instanceName}"`);

  // Count participants by permission level
  let totalParticipants = 0;
  let admins = 0;
  let superadmins = 0;

  groups.forEach(group => {
    if (group.participants) {
      group.participants.forEach(participant => {
        totalParticipants++;
        if (participant.isSuperAdmin) superadmins++;
        if (participant.isAdmin && !participant.isSuperAdmin) admins++; // Don't double count super admins as regular admins
      });
    }
  });

  console.log(`- Total participants across all groups: ${totalParticipants}`);
  console.log(`- Admins: ${admins}`);
  console.log(`- Super Admins: ${superadmins}`);

  console.log('\nGroup and permissions test completed successfully!');
}

// Run the tests
if (typeof require !== 'undefined' && require.main === module) {
  runGroupTests().catch(console.error);
}

export { testListGroupsWithPermissions, getAvailableInstance };