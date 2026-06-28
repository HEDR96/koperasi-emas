export const PAYMENT_METHODS = [
  { value: "QRIS",                label: "QRIS" },
  { value: "Tunai",               label: "Tunai" },
  { value: "Kartu Kredit",        label: "Kartu Kredit" },
  { value: "BSI - 7339222996",    label: "BSI - 7339222996" },
];

export const PAYMENT_METHOD_VALUES = PAYMENT_METHODS.map(m => m.value);
export const DEFAULT_PAYMENT_METHOD = PAYMENT_METHODS[0].value;
