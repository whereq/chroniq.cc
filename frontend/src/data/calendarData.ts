import type { Holiday, CalEvent, Birthday } from '../types';

export const HOLIDAYS: Holiday[] = [
  // US Holidays 2026
  { date: '2026-01-01', region: 'US', name: { en: "New Year's Day", zh: '元旦', ja: '元日', ko: '새해', de: 'Neujahr', es: 'Año Nuevo', it: 'Capodanno', fr: 'Jour de l\'An' } },
  { date: '2026-01-19', region: 'US', name: { en: 'MLK Day', zh: '马丁·路德·金纪念日', ja: 'キング牧師の日', ko: 'MLK의 날', de: 'MLK-Tag', es: 'Día de MLK', it: 'Giorno MLK', fr: 'Jour MLK' } },
  { date: '2026-02-16', region: 'US', name: { en: "Presidents' Day", zh: '总统日', ja: '大統領の日', ko: '대통령의 날', de: 'Präsidententag', es: 'Día del Presidente', it: 'Giorno del Presidente', fr: 'Jour du Président' } },
  { date: '2026-05-25', region: 'US', name: { en: 'Memorial Day', zh: '阵亡将士纪念日', ja: '戦没者追悼記念日', ko: '현충일', de: 'Gedenktag', es: 'Día de los Caídos', it: 'Giorno del Ricordo', fr: 'Jour du Souvenir' } },
  { date: '2026-07-04', region: 'US', name: { en: 'Independence Day', zh: '独立日', ja: '独立記念日', ko: '독립기념일', de: 'Unabhängigkeitstag', es: 'Día de la Independencia', it: 'Giorno dell\'Indipendenza', fr: 'Fête de l\'Indépendance' } },
  { date: '2026-09-07', region: 'US', name: { en: 'Labor Day', zh: '劳动节', ja: '労働の日', ko: '노동절', de: 'Tag der Arbeit', es: 'Día del Trabajo', it: 'Festa del Lavoro', fr: 'Fête du Travail' } },
  { date: '2026-11-26', region: 'US', name: { en: 'Thanksgiving', zh: '感恩节', ja: '感謝祭', ko: '추수감사절', de: 'Erntedankfest', es: 'Acción de Gracias', it: 'Ringraziamento', fr: 'Action de Grâce' } },
  { date: '2026-12-25', region: 'US', name: { en: 'Christmas', zh: '圣诞节', ja: 'クリスマス', ko: '크리스마스', de: 'Weihnachten', es: 'Navidad', it: 'Natale', fr: 'Noël' } },
  { date: '2026-11-11', region: 'US', name: { en: 'Veterans Day', zh: '退伍军人节', ja: '退役軍人の日', ko: '재향군인의 날', de: 'Veteranentag', es: 'Día de los Veteranos', it: 'Giorno dei Veterani', fr: 'Jour des Vétérans' } },

  // CN Holidays 2026
  { date: '2026-01-01', region: 'CN', name: { en: "New Year's Day", zh: '元旦', ja: '元日', ko: '새해', de: 'Neujahr', es: 'Año Nuevo', it: 'Capodanno', fr: 'Jour de l\'An' } },
  { date: '2026-02-17', region: 'CN', name: { en: 'Spring Festival (CNY)', zh: '春节', ja: '春節', ko: '춘절', de: 'Frühlingsfest', es: 'Festival de Primavera', it: 'Festa di Primavera', fr: 'Fête du Printemps' } },
  { date: '2026-02-18', region: 'CN', name: { en: 'Spring Festival Holiday', zh: '春节假期', ja: '春節休暇', ko: '춘절 연휴', de: 'Frühlingsfest-Urlaub', es: 'Vacaciones de Primavera', it: 'Vacanze di Primavera', fr: 'Vacances du Printemps' } },
  { date: '2026-02-19', region: 'CN', name: { en: 'Spring Festival Holiday', zh: '春节假期', ja: '春節休暇', ko: '춘절 연휴', de: 'Frühlingsfest-Urlaub', es: 'Vacaciones de Primavera', it: 'Vacanze di Primavera', fr: 'Vacances du Printemps' } },
  { date: '2026-04-04', region: 'CN', name: { en: 'Qingming Festival', zh: '清明节', ja: '清明節', ko: '청명절', de: 'Qingming-Fest', es: 'Festival Qingming', it: 'Festival Qingming', fr: 'Fête Qingming' } },
  { date: '2026-05-01', region: 'CN', name: { en: 'Labour Day', zh: '劳动节', ja: '労働の日', ko: '노동절', de: 'Tag der Arbeit', es: 'Día del Trabajo', it: 'Festa del Lavoro', fr: 'Fête du Travail' } },
  { date: '2026-06-19', region: 'CN', name: { en: 'Dragon Boat Festival', zh: '端午节', ja: '端午の節句', ko: '단오절', de: 'Drachenfest', es: 'Festival del Dragón', it: 'Festival del Drago', fr: 'Fête des Bateaux-Dragons' } },
  { date: '2026-10-01', region: 'CN', name: { en: 'National Day', zh: '国庆节', ja: '国慶節', ko: '국경절', de: 'Nationalfeiertag', es: 'Día Nacional', it: 'Festa Nazionale', fr: 'Fête Nationale' } },

  // FR Holidays 2026
  { date: '2026-01-01', region: 'FR', name: { en: "New Year's Day", zh: '元旦', ja: '元日', ko: '새해', de: 'Neujahr', es: 'Año Nuevo', it: 'Capodanno', fr: 'Jour de l\'An' } },
  { date: '2026-04-06', region: 'FR', name: { en: 'Easter Monday', zh: '复活节星期一', ja: 'イースターマンデー', ko: '부활절 월요일', de: 'Ostermontag', es: 'Lunes de Pascua', it: 'Lunedì di Pasqua', fr: 'Lundi de Pâques' } },
  { date: '2026-05-01', region: 'FR', name: { en: 'Labour Day', zh: '劳动节', ja: '労働の日', ko: '노동절', de: 'Tag der Arbeit', es: 'Día del Trabajo', it: 'Festa del Lavoro', fr: 'Fête du Travail' } },
  { date: '2026-05-08', region: 'FR', name: { en: 'Victory in Europe Day', zh: '欧战胜利纪念日', ja: '戦勝記念日', ko: '유럽 전승기념일', de: 'Tag des Kriegsendes', es: 'Día de la Victoria', it: 'Giorno della Vittoria', fr: 'Victoire 1945' } },
  { date: '2026-05-14', region: 'FR', name: { en: 'Ascension Day', zh: '耶稣升天节', ja: '昇天祭', ko: '승천절', de: 'Christi Himmelfahrt', es: 'Ascensión', it: 'Ascensione', fr: 'Ascension' } },
  { date: '2026-05-25', region: 'FR', name: { en: 'Whit Monday', zh: '圣灵降临节星期一', ja: '聖霊降臨祭月曜日', ko: '성령강림절 월요일', de: 'Pfingstmontag', es: 'Lunes de Pentecostés', it: 'Lunedì di Pentecoste', fr: 'Lundi de Pentecôte' } },
  { date: '2026-07-14', region: 'FR', name: { en: 'Bastille Day', zh: '法国国庆日', ja: 'パリ祭', ko: '프랑스 국경일', de: 'Nationalfeiertag', es: 'Día Nacional Francés', it: 'Festa Nazionale Francese', fr: 'Fête Nationale' } },
  { date: '2026-08-15', region: 'FR', name: { en: 'Assumption of Mary', zh: '圣母升天节', ja: '聖母被昇天', ko: '성모 승천일', de: 'Mariä Himmelfahrt', es: 'Asunción de María', it: 'Ferragosto', fr: 'Assomption' } },
  { date: '2026-11-01', region: 'FR', name: { en: "All Saints' Day", zh: '万圣节', ja: '諸聖人の日', ko: '만성절', de: 'Allerheiligen', es: 'Día de Todos los Santos', it: 'Ognissanti', fr: 'Toussaint' } },
  { date: '2026-11-11', region: 'FR', name: { en: 'Armistice Day', zh: '停战纪念日', ja: '休戦記念日', ko: '휴전기념일', de: 'Waffenstillstand', es: 'Día del Armisticio', it: 'Giorno dell\'Armistizio', fr: 'Armistice' } },
  { date: '2026-12-25', region: 'FR', name: { en: 'Christmas', zh: '圣诞节', ja: 'クリスマス', ko: '크리스마스', de: 'Weihnachten', es: 'Navidad', it: 'Natale', fr: 'Noël' } },

  // JP Holidays 2026
  { date: '2026-01-01', region: 'JP', name: { en: "New Year's Day", zh: '元旦', ja: '元日', ko: '새해', de: 'Neujahr', es: 'Año Nuevo', it: 'Capodanno', fr: 'Jour de l\'An' } },
  { date: '2026-01-12', region: 'JP', name: { en: 'Coming of Age Day', zh: '成人节', ja: '成人の日', ko: '성인의 날', de: 'Tag der Volljährigkeit', es: 'Día de la Mayoría de Edad', it: 'Giorno della Maggiore Età', fr: 'Fête de la Majorité' } },
  { date: '2026-02-11', region: 'JP', name: { en: 'National Foundation Day', zh: '建国纪念日', ja: '建国記念の日', ko: '건국기념일', de: 'Nationalfeiertag', es: 'Día de la Fundación Nacional', it: 'Giorno della Fondazione', fr: 'Fête Nationale' } },
  { date: '2026-02-23', region: 'JP', name: { en: "Emperor's Birthday", zh: '天皇诞辰', ja: '天皇誕生日', ko: '천황 탄생일', de: 'Geburtstag des Kaisers', es: 'Cumpleaños del Emperador', it: 'Compleanno dell\'Imperatore', fr: 'Anniversaire de l\'Empereur' } },
  { date: '2026-03-20', region: 'JP', name: { en: 'Vernal Equinox Day', zh: '春分节', ja: '春分の日', ko: '춘분', de: 'Frühlingsäquinoktium', es: 'Equinoccio de Primavera', it: 'Equinozio di Primavera', fr: 'Équinoxe de Printemps' } },
  { date: '2026-04-29', region: 'JP', name: { en: 'Showa Day', zh: '昭和日', ja: '昭和の日', ko: '쇼와의 날', de: 'Showa-Tag', es: 'Día de Showa', it: 'Giorno Showa', fr: 'Jour Showa' } },
  { date: '2026-05-03', region: 'JP', name: { en: 'Constitution Day', zh: '宪法节', ja: '憲法記念日', ko: '헌법기념일', de: 'Verfassungstag', es: 'Día de la Constitución', it: 'Giorno della Costituzione', fr: 'Fête de la Constitution' } },
  { date: '2026-05-04', region: 'JP', name: { en: 'Greenery Day', zh: '绿之日', ja: 'みどりの日', ko: '녹색의 날', de: 'Tag des Grünen', es: 'Día Verde', it: 'Giorno Verde', fr: 'Jour Vert' } },
  { date: '2026-05-05', region: 'JP', name: { en: "Children's Day", zh: '儿童节', ja: 'こどもの日', ko: '어린이날', de: 'Kindertag', es: 'Día del Niño', it: 'Giorno dei Bambini', fr: 'Fête des Enfants' } },
  { date: '2026-07-20', region: 'JP', name: { en: 'Marine Day', zh: '海洋日', ja: '海の日', ko: '해양의 날', de: 'Tag des Meeres', es: 'Día del Mar', it: 'Giorno del Mare', fr: 'Fête de la Mer' } },
  { date: '2026-08-11', region: 'JP', name: { en: 'Mountain Day', zh: '山之日', ja: '山の日', ko: '산의 날', de: 'Tag des Berges', es: 'Día de la Montaña', it: 'Giorno della Montagna', fr: 'Fête de la Montagne' } },
  { date: '2026-09-21', region: 'JP', name: { en: 'Respect for the Aged Day', zh: '敬老日', ja: '敬老の日', ko: '경로의 날', de: 'Ältestentag', es: 'Día de los Mayores', it: 'Giorno degli Anziani', fr: 'Fête des Aînés' } },
  { date: '2026-10-12', region: 'JP', name: { en: 'Sports Day', zh: '体育日', ja: 'スポーツの日', ko: '체육의 날', de: 'Sporttag', es: 'Día del Deporte', it: 'Giorno dello Sport', fr: 'Fête du Sport' } },
  { date: '2026-11-03', region: 'JP', name: { en: 'Culture Day', zh: '文化日', ja: '文化の日', ko: '문화의 날', de: 'Kulturtag', es: 'Día de la Cultura', it: 'Giorno della Cultura', fr: 'Fête de la Culture' } },
  { date: '2026-11-23', region: 'JP', name: { en: 'Labour Thanksgiving Day', zh: '劳动感恩节', ja: '勤労感謝の日', ko: '근로감사절', de: 'Arbeitstag', es: 'Día de Acción de Gracias', it: 'Giorno del Ringraziamento', fr: 'Fête du Travail' } },
  { date: '2026-12-25', region: 'JP', name: { en: 'Christmas', zh: '圣诞节', ja: 'クリスマス', ko: '크리스마스', de: 'Weihnachten', es: 'Navidad', it: 'Natale', fr: 'Noël' } },

  // KR Holidays 2026
  { date: '2026-01-01', region: 'KR', name: { en: "New Year's Day", zh: '元旦', ja: '元日', ko: '새해', de: 'Neujahr', es: 'Año Nuevo', it: 'Capodanno', fr: 'Jour de l\'An' } },
  { date: '2026-02-17', region: 'KR', name: { en: 'Lunar New Year', zh: '农历新年', ja: '旧正月', ko: '설날', de: 'Mondneujahr', es: 'Año Nuevo Lunar', it: 'Capodanno Lunare', fr: 'Nouvel An Lunaire' } },
  { date: '2026-03-01', region: 'KR', name: { en: 'Independence Movement Day', zh: '三一运动纪念日', ja: '三一独立運動記念日', ko: '삼일절', de: 'Unabhängigkeitstag', es: 'Día del Movimiento Independentista', it: 'Giorno dell\'Indipendenza', fr: 'Jour du Mouvement pour l\'Indépendance' } },
  { date: '2026-04-05', region: 'KR', name: { en: 'Arbor Day', zh: '植树节', ja: '植樹記念日', ko: '식목일', de: 'Baumpflanztag', es: 'Día del Árbol', it: 'Giorno dell\'Albero', fr: 'Fête de l\'Arbre' } },
  { date: '2026-05-05', region: 'KR', name: { en: "Children's Day", zh: '儿童节', ja: 'こどもの日', ko: '어린이날', de: 'Kindertag', es: 'Día del Niño', it: 'Giorno dei Bambini', fr: 'Fête des Enfants' } },
  { date: '2026-05-24', region: 'KR', name: { en: "Buddha's Birthday", zh: '佛诞节', ja: '仏陀の誕生日', ko: '부처님오신날', de: 'Buddhas Geburtstag', es: 'Cumpleaños de Buda', it: 'Compleanno di Buddha', fr: 'Anniversaire de Bouddha' } },
  { date: '2026-06-06', region: 'KR', name: { en: 'Memorial Day', zh: '显忠日', ja: '顕忠日', ko: '현충일', de: 'Gedenktag', es: 'Día del Recuerdo', it: 'Giorno del Ricordo', fr: 'Jour du Souvenir' } },
  { date: '2026-08-15', region: 'KR', name: { en: 'Liberation Day', zh: '光复节', ja: '光復節', ko: '광복절', de: 'Befreiungstag', es: 'Día de la Liberación', it: 'Giorno della Liberazione', fr: 'Jour de la Libération' } },
  { date: '2026-09-29', region: 'KR', name: { en: 'Chuseok', zh: '秋夕', ja: '秋夕', ko: '추석', de: 'Chuseok', es: 'Chuseok', it: 'Chuseok', fr: 'Chuseok' } },
  { date: '2026-10-03', region: 'KR', name: { en: 'National Foundation Day', zh: '开天节', ja: '開天節', ko: '개천절', de: 'Nationalfeiertag', es: 'Día de la Fundación Nacional', it: 'Giorno della Fondazione', fr: 'Fête Nationale' } },
  { date: '2026-10-09', region: 'KR', name: { en: 'Hangul Day', zh: '韩文日', ja: 'ハングルの日', ko: '한글날', de: 'Hangul-Tag', es: 'Día del Hangul', it: 'Giorno dell\'Hangul', fr: 'Fête du Hangul' } },
  { date: '2026-12-25', region: 'KR', name: { en: 'Christmas', zh: '圣诞节', ja: 'クリスマス', ko: '크리스마스', de: 'Weihnachten', es: 'Navidad', it: 'Natale', fr: 'Noël' } },

  // DE Holidays 2026
  { date: '2026-01-01', region: 'DE', name: { en: "New Year's Day", zh: '元旦', ja: '元日', ko: '새해', de: 'Neujahr', es: 'Año Nuevo', it: 'Capodanno', fr: 'Jour de l\'An' } },
  { date: '2026-04-03', region: 'DE', name: { en: 'Good Friday', zh: '耶稣受难日', ja: '聖金曜日', ko: '성 금요일', de: 'Karfreitag', es: 'Viernes Santo', it: 'Venerdì Santo', fr: 'Vendredi Saint' } },
  { date: '2026-04-06', region: 'DE', name: { en: 'Easter Monday', zh: '复活节星期一', ja: 'イースターマンデー', ko: '부활절 월요일', de: 'Ostermontag', es: 'Lunes de Pascua', it: 'Lunedì di Pasqua', fr: 'Lundi de Pâques' } },
  { date: '2026-05-01', region: 'DE', name: { en: 'Labour Day', zh: '劳动节', ja: '労働の日', ko: '노동절', de: 'Tag der Arbeit', es: 'Día del Trabajo', it: 'Festa del Lavoro', fr: 'Fête du Travail' } },
  { date: '2026-05-14', region: 'DE', name: { en: 'Ascension Day', zh: '耶稣升天节', ja: '昇天祭', ko: '승천절', de: 'Christi Himmelfahrt', es: 'Ascensión', it: 'Ascensione', fr: 'Ascension' } },
  { date: '2026-05-25', region: 'DE', name: { en: 'Whit Monday', zh: '圣灵降临节星期一', ja: '聖霊降臨祭月曜日', ko: '성령강림절 월요일', de: 'Pfingstmontag', es: 'Lunes de Pentecostés', it: 'Lunedì di Pentecoste', fr: 'Lundi de Pentecôte' } },
  { date: '2026-10-03', region: 'DE', name: { en: 'German Unity Day', zh: '德国统一日', ja: 'ドイツ統一記念日', ko: '독일 통일의 날', de: 'Tag der Deutschen Einheit', es: 'Día de la Unidad Alemana', it: 'Giorno dell\'Unità Tedesca', fr: 'Jour de l\'Unité Allemande' } },
  { date: '2026-12-25', region: 'DE', name: { en: 'Christmas Day', zh: '圣诞节', ja: 'クリスマス', ko: '크리스마스', de: '1. Weihnachtstag', es: 'Navidad', it: 'Natale', fr: 'Noël' } },
  { date: '2026-12-26', region: 'DE', name: { en: 'Boxing Day', zh: '节礼日', ja: 'ボクシングデー', ko: '박싱데이', de: '2. Weihnachtstag', es: 'Día de San Esteban', it: 'Santo Stefano', fr: 'Lendemain de Noël' } },

  // ES Holidays 2026
  { date: '2026-01-01', region: 'ES', name: { en: "New Year's Day", zh: '元旦', ja: '元日', ko: '새해', de: 'Neujahr', es: 'Año Nuevo', it: 'Capodanno', fr: 'Jour de l\'An' } },
  { date: '2026-01-06', region: 'ES', name: { en: 'Epiphany', zh: '主显节', ja: '公現祭', ko: '주현절', de: 'Heilige Drei Könige', es: 'Reyes Magos', it: 'Epifania', fr: 'Épiphanie' } },
  { date: '2026-04-03', region: 'ES', name: { en: 'Good Friday', zh: '耶稣受难日', ja: '聖金曜日', ko: '성 금요일', de: 'Karfreitag', es: 'Viernes Santo', it: 'Venerdì Santo', fr: 'Vendredi Saint' } },
  { date: '2026-05-01', region: 'ES', name: { en: 'Labour Day', zh: '劳动节', ja: '労働の日', ko: '노동절', de: 'Tag der Arbeit', es: 'Día del Trabajo', it: 'Festa del Lavoro', fr: 'Fête du Travail' } },
  { date: '2026-08-15', region: 'ES', name: { en: 'Assumption of Mary', zh: '圣母升天节', ja: '聖母被昇天', ko: '성모 승천일', de: 'Mariä Himmelfahrt', es: 'Asunción de la Virgen', it: 'Ferragosto', fr: 'Assomption' } },
  { date: '2026-10-12', region: 'ES', name: { en: 'National Day of Spain', zh: '西班牙国庆日', ja: 'スペインの日', ko: '스페인 국경일', de: 'Spanischer Nationalfeiertag', es: 'Fiesta Nacional de España', it: 'Festa Nazionale Spagnola', fr: 'Fête Nationale Espagnole' } },
  { date: '2026-11-01', region: 'ES', name: { en: "All Saints' Day", zh: '万圣节', ja: '諸聖人の日', ko: '만성절', de: 'Allerheiligen', es: 'Día de Todos los Santos', it: 'Ognissanti', fr: 'Toussaint' } },
  { date: '2026-12-06', region: 'ES', name: { en: 'Constitution Day', zh: '宪法日', ja: '憲法の日', ko: '헌법의 날', de: 'Verfassungstag', es: 'Día de la Constitución', it: 'Giorno della Costituzione', fr: 'Fête de la Constitution' } },
  { date: '2026-12-25', region: 'ES', name: { en: 'Christmas', zh: '圣诞节', ja: 'クリスマス', ko: '크리스마스', de: 'Weihnachten', es: 'Navidad', it: 'Natale', fr: 'Noël' } },

  // IT Holidays 2026
  { date: '2026-01-01', region: 'IT', name: { en: "New Year's Day", zh: '元旦', ja: '元日', ko: '새해', de: 'Neujahr', es: 'Año Nuevo', it: 'Capodanno', fr: 'Jour de l\'An' } },
  { date: '2026-01-06', region: 'IT', name: { en: 'Epiphany', zh: '主显节', ja: '公現祭', ko: '주현절', de: 'Heilige Drei Könige', es: 'Reyes Magos', it: 'Epifania', fr: 'Épiphanie' } },
  { date: '2026-04-05', region: 'IT', name: { en: 'Easter Sunday', zh: '复活节', ja: 'イースター', ko: '부활절', de: 'Ostersonntag', es: 'Domingo de Pascua', it: 'Pasqua', fr: 'Pâques' } },
  { date: '2026-04-06', region: 'IT', name: { en: 'Easter Monday', zh: '复活节星期一', ja: 'イースターマンデー', ko: '부활절 월요일', de: 'Ostermontag', es: 'Lunes de Pascua', it: 'Lunedì dell\'Angelo', fr: 'Lundi de Pâques' } },
  { date: '2026-04-25', region: 'IT', name: { en: 'Liberation Day', zh: '解放日', ja: '解放記念日', ko: '해방의 날', de: 'Befreiungstag', es: 'Día de la Liberación', it: 'Festa della Liberazione', fr: 'Jour de la Libération' } },
  { date: '2026-05-01', region: 'IT', name: { en: 'Labour Day', zh: '劳动节', ja: '労働の日', ko: '노동절', de: 'Tag der Arbeit', es: 'Día del Trabajo', it: 'Festa del Lavoro', fr: 'Fête du Travail' } },
  { date: '2026-06-02', region: 'IT', name: { en: 'Republic Day', zh: '共和国日', ja: '共和国記念日', ko: '공화국의 날', de: 'Republikstag', es: 'Día de la República', it: 'Festa della Repubblica', fr: 'Fête de la République' } },
  { date: '2026-08-15', region: 'IT', name: { en: 'Ferragosto', zh: '圣母升天节', ja: 'フェラゴスト', ko: '성모 승천일', de: 'Mariä Himmelfahrt', es: 'Ferragosto', it: 'Ferragosto', fr: 'Ferragosto' } },
  { date: '2026-11-01', region: 'IT', name: { en: "All Saints' Day", zh: '万圣节', ja: '諸聖人の日', ko: '만성절', de: 'Allerheiligen', es: 'Día de Todos los Santos', it: 'Ognissanti', fr: 'Toussaint' } },
  { date: '2026-12-08', region: 'IT', name: { en: 'Immaculate Conception', zh: '圣母无原罪始胎节', ja: '無原罪の御宿り', ko: '원죄없는 잉태 대축일', de: 'Mariä Empfängnis', es: 'Inmaculada Concepción', it: 'Immacolata Concezione', fr: 'Immaculée Conception' } },
  { date: '2026-12-25', region: 'IT', name: { en: 'Christmas Day', zh: '圣诞节', ja: 'クリスマス', ko: '크리스마스', de: 'Weihnachten', es: 'Navidad', it: 'Natale', fr: 'Noël' } },
  { date: '2026-12-26', region: 'IT', name: { en: "St Stephen's Day", zh: '圣斯蒂芬节', ja: '聖ステファノの日', ko: '성 스데반의 날', de: 'Stephanstag', es: 'San Esteban', it: 'Santo Stefano', fr: 'Saint-Étienne' } },

  // GB Holidays 2026
  { date: '2026-01-01', region: 'GB', name: { en: "New Year's Day", zh: '元旦', ja: '元日', ko: '새해', de: 'Neujahr', es: 'Año Nuevo', it: 'Capodanno', fr: 'Jour de l\'An' } },
  { date: '2026-04-03', region: 'GB', name: { en: 'Good Friday', zh: '耶稣受难日', ja: '聖金曜日', ko: '성 금요일', de: 'Karfreitag', es: 'Viernes Santo', it: 'Venerdì Santo', fr: 'Vendredi Saint' } },
  { date: '2026-04-06', region: 'GB', name: { en: 'Easter Monday', zh: '复活节星期一', ja: 'イースターマンデー', ko: '부활절 월요일', de: 'Ostermontag', es: 'Lunes de Pascua', it: 'Lunedì di Pasqua', fr: 'Lundi de Pâques' } },
  { date: '2026-05-04', region: 'GB', name: { en: 'Early May Bank Holiday', zh: '五月银行假日', ja: '5月の銀行休日', ko: '5월 은행 공휴일', de: 'Bankfeiertag Mai', es: 'Festivo de Mayo', it: 'Festività di Maggio', fr: 'Jour Férié Mai' } },
  { date: '2026-05-25', region: 'GB', name: { en: 'Spring Bank Holiday', zh: '春季银行假日', ja: '春の銀行休日', ko: '봄 은행 공휴일', de: 'Frühjahrs-Bankfeiertag', es: 'Festivo de Primavera', it: 'Festività di Primavera', fr: 'Congé de Printemps' } },
  { date: '2026-08-31', region: 'GB', name: { en: 'Summer Bank Holiday', zh: '夏季银行假日', ja: '夏の銀行休日', ko: '여름 은행 공휴일', de: 'Sommer-Bankfeiertag', es: 'Festivo de Verano', it: 'Festività Estiva', fr: 'Congé d\'Été' } },
  { date: '2026-12-25', region: 'GB', name: { en: 'Christmas Day', zh: '圣诞节', ja: 'クリスマス', ko: '크리스마스', de: 'Weihnachten', es: 'Navidad', it: 'Natale', fr: 'Noël' } },
  { date: '2026-12-26', region: 'GB', name: { en: 'Boxing Day', zh: '节礼日', ja: 'ボクシングデー', ko: '박싱데이', de: '2. Weihnachtstag', es: 'Día de San Esteban', it: 'Santo Stefano', fr: 'Lendemain de Noël' } },

  // CA Holidays 2026
  { date: '2026-01-01', region: 'CA', name: { en: "New Year's Day", zh: '元旦', ja: '元日', ko: '새해', de: 'Neujahr', es: 'Año Nuevo', it: 'Capodanno', fr: 'Jour de l\'An' } },
  { date: '2026-04-03', region: 'CA', name: { en: 'Good Friday', zh: '耶稣受难日', ja: '聖金曜日', ko: '성 금요일', de: 'Karfreitag', es: 'Viernes Santo', it: 'Venerdì Santo', fr: 'Vendredi Saint' } },
  { date: '2026-05-18', region: 'CA', name: { en: 'Victoria Day', zh: '维多利亚日', ja: 'ビクトリアデー', ko: '빅토리아 기념일', de: 'Victoriatag', es: 'Día de la Victoria', it: 'Giorno di Vittoria', fr: 'Fête de la Reine' } },
  { date: '2026-07-01', region: 'CA', name: { en: 'Canada Day', zh: '加拿大日', ja: 'カナダの日', ko: '캐나다의 날', de: 'Kanada-Tag', es: 'Día de Canadá', it: 'Giorno del Canada', fr: 'Fête du Canada' } },
  { date: '2026-09-07', region: 'CA', name: { en: 'Labour Day', zh: '劳动节', ja: '労働の日', ko: '노동절', de: 'Tag der Arbeit', es: 'Día del Trabajo', it: 'Festa del Lavoro', fr: 'Fête du Travail' } },
  { date: '2026-10-12', region: 'CA', name: { en: 'Thanksgiving', zh: '感恩节', ja: '感謝祭', ko: '추수감사절', de: 'Erntedankfest', es: 'Día de Acción de Gracias', it: 'Ringraziamento', fr: 'Action de Grâce' } },
  { date: '2026-12-25', region: 'CA', name: { en: 'Christmas Day', zh: '圣诞节', ja: 'クリスマス', ko: '크리스마스', de: 'Weihnachten', es: 'Navidad', it: 'Natale', fr: 'Noël' } },

  // AU Holidays 2026
  { date: '2026-01-01', region: 'AU', name: { en: "New Year's Day", zh: '元旦', ja: '元日', ko: '새해', de: 'Neujahr', es: 'Año Nuevo', it: 'Capodanno', fr: 'Jour de l\'An' } },
  { date: '2026-01-26', region: 'AU', name: { en: 'Australia Day', zh: '澳大利亚日', ja: 'オーストラリアの日', ko: '호주의 날', de: 'Australientag', es: 'Día de Australia', it: 'Giorno dell\'Australia', fr: 'Fête de l\'Australie' } },
  { date: '2026-04-03', region: 'AU', name: { en: 'Good Friday', zh: '耶稣受难日', ja: '聖金曜日', ko: '성 금요일', de: 'Karfreitag', es: 'Viernes Santo', it: 'Venerdì Santo', fr: 'Vendredi Saint' } },
  { date: '2026-04-25', region: 'AU', name: { en: 'ANZAC Day', zh: '澳新军团日', ja: 'アンザックデー', ko: '안작의 날', de: 'ANZAC-Tag', es: 'Día ANZAC', it: 'Giorno ANZAC', fr: 'Jour de l\'ANZAC' } },
  { date: '2026-12-25', region: 'AU', name: { en: 'Christmas Day', zh: '圣诞节', ja: 'クリスマス', ko: '크리스마스', de: 'Weihnachten', es: 'Navidad', it: 'Natale', fr: 'Noël' } },
  { date: '2026-12-26', region: 'AU', name: { en: 'Boxing Day', zh: '节礼日', ja: 'ボクシングデー', ko: '박싱데이', de: '2. Weihnachtstag', es: 'Día de San Esteban', it: 'Santo Stefano', fr: 'Lendemain de Noël' } },

  // Global / International Days
  { date: '2026-03-08', region: 'global', name: { en: "International Women's Day", zh: '国际妇女节', ja: '国際女性デー', ko: '세계 여성의 날', de: 'Weltfrauentag', es: 'Día Internacional de la Mujer', it: 'Giornata Internazionale della Donna', fr: 'Journée Internationale des Femmes' } },
  { date: '2026-04-22', region: 'global', name: { en: 'Earth Day', zh: '地球日', ja: 'アースデー', ko: '지구의 날', de: 'Erdtag', es: 'Día de la Tierra', it: 'Giornata della Terra', fr: 'Jour de la Terre' } },
  { date: '2026-06-21', region: 'global', name: { en: 'World Music Day', zh: '世界音乐日', ja: '世界音楽デー', ko: '세계 음악의 날', de: 'Weltmusiktag', es: 'Día Mundial de la Música', it: 'Giornata Mondiale della Musica', fr: 'Fête de la Musique' } },
  { date: '2026-10-31', region: 'global', name: { en: 'Halloween', zh: '万圣节前夕', ja: 'ハロウィン', ko: '할로윈', de: 'Halloween', es: 'Halloween', it: 'Halloween', fr: 'Halloween' } },
  { date: '2026-12-31', region: 'global', name: { en: "New Year's Eve", zh: '跨年夜', ja: '大晦日', ko: '새해 전날', de: 'Silvester', es: 'Nochevieja', it: 'Capodanno', fr: 'Saint-Sylvestre' } },
  { date: '2026-02-14', region: 'global', name: { en: "Valentine's Day", zh: '情人节', ja: 'バレンタインデー', ko: '발렌타인데이', de: 'Valentinstag', es: 'Día de San Valentín', it: 'San Valentino', fr: 'Saint-Valentin' } },
  { date: '2026-04-01', region: 'global', name: { en: "April Fools' Day", zh: '愚人节', ja: 'エイプリルフール', ko: '만우절', de: 'Aprilscherz', es: 'Día de los Inocentes', it: 'Pesce d\'Aprile', fr: 'Poisson d\'Avril' } },
];

// Real meetings come from the signed-in user's /me/bookings (see
// useLoadBookings + calendarStore.bookings). These sample arrays are
// intentionally empty so the calendar never shows fabricated data.
export const EVENTS: CalEvent[] = [];

export const BIRTHDAYS: Birthday[] = [];
