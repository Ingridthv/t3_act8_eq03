// APIs externas usadas SOLO para validar datos del usuario:
//  - Disify              -> correo (formato, dominio, desechable)
//  - Zippopotam.us       -> código postal -> estado
//  - Have I Been Pwned   -> contraseña filtrada (k-anonymity, la contraseña nunca sale del navegador)
// Si alguna API falla o no responde, devolvemos { checked: false } y la app sigue funcionando.
import { sha1Hex } from '../utils/sha1.js';

const TIMEOUT_MS = 6000;

async function fetchWithTimeout(url) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    return await fetch(url, { signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}

export async function validateEmailRemote(email) {
  try {
    const response = await fetchWithTimeout(
      `https://www.disify.com/api/email/${encodeURIComponent(email)}`
    );
    if (!response.ok) return { checked: false };
    const data = await response.json();

    if (data.format === false) {
      return { checked: true, valid: false, message: 'El formato del correo no es válido.' };
    }
    if (data.disposable) {
      return { checked: true, valid: false, message: 'No se permiten correos temporales o desechables.' };
    }
    if (data.dns === false) {
      return {
        checked: true,
        valid: false,
        message: `El dominio ${data.domain} no existe o no recibe correos.`,
      };
    }
    return { checked: true, valid: true };
  } catch {
    return { checked: false };
  }
}

export async function lookupPostalCode(postalCode) {
  try {
    const response = await fetchWithTimeout(`https://api.zippopotam.us/mx/${postalCode}`);
    if (response.status === 404) return { checked: true, found: false };
    if (!response.ok) return { checked: false };
    const data = await response.json();
    const place = data.places?.[0];
    if (!place) return { checked: true, found: false };
    return {
      checked: true,
      found: true,
      state: place.state,
      zone: place['place name'],
    };
  } catch {
    return { checked: false };
  }
}

export async function checkPasswordBreach(password) {
  try {
    const hash = sha1Hex(password);
    const prefix = hash.slice(0, 5);
    const suffix = hash.slice(5);
    const response = await fetchWithTimeout(`https://api.pwnedpasswords.com/range/${prefix}`);
    if (!response.ok) return { checked: false };
    const text = await response.text();

    const match = text
      .split('\n')
      .map((line) => line.trim().split(':'))
      .find(([lineSuffix]) => lineSuffix === suffix);
    const count = match ? Number(match[1]) : 0;
    return { checked: true, breached: count > 0, count };
  } catch {
    return { checked: false };
  }
}
