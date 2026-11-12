export type TeamType = 'townsfolk' | 'outsider' | 'minion' | 'demon';
export type ExtendedTeamType = TeamType | 'traveller';

export interface RoleDefinition {
  id: string;
  artId: string;
  name: string;
  indonesianName: string;
  team: ExtendedTeamType;
  ability: string;
  abilityEn: string;
  firstNightOrder: number | null;
  otherNightOrder: number | null;
  firstNightInstruction?: string;
  otherNightInstruction?: string;
  storytellerNote: string;
  reminderIds: string[];
  setupModifier?: boolean;
  reminderCountBadge?: number;
}

export interface ReminderDefinition {
  id: string;
  label: string;
  indonesianLabel: string;
  roleId: string;
  team: 'good' | 'evil' | 'neutral';
  description: string;
  global?: boolean;
}

export interface CharacterCountRow {
  players: number;
  townsfolk: number;
  outsiders: number;
  minions: number;
  demons: number;
}

export const CHARACTER_COUNTS: Record<number, CharacterCountRow> = {
  5: { players: 5, townsfolk: 3, outsiders: 0, minions: 1, demons: 1 },
  6: { players: 6, townsfolk: 3, outsiders: 1, minions: 1, demons: 1 },
  7: { players: 7, townsfolk: 5, outsiders: 0, minions: 1, demons: 1 },
  8: { players: 8, townsfolk: 5, outsiders: 1, minions: 1, demons: 1 },
  9: { players: 9, townsfolk: 5, outsiders: 2, minions: 1, demons: 1 },
  10: { players: 10, townsfolk: 7, outsiders: 0, minions: 2, demons: 1 },
  11: { players: 11, townsfolk: 7, outsiders: 1, minions: 2, demons: 1 },
  12: { players: 12, townsfolk: 7, outsiders: 2, minions: 2, demons: 1 },
  13: { players: 13, townsfolk: 9, outsiders: 0, minions: 3, demons: 1 },
  14: { players: 14, townsfolk: 9, outsiders: 1, minions: 3, demons: 1 },
  15: { players: 15, townsfolk: 9, outsiders: 2, minions: 3, demons: 1 },
};

