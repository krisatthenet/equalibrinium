/**
 * Lithuanian educational institutions for the student promo.
 *
 * Grouped for an <optgroup>-style picker on the registration form. Institution
 * names are proper nouns (kept verbatim, not translated); only the group labels
 * here are Lithuanian, which suits a Lithuania-only promo. The trailing "Other"
 * option is rendered separately via i18n so it stays translatable.
 *
 * Not exhaustive — covers the major universities, colleges and vocational
 * centres plus a generic gymnasium entry for 11–12 grade pupils. Extend freely.
 */
export const LT_INSTITUTION_GROUPS = [
  {
    label: 'Universitetai',
    options: [
      'Vilniaus universitetas (VU)',
      'Kauno technologijos universitetas (KTU)',
      'Vilnius Tech (VILNIUS TECH / VGTU)',
      'Vytauto Didžiojo universitetas (VDU)',
      'Lietuvos sveikatos mokslų universitetas (LSMU)',
      'Mykolo Romerio universitetas (MRU)',
      'Klaipėdos universitetas (KU)',
      'Vilniaus dailės akademija (VDA)',
      'Lietuvos muzikos ir teatro akademija (LMTA)',
      'ISM Vadybos ir ekonomikos universitetas (ISM)',
      'Lietuvos sporto universitetas (LSU)',
      'Generolo Jono Žemaičio Lietuvos karo akademija (LKA)',
    ],
  },
  {
    label: 'Kolegijos',
    options: [
      'Vilniaus kolegija (VIKO)',
      'Kauno kolegija (KK)',
      'Klaipėdos valstybinė kolegija (KVK)',
      'Šiaulių valstybinė kolegija (ŠVK)',
      'Vilniaus technologijų ir dizaino kolegija (VTDK)',
      'Socialinių mokslų kolegija (SMK)',
      'Lietuvos verslo kolegija (LTVK)',
      'Utenos kolegija',
      'Alytaus kolegija',
      'Marijampolės kolegija',
      'Panevėžio kolegija',
      'Kolping kolegija',
    ],
  },
  {
    label: 'Profesinio mokymo centrai',
    options: [
      'Vilniaus technologijų ir verslo profesinio mokymo centras (VTVPMC)',
      'Vilniaus paslaugų verslo profesinio mokymo centras',
      'Vilniaus automechanikos ir verslo mokykla',
      'Vilniaus statybininkų rengimo centras',
      'Kauno technikos profesinio mokymo centras',
      'Kauno statybos ir paslaugų mokymo centras',
    ],
  },
  {
    label: 'Gimnazijos / mokyklos (11–12 kl.)',
    options: [
      'Gimnazija / vidurinė mokykla (11–12 kl.)',
    ],
  },
];
