import { supabase, localized } from '@/lib/supabase';

export interface Puja {
  id: string;
  title: string;
  templeName: string;
  priceRupees: number;
  category: string;
  isFeatured: boolean;
  imageUrl?: string;
  description?: string;
  location?: string;
  dateTimeStr?: string;
  durationStr?: string;
  priestName?: string;
  priestTitle?: string;
  priestExp?: string;
  significance?: string;
  specialTag?: string;
  devoteesCount?: string;
}

export interface PujaBooking {
  id?: string;
  pujaId: string;
  pujaTitle: string;
  templeName: string;
  amountRupees: number;
  sankalpaName: string;
  gotra?: string;
  nakshatra?: string;
  familyMembers?: string[];
  status?: string;
  bookingDate?: string;
}

export async function getPujas(category?: string, search?: string): Promise<{ pujas: Puja[], count: number }> {
  let query = supabase
    .from('puja_offerings')
    .select('id,name,name_i18n,description_i18n,significance_i18n,price,image_url,popular,priest_name,duration_min,temples(name,address)', { count: 'exact' })
    .eq('status', 'published')
    .order('popular', { ascending: false });
  if (category && category !== 'All') query = query.eq('offering_kind', category.toLowerCase());
  if (search) query = query.ilike('name', `%${search}%`);
  const { data, error, count } = await query;
  if (error) throw error;
  return {
    count: count ?? 0,
    pujas: (data ?? []).map((row) => {
      const temple = row.temples?.[0];
      return {
        id: row.id,
        title: row.name || localized(row.name_i18n),
        templeName: temple?.name || 'Temple',
        location: temple?.address || undefined,
        priceRupees: Number(row.price) / 100,
        category: 'Vazhipadu',
        isFeatured: Boolean(row.popular),
        imageUrl: row.image_url || undefined,
        description: localized(row.description_i18n),
        significance: localized(row.significance_i18n),
        priestName: row.priest_name || undefined,
        durationStr: row.duration_min ? `${row.duration_min} minutes` : undefined,
      };
    }),
  };
}

export async function getBookings(): Promise<{ bookings: PujaBooking[] }> {
  const { data, error } = await supabase
    .from('puja_bookings')
    .select('id,booking_date,amount,status,sankalpa,puja_offerings(name),temples(name)')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return {
    bookings: (data ?? []).map((row) => ({
      id: row.id,
      pujaId: row.id,
      pujaTitle: row.puja_offerings?.[0]?.name || 'Pooja offering',
      templeName: row.temples?.[0]?.name || 'Temple',
      amountRupees: Number(row.amount) / 100,
      sankalpaName: row.sankalpa?.name || '',
      gotra: row.sankalpa?.gotra,
      nakshatra: row.sankalpa?.nakshatra,
      status: row.status,
      bookingDate: row.booking_date,
    })),
  };
}

export async function createBooking(booking: Omit<PujaBooking, 'id' | 'status' | 'bookingDate'>): Promise<{ success: boolean, bookingId: string }> {
  const { data, error } = await supabase.rpc('create_puja_booking', {
    p_offering_id: booking.pujaId,
    p_booking_date: new Date().toISOString().slice(0, 10),
    p_quantity: 1,
    p_sankalpa: {
      devotee_name: booking.sankalpaName,
      gotra: booking.gotra || null,
      nakshatra: booking.nakshatra || null,
    },
    p_notes: null,
    p_prasadam: 'none',
  });
  if (error) throw error;
  return { success: true, bookingId: data?.id || 'pending' };
}
