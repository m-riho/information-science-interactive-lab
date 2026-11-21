// The two integers are deliberately small so learners can check their sum.
const words = ["太郎", "が", "花子", "を", "追う"] as const;
type Word = typeof words[number];
const codes: Record<Word, number> = { 太郎: 10, が: 20, 花子: 30, を: 40, 追う: 50 };

export function sentenceRepresentation(swapped: boolean, withPosition: boolean) {
  const sequence: readonly Word[] = swapped ? ["花子", "が", "太郎", "を", "追う"] : words;
  const rows = words.map(word => {
    const position = sequence.indexOf(word) + 1;
    const token = [codes[word], 0] as const;
    // Add one toy position vector (0, i) to the token vector.
    return { word, position, token, vector: [token[0], withPosition ? position : 0] as const };
  });
  return { sequence, rows, sentence: sequence.join("") };
}
