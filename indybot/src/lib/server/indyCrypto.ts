import { createCipheriv, createDecipheriv, randomBytes } from 'crypto';

const ALG = 'aes-256-gcm';

interface EncryptedPayload {
	iv: string;
	ciphertext: string;
	authTag: string;
}

export function encrypt(text: string, keyHex: string): string {
	if (typeof text !== 'string' || text.length === 0) {
		throw new Error('Text to encrypt must be a non-empty string.');
	}
	if (typeof keyHex !== 'string' || keyHex.length !== 64) {
		throw new Error('Key must be a 32-byte hex string (64 characters).');
	}
	const key = Buffer.from(keyHex, 'hex');
	const iv = randomBytes(12);
	const cipher = createCipheriv(ALG, key, iv);
	const ciphertext = Buffer.concat([cipher.update(text, 'utf8'), cipher.final()]);
	const authTag = cipher.getAuthTag();
	const payload: EncryptedPayload = {
		iv: iv.toString('base64'),
		ciphertext: ciphertext.toString('base64'),
		authTag: authTag.toString('base64')
	};
	return JSON.stringify(payload);
}

export function decrypt(encrypted: string, keyHex: string): string {
	let payload: EncryptedPayload;
	try {
		payload = JSON.parse(encrypted) as EncryptedPayload;
	} catch {
		throw new Error('Failed to decrypt payload');
	}
	const { iv, ciphertext, authTag } = payload;
	const key = Buffer.from(keyHex, 'hex');
	const decipher = createDecipheriv(ALG, key, Buffer.from(iv, 'base64'));
	decipher.setAuthTag(Buffer.from(authTag, 'base64'));
	return Buffer.concat([
		decipher.update(Buffer.from(ciphertext, 'base64')),
		decipher.final()
	]).toString('utf8');
}