export const REMINDER_TOKENS: ReminderDefinition[] = [
  {
    id: 'poisoned',
    label: 'Poisoned',
    indonesianLabel: 'Diracun',
    roleId: 'poisoner',
    team: 'evil',
    description: 'Kemampuan pemain ini tidak berfungsi malam ini dan besok siang (info bisa salah).',
  },
  {
    id: 'is_the_drunk',
    label: 'Is The Drunk',
    indonesianLabel: 'Adalah Drunk',
    roleId: 'drunk',
    team: 'good',
    global: true,
    description: 'Pemain ini sebenarnya Outsider Drunk dan mengira dirinya karakter Townsfolk.',
  },
  {
    id: 'protected',
    label: 'Safe',
    indonesianLabel: 'Aman (Monk)',
    roleId: 'monk',
    team: 'good',
    description: 'Aman dari serangan Demon malam ini berkat perlindungan Monk.',
  },
  {
    id: 'die_imp',
    label: 'Dead',
    indonesianLabel: 'Mati (Imp)',
    roleId: 'imp',
    team: 'evil',
    description: 'Target serangan Imp malam ini; akan diumumkan tewas saat Fajar jika tidak terlindungi.',
  },
  {
    id: 'master',
    label: 'Master',
    indonesianLabel: 'Tuan (Butler)',
    roleId: 'butler',
    team: 'good',
    description: 'Tuan pilihan Butler. Besok Butler hanya boleh voting jika pemain ini juga voting.',
  },
  {
    id: 'decoy_ft',
    label: 'Red Herring',
    indonesianLabel: 'Red Herring',
    roleId: 'fortune_teller',
    team: 'good',
    description: 'Pemain Good yang selalu terbaca sebagai Demon oleh Fortune Teller sepanjang permainan.',
  },
  {
    id: 'townsfolk_ww',
    label: 'Townsfolk',
    indonesianLabel: 'Townsfolk Asli',
    roleId: 'washerwoman',
    team: 'good',
    description: 'Pemain yang ditunjukkan sebagai Townsfolk asli kepada Washerwoman.',
  },
  {
    id: 'decoy_ww',
    label: 'Wrong',
    indonesianLabel: 'Pengalih WW',
    roleId: 'washerwoman',
    team: 'good',
    description: 'Pemain kedua (salah) yang ditunjukkan kepada Washerwoman.',
  },
  {
    id: 'outsider_lib',
    label: 'Outsider',
    indonesianLabel: 'Outsider Asli',
    roleId: 'librarian',
    team: 'good',
    description: 'Pemain yang ditunjukkan sebagai Outsider asli kepada Librarian.',
  },
  {
    id: 'decoy_lib',
    label: 'Wrong',
    indonesianLabel: 'Pengalih Lib',
    roleId: 'librarian',
    team: 'good',
    description: 'Pemain kedua (salah) yang ditunjukkan kepada Librarian.',
  },
  {
    id: 'minion_inv',
    label: 'Minion',
    indonesianLabel: 'Minion Asli',
    roleId: 'investigator',
    team: 'evil',
    description: 'Pemain yang ditunjukkan sebagai Minion asli kepada Investigator.',
  },
  {
    id: 'decoy_inv',
    label: 'Wrong',
    indonesianLabel: 'Pengalih Inv',
    roleId: 'investigator',
    team: 'good',
    description: 'Pemain kedua (salah) yang ditunjukkan kepada Investigator.',
  },
  {
    id: 'died_today',
    label: 'Died Today',
    indonesianLabel: 'Dieksekusi',
    roleId: 'undertaker',
    team: 'neutral',
    description: 'Pemain yang mati karena eksekusi siang ini (untuk info Undertaker malam nanti).',
  },
  {
    id: 'used_slayer',
    label: 'No Ability',
    indonesianLabel: 'Slayer Terpakai',
    roleId: 'slayer',
    team: 'good',
    description: 'Slayer sudah menggunakan tembakan satu kali per permainannya.',
  },
  {
    id: 'used_virgin',
    label: 'No Ability',
    indonesianLabel: 'Virgin Terpakai',
    roleId: 'virgin',
    team: 'good',
    description: 'Virgin sudah pernah dinominasikan dan kehilangan kemampuannya.',
  },
  {
    id: 'is_demon_sw',
    label: 'Is The Demon',
    indonesianLabel: 'Jadi Demon',
    roleId: 'scarlet_woman',
    team: 'evil',
    description: 'Scarlet Woman telah menggantikan Demon yang mati dan kini menjadi Imp.',
  },
  {
    id: 'thief_neg',
    label: 'Negative Vote',
    indonesianLabel: 'Suara Negatif',
    roleId: 'thief',
    team: 'neutral',
    description: 'Suara pemain ini bernilai negatif saat voting besok (Traveller Thief).',
  },
  {
    id: 'bureaucrat_3x',
    label: '3 Votes',
    indonesianLabel: '3 Suara',
    roleId: 'bureaucrat',
    team: 'neutral',
    description: 'Suara pemain ini dihitung 3 kali saat voting besok (Traveller Bureaucrat).',
  },
];

