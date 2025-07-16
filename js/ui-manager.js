/**
 * UI管理機能
 * 画面表示、メッセージ表示、ボタン状態管理
 */

const UI = {
    /**
     * メッセージの表示
     */
    showMessage(message, type) {
        const existingMessage = document.querySelector('.md-message');
        if (existingMessage) {
            existingMessage.remove();
        }
        
        const messageElement = document.createElement('div');
        messageElement.className = `md-message md-message-${type}`;
        
        const icon = type === 'success' ? 'check_circle' : 'error';
        messageElement.innerHTML = `
            <span class="material-icons">${icon}</span>
            <span>${message}</span>
        `;
        
        const container = document.querySelector('.app-container');
        container.insertBefore(messageElement, container.children[1]);
        
        setTimeout(() => {
            messageElement.remove();
        }, 5000);
    },

    /**
     * 画面の表示切り替え
     */
    showScreen(screenId) {
        document.querySelectorAll('.screen').forEach(screen => {
            screen.classList.remove('active');
        });
        
        const targetScreen = document.getElementById(screenId);
        if (targetScreen) {
            targetScreen.classList.add('active');
        }
    },

    /**
     * 役割ボタンの状態更新
     */
    updateRoleButtons() {
        document.querySelectorAll('.role-card').forEach(card => {
            card.classList.remove('selected');
        });
        
        if (event && event.target) {
            const clickedCard = event.target.closest('.role-card');
            if (clickedCard) {
                clickedCard.classList.add('selected');
            }
        }
    },

    /**
     * ローディング状態の表示
     */
    showLoading(element, message = '読み込み中...') {
        if (typeof element === 'string') {
            element = document.getElementById(element);
        }
        
        if (element) {
            element.innerHTML = `
                <div class="loading">
                    <span class="material-icons" style="font-size: 48px; color: var(--md-primary); margin-bottom: 16px;">refresh</span>
                    <div class="body-large">${message}</div>
                </div>
            `;
        }
    },

    /**
     * エラー状態の表示
     */
    showError(element, message = 'エラーが発生しました') {
        if (typeof element === 'string') {
            element = document.getElementById(element);
        }
        
        if (element) {
            element.innerHTML = `
                <div class="md-message md-message-error">
                    <span class="material-icons">error</span>
                    <span>${message}</span>
                </div>
            `;
        }
    }
};

window.UI = UI;