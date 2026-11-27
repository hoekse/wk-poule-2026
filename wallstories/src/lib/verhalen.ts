import { getCollection } from 'astro:content';
export const paletKleuren: Record<string, string> = {
  Oker: '#C8963E', Zeegroen: '#4F9C8C', Nachtblauw: '#26365E', Bladgroen: '#6F8A4E', Zonnegeel: '#F0B44D', Rozenrood: '#E07C6E',
};
export async function alleVerhalen() {
  return (await getCollection('verhalen')).sort((a, b) => a.data.volgorde - b.data.volgorde);
}