// Official Trouble Brewing base characters (22) with exact TB nightsheet.json ordinals
export const ROLES: RoleDefinition[] = [
  // ================= TOWNSFOLK (13) =================
  {
    id: 'washerwoman',
    artId: 'washerwoman',
    name: 'Washerwoman',
    indonesianName: 'Tukang Cuci',
    team: 'townsfolk',
    ability: 'Mulai permainan dengan mengetahui bahwa 1 dari 2 pemain adalah karakter Townsfolk tertentu.',
    abilityEn: 'You start knowing that 1 of 2 players is a particular Townsfolk.',
    firstNightOrder: 51,
    otherNightOrder: null,
    firstNightInstruction:
      'Bangunkan Washerwoman. Tunjuk 2 pemain (1 Townsfolk asli dan 1 pengalih/Wrong dalam urutan bebas), lalu tunjukkan token karakter Townsfolk tersebut. Tidurkan kembali.',
    storytellerNote:
      'Pasang token Townsfolk & Wrong untuk membantu Anda mengingat. Jangan menunjuk Drunk sebagai Townsfolk asli kecuali Washerwoman sedang Poisoned/Drunk.',
    reminderIds: ['townsfolk_ww', 'decoy_ww'],
    reminderCountBadge: 2,
  },
  {
    id: 'librarian',
    artId: 'librarian',
    name: 'Librarian',
    indonesianName: 'Pustakawan',
    team: 'townsfolk',
    ability: 'Mulai permainan dengan mengetahui bahwa 1 dari 2 pemain adalah karakter Outsider tertentu (atau tidak ada yang bermain).',
    abilityEn: 'You start knowing that 1 of 2 players is a particular Outsider. (Or that zero are in play.)',
    firstNightOrder: 52,
    otherNightOrder: null,
    firstNightInstruction:
      'Bangunkan Librarian. Tunjuk 2 pemain (1 Outsider asli termasuk Drunk jika ada, dan 1 Wrong) lalu tunjukkan token karakter Outsider tersebut. Jika 0 Outsider, tunjukkan angka 0. Tidurkan kembali.',
    storytellerNote:
      'Jika Drunk ada di permainan, Anda boleh menunjuk pemain Drunk dan memperlihatkan token karakter "Drunk" kepada Librarian!',
    reminderIds: ['outsider_lib', 'decoy_lib'],
    reminderCountBadge: 2,
  },
  {
    id: 'investigator',
    artId: 'investigator',
    name: 'Investigator',
    indonesianName: 'Detektif',
    team: 'townsfolk',
    ability: 'Mulai permainan dengan mengetahui bahwa 1 dari 2 pemain adalah karakter Minion tertentu.',
    abilityEn: 'You start knowing that 1 of 2 players is a particular Minion.',
    firstNightOrder: 53,
    otherNightOrder: null,
    firstNightInstruction:
      'Bangunkan Investigator. Tunjuk 2 pemain (1 Minion asli dan 1 Wrong), lalu tunjukkan token karakter Minion tersebut. Tidurkan kembali.',
    storytellerNote: 'Jika Recluse bermain, Recluse boleh terbaca sebagai Minion bagi Investigator.',
    reminderIds: ['minion_inv', 'decoy_inv'],
    reminderCountBadge: 2,
  },
  {
    id: 'chef',
    artId: 'chef',
    name: 'Chef',
    indonesianName: 'Juru Masak',
    team: 'townsfolk',
    ability: 'Mulai permainan dengan mengetahui berapa pasang pemain Evil yang duduk bersebelahan.',
    abilityEn: 'You start knowing how many pairs of evil players there are.',
    firstNightOrder: 54,
    otherNightOrder: null,
    firstNightInstruction:
      'Bangunkan Chef. Berikan isyarat jari (0, 1, 2, dst.) sesuai jumlah pasangan pemain Evil yang duduk bersebelahan di lingkaran. Tidurkan kembali.',
    storytellerNote:
      '2 pemain Evil bersebelahan = 1 pasang. 3 pemain Evil berderet = 2 pasang. Recluse boleh dihitung Evil dan Spy boleh dihitung Good.',
    reminderIds: [],
  },
  {
    id: 'empath',
    artId: 'empath',
    name: 'Empath',
    indonesianName: 'Perasa',
    team: 'townsfolk',
    ability: 'Setiap malam, Anda mengetahui berapa banyak dari 2 tetangga hidup terdekat Anda yang Evil.',
    abilityEn: 'Each night, you learn how many of your 2 alive neighbors are evil.',
    firstNightOrder: 55,
    otherNightOrder: 75,
    firstNightInstruction:
      'Bangunkan Empath. Berikan isyarat jari (0, 1, atau 2) sesuai jumlah tetangga hidup di kiri & kanan yang bertim Evil. Tidurkan kembali.',
    otherNightInstruction:
      'Bangunkan Empath. Lewati pemain mati untuk mencari 2 tetangga hidup terdekat. Berikan isyarat jari (0, 1, atau 2). Tidurkan kembali.',
    storytellerNote:
      'Tetangga dihitung dari pemain HIDUP terdekat searah dan berlawanan jarum jam.',
    reminderIds: [],
  },
  {
    id: 'fortune_teller',
    artId: 'fortuneteller',
    name: 'Fortune Teller',
    indonesianName: 'Peramal',
    team: 'townsfolk',
    ability: 'Setiap malam, pilih 2 pemain: ketahui apakah salah satunya adalah Demon. Ada 1 pemain Good yang terbaca sebagai Demon bagi Anda.',
    abilityEn: 'Each night, choose 2 players: you learn if either is a Demon. There is a good player that registers as a Demon to you.',
    firstNightOrder: 56,
    otherNightOrder: 76,
    firstNightInstruction:
      'Pastikan token Red Herring sudah terpasang pada 1 pemain Good. Bangunkan Fortune Teller untuk memilih 2 pemain. Anggukkan kepala (YA) jika salah satunya Demon atau Red Herring; gelengkan (TIDAK) jika bukan.',
    otherNightInstruction:
      'Bangunkan Fortune Teller dan minta ia memilih 2 pemain. Anggukkan (YA) jika salah satunya adalah Demon saat ini ATAU pemegang Red Herring.',
    storytellerNote:
      'Token Red Herring tetap pada pemain Good yang sama sepanjang permainan (walau ia sudah mati).',
    reminderIds: ['decoy_ft'],
    reminderCountBadge: 1,
  },
  {
    id: 'undertaker',
    artId: 'undertaker',
    name: 'Undertaker',
    indonesianName: 'Penggali Kubur',
    team: 'townsfolk',
    ability: 'Setiap malam*, Anda mengetahui karakter apa yang mati karena eksekusi siang tadi.',
    abilityEn: 'Each night*, you learn which character died by execution today.',
    firstNightOrder: null,
    otherNightOrder: 77,
    otherNightInstruction:
      'Jika ada pemain yang mati karena EKSEKUSI siang tadi (berlabel Died Today), bangunkan Undertaker dan tunjukkan token karakter asli pemain tersebut.',
    storytellerNote:
      'Jika Drunk dieksekusi, tunjukkan token "Drunk". Spy atau Recluse boleh terbaca berbeda.',
    reminderIds: ['died_today'],
    reminderCountBadge: 1,
  },
  {
    id: 'monk',
    artId: 'monk',
    name: 'Monk',
    indonesianName: 'Biarawan',
    team: 'townsfolk',
    ability: 'Setiap malam*, pilih 1 pemain (bukan diri sendiri): mereka aman dari serangan Demon malam ini.',
    abilityEn: 'Each night*, choose a player (not yourself): they are safe from the Demon tonight.',
    firstNightOrder: null,
    otherNightOrder: 23,
    otherNightInstruction:
      'Bangunkan Monk. Minta ia memilih 1 pemain selain dirinya sendiri. Pasang token "Safe" pada pemain pilihan tersebut.',
    storytellerNote:
      'Jika Imp menyerang pemain bertanda Safe (dan Monk sehat), tidak ada korban malam ini.',
    reminderIds: ['protected'],
    reminderCountBadge: 1,
  },
  {
    id: 'ravenkeeper',
    artId: 'ravenkeeper',
    name: 'Ravenkeeper',
    indonesianName: 'Penjaga Gagak',
    team: 'townsfolk',
    ability: 'Jika Anda mati pada malam hari, Anda dibangunkan untuk memilih 1 pemain: Anda mengetahui karakter mereka.',
    abilityEn: 'If you die at night, you are woken to choose a player: you learn their character.',
    firstNightOrder: null,
    otherNightOrder: 74,
    otherNightInstruction:
      'Jika Ravenkeeper baru saja mati malam ini, bangunkan ia untuk memilih 1 pemain lalu tunjukkan token karakter pemain tersebut.',
    storytellerNote:
      'Jika Ravenkeeper Poisoned/Drunk saat dibunuh malam hari, tetap bangunkan namun Anda bebas memberi token salah.',
    reminderIds: [],
  },
  {
    id: 'virgin',
    artId: 'virgin',
    name: 'Virgin',
    indonesianName: 'Perawan Suci',
    team: 'townsfolk',
    ability: 'Pertama kali Anda dinominasikan, jika penominasi adalah Townsfolk, mereka langsung dieksekusi saat itu juga.',
    abilityEn: 'The 1st time you are nominated, if the nominator is a Townsfolk, they are executed immediately.',
    firstNightOrder: null,
    otherNightOrder: null,
    storytellerNote:
      'Pasang token "No Ability" setelah nominasi pertama terjadi. Jika penominasi Townsfolk asli & Virgin sehat, penominasi mati & siang langsung berakhir.',
    reminderIds: ['used_virgin'],
    reminderCountBadge: 1,
  },
  {
    id: 'slayer',
    artId: 'slayer',
    name: 'Slayer',
    indonesianName: 'Pembasmi Iblis',
    team: 'townsfolk',
    ability: 'Sekali per permainan pada siang hari, pilih 1 pemain secara terbuka: jika mereka adalah Demon, mereka mati.',
    abilityEn: 'Once per game, during the day, publicly choose a player: if they are the Demon, they die.',
    firstNightOrder: null,
    otherNightOrder: null,
    storytellerNote:
      'Pasang token "No Ability" setelah digunakan. Jika Slayer sehat menembak Imp (atau Recluse bila diizinkan), target mati seketika.',
    reminderIds: ['used_slayer'],
    reminderCountBadge: 1,
  },
  {
    id: 'soldier',
    artId: 'soldier',
    name: 'Soldier',
    indonesianName: 'Prajurit',
    team: 'townsfolk',
    ability: 'Anda aman dari serangan Demon.',
    abilityEn: 'You are safe from the Demon.',
    firstNightOrder: null,
    otherNightOrder: null,
    storytellerNote: 'Kemampuan pasif. Soldier kebal terhadap serangan malam Imp selama tidak terkena Poisoned.',
    reminderIds: [],
  },
  {
    id: 'mayor',
    artId: 'mayor',
    name: 'Mayor',
    indonesianName: 'Wali Kota',
    team: 'townsfolk',
    ability: 'Jika hanya 3 pemain hidup dan tidak ada eksekusi hari ini, tim Anda menang. Jika Anda mati pada malam hari, pemain lain mungkin mati menggantikan Anda.',
    abilityEn: 'If only 3 players live & no execution occurs, your team wins. If you die at night, another player might die instead.',
    firstNightOrder: null,
    otherNightOrder: null,
    storytellerNote: 'Anda boleh memantulkan serangan malam Imp ke Mayor ke pemain lain. Jika 3 hidup tanpa eksekusi, tim Good menang.',
    reminderIds: [],
  },

  // ================= OUTSIDERS (4) =================
  {
    id: 'butler',
    artId: 'butler',
    name: 'Butler',
    indonesianName: 'Pelayan',
    team: 'outsider',
    ability: 'Setiap malam, pilih 1 pemain (bukan diri sendiri): besok, Anda hanya boleh voting jika mereka juga voting.',
    abilityEn: 'Each night, choose a player (not yourself): tomorrow, you may only vote if they are voting too.',
    firstNightOrder: 57,
    otherNightOrder: 90,
    firstNightInstruction:
      'Bangunkan Butler. Minta ia menunjuk 1 pemain lain sebagai Tuannya (Master). Pasang token "Master" pada pemain tersebut.',
    otherNightInstruction:
      'Bangunkan Butler. Minta ia memilih 1 Tuan (Master) untuk esok hari dan pindahkan token "Master".',
    storytellerNote: 'Butler bertanggung jawab mematuhi batasan vote bersama Master-nya.',
    reminderIds: ['master'],
    reminderCountBadge: 1,
  },
  {
    id: 'drunk',
    artId: 'drunk',
    name: 'Drunk',
    indonesianName: 'Pemabuk',
    team: 'outsider',
    ability: 'Anda tidak tahu Anda adalah Drunk. Anda mengira Anda adalah karakter Townsfolk, padahal bukan.',
    abilityEn: 'You do not know you are the Drunk. You think you are a Townsfolk character, but you are not.',
    firstNightOrder: null,
    otherNightOrder: null,
    setupModifier: true,
    storytellerNote:
      'Pemain mendapat token Townsfolk di kantong, sedangkan Grimoire menandai "Is The Drunk". Bangunkan seolah Townsfolk aslinya.',
    reminderIds: ['is_the_drunk'],
    reminderCountBadge: 1,
  },
  {
    id: 'recluse',
    artId: 'recluse',
    name: 'Recluse',
    indonesianName: 'Pertapa',
    team: 'outsider',
    ability: 'Anda mungkin terbaca sebagai Evil dan sebagai Minion atau Demon, meskipun sudah mati.',
    abilityEn: 'You might register as evil & as a Minion or Demon, even if dead.',
    firstNightOrder: null,
    otherNightOrder: null,
    storytellerNote: 'Tim asli Good, namun Storyteller boleh membacanya sebagai Evil/Minion/Demon untuk info karakter lain.',
    reminderIds: [],
  },
  {
    id: 'saint',
    artId: 'saint',
    name: 'Saint',
    indonesianName: 'Orang Suci',
    team: 'outsider',
    ability: 'Jika Anda mati karena eksekusi, tim Anda kalah.',
    abilityEn: 'If you die by execution, your team loses.',
    firstNightOrder: null,
    otherNightOrder: null,
    storytellerNote: 'Jika Saint sehat dieksekusi siang hari, tim Evil langsung menang. Tidak aktif jika mati malam hari.',
    reminderIds: [],
  },

  // ================= MINIONS (4) =================
  {
    id: 'poisoner',
    artId: 'poisoner',
    name: 'Poisoner',
    indonesianName: 'Peracun',
    team: 'minion',
    ability: 'Setiap malam, pilih 1 pemain: mereka terkena racun malam ini dan besok siang.',
    abilityEn: 'Each night, choose a player: they are poisoned tonight and tomorrow day.',
    firstNightOrder: 32,
    otherNightOrder: 16,
    firstNightInstruction:
      'Bangunkan Poisoner. Minta ia menunjuk 1 pemain. Pasang token "Poisoned" pada pemain tersebut.',
    otherNightInstruction:
      'Pindahkan token "Poisoned" ke target pilihan baru Poisoner untuk malam ini dan besok siang.',
    storytellerNote: 'Pemain yang Poisoned tetap bangun malam seperti biasa, namun kemampuannya gagal/salah.',
    reminderIds: ['poisoned'],
    reminderCountBadge: 1,
  },
  {
    id: 'spy',
    artId: 'spy',
    name: 'Spy',
    indonesianName: 'Mata-mata',
    team: 'minion',
    ability: 'Setiap malam, Anda melihat isi Grimoire. Anda mungkin terbaca sebagai Good dan sebagai Townsfolk atau Outsider, bahkan jika sudah mati.',
    abilityEn: 'Each night, you see the Grimoire. You might register as good & as a Townsfolk or Outsider, even if dead.',
    firstNightOrder: 71,
    otherNightOrder: 91,
    firstNightInstruction: 'Bangunkan Spy. Perlihatkan layar Meja Grimoire secukupnya.',
    otherNightInstruction: 'Bangunkan Spy. Perlihatkan layar Meja Grimoire secukupnya.',
    storytellerNote: 'Aktifkan Mode Intip Spy bila perlu agar tombol kontrol tersembunyi.',
    reminderIds: [],
  },
  {
    id: 'scarlet_woman',
    artId: 'scarletwoman',
    name: 'Scarlet Woman',
    indonesianName: 'Wanita Merah',
    team: 'minion',
    ability: 'Jika ada 5 atau lebih pemain hidup (Traveller tidak dihitung) dan Demon mati, Anda menjadi Demon.',
    abilityEn: 'If there are 5 or more players alive & the Demon dies, you become the Demon. (Travellers don\'t count.)',
    firstNightOrder: null,
    otherNightOrder: 32,
    otherNightInstruction:
      'Jika Scarlet Woman berubah menjadi Imp karena Demon mati saat >= 5 pemain hidup, tunjukkan kartu "ANDA ADALAH" lalu token "Imp".',
    storytellerNote: 'Selama >= 5 pemain (non-Traveller) hidup dan Scarlet Woman sehat, Evil tidak kalah jika Demon mati.',
    reminderIds: ['is_demon_sw'],
    reminderCountBadge: 1,
  },
  {
    id: 'baron',
    artId: 'baron',
    name: 'Baron',
    indonesianName: 'Bangsawan',
    team: 'minion',
    ability: 'Terdapat tambahan Outsider dalam permainan. [+2 Outsiders]',
    abilityEn: 'There are extra Outsiders in play. [+2 Outsiders]',
    firstNightOrder: null,
    otherNightOrder: null,
    setupModifier: true,
    storytellerNote: 'Efek Setup: menambah +2 Outsider dan mengurangi -2 Townsfolk dari tabel standar.',
    reminderIds: [],
  },

  // ================= DEMONS (1) =================
  {
    id: 'imp',
    artId: 'imp',
    name: 'Imp',
    indonesianName: 'Iblis Imp',
    team: 'demon',
    ability: 'Setiap malam*, pilih 1 pemain: mereka mati. Jika Anda membunuh diri sendiri dengan cara ini, 1 Minion menjadi Imp.',
    abilityEn: 'Each night*, choose a player: they die. If you kill yourself this way, a Minion becomes the Imp.',
    firstNightOrder: null,
    otherNightOrder: 39,
    otherNightInstruction:
      'Bangunkan Imp untuk memilih 1 pemain (pasang token Dead/Die jika berhasil). Jika Imp memilih diri sendiri (Starpass), ubah 1 Minion hidup menjadi Imp lalu bangunkan & tunjukkan kartu "ANDA ADALAH -> Imp".',
    storytellerNote: 'Imp tidak menyerang pada Malam Pertama.',
    reminderIds: ['die_imp'],
    reminderCountBadge: 1,
  },
];

