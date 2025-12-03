/**
 * 検索結果キャッシュ管理ユーティリティ
 * 
 * 検索条件（住所、半径）をキーとして検索結果をキャッシュし、
 * 同じ条件での再検索時のレスポンスを高速化します。
 * 
 * @module searchCache
 */

/**
 * キャッシュデータの型定義
 */
interface CacheData {
    /** 検索結果データ */
    results: any[];
    /** 検索中心点の情報 */
    searchPoint: {
        lat: number;
        lng: number;
        address_resolved?: string;
    };
    /** キャッシュ作成時刻（Unixタイムスタンプ） */
    timestamp: number;
}

/**
 * キャッシュの有効期限（ミリ秒）
 * デフォルト: 1時間（3600000ミリ秒）
 */
const CACHE_EXPIRY_MS = 60 * 60 * 1000; // 1時間

/**
 * localStorageのキープレフィックス
 */
const CACHE_PREFIX = 'search_cache_';

/**
 * ユーザーIDを取得（トークンから推測、またはデフォルト値）
 * @returns {string} ユーザーID
 */
const getUserId = (): string => {
    if (typeof window === 'undefined') return 'default';
    const token = localStorage.getItem('token');
    // トークンから簡易的にユーザーIDを取得（実際の実装ではJWTをデコードする必要がある場合も）
    // 今回は簡易的にトークンのハッシュを使用
    if (token) {
        // 簡易的なハッシュ関数
        let hash = 0;
        for (let i = 0; i < token.length; i++) {
            const char = token.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash; // Convert to 32bit integer
        }
        return `user_${Math.abs(hash)}`;
    }
    return 'default';
};

/**
 * キャッシュキーを生成
 * @param {string} address 検索住所
 * @param {number} radius 検索半径（メートル）
 * @returns {string} キャッシュキー
 */
const generateCacheKey = (address: string, radius: number): string => {
    const userId = getUserId();
    // 住所と半径を正規化してキーを生成
    // addressが文字列でない場合は文字列に変換
    const addressStr = typeof address === 'string' ? address : String(address || '');
    const normalizedAddress = addressStr.trim().toLowerCase();
    const radiusNum = typeof radius === 'number' ? radius : Number(radius || 500);
    return `${CACHE_PREFIX}${userId}_${normalizedAddress}_${radiusNum}`;
};

/**
 * キャッシュデータを取得
 * @param {string} address 検索住所
 * @param {number} radius 検索半径（メートル）
 * @returns {CacheData | null} キャッシュデータ（有効期限切れまたは存在しない場合はnull）
 */
export const getCache = (address: string, radius: number): CacheData | null => {
    if (typeof window === 'undefined') return null;

    try {
        // addressとradiusの型チェック
        if (address === null || address === undefined) {
            return null;
        }
        if (typeof address !== 'string') {
            console.warn('getCache: address is not a string, converting:', address);
            address = String(address);
        }
        if (typeof radius !== 'number' || isNaN(radius)) {
            console.warn('getCache: radius is not a valid number, using default:', radius);
            radius = 500;
        }

        const cacheKey = generateCacheKey(address, radius);
        const cachedData = localStorage.getItem(cacheKey);

        if (!cachedData) {
            return null;
        }

        const parsed: CacheData = JSON.parse(cachedData);
        const now = Date.now();
        const cacheAge = now - parsed.timestamp;

        // 有効期限をチェック
        if (cacheAge > CACHE_EXPIRY_MS) {
            // 有効期限切れのキャッシュを削除
            localStorage.removeItem(cacheKey);
            return null;
        }

        return parsed;
    } catch (error) {
        console.error('キャッシュ取得エラー:', error);
        return null;
    }
};

/**
 * キャッシュデータを保存
 * @param {string} address 検索住所
 * @param {number} radius 検索半径（メートル）
 * @param {any[]} results 検索結果
 * @param {Object} searchPoint 検索中心点の情報
 */
export const setCache = (
    address: string,
    radius: number,
    results: any[],
    searchPoint: { lat: number; lng: number; address_resolved?: string }
): void => {
    if (typeof window === 'undefined') return;

    try {
        // addressとradiusの型チェック
        if (address === null || address === undefined) {
            console.warn('setCache: address is null or undefined');
            return;
        }
        if (typeof address !== 'string') {
            console.warn('setCache: address is not a string, converting:', address);
            address = String(address);
        }
        if (typeof radius !== 'number' || isNaN(radius)) {
            console.warn('setCache: radius is not a valid number, using default:', radius);
            radius = 500;
        }

        const cacheKey = generateCacheKey(address, radius);
        const cacheData: CacheData = {
            results,
            searchPoint,
            timestamp: Date.now(),
        };

        localStorage.setItem(cacheKey, JSON.stringify(cacheData));
    } catch (error) {
        console.error('キャッシュ保存エラー:', error);
        // localStorageの容量制限に達した場合など、エラーを無視して続行
    }
};

/**
 * 特定のキャッシュを削除
 * @param {string} address 検索住所
 * @param {number} radius 検索半径（メートル）
 */
export const clearCache = (address: string, radius: number): void => {
    if (typeof window === 'undefined') return;

    try {
        const cacheKey = generateCacheKey(address, radius);
        localStorage.removeItem(cacheKey);
    } catch (error) {
        console.error('キャッシュ削除エラー:', error);
    }
};

/**
 * すべての検索キャッシュを削除
 */
export const clearAllCache = (): void => {
    if (typeof window === 'undefined') return;

    try {
        const keys = Object.keys(localStorage);
        keys.forEach((key) => {
            if (key.startsWith(CACHE_PREFIX)) {
                localStorage.removeItem(key);
            }
        });
    } catch (error) {
        console.error('全キャッシュ削除エラー:', error);
    }
};

/**
 * 有効期限切れのキャッシュをクリーンアップ
 */
export const cleanupExpiredCache = (): void => {
    if (typeof window === 'undefined') return;

    try {
        const keys = Object.keys(localStorage);
        const now = Date.now();

        keys.forEach((key) => {
            if (key.startsWith(CACHE_PREFIX)) {
                try {
                    const cachedData = localStorage.getItem(key);
                    if (cachedData) {
                        const parsed: CacheData = JSON.parse(cachedData);
                        const cacheAge = now - parsed.timestamp;

                        if (cacheAge > CACHE_EXPIRY_MS) {
                            localStorage.removeItem(key);
                        }
                    }
                } catch (error) {
                    // パースエラーの場合は削除
                    localStorage.removeItem(key);
                }
            }
        });
    } catch (error) {
        console.error('キャッシュクリーンアップエラー:', error);
    }
};

