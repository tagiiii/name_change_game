/**
 * ゲームマスター機能
 * ルーム作成、名前管理、投票制御
 */

const GameMaster = {
    /**
     * ゲームマスターの初期化
     */
    async initialize() {
        try {
            AppState.currentRoomId = this.generateRoomId();
            
            await DatabaseAPI.createRoom(AppState.currentRoomId);
            this.setupShareUrl();
            
            await NameManager.loadOriginalNames();
            await NameManager.loadChangedNames();
            
            RealtimeManager.startUpdates();
            
            UI.showMessage('ゲームルームを作成しました', 'success');
            
            setTimeout(() => {
                StepManager.goToStep(1);
            }, 100);
        } catch (error) {
            console.error('ゲームマスター初期化エラー:', error);
            UI.showMessage('ゲームルームの作成に失敗しました', 'error');
        }
    },

    /**
     * ルームIDの生成
     */
    generateRoomId() {
        return Math.random().toString(36).substr(2, 8).toUpperCase();
    },

    /**
     * 共有URLの設定
     */
    setupShareUrl() {
        const shareUrl = `${window.location.origin}${window.location.pathname}?room=${AppState.currentRoomId}`;
        document.getElementById('room-url').value = shareUrl;
    },

    /**
     * URLコピー機能
     */
    copyUrl() {
        const urlInput = document.getElementById('room-url');
        urlInput.select();
        document.execCommand('copy');
        
        const button = event.target;
        const originalText = button.textContent;
        button.textContent = 'コピー済み!';
        setTimeout(() => {
            button.textContent = originalText;
        }, 2000);
    }
};

// グローバルスコープでの関数エクスポート
window.copyUrl = GameMaster.copyUrl;