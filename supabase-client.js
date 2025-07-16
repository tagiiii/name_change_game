// Supabaseクライアント設定
// 実際のプロジェクトではこれらの値を環境変数から取得することを推奨

// 設定値をconfig.jsから取得
const SUPABASE_CONFIG = {
    url: CONFIG.supabase.url,
    anonKey: CONFIG.supabase.anonKey
};

// Supabaseクライアントの初期化
let supabaseClient = null;

async function initializeSupabase() {
    try {
        console.log('Supabase初期化開始...');
        console.log('CONFIG:', CONFIG);
        console.log('SUPABASE_CONFIG:', SUPABASE_CONFIG);
        
        // CONFIGが読み込まれているかチェック
        if (typeof CONFIG === 'undefined') {
            throw new Error('CONFIG が読み込まれていません。config.js が正しく読み込まれているか確認してください。');
        }
        
        // Supabaseライブラリが読み込まれているかチェック
        if (typeof window.supabase === 'undefined') {
            throw new Error('Supabaseライブラリが読み込まれていません。CDNからの読み込みを確認してください。');
        }
        
        // 設定値をチェック
        if (!SUPABASE_CONFIG.url || SUPABASE_CONFIG.url === 'https://your-project-id.supabase.co') {
            throw new Error('Supabase URLが設定されていません。config.js を確認してください。');
        }
        
        if (!SUPABASE_CONFIG.anonKey || SUPABASE_CONFIG.anonKey === 'your-anon-key-here') {
            throw new Error('Supabase anon key が設定されていません。config.js を確認してください。');
        }
        
        console.log('Supabaseクライアントを作成中...');
        
        // クライアントを初期化
        supabaseClient = window.supabase.createClient(
            SUPABASE_CONFIG.url,
            SUPABASE_CONFIG.anonKey
        );
        
        console.log('Supabaseクライアント作成完了:', supabaseClient);
        
        // 接続テスト
        console.log('接続テスト中...');
        const { data, error } = await supabaseClient
            .from('rooms')
            .select('count', { count: 'exact', head: true });
        
        if (error) {
            console.error('接続テストエラー:', error);
            throw new Error(`Supabase接続テストに失敗しました: ${error.message}`);
        }
        
        console.log('Supabase初期化完了');
        return supabaseClient;
    } catch (error) {
        console.error('Supabase初期化エラー:', error);
        throw error;
    }
}

// データベース操作用のヘルパー関数
const DatabaseAPI = {
    // ルーム関連
    async createRoom(roomId) {
        const { data, error } = await supabaseClient
            .from('rooms')
            .insert([{ id: roomId }]);
        return { data, error };
    },
    
    async getRoomStatus(roomId) {
        const { data, error } = await supabaseClient
            .from('rooms')
            .select('*')
            .eq('id', roomId)
            .single();
        return { data, error };
    },
    
    async updateVotingStatus(roomId, isActive, endTime = null) {
        const { data, error } = await supabaseClient
            .from('rooms')
            .upsert({
                id: roomId,
                voting_active: isActive,
                voting_end_time: endTime
            });
        return { data, error };
    },
    
    // 元の名前関連
    async addOriginalName(roomId, originalName) {
        const { data, error } = await supabaseClient
            .from('original_names')
            .insert([{
                room_id: roomId,
                original_name: originalName
            }]);
        return { data, error };
    },
    
    async getOriginalNames(roomId) {
        const { data, error } = await supabaseClient
            .from('original_names')
            .select('*')
            .eq('room_id', roomId)
            .order('created_at', { ascending: true });
        return { data, error };
    },
    
    async removeOriginalName(id) {
        const { data, error } = await supabaseClient
            .from('original_names')
            .delete()
            .eq('id', id);
        return { data, error };
    },
    
    // 変更後の名前関連
    async addChangedName(roomId, changedName) {
        const { data, error } = await supabaseClient
            .from('changed_names')
            .insert([{
                room_id: roomId,
                changed_name: changedName
            }]);
        return { data, error };
    },
    
    async getChangedNames(roomId) {
        const { data, error } = await supabaseClient
            .from('changed_names')
            .select('*')
            .eq('room_id', roomId)
            .order('created_at', { ascending: true });
        return { data, error };
    },
    
    async removeChangedName(id) {
        const { data, error } = await supabaseClient
            .from('changed_names')
            .delete()
            .eq('id', id);
        return { data, error };
    },
    
    // 投票関連
    async submitVote(roomId, changedNameId, selectedOriginalName, voterId) {
        const { data, error } = await supabaseClient
            .from('votes')
            .insert([{
                room_id: roomId,
                changed_name_id: changedNameId,
                selected_original_name: selectedOriginalName,
                voter_id: voterId
            }]);
        return { data, error };
    },
    
    async getVotes(roomId) {
        const { data, error } = await supabaseClient
            .from('votes')
            .select('*')
            .eq('room_id', roomId);
        return { data, error };
    },
    
    async getVoteResults(roomId) {
        const { data, error } = await supabaseClient
            .from('votes')
            .select(`
                changed_name_id,
                selected_original_name,
                changed_names!inner(changed_name)
            `)
            .eq('room_id', roomId);
        return { data, error };
    }
};

