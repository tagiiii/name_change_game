/**
 * 投票管理機能
 * 投票開始、終了、タイマー、投票オプション設定
 */

const VotingManager = {
    votingTimer: null,

    /**
     * 投票開始
     */
    async startVoting() {
        try {
            const durationSelect = document.getElementById('voting-duration');
            const durationSeconds = parseInt(durationSelect.value);
            const endTime = new Date(Date.now() + durationSeconds * 1000);
            
            const { error } = await DatabaseAPI.updateVotingStatus(AppState.currentRoomId, true, endTime);
            
            if (error) throw error;
            
            this.startTimer(durationSeconds);
            
            const minutes = Math.floor(durationSeconds / 60);
            const seconds = durationSeconds % 60;
            const timeText = minutes > 0 ? `${minutes}分${seconds > 0 ? seconds + '秒' : ''}` : `${seconds}秒`;
            
            UI.showMessage(`投票を開始しました（制限時間: ${timeText}）`, 'success');
        } catch (error) {
            console.error('投票開始エラー:', error);
            UI.showMessage('投票の開始に失敗しました', 'error');
        }
    },

    /**
     * 投票終了
     */
    async endVoting() {
        try {
            this.stopTimer();
            
            const { error } = await DatabaseAPI.updateVotingStatus(AppState.currentRoomId, false);
            
            if (error) throw error;
            
            await ResultsManager.calculate();
            showResultsPage();
            
            UI.showMessage('投票を終了しました', 'success');
        } catch (error) {
            console.error('投票終了エラー:', error);
            UI.showMessage('投票の終了に失敗しました', 'error');
        }
    },

    /**
     * 投票タイマー開始
     */
    startTimer(totalSeconds) {
        if (this.votingTimer) {
            clearInterval(this.votingTimer);
        }
        
        const timerElements = [
            document.getElementById('timer'),
            document.getElementById('timer-gm')
        ];
        
        let remainingTime = totalSeconds;
        
        const updateTimer = () => {
            if (remainingTime <= 0) {
                this.stopTimer();
                
                timerElements.forEach(element => {
                    if (element) {
                        element.textContent = '時間切れ';
                        element.style.color = 'var(--md-error)';
                    }
                });
                
                if (AppState.currentRole === 'gamemaster') {
                    this.endVoting();
                }
                return;
            }
            
            const minutes = Math.floor(remainingTime / 60);
            const seconds = remainingTime % 60;
            const timeText = `残り時間: ${minutes}:${seconds.toString().padStart(2, '0')}`;
            
            timerElements.forEach(element => {
                if (element) {
                    element.textContent = timeText;
                    if (remainingTime <= 60) {
                        element.style.color = 'var(--md-error)';
                    } else if (remainingTime <= 300) {
                        element.style.color = '#f56500';
                    } else {
                        element.style.color = 'var(--md-success)';
                    }
                }
            });
            
            remainingTime--;
        };
        
        updateTimer();
        this.votingTimer = setInterval(updateTimer, 1000);
    },

    /**
     * 投票タイマー停止
     */
    stopTimer() {
        if (this.votingTimer) {
            clearInterval(this.votingTimer);
            this.votingTimer = null;
        }
        
        const timerElements = [
            document.getElementById('timer'),
            document.getElementById('timer-gm')
        ];
        
        timerElements.forEach(element => {
            if (element) {
                element.textContent = '投票終了';
                element.style.color = 'var(--md-error)';
            }
        });
    },

    /**
     * 投票オプションの設定
     */
    async setupOptions(changedNames) {
        const optionsElement = document.getElementById('voting-options');
        if (!optionsElement) return;
        
        optionsElement.innerHTML = '';
        
        if (changedNames.length === 0) {
            optionsElement.innerHTML = '<p class="body-medium">まだ変更後の名前が登録されていません。</p>';
            return;
        }
        
        try {
            const { data: originalNames, error } = await DatabaseAPI.getOriginalNames(AppState.currentRoomId);
            if (error) throw error;
            
            if (originalNames.length === 0) {
                optionsElement.innerHTML = '<p class="body-medium">推測用の元の名前リストがありません。</p>';
                return;
            }
            
            changedNames.forEach(changedName => {
                const optionElement = document.createElement('div');
                optionElement.className = 'md-card';
                optionElement.style.marginBottom = '16px';
                optionElement.innerHTML = `
                    <div class="card-content">
                        <h4 class="title-medium" style="margin-bottom: 16px;">${changedName.changed_name}</h4>
                        <div class="md-text-field">
                            <label>誰だと思いますか？</label>
                            <select onchange="VotingManager.updateVote(${changedName.id}, this.value)">
                                <option value="">選択してください</option>
                                ${originalNames.map(orig => `<option value="${orig.original_name}">${orig.original_name}</option>`).join('')}
                            </select>
                        </div>
                    </div>
                `;
                optionsElement.appendChild(optionElement);
            });
        } catch (error) {
            console.error('投票オプション設定エラー:', error);
            UI.showMessage('投票オプションの設定に失敗しました', 'error');
        }
    },

    /**
     * 投票の更新
     */
    updateVote(changedNameId, originalName) {
        if (originalName) {
            AppState.selectedVotes[changedNameId] = originalName;
        } else {
            delete AppState.selectedVotes[changedNameId];
        }
        
        const submitButton = document.querySelector('button[onclick="submitVote()"]');
        if (submitButton) {
            submitButton.disabled = Object.keys(AppState.selectedVotes).length === 0;
        }
    },

    /**
     * 投票送信
     */
    async submitVote() {
        try {
            const voterId = this.generateVoterId();
            
            // 既に投票済みかチェック
            const hasVoted = sessionStorage.getItem(`voted_${AppState.currentRoomId}`);
            if (hasVoted) {
                UI.showMessage('既に投票済みです', 'error');
                return;
            }
            
            for (const [changedNameId, originalName] of Object.entries(AppState.selectedVotes)) {
                if (originalName) {
                    const { error } = await DatabaseAPI.submitVote(
                        AppState.currentRoomId, 
                        parseInt(changedNameId), 
                        originalName, 
                        voterId
                    );
                    
                    if (error) throw error;
                }
            }
            
            // 投票済みフラグを設定
            sessionStorage.setItem(`voted_${AppState.currentRoomId}`, 'true');
            
            // 投票後の処理
            AppState.selectedVotes = {};
            this.showVotingCompletedState();
            
            UI.showMessage('投票を送信しました！結果発表をお待ちください', 'success');
        } catch (error) {
            console.error('投票送信エラー:', error);
            UI.showMessage('投票の送信に失敗しました', 'error');
        }
    },

    /**
     * 投票完了状態の表示
     */
    showVotingCompletedState() {
        // 投票オプションを無効化
        document.querySelectorAll('#voting-options select').forEach(select => {
            select.disabled = true;
        });
        
        // 投票ボタンを更新
        const submitButton = document.querySelector('button[onclick*="submitVote"]') || 
                            document.getElementById('submit-vote-btn');
        if (submitButton) {
            submitButton.disabled = true;
            submitButton.innerHTML = '<span class="material-icons material-icons-18">check_circle</span>投票完了';
            submitButton.classList.remove('md-button-filled');
            submitButton.classList.add('md-button-tonal');
        }
        
        // 投票完了メッセージを表示
        const votingStatus = document.getElementById('voting-status');
        if (votingStatus) {
            votingStatus.innerHTML = `
                <div style="display: flex; align-items: center; gap: 8px; color: var(--md-success);">
                    <span class="material-icons">check_circle</span>
                    <span>投票完了！結果発表をお待ちください</span>
                </div>
            `;
        }
        
        // 投票カードに完了マークを追加
        document.querySelectorAll('#voting-options .md-card').forEach(card => {
            const select = card.querySelector('select');
            if (select && select.value) {
                const completedBadge = document.createElement('div');
                completedBadge.style.cssText = `
                    position: absolute;
                    top: 12px;
                    right: 12px;
                    background: var(--md-success);
                    color: var(--md-on-primary);
                    padding: 4px 8px;
                    border-radius: 12px;
                    font-size: 12px;
                    font-weight: 600;
                    display: flex;
                    align-items: center;
                    gap: 4px;
                `;
                completedBadge.innerHTML = '<span class="material-icons" style="font-size: 14px;">check</span>投票済み';
                
                const cardContent = card.querySelector('.card-content');
                if (cardContent) {
                    cardContent.style.position = 'relative';
                    cardContent.appendChild(completedBadge);
                }
            }
        });
        
        // 投票セクション全体に完了スタイルを適用
        const votingOptions = document.getElementById('voting-options');
        if (votingOptions) {
            votingOptions.style.opacity = '0.8';
            votingOptions.style.pointerEvents = 'none';
        }
        
        // 投票完了カードを表示
        const completedCard = document.getElementById('voting-completed-card');
        if (completedCard) {
            completedCard.style.display = 'block';
            // スムーズに表示
            setTimeout(() => {
                completedCard.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }, 500);
        }
    },

    /**
     * 投票者IDの生成
     */
    generateVoterId() {
        let voterId = sessionStorage.getItem('voterId');
        if (!voterId) {
            voterId = 'voter_' + Math.random().toString(36).substr(2, 9);
            sessionStorage.setItem('voterId', voterId);
        }
        return voterId;
    }
};

// グローバルスコープでの関数エクスポート
window.startVoting = VotingManager.startVoting.bind(VotingManager);
window.endVoting = VotingManager.endVoting.bind(VotingManager);
window.submitVote = VotingManager.submitVote.bind(VotingManager);
window.updateVote = VotingManager.updateVote.bind(VotingManager);
window.VotingManager = VotingManager;