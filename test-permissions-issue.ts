/**
 * Teste específico para verificar o problema de permissões incorretas
 * Verifica se um usuário está aparecendo com permissões incorretas 
 */

import { fetchInstances, fetchGroups } from './services/evolutionApi';
import { getUserRoleInGroup } from './utils/group-permissions';

// Este ID é baseado nos logs anteriores - substitua pelo seu ID real
const MY_USER_ID = '209479043940588@lid'; // Este era um dos IDs nos logs

async function testUserPermissions() {
  console.log('Teste de Permissões de Usuário\n');
  
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
    
    // Analisar papel do usuário em cada grupo
    groups.forEach((group, index) => {
      const userRole = getUserRoleInGroup(MY_USER_ID, group);
      
      console.log(`Grupo ${index + 1}: ${group.subject}`);
      console.log(`  ID do Grupo: ${group.id}`);
      console.log(`  Owner: ${group.owner}`);
      console.log(`  Seu Papel Real: ${userRole.role}`);
      console.log(`  Tamanho: ${group.size || 0} membros`);
      console.log(`  Você está listado nos participantes: ${userRole.participantInfo ? 'Sim' : 'Não'}`);
      
      if (userRole.participantInfo) {
        console.log(`  - isAdmin: ${userRole.participantInfo.isAdmin}`);
        console.log(`  - isSuperAdmin: ${userRole.participantInfo.isSuperAdmin}`);
      }
      
      // Verificar se há inconsistência
      if (group.owner === MY_USER_ID && userRole.role !== 'owner') {
        console.log(`  ⚠️  ALERTA: Você é o owner mas papel é ${userRole.role}`);
      } else if (group.owner !== MY_USER_ID && userRole.role === 'owner') {
        console.log(`  ⚠️  ALERTA: Você NÃO é o owner mas papel está como ${userRole.role}`);
      }
      
      console.log('');
    });
    
    // Contar papéis
    const roles = groups.map(g => getUserRoleInGroup(MY_USER_ID, g).role);
    const roleCounts: Record<string, number> = {};
    roles.forEach(role => {
      roleCounts[role] = (roleCounts[role] || 0) + 1;
    });
    
    console.log('Resumo dos papéis:');
    Object.entries(roleCounts).forEach(([role, count]) => {
      console.log(`  ${role}: ${count} grupos`);
    });
    
  } catch (error) {
    console.error('Erro no teste:', error);
  }
}

// Executar o teste
testUserPermissions().catch(console.error);