import { supabase, localized } from '@/lib/supabase';

export interface Animal {
  id: string;
  name: string;
  gaushalaId?: string;
  gaushalaName?: string;
  breed?: string;
  imageUrl?: string;
  needsSupport?: boolean;
  status?: string;
  ageStr?: string;
  ageMonths?: number;
  healthStatus?: string;
  healthDescription?: string;
  monthlyGoalRupees?: number;
  raisedRupees?: number;
  isUrgent?: boolean;
  story?: string;
}

export interface Gaushala {
  id: string;
  name: string;
  location?: string;
  city?: string;
  state?: string;
  imageUrl?: string;
  animalsRescuedCount?: number;
  trustScorePercent?: number;
  transparencyTier?: string;
  shelterPercent?: number;
  fodderPercent?: number;
  medicalPercent?: number;
  missionQuote?: string;
  updatesCount?: number;
}

export interface WelfareStats {
  totalRescued: number;
  activeSanctuaries: number;
  publishedTemples: number;
}

export async function getAnimals(gaushalaId?: string): Promise<{ animals: Animal[], count: number }> {
  let query = supabase
    .from('animals')
    .select('id,name,gaushala_id,breed_id,image_url,age_estimate_months,health_status,story_i18n,sponsorship_goal,sponsorship_raised,gaushalas(name),breeds(name)', { count: 'exact' })
    .eq('is_public', true)
    .eq('status', 'active');
  if (gaushalaId) query = query.eq('gaushala_id', gaushalaId);
  const { data, error, count } = await query;
  if (error) throw error;
  return {
    count: count ?? 0,
    animals: (data ?? []).map((row) => {
      const gaushala = row.gaushalas as unknown as { name?: string } | null;
      const breed = row.breeds as unknown as { name?: string } | null;
      return {
        id: row.id,
        name: row.name,
        gaushalaId: row.gaushala_id,
        gaushalaName: gaushala?.name,
        breed: breed?.name ?? 'Indigenous',
        imageUrl: row.image_url || undefined,
        ageStr: row.age_estimate_months ? `${Math.floor(row.age_estimate_months / 12)} Years` : undefined,
        ageMonths: row.age_estimate_months ?? undefined,
        healthStatus: row.health_status,
        healthDescription: localized(row.story_i18n),
        monthlyGoalRupees: Number(row.sponsorship_goal) / 100,
        raisedRupees: Number(row.sponsorship_raised) / 100,
        needsSupport: Number(row.sponsorship_raised) < Number(row.sponsorship_goal),
        story: localized(row.story_i18n),
      };
    }),
  };
}

export async function getGaushalas(city?: string): Promise<{ gaushalas: Gaushala[], count: number }> {
  let query = supabase
    .from('gaushalas')
    .select('id,name,name_i18n,description_i18n,address,cover_image_url,trust_score,transparency,capacity,verified,featured,districts(name,states(name))', { count: 'exact' })
    .eq('status', 'published')
    .order('featured', { ascending: false });
  if (city) query = query.ilike('address', `%${city}%`);
  const { data, error, count } = await query;
  if (error) throw error;
  return {
    count: count ?? 0,
    gaushalas: (data ?? []).map((row) => ({
      id: row.id,
      name: row.name || localized(row.name_i18n),
      location: row.address || undefined,
      state: (row.districts as unknown as { states?: { name?: string } | null } | null)?.states?.name,
      imageUrl: row.cover_image_url || undefined,
      animalsRescuedCount: row.capacity || undefined,
      trustScorePercent: Number(row.trust_score),
      transparencyTier: row.verified ? 'Verified registry' : 'Community listing',
      shelterPercent: row.transparency?.fund_use?.shelter,
      fodderPercent: row.transparency?.fund_use?.fodder,
      medicalPercent: row.transparency?.fund_use?.medical,
      missionQuote: localized(row.description_i18n),
    })),
  };
}

export async function getWelfareStats(): Promise<WelfareStats> {
  const { data, error } = await supabase.from('welfare_stats').select('*').maybeSingle();
  if (error) throw error;
  return {
    totalRescued: Number(data?.animals_cared || 0),
    activeSanctuaries: Number(data?.gaushalas || 0),
    publishedTemples: Number(data?.temples || 0),
  };
}
