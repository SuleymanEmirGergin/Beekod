import { XMLParser } from "fast-xml-parser";
import fs from "fs";

const xmlData = fs.readFileSync("pttavm_full_response.xml", "utf-8");

const parser = new XMLParser({
  ignoreAttributes: false,
  removeNSPrefix: true,
  parseAttributeValue: true,
});

const parsed = parser.parse(xmlData);
const envelope = parsed.Envelope || parsed;
const body = envelope.Body || envelope;
const response = body.StokKontrolListesiResponse;
const result = response?.StokKontrolListesiResult;

console.log("Structure Check:");
console.log("Has Response:", !!response);
console.log("Has Result:", !!result);
if (result) {
    console.log("Result Keys:", Object.keys(result));
    const detays = result.StokKontrolDetay;
    console.log("StokKontrolDetay type:", typeof detays);
    if (Array.isArray(detays)) {
        console.log("StokKontrolDetay Count:", detays.length);
        console.log("First item sample:", JSON.stringify(detays[0]).substring(0, 200));
    } else {
        console.log("StokKontrolDetay is NOT an array");
    }
}