// リアルタイム機能
const RealtimeAPI = {
    subscriptions: new Map(),
    
    // 元の名前の変更をリアルタイムで監視
    subscribeToOriginalNames(roomId, callback) {
        const subscription = supabaseClient
            .channel(`original_names_${roomId}`)
            .on('postgres_changes', {
                event: '*',
                schema: 'public',
                table: 'original_names',
                filter: `room_id=eq.${roomId}`
            }, callback)
            .subscribe();
        
        this.subscriptions.set(`original_names_${roomId}`, subscription);
        return subscription;
    },
    
    // 変更後の名前の変更をリアルタイムで監視
    subscribeToChangedNames(roomId, callback) {
        const subscription = supabaseClient
            .channel(`changed_names_${roomId}`)
            .on('postgres_changes', {
                event: '*',
                schema: 'public',
                table: 'changed_names',
                filter: `room_id=eq.${roomId}`
            }, callback)
            .subscribe();
        
        this.subscriptions.set(`changed_names_${roomId}`, subscription);
        return subscription;
    },
    
    // 投票状態の変更をリアルタイムで監視
    subscribeToVotingStatus(roomId, callback) {
        const subscription = supabaseClient
            .channel(`rooms_${roomId}`)
            .on('postgres_changes', {
                event: '*',
                schema: 'public',
                table: 'rooms',
                filter: `id=eq.${roomId}`
            }, callback)
            .subscribe();
        
        this.subscriptions.set(`rooms_${roomId}`, subscription);
        return subscription;
    },
    
    // 投票結果をリアルタイムで監視
    subscribeToVotes(roomId, callback) {
        const subscription = supabaseClient
            .channel(`votes_${roomId}`)
            .on('postgres_changes', {
                event: '*',
                schema: 'public',
                table: 'votes',
                filter: `room_id=eq.${roomId}`
            }, callback)
            .subscribe();
        
        this.subscriptions.set(`votes_${roomId}`, subscription);
        return subscription;
    },
    
    // 特定のサブスクリプションを解除
    unsubscribe(key) {
        const subscription = this.subscriptions.get(key);
        if (subscription) {
            subscription.unsubscribe();
            this.subscriptions.delete(key);
        }
    },
    
    // すべてのサブスクリプションを解除
    unsubscribeAll() {
        this.subscriptions.forEach((subscription, key) => {
            subscription.unsubscribe();
        });
        this.subscriptions.clear();
    }
};

// エラーハンドリング
const ErrorHandler = {
    handle(error, operation) {
        console.error(`${operation}でエラーが発生:`, error);
        
        // 一般的なエラーメッセージのマッピング
        const errorMessages = {
            'PGRST116': 'データが見つかりません',
            'PGRST200': 'データベースエラーが発生しました',
            'PGRST301': 'データベースへの接続に失敗しました',
            'PGRST204': 'データが見つかりません',
            '23505': 'このデータは既に存在します',
            '23503': '関連するデータが見つかりません'
        };
        
        const message = errorMessages[error.code] || 'エラーが発生しました';
        
        // UIにエラーメッセージを表示
        if (typeof showMessage === 'function') {
            showMessage(message, 'error');
        }
        
        return message;
    }
};

// 接続状態の監視
const ConnectionMonitor = {
    isOnline: navigator.onLine,
    
    init() {
        window.addEventListener('online', () => {
            this.isOnline = true;
            if (typeof showMessage === 'function') {
                showMessage('オンラインに復帰しました', 'success');
            }
        });
        
        window.addEventListener('offline', () => {
            this.isOnline = false;
            if (typeof showMessage === 'function') {
                showMessage('オフラインです', 'error');
            }
        });
    }
};

// 初期化時に接続監視を開始
ConnectionMonitor.init();

// エクスポート（ES6モジュールではない場合のグローバル公開）
window.DatabaseAPI = DatabaseAPI;
window.RealtimeAPI = RealtimeAPI;
window.ErrorHandler = ErrorHandler;
window.ConnectionMonitor = ConnectionMonitor;