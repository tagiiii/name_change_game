/**
 * ルーム管理機能
 * ルーム参加、退出、状態管理
 */

const RoomManager = {
    /**
     * URLによるルーム参加
     */
    async joinRoomByUrl() {
        try {
            const { data, error } = await DatabaseAPI.getRoomStatus(AppState.currentRoomId);
            
            if (error && error.code !== 'PGRST116') throw error;
            
            await NameManager.loadChangedNames();
            RealtimeManager.startUpdates();
            
            StepManager.goToParticipantStep(2);
            
            UI.showMessage('ルームに参加しました', 'success');
        } catch (error) {
            console.error('ルーム参加エラー:', error);
            UI.showMessage('ルームへの参加に失敗しました', 'error');
        }
    },

    /**
     * 投票状態の更新処理
     */
    updateVotingStatus(roomData) {
        AppState.isVotingActive = roomData.voting_active;
        
        // UI状態の更新
        this.updateVotingUI();
        
        // タイマー処理
        if (AppState.isVotingActive && roomData.voting_end_time) {
            const endTime = new Date(roomData.voting_end_time);
            const remainingTime = Math.max(0, Math.floor((endTime - Date.now()) / 1000));
            
            if (remainingTime > 0) {
                VotingManager.startTimer(remainingTime);
            }
        } else {
            VotingManager.stopTimer();
        }
        
        // 参加者のステップ更新（カスタムイベントで通知）
        if (AppState.isVotingActive && AppState.currentRole === 'participant') {
            window.dispatchEvent(new CustomEvent('votingStarted'));
        } else if (!AppState.isVotingActive && AppState.currentRole === 'participant') {
            window.dispatchEvent(new CustomEvent('votingEnded'));
        }
    },

    /**
     * 投票関連UIの更新
     */
    updateVotingUI() {
        const statusElements = [
            document.getElementById('voting-status'),
            document.getElementById('voting-status-gm')
        ];
        
        statusElements.forEach(element => {
            if (element) {
                element.textContent = AppState.isVotingActive ? '投票中...' : '投票待機中...';
            }
        });
        
        const votingButtons = document.querySelectorAll('#voting-options select');
        const submitButton = document.querySelector('button[onclick="submitVote()"]');
        
        votingButtons.forEach(button => {
            button.disabled = !AppState.isVotingActive;
        });
        
        if (submitButton) {
            submitButton.disabled = !AppState.isVotingActive || Object.keys(AppState.selectedVotes).length === 0;
        }
    }
};

// グローバルスコープでの関数エクスポート
window.RoomManager = RoomManager;