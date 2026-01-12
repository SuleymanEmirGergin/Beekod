import { parseMessage, detectLocale } from "../src/services/nlp.js";

const debugInputs = [
    { msg: 'Barkodu 123 olan urunun fiyatini 100 yap', localeHint: undefined }, // Should detect TR
    { msg: 'Set price to 100 for barcode 123', localeHint: undefined }, // Should detect EN
    { msg: 'Setze Preis auf 100 fur Barcode 123', localeHint: undefined }, // Should detect DE
    { msg: 'Mettre prix a 100 pour code-barres 123', localeHint: undefined }, // Should detect FR
    { msg: 'Fijar precio a 100 para codigo 123', localeHint: undefined }, // Should detect ES
    { msg: 'Tavsiye ver', localeHint: undefined }, // Should detect TR, Intent: report.advice
    { msg: 'Suggest specific strategy', localeHint: undefined } // Should detect EN, Intent: report.advice
];

console.log("--- NLP Locale & Intent Debug ---");
debugInputs.forEach(({ msg, localeHint }) => {
    const result = parseMessage(msg, localeHint as any);
    console.log(`\nMsg: "${msg}"`);
    console.log(`Detected Locale: ${result.locale}`);
    console.log(`Detected Intent: ${result.intent}`);
});
