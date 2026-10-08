// Логика демо «Формы тензоров в SimpleSelfAttention» (модуль 8, урок «Код»).
// Повторяет forward урока 6: x → (unsqueeze) → K.transpose → Q @ K^T → softmax → @ V → (squeeze).
// Чистые функции без DOM - сверяются с golden.json.
export const MAX_B = 4;
export const MAX_L = 8;
export const DIMS = [3, 4, 8, 16];

const size = (dims) => `torch.Size([${dims.join(", ")}])`;

/** Шаги forward с формами: batched - вход [B, L, D], иначе [L, D] (B не используется). */
export function chain(B, L, D, batched) {
  const lead = batched ? [B] : [1];
  const rows = batched
    ? [{ code: "x", shape: size([B, L, D]) }]
    : [{ code: "x", shape: size([L, D]) }, { code: "x.unsqueeze(0)", shape: size([1, L, D]) }];
  rows.push(
    { code: "K.transpose(-2, -1)", shape: size([...lead, D, L]) },
    { code: "Q @ K^T", shape: size([...lead, L, L]) },
    { code: "softmax(dim=-1)", shape: size([...lead, L, L]) },
    { code: "weights @ V", shape: size([...lead, L, D]) },
  );
  if (!batched) rows.push({ code: "squeeze(0)", shape: size([L, D]) });
  return rows;
}