// Official Trouble Brewing Travellers (5) — available in Grimoire board edits & Reference
export const TB_TRAVELLERS: RoleDefinition[] = [
  {
    id: 'bureaucrat',
    artId: 'bureaucrat',
    name: 'Bureaucrat',
    indonesianName: 'Birokrat',
    team: 'traveller',
    ability: 'Setiap malam, pilih 1 pemain (bukan diri sendiri): suaranya dihitung 3 suara besok.',
    abilityEn: 'Each night, choose a player (not yourself): their vote counts as 3 votes tomorrow.',
    firstNightOrder: 10,
    otherNightOrder: 6,
    firstNightInstruction: 'Bangunkan Bureaucrat untuk memilih 1 pemain lain. Pasang token "3 Votes".',
    otherNightInstruction: 'Bangunkan Bureaucrat untuk memilih 1 pemain lain. Pindahkan token "3 Votes".',
    storytellerNote: 'Traveller: alignment dipilih saat masuk (Good/Evil).',
    reminderIds: ['bureaucrat_3x'],
    reminderCountBadge: 1,
  },
  {
    id: 'thief',
    artId: 'thief',
    name: 'Thief',
    indonesianName: 'Pencuri',
    team: 'traveller',
    ability: 'Setiap malam, pilih 1 pemain (bukan diri sendiri): suaranya bernilai negatif besok.',
    abilityEn: 'Each night, choose a player (not yourself): their vote counts negatively tomorrow.',
    firstNightOrder: 11,
    otherNightOrder: 7,
    firstNightInstruction: 'Bangunkan Thief untuk memilih 1 pemain lain. Pasang token "Negative Vote".',
    otherNightInstruction: 'Bangunkan Thief untuk memilih 1 pemain lain. Pindahkan token "Negative Vote".',
    storytellerNote: 'Traveller: alignment dipilih saat masuk (Good/Evil).',
    reminderIds: ['thief_neg'],
    reminderCountBadge: 1,
  },
  {
    id: 'gunslinger',
    artId: 'gunslinger',
    name: 'Gunslinger',
    indonesianName: 'Penembak Jitu',
    team: 'traveller',
    ability: 'Setiap hari setelah voting pertama dihitung, Anda boleh memilih 1 pemain yang tadi voting: mereka mati.',
    abilityEn: 'Each day, after the 1st vote has been tallied, you may choose a player that voted: they die.',
    firstNightOrder: null,
    otherNightOrder: null,
    storytellerNote: 'Traveller: dapat menembak 1 voter setelah hasil voting ke-1 diumumkan.',
    reminderIds: [],
  },
  {
    id: 'beggar',
    artId: 'beggar',
    name: 'Beggar',
    indonesianName: 'Pengemis',
    team: 'traveller',
    ability: 'Anda harus memakai token vote untuk voting. Jika pemain mati memberi tokennya, Anda tahu tim mereka. Anda selalu sehat & sadar.',
    abilityEn: 'You must use a vote token to vote. If a dead player gives you theirs, you learn their alignment. You are sober & healthy.',
    firstNightOrder: null,
    otherNightOrder: null,
    storytellerNote: 'Traveller: tidak bisa terkena Poisoned/Drunk.',
    reminderIds: [],
  },
  {
    id: 'scapegoat',
    artId: 'scapegoat',
    name: 'Scapegoat',
    indonesianName: 'Kambing Hitam',
    team: 'traveller',
    ability: 'Jika pemain ber-alignment sama dengan Anda dieksekusi, Anda mungkin dieksekusi sebagai gantinya.',
    abilityEn: 'If a player of your alignment is executed, you might be executed instead.',
    firstNightOrder: null,
    otherNightOrder: null,
    storytellerNote: 'Traveller: Storyteller menentukan apakah eksekusi dialihkan ke Scapegoat.',
    reminderIds: [],
  },
];

