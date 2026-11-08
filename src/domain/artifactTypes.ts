/** Building type keys in display order. Built-in artifacts get theirs from src/content/artifact-types.json (scripts/artifact-types.mjs). */
export const TYPE_LABELS: [string, string][] = [
  ['cami', 'Cami ve mescit'], ['turbe', 'Türbe ve hazire'], ['kulliye', 'Külliye'], ['medrese', 'Medrese ve mektep'],
  ['han', 'Han ve çarşı'], ['hamam', 'Hamam'], ['su', 'Çeşme ve su yapısı'], ['tekke', 'Tekke ve zaviye'],
  ['kilise', 'Kilise'], ['imaret', 'İmaret ve darüşşifa'], ['sivil', 'Sivil yapı'], ['diger', 'Diğer'],
]
export const TYPE_KEYS = TYPE_LABELS.map(([k]) => k)
export const typeLabel = (key: string) => TYPE_LABELS.find(([k]) => k === key)?.[1] ?? key
