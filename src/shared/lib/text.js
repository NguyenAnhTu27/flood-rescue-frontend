const MOJIBAKE_PATTERN = /(?:Ã.|Â.|Ä.|Å.|Æ.|á».|áº.|â€|â€™|â€œ|â€|â€“|â€”)/;

function decodeUtf8BytesFromLatin1(value) {
    try {
        const bytes = Uint8Array.from(Array.from(value).map((ch) => ch.charCodeAt(0) & 0xff));
        const decoded = new TextDecoder('utf-8').decode(bytes);
        return decoded.includes('\uFFFD') ? value : decoded;
    } catch {
        return value;
    }
}

export function normalizeMojibakeText(value) {
    if (typeof value !== 'string' || value.length === 0) return value;
    let current = value;
    for (let i = 0; i < 3; i += 1) {
        if (!MOJIBAKE_PATTERN.test(current)) break;
        const next = decodeUtf8BytesFromLatin1(current);
        if (!next || next === current) break;
        current = next;
    }
    return current.replaceAll('Đang tải bản đồ...', 'Đang tải bản đồ...');
}

export function normalizeObjectStrings(input) {
    if (Array.isArray(input)) return input.map(normalizeObjectStrings);
    if (input && typeof input === 'object') {
        const output = {};
        Object.entries(input).forEach(([key, value]) => {
            output[key] = normalizeObjectStrings(value);
        });
        return output;
    }
    return normalizeMojibakeText(input);
}
