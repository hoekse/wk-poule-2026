// Versleuteling voor persoonlijke media (foto en clips van Rick).
// De repository is openbaar, dus deze bestanden staan er alleen versleuteld in.
// Versleutelen kan iedereen met de publieke sleutel (media/publieke-sleutel.txt);
// ontsleutelen kan alleen Vercel, met MEDIA_PRIVE_SLEUTEL.
//
// Formaat: "VGM1" | tijdelijke X25519-publieke sleutel (32) | iv (12) | tag (16) | versleutelde inhoud
// Sleutel: HKDF-SHA256 over de gedeelde X25519-geheim, AES-256-GCM.

import {
  createCipheriv,
  createDecipheriv,
  createPrivateKey,
  createPublicKey,
  diffieHellman,
  generateKeyPairSync,
  hkdfSync,
  randomBytes,
} from 'node:crypto';

const MAGIC = Buffer.from('VGM1');
const INFO = Buffer.from('videogesprek-media');

const rauw = (publicKey) => Buffer.from(publicKey.export({ format: 'jwk' }).x, 'base64url');
const vanRauw = (x) =>
  createPublicKey({ key: { kty: 'OKP', crv: 'X25519', x: Buffer.from(x).toString('base64url') }, format: 'jwk' });

function sleutel(gedeeld, tijdelijk, ontvanger) {
  return Buffer.from(hkdfSync('sha256', gedeeld, Buffer.concat([tijdelijk, ontvanger]), INFO, 32));
}

export function maakSleutelpaar() {
  const { publicKey, privateKey } = generateKeyPairSync('x25519');
  return {
    publiek: rauw(publicKey).toString('base64url'),
    prive: privateKey.export({ format: 'der', type: 'pkcs8' }).toString('base64'),
  };
}

export function versleutel(data, publiekeSleutel) {
  const ontvanger = Buffer.from(publiekeSleutel.trim(), 'base64url');
  const tijdelijk = generateKeyPairSync('x25519');
  const tijdelijkRauw = rauw(tijdelijk.publicKey);
  const gedeeld = diffieHellman({ privateKey: tijdelijk.privateKey, publicKey: vanRauw(ontvanger) });
  const iv = randomBytes(12);
  const cipher = createCipheriv('aes-256-gcm', sleutel(gedeeld, tijdelijkRauw, ontvanger), iv);
  const inhoud = Buffer.concat([cipher.update(data), cipher.final()]);
  return Buffer.concat([MAGIC, tijdelijkRauw, iv, cipher.getAuthTag(), inhoud]);
}

export function ontsleutel(blob, priveSleutel) {
  if (!blob.subarray(0, 4).equals(MAGIC)) throw new Error('geen versleuteld mediabestand');
  const privateKey = createPrivateKey({ key: Buffer.from(priveSleutel.trim(), 'base64'), format: 'der', type: 'pkcs8' });
  const ontvanger = rauw(createPublicKey(privateKey));
  const tijdelijkRauw = blob.subarray(4, 36);
  const iv = blob.subarray(36, 48);
  const tag = blob.subarray(48, 64);
  const gedeeld = diffieHellman({ privateKey, publicKey: vanRauw(tijdelijkRauw) });
  const decipher = createDecipheriv('aes-256-gcm', sleutel(gedeeld, tijdelijkRauw, ontvanger), iv);
  decipher.setAuthTag(tag);
  return Buffer.concat([decipher.update(blob.subarray(64)), decipher.final()]);
}
