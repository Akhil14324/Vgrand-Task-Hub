const GOOGLE_API_KEY = import.meta.env.VITE_GOOGLE_TRANSLATE_API_KEY || '';
const GOOGLE_TRANSLATE_URL = 'https://translation.googleapis.com/language/translate/v2';
const MYMEMORY_URL = 'https://api.mymemory.translated.net/get';
const CACHE_PREFIX = 'trans_cache_';
const BATCH_SIZE = 128; // Google Cloud Translate supports up to 128 strings per batch

function getCacheKey(text, targetLang) {
  return `${CACHE_PREFIX}${targetLang}:${text}`;
}

function getCachedTranslation(text, targetLang) {
  const key = getCacheKey(text, targetLang);
  try {
    const cached = localStorage.getItem(key);
    if (cached !== null) return cached;
  } catch {
    // localStorage might be unavailable
  }
  return null;
}

function setCachedTranslation(text, targetLang, translated) {
  const key = getCacheKey(text, targetLang);
  try {
    localStorage.setItem(key, translated);
  } catch {
    // storage full or unavailable — silently skip
  }
}

async function translateWithGoogle(texts, targetLang) {
  const res = await fetch(`${GOOGLE_TRANSLATE_URL}?key=${GOOGLE_API_KEY}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      q: texts,
      source: 'en',
      target: targetLang,
      format: 'text',
    }),
  });

  if (!res.ok) {
    const errBody = await res.text();
    throw new Error(`Google Translate HTTP ${res.status}: ${errBody}`);
  }

  const data = await res.json();
  const translations = data.data?.translations || [];
  return translations.map((t, i) => t.translatedText || texts[i] || texts[0]);
}

async function translateWithMyMemory(text, targetLang) {
  const pair = `en|${targetLang}`;
  const encoded = encodeURIComponent(text);
  const res = await fetch(`${MYMEMORY_URL}?q=${encoded}&langpair=${pair}`, { method: 'GET' });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const data = await res.json();
  if (data.responseStatus !== 200) throw new Error(data.responseDetails || 'MyMemory error');
  return data.responseData?.translatedText || text;
}

export async function translateText(text, targetLang) {
  if (!text || targetLang === 'en') return text;

  const cached = getCachedTranslation(text, targetLang);
  if (cached !== null) return cached;

  let translated = text;

  if (GOOGLE_API_KEY) {
    try {
      const results = await translateWithGoogle([text], targetLang);
      translated = results[0] || text;
    } catch (err) {
      console.warn('[translateService] Google failed, trying MyMemory:', err.message);
      try {
        translated = await translateWithMyMemory(text, targetLang);
      } catch (err2) {
        console.warn('[translateService] MyMemory also failed:', err2.message);
      }
    }
  } else {
    try {
      translated = await translateWithMyMemory(text, targetLang);
    } catch (err) {
      console.warn('[translateService] MyMemory failed:', err.message);
    }
  }

  setCachedTranslation(text, targetLang, translated);
  return translated;
}

export async function translateBatch(texts, targetLang) {
  const results = new Array(texts.length).fill(null);
  const uncached = [];

  for (let i = 0; i < texts.length; i++) {
    const cached = getCachedTranslation(texts[i], targetLang);
    if (cached !== null) {
      results[i] = cached;
    } else {
      uncached.push({ text: texts[i], index: i });
    }
  }

  if (uncached.length === 0) return results;

  if (GOOGLE_API_KEY) {
    // Use Google Cloud Translate batch API
    const chunks = [];
    for (let i = 0; i < uncached.length; i += BATCH_SIZE) {
      chunks.push(uncached.slice(i, i + BATCH_SIZE));
    }

    await Promise.all(
      chunks.map(async (chunk) => {
        try {
          const googleResults = await translateWithGoogle(
            chunk.map((c) => c.text),
            targetLang
          );

          chunk.forEach((item, i) => {
            const translated = googleResults[i] || item.text;
            results[item.index] = translated;
            setCachedTranslation(item.text, targetLang, translated);
          });
        } catch (err) {
          console.warn('[translateService] Google batch failed, trying individually:', err.message);
          await Promise.all(
            chunk.map(async (item) => {
              try {
                const translated = await translateWithMyMemory(item.text, targetLang);
                results[item.index] = translated;
                setCachedTranslation(item.text, targetLang, translated);
              } catch {
                results[item.index] = item.text;
              }
            })
          );
        }
      })
    );
  } else {
    // No API key — fall back to MyMemory individually
    console.warn('[translateService] No Google API key set, using MyMemory fallback');
    await Promise.all(
      uncached.map(async (item) => {
        try {
          const translated = await translateWithMyMemory(item.text, targetLang);
          results[item.index] = translated;
          setCachedTranslation(item.text, targetLang, translated);
        } catch {
          results[item.index] = item.text;
        }
      })
    );
  }

  return results;
}
