import { useSyncExternalStore } from 'react';
const listeners=new Set();
let language=localStorage.getItem('leadcore-language') || 'uz';
export const languages={uz:'O‘zbekcha',cy:'Ўзбекча',ru:'Русский',en:'English'};
if(!languages[language]) language='uz';
export const getLanguage=()=>language;
export function setLanguage(value){ if(!languages[value])return; language=value;localStorage.setItem('leadcore-language',value);document.documentElement.lang=value==='cy'?'uz-Cyrl':value;listeners.forEach(fn=>fn()); }
export function useLanguage(){return useSyncExternalStore(fn=>{listeners.add(fn);return()=>listeners.delete(fn);},getLanguage);}
export function cyrillic(value) {
 const protectedParts=[];
 let text=String(value).replace(/LeadCore|KAMAZ|JAC|CRM|UZS|API|CSV|NestJS|PostgreSQL|Instagram|Telegram|[A-Z]\d+/g, word=>{protectedParts.push(word);return '§'+(protectedParts.length-1)+'§';});
 text=text.replace(/lead/gi,word=>word[0]==='L'?'Лид':'лид').replace(/yo[‘’ʻ'`]/gi,word=>word[0]==='Y'?'Йў':'йў').replace(/(^|[^a-zа-яёўғқҳ])e/gi,(_,prefix)=>prefix+'э');
 const map={a:'а',b:'б',d:'д',e:'е',f:'ф',g:'г',h:'ҳ',i:'и',j:'ж',k:'к',l:'л',m:'м',n:'н',o:'о',p:'п',q:'қ',r:'р',s:'с',t:'т',u:'у',v:'в',x:'х',y:'й',z:'з'};
 text=text.replace(/o[‘’ʻ'`]|g[‘’ʻ'`]|sh|ch|yo|yu|ya|ye|[a-z]/gi,part=>{const lower=part.toLowerCase();const result=lower.startsWith('o')&&lower.length===2?'ў':lower.startsWith('g')&&lower.length===2?'ғ':({sh:'ш',ch:'ч',yo:'ё',yu:'ю',ya:'я',ye:'е'}[lower]||map[lower]||part);return part[0]===part[0].toUpperCase()?result[0].toUpperCase()+result.slice(1):result;});
 return text.replace(/[‘’ʻ']/g,'ъ').replace(/§(\d+)§/g,(_,i)=>protectedParts[Number(i)]);
}

const rows=`Leadlar|Лиды|Leads
Statistika|Аналитика|Analytics
Katalog|Каталог|Catalog
Foydalanuvchilar|Пользователи|Users
Sozlamalar|Настройки|Settings
Yangi lead|Новый лид|New lead
Yangi lead qo‘shish|Добавить лид|Add lead
Har bir lead nazoratda.|Управляйте каждым лидом.|Every lead under control.
Raqamlar orqali natija.|Результаты в цифрах.|Results at a glance.
Sotuv voronkasi|Воронка продаж|Sales pipeline
Jami leadlar|Всего лидов|Total leads
Faol manfaatdorlar|Активные лиды|Active leads
Muvaffaqiyatli sotuv|Успешные сделки|Won deals
Sotuv samarasi|Объём продаж|Sales revenue
Kanban|Канбан|Board
Ro‘yxat|Список|List
Yangi lead|Новый лид|New lead
Bog‘lanildi|Контакт установлен|Contacted
Taklif yuborildi|Предложение отправлено|Offer sent
Muzokara|Переговоры|Negotiation
Sotuv|Сделка выиграна|Won
Rad etildi|Отказ|Lost
Bu bosqichda lead yo‘q|В этом этапе нет лидов|No leads in this stage
+ Lead qo‘shish|+ Добавить лид|+ Add lead
Barcha segmentlar|Все сегменты|All segments
Barcha manbalar|Все источники|All sources
Ism, telefon yoki mahsulot qidirish...|Поиск по имени, телефону или товару…|Search name, phone or product…
Ism, telefon yoki mahsulot bo‘yicha qidirish...|Поиск по имени, телефону или товару…|Search name, phone or product…
Yangilash|Обновить|Refresh
Yangilanmoqda...|Обновление…|Refreshing…
Qayta urinish|Повторить|Retry
Yuklanmoqda...|Загрузка…|Loading…
Saqlash|Сохранить|Save
Saqlanmoqda...|Сохранение…|Saving…
Bekor qilish|Отмена|Cancel
Yopish|Закрыть|Close
Tahrirlash|Изменить|Edit
Ism va familiya *|Имя и фамилия *|Full name *
Telefon raqami *|Номер телефона *|Phone number *
Mijoz turi *|Тип клиента *|Customer type *
Korxona nomi / MChJ|Название компании|Company name
Faoliyat tarmog‘i / soha *|Сфера деятельности *|Industry *
Hudud *|Регион *|Region *
Shahar / tuman *|Город / район *|City / district *
Mas’ul operator *|Ответственный оператор *|Assigned operator *
Mijoz haqida ma’lumot|Информация о клиенте|Customer information
Mahsulotlar va taklif|Товары и предложение|Products and offer
Qiziqtirgan mahsulotlar *|Интересующие товары *|Products of interest *
Mahsulot qidirish...|Поиск товара…|Search products…
To‘lov turi *|Способ оплаты *|Payment method *
Tijoriy taklif *|Коммерческое предложение *|Commercial offer *
Taxminiy / sotuv summasi (UZS)|Ожидаемая сумма / сумма сделки (UZS)|Expected / sale amount (UZS)
Lead bosqichi|Этап лида|Lead stage
Murojaat va keyingi qadam|Обращение и следующий шаг|Inquiry and next step
Murojaat manbasi *|Источник обращения *|Lead source *
Qayta bog‘lanish sanasi|Дата следующего контакта|Follow-up date
Operator izohi|Комментарий оператора|Operator notes
Mijoz ehtiyoji va kelishuvlar...|Потребности клиента и договорённости…|Customer needs and agreements…
O‘zgarishlar tarixi|История изменений|Activity history
MIJOZ KARTASI|КАРТОЧКА КЛИЕНТА|CUSTOMER DETAILS
YANGI MUROJAAT|НОВОЕ ОБРАЩЕНИЕ|NEW INQUIRY
Yuridik shaxs|Юридическое лицо|Company
Yakka tartibdagi tadbirkor|Индивидуальный предприниматель|Sole proprietor
Jismoniy shaxs|Физическое лицо|Individual
Naqd|Наличные|Cash
Lizing|Лизинг|Leasing
Bo‘lib to‘lash|Рассрочка|Installments
Pul o‘tkazish|Банковский перевод|Bank transfer
Aniqlanmagan|Не определено|Undecided
Yuborilmagan|Не отправлено|Not sent
Yuborilgan|Отправлено|Sent
Tanlanmagan|Не выбрано|Not selected
Qimmat|Дорого|Too expensive
To‘g‘ri kelmadi|Не подошло|Not suitable
Faqat narx bilish uchun|Только узнать цену|Price inquiry only
Boshqa|Другое|Other
Telefon qo‘ng‘irog‘i|Телефонный звонок|Phone call
Veb-sayt|Сайт|Website
Tashrif|Визит|Visit
Tavsiya|Рекомендация|Referral
Hududlar kesimida|Распределение по регионам|Leads by region
Leadlar qayer hududlardan?|Из каких регионов приходят лиды?|Where do your leads come from?
Operatorlar natijasi|Результаты операторов|Team performance
Jamoa a’zolarining ko‘rsatkichlari|Показатели команды|Team metrics
Operator|Оператор|Operator
Jami lead|Всего лидов|Total leads
Faol|Активные|Active
Konversiya|Конверсия|Conversion
Sotuv summasi|Сумма продаж|Sales amount
Mahsulotga qiziqish|Интерес к товарам|Product interest
Qaysi mahsulotlarga qiziqish yuqori?|Какие товары интересуют клиентов?|Which products attract interest?
Hali mahsulot tanlanmagan.|Товары пока не выбраны.|No products selected yet.
CSV yuklash|Скачать CSV|Download CSV
Sotuv bo‘limi|Отдел продаж|Sales team
ISH MAYDONI|РАБОЧЕЕ ПРОСТРАНСТВО|WORKSPACE
Ish maydoni|Рабочее пространство|Workspace
MUHIM KO‘RSATKICHLAR|КЛЮЧЕВЫЕ ПОКАЗАТЕЛИ|KEY METRICS
Muvaffaqiyatli boshqaring, mijozlarni davom ettiring va sotuvga olib boring.|Управляйте лидами, развивайте отношения с клиентами и заключайте сделки.|Manage leads, follow up with customers and close deals.
Bildirishnomalar|Уведомления|Notifications
Chiqish|Выйти|Sign out
Yaqqol mijozlar bazasi|Клиентская база|Customer directory
Login|Логин|Username
Parol|Пароль|Password
Kirish|Войти|Sign in
Kirilmoqda...|Вход…|Signing in…
Ish maydoniga kirish|Вход в рабочее пространство|Sign in to your workspace
Operator hisobi orqali davom eting.|Войдите с учётной записью оператора.|Continue with your operator account.
Login yoki parol noto‘g‘ri|Неверный логин или пароль|Incorrect username or password
Qayta yuklash|Загрузить снова|Reload
Mahsulotlar yuklanmoqda...|Загрузка товаров…|Loading products…
O‘zgarishlar tarixi yuklanmoqda...|Загрузка истории…|Loading activity history…
O‘zgarishlar saqlanmoqda...|Сохранение изменений…|Saving changes…
Server bilan almashinuv davom etmoqda...|Обмен данными с сервером…|Communicating with the server…
Qaysi qiymat saqlansin?|Какое значение сохранить?|Which value should be saved?
Tanlanganlarni saqlash|Сохранить выбранное|Save selected values
Bo‘sh|Пусто|Empty
Tungi rejim|Тёмная тема|Dark mode
Kunduzgi rejim|Светлая тема|Light mode
Qidiruvni tozalash|Очистить поиск|Clear search
Barcha kategoriyalar|Все категории|All categories
Mavjud|В наличии|In stock
Buyurtma asosida|Под заказ|On order
Batafsil|Подробнее|Details
Texnik xususiyatlar|Технические характеристики|Specifications
Afzalliklar|Преимущества|Advantages
Narx so‘rov asosida|Цена по запросу|Price on request
Natija topilmadi|Ничего не найдено|No results found
Foydalanuvchi qo‘shish|Добавить пользователя|Add user
Ism|Имя|Name
Huquq|Роль|Role
Administrator|Администратор|Administrator
Yangi parol|Новый пароль|New password
Kamida 12 ta belgi|Не менее 12 символов|At least 12 characters
Parolni o‘zgartirmaslik uchun bo‘sh qoldiring|Оставьте пустым, чтобы сохранить пароль|Leave blank to keep the current password
Saqlandi|Сохранено|Saved
Admin boshqaruvi uchun yangilangan backendni joylang.|Для управления пользователями установите обновлённый backend.|Deploy the updated backend to manage users.
Katalogni yuklab bo‘lmadi|Не удалось загрузить каталог|Unable to load catalog
Yangi foydalanuvchi|Новый пользователь|New user
Tanlangan mahsulotlar|Выбранные товары|Selected products
Viloyat ustiga olib boring|Наведите курсор на регион|Hover over a region
Til|Язык|Language
Tanlangan davr bo‘yicha|За выбранный период|For the selected period
Javob qaytdi mijozlar|Клиенты на связи|Customers in contact
% umumiy konversiya|% общей конверсии|% overall conversion
UZS - umumiy kutilgan kasr|UZS — общий объём продаж|UZS — total sales revenue
ta lead|лидов|leads
Mijoz|Клиент|Customer
Telefon|Телефон|Phone
Hudud|Регион|Region
Mahsulotlar|Товары|Products
Mas’ul operator|Ответственный оператор|Assigned operator
Bosqich|Этап|Stage
Summa|Сумма|Amount
Sana|Дата|Date
Leadlar topilmadi.|Лиды не найдены.|No leads found.
Leadlarning joriy bosqichlari|Текущие этапы лидов|Current lead stages
Leadlar manbalari|Источники лидов|Lead sources
Mijozlar qayerdan kelmoqda?|Откуда приходят клиенты?|Where do customers come from?
Bu raqam bazada mavjud:|Этот номер уже есть в базе:|This phone number already exists:
Tizim sozlamalari|Настройки системы|System settings
Foydalanuvchi ma’lumotlari:|Данные пользователя:|User details:
Ism:|Имя:|Name:
Lavozim:|Роль:|Role:
Hozircha bildirishnomalar yo‘q.|Пока нет уведомлений.|No notifications yet.
Tushunarli|Понятно|Got it
SOTUV JAMOASI UCHUN|ДЛЯ ОТДЕЛА ПРОДАЖ|FOR SALES TEAMS
Muloqotdan|От общения|From conversation
natijagacha.|к результату.|to results.
Leadlar, mijozlar va jamoa natijalari.|Лиды, клиенты и результаты команды.|Leads, customers and team performance.
Hammasi bitta qulay ish maydonida.|Всё в одном удобном рабочем пространстве.|Everything in one convenient workspace.
XUSH KELIBSIZ|ДОБРО ПОЖАЛОВАТЬ|WELCOME
Operator hisobingiz orqali davom eting.|Войдите с учётной записью оператора.|Continue with your operator account.
Boshqa operator ham shu maydonlarni o‘zgartirgan. Qolgan o‘zgarishlar avtomatik birlashtiriladi.|Другой оператор изменил те же поля. Остальные изменения объединятся автоматически.|Another operator changed the same fields. Other changes will be merged automatically.
 Siz kiritgan: | Ваше значение: | Your value: 
 Serverdagi: | На сервере: | Server value: 
Toshkent shahri|Город Ташкент|Tashkent city
Toshkent viloyati|Ташкентская область|Tashkent region
Samarqand|Самарканд|Samarkand
Qashqadaryo|Кашкадарья|Kashkadarya
Surxondaryo|Сурхандарья|Surkhandarya
Buxoro|Бухара|Bukhara
Navoiy|Навои|Navoi
Jizzax|Джизак|Jizzakh
Sirdaryo|Сырдарья|Syrdarya
Farg‘ona|Фергана|Fergana
Andijon|Андижан|Andijan
Namangan|Наманган|Namangan
Xorazm|Хорезм|Khorezm
Qoraqalpog‘iston Respublikasi|Республика Каракалпакстан|Republic of Karakalpakstan
Boshqa hududlar|Другие регионы|Other regions
Masalan: Grand Logistics MChJ|Например: Grand Logistics|For example: Grand Logistics
Logistika, qurilish...|Логистика, строительство…|Logistics, construction…
Yangilanmoqda|Обновление|Refreshing
Qo‘shimcha|Дополнительно|More
Davr boshlanishi|Начало периода|Start date
Davr oxiri|Конец периода|End date
Murojaat manbasi|Источник обращения|Lead source
Rad etish sababi|Причина отказа|Loss reason
Sabab izohi|Комментарий к причине|Reason details
Manba izohi|Комментарий к источнику|Source details
Status|Статус|Status
Izoh|Комментарий|Notes
Keyingi aloqa|Следующий контакт|Next follow-up
Ism va familiya|Имя и фамилия|Full name
Korxona|Компания|Company
Faoliyat sohasi|Сфера деятельности|Industry
Shahar / tuman|Город / район|City / district
Mijoz turi|Тип клиента|Customer type
To‘lov turi|Способ оплаты|Payment method
Taklif|Предложение|Offer
Manba|Источник|Source`;
const extraRows=`Jamoa natijalarini va mijozlar oqimini bir joyda kuzating.|Отслеживайте результаты команды и поток клиентов в одном месте.|Track team performance and customer activity in one place.
Parolingizni kiriting|Введите пароль|Enter your password
Yakka tartibdagi mijoz|Частный клиент|Individual customer
Server bilan aloqa yo‘q|Нет связи с сервером|Unable to reach the server
So‘rov bajarilmadi|Запрос не выполнен|Request failed
Administrator huquqi talab qilinadi|Требуются права администратора|Administrator access is required
Bu login band|Этот логин уже занят|This username is already taken
O‘z administrator huquqingizni olib tashlay olmaysiz|Нельзя снять с себя права администратора|You cannot remove your own administrator role
Foydalanuvchi topilmadi|Пользователь не найден|User not found
Saqlash bekor qilindi. Kiritilgan ma’lumotlar oynada saqlanib turibdi.|Сохранение отменено. Введённые данные остались в форме.|Saving cancelled. Your changes remain in the form.`;
export const dictionary=Object.fromEntries((rows+'\n'+extraRows).split('\n').map(row=>{const [key,ru,en]=row.split('|');return [key,{ru,en}];}));
const refinedUz={
 'Faol manfaatdorlar':'Faol leadlar',
 'Yaqqol mijozlar bazasi':'Mijozlar bazasi',
 'UZS - umumiy kutilgan kasr':'UZS — jami savdo summasi',
 'Javob qaytdi mijozlar':'Aloqa o‘rnatilgan mijozlar',
 'Muvaffaqiyatli boshqaring, mijozlarni davom ettiring va sotuvga olib boring.':'Leadlarni boshqaring, mijozlar bilan aloqani davom ettiring va savdoni yakunlang.'
};
export function t(value){if(typeof value!=='string')return value;const row=dictionary[value];if(language==='uz')return refinedUz[value]||value;if(language==='cy')return cyrillic(refinedUz[value]||value);return row?.[language]||value;}
export function localized(item,key='title'){const suffix=language==='ru'?'Ru':language==='en'?'En':'Uz';const text=item?.[key+suffix]||item?.[key+'Uz']||item?.[key+'Ru']||item?.[key+'En']||item?.name||'';return language==='cy'?cyrillic(text):text;}
