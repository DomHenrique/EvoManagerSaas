/**
 * Função para determinar corretamente o papel do usuário em um grupo
 * Corrige o problema onde o status era confundido
 */

import { EvoGroup, EvoGroupParticipant } from '../types';

// Função para determinar o papel do usuário em um grupo específico
export function getUserRoleInGroup(userId: string, group: EvoGroup): { role: 'owner' | 'admin' | 'superadmin' | 'member' | 'not_participant', participantInfo: EvoGroupParticipant | null } {
  // Verificar se o usuário é o dono do grupo
  if (group.owner === userId) {
    // O usuário é o owner, mas precisamos verificar também seu papel como participante
    const participantInfo = group.participants?.find(p => p.id === userId) || null;
    
    // Se o usuário é o owner, mas também está listado como participante, 
    // usamos o papel mais específico como participante
    if (participantInfo) {
      if (participantInfo.isSuperAdmin) {
        return { role: 'superadmin', participantInfo };
      } else if (participantInfo.isAdmin) {
        return { role: 'admin', participantInfo };
      } else {
        return { role: 'owner', participantInfo };
      }
    }
    // Se o usuário é owner mas não está nos participantes, assume-se como owner
    return { role: 'owner', participantInfo: null };
  }
  
  // Se não é o owner, procurar nos participantes
  const participantInfo = group.participants?.find(p => p.id === userId) || null;
  
  if (participantInfo) {
    if (participantInfo.isSuperAdmin) {
      return { role: 'superadmin', participantInfo };
    } else if (participantInfo.isAdmin) {
      return { role: 'admin', participantInfo };
    } else {
      return { role: 'member', participantInfo };
    }
  }
  
  // Se não está como owner nem como participante
  return { role: 'not_participant', participantInfo: null };
}

// Função para atualizar o status de permissão considerando o papel correto
export function fixGroupPermissionsForUser(userId: string, groups: EvoGroup[]): EvoGroup[] {
  return groups.map(group => {
    // Determinar o papel real do usuário no grupo
    const userRole = getUserRoleInGroup(userId, group);
    
    // Atualizar a informação do participante para refletir o papel real
    let updatedParticipants = group.participants;
    if (group.participants) {
      updatedParticipants = group.participants.map(participant => {
        // Atualizar somente o usuário atual se for o caso
        if (participant.id === userId) {
          let isAdmin = participant.isAdmin;
          let isSuperAdmin = participant.isSuperAdmin;
          
          // Ajustar os campos isAdmin e isSuperAdmin com base no papel real
          switch (userRole.role) {
            case 'superadmin':
              isAdmin = true;
              isSuperAdmin = true;
              break;
            case 'admin':
              isAdmin = true;
              isSuperAdmin = false;
              break;
            case 'member':
              isAdmin = false;
              isSuperAdmin = false;
              break;
            case 'owner':
              // Decidir se o owner deve também ser considerado admin
              // Por padrão, geralmente um owner tem privilégios de admin
              isAdmin = false; // ou true, dependendo da convenção do sistema
              isSuperAdmin = false;
              break;
            case 'not_participant':
              isAdmin = false;
              isSuperAdmin = false;
              break;
          }
          
          return {
            ...participant,
            isAdmin,
            isSuperAdmin
          };
        }
        return participant;
      });
    }
    
    return {
      ...group,
      participants: updatedParticipants
    };
  });
}