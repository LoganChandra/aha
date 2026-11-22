// Wording notes for a language, shared by the planner and the lesson writer.
// Wording a native speaker flagged (panel 2026-10-29, Nurul, a Malay-speaking nurse).
export function langNotes(lang?: string): string {
  if (!lang || !/^malay/i.test(lang)) return '';
  return '\nMalay wording: polite everyday Malay with "tidak", one register throughout. "Ketik" for tap, "Seret" for drag, "Gerakkan peluncur" for a slider (never "Tarik slaid"). Give the real term once in brackets: "askar badan (sel darah putih)". Malaysian Malay, not Indonesian ("imuniti kelompok", not "kekebalan kelompok"). Avoid heavy or wrong metaphors ("penjenayah", "kebal", "hafal", "kekal"); prefer "kuman", "imun", "ingat", "mengenali".';
}

