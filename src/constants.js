export const stages = [
  ['new', 'Yangi lead', '#2563eb', '#eff6ff', '#bfdbfe'],
  ['contacted', 'Bog‘lanildi', '#8b5cf6', '#f5f3ff', '#ddd6fe'],
  ['offer', 'Taklif yuborildi', '#eab308', '#fefce8', '#fef08a'],
  ['negotiation', 'Muzokara', '#f97316', '#fff7ed', '#fed7aa'],
  ['won', 'Sotuv', '#06b6d4', '#ecfeff', '#a5f3fc'],
  ['lost', 'Rad etildi', '#ef4444', '#fef2f2', '#fecaca'],
];

export const choices = {
  customerType: [
    ['legal', 'Yuridik shaxs'],
    ['entrepreneur', 'Yakka tartibdagi tadbirkor'],
    ['individual', 'Jismoniy shaxs'],
  ],
  paymentType: [
    ['cash', 'Naqd'],
    ['leasing', 'Lizing'],
    ['installment', 'Bo‘lib to‘lash'],
    ['transfer', 'Pul o‘tkazish'],
    ['undecided', 'Aniqlanmagan'],
  ],
  offerSent: [
    ['no', 'Yuborilmagan'],
    ['yes', 'Yuborilgan'],
  ],
  rejectionReason: [
    ['', 'Tanlanmagan'],
    ['expensive', 'Qimmat'],
    ['unsuitable', 'To‘g‘ri kelmadi'],
    ['price_only', 'Faqat narx bilish uchun'],
    ['other', 'Boshqa'],
  ],
  source: [
    ['phone', 'Telefon qo‘ng‘irog‘i'],
    ['website', 'Veb-sayt'],
    ['instagram', 'Instagram'],
    ['telegram', 'Telegram'],
    ['visit', 'Tashrif'],
    ['referral', 'Tavsiya'],
    ['other', 'Boshqa'],
  ],
};

export const regions = [
  'Toshkent shahri',
  'Toshkent viloyati',
  'Samarqand',
  'Qashqadaryo',
  'Surxondaryo',
  'Buxoro',
  'Navoiy',
  'Jizzax',
  'Sirdaryo',
  'Farg‘ona',
  'Andijon',
  'Namangan',
  'Xorazm',
  'Qoraqalpog‘iston Respublikasi',
];

export const label = (type, v) => choices[type]?.find((x) => x[0] === v)?.[1] || v;
export const date = (v) =>
  v ? new Date(v).toLocaleString('uz-UZ', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }) : '—';
export const money = (v) => new Intl.NumberFormat('uz-UZ').format(v || 0);
export function payload(l) {
  const { id, version, createdAt, updatedAt, ...data } = l;
  return data;
}
