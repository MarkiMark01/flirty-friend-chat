export type ForbiddenPair = {
  w1: string;
  w2: string;
  maxDistance: number;
};

export const forbiddenPairs: ForbiddenPair[] = [
  { w1: "buy", w2: "drugs", maxDistance: 3 },
  { w1: "sell", w2: "drugs", maxDistance: 3 },
  { w1: "hack", w2: "system", maxDistance: 5 },
];

export function normalizeText(text: string): string[] {

  let t = text.toLowerCase();

  t = t.replace(/0/g, "o").replace(/[1!]/g, "l");

  t = t.replace(/([a-z])\1+/g, "$1");

  return t.split(/[\s,.!?:;_\/-]+/).filter(Boolean); 
}
export function checkForbiddenPairs(text: string): ForbiddenPair[] {
  const words = normalizeText(text);

  const violations: ForbiddenPair[] = [];

  forbiddenPairs.forEach((pair) => {
    const i1 = words
      .map((w, idx) => (w === pair.w1 ? idx : -1))
      .filter((i) => i >= 0);

    const i2 = words
      .map((w, idx) => (w === pair.w2 ? idx : -1))
      .filter((i) => i >= 0);

    i1.forEach((a) =>
      i2.forEach((b) => {
        const dist = Math.abs(a - b) - 1;

        if (dist <= pair.maxDistance) {
          violations.push(pair);
        }
      })
    );
  });

  return violations;
}
