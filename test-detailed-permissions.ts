/**
 * Teste mais detalhado para verificar campos de proprietário e permissões
 */

import { fetchInstances, fetchGroups } from './services/evolutionApi';

// Este ID é baseado nos logs anteriores - substitua pelo seu ID real
const MY_USER_ID = '209479043940588@lid'; // Este era um dos IDs nos logs

async function detailedUserPermissionsTest() {
  console.log('Teste Detalhado de Permissões de Usuário\n');
  
  try {
    // Obter instâncias
    const instances = await fetchInstances();
    if (instances.length === 0) {
      console.log('Nenhuma instância disponível');
      return;
    }
    
    const firstInstance = instances[0];
    console.log(`Usando instância: ${firstInstance.instanceName}`);
    
    // Obter grupos
    const groups = await fetchGroups(firstInstance.instanceName);
    console.log(`Total de grupos: ${groups.length}\n`);
    
    // Analisar detalhadamente cada grupo
    groups.forEach((group, index) => {
      console.log(`Grupo ${index + 1}: ${group.subject}`);
      console.log(`  ID do Grupo: ${group.id}`);
      console.log(`  Owner (criador): ${group.owner}`);
      console.log(`  Subject Owner: ${group.subjectOwner || 'N/A'}`);
      console.log(`  Creation: ${group.creation ? new Date(group.creation * 1000).toISOString() : 'N/A'}`);
      console.log(`  Size: ${group.size || 0} membros`);
      
      // Procurar você mesmo nos participantes
      const myParticipant = group.participants?.find(p => p.id === MY_USER_ID);
      console.log(`  Você como participante:`);
      if (myParticipant) {
        console.log(`    ID: ${myParticipant.id}`);
        console.log(`    isAdmin: ${myParticipant.isAdmin}`);
        console.log(`    isSuperAdmin: ${myParticipant.isSuperAdmin}`);
      } else {
        console.log(`    Você NÃO está na lista de participantes`);
      }
      
      // Verificar se você é o owner
      if (group.owner === MY_USER_ID) {
        console.log(`  🚨 ALERTA: Você é listado como OWNER deste grupo`);
      }
      
      // Verificar se você é o subjectOwner
      if (group.subjectOwner === MY_USER_ID) {
        console.log(`  ℹ️  NOTA: Você definiu o assunto deste grupo`);
      }
      
      console.log(`  ---`);
    });
    
    // Contar quantos grupos você é dono
    const groupsImOwnerOf = groups.filter(g => g.owner === MY_USER_ID);
    const groupsWhereAdmin = groups.filter(g => {
      const myParticipant = g.participants?.find(p => p.id === MY_USER_ID);
      return myParticipant && myParticipant.isAdmin;
    });
    
    console.log(`\nResumo:`);
    console.log(`  Você é OWNER de: ${groupsImOwnerOf.length} grupos`);
    console.log(`  Você é ADMIN em: ${groupsWhereAdmin.length} grupos`);
    console.log(`  Grupos totais: ${groups.length}`);
    
  } catch (error) {
    console.error('Erro no teste detalhado:', error);
  }
}

// Executar o teste
detailedUserPermissionsTest().catch(console.error);