/**
 * リアルタイム更新管理
 * Supabaseリアルタイム機能の管理
 */

const RealtimeManager = {
    /**
     * リアルタイム更新の開始
     */
    startUpdates() {
        if (!AppState.currentRoomId) return;
        
        // 既存のサブスクリプションを停止
        RealtimeAPI.unsubscribeAll();
        
        // 各種データの変更を監視
        this.subscribeToOriginalNames();
        this.subscribeToChangedNames();
        this.subscribeToVotingStatus();
        this.subscribeToVotes();
    },

    /**
     * 元の名前の変更を監視
     */
    subscribeToOriginalNames() {
        RealtimeAPI.subscribeToOriginalNames(AppState.currentRoomId, (payload) => {
            console.log('元の名前変更:', payload);
            if (AppState.currentRole === 'gamemaster') {
                NameManager.loadOriginalNames();
            }
        });
    },

    /**
     * 変更後の名前の変更を監視
     */
    subscribeToChangedNames() {
        RealtimeAPI.subscribeToChangedNames(AppState.currentRoomId, (payload) => {
            console.log('変更後の名前変更:', payload);
            NameManager.loadChangedNames();
        });
    },

    /**
     * 投票状態の変更を監視
     */
    subscribeToVotingStatus() {
        RealtimeAPI.subscribeToVotingStatus(AppState.currentRoomId, (payload) => {
            console.log('投票状態変更:', payload);
            RoomManager.updateVotingStatus(payload.new);
        });
    },

    /**
     * 投票結果の変更を監視
     */
    subscribeToVotes() {
        RealtimeAPI.subscribeToVotes(AppState.currentRoomId, (payload) => {
            console.log('投票変更:', payload);
            if (AppState.currentRole === 'gamemaster') {
                ResultsManager.calculate();
            }
        });
    }
};

window.RealtimeManager = RealtimeManager;