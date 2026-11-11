export type TeamType = 'townsfolk' | 'outsider' | 'minion' | 'demon';

export interface RoleDefinition {
  id: string;
  name: string;
  indonesianName: string;
  team: TeamType;
  ability: string;
  firstNightOrder: number | null;
  otherNightOrder: number | null;
  firstNightInstruction?: string;
  otherNightInstruction?: string;
  storytellerNote: string;
  reminderIds: string[];
}

export interface ReminderDefinition {
  id: string;
  label: string;
  indonesianLabel: string;
  roleId: string;
  team: 'good' | 'evil' | 'neutral';
  description: string;
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
    description: 'Kemampuan pemain ini tidak berfungsi malam ini dan besok siang (informasi bisa salah).',
  },
  {
    id: 'is_the_drunk',
    label: 'Is the Drunk',
    indonesianLabel: 'Adalah Drunk',
    roleId: 'drunk',
    team: 'good',
    description: 'Pemain ini sebenarnya Outsider Drunk dan mengira dirinya adalah karakter Townsfolk.',
  },
  {
    id: 'protected',
    label: 'Protected',
    indonesianLabel: 'Aman (Monk)',
    roleId: 'monk',
    team: 'good',
    description: 'Aman dari serangan Demon malam ini berkat perlindungan Monk.',
  },
  {
    id: 'die_imp',
    label: 'Die',
    indonesianLabel: 'Mati (Imp)',
    roleId: 'imp',
    team: 'evil',
    description: 'Target serangan Imp malam ini; akan diumumkan mati saat Fajar jika tidak terlindungi.',
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
    label: 'Decoy',
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
    label: 'Decoy',
    indonesianLabel: 'Pengalih WW',
    roleId: 'washerwoman',
    team: 'good',
    description: 'Pemain kedua (pengalih/salah) yang ditunjukkan kepada Washerwoman.',
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
    label: 'Decoy',
    indonesianLabel: 'Pengalih Lib',
    roleId: 'librarian',
    team: 'good',
    description: 'Pemain kedua (pengalih/salah) yang ditunjukkan kepada Librarian.',
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
    label: 'Decoy',
    indonesianLabel: 'Pengalih Inv',
    roleId: 'investigator',
    team: 'good',
    description: 'Pemain kedua (pengalih/salah) yang ditunjukkan kepada Investigator.',
  },
  {
    id: 'executed',
    label: 'Executed',
    indonesianLabel: 'Dieksekusi',
    roleId: 'undertaker',
    team: 'neutral',
    description: 'Pemain yang mati karena eksekusi warga siang ini (untuk info Undertaker malam nanti).',
  },
  {
    id: 'used_slayer',
    label: 'Used (Slayer)',
    indonesianLabel: 'Slayer Terpakai',
    roleId: 'slayer',
    team: 'good',
    description: 'Slayer sudah menggunakan tembakan satu kali per permainannya.',
  },
  {
    id: 'used_virgin',
    label: 'Used (Virgin)',
    indonesianLabel: 'Virgin Terpakai',
    roleId: 'virgin',
    team: 'good',
    description: 'Virgin sudah pernah dinominasikan dan kehilangan kemampuannya.',
  },
  {
    id: 'is_demon_sw',
    label: 'Demon',
    indonesianLabel: 'Jadi Demon',
    roleId: 'scarlet_woman',
    team: 'evil',
    description: 'Scarlet Woman telah menggantikan Demon yang mati dan kini menjadi Imp.',
  },
];

