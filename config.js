// 設定ファイル
// 実際のプロジェクトではこの値を適切に設定してください

const CONFIG = {
    supabase: {
        // 実際のSupabaseプロジェクトのURLに置き換えてください
        url: 'https://zmllcbuehijdtbqulzhs.supabase.co',
        // 実際のSupabaseプロジェクトのanon keyに置き換えてください
        anonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InptbGxjYnVlaGlqZHRicXVsemhzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI1ODM2ODUsImV4cCI6MjA2ODE1OTY4NX0.HysWyRJaPRN2w75JvtKEhmZg1k588sUhtdGeH_MpQoU'
    },
    
    voting: {
        // 投票時間（秒）
        defaultDuration: 60,
        // 最大投票時間（秒）
        maxDuration: 300,
        // 最小投票時間（秒）
        minDuration: 10
    },
    
    ui: {
        // メッセージ表示時間（ミリ秒）
        messageDisplayTime: 5000,
        // アニメーション時間（ミリ秒）
        animationDuration: 300
    },
    
    room: {
        // ルームIDの長さ
        idLength: 8,
        // ルームの最大名前ペア数
        maxNamePairs: 20,
        // ルームの最大参加者数
        maxParticipants: 50
    }
};

// 設定の検証
function validateConfig() {
    const errors = [];
    
    // Supabase設定の検証
    if (!CONFIG.supabase.url || CONFIG.supabase.url === 'https://your-project-id.supabase.co') {
        errors.push('Supabase URLが設定されていません');
    }
    
    if (!CONFIG.supabase.anonKey || CONFIG.supabase.anonKey === 'your-anon-key-here') {
        errors.push('Supabase anon keyが設定されていません');
    }
    
    // 投票設定の検証
    if (CONFIG.voting.defaultDuration < CONFIG.voting.minDuration) {
        errors.push('デフォルト投票時間が最小時間より短いです');
    }
    
    if (CONFIG.voting.defaultDuration > CONFIG.voting.maxDuration) {
        errors.push('デフォルト投票時間が最大時間より長いです');
    }
    
    if (errors.length > 0) {
        console.warn('設定エラー:', errors);
        return false;
    }
    
    return true;
}

// 環境変数からの設定読み込み（本番環境用）
function loadEnvironmentConfig() {
    if (typeof process !== 'undefined' && process.env) {
        CONFIG.supabase.url = process.env.SUPABASE_URL || CONFIG.supabase.url;
        CONFIG.supabase.anonKey = process.env.SUPABASE_ANON_KEY || CONFIG.supabase.anonKey;
    }
}

// 初期化時に設定を読み込み
loadEnvironmentConfig();

// グローバルに公開
window.CONFIG = CONFIG;
window.validateConfig = validateConfig;