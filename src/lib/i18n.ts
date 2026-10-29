// The app's own words in the learner's language (blind panel 2026-10-29, Nurul and Aisyah: the lesson spoke Malay
// but every button, praise word, loader line and the AI warning stayed English). Malay wording follows Nurul's
// table (a staff nurse, native speaker). Chinese and Tamil are Frank's translations, not yet checked by a native
// speaker: treat them as unverified until someone who reads them signs off.
import type { Level } from './recipe';

export type UiLang = 'en' | 'ms' | 'zh' | 'ta';
export const UI_LANGS: { id: UiLang; name: string }[] = [
  { id: 'en', name: 'English' },
  { id: 'ms', name: 'Bahasa Melayu' },
  { id: 'zh', name: '中文' },
  { id: 'ta', name: 'தமிழ்' },
];

/** The plan's language (what the lessons are written in) decides the app's own words too. */
export function uiLangOf(planLang: string | undefined): UiLang {
  const l = (planLang ?? '').toLowerCase();
  if (l.startsWith('malay') || l.startsWith('bahasa')) return 'ms';
  if (l.startsWith('chinese')) return 'zh';
  if (l.startsWith('tamil')) return 'ta';
  return 'en';
}
/** What the planner is told to write in when the learner picked a language on the home screen. */
export const PLAN_LANG: Record<UiLang, string> = { en: 'English', ms: 'Malay', zh: 'Chinese (Simplified)', ta: 'Tamil' };

/** First visit: the phone's own language, if it is one of ours. */
export function uiLangFromNavigator(): UiLang {
  try {
    const l = (navigator.languages?.[0] ?? navigator.language ?? '').toLowerCase();
    if (l.startsWith('ms') || l.startsWith('id')) return 'ms';
    if (l.startsWith('zh')) return 'zh';
    if (l.startsWith('ta')) return 'ta';
  } catch {}
  return 'en';
}

type Dict = {
  title: string; yourLevel: string; levelNote: (level: string) => string; placeholder: string; tryOne: string; examples: string[];
  levels: Record<Level, [string, string]>;
  building: string; stages: [string, string, string, string]; usually: string; err: string;
  newTopic: string; lessonOf: (n: number, total: number) => string; allLessons: string; stepOf: (n: number, total: number) => string; loading: string;
  pause: string; play: string; lessonDone: (n: number) => string; next: string; youAsked: string; backToLesson: string; notQuite: string;
  emptySpace: string; notThat: string; tryAgain: string; prevStep: string; ask: string; askPlaceholder: string; showMe: string; shownNote: string;
  cont: string; finish: string; nextLesson: string; praise: string[]; close: string; lessons: string; level: string; sources: string;
  disclaimer: string; drawing: (n: number) => string; drawingWait: string; doFirst: string; courseDone: string; startOver: string; share: string; copied: string;
  thinking: string;
};