export const ROLES: RoleDefinition[] = [
  // ================= TOWNSFOLK (13) =================
  {
    id: 'washerwoman',
    name: 'Washerwoman',
    indonesianName: 'Tukang Cuci',
    team: 'townsfolk',
    ability: 'Mulai permainan dengan mengetahui bahwa 1 dari 2 pemain adalah karakter Townsfolk tertentu.',
    firstNightOrder: 30,
    otherNightOrder: null,
    firstNightInstruction:
      'Bangunkan Washerwoman. Tunjuk 2 pemain (1 Townsfolk asli dan 1 pengalih/decoy dalam urutan bebas), lalu tunjukkan token karakter Townsfolk tersebut. Tidurkan kembali Washerwoman.',
    storytellerNote:
      'Jangan menunjuk Drunk sebagai Townsfolk asli kecuali Washerwoman sedang Poisoned/Drunk, atau Anda sengaja memberi info palsu kepada Drunk.',
    reminderIds: ['townsfolk_ww', 'decoy_ww'],
  },
  {
    id: 'librarian',
    name: 'Librarian',
    indonesianName: 'Pustakawan',
    team: 'townsfolk',
    ability: 'Mulai permainan dengan mengetahui bahwa 1 dari 2 pemain adalah karakter Outsider tertentu (atau mengetahui bahwa tidak ada Outsider).',
    firstNightOrder: 40,
    otherNightOrder: null,
    firstNightInstruction:
      'Bangunkan Librarian. Tunjuk 2 pemain (1 Outsider asli termasuk Drunk jika ada, dan 1 pengalih) lalu tunjukkan token karakter Outsider tersebut. Jika 0 Outsider dalam permainan, tunjukkan angka 0 (kepalkan tangan). Tidurkan kembali Librarian.',
    storytellerNote:
      'Jika Drunk ada dalam permainan, Anda BOLEH menunjuk pemain Drunk dan memperlihatkan token karakter "Drunk" kepada Librarian!',
    reminderIds: ['outsider_lib', 'decoy_lib'],
  },
  {
    id: 'investigator',
    name: 'Investigator',
    indonesianName: 'Detektif',
    team: 'townsfolk',
    ability: 'Mulai permainan dengan mengetahui bahwa 1 dari 2 pemain adalah karakter Minion tertentu.',
    firstNightOrder: 50,
    otherNightOrder: null,
    firstNightInstruction:
      'Bangunkan Investigator. Tunjuk 2 pemain (1 Minion asli dan 1 pengalih), lalu tunjukkan token karakter Minion tersebut. Tidurkan kembali Investigator.',
    storytellerNote:
      'Jika Recluse ada dalam permainan, Recluse boleh terbaca sebagai Minion bagi Investigator.',
    reminderIds: ['minion_inv', 'decoy_inv'],
  },
  {
    id: 'chef',
    name: 'Chef',
    indonesianName: 'Juru Masak',
    team: 'townsfolk',
    ability: 'Mulai permainan dengan mengetahui berapa pasang pemain jahat (Evil) yang duduk bersebelahan.',
    firstNightOrder: 60,
    otherNightOrder: null,
    firstNightInstruction:
      'Bangunkan Chef. Berikan isyarat jari (0, 1, 2, dst.) sesuai jumlah pasangan pemain Evil yang duduk bersebelahan di lingkaran. Tidurkan kembali Chef.',
    storytellerNote:
      '2 pemain Evil bersebelahan = 1 pasang. 3 pemain Evil berderet = 2 pasang. Recluse boleh dihitung Evil dan Spy boleh dihitung Good sesuai keputusan Storyteller.',
    reminderIds: [],
  },
  {
    id: 'empath',
    name: 'Empath',
    indonesianName: 'Perasa',
    team: 'townsfolk',
    ability: 'Setiap malam, Anda mengetahui berapa banyak dari 2 tetangga hidup terdekat Anda yang jahat (Evil).',
    firstNightOrder: 70,
    otherNightOrder: 60,
    firstNightInstruction:
      'Bangunkan Empath. Berikan isyarat jari (0, 1, atau 2) yang menunjukkan jumlah tetangga hidup terdekat di kiri dan kanannya yang merupakan tim Evil. Tidurkan kembali Empath.',
    otherNightInstruction:
      'Bangunkan Empath. Lewati kursi pemain yang sudah mati untuk mencari 1 tetangga hidup terdekat di kiri dan 1 di kanan. Berikan isyarat jari (0, 1, atau 2). Tidurkan kembali Empath.',
    storytellerNote:
      'Tetangga dihitung dari pemain HIDUP terdekat searah dan berlawanan jarum jam (lewati pemain yang sudah mati).',
    reminderIds: [],
  },
  {
    id: 'fortune_teller',
    name: 'Fortune Teller',
    indonesianName: 'Peramal',
    team: 'townsfolk',
    ability: 'Setiap malam, pilih 2 pemain: ketahui apakah salah satunya adalah Demon. Ada 1 pemain Good yang selalu terbaca sebagai Demon bagi Anda.',
    firstNightOrder: 80,
    otherNightOrder: 70,
    firstNightInstruction:
      'Pastikan token Red Herring (Decoy) sudah ditempel pada 1 pemain Good. Bangunkan Fortune Teller dan minta ia menunjuk 2 pemain (boleh menunjuk diri sendiri atau pemain mati). Anggukkan kepala (YA) jika salah satunya adalah Demon ATAU Red Herring. Gelengkan kepala (TIDAK) jika bukan keduanya. Tidurkan kembali.',
    otherNightInstruction:
      'Bangunkan Fortune Teller dan minta ia menunjuk 2 pemain. Anggukkan kepala (YA) jika salah satu dari 2 pemain tersebut adalah Demon saat ini ATAU pemegang token Red Herring (Decoy). Gelengkan kepala (TIDAK) jika bukan. Tidurkan kembali.',
    storytellerNote:
      'Token Red Herring tetap berada di pemain Good yang sama sepanjang permainan (meskipun pemain itu mati).',
    reminderIds: ['decoy_ft'],
  },
  {
    id: 'undertaker',
    name: 'Undertaker',
    indonesianName: 'Penggali Kubur',
    team: 'townsfolk',
    ability: 'Setiap malam*, Anda mengetahui karakter apa yang mati karena eksekusi siang tadi.',
    firstNightOrder: null,
    otherNightOrder: 50,
    otherNightInstruction:
      'Jika ada pemain yang mati karena EKSEKUSI siang tadi, bangunkan Undertaker dan tunjukkan token karakter asli pemain yang dieksekusi tersebut. Jika tidak ada eksekusi yang berujung kematian siang tadi, JANGAN bangunkan Undertaker.',
    storytellerNote:
      'Jika Drunk dieksekusi, Undertaker melihat token "Drunk" (bukan peran Townsfolk palsunya). Spy atau Recluse boleh terbaca berbeda sesuai kemampuan mereka.',
    reminderIds: ['executed'],
  },
  {
    id: 'monk',
    name: 'Monk',
    indonesianName: 'Biarawan',
    team: 'townsfolk',
    ability: 'Setiap malam*, pilih 1 pemain (selain diri sendiri): mereka aman dari serangan Demon malam ini.',
    firstNightOrder: null,
    otherNightOrder: 20,
    otherNightInstruction:
      'Bangunkan Monk. Minta ia menunjuk 1 pemain selain dirinya sendiri (jika menunjuk diri sendiri, gelengkan kepala dan minta pilih orang lain). Pasang token "Protected" pada pemain tersebut. Tidurkan kembali Monk.',
    storytellerNote:
      'Jika Imp menyerang pemain berlabel Protected (dan Monk tidak sedang Poisoned/Drunk), tidak ada yang mati karena serangan Imp malam itu.',
    reminderIds: ['protected'],
  },
  {
    id: 'ravenkeeper',
    name: 'Ravenkeeper',
    indonesianName: 'Penjaga Gagak',
    team: 'townsfolk',
    ability: 'Jika Anda mati pada malam hari, Anda dibangunkan untuk memilih 1 pemain: Anda mengetahui karakter mereka.',
    firstNightOrder: null,
    otherNightOrder: 45,
    otherNightInstruction:
      'Bangunkan Ravenkeeper HANYA JIKA ia baru saja mati malam ini (dibunuh Imp). Minta ia menunjuk 1 pemain mana saja, lalu tunjukkan token karakter pemain tersebut. Tidurkan kembali Ravenkeeper.',
    storytellerNote:
      'Jika Ravenkeeper terkena Poison saat ia dibunuh malam itu, ia tetap dibangunkan untuk memilih pemain, namun berikan token karakter yang salah!',
    reminderIds: [],
  },
  {
    id: 'virgin',
    name: 'Virgin',
    indonesianName: 'Perawan Suci',
    team: 'townsfolk',
    ability: 'Pertama kali Anda dinominasikan, jika penominasi adalah Townsfolk, penominasi langsung dieksekusi saat itu juga.',
    firstNightOrder: null,
    otherNightOrder: null,
    storytellerNote:
      'Aktif pada Siang Hari saat pertama kali dinominasikan. Jika penominasi adalah Townsfolk asli (bukan Drunk!) dan Virgin sehat, langsung nyatakan penominasi dieksekusi & siang langsung berakhir menuju malam. Pasang token "Used" pada Virgin apapun hasilnya.',
    reminderIds: ['used_virgin'],
  },
  {
    id: 'slayer',
    name: 'Slayer',
    indonesianName: 'Pembasmi Iblis',
    team: 'townsfolk',
    ability: 'Sekali per permainan pada siang hari, pilih 1 pemain secara terbuka: jika mereka adalah Demon, mereka mati.',
    firstNightOrder: null,
    otherNightOrder: null,
    storytellerNote:
      'Aktif pada Siang Hari ketika seseorang mengklaim Slayer di depan umum dan menembak target. Pasang token "Used". Jika penembak adalah Slayer asli (sehat) dan target adalah Demon (atau Recluse jika Anda mau), nyatakan target mati; jika tidak, katakan "Tidak terjadi apa-apa".',
    reminderIds: ['used_slayer'],
  },
  {
    id: 'soldier',
    name: 'Soldier',
    indonesianName: 'Prajurit',
    team: 'townsfolk',
    ability: 'Anda aman dari serangan Demon.',
    firstNightOrder: null,
    otherNightOrder: null,
    storytellerNote:
      'Kemampuan pasif. Jika Imp menyerang Soldier pada malam hari, Soldier TIDAK mati—kecuali Soldier sedang Poisoned oleh Poisoner malam itu!',
    reminderIds: [],
  },
  {
    id: 'mayor',
    name: 'Mayor',
    indonesianName: 'Wali Kota',
    team: 'townsfolk',
    ability: 'Jika hanya 3 pemain hidup dan tidak ada eksekusi hari itu, tim Anda menang. Jika Anda mati pada malam hari, pemain lain mungkin mati menggantikan Anda.',
    firstNightOrder: null,
    otherNightOrder: null,
    storytellerNote:
      'Jika Imp menargetkan Mayor yang sehat pada malam hari, Anda boleh memantulkan kematian tersebut ke pemain lain (atau membiarkan Mayor mati). Saat tersisa 3 pemain hidup, jika siang berakhir tanpa eksekusi dan Mayor sehat, Tim Good menang!',
    reminderIds: [],
  },

  // ================= OUTSIDERS (4) =================
  {
    id: 'butler',
    name: 'Butler',
    indonesianName: 'Pelayan',
    team: 'outsider',
    ability: 'Setiap malam, pilih 1 pemain (selain diri sendiri): besok siang, Anda hanya boleh voting jika pemain tersebut juga sedang voting.',
    firstNightOrder: 90,
    otherNightOrder: 80,
    firstNightInstruction:
      'Bangunkan Butler. Minta ia menunjuk 1 pemain lain sebagai Tuannya (Master). Pasang token "Master" pada pemain pilihan tersebut. Tidurkan kembali Butler.',
    otherNightInstruction:
      'Bangunkan Butler. Minta ia menunjuk 1 pemain lain sebagai Tuannya untuk besok. Pindahkan token "Master" ke pemain tersebut. Tidurkan kembali Butler.',
    storytellerNote:
      'Saat voting besok siang, Butler hanya boleh mengangkat tangan jika Master-nya sedang mengangkat tangan atau suara Master-nya sudah terkunci Ya.',
    reminderIds: ['master'],
  },
  {
    id: 'drunk',
    name: 'Drunk',
    indonesianName: 'Pemabuk',
    team: 'outsider',
    ability: 'Anda tidak tahu bahwa Anda adalah Drunk. Anda mengira Anda adalah karakter Townsfolk, padahal bukan.',
    firstNightOrder: null,
    otherNightOrder: null,
    storytellerNote:
      'Pemain ini menerima token Townsfolk yang tidak dipakai pemain lain, tetapi di Grimoire ditempeli "Is the Drunk". Bangunkan ia seolah-olah ia adalah Townsfolk tersebut, namun kemampuannya tidak berefek dan informasinya boleh palsu!',
    reminderIds: ['is_the_drunk'],
  },
  {
    id: 'recluse',
    name: 'Recluse',
    indonesianName: 'Pertapa',
    team: 'outsider',
    ability: 'Anda mungkin terbaca sebagai Evil dan sebagai Minion atau Demon, meskipun sudah mati.',
    firstNightOrder: null,
    otherNightOrder: null,
    storytellerNote:
      'Recluse tetap berada di Tim Good (menang bersama Good), tetapi boleh terbaca Evil/Minion/Demon bagi Chef, Empath, Investigator, Fortune Teller, Undertaker, atau Ravenkeeper.',
    reminderIds: [],
  },
  {
    id: 'saint',
    name: 'Saint',
    indonesianName: 'Orang Suci',
    team: 'outsider',
    ability: 'Jika Anda mati karena eksekusi, tim Anda langsung kalah.',
    firstNightOrder: null,
    otherNightOrder: null,
    storytellerNote:
      'Jika Saint mati karena EKSEKUSI siang hari (dan tidak sedang Poisoned), permainan seketika berakhir dan Tim Evil menang! Jika Saint dibunuh Imp pada malam hari, permainan lanjut seperti biasa.',
    reminderIds: [],
  },

  // ================= MINIONS (4) =================
  {
    id: 'poisoner',
    name: 'Poisoner',
    indonesianName: 'Peracun',
    team: 'minion',
    ability: 'Setiap malam, pilih 1 pemain: mereka terkena racun (Poisoned) malam ini dan besok siang.',
    firstNightOrder: 15,
    otherNightOrder: 10,
    firstNightInstruction:
      'Bangunkan Poisoner. Minta ia menunjuk 1 pemain mana saja. Pasang token "Poisoned" pada pemain tersebut. Tidurkan kembali Poisoner.',
    otherNightInstruction:
      'Hapus token "Poisoned" dari malam sebelumnya. Bangunkan Poisoner dan minta ia menunjuk 1 pemain baru (boleh pemain yang sama). Pasang token "Poisoned" pada target tersebut. Tidurkan kembali Poisoner.',
    storytellerNote:
      'Pemain yang Poisoned tidak memiliki kemampuan fungsional tetapi tetap dibangunkan seperti biasa jika perannya bangun malam (berikan info palsu/acak).',
    reminderIds: ['poisoned'],
  },
  {
    id: 'spy',
    name: 'Spy',
    indonesianName: 'Mata-mata',
    team: 'minion',
    ability: 'Setiap malam, Anda melihat isi Grimoire. Anda mungkin terbaca sebagai Good dan sebagai Townsfolk atau Outsider, meskipun sudah mati.',
    firstNightOrder: 20,
    otherNightOrder: 30,
    firstNightInstruction:
      'Bangunkan Spy. Perlihatkan layar Grimoire kepada Spy selama beberapa detik agar ia dapat membaca posisi peran pemain (sembunyikan catatan narator jika perlu). Tidurkan kembali Spy.',
    otherNightInstruction:
      'Bangunkan Spy. Perlihatkan layar Grimoire kepada Spy secukupnya. Tidurkan kembali Spy.',
    storytellerNote:
      'Gunakan tombol "Mode Tampilan Bersih untuk Spy" di Grimoire agar Spy dapat melihat lingkaran peran dengan jelas tanpa terganggu tombol kontrol.',
    reminderIds: [],
  },
  {
    id: 'scarlet_woman',
    name: 'Scarlet Woman',
    indonesianName: 'Wanita Merah',
    team: 'minion',
    ability: 'Jika terdapat 5 atau lebih pemain hidup (Traveller tidak dihitung) dan Demon mati, Anda berubah menjadi Demon.',
    firstNightOrder: null,
    otherNightOrder: 42,
    otherNightInstruction:
      'JIKA Demon baru saja mati (saat ada minimal 5 pemain hidup dan Scarlet Woman hidup & sehat), bangunkan Scarlet Woman sekarang: tunjukkan kartu "ANDA ADALAH" lalu token "Imp". Tandai ia dengan token "Demon".',
    storytellerNote:
      'Jika ada tepat 5 pemain hidup lalu warga mengeksekusi Imp, Scarlet Woman langsung menjadi Imp baru sehingga permainan TIDAK berakhir!',
    reminderIds: ['is_demon_sw'],
  },
  {
    id: 'baron',
    name: 'Baron',
    indonesianName: 'Bangsawan',
    team: 'minion',
    ability: 'Terdapat tambahan Outsider dalam permainan. [+2 Outsiders]',
    firstNightOrder: null,
    otherNightOrder: null,
    storytellerNote:
      'Efek Baron bekerja saat Setup: menambah 2 Outsider dan mengurangi 2 Townsfolk dari tabel standar. Baron tidak bangun lagi untuk kemampuan khusus di malam hari.',
    reminderIds: [],
  },

  // ================= DEMONS (1) =================
  {
    id: 'imp',
    name: 'Imp',
    indonesianName: 'Iblis Imp',
    team: 'demon',
    ability: 'Setiap malam*, pilih 1 pemain: mereka mati. Jika Anda membunuh diri sendiri dengan cara ini, 1 Minion hidup berubah menjadi Imp.',
    firstNightOrder: null,
    otherNightOrder: 40,
    otherNightInstruction:
      'Bangunkan Imp. Minta ia menunjuk 1 pemain untuk dibunuh. Pasang token "Die" pada target (kecuali target terlindungi Monk atau Soldier yang sehat). JIKA Imp menunjuk dirinya sendiri (Starpass): Imp mati, lalu pilih 1 Minion hidup (utamakan Scarlet Woman jika ada), ubah perannya jadi Imp, bangunkan Minion tersebut dan tunjukkan kartu "ANDA ADALAH IMP"!',
    storytellerNote:
      'Imp TIDAK menyerang pada Malam Pertama (tanda bintang pada "Setiap malam*"). Imp baru mulai membunuh mulai Malam ke-2 dan seterusnya.',
    reminderIds: ['die_imp'],
  },
];

