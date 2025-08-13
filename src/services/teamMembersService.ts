import { supabase } from '@/integrations/supabase/client';
import { TeamMember, UserRole } from '@/types/serviceTypes';

export const getTeamMembers = async (): Promise<TeamMember[]> => {
  try {
    console.log('[TEAM] Buscando membros da equipe...');
    
    // Buscar perfis com informações de role
    const { data, error } = await supabase
      .from('profiles')
      .select(`
        id,
        name,
        avatar,
        team_id,
        organization_id,
        created_at,
        user_roles (role)
      `)
      .order('name', { ascending: true });

    if (error) {
      console.error('[TEAM] Erro ao buscar membros:', error);
      throw new Error(`Erro ao carregar equipe: ${error.message}`);
    }

    const members: TeamMember[] = [];
    
    for (const profile of data || []) {
      // Calcular métricas reais baseadas na atribuição de técnicos
      const { data: completedServices } = await supabase
        .from('service_technicians')
        .select('service_id', { count: 'exact' })
        .eq('technician_id', profile.id)
        .in('service_id', (
          await supabase
            .from('services')
            .select('id')
            .eq('status', 'concluido')
        ).data?.map(s => s.id) || []);
      
      const { data: pendingServices } = await supabase
        .from('service_technicians')
        .select('service_id', { count: 'exact' })
        .eq('technician_id', profile.id)
        .in('service_id', (
          await supabase
            .from('services')
            .select('id')
            .in('status', ['pendente', 'em_andamento'])
        ).data?.map(s => s.id) || []);

      // Calcular rating médio baseado em feedbacks dos serviços atribuídos
      const { data: assignedServices } = await supabase
        .from('service_technicians')
        .select(`
          service_id,
          services!inner(
            feedback,
            status
          )
        `)
        .eq('technician_id', profile.id)
        .eq('services.status', 'concluido')
        .not('services.feedback', 'is', null);

      const feedbackData = assignedServices?.map(as => as.services.feedback).filter(Boolean) || [];

      let avgRating = 4.5; // Default
      if (feedbackData && feedbackData.length > 0) {
        const ratings = feedbackData
          .map(s => {
            try {
              const feedback = typeof s.feedback === 'string' ? JSON.parse(s.feedback) : s.feedback;
              return feedback?.clientRating;
            } catch {
              return null;
            }
          })
          .filter(rating => rating && rating > 0);
        
        if (ratings.length > 0) {
          avgRating = ratings.reduce((sum, rating) => sum + rating, 0) / ratings.length;
        }
      }

      const userRole = (profile.user_roles?.[0]?.role as UserRole) || 'tecnico';

      const member: TeamMember = {
        id: profile.id,
        name: profile.name || 'Nome não informado',
        role: userRole,
        avatar: profile.avatar || '',
        teamId: profile.team_id,
        organizationId: profile.organization_id,
        createdAt: profile.created_at,
        // Métricas reais de performance baseadas em atribuições
        stats: {
          completedServices: completedServices?.length || 0,
          pendingServices: pendingServices?.length || 0,
          avgRating: Number(avgRating.toFixed(1)),
          joinDate: new Date(profile.created_at).toLocaleDateString('pt-BR')
        }
      };
      
      members.push(member);
    }

    console.log('[TEAM] Membros carregados com métricas:', members.length);
    return members;
  } catch (error) {
    console.error('[TEAM] Erro fatal:', error);
    throw error;
  }
};

export const addTeamMember = async (member: {
  name: string;
  role: UserRole;
  // Do NOT insert email, phone, or signature, as they're not in the profiles DB schema
  avatar?: string;
  id?: string; // Only needed if explicitly setting, otherwise leave for Supabase
}): Promise<TeamMember> => {
  // Prepare safe insert object
  const insertData: any = {
    name: member.name,
    avatar: member.avatar || null
  };
  if (member.id) {
    insertData.id = member.id;
  }
  // Insert profile (id is only set if provided)
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .insert(insertData)
    .select()
    .single();

  if (profileError) throw profileError;

  // Add user_role for this member
  const { error: roleError } = await supabase
    .from('user_roles')
    .insert({
      user_id: profile.id,
      role: member.role
    });
  if (roleError) throw roleError;

  // Return new member with role
  return {
    id: profile.id,
    name: profile.name || "",
    avatar: profile.avatar || "",
    role: member.role
  };
};

export const updateTeamMember = async (memberId: string, data: Partial<TeamMember>): Promise<boolean> => {
  // Update the profile
  const { error } = await supabase
    .from('profiles')
    .update({
      name: data.name,
      avatar: data.avatar,
      email: data.email,
      phone: data.phone,
      signature: data.signature
    })
    .eq('id', memberId);

  if (error) throw error;

  // If changing role, update user_roles
  if (data.role) {
    const { error: roleError } = await supabase
      .from('user_roles')
      .update({ role: data.role })
      .eq('user_id', memberId);
    if (roleError) throw roleError;
  }
  return true;
};

export const deleteTeamMember = async (memberId: string): Promise<boolean> => {
  // Delete profile (this should cascade via FK to user_roles)
  const { error } = await supabase
    .from('profiles')
    .delete()
    .eq('id', memberId);
  if (error) throw error;
  return true;
};