export const UI: Record<UiLang, Dict> = {
  en: {
    title: 'What do you want to understand?', yourLevel: 'Your level', levelNote: (l) => `${l} is picked. Tap another to change it, now or later.`,
    placeholder: 'Type any topic', tryOne: 'Or try one', examples: ['Why is the sky blue?', 'How does ChatGPT work?', 'Trigonometry: sin, cos, tan'],
    levels: { novice: ['Novice', 'New to it'], beginner: ['Beginner', 'Know a little'], intermediate: ['Intermediate', 'Studied it'], expert: ['Expert', 'Use it often'], professional: ['Professional', 'Work in it'] },
    building: 'Building your course', stages: ['Reading up on it', 'Choosing what to learn first', 'Designing hands-on lessons', 'Almost there'], usually: 'Usually about 20 seconds.', err: 'Something went wrong. Try again.',
    newTopic: 'New topic', lessonOf: (n, t) => `Lesson ${n} of ${t}`, allLessons: 'All lessons', stepOf: (n, t) => `Step ${n} of ${t}`, loading: 'Loading',
    pause: 'Pause', play: 'Play', lessonDone: (n) => `Lesson ${n} done`, next: 'Next:', youAsked: 'You asked:', backToLesson: 'Back to the lesson', notQuite: 'Not quite.',
    emptySpace: "That's empty space.", notThat: 'Not that one.', tryAgain: 'Try again', prevStep: 'Previous step', ask: 'Ask', askPlaceholder: 'Ask anything about this', showMe: 'Show me', shownNote: 'Shown for you.',
    cont: 'Continue', finish: 'Finish lesson', nextLesson: 'Next lesson', praise: ['Exactly.', 'Nice.', 'Right.', 'Spot on.', 'Yes.', "That's it."], close: 'Close', lessons: 'Lessons', level: 'Level', sources: 'Sources',
    disclaimer: 'ProfAI writes each lesson with AI. It can get things wrong, so check anything important against the sources.',
    drawing: (n) => `Drawing lesson ${n}`, drawingWait: 'Usually 10 to 20 seconds. Read what it covers meanwhile.', doFirst: 'Do the step above first, or tap Show me.',
    courseDone: 'Course done', startOver: 'Start again', share: 'Share', copied: 'Link copied', thinking: 'Thinking',
  },
  ms: {
    title: 'Apa yang anda mahu fahami?', yourLevel: 'Tahap anda', levelNote: (l) => `${l} dipilih. Ketik yang lain untuk menukar, sekarang atau nanti.`,
    placeholder: 'Taip mana-mana topik', tryOne: 'Atau cuba satu', examples: ['Kenapa langit biru?', 'Bagaimana vaksin berfungsi?', 'Trigonometri: sin, kos, tan'],
    levels: { novice: ['Baru mula', 'Belum pernah belajar'], beginner: ['Asas', 'Tahu sedikit'], intermediate: ['Pertengahan', 'Pernah belajar'], expert: ['Mahir', 'Selalu guna'], professional: ['Profesional', 'Bekerja dalam bidang ini'] },
    building: 'Menyediakan kursus anda', stages: ['Membaca tentangnya', 'Memilih apa yang perlu dipelajari dahulu', 'Mereka pelajaran interaktif', 'Hampir siap'], usually: 'Biasanya kira-kira 20 saat.', err: 'Ada masalah. Cuba lagi.',
    newTopic: 'Topik baharu', lessonOf: (n, t) => `Pelajaran ${n} daripada ${t}`, allLessons: 'Semua pelajaran', stepOf: (n, t) => `Langkah ${n} daripada ${t}`, loading: 'Memuatkan',
    pause: 'Jeda', play: 'Main', lessonDone: (n) => `Pelajaran ${n} selesai`, next: 'Seterusnya:', youAsked: 'Anda bertanya:', backToLesson: 'Kembali ke pelajaran', notQuite: 'Belum tepat.',
    emptySpace: 'Itu ruang kosong.', notThat: 'Bukan yang itu.', tryAgain: 'Cuba lagi', prevStep: 'Langkah sebelumnya', ask: 'Tanya', askPlaceholder: 'Tanya apa-apa tentang ini', showMe: 'Tunjukkan', shownNote: 'Ditunjukkan untuk anda.',
    cont: 'Teruskan', finish: 'Tamat pelajaran', nextLesson: 'Pelajaran seterusnya', praise: ['Betul!', 'Tepat sekali.', 'Bagus.', 'Ya, betul.', 'Syabas.', 'Itulah dia.'], close: 'Tutup', lessons: 'Pelajaran', level: 'Tahap', sources: 'Sumber',
    disclaimer: 'Pelajaran ini ditulis oleh AI dan mungkin ada kesilapan. Semak perkara penting dengan sumber di bawah, atau tanya orang yang pakar.',
    drawing: (n) => `Melukis pelajaran ${n}`, drawingWait: 'Biasanya 10 hingga 20 saat. Baca isi pelajaran sementara menunggu.', doFirst: 'Selesaikan langkah di atas dahulu, atau ketik Tunjukkan.',
    courseDone: 'Kursus selesai', startOver: 'Mula semula', share: 'Kongsi', copied: 'Pautan disalin', thinking: 'Sedang berfikir',
  },
  zh: {
    title: '你想弄懂什么？', yourLevel: '你的程度', levelNote: (l) => `已选“${l}”。现在或之后都可以点别的来更改。`,
    placeholder: '输入任何主题', tryOne: '或者试试', examples: ['天空为什么是蓝色的？', 'ChatGPT 是怎么工作的？', '三角函数：sin、cos、tan'],
    levels: { novice: ['零基础', '第一次接触'], beginner: ['入门', '知道一点'], intermediate: ['中级', '学过'], expert: ['熟练', '经常用'], professional: ['专业', '从事这一行'] },
    building: '正在准备你的课程', stages: ['正在查资料', '决定先学什么', '设计动手的课', '快好了'], usually: '通常约 20 秒。', err: '出了点问题，请再试一次。',
    newTopic: '新主题', lessonOf: (n, t) => `第 ${n} 课，共 ${t} 课`, allLessons: '全部课程', stepOf: (n, t) => `第 ${n} 步，共 ${t} 步`, loading: '加载中',
    pause: '暂停', play: '播放', lessonDone: (n) => `第 ${n} 课完成`, next: '下一课：', youAsked: '你问：', backToLesson: '回到课程', notQuite: '还不对。',
    emptySpace: '那里是空白处。', notThat: '不是那个。', tryAgain: '再试一次', prevStep: '上一步', ask: '提问', askPlaceholder: '关于这个，问什么都可以', showMe: '示范给我看', shownNote: '已为你示范。',
    cont: '继续', finish: '完成本课', nextLesson: '下一课', praise: ['完全正确。', '很好。', '对了。', '没错。', '是的。', '就是这样。'], close: '关闭', lessons: '课程', level: '程度', sources: '资料来源',
    disclaimer: 'ProfAI 用 AI 编写每一课，可能会出错。重要的内容请对照资料来源核实。',
    drawing: (n) => `正在绘制第 ${n} 课`, drawingWait: '通常 10 到 20 秒。可以先看看这一课讲什么。', doFirst: '请先完成上面的步骤，或点“示范给我看”。',
    courseDone: '课程完成', startOver: '重新开始', share: '分享', copied: '链接已复制', thinking: '思考中',
  },
  ta: {
    title: 'நீங்கள் எதைப் புரிந்துகொள்ள விரும்புகிறீர்கள்?', yourLevel: 'உங்கள் நிலை', levelNote: (l) => `${l} தேர்ந்தெடுக்கப்பட்டது. மாற்ற வேறொன்றைத் தட்டுங்கள்.`,
    placeholder: 'எந்தத் தலைப்பையும் தட்டச்சு செய்யுங்கள்', tryOne: 'அல்லது இதை முயலுங்கள்', examples: ['வானம் ஏன் நீலமாக உள்ளது?', 'தடுப்பூசி எப்படி வேலை செய்கிறது?', 'முக்கோணவியல்: sin, cos, tan'],
    levels: { novice: ['புதியவர்', 'முதல் முறை'], beginner: ['தொடக்கநிலை', 'கொஞ்சம் தெரியும்'], intermediate: ['இடைநிலை', 'படித்திருக்கிறேன்'], expert: ['திறமையானவர்', 'அடிக்கடி பயன்படுத்துவேன்'], professional: ['தொழில்முறை', 'இந்தத் துறையில் வேலை'] },
    building: 'உங்கள் பாடநெறி தயாராகிறது', stages: ['தகவல் தேடுகிறது', 'முதலில் எதைக் கற்பது என்று தேர்கிறது', 'செய்து கற்கும் பாடங்களை வடிவமைக்கிறது', 'கிட்டத்தட்ட முடிந்தது'], usually: 'பொதுவாக சுமார் 20 வினாடிகள்.', err: 'ஏதோ தவறு நடந்தது. மீண்டும் முயலுங்கள்.',
    newTopic: 'புதிய தலைப்பு', lessonOf: (n, t) => `பாடம் ${n} / ${t}`, allLessons: 'எல்லாப் பாடங்களும்', stepOf: (n, t) => `படி ${n} / ${t}`, loading: 'ஏற்றுகிறது',
    pause: 'இடைநிறுத்து', play: 'இயக்கு', lessonDone: (n) => `பாடம் ${n} முடிந்தது`, next: 'அடுத்தது:', youAsked: 'நீங்கள் கேட்டது:', backToLesson: 'பாடத்துக்குத் திரும்பு', notQuite: 'சரியில்லை.',
    emptySpace: 'அது வெற்று இடம்.', notThat: 'அது இல்லை.', tryAgain: 'மீண்டும் முயலுங்கள்', prevStep: 'முந்தைய படி', ask: 'கேள்', askPlaceholder: 'இதைப் பற்றி எதையும் கேளுங்கள்', showMe: 'காட்டு', shownNote: 'உங்களுக்காகக் காட்டப்பட்டது.',
    cont: 'தொடர்', finish: 'பாடத்தை முடி', nextLesson: 'அடுத்த பாடம்', praise: ['சரியாகச் சொன்னீர்கள்.', 'அருமை.', 'சரி.', 'மிகச் சரி.', 'ஆம்.', 'அதுதான்.'], close: 'மூடு', lessons: 'பாடங்கள்', level: 'நிலை', sources: 'ஆதாரங்கள்',
    disclaimer: 'ProfAI ஒவ்வொரு பாடத்தையும் AI மூலம் எழுதுகிறது. தவறுகள் இருக்கலாம்; முக்கியமானவற்றை ஆதாரங்களுடன் சரிபாருங்கள்.',
    drawing: (n) => `பாடம் ${n} வரையப்படுகிறது`, drawingWait: 'பொதுவாக 10 முதல் 20 வினாடிகள். அதுவரை இந்தப் பாடம் எதைப் பற்றியது என்று படியுங்கள்.', doFirst: 'முதலில் மேலே உள்ள படியைச் செய்யுங்கள், அல்லது காட்டு என்பதைத் தட்டுங்கள்.',
    courseDone: 'பாடநெறி முடிந்தது', startOver: 'மீண்டும் தொடங்கு', share: 'பகிர்', copied: 'இணைப்பு நகலெடுக்கப்பட்டது', thinking: 'யோசிக்கிறது',
  },
};
