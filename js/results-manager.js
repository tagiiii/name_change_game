/**
 * 結果管理機能
 * 投票結果の計算、表示、詳細表示
 */

const ResultsManager = {
    /**
     * 結果の計算
     */
    async calculate() {
        try {
            const { data, error } = await DatabaseAPI.getVoteResults(AppState.currentRoomId);
            
            if (error) throw error;
            
            const results = this.processVoteData(data);
            AppState.detailResults = results;
            
            return results;
        } catch (error) {
            console.error('結果計算エラー:', error);
            UI.showMessage('結果の計算に失敗しました', 'error');
            return {};
        }
    },

    /**
     * 投票データの処理
     */
    processVoteData(data) {
        const results = {};
        
        // 投票データの集計
        data.forEach(vote => {
            const changedNameId = vote.changed_name_id;
            const originalName = vote.selected_original_name;
            const changedName = vote.changed_names.changed_name;
            
            if (!results[changedNameId]) {
                results[changedNameId] = {
                    changedName,
                    votes: {}
                };
            }
            
            results[changedNameId].votes[originalName] = (results[changedNameId].votes[originalName] || 0) + 1;
        });
        
        // 最多票の計算
        const finalResults = {};
        Object.entries(results).forEach(([changedNameId, result]) => {
            const { winningNames, maxVotes } = this.calculateWinners(result.votes);
            
            finalResults[changedNameId] = {
                changedName: result.changedName,
                originalNames: winningNames,
                count: maxVotes,
                isTie: winningNames.length > 1,
                allVotes: result.votes
            };
        });
        
        return finalResults;
    },

    /**
     * 勝者の計算
     */
    calculateWinners(votes) {
        let maxVotes = 0;
        let winningNames = [];
        
        // 最大票数を取得
        Object.entries(votes).forEach(([name, count]) => {
            if (count > maxVotes) {
                maxVotes = count;
            }
        });
        
        // 最大票数と同じ票数の名前をすべて取得
        Object.entries(votes).forEach(([name, count]) => {
            if (count === maxVotes) {
                winningNames.push(name);
            }
        });
        
        return { winningNames, maxVotes };
    },

    /**
     * 詳細結果の表示
     */
    async showDetailResults(changedNameId) {
        try {
            if (!AppState.detailResults || !AppState.detailResults[changedNameId]) {
                UI.showMessage('詳細結果データが見つかりません', 'error');
                return;
            }
            
            const result = AppState.detailResults[changedNameId];
            const { data, error } = await DatabaseAPI.getVoteResults(AppState.currentRoomId);
            
            if (error) throw error;
            
            const relevantVotes = data.filter(vote => vote.changed_name_id == changedNameId);
            const voteCount = this.aggregateVotes(relevantVotes);
            const sortedVotes = this.sortVotesByCount(voteCount);
            
            this.renderDetailModal(result, sortedVotes, relevantVotes.length);
            
        } catch (error) {
            console.error('詳細結果表示エラー:', error);
            UI.showMessage('詳細結果の表示に失敗しました', 'error');
        }
    },

    /**
     * 投票の集計
     */
    aggregateVotes(relevantVotes) {
        const voteCount = {};
        relevantVotes.forEach(vote => {
            const originalName = vote.selected_original_name;
            voteCount[originalName] = (voteCount[originalName] || 0) + 1;
        });
        return voteCount;
    },

    /**
     * 票数でソート
     */
    sortVotesByCount(voteCount) {
        return Object.entries(voteCount)
            .sort(([,a], [,b]) => b - a)
            .map(([name, count]) => ({ name, count }));
    },

    /**
     * 詳細モーダルのレンダリング
     */
    renderDetailModal(result, sortedVotes, totalVotes) {
        const detailHtml = `
            <div class="detail-overlay" onclick="ResultsManager.hideDetailResults()">
                <div class="detail-modal" onclick="event.stopPropagation()">
                    <div class="detail-header">
                        <h3 class="title-large">
                            <span class="material-icons" style="vertical-align: middle; margin-right: 8px;">analytics</span>
                            詳細投票結果
                        </h3>
                        <button class="md-button md-button-text" onclick="ResultsManager.hideDetailResults()">
                            <span class="material-icons">close</span>
                        </button>
                    </div>
                    <div class="detail-content">
                        <div class="md-card" style="margin-bottom: 24px;">
                            <div class="card-content">
                                <h4 class="title-medium">${result.changedName} の投票結果</h4>
                            </div>
                        </div>
                        
                        <div class="detail-votes">
                            ${sortedVotes.map(vote => {
                                const isWinner = vote.count === result.count;
                                const percentage = Math.round((vote.count / totalVotes) * 100);
                                return `
                                    <div class="md-card vote-detail-item ${isWinner ? 'winner' : ''}" style="margin-bottom: 8px;">
                                        <div class="card-content" style="padding: 16px;">
                                            <div style="display: flex; justify-content: space-between; align-items: center;">
                                                <span class="body-large" style="font-weight: 600;">${vote.name}</span>
                                                <span class="body-medium">${vote.count}票 (${percentage}%)</span>
                                            </div>
                                            <div style="width: 100%; height: 6px; background: var(--md-outline-variant); border-radius: 3px; margin-top: 8px; overflow: hidden;">
                                                <div style="height: 100%; background: ${isWinner ? 'var(--md-success)' : 'var(--md-primary)'}; width: ${percentage}%; transition: width 0.3s ease; border-radius: 3px;"></div>
                                            </div>
                                        </div>
                                    </div>
                                `;
                            }).join('')}
                        </div>
                        
                        <div class="md-card">
                            <div class="card-content">
                                <div class="body-medium">
                                    <p style="margin-bottom: 8px;"><strong>総投票数:</strong> ${totalVotes}票</p>
                                    ${result.isTie ? 
                                        `<p style="color: var(--md-warning);"><strong>同票:</strong> ${result.originalNames.join('、')} (各${result.count}票)</p>` : 
                                        `<p style="color: var(--md-success);"><strong>最多票:</strong> ${result.originalNames[0]} (${result.count}票)</p>`
                                    }
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        const detailContainer = document.createElement('div');
        detailContainer.id = 'detail-results-container';
        detailContainer.innerHTML = detailHtml;
        document.body.appendChild(detailContainer);
        
        this.addDetailModalStyles();
    },

    /**
     * 詳細モーダルのスタイル追加
     */
    addDetailModalStyles() {
        if (document.getElementById('detail-results-styles')) return;
        
        const style = document.createElement('style');
        style.id = 'detail-results-styles';
        style.textContent = `
            .detail-overlay {
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: rgba(0, 0, 0, 0.5);
                display: flex;
                justify-content: center;
                align-items: center;
                z-index: 1000;
            }
            
            .detail-modal {
                background: var(--md-surface);
                border-radius: var(--md-corner-lg);
                max-width: 600px;
                width: 90%;
                max-height: 80vh;
                overflow-y: auto;
                box-shadow: var(--md-elevation-5);
            }
            
            .detail-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                padding: 24px;
                border-bottom: 1px solid var(--md-outline-variant);
                background: var(--md-surface-container);
            }
            
            .detail-content {
                padding: 24px;
            }
            
            .vote-detail-item.winner {
                border: 2px solid var(--md-success);
                background: var(--md-success-container);
            }
        `;
        document.head.appendChild(style);
    },

    /**
     * 詳細結果の非表示
     */
    hideDetailResults() {
        const detailContainer = document.getElementById('detail-results-container');
        if (detailContainer) {
            detailContainer.remove();
        }
    }
};

// グローバルスコープでの関数エクスポート
window.showDetailResults = ResultsManager.showDetailResults.bind(ResultsManager);
window.ResultsManager = ResultsManager;