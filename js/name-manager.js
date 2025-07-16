/**
 * 名前管理機能
 * 元の名前と変更後の名前の追加、削除、表示
 */

const NameManager = {
    /**
     * 元の名前を追加
     */
    async addOriginalName() {
        const originalName = document.getElementById('original-name').value.trim();
        
        if (!originalName) {
            alert('元の名前を入力してください。');
            return;
        }
        
        try {
            const { data, error } = await DatabaseAPI.addOriginalName(AppState.currentRoomId, originalName);
            
            if (error) throw error;
            
            document.getElementById('original-name').value = '';
            UI.showMessage('元の名前を追加しました', 'success');
            
            // 即座にリストを更新
            await this.loadOriginalNames();
            
            // 入力フィールドにフォーカスを戻す
            document.getElementById('original-name').focus();
        } catch (error) {
            console.error('元の名前追加エラー:', error);
            UI.showMessage('元の名前の追加に失敗しました', 'error');
        }
    },

    /**
     * 変更後の名前を追加
     */
    async addChangedName() {
        const changedName = document.getElementById('changed-name').value.trim();
        
        if (!changedName) {
            alert('変更後の名前を入力してください。');
            return;
        }
        
        try {
            const { data, error } = await DatabaseAPI.addChangedName(AppState.currentRoomId, changedName);
            
            if (error) throw error;
            
            document.getElementById('changed-name').value = '';
            UI.showMessage('変更後の名前を追加しました', 'success');
            
            // 即座にリストを更新
            await this.loadChangedNames();
            
            // 入力フィールドにフォーカスを戻す
            document.getElementById('changed-name').focus();
        } catch (error) {
            console.error('変更後の名前追加エラー:', error);
            UI.showMessage('変更後の名前の追加に失敗しました', 'error');
        }
    },

    /**
     * 元の名前を削除
     */
    async removeOriginalName(id) {
        try {
            const { error } = await DatabaseAPI.removeOriginalName(id);
            
            if (error) throw error;
            
            UI.showMessage('元の名前を削除しました', 'success');
            
            // 即座にリストを更新
            await this.loadOriginalNames();
        } catch (error) {
            console.error('元の名前削除エラー:', error);
            UI.showMessage('元の名前の削除に失敗しました', 'error');
        }
    },

    /**
     * 変更後の名前を削除
     */
    async removeChangedName(id) {
        try {
            const { error } = await DatabaseAPI.removeChangedName(id);
            
            if (error) throw error;
            
            UI.showMessage('変更後の名前を削除しました', 'success');
            
            // 即座にリストを更新
            await this.loadChangedNames();
        } catch (error) {
            console.error('変更後の名前削除エラー:', error);
            UI.showMessage('変更後の名前の削除に失敗しました', 'error');
        }
    },

    /**
     * 元の名前リストの読み込み
     */
    async loadOriginalNames() {
        try {
            const { data, error } = await DatabaseAPI.getOriginalNames(AppState.currentRoomId);
            
            if (error) throw error;
            
            this.displayOriginalNames(data);
            console.log('元の名前読み込み成功:', data.length, '件');
        } catch (error) {
            console.error('元の名前読み込みエラー:', error);
            // データベースエラーの場合のみエラーメッセージを表示
            if (error.message && !error.message.includes('undefined')) {
                UI.showMessage('元の名前の読み込みに失敗しました', 'error');
            }
        }
    },

    /**
     * 変更後の名前リストの読み込み
     */
    async loadChangedNames() {
        try {
            const { data, error } = await DatabaseAPI.getChangedNames(AppState.currentRoomId);
            
            if (error) throw error;
            
            this.displayChangedNames(data);
            console.log('変更後の名前読み込み成功:', data.length, '件');
            
            if (AppState.currentRole === 'participant' && typeof VotingManager !== 'undefined') {
                try {
                    await VotingManager.setupOptions(data);
                } catch (setupError) {
                    console.warn('投票オプション設定エラー:', setupError);
                }
            }
        } catch (error) {
            console.error('変更後の名前読み込みエラー:', error);
            // データベースエラーの場合のみエラーメッセージを表示
            if (error.message && !error.message.includes('undefined')) {
                UI.showMessage('変更後の名前の読み込みに失敗しました', 'error');
            }
        }
    },

    /**
     * 元の名前リストの表示
     */
    displayOriginalNames(originalNames) {
        const listElement = document.getElementById('original-names-list');
        if (!listElement) {
            console.log('元の名前リスト要素が見つかりません');
            return;
        }
        
        if (!originalNames || originalNames.length === 0) {
            listElement.innerHTML = '<div class="md-list-item">まだ元の名前が登録されていません。</div>';
            return;
        }
        
        listElement.innerHTML = originalNames.map(name => `
            <div class="md-list-item">
                <span>${name.original_name}</span>
                <button class="md-button md-button-text" onclick="NameManager.removeOriginalName(${name.id})">
                    <span class="material-icons material-icons-18">delete</span>
                    削除
                </button>
            </div>
        `).join('');
    },

    /**
     * 変更後の名前リストの表示
     */
    displayChangedNames(changedNames) {
        const listElement = document.getElementById('changed-names-list');
        const participantListElement = document.getElementById('participant-changed-names');
        
        if (!listElement && !participantListElement) {
            console.log('変更後の名前リスト要素が見つかりません');
            return;
        }
        
        const content = (!changedNames || changedNames.length === 0)
            ? '<div class="md-list-item">まだ変更後の名前が登録されていません。</div>'
            : changedNames.map(name => `
                <div class="md-list-item">
                    <span>${name.changed_name}</span>
                    ${AppState.currentRole === 'gamemaster' ? `
                        <button class="md-button md-button-text" onclick="NameManager.removeChangedName(${name.id})">
                            <span class="material-icons material-icons-18">delete</span>
                            削除
                        </button>
                    ` : ''}
                </div>
            `).join('');
        
        if (listElement) {
            listElement.innerHTML = content;
        }
        
        if (participantListElement) {
            participantListElement.innerHTML = content;
        }
    }
};

// グローバルスコープでの関数エクスポート
window.addOriginalName = NameManager.addOriginalName;
window.addChangedName = NameManager.addChangedName;
window.removeOriginalName = NameManager.removeOriginalName;
window.removeChangedName = NameManager.removeChangedName;
window.NameManager = NameManager;