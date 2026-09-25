import { supabase } from '@/lib/supabase';

export interface Profile {
  id?: string;
  displayName?: string;
  city?: string;
  gotra?: string;
  nakshatra?: string;
}

export interface Donation {
  id: string;
  targetType: string;
  amountRupees: number;
  paymentStatus: string;
  targetName?: string;
  sevaCategory?: string;
  dedication?: string;
  taxExempt80G?: boolean;
  createdAt?: string;
  dateStr?: string;
}

export interface FamilyMember {
  id: string;
  name: string;
  relationship: string;
  rashi?: string;
  nakshatra?: string;
}

export async function getProfile(): Promise<{ profile: Profile }> {
  const { data, error } = await supabase.from('profiles').select('id,display_name,city,gotra,nakshatra').single();
  if (error) throw error;
  return { profile: { id: data.id, displayName: data.display_name, city: data.city, gotra: data.gotra, nakshatra: data.nakshatra } };
}

export async function updateProfile(profile: Partial<Profile>): Promise<{ success: boolean }> {
  const { error } = await supabase.from('profiles').upsert({
    display_name: profile.displayName,
    city: profile.city,
    gotra: profile.gotra,
    nakshatra: profile.nakshatra,
  });
  if (error) throw error;
  return { success: true };
}

export async function getDonations(): Promise<{ donations: Donation[] }> {
  const { data, error } = await supabase
    .from('seva_contributions')
    .select('id,amount,status,message,created_at')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return {
    donations: (data ?? []).map((row) => ({
      id: row.id,
      targetType: 'SEVA',
      amountRupees: Number(row.amount) / 100,
      paymentStatus: row.status,
      dedication: row.message || undefined,
      createdAt: row.created_at,
    })),
  };
}

export async function createDonation(donation: {
  amountRupees: number;
  targetType: string;
  targetName?: string;
  sevaCategory?: string;
  dedication?: string;
  taxExempt80G?: boolean;
}): Promise<{ success: boolean, donationId: string }> {
  const { data: campaign, error: campaignError } = await supabase
    .from('seva_campaigns')
    .select('id,gaushala_id')
    .eq('status', 'published')
    .limit(1)
    .maybeSingle();
  if (campaignError) throw campaignError;
  if (!campaign) throw new Error('No active seva campaign is available.');
  const { data, error } = await supabase.rpc('create_contribution', {
    p_amount: Math.max(1000, Math.round(donation.amountRupees * 100)),
    p_campaign_id: campaign.id,
    p_gaushala_id: campaign.gaushala_id,
    p_animal_id: null,
    p_message: donation.dedication || null,
    p_is_anonymous: false,
  });
  if (error) throw error;
  return { success: true, donationId: data?.id || 'pending' };
}

export async function getFamily(): Promise<{ family: FamilyMember[] }> {
  const { data, error } = await supabase.from('family_members').select('id,name,relation,gotra,nakshatra').order('created_at');
  if (error) throw error;
  return { family: (data ?? []).map((row) => ({ id: row.id, name: row.name, relationship: row.relation || '', rashi: row.gotra, nakshatra: row.nakshatra })) };
}

export async function addFamilyMember(member: Omit<FamilyMember, 'id'>): Promise<{ success: boolean, memberId: string }> {
  const { data, error } = await supabase.from('family_members').insert({
    name: member.name,
    relation: member.relationship,
    gotra: member.rashi,
    nakshatra: member.nakshatra,
  }).select('id').single();
  if (error) throw error;
  return { success: true, memberId: data.id };
}
