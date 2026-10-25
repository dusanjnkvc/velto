/* Velto offline payment QR. bysquare 4.1.0 (Apache-2.0), lzma1 0.4.0 (Apache-2.0),
 * validator 13.15.35 (MIT), qr-esm 1.2.0 (MIT; original qr.js CC0).
 * Source refs and license texts are shipped beside this file. */
(function(root){'use strict';
const modules={
"bysquare/src/base32hex.ts":function(module,exports,require){
const base32Hex = {
    chars: "0123456789ABCDEFGHIJKLMNOPQRSTUV",
    bits: 5,
    mask: 0b11111
};
function encode(input, addPadding = true) {
    const output = Array();
    let buffer = 0;
    let bitsLeft = 0;
    for(let i = 0; i < input.length; i++){
        buffer = buffer << 8 | input[i];
        bitsLeft += 8;
        while(bitsLeft >= base32Hex.bits){
            bitsLeft -= base32Hex.bits;
            const index = buffer >> bitsLeft & base32Hex.mask;
            output.push(base32Hex.chars[index]);
        }
    }
    if (bitsLeft > 0) {
        const maskedValue = buffer << base32Hex.bits - bitsLeft & base32Hex.mask;
        output.push(base32Hex.chars[maskedValue]);
    }
    let base32hex = output.join("");
    if (addPadding) {
        const paddedLength = Math.ceil(base32hex.length / 8) * 8;
        base32hex = base32hex.padEnd(paddedLength, "=");
    }
    return base32hex;
}
function decode(input, isLoose = false) {
    if (isLoose) {
        input = input.toUpperCase();
        const paddingNeeded = (8 - input.length % 8) % 8;
        input += "=".repeat(paddingNeeded);
    }
    input = input.replace(/=+$/, "");
    const output = Array();
    let buffer = 0;
    let bitsLeft = 0;
    for(let i = 0; i < input.length; i++){
        const index = base32Hex.chars.indexOf(input[i]);
        if (index === -1) {
            throw new Error("Invalid base32hex string");
        }
        buffer = buffer << base32Hex.bits | index;
        bitsLeft += base32Hex.bits;
        if (bitsLeft >= 8) {
            bitsLeft -= 8;
            output.push(buffer >> bitsLeft & 0xFF);
        }
    }
    return Uint8Array.from(output);
}

exports["encode"]=encode;
exports["decode"]=decode;
},
"bysquare/src/classifier.ts":function(module,exports,require){
function encodeOptions(options) {
    return options.reduce((sum, option)=>sum + option, 0);
}
function decodeOptions(sum) {
    const classifiers = [];
    if (sum === 0) return [];
    const totalOptions = Math.floor(Math.log2(sum)) + 1;
    for(let i = 1; i <= totalOptions; i++){
        const next = Math.pow(2, totalOptions - i);
        if (next <= sum) {
            sum = sum - next;
            classifiers.push(next);
        }
    }
    return classifiers;
}

exports["encodeOptions"]=encodeOptions;
exports["decodeOptions"]=decodeOptions;
},
"bysquare/src/crc32.ts":function(module,exports,require){
const {CRC32_TABLE}=require("lzma1/src/index.ts");
function crc32(data) {
    let crc = 0 ^ -1;
    const encoded = new TextEncoder().encode(data);
    for(let i = 0; i < encoded.length; i++){
        crc = crc >>> 8 ^ CRC32_TABLE[(crc ^ encoded[i]) & 0xFF];
    }
    return (crc ^ -1) >>> 0;
}

exports["crc32"]=crc32;
},
"bysquare/src/deburr.ts":function(module,exports,require){
const deburredLettersMap = {
    '\xc0': 'A',
    '\xc1': 'A',
    '\xc2': 'A',
    '\xc3': 'A',
    '\xc4': 'A',
    '\xc5': 'A',
    '\xe0': 'a',
    '\xe1': 'a',
    '\xe2': 'a',
    '\xe3': 'a',
    '\xe4': 'a',
    '\xe5': 'a',
    '\xc7': 'C',
    '\xe7': 'c',
    '\xd0': 'D',
    '\xf0': 'd',
    '\xc8': 'E',
    '\xc9': 'E',
    '\xca': 'E',
    '\xcb': 'E',
    '\xe8': 'e',
    '\xe9': 'e',
    '\xea': 'e',
    '\xeb': 'e',
    '\xcc': 'I',
    '\xcd': 'I',
    '\xce': 'I',
    '\xcf': 'I',
    '\xec': 'i',
    '\xed': 'i',
    '\xee': 'i',
    '\xef': 'i',
    '\xd1': 'N',
    '\xf1': 'n',
    '\xd2': 'O',
    '\xd3': 'O',
    '\xd4': 'O',
    '\xd5': 'O',
    '\xd6': 'O',
    '\xd8': 'O',
    '\xf2': 'o',
    '\xf3': 'o',
    '\xf4': 'o',
    '\xf5': 'o',
    '\xf6': 'o',
    '\xf8': 'o',
    '\xd9': 'U',
    '\xda': 'U',
    '\xdb': 'U',
    '\xdc': 'U',
    '\xf9': 'u',
    '\xfa': 'u',
    '\xfb': 'u',
    '\xfc': 'u',
    '\xdd': 'Y',
    '\xfd': 'y',
    '\xff': 'y',
    '\xc6': 'Ae',
    '\xe6': 'ae',
    '\xde': 'Th',
    '\xfe': 'th',
    '\xdf': 'ss',
    '\u0100': 'A',
    '\u0102': 'A',
    '\u0104': 'A',
    '\u0101': 'a',
    '\u0103': 'a',
    '\u0105': 'a',
    '\u0106': 'C',
    '\u0108': 'C',
    '\u010a': 'C',
    '\u010c': 'C',
    '\u0107': 'c',
    '\u0109': 'c',
    '\u010b': 'c',
    '\u010d': 'c',
    '\u010e': 'D',
    '\u0110': 'D',
    '\u010f': 'd',
    '\u0111': 'd',
    '\u0112': 'E',
    '\u0114': 'E',
    '\u0116': 'E',
    '\u0118': 'E',
    '\u011a': 'E',
    '\u0113': 'e',
    '\u0115': 'e',
    '\u0117': 'e',
    '\u0119': 'e',
    '\u011b': 'e',
    '\u011c': 'G',
    '\u011e': 'G',
    '\u0120': 'G',
    '\u0122': 'G',
    '\u011d': 'g',
    '\u011f': 'g',
    '\u0121': 'g',
    '\u0123': 'g',
    '\u0124': 'H',
    '\u0126': 'H',
    '\u0125': 'h',
    '\u0127': 'h',
    '\u0128': 'I',
    '\u012a': 'I',
    '\u012c': 'I',
    '\u012e': 'I',
    '\u0130': 'I',
    '\u0129': 'i',
    '\u012b': 'i',
    '\u012d': 'i',
    '\u012f': 'i',
    '\u0131': 'i',
    '\u0134': 'J',
    '\u0135': 'j',
    '\u0136': 'K',
    '\u0137': 'k',
    '\u0138': 'k',
    '\u0139': 'L',
    '\u013b': 'L',
    '\u013d': 'L',
    '\u013f': 'L',
    '\u0141': 'L',
    '\u013a': 'l',
    '\u013c': 'l',
    '\u013e': 'l',
    '\u0140': 'l',
    '\u0142': 'l',
    '\u0143': 'N',
    '\u0145': 'N',
    '\u0147': 'N',
    '\u014a': 'N',
    '\u0144': 'n',
    '\u0146': 'n',
    '\u0148': 'n',
    '\u014b': 'n',
    '\u014c': 'O',
    '\u014e': 'O',
    '\u0150': 'O',
    '\u014d': 'o',
    '\u014f': 'o',
    '\u0151': 'o',
    '\u0154': 'R',
    '\u0156': 'R',
    '\u0158': 'R',
    '\u0155': 'r',
    '\u0157': 'r',
    '\u0159': 'r',
    '\u015a': 'S',
    '\u015c': 'S',
    '\u015e': 'S',
    '\u0160': 'S',
    '\u015b': 's',
    '\u015d': 's',
    '\u015f': 's',
    '\u0161': 's',
    '\u0162': 'T',
    '\u0164': 'T',
    '\u0166': 'T',
    '\u0163': 't',
    '\u0165': 't',
    '\u0167': 't',
    '\u0168': 'U',
    '\u016a': 'U',
    '\u016c': 'U',
    '\u016e': 'U',
    '\u0170': 'U',
    '\u0172': 'U',
    '\u0169': 'u',
    '\u016b': 'u',
    '\u016d': 'u',
    '\u016f': 'u',
    '\u0171': 'u',
    '\u0173': 'u',
    '\u0174': 'W',
    '\u0175': 'w',
    '\u0176': 'Y',
    '\u0177': 'y',
    '\u0178': 'Y',
    '\u0179': 'Z',
    '\u017b': 'Z',
    '\u017d': 'Z',
    '\u017a': 'z',
    '\u017c': 'z',
    '\u017e': 'z',
    '\u0132': 'IJ',
    '\u0133': 'ij',
    '\u0152': 'Oe',
    '\u0153': 'oe',
    '\u0149': "'n",
    '\u017f': 'ss'
};
function deburrLetter(key) {
    return deburredLettersMap[key];
}
function isCombiningMark(charCode) {
    return charCode >= 0x0300 && charCode <= 0x036f || charCode >= 0xfe20 && charCode <= 0xfe23 || charCode >= 0x20d0 && charCode <= 0x20f0;
}
function deburr(text) {
    let result = "";
    for (const char of text){
        const replacement = deburrLetter(char);
        if (replacement) {
            result += replacement;
        } else if (!isCombiningMark(char.charCodeAt(0))) {
            result += char;
        }
    }
    return result;
}

exports["deburrLetter"]=deburrLetter;
exports["deburr"]=deburr;
},
"bysquare/src/errors.ts":function(module,exports,require){
class ValidationError extends Error {
    path;
    constructor(message, path){
        super(message);
        this.name = this.constructor.name;
        this.path = path;
    }
}

exports["ValidationError"]=ValidationError;
},
"bysquare/src/field.ts":function(module,exports,require){
const validator=require("validator/index.js").default;
function sanitize(value) {
    return value?.replaceAll("\t", " ");
}
const MAX_DECIMALS = 8;
function formatDecimal(value) {
    return value === undefined ? undefined : Number(value.toFixed(MAX_DECIMALS)).toString();
}
function decodeNumber(value) {
    return value?.length ? Number(value) : undefined;
}
function decodeString(value) {
    return value?.length ? value : undefined;
}
function isValidDate(date) {
    if (!/^\d{8}$/.test(date)) {
        return false;
    }
    const isoFormat = `${date.substring(0, 4)}-${date.substring(4, 6)}-${date.substring(6, 8)}`;
    return validator.isDate(isoFormat, {
        format: "YYYY-MM-DD",
        strictMode: true,
        delimiters: [
            "-"
        ]
    });
}

exports["sanitize"]=sanitize;
exports["formatDecimal"]=formatDecimal;
exports["decodeNumber"]=decodeNumber;
exports["decodeString"]=decodeString;
exports["isValidDate"]=isValidDate;
},
"bysquare/src/header.ts":function(module,exports,require){
const {crc32}=require("bysquare/src/crc32.ts");
const EncodeErrorMessage = {
    BySquareType: "Invalid BySquareType value in header, valid range <0,15>",
    Version: "Invalid Version value in header",
    DocumentType: "Invalid DocumentType value in header, valid range <0,15>",
    Reserved: "Invalid Reserved value in header, valid range <0,15>",
    HeaderDataSize: "Allowed header data size exceeded"
};
class EncodeError extends Error {
    extensions;
    constructor(message, extensions){
        super(message);
        this.name = this.constructor.name;
        if (extensions) {
            this.extensions = extensions;
        }
    }
}
const DecodeErrorMessage = {
    MissingIBAN: "IBAN is missing",
    LZMADecompressionFailed: "LZMA decompression failed",
    UnsupportedVersion: "Unsupported version"
};
class DecodeError extends Error {
    extensions;
    constructor(message, extensions){
        super(message);
        this.name = this.constructor.name;
        if (extensions) {
            this.extensions = extensions;
        }
    }
}
const MAX_COMPRESSED_SIZE = 131_072;
function buildBysquareHeader(header = [
    0x00,
    0x00,
    0x00,
    0x00
]) {
    if (header[0] < 0 || header[0] > 15) {
        throw new EncodeError(EncodeErrorMessage.BySquareType, {
            invalidValue: header[0]
        });
    }
    if (header[1] < 0 || header[1] > 15) {
        throw new EncodeError(EncodeErrorMessage.Version, {
            invalidValue: header[1]
        });
    }
    if (header[2] < 0 || header[2] > 15) {
        throw new EncodeError(EncodeErrorMessage.DocumentType, {
            invalidValue: header[2]
        });
    }
    if (header[3] < 0 || header[3] > 15) {
        throw new EncodeError(EncodeErrorMessage.Reserved, {
            invalidValue: header[3]
        });
    }
    const [bySquareType, version, documentType, reserved] = header;
    const mergedNibbles = [
        bySquareType << 4 | version << 0,
        documentType << 4 | reserved << 0
    ];
    return mergedNibbles;
}
function decodeHeader(header) {
    const bytes = header[0] << 8 | header[1];
    const bysquareType = bytes >> 12;
    const version = bytes >> 8 & 0b0000_1111;
    const documentType = bytes >> 4 & 0b0000_1111;
    const reserved = bytes & 0b0000_1111;
    return {
        bysquareType,
        version,
        documentType,
        reserved
    };
}
function buildPayloadLength(length) {
    if (length >= MAX_COMPRESSED_SIZE) {
        throw new EncodeError(EncodeErrorMessage.HeaderDataSize, {
            actualSize: length,
            allowedSize: MAX_COMPRESSED_SIZE
        });
    }
    const header = new ArrayBuffer(2);
    new DataView(header).setUint16(0, length, true);
    return new Uint8Array(header);
}
function addChecksum(tabbedPayload) {
    const checksum = new ArrayBuffer(4);
    new DataView(checksum).setUint32(0, crc32(tabbedPayload), true);
    const byteArray = new TextEncoder().encode(tabbedPayload);
    return Uint8Array.from([
        ...new Uint8Array(checksum),
        ...Uint8Array.from(byteArray)
    ]);
}

exports["EncodeErrorMessage"]=EncodeErrorMessage;
exports["EncodeError"]=EncodeError;
exports["DecodeErrorMessage"]=DecodeErrorMessage;
exports["DecodeError"]=DecodeError;
exports["MAX_COMPRESSED_SIZE"]=MAX_COMPRESSED_SIZE;
exports["buildBysquareHeader"]=buildBysquareHeader;
exports["decodeHeader"]=decodeHeader;
exports["buildPayloadLength"]=buildPayloadLength;
exports["addChecksum"]=addChecksum;
},
"bysquare/src/lzma.ts":function(module,exports,require){
const lzma1=require("lzma1/src/index.ts");
const {DecodeError,DecodeErrorMessage}=require("bysquare/src/header.ts");
const HEADER_SIZE = 13;
function compress(data) {
    return lzma1.compress(data).subarray(HEADER_SIZE);
}
function decompress(body, uncompressedSize) {
    const header = new Uint8Array(HEADER_SIZE);
    const view = new DataView(header.buffer);
    header[0] = 0x5D;
    view.setUint32(1, 131_072, true);
    view.setUint32(5, uncompressedSize, true);
    let decompressed;
    try {
        decompressed = lzma1.decompress(new Uint8Array([
            ...header,
            ...body
        ]));
    } catch (error) {
        throw new DecodeError(DecodeErrorMessage.LZMADecompressionFailed, {
            error
        });
    }
    if (!decompressed) {
        throw new DecodeError(DecodeErrorMessage.LZMADecompressionFailed, {
            error: "Decompression returned undefined"
        });
    }
    return decompressed;
}

exports["compress"]=compress;
exports["decompress"]=decompress;
},
"bysquare/src/pay/encode.ts":function(module,exports,require){
const base32hex=require("bysquare/src/base32hex.ts");
const {deburr}=require("bysquare/src/deburr.ts");
const {formatDecimal,sanitize}=require("bysquare/src/field.ts");
const {addChecksum,buildBysquareHeader,buildPayloadLength}=require("bysquare/src/header.ts");
const lzma=require("bysquare/src/lzma.ts");
const {Version}=require("bysquare/src/types.ts");
const {DataModel,Month,PaymentOptions}=require("bysquare/src/pay/types.ts");
const {validateDataModel}=require("bysquare/src/pay/validations.ts");
function serialize(data) {
    const s = new Array();
    s.push(sanitize(data.invoiceId?.toString()));
    s.push(data.payments.length.toString());
    for (const p of data.payments){
        s.push(p.type.toString());
        s.push(formatDecimal(p.amount));
        s.push(sanitize(p.currencyCode));
        s.push(sanitize(p.paymentDueDate));
        s.push(sanitize(p.variableSymbol));
        s.push(sanitize(p.constantSymbol));
        s.push(sanitize(p.specificSymbol));
        s.push(sanitize(p.originatorsReferenceInformation));
        s.push(sanitize(p.paymentNote));
        s.push(p.bankAccounts.length.toString());
        for (const ba of p.bankAccounts){
            s.push(sanitize(ba.iban));
            s.push(sanitize(ba.bic));
        }
        if (p.type === PaymentOptions.StandingOrder) {
            s.push("1");
            s.push(p.day?.toString());
            const monthValue = p.month;
            if (typeof monthValue === "string") {
                s.push(Month[monthValue]?.toString());
            } else {
                s.push(monthValue?.toString());
            }
            s.push(sanitize(p.periodicity));
            s.push(sanitize(p.lastDate));
        } else {
            s.push("0");
        }
        if (p.type === PaymentOptions.DirectDebit) {
            s.push("1");
            s.push(p.directDebitScheme?.toString());
            s.push(p.directDebitType?.toString());
            s.push(sanitize(p.ddVariableSymbol?.toString()));
            s.push(sanitize(p.ddSpecificSymbol?.toString()));
            s.push(sanitize(p.ddOriginatorsReferenceInformation?.toString()));
            s.push(sanitize(p.mandateId?.toString()));
            s.push(sanitize(p.creditorId?.toString()));
            s.push(sanitize(p.contractId?.toString()));
            s.push(formatDecimal(p.maxAmount));
            s.push(sanitize(p.validTillDate?.toString()));
        } else {
            s.push("0");
        }
    }
    for (const p of data.payments){
        s.push(sanitize(p.beneficiary?.name));
        s.push(sanitize(p.beneficiary?.street));
        s.push(sanitize(p.beneficiary?.city));
    }
    return s.join("\t");
}
function removeDiacritics(model) {
    for (const payment of model.payments){
        if (payment.paymentNote) {
            payment.paymentNote = deburr(payment.paymentNote);
        }
        if (payment.beneficiary?.name) {
            payment.beneficiary.name = deburr(payment.beneficiary.name);
        }
        if (payment.beneficiary?.city) {
            payment.beneficiary.city = deburr(payment.beneficiary.city);
        }
        if (payment.beneficiary?.street) {
            payment.beneficiary.street = deburr(payment.beneficiary.street);
        }
    }
}
function encode(model, options = {
    deburr: true,
    validate: true
}) {
    if (options.deburr) {
        removeDiacritics(model);
    }
    const version = options.version ?? Version["1.2.0"];
    if (options.validate) {
        validateDataModel(model, version);
    }
    const payloadTabbed = serialize(model);
    const payloadChecked = addChecksum(payloadTabbed);
    const lzmaBody = lzma.compress(payloadChecked);
    const output = new Uint8Array([
        ...buildBysquareHeader([
            0x00,
            version,
            0x00,
            0x00
        ]),
        ...buildPayloadLength(payloadChecked.byteLength),
        ...lzmaBody
    ]);
    return base32hex.encode(output, false);
}

exports["serialize"]=serialize;
exports["removeDiacritics"]=removeDiacritics;
exports["encode"]=encode;
},
"bysquare/src/pay/types.ts":function(module,exports,require){
const Month = {
    January: 0b00000000000001,
    February: 0b00000000000010,
    March: 0b00000000000100,
    April: 0b00000000001000,
    May: 0b00000000010000,
    June: 0b00000000100000,
    July: 0b00000001000000,
    August: 0b00000010000000,
    September: 0b00000100000000,
    October: 0b00001000000000,
    November: 0b00010000000000,
    December: 0b00100000000000
};
const Periodicity = {
    Daily: "d",
    Weekly: "w",
    Biweekly: "b",
    Monthly: "m",
    Bimonthly: "B",
    Quarterly: "q",
    Semiannually: "s",
    Annually: "a"
};
const PaymentOptions = {
    PaymentOrder: 0b00000001,
    StandingOrder: 0b00000010,
    DirectDebit: 0b00000100
};
const DirectDebitScheme = {
    Other: 0x00,
    Sepa: 0x01
};
const DirectDebitType = {
    OneOff: 0x00,
    Recurrent: 0x01
};
const CurrencyCode = {
    AED: "AED",
    AFN: "AFN",
    ALL: "ALL",
    AMD: "AMD",
    ANG: "ANG",
    AOA: "AOA",
    ARS: "ARS",
    AUD: "AUD",
    AWG: "AWG",
    AZN: "AZN",
    BAM: "BAM",
    BBD: "BBD",
    BDT: "BDT",
    BGN: "BGN",
    BHD: "BHD",
    BIF: "BIF",
    BMD: "BMD",
    BND: "BND",
    BOB: "BOB",
    BRL: "BRL",
    BSD: "BSD",
    BTN: "BTN",
    BWP: "BWP",
    BYN: "BYN",
    BZD: "BZD",
    CAD: "CAD",
    CDF: "CDF",
    CHF: "CHF",
    CLP: "CLP",
    CNY: "CNY",
    COP: "COP",
    CRC: "CRC",
    CUC: "CUC",
    CUP: "CUP",
    CVE: "CVE",
    CZK: "CZK",
    DJF: "DJF",
    DKK: "DKK",
    DOP: "DOP",
    DZD: "DZD",
    EGP: "EGP",
    ERN: "ERN",
    ETB: "ETB",
    EUR: "EUR",
    FJD: "FJD",
    FKP: "FKP",
    GBP: "GBP",
    GEL: "GEL",
    GHS: "GHS",
    GIP: "GIP",
    GMD: "GMD",
    GNF: "GNF",
    GTQ: "GTQ",
    GYD: "GYD",
    HKD: "HKD",
    HNL: "HNL",
    HRK: "HRK",
    HTG: "HTG",
    HUF: "HUF",
    IDR: "IDR",
    ILS: "ILS",
    INR: "INR",
    IQD: "IQD",
    IRR: "IRR",
    ISK: "ISK",
    JMD: "JMD",
    JOD: "JOD",
    JPY: "JPY",
    KES: "KES",
    KGS: "KGS",
    KHR: "KHR",
    KMF: "KMF",
    KPW: "KPW",
    KRW: "KRW",
    KWD: "KWD",
    KYD: "KYD",
    KZT: "KZT",
    LAK: "LAK",
    LBP: "LBP",
    LKR: "LKR",
    LRD: "LRD",
    LSL: "LSL",
    LYD: "LYD",
    MAD: "MAD",
    MDL: "MDL",
    MGA: "MGA",
    MKD: "MKD",
    MMK: "MMK",
    MNT: "MNT",
    MOP: "MOP",
    MRU: "MRU",
    MUR: "MUR",
    MVR: "MVR",
    MWK: "MWK",
    MXN: "MXN",
    MYR: "MYR",
    MZN: "MZN",
    NAD: "NAD",
    NGN: "NGN",
    NIO: "NIO",
    NOK: "NOK",
    NPR: "NPR",
    NZD: "NZD",
    OMR: "OMR",
    PAB: "PAB",
    PEN: "PEN",
    PGK: "PGK",
    PHP: "PHP",
    PKR: "PKR",
    PLN: "PLN",
    PYG: "PYG",
    QAR: "QAR",
    RON: "RON",
    RSD: "RSD",
    RUB: "RUB",
    RWF: "RWF",
    SAR: "SAR",
    SBD: "SBD",
    SCR: "SCR",
    SDG: "SDG",
    SEK: "SEK",
    SGD: "SGD",
    SHP: "SHP",
    SLL: "SLL",
    SOS: "SOS",
    SRD: "SRD",
    SSP: "SSP",
    STN: "STN",
    SVC: "SVC",
    SYP: "SYP",
    SZL: "SZL",
    THB: "THB",
    TJS: "TJS",
    TMT: "TMT",
    TND: "TND",
    TOP: "TOP",
    TRY: "TRY",
    TTD: "TTD",
    TWD: "TWD",
    TZS: "TZS",
    UAH: "UAH",
    UGX: "UGX",
    USD: "USD",
    UYU: "UYU",
    UZS: "UZS",
    VES: "VES",
    VND: "VND",
    VUV: "VUV",
    WST: "WST",
    XAF: "XAF",
    XCD: "XCD",
    XOF: "XOF",
    XPF: "XPF",
    YER: "YER",
    ZAR: "ZAR",
    ZMW: "ZMW",
    ZWL: "ZWL"
};

exports["Month"]=Month;
exports["Periodicity"]=Periodicity;
exports["PaymentOptions"]=PaymentOptions;
exports["DirectDebitScheme"]=DirectDebitScheme;
exports["DirectDebitType"]=DirectDebitType;
exports["CurrencyCode"]=CurrencyCode;
},
"bysquare/src/pay/validations.ts":function(module,exports,require){
const validator=require("validator/index.js").default;
const {ValidationError}=require("bysquare/src/errors.ts");
const {isValidDate}=require("bysquare/src/field.ts");
const {Version}=require("bysquare/src/types.ts");
const {BankAccount,DataModel,PaymentOptions}=require("bysquare/src/pay/types.ts");
const ErrorMessages = {
    IBAN: "Invalid IBAN. Make sure ISO 13616 format is used.",
    BIC: "Invalid BIC. Make sure ISO 9362 format is used.",
    CurrencyCode: "Invalid currency code. Make sure ISO 4217 format is used.",
    Date: "Invalid date. Make sure YYYYMMDD format is used.",
    BeneficiaryName: "Beneficiary name is required."
};
function validateBankAccount(bankAccount, path) {
    if (!validator.isIBAN(bankAccount.iban)) {
        throw new ValidationError(ErrorMessages.IBAN, `${path}.iban`);
    }
    if (bankAccount.bic && !validator.isBIC(bankAccount.bic)) {
        throw new ValidationError(ErrorMessages.BIC, `${path}.bic`);
    }
}
function validateSimplePayment(simplePayment, path, version = Version["1.2.0"]) {
    for (const [index, bankAccount] of simplePayment.bankAccounts.entries()){
        validateBankAccount(bankAccount, `${path}.bankAccounts[${index}]`);
    }
    if (simplePayment.currencyCode && !validator.isISO4217(simplePayment.currencyCode)) {
        throw new ValidationError(ErrorMessages.CurrencyCode, `${path}.currencyCode`);
    }
    if (simplePayment.paymentDueDate && !isValidDate(simplePayment.paymentDueDate)) {
        throw new ValidationError(ErrorMessages.Date, `${path}.paymentDueDate`);
    }
    if (simplePayment.type === PaymentOptions.StandingOrder && simplePayment.lastDate && !isValidDate(simplePayment.lastDate)) {
        throw new ValidationError(ErrorMessages.Date, `${path}.lastDate`);
    }
    if (simplePayment.type === PaymentOptions.DirectDebit && simplePayment.validTillDate && !isValidDate(simplePayment.validTillDate)) {
        throw new ValidationError(ErrorMessages.Date, `${path}.validTillDate`);
    }
    if (version >= Version["1.2.0"] && !simplePayment.beneficiary?.name) {
        throw new ValidationError(ErrorMessages.BeneficiaryName, `${path}.beneficiary.name`);
    }
}
function validateDataModel(dataModel, version = Version["1.2.0"]) {
    for (const [index, payment] of dataModel.payments.entries()){
        validateSimplePayment(payment, `payments[${index}]`, version);
    }
    return dataModel;
}

exports["validateBankAccount"]=validateBankAccount;
exports["validateSimplePayment"]=validateSimplePayment;
exports["validateDataModel"]=validateDataModel;
},
"bysquare/src/types.ts":function(module,exports,require){
const Version = {
    "1.0.0": 0x00,
    "1.1.0": 0x01,
    "1.2.0": 0x02
};

exports["Version"]=Version;
},
"lzma1/src/alone-decoder.ts":function(module,exports,require){
const {decodeHeader,HEADER_SIZE,UNKNOWN_SIZE}=require("lzma1/src/header.ts");
const {LzDecoder}=require("lzma1/src/lz-decoder.ts");
const {probsSize}=require("lzma1/src/lzma-coder.ts");
const {LzmaDecoder}=require("lzma1/src/lzma-decoder.ts");
const {RANGE_DECODER_INIT_SIZE,RangeDecoder}=require("lzma1/src/range-decoder.ts");
const INPUT_MARGIN = 64;
const DICT_SIZE_MIN = 1 << 12;
const SPARE_PROBS_MAX_SIZE = 1 << 16;
const spareProbs = new Map();
class AloneDecoder {
    sink;
    rc = new RangeDecoder();
    header = null;
    lzma = null;
    lz = null;
    pending = new Uint8Array(0);
    rcStarted = false;
    done = false;
    preallocateLimit;
    reuse;
    contiguousOutput = false;
    constructor(sink, preallocateLimit = 0, reuse = false){
        this.sink = sink;
        this.preallocateLimit = preallocateLimit;
        this.reuse = reuse;
    }
    get uncompressedSize() {
        return this.header?.uncompressedSize;
    }
    write(chunk) {
        if (this.done) return;
        this.decode(concat(this.pending, chunk), false);
    }
    end() {
        if (this.done) return;
        this.decode(this.pending, true);
        if (!this.done) {
            throw new Error("Truncated input");
        }
    }
    decode(input, isLast) {
        let pos = 0;
        if (this.header === null) {
            if (input.length < HEADER_SIZE) {
                this.pending = input.slice();
                return;
            }
            this.start(decodeHeader(input));
            pos = HEADER_SIZE;
            if (this.header.uncompressedSize === 0) {
                this.done = true;
                return;
            }
        }
        const lzma = this.lzma;
        const lz = this.lz;
        const rc = this.rc;
        if (!this.rcStarted) {
            if (input.length - pos < RANGE_DECODER_INIT_SIZE) {
                if (isLast) throw new Error("Truncated input");
                this.pending = input.slice(pos);
                return;
            }
            rc.init(input, pos);
            this.rcStarted = true;
        } else {
            rc.setInput(input, pos);
        }
        const size = this.header.uncompressedSize;
        const outLimit = size === UNKNOWN_SIZE ? Infinity : size;
        const inLimit = isLast ? Infinity : input.length - INPUT_MARGIN;
        const endMarker = lzma.decode(outLimit, inLimit);
        lz.flush();
        if (endMarker) {
            if (!rc.isFinished()) {
                throw new Error("Corrupted input: invalid end marker");
            }
            this.done = true;
        } else if (lzma.outPos === size) {
            this.done = true;
        }
        if (this.done) {
            this.pending = new Uint8Array(0);
            this.release();
        } else {
            this.pending = input.slice(rc.pos);
        }
    }
    release() {
        const probs = this.lzma?.probs;
        if (this.reuse && probs !== undefined && probs.length <= SPARE_PROBS_MAX_SIZE) {
            spareProbs.set(probs.length, probs);
        }
    }
    start(header) {
        this.header = header;
        let dictSize = Math.max(header.dictSize, DICT_SIZE_MIN);
        if (header.uncompressedSize !== UNKNOWN_SIZE) {
            dictSize = Math.max(Math.min(dictSize, header.uncompressedSize), 1);
        }
        const size = header.uncompressedSize;
        this.contiguousOutput = size !== UNKNOWN_SIZE && size > 0 && dictSize === size && size <= this.preallocateLimit;
        this.lz = new LzDecoder(dictSize, this.sink, this.contiguousOutput);
        let probs;
        if (this.reuse) {
            const size = probsSize(header.lc, header.lp);
            probs = spareProbs.get(size);
            spareProbs.delete(size);
        }
        this.lzma = new LzmaDecoder(this.lz, this.rc, header.lc, header.lp, header.pb, probs);
    }
}
function concat(a, b) {
    if (a.length === 0) return b;
    if (b.length === 0) return a;
    const result = new Uint8Array(a.length + b.length);
    result.set(a);
    result.set(b, a.length);
    return result;
}

exports["AloneDecoder"]=AloneDecoder;
},
"lzma1/src/alone-encoder.ts":function(module,exports,require){
const {BT4}=require("lzma1/src/bt4.ts");
const {HC4}=require("lzma1/src/hc4.ts");
const {encodeHeader,UNKNOWN_SIZE}=require("lzma1/src/header.ts");
const {MATCH_LEN_MAX}=require("lzma1/src/lzma-coder.ts");
const {FAST_EXTRA_SIZE_AFTER,FAST_EXTRA_SIZE_BEFORE,LzmaEncoderFast}=require("lzma1/src/lzma-encoder-fast.ts");
const {LzmaEncoderNormal,NORMAL_EXTRA_SIZE_AFTER,NORMAL_EXTRA_SIZE_BEFORE,OPTS}=require("lzma1/src/lzma-encoder-normal.ts");
const {fitDictSize}=require("lzma1/src/options.ts");
const {RangeEncoder}=require("lzma1/src/range-encoder.ts");
const POOL_MAX_DICT_SIZE = 1 << 16;
const POOL_MAX_ENTRIES = 3;
const pool = new Map();
class AloneEncoder {
    rc;
    lzma;
    expectedSize;
    poolKey;
    inputSize = 0;
    constructor(options, uncompressedSize = UNKNOWN_SIZE, reuse = false){
        const knownSize = uncompressedSize !== UNKNOWN_SIZE;
        const dictSize = knownSize ? fitDictSize(options.dictSize, uncompressedSize) : options.dictSize;
        this.expectedSize = uncompressedSize;
        this.rc = new RangeEncoder(knownSize ? Math.min(uncompressedSize >>> 1, 1 << 20) + 64 : 1 << 16);
        this.rc.writeBytes(encodeHeader({
            lc: options.lc,
            lp: options.lp,
            pb: options.pb,
            dictSize,
            uncompressedSize
        }));
        const sizeClass = knownSize ? 2 ** Math.ceil(Math.log2(Math.max(uncompressedSize, 64))) : undefined;
        if (reuse && knownSize && dictSize <= POOL_MAX_DICT_SIZE) {
            this.poolKey = [
                options.mode,
                options.matchFinder,
                options.niceLen,
                options.depth,
                options.lc,
                options.lp,
                options.pb,
                dictSize,
                sizeClass
            ].join();
        }
        const pooled = this.poolKey === undefined ? undefined : pool.get(this.poolKey);
        if (pooled) {
            pool.delete(this.poolKey);
            pooled.restart(this.rc);
            this.lzma = pooled;
        } else {
            this.lzma = createEncoder(this.rc, options, dictSize, sizeClass);
        }
    }
    write(input) {
        this.inputSize += input.length;
        if (this.expectedSize !== UNKNOWN_SIZE && this.inputSize > this.expectedSize) {
            throw new Error("Input exceeds the declared uncompressed size");
        }
        const lz = this.lzma.lz;
        let off = 0;
        while(off < input.length){
            off += lz.fillWindow(input, off, input.length - off);
            this.lzma.encode();
        }
    }
    take() {
        return this.rc.take();
    }
    finish() {
        if (this.expectedSize !== UNKNOWN_SIZE && this.inputSize !== this.expectedSize) {
            throw new Error("Input is smaller than the declared uncompressed size");
        }
        this.lzma.lz.setFinishing();
        this.lzma.encode();
        this.lzma.encodeEndMarker();
        const output = this.rc.finish();
        if (this.poolKey !== undefined) {
            if (pool.size >= POOL_MAX_ENTRIES) {
                pool.delete(pool.keys().next().value);
            }
            pool.set(this.poolKey, this.lzma);
        }
        return output;
    }
}
function createEncoder(rc, options, dictSize, sizeClass) {
    const isFast = options.mode === "fast";
    const lzConfig = {
        dictSize,
        extraSizeBefore: isFast ? FAST_EXTRA_SIZE_BEFORE : NORMAL_EXTRA_SIZE_BEFORE,
        extraSizeAfter: isFast ? FAST_EXTRA_SIZE_AFTER : NORMAL_EXTRA_SIZE_AFTER,
        niceLen: options.niceLen,
        matchLenMax: MATCH_LEN_MAX,
        depthLimit: options.depth,
        inputSize: sizeClass
    };
    const lz = options.matchFinder === "hc4" ? new HC4(lzConfig) : new BT4(lzConfig);
    const lzmaConfig = {
        lc: options.lc,
        lp: options.lp,
        pb: options.pb,
        dictSize,
        niceLen: options.niceLen,
        optsSize: sizeClass === undefined ? OPTS : sizeClass + 2
    };
    return isFast ? new LzmaEncoderFast(rc, lz, lzmaConfig) : new LzmaEncoderNormal(rc, lz, lzmaConfig);
}

exports["AloneEncoder"]=AloneEncoder;
},
"lzma1/src/bt4.ts":function(module,exports,require){
const {Hash234}=require("lzma1/src/hash234.ts");
const {getMatchLen,LzEncoder,Matches,normalizePositions}=require("lzma1/src/lz-encoder.ts");
const MAX_POS = 0x7FFFFFFF;
class BT4 extends LzEncoder {
    hash;
    tree;
    matches;
    depthLimit;
    cyclicSize;
    cyclicPos = -1;
    lzPos;
    constructor(config){
        super(config);
        this.cyclicSize = config.dictSize + 1;
        this.lzPos = this.cyclicSize;
        this.hash = new Hash234(config.dictSize);
        this.tree = new Int32Array(this.cyclicSize * 2);
        this.matches = new Matches(config.niceLen - 1);
        this.depthLimit = config.depthLimit > 0 ? config.depthLimit : 16 + (config.niceLen >>> 1);
    }
    reset() {
        super.reset();
        this.cyclicPos = -1;
        this.lzPos += this.cyclicSize;
        if (this.lzPos >= MAX_POS - this.cyclicSize) {
            this.hash.clear();
            this.tree.fill(0);
            this.lzPos = this.cyclicSize;
        }
    }
    getMatches() {
        const matches = this.matches;
        const buf = this.buf;
        matches.count = 0;
        let matchLenLimit = this.matchLenMax;
        let niceLenLimit = this.niceLen;
        const avail = this.movePosition();
        if (avail < matchLenLimit) {
            if (avail === 0) return matches;
            matchLenLimit = avail;
            if (niceLenLimit > avail) niceLenLimit = avail;
        }
        const readPos = this.readPos;
        this.hash.calcHashes(buf, readPos);
        let delta2 = this.lzPos - this.hash.getHash2Pos();
        const delta3 = this.lzPos - this.hash.getHash3Pos();
        const currentMatch = this.hash.getHash4Pos();
        this.hash.updateTables(this.lzPos);
        let lenBest = 0;
        if (delta2 < this.cyclicSize && buf[readPos - delta2] === buf[readPos]) {
            lenBest = 2;
            matches.len[0] = 2;
            matches.dist[0] = delta2 - 1;
            matches.count = 1;
        }
        if (delta2 !== delta3 && delta3 < this.cyclicSize && buf[readPos - delta3] === buf[readPos]) {
            lenBest = 3;
            matches.dist[matches.count++] = delta3 - 1;
            delta2 = delta3;
        }
        if (matches.count > 0) {
            lenBest = getMatchLen(buf, readPos, delta2, lenBest, matchLenLimit);
            matches.len[matches.count - 1] = lenBest;
            if (lenBest >= niceLenLimit) {
                this.updateTree(niceLenLimit, currentMatch);
                return matches;
            }
        }
        if (lenBest < 3) lenBest = 3;
        const tree = this.tree;
        const lzPos = this.lzPos;
        const cyclicPos = this.cyclicPos;
        const cyclicSize = this.cyclicSize;
        const matchLens = matches.len;
        const matchDists = matches.dist;
        let count = matches.count;
        let match = currentMatch;
        let depth = this.depthLimit;
        let ptr0 = (cyclicPos << 1) + 1;
        let ptr1 = cyclicPos << 1;
        let len0 = 0;
        let len1 = 0;
        while(true){
            const delta = lzPos - match;
            if (depth-- === 0 || delta >= cyclicSize) {
                tree[ptr0] = 0;
                tree[ptr1] = 0;
                break;
            }
            const pair = cyclicPos - delta + (delta > cyclicPos ? cyclicSize : 0) << 1;
            const smaller = tree[pair];
            const larger = tree[pair + 1];
            let len = Math.min(len0, len1);
            if (buf[readPos + len - delta] === buf[readPos + len]) {
                len = getMatchLen(buf, readPos, delta, len + 1, matchLenLimit);
                if (len > lenBest) {
                    lenBest = len;
                    matchLens[count] = len;
                    matchDists[count] = delta - 1;
                    ++count;
                    if (len >= niceLenLimit) {
                        tree[ptr1] = smaller;
                        tree[ptr0] = larger;
                        break;
                    }
                }
            }
            if (buf[readPos + len - delta] < buf[readPos + len]) {
                tree[ptr1] = match;
                ptr1 = pair + 1;
                match = larger;
                len1 = len;
            } else {
                tree[ptr0] = match;
                ptr0 = pair;
                match = smaller;
                len0 = len;
            }
        }
        matches.count = count;
        return matches;
    }
    skip(len) {
        while(len-- > 0){
            let niceLenLimit = this.niceLen;
            const avail = this.movePosition();
            if (avail < niceLenLimit) {
                if (avail === 0) continue;
                niceLenLimit = avail;
            }
            this.hash.calcHashes(this.buf, this.readPos);
            const currentMatch = this.hash.getHash4Pos();
            this.hash.updateTables(this.lzPos);
            this.updateTree(niceLenLimit, currentMatch);
        }
    }
    updateTree(niceLenLimit, currentMatch) {
        const buf = this.buf;
        const tree = this.tree;
        const readPos = this.readPos;
        const lzPos = this.lzPos;
        const cyclicPos = this.cyclicPos;
        const cyclicSize = this.cyclicSize;
        let match = currentMatch;
        let depth = this.depthLimit;
        let ptr0 = (cyclicPos << 1) + 1;
        let ptr1 = cyclicPos << 1;
        let len0 = 0;
        let len1 = 0;
        while(true){
            const delta = lzPos - match;
            if (depth-- === 0 || delta >= cyclicSize) {
                tree[ptr0] = 0;
                tree[ptr1] = 0;
                return;
            }
            const pair = cyclicPos - delta + (delta > cyclicPos ? cyclicSize : 0) << 1;
            const smaller = tree[pair];
            const larger = tree[pair + 1];
            let len = Math.min(len0, len1);
            if (buf[readPos + len - delta] === buf[readPos + len]) {
                len = getMatchLen(buf, readPos, delta, len + 1, niceLenLimit);
                if (len === niceLenLimit) {
                    tree[ptr1] = smaller;
                    tree[ptr0] = larger;
                    return;
                }
            }
            if (buf[readPos + len - delta] < buf[readPos + len]) {
                tree[ptr1] = match;
                ptr1 = pair + 1;
                match = larger;
                len1 = len;
            } else {
                tree[ptr0] = match;
                ptr0 = pair;
                match = smaller;
                len0 = len;
            }
        }
    }
    movePosition() {
        const avail = this.movePos(this.niceLen, 4);
        if (avail !== 0) {
            if (++this.lzPos === MAX_POS) {
                const offset = MAX_POS - this.cyclicSize;
                this.hash.normalize(offset);
                normalizePositions(this.tree, offset);
                this.lzPos -= offset;
            }
            if (++this.cyclicPos === this.cyclicSize) {
                this.cyclicPos = 0;
            }
        }
        return avail;
    }
}

exports["BT4"]=BT4;
},
"lzma1/src/crc32.ts":function(module,exports,require){
const CRC32_TABLE = createCrc32Table();
function createCrc32Table() {
    const table = [];
    for(let i = 0; i < 256; ++i){
        let r = i;
        for(let j = 0; j < 8; ++j){
            r = (r & 1) !== 0 ? r >>> 1 ^ 0xEDB88320 : r >>> 1;
        }
        table.push(r >>> 0);
    }
    return table;
}

exports["CRC32_TABLE"]=CRC32_TABLE;
},
"lzma1/src/hash234.ts":function(module,exports,require){
const {CRC32_TABLE}=require("lzma1/src/crc32.ts");
const {normalizePositions}=require("lzma1/src/lz-encoder.ts");
const HASH_2_SIZE = 1 << 10;
const HASH_2_MASK = HASH_2_SIZE - 1;
const HASH_3_SIZE = 1 << 16;
const HASH_3_MASK = HASH_3_SIZE - 1;
function getHash4Size(dictSize) {
    let h = dictSize - 1;
    h |= h >>> 1;
    h |= h >>> 2;
    h |= h >>> 4;
    h |= h >>> 8;
    h >>>= 1;
    h |= 0xFFFF;
    if (h > 1 << 24) {
        h >>>= 1;
    }
    return h + 1;
}
class Hash234 {
    hash4Mask;
    hash2Table = new Int32Array(HASH_2_SIZE);
    hash3Table = new Int32Array(HASH_3_SIZE);
    hash4Table;
    hash2Value = 0;
    hash3Value = 0;
    hash4Value = 0;
    constructor(dictSize){
        const hash4Size = getHash4Size(dictSize);
        this.hash4Table = new Int32Array(hash4Size);
        this.hash4Mask = hash4Size - 1;
    }
    calcHashes(buf, off) {
        let temp = CRC32_TABLE[buf[off]] ^ buf[off + 1];
        this.hash2Value = temp & HASH_2_MASK;
        temp ^= buf[off + 2] << 8;
        this.hash3Value = temp & HASH_3_MASK;
        temp ^= CRC32_TABLE[buf[off + 3]] << 5;
        this.hash4Value = temp & this.hash4Mask;
    }
    getHash2Pos() {
        return this.hash2Table[this.hash2Value];
    }
    getHash3Pos() {
        return this.hash3Table[this.hash3Value];
    }
    getHash4Pos() {
        return this.hash4Table[this.hash4Value];
    }
    updateTables(pos) {
        this.hash2Table[this.hash2Value] = pos;
        this.hash3Table[this.hash3Value] = pos;
        this.hash4Table[this.hash4Value] = pos;
    }
    clear() {
        this.hash2Table.fill(0);
        this.hash3Table.fill(0);
        this.hash4Table.fill(0);
    }
    normalize(offset) {
        normalizePositions(this.hash2Table, offset);
        normalizePositions(this.hash3Table, offset);
        normalizePositions(this.hash4Table, offset);
    }
}

exports["Hash234"]=Hash234;
},
"lzma1/src/hc4.ts":function(module,exports,require){
const {Hash234}=require("lzma1/src/hash234.ts");
const {getMatchLen,LzEncoder,Matches,normalizePositions}=require("lzma1/src/lz-encoder.ts");
const MAX_POS = 0x7FFFFFFF;
class HC4 extends LzEncoder {
    hash;
    chain;
    matches;
    depthLimit;
    cyclicSize;
    cyclicPos = -1;
    lzPos;
    constructor(config){
        super(config);
        this.hash = new Hash234(config.dictSize);
        this.cyclicSize = config.dictSize + 1;
        this.chain = new Int32Array(this.cyclicSize);
        this.lzPos = this.cyclicSize;
        this.matches = new Matches(config.niceLen - 1);
        this.depthLimit = config.depthLimit > 0 ? config.depthLimit : 4 + (config.niceLen >>> 2);
    }
    reset() {
        super.reset();
        this.cyclicPos = -1;
        this.lzPos += this.cyclicSize;
        if (this.lzPos >= MAX_POS - this.cyclicSize) {
            this.hash.clear();
            this.chain.fill(0);
            this.lzPos = this.cyclicSize;
        }
    }
    getMatches() {
        const matches = this.matches;
        const buf = this.buf;
        matches.count = 0;
        let matchLenLimit = this.matchLenMax;
        let niceLenLimit = this.niceLen;
        const avail = this.movePosition();
        if (avail < matchLenLimit) {
            if (avail === 0) return matches;
            matchLenLimit = avail;
            if (niceLenLimit > avail) niceLenLimit = avail;
        }
        const readPos = this.readPos;
        this.hash.calcHashes(buf, readPos);
        let delta2 = this.lzPos - this.hash.getHash2Pos();
        const delta3 = this.lzPos - this.hash.getHash3Pos();
        let match = this.hash.getHash4Pos();
        this.hash.updateTables(this.lzPos);
        this.chain[this.cyclicPos] = match;
        let lenBest = 0;
        if (delta2 < this.cyclicSize && buf[readPos - delta2] === buf[readPos]) {
            lenBest = 2;
            matches.len[0] = 2;
            matches.dist[0] = delta2 - 1;
            matches.count = 1;
        }
        if (delta2 !== delta3 && delta3 < this.cyclicSize && buf[readPos - delta3] === buf[readPos]) {
            lenBest = 3;
            matches.dist[matches.count++] = delta3 - 1;
            delta2 = delta3;
        }
        if (matches.count > 0) {
            lenBest = getMatchLen(buf, readPos, delta2, lenBest, matchLenLimit);
            matches.len[matches.count - 1] = lenBest;
            if (lenBest >= niceLenLimit) return matches;
        }
        if (lenBest < 3) lenBest = 3;
        let depth = this.depthLimit;
        while(true){
            const delta = this.lzPos - match;
            if (depth-- === 0 || delta >= this.cyclicSize) {
                return matches;
            }
            match = this.chain[this.cyclicPos - delta + (delta > this.cyclicPos ? this.cyclicSize : 0)];
            if (buf[readPos + lenBest - delta] === buf[readPos + lenBest] && buf[readPos - delta] === buf[readPos]) {
                const len = getMatchLen(buf, readPos, delta, 1, matchLenLimit);
                if (len > lenBest) {
                    lenBest = len;
                    matches.len[matches.count] = len;
                    matches.dist[matches.count] = delta - 1;
                    ++matches.count;
                    if (len >= niceLenLimit) return matches;
                }
            }
        }
    }
    skip(len) {
        while(len-- > 0){
            if (this.movePosition() !== 0) {
                this.hash.calcHashes(this.buf, this.readPos);
                this.chain[this.cyclicPos] = this.hash.getHash4Pos();
                this.hash.updateTables(this.lzPos);
            }
        }
    }
    movePosition() {
        const avail = this.movePos(4, 4);
        if (avail !== 0) {
            if (++this.lzPos === MAX_POS) {
                const offset = MAX_POS - this.cyclicSize;
                this.hash.normalize(offset);
                normalizePositions(this.chain, offset);
                this.lzPos -= offset;
            }
            if (++this.cyclicPos === this.cyclicSize) {
                this.cyclicPos = 0;
            }
        }
        return avail;
    }
}

exports["HC4"]=HC4;
},
"lzma1/src/header.ts":function(module,exports,require){
const HEADER_SIZE = 13;
const UNKNOWN_SIZE = -1;
function roundDictSize(dictSize) {
    let d = dictSize - 1;
    d |= d >>> 2;
    d |= d >>> 3;
    d |= d >>> 4;
    d |= d >>> 8;
    d |= d >>> 16;
    return Math.min((d >>> 0) + 1, 0xFFFFFFFF);
}
function encodeHeader(header) {
    const bytes = new Uint8Array(HEADER_SIZE);
    const view = new DataView(bytes.buffer);
    bytes[0] = (header.pb * 5 + header.lp) * 9 + header.lc;
    view.setUint32(1, roundDictSize(header.dictSize), true);
    if (header.uncompressedSize === UNKNOWN_SIZE) {
        bytes.fill(0xFF, 5);
    } else {
        view.setUint32(5, header.uncompressedSize % 0x100000000, true);
        view.setUint32(9, Math.floor(header.uncompressedSize / 0x100000000), true);
    }
    return bytes;
}
function decodeHeader(bytes) {
    if (bytes.length < HEADER_SIZE) {
        throw new Error("Truncated input");
    }
    const view = new DataView(bytes.buffer, bytes.byteOffset, HEADER_SIZE);
    let props = bytes[0];
    if (props >= 9 * 5 * 5) {
        throw new Error("Corrupted input: invalid LZMA properties");
    }
    const lc = props % 9;
    props = props / 9 | 0;
    const lp = props % 5;
    const pb = props / 5 | 0;
    const dictSize = view.getUint32(1, true);
    const sizeLow = view.getUint32(5, true);
    const sizeHigh = view.getUint32(9, true);
    let uncompressedSize = UNKNOWN_SIZE;
    if (sizeLow !== 0xFFFFFFFF || sizeHigh !== 0xFFFFFFFF) {
        uncompressedSize = sizeHigh * 0x100000000 + sizeLow;
        if (!Number.isSafeInteger(uncompressedSize)) {
            throw new Error("Unsupported input: uncompressed size is too large");
        }
    }
    return {
        lc,
        lp,
        pb,
        dictSize,
        uncompressedSize
    };
}

exports["HEADER_SIZE"]=HEADER_SIZE;
exports["UNKNOWN_SIZE"]=UNKNOWN_SIZE;
exports["roundDictSize"]=roundDictSize;
exports["encodeHeader"]=encodeHeader;
exports["decodeHeader"]=decodeHeader;
},
"lzma1/src/index.ts":function(module,exports,require){
const {compressData,decompressData,toUint8Array}=require("lzma1/src/lzma.ts");
const {DEFAULT_LEVEL}=require("lzma1/src/options.ts");
const {decodeUtf8,encodeUtf8}=require("lzma1/src/utf8.ts");
exports["CRC32_TABLE"]=require("lzma1/src/crc32.ts")["CRC32_TABLE"];
exports["LZMA"]=require("lzma1/src/lzma.ts")["LZMA"];
exports["Compress"]=require("lzma1/src/web-streams.ts")["Compress"];
exports["Decompress"]=require("lzma1/src/web-streams.ts")["Decompress"];
function compress(data, mode = DEFAULT_LEVEL) {
    return compressData(toUint8Array(data), mode);
}
function compressString(data, mode = DEFAULT_LEVEL) {
    return compressData(encodeUtf8(data), mode);
}
function decompress(data) {
    return decompressData(toUint8Array(data));
}
function decompressString(data) {
    return decodeUtf8(decompressData(toUint8Array(data)));
}

exports["compress"]=compress;
exports["compressString"]=compressString;
exports["decompress"]=decompress;
exports["decompressString"]=decompressString;
},
"lzma1/src/lz-decoder.ts":function(module,exports,require){
class LzDecoder {
    buf;
    maxSize;
    sink;
    pos = 0;
    start = 0;
    wrapped = false;
    constructor(dictSize, sink, preallocate = false){
        this.maxSize = dictSize;
        this.buf = new Uint8Array(preallocate ? dictSize : Math.min(dictSize, 1 << 16));
        this.sink = sink;
    }
    getByte(dist) {
        let offset = this.pos - dist - 1;
        if (offset < 0) {
            offset += this.buf.length;
        }
        return this.buf[offset];
    }
    putByte(byte) {
        this.buf[this.pos++] = byte;
        if (this.pos === this.buf.length) {
            this.onBufferEnd();
        }
    }
    repeat(dist, len) {
        const history = this.wrapped ? this.buf.length : this.pos;
        if (dist < 0 || dist >= history) {
            throw new Error("Corrupted input: match distance is too large");
        }
        while(len > 0){
            const buf = this.buf;
            let back = this.pos - dist - 1;
            if (back < 0) {
                back += buf.length;
            }
            const count = Math.min(len, buf.length - this.pos, buf.length - back);
            if (count <= dist && count >= 32) {
                buf.copyWithin(this.pos, back, back + count);
                this.pos += count;
            } else {
                for(let i = 0; i < count; ++i){
                    buf[this.pos++] = buf[back + i];
                }
            }
            len -= count;
            if (this.pos === buf.length) {
                this.onBufferEnd();
            }
        }
    }
    flush() {
        if (this.pos > this.start) {
            this.sink(this.buf.subarray(this.start, this.pos));
        }
        this.start = this.pos;
    }
    onBufferEnd() {
        if (!this.wrapped && this.buf.length < this.maxSize) {
            const grown = new Uint8Array(Math.min(this.buf.length * 2, this.maxSize));
            grown.set(this.buf);
            this.buf = grown;
            return;
        }
        this.flush();
        this.pos = 0;
        this.start = 0;
        this.wrapped = true;
    }
}

exports["LzDecoder"]=LzDecoder;
},
"lzma1/src/lz-encoder.ts":function(module,exports,require){
class Matches {
    len;
    dist;
    count = 0;
    constructor(countMax){
        this.len = new Int32Array(countMax);
        this.dist = new Int32Array(countMax);
    }
}
function getMatchLen(buf, off, delta, len, lenLimit) {
    const end = off + lenLimit;
    let i = off + len;
    while(i < end && buf[i] === buf[i - delta]){
        ++i;
    }
    return i - off;
}
function normalizePositions(positions, offset) {
    for(let i = 0; i < positions.length; ++i){
        positions[i] = positions[i] <= offset ? 0 : positions[i] - offset;
    }
}
class LzEncoder {
    keepSizeBefore;
    keepSizeAfter;
    matchLenMax;
    niceLen;
    buf;
    readPos = -1;
    readLimit = -1;
    finishing = false;
    writePos = 0;
    pendingSize = 0;
    constructor(config){
        this.keepSizeBefore = config.extraSizeBefore + config.dictSize;
        this.keepSizeAfter = config.extraSizeAfter + config.matchLenMax;
        this.matchLenMax = config.matchLenMax;
        this.niceLen = config.niceLen;
        const reserveSize = Math.min((config.dictSize >>> 1) + (256 << 10), 512 << 20);
        let bufSize = this.keepSizeBefore + this.keepSizeAfter + reserveSize;
        if (config.inputSize !== undefined) {
            bufSize = Math.min(bufSize, config.inputSize + this.keepSizeAfter);
        }
        this.buf = new Uint8Array(bufSize);
    }
    reset() {
        this.readPos = -1;
        this.readLimit = -1;
        this.finishing = false;
        this.writePos = 0;
        this.pendingSize = 0;
    }
    fillWindow(input, off, len) {
        if (this.readPos >= this.buf.length - this.keepSizeAfter) {
            this.moveWindow();
        }
        len = Math.min(len, this.buf.length - this.writePos);
        this.buf.set(input.subarray(off, off + len), this.writePos);
        this.writePos += len;
        if (this.writePos >= this.keepSizeAfter) {
            this.readLimit = this.writePos - this.keepSizeAfter;
        }
        this.processPendingBytes();
        return len;
    }
    setFinishing() {
        this.readLimit = this.writePos - 1;
        this.finishing = true;
        this.processPendingBytes();
    }
    isStarted() {
        return this.readPos !== -1;
    }
    hasEnoughData(alreadyReadLen) {
        return this.readPos - alreadyReadLen < this.readLimit;
    }
    getAvail() {
        return this.writePos - this.readPos;
    }
    getPos() {
        return this.readPos;
    }
    getByte(backward) {
        return this.buf[this.readPos - backward];
    }
    getByteAt(forward, backward) {
        return this.buf[this.readPos + forward - backward];
    }
    getMatchLen(forward, dist, lenLimit) {
        return getMatchLen(this.buf, this.readPos + forward, dist + 1, 0, lenLimit);
    }
    movePos(requiredForFlushing, requiredForFinishing) {
        ++this.readPos;
        let avail = this.writePos - this.readPos;
        if (avail < requiredForFlushing) {
            if (avail < requiredForFinishing || !this.finishing) {
                ++this.pendingSize;
                avail = 0;
            }
        }
        return avail;
    }
    moveWindow() {
        const moveOffset = this.readPos + 1 - this.keepSizeBefore & ~15;
        this.buf.copyWithin(0, moveOffset, this.writePos);
        this.readPos -= moveOffset;
        this.readLimit -= moveOffset;
        this.writePos -= moveOffset;
    }
    processPendingBytes() {
        if (this.pendingSize > 0 && this.readPos < this.readLimit) {
            this.readPos -= this.pendingSize;
            const oldPendingSize = this.pendingSize;
            this.pendingSize = 0;
            this.skip(oldPendingSize);
        }
    }
}

exports["Matches"]=Matches;
exports["getMatchLen"]=getMatchLen;
exports["normalizePositions"]=normalizePositions;
exports["LzEncoder"]=LzEncoder;
},
"lzma1/src/lzma-coder.ts":function(module,exports,require){
const {initProbs}=require("lzma1/src/range-coder.ts");
const POS_STATES_MAX = 1 << 4;
const MATCH_LEN_MIN = 2;
const LOW_SYMBOLS = 1 << 3;
const MID_SYMBOLS = 1 << 3;
const HIGH_SYMBOLS = 1 << 8;
const MATCH_LEN_MAX = MATCH_LEN_MIN + LOW_SYMBOLS + MID_SYMBOLS + HIGH_SYMBOLS - 1;
const LEN_CHOICE = 0;
const LEN_CHOICE2 = 1;
const LEN_LOW = 2;
const LEN_MID = LEN_LOW + POS_STATES_MAX * LOW_SYMBOLS;
const LEN_HIGH = LEN_MID + POS_STATES_MAX * MID_SYMBOLS;
const LEN_SIZE = LEN_HIGH + HIGH_SYMBOLS;
const DIST_STATES = 4;
const DIST_SLOT_BITS = 6;
const DIST_SLOT_COUNT = 1 << DIST_SLOT_BITS;
const DIST_MODEL_START = 4;
const DIST_MODEL_END = 14;
const FULL_DISTANCES = 1 << DIST_MODEL_END / 2;
const ALIGN_BITS = 4;
const ALIGN_SIZE = 1 << ALIGN_BITS;
const ALIGN_MASK = ALIGN_SIZE - 1;
const REPS = 4;
const STATES = 12;
const LIT_STATES = 7;
const LIT_LIT = 0;
const SHORTREP_LIT_LIT = 3;
const LIT_MATCH = 7;
const LIT_LONGREP = 8;
const LIT_SHORTREP = 9;
const NONLIT_MATCH = 10;
const NONLIT_REP = 11;
const INITIAL_STATE = LIT_LIT;
function isLiteralState(state) {
    return state < LIT_STATES;
}
function stateAfterLiteral(state) {
    if (state <= SHORTREP_LIT_LIT) return LIT_LIT;
    if (state <= LIT_SHORTREP) return state - 3;
    return state - 6;
}
function stateAfterMatch(state) {
    return state < LIT_STATES ? LIT_MATCH : NONLIT_MATCH;
}
function stateAfterLongRep(state) {
    return state < LIT_STATES ? LIT_LONGREP : NONLIT_REP;
}
function stateAfterShortRep(state) {
    return state < LIT_STATES ? LIT_SHORTREP : NONLIT_REP;
}
function getDistState(len) {
    return len < DIST_STATES + MATCH_LEN_MIN ? len - MATCH_LEN_MIN : DIST_STATES - 1;
}
const IS_MATCH = 0;
const IS_REP = IS_MATCH + STATES * POS_STATES_MAX;
const IS_REP0 = IS_REP + STATES;
const IS_REP1 = IS_REP0 + STATES;
const IS_REP2 = IS_REP1 + STATES;
const IS_REP0_LONG = IS_REP2 + STATES;
const DIST_SLOTS = IS_REP0_LONG + STATES * POS_STATES_MAX;
const DIST_SPECIAL = DIST_SLOTS + DIST_STATES * DIST_SLOT_COUNT;
const DIST_ALIGN = DIST_SPECIAL + FULL_DISTANCES - DIST_MODEL_END;
const MATCH_LEN = DIST_ALIGN + ALIGN_SIZE;
const REP_LEN = MATCH_LEN + LEN_SIZE;
const LITERAL = REP_LEN + LEN_SIZE;
function distSpecialOffset(distSlot, base) {
    return DIST_SPECIAL + base - distSlot - 1;
}
function probsSize(lc, lp) {
    return LITERAL + (0x300 << lc + lp);
}
class LzmaCoder {
    posMask;
    lc;
    literalPosMask;
    reps = new Int32Array(REPS);
    state = INITIAL_STATE;
    probs;
    constructor(lc, lp, pb, probs){
        this.posMask = (1 << pb) - 1;
        this.lc = lc;
        this.literalPosMask = (1 << lp) - 1;
        this.probs = probs ?? new Uint16Array(probsSize(lc, lp));
    }
    reset() {
        this.reps.fill(0);
        this.state = INITIAL_STATE;
        initProbs(this.probs);
    }
    literalOffset(prevByte, pos) {
        const low = prevByte >> 8 - this.lc;
        const high = (pos & this.literalPosMask) << this.lc;
        return LITERAL + 0x300 * (low + high);
    }
}

exports["POS_STATES_MAX"]=POS_STATES_MAX;
exports["MATCH_LEN_MIN"]=MATCH_LEN_MIN;
exports["LOW_SYMBOLS"]=LOW_SYMBOLS;
exports["MID_SYMBOLS"]=MID_SYMBOLS;
exports["HIGH_SYMBOLS"]=HIGH_SYMBOLS;
exports["MATCH_LEN_MAX"]=MATCH_LEN_MAX;
exports["LEN_CHOICE"]=LEN_CHOICE;
exports["LEN_CHOICE2"]=LEN_CHOICE2;
exports["LEN_LOW"]=LEN_LOW;
exports["LEN_MID"]=LEN_MID;
exports["LEN_HIGH"]=LEN_HIGH;
exports["LEN_SIZE"]=LEN_SIZE;
exports["DIST_STATES"]=DIST_STATES;
exports["DIST_SLOT_BITS"]=DIST_SLOT_BITS;
exports["DIST_SLOT_COUNT"]=DIST_SLOT_COUNT;
exports["DIST_MODEL_START"]=DIST_MODEL_START;
exports["DIST_MODEL_END"]=DIST_MODEL_END;
exports["FULL_DISTANCES"]=FULL_DISTANCES;
exports["ALIGN_BITS"]=ALIGN_BITS;
exports["ALIGN_SIZE"]=ALIGN_SIZE;
exports["ALIGN_MASK"]=ALIGN_MASK;
exports["REPS"]=REPS;
exports["STATES"]=STATES;
exports["INITIAL_STATE"]=INITIAL_STATE;
exports["isLiteralState"]=isLiteralState;
exports["stateAfterLiteral"]=stateAfterLiteral;
exports["stateAfterMatch"]=stateAfterMatch;
exports["stateAfterLongRep"]=stateAfterLongRep;
exports["stateAfterShortRep"]=stateAfterShortRep;
exports["getDistState"]=getDistState;
exports["IS_MATCH"]=IS_MATCH;
exports["IS_REP"]=IS_REP;
exports["IS_REP0"]=IS_REP0;
exports["IS_REP1"]=IS_REP1;
exports["IS_REP2"]=IS_REP2;
exports["IS_REP0_LONG"]=IS_REP0_LONG;
exports["DIST_SLOTS"]=DIST_SLOTS;
exports["DIST_SPECIAL"]=DIST_SPECIAL;
exports["DIST_ALIGN"]=DIST_ALIGN;
exports["MATCH_LEN"]=MATCH_LEN;
exports["REP_LEN"]=REP_LEN;
exports["LITERAL"]=LITERAL;
exports["distSpecialOffset"]=distSpecialOffset;
exports["probsSize"]=probsSize;
exports["LzmaCoder"]=LzmaCoder;
},
"lzma1/src/lzma-decoder.ts":function(module,exports,require){
const {ALIGN_BITS,DIST_ALIGN,DIST_MODEL_END,DIST_MODEL_START,DIST_SLOT_BITS,DIST_SLOTS,distSpecialOffset,getDistState,IS_MATCH,IS_REP,IS_REP0,IS_REP0_LONG,IS_REP1,IS_REP2,isLiteralState,LEN_CHOICE,LEN_CHOICE2,LEN_HIGH,LEN_LOW,LEN_MID,LOW_SYMBOLS,LzmaCoder,MATCH_LEN,MATCH_LEN_MIN,MID_SYMBOLS,REP_LEN,stateAfterLiteral,stateAfterLongRep,stateAfterMatch,stateAfterShortRep}=require("lzma1/src/lzma-coder.ts");
const {BIT_MODEL_TOTAL,BIT_MODEL_TOTAL_BITS,MOVE_BITS,TOP_VALUE}=require("lzma1/src/range-coder.ts");
const END_MARKER_DIST = -1;
class LzmaDecoder extends LzmaCoder {
    lz;
    rc;
    outPos = 0;
    constructor(lz, rc, lc, lp, pb, probs){
        super(lc, lp, pb, probs);
        this.lz = lz;
        this.rc = rc;
        this.reset();
    }
    decode(outLimit, inLimit) {
        const probs = this.probs;
        const lz = this.lz;
        const reps = this.reps;
        const posMask = this.posMask;
        const rc = this.rc;
        const input = rc.input;
        const inputEnd = input.length;
        let range = rc.range;
        let code = rc.code;
        let inPos = rc.pos;
        let state = this.state;
        let outPos = this.outPos;
        let rep0 = reps[0];
        let rep1 = reps[1];
        let rep2 = reps[2];
        let rep3 = reps[3];
        let endMarker = false;
        let i = 0;
        let prob = 0;
        let bound = 0;
        while(outPos < outLimit && inPos <= inLimit){
            const posState = outPos & posMask;
            i = IS_MATCH + (state << 4) + posState;
            prob = probs[i];
            bound = (range >>> BIT_MODEL_TOTAL_BITS) * prob;
            if (code < bound) {
                range = bound;
                probs[i] = prob + (BIT_MODEL_TOTAL - prob >>> MOVE_BITS);
                if (range < TOP_VALUE) {
                    if (inPos >= inputEnd) throw truncated();
                    range = range << 8 >>> 0;
                    code = (code << 8 | input[inPos++]) >>> 0;
                }
                const offset = this.literalOffset(lz.getByte(0), outPos);
                let symbol = 1;
                if (isLiteralState(state)) {
                    do {
                        i = offset + symbol;
                        prob = probs[i];
                        bound = (range >>> BIT_MODEL_TOTAL_BITS) * prob;
                        if (code < bound) {
                            range = bound;
                            probs[i] = prob + (BIT_MODEL_TOTAL - prob >>> MOVE_BITS);
                            symbol <<= 1;
                        } else {
                            range -= bound;
                            code -= bound;
                            probs[i] = prob - (prob >>> MOVE_BITS);
                            symbol = symbol << 1 | 1;
                        }
                        if (range < TOP_VALUE) {
                            if (inPos >= inputEnd) throw truncated();
                            range = range << 8 >>> 0;
                            code = (code << 8 | input[inPos++]) >>> 0;
                        }
                    }while (symbol < 0x100)
                } else {
                    let matchByte = lz.getByte(rep0);
                    let matchOffset = 0x100;
                    do {
                        matchByte <<= 1;
                        const matchBit = matchByte & matchOffset;
                        i = offset + matchOffset + matchBit + symbol;
                        prob = probs[i];
                        bound = (range >>> BIT_MODEL_TOTAL_BITS) * prob;
                        if (code < bound) {
                            range = bound;
                            probs[i] = prob + (BIT_MODEL_TOTAL - prob >>> MOVE_BITS);
                            symbol <<= 1;
                            matchOffset &= ~matchBit;
                        } else {
                            range -= bound;
                            code -= bound;
                            probs[i] = prob - (prob >>> MOVE_BITS);
                            symbol = symbol << 1 | 1;
                            matchOffset &= matchBit;
                        }
                        if (range < TOP_VALUE) {
                            if (inPos >= inputEnd) throw truncated();
                            range = range << 8 >>> 0;
                            code = (code << 8 | input[inPos++]) >>> 0;
                        }
                    }while (symbol < 0x100)
                }
                lz.putByte(symbol & 0xFF);
                state = stateAfterLiteral(state);
                ++outPos;
                continue;
            }
            range -= bound;
            code -= bound;
            probs[i] = prob - (prob >>> MOVE_BITS);
            if (range < TOP_VALUE) {
                if (inPos >= inputEnd) throw truncated();
                range = range << 8 >>> 0;
                code = (code << 8 | input[inPos++]) >>> 0;
            }
            let lenCoder;
            i = IS_REP + state;
            prob = probs[i];
            bound = (range >>> BIT_MODEL_TOTAL_BITS) * prob;
            if (code < bound) {
                range = bound;
                probs[i] = prob + (BIT_MODEL_TOTAL - prob >>> MOVE_BITS);
                if (range < TOP_VALUE) {
                    if (inPos >= inputEnd) throw truncated();
                    range = range << 8 >>> 0;
                    code = (code << 8 | input[inPos++]) >>> 0;
                }
                state = stateAfterMatch(state);
                rep3 = rep2;
                rep2 = rep1;
                rep1 = rep0;
                lenCoder = MATCH_LEN;
            } else {
                range -= bound;
                code -= bound;
                probs[i] = prob - (prob >>> MOVE_BITS);
                if (range < TOP_VALUE) {
                    if (inPos >= inputEnd) throw truncated();
                    range = range << 8 >>> 0;
                    code = (code << 8 | input[inPos++]) >>> 0;
                }
                i = IS_REP0 + state;
                prob = probs[i];
                bound = (range >>> BIT_MODEL_TOTAL_BITS) * prob;
                if (code < bound) {
                    range = bound;
                    probs[i] = prob + (BIT_MODEL_TOTAL - prob >>> MOVE_BITS);
                    if (range < TOP_VALUE) {
                        if (inPos >= inputEnd) throw truncated();
                        range = range << 8 >>> 0;
                        code = (code << 8 | input[inPos++]) >>> 0;
                    }
                    i = IS_REP0_LONG + (state << 4) + posState;
                    prob = probs[i];
                    bound = (range >>> BIT_MODEL_TOTAL_BITS) * prob;
                    if (code < bound) {
                        range = bound;
                        probs[i] = prob + (BIT_MODEL_TOTAL - prob >>> MOVE_BITS);
                        if (range < TOP_VALUE) {
                            if (inPos >= inputEnd) throw truncated();
                            range = range << 8 >>> 0;
                            code = (code << 8 | input[inPos++]) >>> 0;
                        }
                        state = stateAfterShortRep(state);
                        if (outPos >= outLimit) throw exceedsSize();
                        lz.repeat(rep0, 1);
                        ++outPos;
                        continue;
                    }
                    range -= bound;
                    code -= bound;
                    probs[i] = prob - (prob >>> MOVE_BITS);
                    if (range < TOP_VALUE) {
                        if (inPos >= inputEnd) throw truncated();
                        range = range << 8 >>> 0;
                        code = (code << 8 | input[inPos++]) >>> 0;
                    }
                } else {
                    range -= bound;
                    code -= bound;
                    probs[i] = prob - (prob >>> MOVE_BITS);
                    if (range < TOP_VALUE) {
                        if (inPos >= inputEnd) throw truncated();
                        range = range << 8 >>> 0;
                        code = (code << 8 | input[inPos++]) >>> 0;
                    }
                    let dist;
                    i = IS_REP1 + state;
                    prob = probs[i];
                    bound = (range >>> BIT_MODEL_TOTAL_BITS) * prob;
                    if (code < bound) {
                        range = bound;
                        probs[i] = prob + (BIT_MODEL_TOTAL - prob >>> MOVE_BITS);
                        dist = rep1;
                    } else {
                        range -= bound;
                        code -= bound;
                        probs[i] = prob - (prob >>> MOVE_BITS);
                        if (range < TOP_VALUE) {
                            if (inPos >= inputEnd) throw truncated();
                            range = range << 8 >>> 0;
                            code = (code << 8 | input[inPos++]) >>> 0;
                        }
                        i = IS_REP2 + state;
                        prob = probs[i];
                        bound = (range >>> BIT_MODEL_TOTAL_BITS) * prob;
                        if (code < bound) {
                            range = bound;
                            probs[i] = prob + (BIT_MODEL_TOTAL - prob >>> MOVE_BITS);
                            dist = rep2;
                        } else {
                            range -= bound;
                            code -= bound;
                            probs[i] = prob - (prob >>> MOVE_BITS);
                            dist = rep3;
                            rep3 = rep2;
                        }
                        rep2 = rep1;
                    }
                    if (range < TOP_VALUE) {
                        if (inPos >= inputEnd) throw truncated();
                        range = range << 8 >>> 0;
                        code = (code << 8 | input[inPos++]) >>> 0;
                    }
                    rep1 = rep0;
                    rep0 = dist;
                }
                state = stateAfterLongRep(state);
                lenCoder = REP_LEN;
            }
            let treeOffset;
            let treeBits;
            let len;
            i = lenCoder + LEN_CHOICE;
            prob = probs[i];
            bound = (range >>> BIT_MODEL_TOTAL_BITS) * prob;
            if (code < bound) {
                range = bound;
                probs[i] = prob + (BIT_MODEL_TOTAL - prob >>> MOVE_BITS);
                treeOffset = lenCoder + LEN_LOW + posState * LOW_SYMBOLS;
                treeBits = 3;
                len = MATCH_LEN_MIN;
            } else {
                range -= bound;
                code -= bound;
                probs[i] = prob - (prob >>> MOVE_BITS);
                if (range < TOP_VALUE) {
                    if (inPos >= inputEnd) throw truncated();
                    range = range << 8 >>> 0;
                    code = (code << 8 | input[inPos++]) >>> 0;
                }
                i = lenCoder + LEN_CHOICE2;
                prob = probs[i];
                bound = (range >>> BIT_MODEL_TOTAL_BITS) * prob;
                if (code < bound) {
                    range = bound;
                    probs[i] = prob + (BIT_MODEL_TOTAL - prob >>> MOVE_BITS);
                    treeOffset = lenCoder + LEN_MID + posState * MID_SYMBOLS;
                    treeBits = 3;
                    len = MATCH_LEN_MIN + LOW_SYMBOLS;
                } else {
                    range -= bound;
                    code -= bound;
                    probs[i] = prob - (prob >>> MOVE_BITS);
                    treeOffset = lenCoder + LEN_HIGH;
                    treeBits = 8;
                    len = MATCH_LEN_MIN + LOW_SYMBOLS + MID_SYMBOLS;
                }
            }
            if (range < TOP_VALUE) {
                if (inPos >= inputEnd) throw truncated();
                range = range << 8 >>> 0;
                code = (code << 8 | input[inPos++]) >>> 0;
            }
            {
                const end = 1 << treeBits;
                let symbol = 1;
                do {
                    i = treeOffset + symbol;
                    prob = probs[i];
                    bound = (range >>> BIT_MODEL_TOTAL_BITS) * prob;
                    if (code < bound) {
                        range = bound;
                        probs[i] = prob + (BIT_MODEL_TOTAL - prob >>> MOVE_BITS);
                        symbol <<= 1;
                    } else {
                        range -= bound;
                        code -= bound;
                        probs[i] = prob - (prob >>> MOVE_BITS);
                        symbol = symbol << 1 | 1;
                    }
                    if (range < TOP_VALUE) {
                        if (inPos >= inputEnd) throw truncated();
                        range = range << 8 >>> 0;
                        code = (code << 8 | input[inPos++]) >>> 0;
                    }
                }while (symbol < end)
                len += symbol - end;
            }
            if (lenCoder === MATCH_LEN) {
                const slotTree = DIST_SLOTS + (getDistState(len) << DIST_SLOT_BITS);
                let distSlot = 1;
                do {
                    i = slotTree + distSlot;
                    prob = probs[i];
                    bound = (range >>> BIT_MODEL_TOTAL_BITS) * prob;
                    if (code < bound) {
                        range = bound;
                        probs[i] = prob + (BIT_MODEL_TOTAL - prob >>> MOVE_BITS);
                        distSlot <<= 1;
                    } else {
                        range -= bound;
                        code -= bound;
                        probs[i] = prob - (prob >>> MOVE_BITS);
                        distSlot = distSlot << 1 | 1;
                    }
                    if (range < TOP_VALUE) {
                        if (inPos >= inputEnd) throw truncated();
                        range = range << 8 >>> 0;
                        code = (code << 8 | input[inPos++]) >>> 0;
                    }
                }while (distSlot < 1 << DIST_SLOT_BITS)
                distSlot -= 1 << DIST_SLOT_BITS;
                if (distSlot < DIST_MODEL_START) {
                    rep0 = distSlot;
                } else {
                    const footerBits = (distSlot >>> 1) - 1;
                    let dist = (2 | distSlot & 1) << footerBits;
                    let reverseTree;
                    let reverseBits;
                    if (distSlot < DIST_MODEL_END) {
                        reverseTree = distSpecialOffset(distSlot, dist);
                        reverseBits = footerBits;
                    } else {
                        let direct = 0;
                        for(let k = footerBits - ALIGN_BITS; k > 0; --k){
                            range >>>= 1;
                            let bit = 0;
                            if (code >= range) {
                                code -= range;
                                bit = 1;
                            }
                            direct = (direct << 1 | bit) >>> 0;
                            if (range < TOP_VALUE) {
                                if (inPos >= inputEnd) throw truncated();
                                range = range << 8 >>> 0;
                                code = (code << 8 | input[inPos++]) >>> 0;
                            }
                        }
                        dist |= direct << ALIGN_BITS;
                        reverseTree = DIST_ALIGN;
                        reverseBits = ALIGN_BITS;
                    }
                    let symbol = 1;
                    for(let k = 0; k < reverseBits; ++k){
                        i = reverseTree + symbol;
                        prob = probs[i];
                        bound = (range >>> BIT_MODEL_TOTAL_BITS) * prob;
                        if (code < bound) {
                            range = bound;
                            probs[i] = prob + (BIT_MODEL_TOTAL - prob >>> MOVE_BITS);
                            symbol <<= 1;
                        } else {
                            range -= bound;
                            code -= bound;
                            probs[i] = prob - (prob >>> MOVE_BITS);
                            symbol = symbol << 1 | 1;
                            dist |= 1 << k;
                        }
                        if (range < TOP_VALUE) {
                            if (inPos >= inputEnd) throw truncated();
                            range = range << 8 >>> 0;
                            code = (code << 8 | input[inPos++]) >>> 0;
                        }
                    }
                    rep0 = dist | 0;
                    if (rep0 === END_MARKER_DIST) {
                        endMarker = true;
                        break;
                    }
                }
            }
            if (len > outLimit - outPos) throw exceedsSize();
            lz.repeat(rep0, len);
            outPos += len;
        }
        rc.range = range;
        rc.code = code;
        rc.pos = inPos;
        this.state = state;
        this.outPos = outPos;
        reps[0] = rep0;
        reps[1] = rep1;
        reps[2] = rep2;
        reps[3] = rep3;
        return endMarker;
    }
}
function truncated() {
    return new Error("Truncated input");
}
function exceedsSize() {
    return new Error("Corrupted input: data exceeds the declared size");
}

exports["LzmaDecoder"]=LzmaDecoder;
},
"lzma1/src/lzma-encoder-fast.ts":function(module,exports,require){
const {MATCH_LEN_MAX,MATCH_LEN_MIN,REPS}=require("lzma1/src/lzma-coder.ts");
const {LzmaEncoder}=require("lzma1/src/lzma-encoder.ts");
const FAST_EXTRA_SIZE_BEFORE = 1;
const FAST_EXTRA_SIZE_AFTER = MATCH_LEN_MAX - 1;
function changePair(smallDist, bigDist) {
    return smallDist < bigDist >>> 7;
}
class LzmaEncoderFast extends LzmaEncoder {
    matches = null;
    getNextSymbol() {
        if (this.readAhead === -1) {
            this.matches = this.getMatches();
        }
        this.back = -1;
        const avail = Math.min(this.lz.getAvail(), MATCH_LEN_MAX);
        if (avail < MATCH_LEN_MIN) {
            return 1;
        }
        let bestRepLen = 0;
        let bestRepIndex = 0;
        for(let rep = 0; rep < REPS; ++rep){
            const len = this.lz.getMatchLen(0, this.reps[rep], avail);
            if (len < MATCH_LEN_MIN) continue;
            if (len >= this.niceLen) {
                this.back = rep;
                this.skip(len - 1);
                return len;
            }
            if (len > bestRepLen) {
                bestRepIndex = rep;
                bestRepLen = len;
            }
        }
        let mainLen = 0;
        let mainDist = 0;
        let matches = this.matches;
        if (matches.count > 0) {
            mainLen = matches.len[matches.count - 1];
            mainDist = matches.dist[matches.count - 1];
            if (mainLen >= this.niceLen) {
                this.back = mainDist + REPS;
                this.skip(mainLen - 1);
                return mainLen;
            }
            while(matches.count > 1 && mainLen === matches.len[matches.count - 2] + 1){
                if (!changePair(matches.dist[matches.count - 2], mainDist)) break;
                --matches.count;
                mainLen = matches.len[matches.count - 1];
                mainDist = matches.dist[matches.count - 1];
            }
            if (mainLen === MATCH_LEN_MIN && mainDist >= 0x80) {
                mainLen = 1;
            }
        }
        if (bestRepLen >= MATCH_LEN_MIN) {
            if (bestRepLen + 1 >= mainLen || bestRepLen + 2 >= mainLen && mainDist >= 1 << 9 || bestRepLen + 3 >= mainLen && mainDist >= 1 << 15) {
                this.back = bestRepIndex;
                this.skip(bestRepLen - 1);
                return bestRepLen;
            }
        }
        if (mainLen < MATCH_LEN_MIN || avail <= MATCH_LEN_MIN) {
            return 1;
        }
        matches = this.matches = this.getMatches();
        if (matches.count > 0) {
            const newLen = matches.len[matches.count - 1];
            const newDist = matches.dist[matches.count - 1];
            if (newLen >= mainLen && newDist < mainDist || newLen === mainLen + 1 && !changePair(mainDist, newDist) || newLen > mainLen + 1 || newLen + 1 >= mainLen && mainLen >= MATCH_LEN_MIN + 1 && changePair(newDist, mainDist)) {
                return 1;
            }
        }
        const limit = Math.max(mainLen - 1, MATCH_LEN_MIN);
        for(let rep = 0; rep < REPS; ++rep){
            if (this.lz.getMatchLen(0, this.reps[rep], limit) === limit) {
                return 1;
            }
        }
        this.back = mainDist + REPS;
        this.skip(mainLen - 2);
        return mainLen;
    }
}

exports["FAST_EXTRA_SIZE_BEFORE"]=FAST_EXTRA_SIZE_BEFORE;
exports["FAST_EXTRA_SIZE_AFTER"]=FAST_EXTRA_SIZE_AFTER;
exports["LzmaEncoderFast"]=LzmaEncoderFast;
},
"lzma1/src/lzma-encoder-normal.ts":function(module,exports,require){
const {DIST_STATES,IS_MATCH,isLiteralState,MATCH_LEN_MAX,MATCH_LEN_MIN,REPS,stateAfterLiteral,stateAfterLongRep,stateAfterMatch,stateAfterShortRep}=require("lzma1/src/lzma-coder.ts");
const {LzmaEncoder}=require("lzma1/src/lzma-encoder.ts");
const {getBitPrice}=require("lzma1/src/range-encoder.ts");
const OPTS = 4096;
const NORMAL_EXTRA_SIZE_BEFORE = OPTS;
const NORMAL_EXTRA_SIZE_AFTER = OPTS;
const INFINITY_PRICE = 1 << 30;
const LITERAL = -1;
class Optimums {
    price;
    state;
    reps;
    len;
    dist;
    extra;
    constructor(size){
        this.price = new Int32Array(size);
        this.state = new Uint8Array(size);
        this.reps = new Int32Array(size * REPS);
        this.len = new Int32Array(size);
        this.dist = new Int32Array(size);
        this.extra = new Int32Array(size);
        this.clear();
    }
    clear() {
        this.price.fill(INFINITY_PRICE);
        this.state.fill(0);
        this.reps.fill(0);
        this.len.fill(0);
        this.dist.fill(0);
        this.extra.fill(0);
    }
    setSymbol(i, price, from, dist) {
        this.price[i] = price;
        this.len[i] = i - from;
        this.dist[i] = dist;
        this.extra[i] = 0;
    }
    setLiteralRep0(i, price, from) {
        this.price[i] = price;
        this.len[i] = i - from - 1;
        this.dist[i] = 0;
        this.extra[i] = 1;
    }
    setSymbolLiteralRep0(i, price, from, dist, len) {
        this.price[i] = price;
        this.len[i] = i - from - len - 1;
        this.dist[i] = dist;
        this.extra[i] = len + 1;
    }
}
class LzmaEncoderNormal extends LzmaEncoder {
    opts;
    optCur = 0;
    optEnd = 0;
    matches;
    repLens = new Int32Array(REPS);
    constructor(rc, lz, config){
        super(rc, lz, config);
        this.opts = new Optimums(Math.min(config.optsSize, OPTS));
    }
    reset() {
        this.optCur = 0;
        this.optEnd = 0;
        this.opts?.clear();
        super.reset();
    }
    getNextSymbol() {
        const opts = this.opts;
        const lz = this.lz;
        const reps = this.reps;
        const repLens = this.repLens;
        if (this.optCur < this.optEnd) {
            const i = this.optCur++;
            this.back = opts.dist[i];
            return opts.len[i];
        }
        this.optCur = 0;
        this.optEnd = 0;
        this.back = -1;
        if (this.readAhead === -1) {
            this.matches = this.getMatches();
        }
        let avail = Math.min(lz.getAvail(), MATCH_LEN_MAX);
        if (avail < MATCH_LEN_MIN) {
            return 1;
        }
        let repBest = 0;
        for(let rep = 0; rep < REPS; ++rep){
            repLens[rep] = lz.getMatchLen(0, reps[rep], avail);
            if (repLens[rep] < MATCH_LEN_MIN) {
                repLens[rep] = 0;
                continue;
            }
            if (repLens[rep] > repLens[repBest]) {
                repBest = rep;
            }
        }
        if (repLens[repBest] >= this.niceLen) {
            this.back = repBest;
            this.skip(repLens[repBest] - 1);
            return repLens[repBest];
        }
        let mainLen = 0;
        let mainDist = 0;
        const matches = this.matches;
        if (matches.count > 0) {
            mainLen = matches.len[matches.count - 1];
            mainDist = matches.dist[matches.count - 1];
            if (mainLen >= this.niceLen) {
                this.back = mainDist + REPS;
                this.skip(mainLen - 1);
                return mainLen;
            }
        }
        const curByte = lz.getByte(0);
        const matchByte = lz.getByte(reps[0] + 1);
        if (mainLen < MATCH_LEN_MIN && curByte !== matchByte && repLens[repBest] < MATCH_LEN_MIN) {
            return 1;
        }
        let pos = lz.getPos();
        let posState = pos & this.posMask;
        {
            const prevByte = lz.getByte(1);
            const literalPrice = this.getLiteralPrice(curByte, matchByte, prevByte, pos, this.state);
            opts.setSymbol(1, literalPrice, 0, LITERAL);
        }
        let anyMatchPrice = this.getAnyMatchPrice(this.state, posState);
        let anyRepPrice = this.getAnyRepPrice(anyMatchPrice, this.state);
        if (matchByte === curByte) {
            const shortRepPrice = this.getShortRepPrice(anyRepPrice, this.state, posState);
            if (shortRepPrice < opts.price[1]) {
                opts.setSymbol(1, shortRepPrice, 0, 0);
            }
        }
        this.optEnd = Math.max(mainLen, repLens[repBest]);
        if (this.optEnd < MATCH_LEN_MIN) {
            this.back = opts.dist[1];
            return 1;
        }
        this.updatePrices();
        opts.state[0] = this.state;
        opts.reps[0] = reps[0];
        opts.reps[1] = reps[1];
        opts.reps[2] = reps[2];
        opts.reps[3] = reps[3];
        for(let i = this.optEnd; i >= MATCH_LEN_MIN; --i){
            opts.price[i] = INFINITY_PRICE;
        }
        for(let rep = 0; rep < REPS; ++rep){
            let repLen = repLens[rep];
            if (repLen < MATCH_LEN_MIN) continue;
            const longRepPrice = this.getLongRepPrice(anyRepPrice, rep, this.state, posState);
            do {
                const price = longRepPrice + this.repLenEncoder.getPrice(repLen, posState);
                if (price < opts.price[repLen]) {
                    opts.setSymbol(repLen, price, 0, rep);
                }
            }while (--repLen >= MATCH_LEN_MIN)
        }
        {
            let len = Math.max(repLens[0] + 1, MATCH_LEN_MIN);
            if (len <= mainLen) {
                const normalMatchPrice = this.getNormalMatchPrice(anyMatchPrice, this.state);
                let i = 0;
                while(len > matches.len[i]){
                    ++i;
                }
                while(true){
                    const dist = matches.dist[i];
                    const price = this.getMatchAndLenPrice(normalMatchPrice, dist, len, posState);
                    if (price < opts.price[len]) {
                        opts.setSymbol(len, price, 0, dist + REPS);
                    }
                    if (len === matches.len[i] && ++i === matches.count) {
                        break;
                    }
                    ++len;
                }
            }
        }
        avail = Math.min(lz.getAvail(), OPTS - 1);
        while(++this.optCur < this.optEnd){
            this.matches = this.getMatches();
            if (this.matches.count > 0 && this.matches.len[this.matches.count - 1] >= this.niceLen) {
                break;
            }
            --avail;
            ++pos;
            posState = pos & this.posMask;
            this.updateOptStateAndReps();
            const state = opts.state[this.optCur];
            anyMatchPrice = opts.price[this.optCur] + this.getAnyMatchPrice(state, posState);
            anyRepPrice = this.getAnyRepPrice(anyMatchPrice, state);
            this.calc1BytePrices(pos, posState, avail, anyRepPrice);
            if (avail >= MATCH_LEN_MIN) {
                const startLen = this.calcLongRepPrices(pos, posState, avail, anyRepPrice);
                if (this.matches.count > 0) {
                    this.calcNormalMatchPrices(pos, posState, avail, anyMatchPrice, startLen);
                }
            }
        }
        return this.backward(this.optCur);
    }
    backward(end) {
        const { len: lens, dist: dists, extra: extras } = this.opts;
        let cur = end;
        let write = end + 1;
        this.optEnd = write;
        while(true){
            let dist = dists[cur];
            let len = lens[cur];
            const extra = extras[cur];
            cur -= len;
            if (extra !== 0) {
                lens[--write] = len;
                dists[write] = 0;
                cur -= extra;
                len = extra;
                if (extra === 1) {
                    dist = LITERAL;
                } else {
                    lens[--write] = 1;
                    dists[write] = LITERAL;
                    --len;
                }
            }
            if (cur === 0) {
                this.optCur = write;
                this.back = dist;
                return len;
            }
            lens[--write] = len;
            dists[write] = dist;
        }
    }
    updateOptStateAndReps() {
        const { state: states, reps, len: lens, dist: dists, extra: extras } = this.opts;
        const cur = this.optCur;
        const len = lens[cur];
        const dist = dists[cur];
        const extra = extras[cur];
        const prev = cur - len - extra;
        const to = cur * REPS;
        const from = prev * REPS;
        let state = states[prev];
        if (extra === 0) {
            if (len === 1) {
                states[cur] = dist === LITERAL ? stateAfterLiteral(state) : stateAfterShortRep(state);
                reps[to] = reps[from];
                reps[to + 1] = reps[from + 1];
                reps[to + 2] = reps[from + 2];
                reps[to + 3] = reps[from + 3];
                return;
            }
            state = dist < REPS ? stateAfterLongRep(state) : stateAfterMatch(state);
        } else {
            if (extra > 1) {
                state = dist < REPS ? stateAfterLongRep(state) : stateAfterMatch(state);
            }
            state = stateAfterLongRep(stateAfterLiteral(state));
        }
        states[cur] = state;
        if (dist < REPS) {
            reps[to] = reps[from + dist];
            let rep = 1;
            for(; rep <= dist; ++rep){
                reps[to + rep] = reps[from + rep - 1];
            }
            for(; rep < REPS; ++rep){
                reps[to + rep] = reps[from + rep];
            }
        } else {
            reps[to] = dist - REPS;
            reps[to + 1] = reps[from];
            reps[to + 2] = reps[from + 1];
            reps[to + 3] = reps[from + 2];
        }
    }
    calc1BytePrices(pos, posState, avail, anyRepPrice) {
        const opts = this.opts;
        const lz = this.lz;
        const cur = this.optCur;
        const next = cur + 1;
        const nextPrice = opts.price[next];
        const state = opts.state[cur];
        const rep0 = opts.reps[cur * REPS];
        let nextIsByte = false;
        const curByte = lz.getByte(0);
        const matchByte = lz.getByte(rep0 + 1);
        let literalPrice = 0;
        const literalFlagPrice = opts.price[cur] + getBitPrice(this.probs[IS_MATCH + (state << 4) + posState], 0);
        if (!(nextPrice < INFINITY_PRICE && matchByte === curByte) && literalFlagPrice <= nextPrice) {
            literalPrice = opts.price[cur] + this.getLiteralPrice(curByte, matchByte, lz.getByte(1), pos, state);
            if (literalPrice < opts.price[next]) {
                opts.setSymbol(next, literalPrice, cur, LITERAL);
                nextIsByte = true;
            }
        }
        if (matchByte === curByte && isLiteralState(state) && anyRepPrice < opts.price[next] && opts.extra[next] === 0 && (opts.len[next] === 1 || opts.dist[next] !== 0)) {
            const shortRepPrice = this.getShortRepPrice(anyRepPrice, state, posState);
            if (shortRepPrice <= opts.price[next]) {
                opts.setSymbol(next, shortRepPrice, cur, 0);
                nextIsByte = true;
            }
        }
        if (!nextIsByte && literalPrice !== 0 && matchByte !== curByte && avail > MATCH_LEN_MIN) {
            const lenLimit = Math.min(this.niceLen, avail - 1);
            const len = lz.getMatchLen(1, rep0, lenLimit);
            if (len >= MATCH_LEN_MIN) {
                const nextState = stateAfterLiteral(state);
                const nextPosState = pos + 1 & this.posMask;
                const price = literalPrice + this.getLongRepAndLenPrice(0, len, nextState, nextPosState);
                const i = next + len;
                this.extendOptEnd(i);
                if (price < opts.price[i]) {
                    opts.setLiteralRep0(i, price, cur);
                }
            }
        }
    }
    calcLongRepPrices(pos, posState, avail, anyRepPrice) {
        const opts = this.opts;
        const optPrice = opts.price;
        const lz = this.lz;
        const cur = this.optCur;
        const state = opts.state[cur];
        const repsOffset = cur * REPS;
        let startLen = MATCH_LEN_MIN;
        const lenLimit = Math.min(avail, this.niceLen);
        for(let rep = 0; rep < REPS; ++rep){
            const dist = opts.reps[repsOffset + rep];
            const len = lz.getMatchLen(0, dist, lenLimit);
            if (len < MATCH_LEN_MIN) continue;
            this.extendOptEnd(cur + len);
            const longRepPrice = this.getLongRepPrice(anyRepPrice, rep, state, posState);
            const lenPrices = this.repLenEncoder.prices;
            const lenOffset = this.repLenEncoder.priceOffset(posState);
            for(let i = len; i >= MATCH_LEN_MIN; --i){
                const price = longRepPrice + lenPrices[lenOffset + i];
                if (price < optPrice[cur + i]) {
                    opts.setSymbol(cur + i, price, cur, rep);
                }
            }
            if (rep === 0) {
                startLen = len + 1;
            }
            const len2Limit = Math.min(avail - len - 1, this.niceLen);
            if (len2Limit < MATCH_LEN_MIN) continue;
            const len2 = lz.getMatchLen(len + 1, dist, len2Limit);
            if (len2 < MATCH_LEN_MIN) continue;
            let price = longRepPrice + this.repLenEncoder.getPrice(len, posState);
            let nextState = stateAfterLongRep(state);
            const curByte = lz.getByteAt(len, 0);
            const matchByte = lz.getByte(0);
            const prevByte = lz.getByteAt(len, 1);
            price += this.getLiteralPrice(curByte, matchByte, prevByte, pos + len, nextState);
            nextState = stateAfterLiteral(nextState);
            const nextPosState = pos + len + 1 & this.posMask;
            price += this.getLongRepAndLenPrice(0, len2, nextState, nextPosState);
            const i = cur + len + 1 + len2;
            this.extendOptEnd(i);
            if (price < optPrice[i]) {
                opts.setSymbolLiteralRep0(i, price, cur, rep, len);
            }
        }
        return startLen;
    }
    calcNormalMatchPrices(pos, posState, avail, anyMatchPrice, startLen) {
        const opts = this.opts;
        const optPrice = opts.price;
        const lz = this.lz;
        const cur = this.optCur;
        const state = opts.state[cur];
        const matches = this.matches;
        const matchLens = matches.len;
        const matchDists = matches.dist;
        if (matchLens[matches.count - 1] > avail) {
            matches.count = 0;
            while(matchLens[matches.count] < avail){
                ++matches.count;
            }
            matchLens[matches.count++] = avail;
        }
        const count = matches.count;
        if (matchLens[count - 1] < startLen) {
            return;
        }
        this.extendOptEnd(cur + matchLens[count - 1]);
        const normalMatchPrice = this.getNormalMatchPrice(anyMatchPrice, state);
        let match = 0;
        while(startLen > matchLens[match]){
            ++match;
        }
        const lenPrices = this.matchLenEncoder.prices;
        const lenOffset = this.matchLenEncoder.priceOffset(posState);
        let dist = matchDists[match];
        let longDistPrice = this.getDistPrice(DIST_STATES - 1, dist);
        for(let len = startLen;; ++len){
            const distPrice = len < DIST_STATES + MATCH_LEN_MIN ? this.getDistPrice(len - MATCH_LEN_MIN, dist) : longDistPrice;
            const matchAndLenPrice = normalMatchPrice + lenPrices[lenOffset + len] + distPrice;
            if (matchAndLenPrice < optPrice[cur + len]) {
                opts.setSymbol(cur + len, matchAndLenPrice, cur, dist + REPS);
            }
            if (len !== matchLens[match]) {
                continue;
            }
            const len2Limit = Math.min(avail - len - 1, this.niceLen);
            if (len2Limit >= MATCH_LEN_MIN) {
                const len2 = lz.getMatchLen(len + 1, dist, len2Limit);
                if (len2 >= MATCH_LEN_MIN) {
                    let nextState = stateAfterMatch(state);
                    const curByte = lz.getByteAt(len, 0);
                    const matchByte = lz.getByte(0);
                    const prevByte = lz.getByteAt(len, 1);
                    let price = matchAndLenPrice + this.getLiteralPrice(curByte, matchByte, prevByte, pos + len, nextState);
                    nextState = stateAfterLiteral(nextState);
                    const nextPosState = pos + len + 1 & this.posMask;
                    price += this.getLongRepAndLenPrice(0, len2, nextState, nextPosState);
                    const i = cur + len + 1 + len2;
                    this.extendOptEnd(i);
                    if (price < optPrice[i]) {
                        opts.setSymbolLiteralRep0(i, price, cur, dist + REPS, len);
                    }
                }
            }
            if (++match === count) {
                break;
            }
            dist = matchDists[match];
            longDistPrice = this.getDistPrice(DIST_STATES - 1, dist);
        }
    }
    extendOptEnd(end) {
        const price = this.opts.price;
        while(this.optEnd < end){
            price[++this.optEnd] = INFINITY_PRICE;
        }
    }
}

exports["OPTS"]=OPTS;
exports["NORMAL_EXTRA_SIZE_BEFORE"]=NORMAL_EXTRA_SIZE_BEFORE;
exports["NORMAL_EXTRA_SIZE_AFTER"]=NORMAL_EXTRA_SIZE_AFTER;
exports["LzmaEncoderNormal"]=LzmaEncoderNormal;
},
"lzma1/src/lzma-encoder.ts":function(module,exports,require){
const {ALIGN_BITS,ALIGN_MASK,ALIGN_SIZE,DIST_ALIGN,DIST_MODEL_END,DIST_MODEL_START,DIST_SLOT_BITS,DIST_SLOT_COUNT,DIST_SLOTS,DIST_STATES,distSpecialOffset,FULL_DISTANCES,getDistState,IS_MATCH,IS_REP,IS_REP0,IS_REP0_LONG,IS_REP1,IS_REP2,isLiteralState,LEN_CHOICE,LEN_CHOICE2,LEN_HIGH,LEN_LOW,LEN_MID,LITERAL,LOW_SYMBOLS,LzmaCoder,MATCH_LEN,MATCH_LEN_MAX,MATCH_LEN_MIN,MID_SYMBOLS,REP_LEN,REPS,stateAfterLiteral,stateAfterLongRep,stateAfterMatch,stateAfterShortRep}=require("lzma1/src/lzma-coder.ts");
const {initProbs}=require("lzma1/src/range-coder.ts");
const {getBitPrice,getBitTreePrice,getDirectBitsPrice,getReverseBitTreePrice}=require("lzma1/src/range-encoder.ts");
const DIST_PRICE_UPDATE_INTERVAL = FULL_DISTANCES;
const ALIGN_PRICE_UPDATE_INTERVAL = ALIGN_SIZE;
const LEN_PRICE_UPDATE_INTERVAL = 32;
function getDistSlot(dist) {
    if (dist <= DIST_MODEL_START && dist >= 0) {
        return dist;
    }
    const i = 31 - Math.clz32(dist);
    return (i << 1) + (dist >>> i - 1 & 1);
}
class LzmaEncoder extends LzmaCoder {
    rc;
    lz;
    niceLen;
    matchLenEncoder;
    repLenEncoder;
    distPriceCount = 0;
    alignPriceCount = 0;
    distModelsUsed = false;
    alignModelUsed = false;
    distSlotPricesSize;
    distSlotPrices = new Uint32Array(DIST_STATES << DIST_SLOT_BITS);
    fullDistPrices = new Uint32Array(DIST_STATES * FULL_DISTANCES);
    alignPrices = new Uint32Array(ALIGN_SIZE);
    back = 0;
    readAhead = -1;
    constructor(rc, lz, config){
        super(config.lc, config.lp, config.pb);
        this.rc = rc;
        this.lz = lz;
        this.niceLen = config.niceLen;
        this.matchLenEncoder = new LengthEncoder(this.probs, MATCH_LEN, config.pb, config.niceLen);
        this.repLenEncoder = new LengthEncoder(this.probs, REP_LEN, config.pb, config.niceLen);
        this.distSlotPricesSize = getDistSlot(config.dictSize - 1) + 1;
        this.reset();
    }
    restart(rc) {
        this.rc = rc;
        this.lz.reset();
        this.reset();
    }
    reset() {
        super.reset();
        this.matchLenEncoder.reset();
        this.repLenEncoder.reset();
        this.distPriceCount = 0;
        this.alignPriceCount = 0;
        this.distModelsUsed = false;
        this.alignModelUsed = false;
        this.readAhead = -1;
    }
    encode() {
        if (!this.lz.isStarted() && !this.encodeInit()) {
            return;
        }
        while(this.encodeSymbol()){}
    }
    encodeEndMarker() {
        const posState = this.lz.getPos() - this.readAhead & this.posMask;
        this.rc.encodeBit(this.probs, IS_MATCH + (this.state << 4) + posState, 1);
        this.rc.encodeBit(this.probs, IS_REP + this.state, 0);
        this.encodeMatch(-1, MATCH_LEN_MIN, posState);
    }
    encodeInit() {
        if (!this.lz.hasEnoughData(0)) {
            return false;
        }
        this.skip(1);
        this.rc.encodeBit(this.probs, IS_MATCH + (this.state << 4), 0);
        this.encodeLiteral(this.literalOffset(0, 0));
        --this.readAhead;
        return true;
    }
    encodeSymbol() {
        if (!this.lz.hasEnoughData(this.readAhead + 1)) {
            return false;
        }
        const len = this.getNextSymbol();
        const lz = this.lz;
        const rc = this.rc;
        const probs = this.probs;
        const pos = lz.getPos() - this.readAhead;
        const posState = pos & this.posMask;
        const back = this.back;
        if (back === -1) {
            rc.encodeBit(probs, IS_MATCH + (this.state << 4) + posState, 0);
            this.encodeLiteral(this.literalOffset(lz.getByte(1 + this.readAhead), pos));
        } else {
            rc.encodeBit(probs, IS_MATCH + (this.state << 4) + posState, 1);
            if (back < REPS) {
                rc.encodeBit(probs, IS_REP + this.state, 1);
                this.encodeRepMatch(back, len, posState);
            } else {
                rc.encodeBit(probs, IS_REP + this.state, 0);
                this.encodeMatch(back - REPS, len, posState);
            }
        }
        this.readAhead -= len;
        return true;
    }
    encodeLiteral(offset) {
        const symbol = this.lz.getByte(this.readAhead);
        if (isLiteralState(this.state)) {
            this.rc.encodeLiteral(this.probs, offset, symbol);
        } else {
            const matchByte = this.lz.getByte(this.reps[0] + 1 + this.readAhead);
            this.rc.encodeMatchedLiteral(this.probs, offset, symbol, matchByte);
        }
        this.state = stateAfterLiteral(this.state);
    }
    encodeMatch(dist, len, posState) {
        const rc = this.rc;
        const probs = this.probs;
        const reps = this.reps;
        this.state = stateAfterMatch(this.state);
        this.matchLenEncoder.encode(rc, len, posState);
        const distSlot = getDistSlot(dist);
        rc.encodeBitTree(probs, DIST_SLOTS + (getDistState(len) << DIST_SLOT_BITS), DIST_SLOT_BITS, distSlot);
        this.distModelsUsed = true;
        if (distSlot >= DIST_MODEL_START) {
            const footerBits = (distSlot >>> 1) - 1;
            const base = (2 | distSlot & 1) << footerBits;
            const distReduced = dist - base;
            if (distSlot < DIST_MODEL_END) {
                rc.encodeReverseBitTree(probs, distSpecialOffset(distSlot, base), footerBits, distReduced);
            } else {
                rc.encodeDirectBits(distReduced >>> ALIGN_BITS, footerBits - ALIGN_BITS);
                rc.encodeReverseBitTree(probs, DIST_ALIGN, ALIGN_BITS, distReduced & ALIGN_MASK);
                this.alignModelUsed = true;
                --this.alignPriceCount;
            }
        }
        reps[3] = reps[2];
        reps[2] = reps[1];
        reps[1] = reps[0];
        reps[0] = dist;
        --this.distPriceCount;
    }
    encodeRepMatch(rep, len, posState) {
        const rc = this.rc;
        const probs = this.probs;
        const reps = this.reps;
        const state = this.state;
        if (rep === 0) {
            rc.encodeBit(probs, IS_REP0 + state, 0);
            rc.encodeBit(probs, IS_REP0_LONG + (state << 4) + posState, len === 1 ? 0 : 1);
        } else {
            const dist = reps[rep];
            rc.encodeBit(probs, IS_REP0 + state, 1);
            if (rep === 1) {
                rc.encodeBit(probs, IS_REP1 + state, 0);
            } else {
                rc.encodeBit(probs, IS_REP1 + state, 1);
                rc.encodeBit(probs, IS_REP2 + state, rep - 2);
                if (rep === 3) {
                    reps[3] = reps[2];
                }
                reps[2] = reps[1];
            }
            reps[1] = reps[0];
            reps[0] = dist;
        }
        if (len === 1) {
            this.state = stateAfterShortRep(state);
        } else {
            this.repLenEncoder.encode(rc, len, posState);
            this.state = stateAfterLongRep(state);
        }
    }
    getMatches() {
        ++this.readAhead;
        return this.lz.getMatches();
    }
    skip(len) {
        this.readAhead += len;
        this.lz.skip(len);
    }
    getLiteralPrice(curByte, matchByte, prevByte, pos, state) {
        const probs = this.probs;
        const offset = this.literalOffset(prevByte, pos);
        const price = getBitPrice(probs[IS_MATCH + (state << 4) + (pos & this.posMask)], 0);
        return price + (isLiteralState(state) ? getLiteralNormalPrice(probs, offset, curByte) : getLiteralMatchedPrice(probs, offset, curByte, matchByte));
    }
    getAnyMatchPrice(state, posState) {
        return getBitPrice(this.probs[IS_MATCH + (state << 4) + posState], 1);
    }
    getNormalMatchPrice(anyMatchPrice, state) {
        return anyMatchPrice + getBitPrice(this.probs[IS_REP + state], 0);
    }
    getAnyRepPrice(anyMatchPrice, state) {
        return anyMatchPrice + getBitPrice(this.probs[IS_REP + state], 1);
    }
    getShortRepPrice(anyRepPrice, state, posState) {
        const probs = this.probs;
        return anyRepPrice + getBitPrice(probs[IS_REP0 + state], 0) + getBitPrice(probs[IS_REP0_LONG + (state << 4) + posState], 0);
    }
    getLongRepPrice(anyRepPrice, rep, state, posState) {
        const probs = this.probs;
        let price = anyRepPrice;
        if (rep === 0) {
            price += getBitPrice(probs[IS_REP0 + state], 0) + getBitPrice(probs[IS_REP0_LONG + (state << 4) + posState], 1);
        } else {
            price += getBitPrice(probs[IS_REP0 + state], 1);
            if (rep === 1) {
                price += getBitPrice(probs[IS_REP1 + state], 0);
            } else {
                price += getBitPrice(probs[IS_REP1 + state], 1) + getBitPrice(probs[IS_REP2 + state], rep - 2);
            }
        }
        return price;
    }
    getLongRepAndLenPrice(rep, len, state, posState) {
        const anyMatchPrice = this.getAnyMatchPrice(state, posState);
        const anyRepPrice = this.getAnyRepPrice(anyMatchPrice, state);
        const longRepPrice = this.getLongRepPrice(anyRepPrice, rep, state, posState);
        return longRepPrice + this.repLenEncoder.getPrice(len, posState);
    }
    getMatchAndLenPrice(normalMatchPrice, dist, len, posState) {
        return normalMatchPrice + this.matchLenEncoder.getPrice(len, posState) + this.getDistPrice(getDistState(len), dist);
    }
    getDistPrice(distState, dist) {
        if (dist < FULL_DISTANCES) {
            return this.fullDistPrices[distState * FULL_DISTANCES + dist];
        }
        return this.distSlotPrices[(distState << DIST_SLOT_BITS) + getDistSlot(dist)] + this.alignPrices[dist & ALIGN_MASK];
    }
    updatePrices() {
        if (this.distPriceCount <= 0) {
            this.updateDistPrices();
        }
        if (this.alignPriceCount <= 0) {
            this.updateAlignPrices();
        }
        this.matchLenEncoder.updatePrices();
        this.repLenEncoder.updatePrices();
    }
    updateDistPrices() {
        this.distPriceCount = DIST_PRICE_UPDATE_INTERVAL;
        if (this.distModelsUsed) {
            computeDistPrices(this.probs, this.distSlotPricesSize, this.distSlotPrices, this.fullDistPrices);
        } else {
            const initial = getInitialPrices();
            this.distSlotPrices.set(initial.distSlots);
            this.fullDistPrices.set(initial.fullDists);
        }
    }
    updateAlignPrices() {
        this.alignPriceCount = ALIGN_PRICE_UPDATE_INTERVAL;
        if (this.alignModelUsed) {
            computeAlignPrices(this.probs, this.alignPrices);
        } else {
            this.alignPrices.set(getInitialPrices().align);
        }
    }
}
function computeDistPrices(probs, slotCount, slotPrices, fullPrices) {
    for(let distState = 0; distState < DIST_STATES; ++distState){
        const slots = distState << DIST_SLOT_BITS;
        const tree = DIST_SLOTS + slots;
        for(let distSlot = 0; distSlot < slotCount; ++distSlot){
            slotPrices[slots + distSlot] = getBitTreePrice(probs, tree, DIST_SLOT_BITS, distSlot);
        }
        for(let distSlot = DIST_MODEL_END; distSlot < slotCount; ++distSlot){
            const count = (distSlot >>> 1) - 1 - ALIGN_BITS;
            slotPrices[slots + distSlot] += getDirectBitsPrice(count);
        }
        for(let dist = 0; dist < DIST_MODEL_START; ++dist){
            fullPrices[distState * FULL_DISTANCES + dist] = slotPrices[slots + dist];
        }
    }
    let dist = DIST_MODEL_START;
    for(let distSlot = DIST_MODEL_START; distSlot < DIST_MODEL_END; ++distSlot){
        const footerBits = (distSlot >>> 1) - 1;
        const base = (2 | distSlot & 1) << footerBits;
        const tree = distSpecialOffset(distSlot, base);
        for(let i = 0; i < 1 << footerBits; ++i){
            const price = getReverseBitTreePrice(probs, tree, footerBits, dist - base);
            for(let distState = 0; distState < DIST_STATES; ++distState){
                fullPrices[distState * FULL_DISTANCES + dist] = slotPrices[(distState << DIST_SLOT_BITS) + distSlot] + price;
            }
            ++dist;
        }
    }
}
function computeAlignPrices(probs, alignPrices) {
    for(let i = 0; i < ALIGN_SIZE; ++i){
        alignPrices[i] = getReverseBitTreePrice(probs, DIST_ALIGN, ALIGN_BITS, i);
    }
}
function computeLengthPrices(probs, coder, posState, prices, start, count) {
    const end = start + count;
    let i = 0;
    let choice0Price = getBitPrice(probs[coder + LEN_CHOICE], 0);
    const low = coder + LEN_LOW + posState * LOW_SYMBOLS;
    for(; i < LOW_SYMBOLS; ++i){
        prices[start + i] = choice0Price + getBitTreePrice(probs, low, 3, i);
    }
    choice0Price = getBitPrice(probs[coder + LEN_CHOICE], 1);
    let choice1Price = getBitPrice(probs[coder + LEN_CHOICE2], 0);
    const mid = coder + LEN_MID + posState * MID_SYMBOLS;
    for(; i < LOW_SYMBOLS + MID_SYMBOLS; ++i){
        prices[start + i] = choice0Price + choice1Price + getBitTreePrice(probs, mid, 3, i - LOW_SYMBOLS);
    }
    choice1Price = getBitPrice(probs[coder + LEN_CHOICE2], 1);
    for(; start + i < end; ++i){
        prices[start + i] = choice0Price + choice1Price + getBitTreePrice(probs, coder + LEN_HIGH, 8, i - LOW_SYMBOLS - MID_SYMBOLS);
    }
}
let initialPrices;
function getInitialPrices() {
    if (initialPrices === undefined) {
        const probs = new Uint16Array(LITERAL);
        initProbs(probs);
        const distSlots = new Uint32Array(DIST_STATES << DIST_SLOT_BITS);
        const fullDists = new Uint32Array(DIST_STATES * FULL_DISTANCES);
        computeDistPrices(probs, DIST_SLOT_COUNT, distSlots, fullDists);
        const align = new Uint32Array(ALIGN_SIZE);
        computeAlignPrices(probs, align);
        const lengths = new Uint32Array(MATCH_LEN_MAX - MATCH_LEN_MIN + 1);
        computeLengthPrices(probs, MATCH_LEN, 0, lengths, 0, lengths.length);
        initialPrices = {
            distSlots,
            fullDists,
            align,
            lengths
        };
    }
    return initialPrices;
}
function getLiteralNormalPrice(probs, offset, symbol) {
    let price = 0;
    symbol |= 0x100;
    do {
        price += getBitPrice(probs[offset + (symbol >>> 8)], symbol >>> 7 & 1);
        symbol <<= 1;
    }while (symbol < 0x10000)
    return price;
}
function getLiteralMatchedPrice(probs, offset, symbol, matchByte) {
    let price = 0;
    let matchOffset = 0x100;
    symbol |= 0x100;
    do {
        matchByte <<= 1;
        const matchBit = matchByte & matchOffset;
        price += getBitPrice(probs[offset + matchOffset + matchBit + (symbol >>> 8)], symbol >>> 7 & 1);
        symbol <<= 1;
        matchOffset &= ~(matchByte ^ symbol);
    }while (symbol < 0x10000)
    return price;
}
class LengthEncoder {
    probs;
    coder;
    counters;
    used = false;
    prices;
    lenSymbols;
    constructor(probs, coder, pb, niceLen){
        this.probs = probs;
        this.coder = coder;
        const posStates = 1 << pb;
        this.counters = new Int32Array(posStates);
        this.lenSymbols = Math.max(niceLen - MATCH_LEN_MIN + 1, LOW_SYMBOLS + MID_SYMBOLS);
        this.prices = new Uint32Array(posStates * this.lenSymbols);
    }
    reset() {
        this.counters.fill(0);
        this.used = false;
    }
    encode(rc, len, posState) {
        const probs = this.probs;
        const coder = this.coder;
        len -= MATCH_LEN_MIN;
        if (len < LOW_SYMBOLS) {
            rc.encodeBit(probs, coder + LEN_CHOICE, 0);
            rc.encodeBitTree(probs, coder + LEN_LOW + posState * LOW_SYMBOLS, 3, len);
        } else {
            rc.encodeBit(probs, coder + LEN_CHOICE, 1);
            len -= LOW_SYMBOLS;
            if (len < MID_SYMBOLS) {
                rc.encodeBit(probs, coder + LEN_CHOICE2, 0);
                rc.encodeBitTree(probs, coder + LEN_MID + posState * MID_SYMBOLS, 3, len);
            } else {
                rc.encodeBit(probs, coder + LEN_CHOICE2, 1);
                rc.encodeBitTree(probs, coder + LEN_HIGH, 8, len - MID_SYMBOLS);
            }
        }
        --this.counters[posState];
        this.used = true;
    }
    getPrice(len, posState) {
        return this.prices[posState * this.lenSymbols + len - MATCH_LEN_MIN];
    }
    priceOffset(posState) {
        return posState * this.lenSymbols - MATCH_LEN_MIN;
    }
    updatePrices() {
        for(let posState = 0; posState < this.counters.length; ++posState){
            if (this.counters[posState] <= 0) {
                this.counters[posState] = LEN_PRICE_UPDATE_INTERVAL;
                this.updatePosStatePrices(posState);
            }
        }
    }
    updatePosStatePrices(posState) {
        const start = posState * this.lenSymbols;
        if (this.used) {
            computeLengthPrices(this.probs, this.coder, posState, this.prices, start, this.lenSymbols);
        } else {
            const initial = getInitialPrices().lengths;
            for(let i = 0; i < this.lenSymbols; ++i){
                this.prices[start + i] = initial[i];
            }
        }
    }
}

exports["getDistSlot"]=getDistSlot;
exports["LzmaEncoder"]=LzmaEncoder;
exports["LengthEncoder"]=LengthEncoder;
},
"lzma1/src/lzma.ts":function(module,exports,require){
const {AloneDecoder}=require("lzma1/src/alone-decoder.ts");
const {AloneEncoder}=require("lzma1/src/alone-encoder.ts");
const {UNKNOWN_SIZE}=require("lzma1/src/header.ts");
const {DEFAULT_LEVEL,resolveOptions}=require("lzma1/src/options.ts");
const {OutputBuffer}=require("lzma1/src/output-buffer.ts");
const {decodeUtf8,encodeUtf8}=require("lzma1/src/utf8.ts");
function toUint8Array(data) {
    if (data instanceof Uint8Array) {
        return data;
    }
    if (ArrayBuffer.isView(data)) {
        return new Uint8Array(data.buffer, data.byteOffset, data.byteLength);
    }
    if (data instanceof ArrayBuffer) {
        return new Uint8Array(data);
    }
    throw new TypeError("Expected an ArrayBuffer or an ArrayBufferView");
}
function compressData(data, options = DEFAULT_LEVEL) {
    const encoder = new AloneEncoder(resolveOptions(options), data.length, true);
    encoder.write(data);
    return encoder.finish();
}
const PREALLOCATE_LIMIT = 64 << 20;
function decompressData(data) {
    let out;
    let last;
    const decoder = new AloneDecoder((chunk)=>{
        if (decoder.contiguousOutput) {
            last = chunk;
        } else {
            const size = decoder.uncompressedSize;
            out ??= new OutputBuffer(size === UNKNOWN_SIZE ? data.length * 4 : Math.min(size, 1 << 24));
            out.write(chunk);
        }
    }, PREALLOCATE_LIMIT, true);
    decoder.write(data);
    decoder.end();
    if (decoder.contiguousOutput) {
        return last === undefined ? new Uint8Array(0) : new Uint8Array(last.buffer, 0, last.byteOffset + last.length);
    }
    return out?.finish() ?? new Uint8Array(0);
}
class LZMA {
    compress(data, mode = DEFAULT_LEVEL) {
        const result = compressData(toUint8Array(data), mode);
        return new Int8Array(result.buffer, result.byteOffset, result.byteLength);
    }
    compressString(data, mode = DEFAULT_LEVEL) {
        return this.compress(encodeUtf8(data), mode);
    }
    decompress(data) {
        return decompressData(toUint8Array(data));
    }
    decompressString(data) {
        return decodeUtf8(this.decompress(data));
    }
}

exports["toUint8Array"]=toUint8Array;
exports["compressData"]=compressData;
exports["decompressData"]=decompressData;
exports["LZMA"]=LZMA;
},
"lzma1/src/options.ts":function(module,exports,require){
const DEFAULT_LEVEL = 5;
const DICT_SIZE_MIN = 1 << 12;
const DICT_SIZE_MAX = 768 << 20;
const NICE_LEN_MIN = 8;
const NICE_LEN_MAX = 273;
const PRESETS = {
    1: {
        dictSize: 1 << 20,
        mode: "fast",
        matchFinder: "hc4",
        niceLen: 128,
        depth: 8
    },
    2: {
        dictSize: 1 << 21,
        mode: "fast",
        matchFinder: "hc4",
        niceLen: 273,
        depth: 24
    },
    3: {
        dictSize: 1 << 22,
        mode: "fast",
        matchFinder: "hc4",
        niceLen: 273,
        depth: 48
    },
    4: {
        dictSize: 1 << 20,
        mode: "normal",
        matchFinder: "bt4",
        niceLen: 32,
        depth: 0
    },
    5: {
        dictSize: 1 << 21,
        mode: "normal",
        matchFinder: "bt4",
        niceLen: 64,
        depth: 0
    },
    6: {
        dictSize: 1 << 22,
        mode: "normal",
        matchFinder: "bt4",
        niceLen: 64,
        depth: 0
    },
    7: {
        dictSize: 1 << 23,
        mode: "normal",
        matchFinder: "bt4",
        niceLen: 64,
        depth: 0
    },
    8: {
        dictSize: 1 << 24,
        mode: "normal",
        matchFinder: "bt4",
        niceLen: 128,
        depth: 0
    },
    9: {
        dictSize: 1 << 25,
        mode: "normal",
        matchFinder: "bt4",
        niceLen: 273,
        depth: 0
    }
};
function resolveOptions(options = {}) {
    if (typeof options !== "object") {
        options = {
            level: options
        };
    }
    const level = options.level ?? DEFAULT_LEVEL;
    const preset = Object.hasOwn(PRESETS, level) ? PRESETS[level] : undefined;
    if (preset === undefined) {
        throw new RangeError(`Invalid compression level: ${level}`);
    }
    const resolved = {
        ...preset,
        lc: options.lc ?? 3,
        lp: options.lp ?? 0,
        pb: options.pb ?? 2,
        dictSize: options.dictSize ?? preset.dictSize,
        mode: options.mode ?? preset.mode,
        niceLen: options.niceLen ?? preset.niceLen,
        matchFinder: options.matchFinder ?? preset.matchFinder,
        depth: options.depth ?? preset.depth
    };
    checkInteger("lc", resolved.lc, 0, 4);
    checkInteger("lp", resolved.lp, 0, 4);
    if (resolved.lc + resolved.lp > 4) {
        throw new RangeError(`Invalid lc + lp: ${resolved.lc + resolved.lp} (xz accepts at most 4)`);
    }
    checkInteger("pb", resolved.pb, 0, 4);
    checkInteger("dictSize", resolved.dictSize, DICT_SIZE_MIN, DICT_SIZE_MAX);
    checkInteger("niceLen", resolved.niceLen, NICE_LEN_MIN, NICE_LEN_MAX);
    checkInteger("depth", resolved.depth, 0, 0x7FFFFFFF);
    if (resolved.mode !== "fast" && resolved.mode !== "normal") {
        throw new RangeError(`Invalid mode: ${resolved.mode}`);
    }
    if (resolved.matchFinder !== "hc4" && resolved.matchFinder !== "bt4") {
        throw new RangeError(`Invalid matchFinder: ${resolved.matchFinder}`);
    }
    return resolved;
}
function fitDictSize(dictSize, inputSize) {
    if (inputSize >= dictSize) {
        return dictSize;
    }
    for(let n = 12; n < 31; ++n){
        if (1 << n >= inputSize) return Math.min(1 << n, dictSize);
        if ((1 << n) + (1 << n - 1) >= inputSize) return Math.min((1 << n) + (1 << n - 1), dictSize);
    }
    return dictSize;
}
function checkInteger(name, value, min, max) {
    if (!Number.isInteger(value) || value < min || value > max) {
        throw new RangeError(`Invalid ${name}: ${value} (expected an integer ${min}-${max})`);
    }
}

exports["DEFAULT_LEVEL"]=DEFAULT_LEVEL;
exports["DICT_SIZE_MIN"]=DICT_SIZE_MIN;
exports["DICT_SIZE_MAX"]=DICT_SIZE_MAX;
exports["NICE_LEN_MIN"]=NICE_LEN_MIN;
exports["NICE_LEN_MAX"]=NICE_LEN_MAX;
exports["resolveOptions"]=resolveOptions;
exports["fitDictSize"]=fitDictSize;
},
"lzma1/src/output-buffer.ts":function(module,exports,require){
class OutputBuffer {
    buf;
    size = 0;
    constructor(initialCapacity = 256){
        this.buf = new Uint8Array(Math.max(16, initialCapacity));
    }
    write(bytes) {
        const end = this.size + bytes.length;
        if (end > this.buf.length) {
            this.grow(end);
        }
        this.buf.set(bytes, this.size);
        this.size = end;
    }
    finish() {
        return this.size === this.buf.length ? this.buf : this.buf.slice(0, this.size);
    }
    grow(minCapacity) {
        const next = new Uint8Array(Math.max(minCapacity, this.buf.length * 2));
        next.set(this.buf.subarray(0, this.size));
        this.buf = next;
    }
}

exports["OutputBuffer"]=OutputBuffer;
},
"lzma1/src/range-coder.ts":function(module,exports,require){
const TOP_VALUE = 1 << 24;
const BIT_MODEL_TOTAL_BITS = 11;
const BIT_MODEL_TOTAL = 1 << BIT_MODEL_TOTAL_BITS;
const PROB_INIT = BIT_MODEL_TOTAL / 2;
const MOVE_BITS = 5;
function initProbs(probs) {
    probs.fill(PROB_INIT);
}

exports["TOP_VALUE"]=TOP_VALUE;
exports["BIT_MODEL_TOTAL_BITS"]=BIT_MODEL_TOTAL_BITS;
exports["BIT_MODEL_TOTAL"]=BIT_MODEL_TOTAL;
exports["PROB_INIT"]=PROB_INIT;
exports["MOVE_BITS"]=MOVE_BITS;
exports["initProbs"]=initProbs;
},
"lzma1/src/range-decoder.ts":function(module,exports,require){
const RANGE_DECODER_INIT_SIZE = 5;
class RangeDecoder {
    range = 0;
    code = 0;
    input = new Uint8Array(0);
    pos = 0;
    init(input, pos) {
        this.setInput(input, pos);
        if (this.readByte() !== 0x00) {
            throw new Error("Corrupted input: invalid range coder header");
        }
        this.range = 0xFFFFFFFF;
        this.code = 0;
        for(let i = 1; i < RANGE_DECODER_INIT_SIZE; ++i){
            this.code = (this.code << 8 | this.readByte()) >>> 0;
        }
        if (this.code === this.range) {
            throw new Error("Corrupted input: invalid range coder header");
        }
    }
    setInput(input, pos) {
        this.input = input;
        this.pos = pos;
    }
    isFinished() {
        return this.code === 0;
    }
    readByte() {
        if (this.pos >= this.input.length) {
            throw new Error("Truncated input");
        }
        return this.input[this.pos++];
    }
}

exports["RANGE_DECODER_INIT_SIZE"]=RANGE_DECODER_INIT_SIZE;
exports["RangeDecoder"]=RangeDecoder;
},
"lzma1/src/range-encoder.ts":function(module,exports,require){
const {BIT_MODEL_TOTAL,BIT_MODEL_TOTAL_BITS,MOVE_BITS,TOP_VALUE}=require("lzma1/src/range-coder.ts");
const MOVE_REDUCING_BITS = 4;
const BIT_PRICE_SHIFT_BITS = 4;
const PRICES = createPriceTable();
function createPriceTable() {
    const prices = new Uint32Array(BIT_MODEL_TOTAL >>> MOVE_REDUCING_BITS);
    for(let i = (1 << MOVE_REDUCING_BITS) / 2; i < BIT_MODEL_TOTAL; i += 1 << MOVE_REDUCING_BITS){
        let w = i;
        let bitCount = 0;
        for(let j = 0; j < BIT_PRICE_SHIFT_BITS; ++j){
            w *= w;
            bitCount <<= 1;
            while(w >= 0x10000){
                w >>>= 1;
                ++bitCount;
            }
        }
        prices[i >> MOVE_REDUCING_BITS] = (BIT_MODEL_TOTAL_BITS << BIT_PRICE_SHIFT_BITS) - 15 - bitCount;
    }
    return prices;
}
function getBitPrice(prob, bit) {
    return PRICES[(prob ^ -bit & BIT_MODEL_TOTAL - 1) >>> MOVE_REDUCING_BITS];
}
function getBitTreePrice(probs, offset, bits, symbol) {
    let price = 0;
    symbol |= 1 << bits;
    do {
        const bit = symbol & 1;
        symbol >>>= 1;
        price += getBitPrice(probs[offset + symbol], bit);
    }while (symbol !== 1)
    return price;
}
function getReverseBitTreePrice(probs, offset, bits, symbol) {
    let price = 0;
    let index = 1;
    for(let i = 0; i < bits; ++i){
        const bit = symbol & 1;
        symbol >>>= 1;
        price += getBitPrice(probs[offset + index], bit);
        index = index << 1 | bit;
    }
    return price;
}
function getDirectBitsPrice(count) {
    return count << BIT_PRICE_SHIFT_BITS;
}
class RangeEncoder {
    low = 0;
    range = 0xFFFFFFFF;
    cache = 0;
    cacheSize = 1;
    buf;
    size = 0;
    constructor(initialCapacity){
        this.buf = new Uint8Array(Math.max(64, initialCapacity));
    }
    writeBytes(bytes) {
        this.ensureCapacity(bytes.length);
        this.buf.set(bytes, this.size);
        this.size += bytes.length;
    }
    take() {
        const bytes = this.buf.slice(0, this.size);
        this.size = 0;
        return bytes;
    }
    finish() {
        let low = this.low;
        for(let i = 0; i < 5; ++i){
            low = this.shiftLow(low);
        }
        this.low = low;
        return this.size === this.buf.length ? this.buf : this.buf.slice(0, this.size);
    }
    encodeBit(probs, index, bit) {
        const prob = probs[index];
        const bound = (this.range >>> BIT_MODEL_TOTAL_BITS) * prob;
        if (bit === 0) {
            this.range = bound;
            probs[index] = prob + (BIT_MODEL_TOTAL - prob >>> MOVE_BITS);
        } else {
            this.low += bound;
            this.range -= bound;
            probs[index] = prob - (prob >>> MOVE_BITS);
        }
        if (this.range < TOP_VALUE) {
            this.range = this.range << 8 >>> 0;
            this.low = this.shiftLow(this.low);
        }
    }
    encodeBitTree(probs, offset, bits, symbol) {
        let range = this.range;
        let low = this.low;
        let index = 1;
        for(let i = bits - 1; i >= 0; --i){
            const bit = symbol >>> i & 1;
            const prob = probs[offset + index];
            const bound = (range >>> BIT_MODEL_TOTAL_BITS) * prob;
            if (bit === 0) {
                range = bound;
                probs[offset + index] = prob + (BIT_MODEL_TOTAL - prob >>> MOVE_BITS);
            } else {
                low += bound;
                range -= bound;
                probs[offset + index] = prob - (prob >>> MOVE_BITS);
            }
            if (range < TOP_VALUE) {
                range = range << 8 >>> 0;
                low = this.shiftLow(low);
            }
            index = index << 1 | bit;
        }
        this.range = range;
        this.low = low;
    }
    encodeReverseBitTree(probs, offset, bits, symbol) {
        let range = this.range;
        let low = this.low;
        let index = 1;
        for(let i = 0; i < bits; ++i){
            const bit = symbol & 1;
            symbol >>>= 1;
            const prob = probs[offset + index];
            const bound = (range >>> BIT_MODEL_TOTAL_BITS) * prob;
            if (bit === 0) {
                range = bound;
                probs[offset + index] = prob + (BIT_MODEL_TOTAL - prob >>> MOVE_BITS);
            } else {
                low += bound;
                range -= bound;
                probs[offset + index] = prob - (prob >>> MOVE_BITS);
            }
            if (range < TOP_VALUE) {
                range = range << 8 >>> 0;
                low = this.shiftLow(low);
            }
            index = index << 1 | bit;
        }
        this.range = range;
        this.low = low;
    }
    encodeLiteral(probs, offset, symbol) {
        this.encodeBitTree(probs, offset, 8, symbol);
    }
    encodeMatchedLiteral(probs, offset, symbol, matchByte) {
        let range = this.range;
        let low = this.low;
        let matchOffset = 0x100;
        symbol |= 0x100;
        do {
            matchByte <<= 1;
            const matchBit = matchByte & matchOffset;
            const index = offset + matchOffset + matchBit + (symbol >>> 8);
            const bit = symbol >>> 7 & 1;
            const prob = probs[index];
            const bound = (range >>> BIT_MODEL_TOTAL_BITS) * prob;
            if (bit === 0) {
                range = bound;
                probs[index] = prob + (BIT_MODEL_TOTAL - prob >>> MOVE_BITS);
            } else {
                low += bound;
                range -= bound;
                probs[index] = prob - (prob >>> MOVE_BITS);
            }
            if (range < TOP_VALUE) {
                range = range << 8 >>> 0;
                low = this.shiftLow(low);
            }
            symbol <<= 1;
            matchOffset &= ~(matchByte ^ symbol);
        }while (symbol < 0x10000)
        this.range = range;
        this.low = low;
    }
    encodeDirectBits(value, count) {
        let range = this.range;
        let low = this.low;
        do {
            range >>>= 1;
            if ((value >>> --count & 1) !== 0) {
                low += range;
            }
            if (range < TOP_VALUE) {
                range = range << 8 >>> 0;
                low = this.shiftLow(low);
            }
        }while (count !== 0)
        this.range = range;
        this.low = low;
    }
    shiftLow(low) {
        if (low < 0xFF000000 || low >= 0x100000000) {
            const carry = low >= 0x100000000 ? 1 : 0;
            this.ensureCapacity(this.cacheSize);
            const buf = this.buf;
            let size = this.size;
            buf[size++] = this.cache + carry & 0xFF;
            for(let i = 1; i < this.cacheSize; ++i){
                buf[size++] = 0xFF + carry & 0xFF;
            }
            this.size = size;
            this.cacheSize = 0;
            this.cache = low >>> 24 & 0xFF;
        }
        ++this.cacheSize;
        return (low & 0x00FFFFFF) * 256;
    }
    ensureCapacity(extra) {
        if (this.size + extra > this.buf.length) {
            const grown = new Uint8Array(Math.max(this.size + extra, this.buf.length * 2));
            grown.set(this.buf.subarray(0, this.size));
            this.buf = grown;
        }
    }
}

exports["getBitPrice"]=getBitPrice;
exports["getBitTreePrice"]=getBitTreePrice;
exports["getReverseBitTreePrice"]=getReverseBitTreePrice;
exports["getDirectBitsPrice"]=getDirectBitsPrice;
exports["RangeEncoder"]=RangeEncoder;
},
"lzma1/src/utf8.ts":function(module,exports,require){
const encoder = new TextEncoder();
const decoder = new TextDecoder("utf-8", {
    fatal: true,
    ignoreBOM: true
});
function encodeUtf8(text) {
    return encoder.encode(text);
}
function decodeUtf8(bytes) {
    try {
        return decoder.decode(bytes);
    } catch  {
        return decodeModifiedUtf8(bytes) ?? decodeLatin1(bytes);
    }
}
function decodeModifiedUtf8(bytes) {
    const codes = new Uint16Array(bytes.length);
    let n = 0;
    for(let i = 0; i < bytes.length; ++i){
        const x = bytes[i];
        if (x < 0x80) {
            codes[n++] = x;
        } else if ((x & 0xE0) === 0xC0) {
            const y = bytes[++i];
            if (i >= bytes.length || (y & 0xC0) !== 0x80) return null;
            codes[n++] = (x & 0x1F) << 6 | y & 0x3F;
        } else if ((x & 0xF0) === 0xE0) {
            const y = bytes[++i];
            const z = bytes[++i];
            if (i >= bytes.length || (y & 0xC0) !== 0x80 || (z & 0xC0) !== 0x80) return null;
            codes[n++] = (x & 0x0F) << 12 | (y & 0x3F) << 6 | z & 0x3F;
        } else {
            return null;
        }
    }
    return fromCharCodes(codes.subarray(0, n));
}
function decodeLatin1(bytes) {
    return fromCharCodes(bytes);
}
function fromCharCodes(codes) {
    const CHUNK = 0x2000;
    let result = "";
    for(let i = 0; i < codes.length; i += CHUNK){
        result += String.fromCharCode.apply(null, codes.subarray(i, i + CHUNK));
    }
    return result;
}

exports["encodeUtf8"]=encodeUtf8;
exports["decodeUtf8"]=decodeUtf8;
},
"lzma1/src/web-streams.ts":function(module,exports,require){
const {AloneDecoder}=require("lzma1/src/alone-decoder.ts");
const {AloneEncoder}=require("lzma1/src/alone-encoder.ts");
const {toUint8Array}=require("lzma1/src/lzma.ts");
const {resolveOptions}=require("lzma1/src/options.ts");
const TransformStreamBase = globalThis.TransformStream ?? class {
    constructor(){
        throw new Error("TransformStream is not available in this runtime");
    }
};
class Compress extends TransformStreamBase {
    constructor(options){
        const encoder = new AloneEncoder(resolveOptions(options));
        super({
            transform (chunk, controller) {
                encoder.write(toUint8Array(chunk));
                const output = encoder.take();
                if (output.length > 0) {
                    controller.enqueue(output);
                }
            },
            flush (controller) {
                controller.enqueue(encoder.finish());
            }
        });
    }
}
class Decompress extends TransformStreamBase {
    constructor(){
        let enqueue;
        const decoder = new AloneDecoder((chunk)=>enqueue(chunk.slice()));
        super({
            start (controller) {
                enqueue = (chunk)=>controller.enqueue(chunk);
            },
            transform (chunk) {
                decoder.write(toUint8Array(chunk));
            },
            flush () {
                decoder.end();
            }
        });
    }
}

exports["Compress"]=Compress;
exports["Decompress"]=Decompress;
},
"qr-esm/index.js":function(module,exports,require){
/*  qr.js: QR code generator in pure Javascript (2011)
 *  Author: Kang Seonghoon <kang.seonghoon@mearie.org> 
 *
 *  Converted in ESM library by Horacio Gonzalez <horacio.gonzalez@gmail.com>
 *  
 * @licence MIT 
 */


/* Quick overview: QR code composed of 2D array of modules (a rectangular
 * area that conveys one bit of information); some modules are fixed to help
 * the recognition of the code, and remaining data modules are further divided
 * into 8-bit code words which are augumented by Reed-Solomon error correcting
 * codes (ECC). There could be multiple ECCs, in the case the code is so large
 * that it is helpful to split the raw data into several chunks.
 *
 * The number of modules is determined by the code's "version", ranging from 1
 * (21x21) to 40 (177x177). How many ECC bits are used is determined by the
 * ECC level (L/M/Q/H). The number and size (and thus the order of generator
 * polynomial) of ECCs depend to the version and ECC level.
 */

// per-version information (cf. JIS X 0510:2004 pp. 30--36, 71)
//
// [0]: the degree of generator polynomial by ECC levels
// [1]: # of code blocks by ECC levels
// [2]: left-top positions of alignment patterns
//
// the number in this table (in particular, [0]) does not exactly match with
// the numbers in the specficiation. see augumenteccs below for the reason.
var VERSIONS = [
	null,
	[[10, 7,17,13], [ 1, 1, 1, 1], []],
	[[16,10,28,22], [ 1, 1, 1, 1], [4,16]],
	[[26,15,22,18], [ 1, 1, 2, 2], [4,20]],
	[[18,20,16,26], [ 2, 1, 4, 2], [4,24]],
	[[24,26,22,18], [ 2, 1, 4, 4], [4,28]],
	[[16,18,28,24], [ 4, 2, 4, 4], [4,32]],
	[[18,20,26,18], [ 4, 2, 5, 6], [4,20,36]],
	[[22,24,26,22], [ 4, 2, 6, 6], [4,22,40]],
	[[22,30,24,20], [ 5, 2, 8, 8], [4,24,44]],
	[[26,18,28,24], [ 5, 4, 8, 8], [4,26,48]],
	[[30,20,24,28], [ 5, 4,11, 8], [4,28,52]],
	[[22,24,28,26], [ 8, 4,11,10], [4,30,56]],
	[[22,26,22,24], [ 9, 4,16,12], [4,32,60]],
	[[24,30,24,20], [ 9, 4,16,16], [4,24,44,64]],
	[[24,22,24,30], [10, 6,18,12], [4,24,46,68]],
	[[28,24,30,24], [10, 6,16,17], [4,24,48,72]],
	[[28,28,28,28], [11, 6,19,16], [4,28,52,76]],
	[[26,30,28,28], [13, 6,21,18], [4,28,54,80]],
	[[26,28,26,26], [14, 7,25,21], [4,28,56,84]],
	[[26,28,28,30], [16, 8,25,20], [4,32,60,88]],
	[[26,28,30,28], [17, 8,25,23], [4,26,48,70,92]],
	[[28,28,24,30], [17, 9,34,23], [4,24,48,72,96]],
	[[28,30,30,30], [18, 9,30,25], [4,28,52,76,100]],
	[[28,30,30,30], [20,10,32,27], [4,26,52,78,104]],
	[[28,26,30,30], [21,12,35,29], [4,30,56,82,108]],
	[[28,28,30,28], [23,12,37,34], [4,28,56,84,112]],
	[[28,30,30,30], [25,12,40,34], [4,32,60,88,116]],
	[[28,30,30,30], [26,13,42,35], [4,24,48,72,96,120]],
	[[28,30,30,30], [28,14,45,38], [4,28,52,76,100,124]],
	[[28,30,30,30], [29,15,48,40], [4,24,50,76,102,128]],
	[[28,30,30,30], [31,16,51,43], [4,28,54,80,106,132]],
	[[28,30,30,30], [33,17,54,45], [4,32,58,84,110,136]],
	[[28,30,30,30], [35,18,57,48], [4,28,56,84,112,140]],
	[[28,30,30,30], [37,19,60,51], [4,32,60,88,116,144]],
	[[28,30,30,30], [38,19,63,53], [4,28,52,76,100,124,148]],
	[[28,30,30,30], [40,20,66,56], [4,22,48,74,100,126,152]],
	[[28,30,30,30], [43,21,70,59], [4,26,52,78,104,130,156]],
	[[28,30,30,30], [45,22,74,62], [4,30,56,82,108,134,160]],
	[[28,30,30,30], [47,24,77,65], [4,24,52,80,108,136,164]],
	[[28,30,30,30], [49,25,81,68], [4,28,56,84,112,140,168]]];

// mode constants (cf. Table 2 in JIS X 0510:2004 p. 16)
var MODE_TERMINATOR = 0;
var MODE_NUMERIC = 1, MODE_ALPHANUMERIC = 2, MODE_OCTET = 4, MODE_KANJI = 8;

// validation regexps
var NUMERIC_REGEXP = /^\d*$/;
var ALPHANUMERIC_REGEXP = /^[A-Za-z0-9 $%*+\-./:_]*$/;
var ALPHANUMERIC_OUT_REGEXP = /^[A-Z0-9 $%*+\-./:_]*$/;

// ECC levels (cf. Table 22 in JIS X 0510:2004 p. 45)
var ECCLEVEL_L = 1, ECCLEVEL_M = 0, ECCLEVEL_Q = 3, ECCLEVEL_H = 2;

// GF(2^8)-to-integer mapping with a reducing polynomial x^8+x^4+x^3+x^2+1
// invariant: GF256_MAP[GF256_INVMAP[i]] == i for all i in [1,256)
var GF256_MAP = [], GF256_INVMAP = [-1];
for (var i = 0, v = 1; i < 255; ++i) {
	GF256_MAP.push(v);
	GF256_INVMAP[v] = i;
	v = (v * 2) ^ (v >= 128 ? 0x11d : 0);
}

// generator polynomials up to degree 30
// (should match with polynomials in JIS X 0510:2004 Appendix A)
//
// generator polynomial of degree K is product of (x-\alpha^0), (x-\alpha^1),
// ..., (x-\alpha^(K-1)). by convention, we omit the K-th coefficient (always 1)
// from the result; also other coefficients are written in terms of the exponent
// to \alpha to avoid the redundant calculation. (see also calculateecc below.)
var GF256_GENPOLY = [[]];
for (var i = 0; i < 30; ++i) {
	var prevpoly = GF256_GENPOLY[i], poly = [];
	for (var j = 0; j <= i; ++j) {
		var a = (j < i ? GF256_MAP[prevpoly[j]] : 0);
		var b = GF256_MAP[(i + (prevpoly[j-1] || 0)) % 255];
		poly.push(GF256_INVMAP[a ^ b]);
	}
	GF256_GENPOLY.push(poly);
}

// alphanumeric character mapping (cf. Table 5 in JIS X 0510:2004 p. 19)
var ALPHANUMERIC_MAP = {};
for (var i = 0; i < 45; ++i) {
	ALPHANUMERIC_MAP['0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ $%*+-./:'.charAt(i)] = i;
}

// mask functions in terms of row # and column #
// (cf. Table 20 in JIS X 0510:2004 p. 42)
var MASKFUNCS = [
	function(i,j) { return (i+j) % 2 == 0; },
	function(i,j) { return i % 2 == 0; },
	function(i,j) { return j % 3 == 0; },
	function(i,j) { return (i+j) % 3 == 0; },
	function(i,j) { return (((i/2)|0) + ((j/3)|0)) % 2 == 0; },
	function(i,j) { return (i*j) % 2 + (i*j) % 3 == 0; },
	function(i,j) { return ((i*j) % 2 + (i*j) % 3) % 2 == 0; },
	function(i,j) { return ((i+j) % 2 + (i*j) % 3) % 2 == 0; }];

// returns true when the version information has to be embeded.
var needsverinfo = function(ver) { return ver > 6; };

// returns the size of entire QR code for given version.
var getsizebyver = function(ver) { return 4 * ver + 17; };

// returns the number of bits available for code words in this version.
var nfullbits = function(ver) {
	/*
	 * |<--------------- n --------------->|
	 * |        |<----- n-17 ---->|        |
	 * +-------+                ///+-------+ ----
	 * |       |                ///|       |    ^
	 * |  9x9  |       @@@@@    ///|  9x8  |    |
	 * |       | # # # @5x5@ # # # |       |    |
	 * +-------+       @@@@@       +-------+    |
	 *       #                               ---|
	 *                                        ^ |
	 *       #                                |
	 *     @@@@@       @@@@@       @@@@@      | n
	 *     @5x5@       @5x5@       @5x5@   n-17
	 *     @@@@@       @@@@@       @@@@@      | |
	 *       #                                | |
	 * //////                                 v |
	 * //////#                               ---|
	 * +-------+       @@@@@       @@@@@        |
	 * |       |       @5x5@       @5x5@        |
	 * |  8x9  |       @@@@@       @@@@@        |
	 * |       |                                v
	 * +-------+                             ----
	 *
	 * when the entire code has n^2 modules and there are m^2-3 alignment
	 * patterns, we have:
	 * - 225 (= 9x9 + 9x8 + 8x9) modules for finder patterns and
	 *   format information;
	 * - 2n-34 (= 2(n-17)) modules for timing patterns;
	 * - 36 (= 3x6 + 6x3) modules for version information, if any;
	 * - 25m^2-75 (= (m^2-3)(5x5)) modules for alignment patterns
	 *   if any, but 10m-20 (= 2(m-2)x5) of them overlaps with
	 *   timing patterns.
	 */
	var v = VERSIONS[ver];
	var nbits = 16*ver*ver + 128*ver + 64; // finder, timing and format info.
	if (needsverinfo(ver)) nbits -= 36; // version information
	if (v[2].length) { // alignment patterns
		nbits -= 25 * v[2].length * v[2].length - 10 * v[2].length - 55;
	}
	return nbits;
};

// returns the number of bits available for data portions (i.e. excludes ECC
// bits but includes mode and length bits) in this version and ECC level.
var ndatabits = function(ver, ecclevel) {
	var nbits = nfullbits(ver) & ~7; // no sub-octet code words
	var v = VERSIONS[ver];
	nbits -= 8 * v[0][ecclevel] * v[1][ecclevel]; // ecc bits
	return nbits;
}

// returns the number of bits required for the length of data.
// (cf. Table 3 in JIS X 0510:2004 p. 16)
var ndatalenbits = function(ver, mode) {
	switch (mode) {
	case MODE_NUMERIC: return (ver < 10 ? 10 : ver < 27 ? 12 : 14);
	case MODE_ALPHANUMERIC: return (ver < 10 ? 9 : ver < 27 ? 11 : 13);
	case MODE_OCTET: return (ver < 10 ? 8 : 16);
	case MODE_KANJI: return (ver < 10 ? 8 : ver < 27 ? 10 : 12);
	}
};

// returns the maximum length of data possible in given configuration.
var getmaxdatalen = function(ver, mode, ecclevel) {
	var nbits = ndatabits(ver, ecclevel) - 4 - ndatalenbits(ver, mode); // 4 for mode bits
	switch (mode) {
	case MODE_NUMERIC:
		return ((nbits/10) | 0) * 3 + (nbits%10 < 4 ? 0 : nbits%10 < 7 ? 1 : 2);
	case MODE_ALPHANUMERIC:
		return ((nbits/11) | 0) * 2 + (nbits%11 < 6 ? 0 : 1);
	case MODE_OCTET:
		return (nbits/8) | 0;
	case MODE_KANJI:
		return (nbits/13) | 0;
	}
};

// checks if the given data can be encoded in given mode, and returns
// the converted data for the further processing if possible. otherwise
// returns null.
//
// this function does not check the length of data; it is a duty of
// encode function below (as it depends on the version and ECC level too).
var validatedata = function(mode, data) {
	switch (mode) {
	case MODE_NUMERIC:
		if (!data.match(NUMERIC_REGEXP)) return null;
		return data;

	case MODE_ALPHANUMERIC:
		if (!data.match(ALPHANUMERIC_REGEXP)) return null;
		return data.toUpperCase();

	case MODE_OCTET:
		if (typeof data === 'string') { // encode as utf-8 string
			var newdata = [];
			for (var i = 0; i < data.length; ++i) {
				var ch = data.charCodeAt(i);
				if (ch < 0x80) {
					newdata.push(ch);
				} else if (ch < 0x800) {
					newdata.push(0xc0 | (ch >> 6),
						0x80 | (ch & 0x3f));
				} else if (ch < 0x10000) {
					newdata.push(0xe0 | (ch >> 12),
						0x80 | ((ch >> 6) & 0x3f),
						0x80 | (ch & 0x3f));
				} else {
					newdata.push(0xf0 | (ch >> 18),
						0x80 | ((ch >> 12) & 0x3f),
						0x80 | ((ch >> 6) & 0x3f),
						0x80 | (ch & 0x3f));
				}
			}
			return newdata;
		} else {
			return data;
		}
	}
};

// returns the code words (sans ECC bits) for given data and configurations.
// requires data to be preprocessed by validatedata. no length check is
// performed, and everything has to be checked before calling this function.
var encode = function(ver, mode, data, maxbuflen) {
	var buf = [];
	var bits = 0, remaining = 8;
	var datalen = data.length;

	// this function is intentionally no-op when n=0.
	var pack = function(x, n) {
		if (n >= remaining) {
			buf.push(bits | (x >> (n -= remaining)));
			while (n >= 8) buf.push((x >> (n -= 8)) & 255);
			bits = 0;
			remaining = 8;
		}
		if (n > 0) bits |= (x & ((1 << n) - 1)) << (remaining -= n);
	};

	var nlenbits = ndatalenbits(ver, mode);
	pack(mode, 4);
	pack(datalen, nlenbits);

	switch (mode) {
	case MODE_NUMERIC:
		for (var i = 2; i < datalen; i += 3) {
			pack(parseInt(data.substring(i-2,i+1), 10), 10);
		}
		pack(parseInt(data.substring(i-2), 10), [0,4,7][datalen%3]);
		break;

	case MODE_ALPHANUMERIC:
		for (var i = 1; i < datalen; i += 2) {
			pack(ALPHANUMERIC_MAP[data.charAt(i-1)] * 45 +
				ALPHANUMERIC_MAP[data.charAt(i)], 11);
		}
		if (datalen % 2 == 1) {
			pack(ALPHANUMERIC_MAP[data.charAt(i-1)], 6);
		}
		break;

	case MODE_OCTET:
		for (var i = 0; i < datalen; ++i) {
			pack(data[i], 8);
		}
		break;
	};

	// final bits. it is possible that adding terminator causes the buffer
	// to overflow, but then the buffer truncated to the maximum size will
	// be valid as the truncated terminator mode bits and padding is
	// identical in appearance (cf. JIS X 0510:2004 sec 8.4.8).
	pack(MODE_TERMINATOR, 4);
	if (remaining < 8) buf.push(bits);

	// the padding to fill up the remaining space. we should not add any
	// words when the overflow already occurred.
	while (buf.length + 1 < maxbuflen) buf.push(0xec, 0x11);
	if (buf.length < maxbuflen) buf.push(0xec);
	return buf;
};

// calculates ECC code words for given code words and generator polynomial.
//
// this is quite similar to CRC calculation as both Reed-Solomon and CRC use
// the certain kind of cyclic codes, which is effectively the division of
// zero-augumented polynomial by the generator polynomial. the only difference
// is that Reed-Solomon uses GF(2^8), instead of CRC's GF(2), and Reed-Solomon
// uses the different generator polynomial than CRC's.
var calculateecc = function(poly, genpoly) {
	var modulus = poly.slice(0);
	var polylen = poly.length, genpolylen = genpoly.length;
	for (var i = 0; i < genpolylen; ++i) modulus.push(0);
	for (var i = 0; i < polylen; ) {
		var quotient = GF256_INVMAP[modulus[i++]];
		if (quotient >= 0) {
			for (var j = 0; j < genpolylen; ++j) {
				modulus[i+j] ^= GF256_MAP[(quotient + genpoly[j]) % 255];
			}
		}
	}
	return modulus.slice(polylen);
};

// auguments ECC code words to given code words. the resulting words are
// ready to be encoded in the matrix.
//
// the much of actual augumenting procedure follows JIS X 0510:2004 sec 8.7.
// the code is simplified using the fact that the size of each code & ECC
// blocks is almost same; for example, when we have 4 blocks and 46 data words
// the number of code words in those blocks are 11, 11, 12, 12 respectively.
var augumenteccs = function(poly, nblocks, genpoly) {
	var subsizes = [];
	var subsize = (poly.length / nblocks) | 0, subsize0 = 0;
	var pivot = nblocks - poly.length % nblocks;
	for (var i = 0; i < pivot; ++i) {
		subsizes.push(subsize0);
		subsize0 += subsize;
	}
	for (var i = pivot; i < nblocks; ++i) {
		subsizes.push(subsize0);
		subsize0 += subsize+1;
	}
	subsizes.push(subsize0);

	var eccs = [];
	for (var i = 0; i < nblocks; ++i) {
		eccs.push(calculateecc(poly.slice(subsizes[i], subsizes[i+1]), genpoly));
	}

	var result = [];
	var nitemsperblock = (poly.length / nblocks) | 0;
	for (var i = 0; i < nitemsperblock; ++i) {
		for (var j = 0; j < nblocks; ++j) {
			result.push(poly[subsizes[j] + i]);
		}
	}
	for (var j = pivot; j < nblocks; ++j) {
		result.push(poly[subsizes[j+1] - 1]);
	}
	for (var i = 0; i < genpoly.length; ++i) {
		for (var j = 0; j < nblocks; ++j) {
			result.push(eccs[j][i]);
		}
	}
	return result;
};

// auguments BCH(p+q,q) code to the polynomial over GF(2), given the proper
// genpoly. the both input and output are in binary numbers, and unlike
// calculateecc genpoly should include the 1 bit for the highest degree.
//
// actual polynomials used for this procedure are as follows:
// - p=10, q=5, genpoly=x^10+x^8+x^5+x^4+x^2+x+1 (JIS X 0510:2004 Appendix C)
// - p=18, q=6, genpoly=x^12+x^11+x^10+x^9+x^8+x^5+x^2+1 (ibid. Appendix D)
var augumentbch = function(poly, p, genpoly, q) {
	var modulus = poly << q;
	for (var i = p - 1; i >= 0; --i) {
		if ((modulus >> (q+i)) & 1) modulus ^= genpoly << i;
	}
	return (poly << q) | modulus;
};

// creates the base matrix for given version. it returns two matrices, one of
// them is the actual one and the another represents the "reserved" portion
// (e.g. finder and timing patterns) of the matrix.
//
// some entries in the matrix may be undefined, rather than 0 or 1. this is
// intentional (no initialization needed!), and putdata below will fill
// the remaining ones.
var makebasematrix = function(ver) {
	var v = VERSIONS[ver], n = getsizebyver(ver);
	var matrix = [], reserved = [];
	for (var i = 0; i < n; ++i) {
		matrix.push([]);
		reserved.push([]);
	}

	var blit = function(y, x, h, w, bits) {
		for (var i = 0; i < h; ++i) {
			for (var j = 0; j < w; ++j) {
				matrix[y+i][x+j] = (bits[i] >> j) & 1;
				reserved[y+i][x+j] = 1;
			}
		}
	};

	// finder patterns and a part of timing patterns
	// will also mark the format information area (not yet written) as reserved.
	blit(0, 0, 9, 9, [0x7f, 0x41, 0x5d, 0x5d, 0x5d, 0x41, 0x17f, 0x00, 0x40]);
	blit(n-8, 0, 8, 9, [0x100, 0x7f, 0x41, 0x5d, 0x5d, 0x5d, 0x41, 0x7f]);
	blit(0, n-8, 9, 8, [0xfe, 0x82, 0xba, 0xba, 0xba, 0x82, 0xfe, 0x00, 0x00]);

	// the rest of timing patterns
	for (var i = 9; i < n-8; ++i) {
		matrix[6][i] = matrix[i][6] = ~i & 1;
		reserved[6][i] = reserved[i][6] = 1;
	}

	// alignment patterns
	var aligns = v[2], m = aligns.length;
	for (var i = 0; i < m; ++i) {
		var minj = (i==0 || i==m-1 ? 1 : 0), maxj = (i==0 ? m-1 : m);
		for (var j = minj; j < maxj; ++j) {
			blit(aligns[i], aligns[j], 5, 5, [0x1f, 0x11, 0x15, 0x11, 0x1f]);
		}
	}

	// version information
	if (needsverinfo(ver)) {
		var code = augumentbch(ver, 6, 0x1f25, 12);
		var k = 0;
		for (var i = 0; i < 6; ++i) {
			for (var j = 0; j < 3; ++j) {
				matrix[i][(n-11)+j] = matrix[(n-11)+j][i] = (code >> k++) & 1;
				reserved[i][(n-11)+j] = reserved[(n-11)+j][i] = 1;
			}
		}
	}

	return {matrix: matrix, reserved: reserved};
};

// fills the data portion (i.e. unmarked in reserved) of the matrix with given
// code words. the size of code words should be no more than available bits,
// and remaining bits are padded to 0 (cf. JIS X 0510:2004 sec 8.7.3).
var putdata = function(matrix, reserved, buf) {
	var n = matrix.length;
	var k = 0, dir = -1;
	for (var i = n-1; i >= 0; i -= 2) {
		if (i == 6) --i; // skip the entire timing pattern column
		var jj = (dir < 0 ? n-1 : 0);
		for (var j = 0; j < n; ++j) {
			for (var ii = i; ii > i-2; --ii) {
				if (!reserved[jj][ii]) {
					// may overflow, but (undefined >> x)
					// is 0 so it will auto-pad to zero.
					matrix[jj][ii] = (buf[k >> 3] >> (~k&7)) & 1;
					++k;
				}
			}
			jj += dir;
		}
		dir = -dir;
	}
	return matrix;
};

// XOR-masks the data portion of the matrix. repeating the call with the same
// arguments will revert the prior call (convenient in the matrix evaluation).
var maskdata = function(matrix, reserved, mask) {
	var maskf = MASKFUNCS[mask];
	var n = matrix.length;
	for (var i = 0; i < n; ++i) {
		for (var j = 0; j < n; ++j) {
			if (!reserved[i][j]) matrix[i][j] ^= maskf(i,j);
		}
	}
	return matrix;
}

// puts the format information.
var putformatinfo = function(matrix, reserved, ecclevel, mask) {
	var n = matrix.length;
	var code = augumentbch((ecclevel << 3) | mask, 5, 0x537, 10) ^ 0x5412;
	for (var i = 0; i < 15; ++i) {
		var r = [0,1,2,3,4,5,7,8,n-7,n-6,n-5,n-4,n-3,n-2,n-1][i];
		var c = [n-1,n-2,n-3,n-4,n-5,n-6,n-7,n-8,7,5,4,3,2,1,0][i];
		matrix[r][8] = matrix[8][c] = (code >> i) & 1;
		// we don't have to mark those bits reserved; always done
		// in makebasematrix above.
	}
	return matrix;
};

// evaluates the resulting matrix and returns the score (lower is better).
// (cf. JIS X 0510:2004 sec 8.8.2)
//
// the evaluation procedure tries to avoid the problematic patterns naturally
// occuring from the original matrix. for example, it penaltizes the patterns
// which just look like the finder pattern which will confuse the decoder.
// we choose the mask which results in the lowest score among 8 possible ones.
//
// note: zxing seems to use the same procedure and in many cases its choice
// agrees to ours, but sometimes it does not. practically it doesn't matter.
var evaluatematrix = function(matrix) {
	// N1+(k-5) points for each consecutive row of k same-colored modules,
	// where k >= 5. no overlapping row counts.
	var PENALTY_CONSECUTIVE = 3;
	// N2 points for each 2x2 block of same-colored modules.
	// overlapping block does count.
	var PENALTY_TWOBYTWO = 3;
	// N3 points for each pattern with >4W:1B:1W:3B:1W:1B or
	// 1B:1W:3B:1W:1B:>4W, or their multiples (e.g. highly unlikely,
	// but 13W:3B:3W:9B:3W:3B counts).
	var PENALTY_FINDERLIKE = 40;
	// N4*k points for every (5*k)% deviation from 50% black density.
	// i.e. k=1 for 55~60% and 40~45%, k=2 for 60~65% and 35~40%, etc.
	var PENALTY_DENSITY = 10;

	var evaluategroup = function(groups) { // assumes [W,B,W,B,W,...,B,W]
		var score = 0;
		for (var i = 0; i < groups.length; ++i) {
			if (groups[i] >= 5) score += PENALTY_CONSECUTIVE + (groups[i]-5);
		}
		for (var i = 5; i < groups.length; i += 2) {
			var p = groups[i];
			if (groups[i-1] == p && groups[i-2] == 3*p && groups[i-3] == p &&
					groups[i-4] == p && (groups[i-5] >= 4*p || groups[i+1] >= 4*p)) {
				// this part differs from zxing...
				score += PENALTY_FINDERLIKE;
			}
		}
		return score;
	};

	var n = matrix.length;
	var score = 0, nblacks = 0;
	for (var i = 0; i < n; ++i) {
		var row = matrix[i];
		var groups;

		// evaluate the current row
		groups = [0]; // the first empty group of white
		for (var j = 0; j < n; ) {
			var k;
			for (k = 0; j < n && row[j]; ++k) ++j;
			groups.push(k);
			for (k = 0; j < n && !row[j]; ++k) ++j;
			groups.push(k);
		}
		score += evaluategroup(groups);

		// evaluate the current column
		groups = [0];
		for (var j = 0; j < n; ) {
			var k;
			for (k = 0; j < n && matrix[j][i]; ++k) ++j;
			groups.push(k);
			for (k = 0; j < n && !matrix[j][i]; ++k) ++j;
			groups.push(k);
		}
		score += evaluategroup(groups);

		// check the 2x2 box and calculate the density
		var nextrow = matrix[i+1] || [];
		nblacks += row[0];
		for (var j = 1; j < n; ++j) {
			var p = row[j];
			nblacks += p;
			// at least comparison with next row should be strict...
			if (row[j-1] == p && nextrow[j] === p && nextrow[j-1] === p) {
				score += PENALTY_TWOBYTWO;
			}
		}
	}

	score += PENALTY_DENSITY * ((Math.abs(nblacks / n / n - 0.5) / 0.05) | 0);
	return score;
};

// returns the fully encoded QR code matrix which contains given data.
// it also chooses the best mask automatically when mask is -1.
var generate = function(data, ver, mode, ecclevel, mask) {
	var v = VERSIONS[ver];
	var buf = encode(ver, mode, data, ndatabits(ver, ecclevel) >> 3);
	buf = augumenteccs(buf, v[1][ecclevel], GF256_GENPOLY[v[0][ecclevel]]);

	var result = makebasematrix(ver);
	var matrix = result.matrix, reserved = result.reserved;
	putdata(matrix, reserved, buf);

	if (mask < 0) {
		// find the best mask
		maskdata(matrix, reserved, 0);
		putformatinfo(matrix, reserved, ecclevel, 0);
		var bestmask = 0, bestscore = evaluatematrix(matrix);
		maskdata(matrix, reserved, 0);
		for (mask = 1; mask < 8; ++mask) {
			maskdata(matrix, reserved, mask);
			putformatinfo(matrix, reserved, ecclevel, mask);
			var score = evaluatematrix(matrix);
			if (bestscore > score) {
				bestscore = score;
				bestmask = mask;
			}
			maskdata(matrix, reserved, mask);
		}
		mask = bestmask;
	}

	maskdata(matrix, reserved, mask);
	putformatinfo(matrix, reserved, ecclevel, mask);
	return matrix;
};

// the public interface is trivial; the options available are as follows:
//
// - version: an integer in [1,40]. when omitted (or -1) the smallest possible
//   version is chosen.
// - mode: one of 'numeric', 'alphanumeric', 'octet'. when omitted the smallest
//   possible mode is chosen.
// - ecclevel: one of 'L', 'M', 'Q', 'H'. defaults to 'L'.
// - mask: an integer in [0,7]. when omitted (or -1) the best mask is chosen.
//
// for generate{HTML,PNG}:
//
// - modulesize: a number. this is a size of each modules in pixels, and
//   defaults to 5px.
// - margin: a number. this is a size of margin in *modules*, and defaults to
//   4 (white modules). the specficiation mandates the margin no less than 4
//   modules, so it is better not to alter this value unless you know what
//   you're doing.
var QRCode = {
	'generate': function(data, options) {
		var MODES = {'numeric': MODE_NUMERIC, 'alphanumeric': MODE_ALPHANUMERIC,
			'octet': MODE_OCTET};
		var ECCLEVELS = {'L': ECCLEVEL_L, 'M': ECCLEVEL_M, 'Q': ECCLEVEL_Q,
			'H': ECCLEVEL_H};

		options = options || {};
		var ver = options.version || -1;
		var ecclevel = ECCLEVELS[(options.ecclevel || 'L').toUpperCase()];
		var mode = options.mode ? MODES[options.mode.toLowerCase()] : -1;
		var mask = 'mask' in options ? options.mask : -1;

		if (mode < 0) {
			if (typeof data === 'string') {
				if (data.match(NUMERIC_REGEXP)) {
					mode = MODE_NUMERIC;
				} else if (data.match(ALPHANUMERIC_OUT_REGEXP)) {
					// while encode supports case-insensitive
					// encoding, we restrict the data to be
					// uppercased when auto-selecting the mode.
					mode = MODE_ALPHANUMERIC;
				} else {
					mode = MODE_OCTET;
				}
			} else {
				mode = MODE_OCTET;
			}
		} else if (!(mode == MODE_NUMERIC || mode == MODE_ALPHANUMERIC ||
				mode == MODE_OCTET)) {
			throw 'invalid or unsupported mode';
		}

		data = validatedata(mode, data);
		if (data === null) throw 'invalid data format';

		if (ecclevel < 0 || ecclevel > 3) throw 'invalid ECC level';

		if (ver < 0) {
			for (ver = 1; ver <= 40; ++ver) {
				if (data.length <= getmaxdatalen(ver, mode, ecclevel)) break;
			}
			if (ver > 40) throw 'too large data';
		} else if (ver < 1 || ver > 40) {
			throw 'invalid version';
		}

		if (mask != -1 && (mask < 0 || mask > 8)) throw 'invalid mask';

		return generate(data, ver, mode, ecclevel, mask);
	},

	'generateHTML': function(data, options) {
		options = options || {};
		var matrix = QRCode['generate'](data, options);
		var modsize = Math.max(options.modulesize || 5, 0.5);
		var margin = Math.max(options.margin !== null ? options.margin : 4, 0.0);

		var e = document.createElement('div');
		var n = matrix.length;
		var html = ['<table border="0" cellspacing="0" cellpadding="0" style="border:' +
			modsize*margin + 'px solid #fff;background:#fff">'];
		for (var i = 0; i < n; ++i) {
			html.push('<tr>');
			for (var j = 0; j < n; ++j) {
				html.push('<td style="width:' + modsize + 'px;height:' + modsize + 'px' +
					(matrix[i][j] ? ';background:#000' : '') + '"></td>');
			}
			html.push('</tr>');
		}
		e.className = 'qrcode';
		e.innerHTML = html.join('') + '</table>';
		return e;
	},

	'generateSVG': function(data, options) {
		options = options || {};
		var matrix = QRCode['generate'](data, options);
		var n = matrix.length;
		var modsize = Math.max(options.modulesize || 5, 0.5);
		var margin = Math.max(options.margin? options.margin : 4, 0.0);
		var size = modsize * (n + 2 * margin);

		var common = ' class= "fg"'+' width="'+modsize+'" height="'+modsize+'"/>';

		var e = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
		e.setAttribute('viewBox', '0 0 '+size+' '+size);
		e.setAttribute('style', 'shape-rendering:crispEdges');

		var svg = [
			'<style scoped>.bg{fill:#FFF}.fg{fill:#000}</style>',
			'<rect class="bg" x="0" y="0"',
			'width="'+size+'" height="'+size+'"/>',
		];

		var yo = margin * modsize;
		for (var y = 0; y < n; ++y) {
			var xo = margin * modsize;
			for (var x = 0; x < n; ++x) {
				if (matrix[y][x])
					svg.push('<rect x="'+xo+'" y="'+yo+'"', common);
				xo += modsize;
			}
			yo += modsize;
		}
		e.innerHTML = svg.join('');
		return e;
	},

	'generatePNG': function(data, options) {
		options = options || {};
		var matrix = QRCode['generate'](data, options);
		var modsize = Math.max(options.modulesize || 5, 0.5);
		var margin = Math.max(options.margin != null ? options.margin : 4, 0.0);
		var n = matrix.length;
		var size = modsize * (n + 2 * margin);

		var canvas = document.createElement('canvas'), context;
		canvas.width = canvas.height = size;
		context = canvas.getContext('2d');
		if (!context) throw 'canvas support is needed for PNG output';

		context.fillStyle = '#fff';
		context.fillRect(0, 0, size, size);
		context.fillStyle = '#000';
		for (var i = 0; i < n; ++i) {
			for (var j = 0; j < n; ++j) {
				if (matrix[i][j]) {
					context.fillRect(modsize * (margin + j),
						modsize * (margin + i),
						modsize, modsize);
				}
			}
		}
		//context.fillText('evaluation: ' + evaluatematrix(matrix), 10, 10);
		return canvas.toDataURL();
	}
};

exports["QRCode"]=QRCode;
exports.default=QRCode;

},
"validator/lib/isBIC.js":function(module,exports,require){
const assertString=require("validator/lib/util/assertString.js").default;
const {CountryCodes}=require("validator/lib/isISO31661Alpha2.js");

// https://en.wikipedia.org/wiki/ISO_9362
const isBICReg = /^[A-Za-z]{6}[A-Za-z0-9]{2}([A-Za-z0-9]{3})?$/;

function isBIC(str) {
  assertString(str);

  // toUpperCase() should be removed when a new major version goes out that changes
  // the regex to [A-Z] (per the spec).
  const countryCode = str.slice(4, 6).toUpperCase();

  if (!CountryCodes.has(countryCode) && countryCode !== 'XK') {
    return false;
  }

  return isBICReg.test(str);
}

exports.default=isBIC;
},
"validator/lib/isDate.js":function(module,exports,require){
const merge=require("validator/lib/util/merge.js").default;

const default_date_options = {
  format: 'YYYY/MM/DD',
  delimiters: ['/', '-'],
  strictMode: false,
};

function isValidFormat(format) {
  return /(^(y{4}|y{2})[.\/-](m{1,2})[.\/-](d{1,2})$)|(^(m{1,2})[.\/-](d{1,2})[.\/-]((y{4}|y{2})$))|(^(d{1,2})[.\/-](m{1,2})[.\/-]((y{4}|y{2})$))/gi.test(format);
}

function zip(date, format) {
  const zippedArr = [],
    len = Math.max(date.length, format.length);

  for (let i = 0; i < len; i++) {
    zippedArr.push([date[i], format[i]]);
  }

  return zippedArr;
}

function isDate(input, options) {
  if (typeof options === 'string') { // Allow backward compatibility for old format isDate(input [, format])
    options = merge({ format: options }, default_date_options);
  } else {
    options = merge(options, default_date_options);
  }
  if (typeof input === 'string' && isValidFormat(options.format)) {
    if (options.strictMode && input.length !== options.format.length) return false;
    const formatDelimiter = options.delimiters
      .find(delimiter => options.format.indexOf(delimiter) !== -1);
    const dateDelimiter = options.strictMode
      ? formatDelimiter
      : options.delimiters.find(delimiter => input.indexOf(delimiter) !== -1);
    const dateAndFormat = zip(
      input.split(dateDelimiter),
      options.format.toLowerCase().split(formatDelimiter)
    );
    const dateObj = {};

    for (const [dateWord, formatWord] of dateAndFormat) {
      if (!dateWord || !formatWord || dateWord.length !== formatWord.length) {
        return false;
      }

      dateObj[formatWord.charAt(0)] = dateWord;
    }

    let fullYear = dateObj.y;

    // Check if the year starts with a hyphen
    if (fullYear.startsWith('-')) {
      return false; // Hyphen before year is not allowed
    }

    if (dateObj.y.length === 2) {
      const parsedYear = parseInt(dateObj.y, 10);

      if (isNaN(parsedYear)) {
        return false;
      }

      const currentYearLastTwoDigits = new Date().getFullYear() % 100;

      if (parsedYear < currentYearLastTwoDigits) {
        fullYear = `20${dateObj.y}`;
      } else {
        fullYear = `19${dateObj.y}`;
      }
    }

    let month = dateObj.m;

    if (dateObj.m.length === 1) {
      month = `0${dateObj.m}`;
    }

    let day = dateObj.d;

    if (dateObj.d.length === 1) {
      day = `0${dateObj.d}`;
    }

    return new Date(`${fullYear}-${month}-${day}T00:00:00.000Z`).getUTCDate() === +dateObj.d;
  }

  if (!options.strictMode) {
    return Object.prototype.toString.call(input) === '[object Date]' && isFinite(input);
  }

  return false;
}


exports.default=isDate;
},
"validator/lib/isIBAN.js":function(module,exports,require){
const assertString=require("validator/lib/util/assertString.js").default;
const includes=require("validator/lib/util/includesArray.js").default;

/**
 * List of country codes with
 * corresponding IBAN regular expression
 * Reference: https://en.wikipedia.org/wiki/International_Bank_Account_Number
 */
const ibanRegexThroughCountryCode = {
  AD: /^(AD[0-9]{2})\d{8}[A-Z0-9]{12}$/,
  AE: /^(AE[0-9]{2})\d{3}\d{16}$/,
  AL: /^(AL[0-9]{2})\d{8}[A-Z0-9]{16}$/,
  AT: /^(AT[0-9]{2})\d{16}$/,
  AZ: /^(AZ[0-9]{2})[A-Z0-9]{4}\d{20}$/,
  BA: /^(BA[0-9]{2})\d{16}$/,
  BE: /^(BE[0-9]{2})\d{12}$/,
  BG: /^(BG[0-9]{2})[A-Z]{4}\d{6}[A-Z0-9]{8}$/,
  BH: /^(BH[0-9]{2})[A-Z]{4}[A-Z0-9]{14}$/,
  BR: /^(BR[0-9]{2})\d{23}[A-Z]{1}[A-Z0-9]{1}$/,
  BY: /^(BY[0-9]{2})[A-Z0-9]{4}\d{20}$/,
  CH: /^(CH[0-9]{2})\d{5}[A-Z0-9]{12}$/,
  CR: /^(CR[0-9]{2})\d{18}$/,
  CY: /^(CY[0-9]{2})\d{8}[A-Z0-9]{16}$/,
  CZ: /^(CZ[0-9]{2})\d{20}$/,
  DE: /^(DE[0-9]{2})\d{18}$/,
  DK: /^(DK[0-9]{2})\d{14}$/,
  DO: /^(DO[0-9]{2})[A-Z]{4}\d{20}$/,
  DZ: /^(DZ\d{24})$/,
  EE: /^(EE[0-9]{2})\d{16}$/,
  EG: /^(EG[0-9]{2})\d{25}$/,
  ES: /^(ES[0-9]{2})\d{20}$/,
  FI: /^(FI[0-9]{2})\d{14}$/,
  FO: /^(FO[0-9]{2})\d{14}$/,
  FR: /^(FR[0-9]{2})\d{10}[A-Z0-9]{11}\d{2}$/,
  GB: /^(GB[0-9]{2})[A-Z]{4}\d{14}$/,
  GE: /^(GE[0-9]{2})[A-Z0-9]{2}\d{16}$/,
  GI: /^(GI[0-9]{2})[A-Z]{4}[A-Z0-9]{15}$/,
  GL: /^(GL[0-9]{2})\d{14}$/,
  GR: /^(GR[0-9]{2})\d{7}[A-Z0-9]{16}$/,
  GT: /^(GT[0-9]{2})[A-Z0-9]{4}[A-Z0-9]{20}$/,
  HR: /^(HR[0-9]{2})\d{17}$/,
  HU: /^(HU[0-9]{2})\d{24}$/,
  IE: /^(IE[0-9]{2})[A-Z]{4}\d{14}$/,
  IL: /^(IL[0-9]{2})\d{19}$/,
  IQ: /^(IQ[0-9]{2})[A-Z]{4}\d{15}$/,
  IR: /^(IR[0-9]{2})\d{22}$/,
  IS: /^(IS[0-9]{2})\d{22}$/,
  IT: /^(IT[0-9]{2})[A-Z]{1}\d{10}[A-Z0-9]{12}$/,
  JO: /^(JO[0-9]{2})[A-Z]{4}\d{22}$/,
  KW: /^(KW[0-9]{2})[A-Z]{4}[A-Z0-9]{22}$/,
  KZ: /^(KZ[0-9]{2})\d{3}[A-Z0-9]{13}$/,
  LB: /^(LB[0-9]{2})\d{4}[A-Z0-9]{20}$/,
  LC: /^(LC[0-9]{2})[A-Z]{4}[A-Z0-9]{24}$/,
  LI: /^(LI[0-9]{2})\d{5}[A-Z0-9]{12}$/,
  LT: /^(LT[0-9]{2})\d{16}$/,
  LU: /^(LU[0-9]{2})\d{3}[A-Z0-9]{13}$/,
  LV: /^(LV[0-9]{2})[A-Z]{4}[A-Z0-9]{13}$/,
  MA: /^(MA[0-9]{26})$/,
  MC: /^(MC[0-9]{2})\d{10}[A-Z0-9]{11}\d{2}$/,
  MD: /^(MD[0-9]{2})[A-Z0-9]{20}$/,
  ME: /^(ME[0-9]{2})\d{18}$/,
  MK: /^(MK[0-9]{2})\d{3}[A-Z0-9]{10}\d{2}$/,
  MR: /^(MR[0-9]{2})\d{23}$/,
  MT: /^(MT[0-9]{2})[A-Z]{4}\d{5}[A-Z0-9]{18}$/,
  MU: /^(MU[0-9]{2})[A-Z]{4}\d{19}[A-Z]{3}$/,
  MZ: /^(MZ[0-9]{2})\d{21}$/,
  NL: /^(NL[0-9]{2})[A-Z]{4}\d{10}$/,
  NO: /^(NO[0-9]{2})\d{11}$/,
  PK: /^(PK[0-9]{2})[A-Z0-9]{4}\d{16}$/,
  PL: /^(PL[0-9]{2})\d{24}$/,
  PS: /^(PS[0-9]{2})[A-Z]{4}[A-Z0-9]{21}$/,
  PT: /^(PT[0-9]{2})\d{21}$/,
  QA: /^(QA[0-9]{2})[A-Z]{4}[A-Z0-9]{21}$/,
  RO: /^(RO[0-9]{2})[A-Z]{4}[A-Z0-9]{16}$/,
  RS: /^(RS[0-9]{2})\d{18}$/,
  SA: /^(SA[0-9]{2})\d{2}[A-Z0-9]{18}$/,
  SC: /^(SC[0-9]{2})[A-Z]{4}\d{20}[A-Z]{3}$/,
  SE: /^(SE[0-9]{2})\d{20}$/,
  SI: /^(SI[0-9]{2})\d{15}$/,
  SK: /^(SK[0-9]{2})\d{20}$/,
  SM: /^(SM[0-9]{2})[A-Z]{1}\d{10}[A-Z0-9]{12}$/,
  SV: /^(SV[0-9]{2})[A-Z0-9]{4}\d{20}$/,
  TL: /^(TL[0-9]{2})\d{19}$/,
  TN: /^(TN[0-9]{2})\d{20}$/,
  TR: /^(TR[0-9]{2})\d{5}[A-Z0-9]{17}$/,
  UA: /^(UA[0-9]{2})\d{6}[A-Z0-9]{19}$/,
  VA: /^(VA[0-9]{2})\d{18}$/,
  VG: /^(VG[0-9]{2})[A-Z]{4}\d{16}$/,
  XK: /^(XK[0-9]{2})\d{16}$/,
};

/**
 * Check if the country codes passed are valid using the
 * ibanRegexThroughCountryCode as a reference
 *
 * @param {array} countryCodeArray
 * @return {boolean}
 */

function hasOnlyValidCountryCodes(countryCodeArray) {
  const countryCodeArrayFilteredWithObjectIbanCode = countryCodeArray
    .filter(countryCode => !(countryCode in ibanRegexThroughCountryCode));

  return countryCodeArrayFilteredWithObjectIbanCode.length === 0;
}

/**
 * Check whether string has correct universal IBAN format
 * The IBAN consists of up to 34 alphanumeric characters, as follows:
 * Country Code using ISO 3166-1 alpha-2, two letters
 * check digits, two digits and
 * Basic Bank Account Number (BBAN), up to 30 alphanumeric characters.
 * NOTE: Permitted IBAN characters are: digits [0-9] and the 26 latin alphabetic [A-Z]
 *
 * @param {string} str - string under validation
 * @param {object} options - object to pass the countries to be either whitelisted or blacklisted
 * @return {boolean}
 */
function hasValidIbanFormat(str, options) {
  // Strip white spaces and hyphens
  const strippedStr = str.replace(/[\s\-]+/gi, '').toUpperCase();
  const isoCountryCode = strippedStr.slice(0, 2).toUpperCase();

  const isoCountryCodeInIbanRegexCodeObject = isoCountryCode in ibanRegexThroughCountryCode;

  if (options.whitelist) {
    if (!hasOnlyValidCountryCodes(options.whitelist)) {
      return false;
    }

    const isoCountryCodeInWhiteList = includes(options.whitelist, isoCountryCode);

    if (!isoCountryCodeInWhiteList) {
      return false;
    }
  }

  if (options.blacklist) {
    const isoCountryCodeInBlackList = includes(options.blacklist, isoCountryCode);

    if (isoCountryCodeInBlackList) {
      return false;
    }
  }

  return (isoCountryCodeInIbanRegexCodeObject) &&
    ibanRegexThroughCountryCode[isoCountryCode].test(strippedStr);
}

/**
   * Check whether string has valid IBAN Checksum
   * by performing basic mod-97 operation and
   * the remainder should equal 1
   * -- Start by rearranging the IBAN by moving the four initial characters to the end of the string
   * -- Replace each letter in the string with two digits, A -> 10, B = 11, Z = 35
   * -- Interpret the string as a decimal integer and
   * -- compute the remainder on division by 97 (mod 97)
   * Reference: https://en.wikipedia.org/wiki/International_Bank_Account_Number
   *
   * @param {string} str
   * @return {boolean}
   */
function hasValidIbanChecksum(str) {
  const strippedStr = str.replace(/[^A-Z0-9]+/gi, '').toUpperCase(); // Keep only digits and A-Z latin alphabetic
  const rearranged = strippedStr.slice(4) + strippedStr.slice(0, 4);
  const alphaCapsReplacedWithDigits = rearranged.replace(/[A-Z]/g, char => char.charCodeAt(0) - 55);

  const remainder = alphaCapsReplacedWithDigits.match(/\d{1,7}/g)
    .reduce((acc, value) => Number(acc + value) % 97, '');

  return remainder === 1;
}

function isIBAN(str, options = {}) {
  assertString(str);

  return hasValidIbanFormat(str, options) && hasValidIbanChecksum(str);
}

const locales = Object.keys(ibanRegexThroughCountryCode);

exports.default=isIBAN;
exports["locales"]=locales;
},
"validator/lib/isISO31661Alpha2.js":function(module,exports,require){
const assertString=require("validator/lib/util/assertString.js").default;

// from https://en.wikipedia.org/wiki/ISO_3166-1_alpha-2
const validISO31661Alpha2CountriesCodes = new Set([
  'AD', 'AE', 'AF', 'AG', 'AI', 'AL', 'AM', 'AO', 'AQ', 'AR', 'AS', 'AT', 'AU', 'AW', 'AX', 'AZ',
  'BA', 'BB', 'BD', 'BE', 'BF', 'BG', 'BH', 'BI', 'BJ', 'BL', 'BM', 'BN', 'BO', 'BQ', 'BR', 'BS', 'BT', 'BV', 'BW', 'BY', 'BZ',
  'CA', 'CC', 'CD', 'CF', 'CG', 'CH', 'CI', 'CK', 'CL', 'CM', 'CN', 'CO', 'CR', 'CU', 'CV', 'CW', 'CX', 'CY', 'CZ',
  'DE', 'DJ', 'DK', 'DM', 'DO', 'DZ',
  'EC', 'EE', 'EG', 'EH', 'ER', 'ES', 'ET',
  'FI', 'FJ', 'FK', 'FM', 'FO', 'FR',
  'GA', 'GB', 'GD', 'GE', 'GF', 'GG', 'GH', 'GI', 'GL', 'GM', 'GN', 'GP', 'GQ', 'GR', 'GS', 'GT', 'GU', 'GW', 'GY',
  'HK', 'HM', 'HN', 'HR', 'HT', 'HU',
  'ID', 'IE', 'IL', 'IM', 'IN', 'IO', 'IQ', 'IR', 'IS', 'IT',
  'JE', 'JM', 'JO', 'JP',
  'KE', 'KG', 'KH', 'KI', 'KM', 'KN', 'KP', 'KR', 'KW', 'KY', 'KZ',
  'LA', 'LB', 'LC', 'LI', 'LK', 'LR', 'LS', 'LT', 'LU', 'LV', 'LY',
  'MA', 'MC', 'MD', 'ME', 'MF', 'MG', 'MH', 'MK', 'ML', 'MM', 'MN', 'MO', 'MP', 'MQ', 'MR', 'MS', 'MT', 'MU', 'MV', 'MW', 'MX', 'MY', 'MZ',
  'NA', 'NC', 'NE', 'NF', 'NG', 'NI', 'NL', 'NO', 'NP', 'NR', 'NU', 'NZ',
  'OM',
  'PA', 'PE', 'PF', 'PG', 'PH', 'PK', 'PL', 'PM', 'PN', 'PR', 'PS', 'PT', 'PW', 'PY',
  'QA',
  'RE', 'RO', 'RS', 'RU', 'RW',
  'SA', 'SB', 'SC', 'SD', 'SE', 'SG', 'SH', 'SI', 'SJ', 'SK', 'SL', 'SM', 'SN', 'SO', 'SR', 'SS', 'ST', 'SV', 'SX', 'SY', 'SZ',
  'TC', 'TD', 'TF', 'TG', 'TH', 'TJ', 'TK', 'TL', 'TM', 'TN', 'TO', 'TR', 'TT', 'TV', 'TW', 'TZ',
  'UA', 'UG', 'UM', 'US', 'UY', 'UZ',
  'VA', 'VC', 'VE', 'VG', 'VI', 'VN', 'VU',
  'WF', 'WS',
  'YE', 'YT',
  'ZA', 'ZM', 'ZW',
]);

const alpha2CountryCode = /^[a-zA-Z]{2}$/;

function isISO31661Alpha2(str, options = {}) {
  assertString(str);

  const { userAssignedCodes } = options;
  const validUserAssignedCodes = (userAssignedCodes || [])
    .reduce((accumulator, userAssignedCode) => {
      if (alpha2CountryCode.test(userAssignedCode)) {
        accumulator.push(userAssignedCode.toUpperCase());
      }
      return accumulator;
    }, []);

  if (validUserAssignedCodes.includes(str.toUpperCase())) {
    return true;
  }

  return validISO31661Alpha2CountriesCodes.has(str.toUpperCase());
}

const CountryCodes = validISO31661Alpha2CountriesCodes;

exports.default=isISO31661Alpha2;
exports["CountryCodes"]=CountryCodes;
},
"validator/lib/isISO4217.js":function(module,exports,require){
const assertString=require("validator/lib/util/assertString.js").default;

// from https://en.wikipedia.org/wiki/ISO_4217
const validISO4217CurrencyCodes = new Set([
  'AED', 'AFN', 'ALL', 'AMD', 'ANG', 'AOA', 'ARS', 'AUD', 'AWG', 'AZN',
  'BAM', 'BBD', 'BDT', 'BGN', 'BHD', 'BIF', 'BMD', 'BND', 'BOB', 'BOV', 'BRL', 'BSD', 'BTN', 'BWP', 'BYN', 'BZD',
  'CAD', 'CDF', 'CHE', 'CHF', 'CHW', 'CLF', 'CLP', 'CNY', 'COP', 'COU', 'CRC', 'CUP', 'CVE', 'CZK',
  'DJF', 'DKK', 'DOP', 'DZD',
  'EGP', 'ERN', 'ETB', 'EUR',
  'FJD', 'FKP',
  'GBP', 'GEL', 'GHS', 'GIP', 'GMD', 'GNF', 'GTQ', 'GYD',
  'HKD', 'HNL', 'HTG', 'HUF',
  'IDR', 'ILS', 'INR', 'IQD', 'IRR', 'ISK',
  'JMD', 'JOD', 'JPY',
  'KES', 'KGS', 'KHR', 'KMF', 'KPW', 'KRW', 'KWD', 'KYD', 'KZT',
  'LAK', 'LBP', 'LKR', 'LRD', 'LSL', 'LYD',
  'MAD', 'MDL', 'MGA', 'MKD', 'MMK', 'MNT', 'MOP', 'MRU', 'MUR', 'MVR', 'MWK', 'MXN', 'MXV', 'MYR', 'MZN',
  'NAD', 'NGN', 'NIO', 'NOK', 'NPR', 'NZD',
  'OMR',
  'PAB', 'PEN', 'PGK', 'PHP', 'PKR', 'PLN', 'PYG',
  'QAR',
  'RON', 'RSD', 'RUB', 'RWF',
  'SAR', 'SBD', 'SCR', 'SDG', 'SEK', 'SGD', 'SHP', 'SLE', 'SLL', 'SOS', 'SRD', 'SSP', 'STN', 'SVC', 'SYP', 'SZL',
  'THB', 'TJS', 'TMT', 'TND', 'TOP', 'TRY', 'TTD', 'TWD', 'TZS',
  'UAH', 'UGX', 'USD', 'USN', 'UYI', 'UYU', 'UYW', 'UZS',
  'VED', 'VES', 'VND', 'VUV',
  'WST',
  'XAF', 'XAG', 'XAU', 'XBA', 'XBB', 'XBC', 'XBD', 'XCD', 'XDR', 'XOF', 'XPD', 'XPF', 'XPT', 'XSU', 'XTS', 'XUA', 'XXX',
  'YER',
  'ZAR', 'ZMW', 'ZWL',
]);

function isISO4217(str) {
  assertString(str);
  return validISO4217CurrencyCodes.has(str.toUpperCase());
}

const CurrencyCodes = validISO4217CurrencyCodes;

exports.default=isISO4217;
exports["CurrencyCodes"]=CurrencyCodes;
},
"validator/lib/util/assertString.js":function(module,exports,require){
function assertString(input) {
  if (input === undefined || input === null) throw new TypeError(`Expected a string but received a ${input}`);
  if (input.constructor.name !== 'String') throw new TypeError(`Expected a string but received a ${input.constructor.name}`);
}

exports.default=assertString;
},
"validator/lib/util/includesArray.js":function(module,exports,require){
const includes = (arr, val) => arr.some(arrVal => val === arrVal);

exports.default=includes;


},
"validator/lib/util/merge.js":function(module,exports,require){
function merge(obj = { }, defaults) {
  if (typeof obj !== 'object' || obj === null) {
    obj = {};
  }
  for (const key in defaults) {
    if (typeof obj[key] === 'undefined') {
      obj[key] = defaults[key];
    }
  }
  return obj;
}


exports.default=merge;
},
"validator/index.js":function(module,exports,require){
const isIBAN=require("validator/lib/isIBAN.js").default;
const isBIC=require("validator/lib/isBIC.js").default;
const isISO4217=require("validator/lib/isISO4217.js").default;
const isDate=require("validator/lib/isDate.js").default;
exports.default={isIBAN,isBIC,isISO4217,isDate};

}
},cache={};function require(id){if(cache[id])return cache[id].exports;if(!modules[id])throw Error('Missing bundled module '+id);const module={exports:{}};cache[id]=module;modules[id](module,module.exports,require);return module.exports}
const pay=require('bysquare/src/pay/encode.ts'),types=require('bysquare/src/pay/types.ts'),qr=require('qr-esm/index.js').QRCode,validator=require('validator/index.js').default;
root.VeltoPaymentQr=Object.freeze({version:'bysquare4.1.0/lzma1-0.4.0/validator13.15.35/qr-esm1.2.0',encode:pay.encode,serialize:pay.serialize,PaymentOptions:types.PaymentOptions,CurrencyCode:types.CurrencyCode,QRCode:qr,matrix:function(payload,options){return qr.generate(payload,Object.assign({mode:'alphanumeric',ecclevel:'L'},options||{}))},isIBAN:function(value){return typeof value==='string'&&validator.isIBAN(value)},isBIC:function(value){return typeof value==='string'&&validator.isBIC(value)}});
})(typeof window!=='undefined'?window:globalThis);
