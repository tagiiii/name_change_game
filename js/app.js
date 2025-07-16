/**
 * 名前変えゲーム - メインアプリケーション
 * グローバル状態管理とページ初期化
 */

// アプリケーション状態
const AppState = {
    currentRole: null,
    currentRoomId: null,
    isVotingActive: false,
    selectedVotes: {},
    detailResults: null
};

// アプリケーション初期化
document.addEventListener('DOMContentLoaded', async function() {
    try {
        await initializeSupabase();
        await handleUrlParameters();
    } catch (error) {
        console.error('アプリケーション初期化エラー:', error);
        UI.showMessage('アプリケーションの初期化に失敗しました', 'error');
    }
});

/**
 * URLパラメータの処理
 */
async function handleUrlParameters() {
    const urlParams = new URLSearchParams(window.location.search);
    const roomId = urlParams.get('room');
    
    if (roomId) {
        await setupParticipantMode(roomId);
    }
}

/**
 * 参加者モードの設定
 */
async function setupParticipantMode(roomId) {
    // UI の更新
    document.getElementById('app-title').textContent = '名前変えゲーム - 参加者';
    document.getElementById('game-flow-help').style.display = 'none';
    document.querySelector('.role-selection').style.display = 'none';
    
    // 状態の設定
    AppState.currentRole = 'participant';
    AppState.currentRoomId = roomId;
    
    // 参加者画面の表示
    UI.showScreen('participant-screen');
    StepManager.goToParticipantStep(1);
    
    // 自動参加メッセージの表示
    document.getElementById('auto-join-message').style.display = 'block';
    document.getElementById('manual-join-message').style.display = 'none';
    
    // ルームへの参加
    await RoomManager.joinRoomByUrl();
}

/**
 * 役割選択処理
 */
function selectRole(role) {
    AppState.currentRole = role;
    
    // ボタンの状態更新
    UI.updateRoleButtons();
    
    if (role === 'gamemaster') {
        UI.showScreen('gamemaster-screen');
        GameMaster.initialize();
    } else if (role === 'participant') {
        UI.showScreen('participant-screen');
        StepManager.goToParticipantStep(1);
    }
}

/**
 * ゲームリセット
 */
function resetGame() {
    if (confirm('新しいゲームを開始しますか？現在のデータは失われます。')) {
        window.location.reload();
    }
}

/**
 * 結果画面表示
 */
function showResultsPage() {
    if (AppState.currentRoomId) {
        const resultsUrl = `results.html?room=${AppState.currentRoomId}`;
        window.open(resultsUrl, '_blank');
    }
}

// エラーハンドリング
window.addEventListener('error', function(e) {
    console.error('アプリケーションエラー:', e.error);
    UI.showMessage('エラーが発生しました。ページを再読み込みしてください。', 'error');
});

// オフライン対応
window.addEventListener('online', function() {
    UI.showMessage('オンラインに復帰しました。', 'success');
});

window.addEventListener('offline', function() {
    UI.showMessage('オフラインです。接続を確認してください。', 'error');
});

// グローバルスコープでの関数エクスポート
window.selectRole = selectRole;
window.resetGame = resetGame;
window.showResultsPage = showResultsPage;