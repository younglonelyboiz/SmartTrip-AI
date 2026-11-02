import type { PlanVersion } from './types';
export interface Journey {
  origin: string;
  mode: string;
  arrival: string;
  departure: string;
  transferMinutes: number;
  travelCost: string;
}
export const defaultJourney = (): Journey => ({ origin: 'Hà Nội', mode: 'Máy bay', arrival: '07:00', departure: '19:00', transferMinutes: 60, travelCost: '' });
export function journeyFromSearch(search: string): Journey | null {
  const p = new URLSearchParams(search);
  if (!p.has('origin')) return null;
  const transfer = Number(p.get('transfer'));
  const time = /^(?:[01]\d|2[0-3]):[0-5]\d$/;
  const arrival = p.get('arrival') || '', departure = p.get('departure') || '';
  const mode = p.get('mode') || '';
  const travelCost = p.get('travelCost') || '';
  if (!p.get('origin')?.trim() || !time.test(arrival) || !time.test(departure) || !Number.isInteger(transfer) || transfer < 0 || transfer > 1440 || !['Máy bay','Tàu hỏa','Xe khách','Ô tô'].includes(mode) || (travelCost !== '' && (!/^\d+$/.test(travelCost) || !Number.isSafeInteger(Number(travelCost))))) return null;
  return {origin: p.get('origin')!.trim().slice(0,100), mode, arrival, departure, transferMinutes: transfer, travelCost};
}
export function journeySearch(j: Journey): string {
  return '?' + new URLSearchParams({origin:j.origin,mode:j.mode,arrival:j.arrival,departure:j.departure,transfer:String(j.transferMinutes),travelCost:j.travelCost}).toString();
}
export const minuteOfDay = (s:string) => Number(s.slice(0,2))*60+Number(s.slice(3));
export function journeyConflict(j: Journey, plan: PlanVersion): string | null {
  if (j.origin.trim().toLocaleLowerCase('vi') === plan.request.destination.trim().toLocaleLowerCase('vi')) return 'Điểm xuất phát và điểm đến cần khác nhau.';
  const ready = minuteOfDay(j.arrival) + j.transferMinutes;
  const leave = minuteOfDay(j.departure) - j.transferMinutes;
  const first = plan.days[0], last = plan.days[plan.days.length-1];
  if (ready > first.departureMinute) return 'Giờ đến và chặng nối không kịp giờ bắt đầu lịch mẫu ngày đầu. Hãy chọn giờ đến sớm hơn hoặc giảm thời gian nối phù hợp; demo chưa tự xếp lại lịch.';
  if (leave < last.returnMinute) return 'Lịch mẫu ngày cuối kết thúc quá muộn để kịp chặng về và thời gian nối. Hãy chọn giờ về muộn hơn; demo chưa tự xếp lại lịch.';
  return null;
}

const journeyKey = (plan:PlanVersion) => 'smarttrip.journey.' + encodeURIComponent(plan.tripId) + '.' + encodeURIComponent(plan.versionId);
export function loadJourneySearch(plan:PlanVersion): string {
  try { const search=localStorage.getItem(journeyKey(plan)) || ''; return journeyFromSearch(search) ? search : ''; } catch { return ''; }
}
export function saveJourneySearch(plan:PlanVersion, search:string): boolean {
  try { if(journeyFromSearch(search)) localStorage.setItem(journeyKey(plan),search); else localStorage.removeItem(journeyKey(plan)); return true; } catch {return false;}
}
