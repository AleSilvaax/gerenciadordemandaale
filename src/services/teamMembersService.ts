import { supabase } from '@/integrations/supabase/client';
import { TeamMember, UserRole } from '@/types/serviceTypes';

export const getTeamMembers = async (): Promise<TeamMember[]> => {
  // Get all profiles
  const { data: profiles, error: profileError } = await supabase
    .from('profiles')
    .select('*');
  if (profileError) throw profileError;
  if (!profiles || !Array.isArray(profiles)) return [];

  // Get all user_roles
  const { data: roles, error: roleError } = await supabase
    .from('user_roles')
    .select('user_id, role');
  if (roleError) throw roleError;

  // Merge profiles with their roles
  const members: TeamMember[] = profiles.map(profile => {
    const role = roles?.find(r => r.user_id === profile.id)?.role as UserRole || "tecnico";
    return {
      id: profile.id,
      name: profile.name || "Sem Nome",
      avatar: profile.avatar || "",
      role
    };
  });
  return members;
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
