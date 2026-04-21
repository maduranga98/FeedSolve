export interface GeneratedApiKey {
    id: string;
    key: string;
    keyDisplay: string;
    keyHash: string;
}
export declare function generateApiKey(): GeneratedApiKey;
export declare function hashApiKey(key: string): Promise<string>;
export declare function verifyApiKey(providedKey: string, hashedKey: string): Promise<boolean>;
//# sourceMappingURL=apiKeyGenerator.d.ts.map