export const ALL_TB_ROLES: RoleDefinition[] = [...ROLES, ...TB_TRAVELLERS];

export const ROLE_MAP: Record<string, RoleDefinition> = Object.fromEntries(
  ALL_TB_ROLES.map((role) => [role.id, role])
);

export const REMINDER_MAP: Record<string, ReminderDefinition> = Object.fromEntries(
  REMINDER_TOKENS.map((rem) => [rem.id, rem])
);

export const DEFAULT_INDONESIAN_NAMES: string[] = [
  'Bima',
  'Laras',
  'Raka',
  'Nadia',
  'Dimas',
  'Citra',
  'Fajar',
  'Kirana',
  'Reza',
  'Ayu',
  'Bagas',
  'Intan',
  'Tegar',
  'Sinta',
  'Arga',
];

/** Exact initials displayed inside custom note reminder chips, mirroring botcgrimoire-main's noteInitials. */
export function noteInitials(text: string): string {
  const cleaned = text.trim();
  if (!cleaned) return '?';
  const words = cleaned.split(/\s+/).filter(Boolean);
  if (words.length >= 2) {
    return words
      .slice(0, 3)
      .map((w) => w[0]?.toUpperCase() ?? '')
      .join('');
  }
  return cleaned.slice(0, 3).toUpperCase();
}