export const ROLE_MAP: Record<string, RoleDefinition> = Object.fromEntries(
  ROLES.map((role) => [role.id, role])
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

export interface BalancedBagResult {
  selectedRoleIds: string[];
  isDrunkActive: boolean;
  drunkFakeRoleId: string | null;
  formulaSummary: string;
  formulaDetails: string[];
}

/**
 * Calculates a balanced, mathematically verified Trouble Brewing character bag.
 * Balanced Archetypes: Starting Info, Ongoing/Protection, Reactive/Execution.
 * Respects Baron modifier (+2 Outsider, -2 Townsfolk) and Drunk modifier (+1 Townsfolk in bag).
 */
export function calculateBalancedBag(playerCount: number): BalancedBagResult {
  const count = Math.max(5, Math.min(15, playerCount));
  const base = CHARACTER_COUNTS[count] || CHARACTER_COUNTS[8];

  // 1. Minions selection (Poisoner, Spy, Scarlet Woman, Baron)
  const allMinions = ['poisoner', 'spy', 'scarlet_woman', 'baron'];
  const shuffledMinions = [...allMinions].sort(() => Math.random() - 0.5);
  const chosenMinions = shuffledMinions.slice(0, base.minions);
  const hasBaron = chosenMinions.includes('baron');

  // 2. Outsiders selection
  const baseOutsidersCount = hasBaron ? Math.min(4, base.outsiders + 2) : base.outsiders;
  const allOutsiders = ['butler', 'recluse', 'saint', 'drunk'];
  const shuffledOutsiders = [...allOutsiders].sort(() => Math.random() - 0.5);
  const chosenOutsiders = shuffledOutsiders.slice(0, baseOutsidersCount);

  const drunkPicked = chosenOutsiders.includes('drunk');
  const physicalOutsidersInBag = chosenOutsiders.filter((id) => id !== 'drunk');

  // 3. Townsfolk count
  const baseTownsfolkCount = hasBaron
    ? Math.max(0, base.townsfolk - (baseOutsidersCount - base.outsiders))
    : base.townsfolk;
  const physicalTownsfolkInBagCount = drunkPicked ? baseTownsfolkCount + 1 : baseTownsfolkCount;

  // Categorized Townsfolk Archetypes:
  const infoAwalRoles = ['washerwoman', 'librarian', 'investigator', 'chef'];
  const ongoingProtRoles = ['empath', 'fortune_teller', 'monk', 'soldier', 'slayer'];
  const reactiveRoles = ['undertaker', 'mayor', 'virgin', 'ravenkeeper'];

  const shuffledInfoAwal = [...infoAwalRoles].sort(() => Math.random() - 0.5);
  const shuffledOngoing = [...ongoingProtRoles].sort(() => Math.random() - 0.5);
  const shuffledReactive = [...reactiveRoles].sort(() => Math.random() - 0.5);

  const chosenTownsfolk: string[] = [];

  // Slot 1: Info Awal
  if (physicalTownsfolkInBagCount >= 1 && shuffledInfoAwal.length > 0) {
    chosenTownsfolk.push(shuffledInfoAwal.pop()!);
  }
  // Slot 2: Ongoing Info / Proteksi
  if (physicalTownsfolkInBagCount >= 2 && shuffledOngoing.length > 0) {
    chosenTownsfolk.push(shuffledOngoing.pop()!);
  }
  // Slot 3: Reaktif / Eksekusi
  if (physicalTownsfolkInBagCount >= 3 && shuffledReactive.length > 0) {
    chosenTownsfolk.push(shuffledReactive.pop()!);
  }

  // Fill remaining townsfolk slots from pooled pool
  const remainingPool = [...shuffledInfoAwal, ...shuffledOngoing, ...shuffledReactive].sort(
    () => Math.random() - 0.5
  );

  while (chosenTownsfolk.length < physicalTownsfolkInBagCount && remainingPool.length > 0) {
    chosenTownsfolk.push(remainingPool.pop()!);
  }

  // 4. Demon (Trouble Brewing uses Imp)
  const chosenDemon = ['imp'];

  // Final Bag Composition (Physical tokens in bag)
  const finalBag = [
    ...chosenTownsfolk,
    ...physicalOutsidersInBag,
    ...chosenMinions,
    ...chosenDemon,
  ];

  // Drunk Fake Role calculation
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
      `The Drunk terpilih: 1 token Townsfolk ekstra dimasukkan ke kantung sebagai peran samaran Drunk (${ROLE_MAP[drunkFakeRoleId || '']?.name || 'Townsfolk'}).`
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
