export type CargoCompany = {
  id: number;
  code: string;
  name: string;
  taxNumber: string;
};

export const CARGO_COMPANIES: CargoCompany[] = [
  { id: 38, code: "SENDEOMP", name: "Kolay Gelsin Marketplace", taxNumber: "2910804196" },
  { id: 30, code: "BORMP", name: "Borusan Lojistik Marketplace", taxNumber: "1800038254" },
  { id: 10, code: "DHLECOMMP", name: "DHL eCommerce Marketplace", taxNumber: "6080712084" },
  { id: 19, code: "PTTMP", name: "PTT Kargo Marketplace", taxNumber: "7320068060" },
  { id: 9, code: "SURATMP", name: "Surat Kargo Marketplace", taxNumber: "7870233582" },
  { id: 17, code: "TEXMP", name: "Trendyol Express Marketplace", taxNumber: "8590921777" },
  { id: 6, code: "HOROZMP", name: "Horoz Kargo Marketplace", taxNumber: "4630097122" },
  { id: 20, code: "CEVAMP", name: "CEVA Marketplace", taxNumber: "8450298557" },
  { id: 4, code: "YKMP", name: "Yurtici Kargo Marketplace", taxNumber: "3130557669" },
  { id: 7, code: "ARASMP", name: "Aras Kargo Marketplace", taxNumber: "720039666" },
];