export function isCustomNoteReminderId(reminderId: string): boolean {
  return reminderId.startsWith('note:');
}

export function getCustomNoteText(reminderId: string, explicitNote?: string): string {
  if (explicitNote && explicitNote.trim()) return explicitNote.trim();
  if (reminderId.startsWith('note:')) return reminderId.slice(5);
  return '';
}

export interface BalancedBagResult {
  selectedRoleIds: string[];
  isDrunkActive: boolean;
  drunkFakeRoleId: string | null;
  formulaSummary: string;
  formulaDetails: string[];
}

export function calculateBalancedBag(playerCount: number): BalancedBagResult {
  const count = Math.max(5, Math.min(15, playerCount));
  const base = CHARACTER_COUNTS[count] || CHARACTER_COUNTS[8];

  const allMinions = ['poisoner', 'spy', 'scarlet_woman', 'baron'];
  const shuffledMinions = [...allMinions].sort(() => Math.random() - 0.5);
  const chosenMinions = shuffledMinions.slice(0, base.minions);
  const hasBaron = chosenMinions.includes('baron');

  const baseOutsidersCount = hasBaron ? Math.min(4, base.outsiders + 2) : base.outsiders;
  const allOutsiders = ['butler', 'recluse', 'saint', 'drunk'];
  const shuffledOutsiders = [...allOutsiders].sort(() => Math.random() - 0.5);
  const chosenOutsiders = shuffledOutsiders.slice(0, baseOutsidersCount);

  const drunkPicked = chosenOutsiders.includes('drunk');
  const physicalOutsidersInBag = chosenOutsiders.filter((id) => id !== 'drunk');

  const baseTownsfolkCount = hasBaron
    ? Math.max(0, base.townsfolk - (baseOutsidersCount - base.outsiders))
    : base.townsfolk;
  const physicalTownsfolkInBagCount = drunkPicked ? baseTownsfolkCount + 1 : baseTownsfolkCount;

  const infoAwalRoles = ['washerwoman', 'librarian', 'investigator', 'chef'];
  const ongoingProtRoles = ['empath', 'fortune_teller', 'monk', 'soldier', 'slayer'];
  const reactiveRoles = ['undertaker', 'mayor', 'virgin', 'ravenkeeper'];

  const shuffledInfoAwal = [...infoAwalRoles].sort(() => Math.random() - 0.5);
  const shuffledOngoing = [...ongoingProtRoles].sort(() => Math.random() - 0.5);
  const shuffledReactive = [...reactiveRoles].sort(() => Math.random() - 0.5);

  const chosenTownsfolk: string[] = [];
  if (physicalTownsfolkInBagCount >= 1 && shuffledInfoAwal.length > 0) {
    chosenTownsfolk.push(shuffledInfoAwal.pop()!);
  }
  if (physicalTownsfolkInBagCount >= 2 && shuffledOngoing.length > 0) {
    chosenTownsfolk.push(shuffledOngoing.pop()!);
  }
  if (physicalTownsfolkInBagCount >= 3 && shuffledReactive.length > 0) {
    chosenTownsfolk.push(shuffledReactive.pop()!);
  }

  const remainingPool = [...shuffledInfoAwal, ...shuffledOngoing, ...shuffledReactive].sort(
    () => Math.random() - 0.5
  );
  while (chosenTownsfolk.length < physicalTownsfolkInBagCount && remainingPool.length > 0) {
    chosenTownsfolk.push(remainingPool.pop()!);
  }

  const chosenDemon = ['imp'];
  const finalBag = [
    ...chosenTownsfolk,
    ...physicalOutsidersInBag,
    ...chosenMinions,
    ...chosenDemon,
  ];

  let drunkFakeRoleId: string | null = null;
  if (drunkPicked) {
    const unpickedTownsfolk = [
      ...infoAwalRoles,
      ...ongoingProtRoles,
      ...reactiveRoles,
    ].filter((id) => !chosenTownsfolk.includes(id));
    if (unpickedTownsfolk.length > 0) {
      drunkFakeRoleId = unpickedTownsfolk[Math.floor(Math.random() * unpickedTownsfolk.length)];
    } else {
      drunkFakeRoleId = chosenTownsfolk[0] || 'investigator';
    }
  }

  const details: string[] = [
    `Townsfolk (${chosenTownsfolk.length}): ${chosenTownsfolk.map((id) => ROLE_MAP[id]?.name || id).join(', ')}`,
    `Outsiders (${chosenOutsiders.length}): ${
      chosenOutsiders.length === 0
        ? 'Tidak ada'
        : chosenOutsiders.map((id) => (id === 'drunk' ? 'The Drunk (Pemabuk)' : ROLE_MAP[id]?.name || id)).join(', ')
    }`,
    `Minions (${chosenMinions.length}): ${chosenMinions.map((id) => ROLE_MAP[id]?.name || id).join(', ')}`,
    `Demon (1): Imp`,
  ];

  if (hasBaron) {
    details.push('Modifier Baron aktif: +2 Outsiders tambahan, -2 Townsfolk.');
  }
  if (drunkPicked) {
    details.push(
      `The Drunk terpilih: 1 token Townsfolk ekstra dimasukkan ke kantong sebagai samaran Drunk (${ROLE_MAP[drunkFakeRoleId || '']?.name || 'Townsfolk'}).`
    );
  }

  return {
    selectedRoleIds: finalBag,
    isDrunkActive: drunkPicked,
    drunkFakeRoleId,
    formulaSummary: `Formula Seimbang: ${chosenTownsfolk.length} Townsfolk + ${chosenOutsiders.length} Outsider + ${chosenMinions.length} Minion + 1 Demon`,
    formulaDetails: details,
  };
}
