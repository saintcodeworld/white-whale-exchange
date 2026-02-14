export const CHANGENOW_API_URL = 'https://api.changenow.io/v1';

// Solana address is a base58 encoded string, typically 32-44 characters
export const SOLANA_ADDRESS_REGEX = /^[1-9A-HJ-NP-Za-km-z]{32,44}$/;

export function isValidSolanaAddress(address: string): boolean {
    return SOLANA_ADDRESS_REGEX.test(address);
}
