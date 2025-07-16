/**
 * ステップ管理機能
 * ゲームマスターと参加者のステップ進行管理
 */

const StepManager = {
    /**
     * ゲームマスターのステップ移動
     */
    goToStep(stepNumber) {
        // すべてのステップコンテンツを非表示
        document.querySelectorAll('#gamemaster-screen .md-card[id^="step-content-"]').forEach(content => {
            content.style.display = 'none';
        });
        
        // すべてのステップインジケーターをリセット
        document.querySelectorAll('#gamemaster-screen .md-step').forEach(step => {
            step.classList.remove('active', 'completed');
        });
        
        // 指定されたステップを表示
        const targetContent = document.getElementById(`step-content-${stepNumber}`);
        if (targetContent) {
            targetContent.style.display = 'block';
        }
        
        // ステップインジケーターを更新
        this.updateStepIndicators('gamemaster', stepNumber);
    },

    /**
     * 参加者のステップ移動
     */
    goToParticipantStep(stepNumber) {
        // すべてのステップコンテンツを非表示
        document.querySelectorAll('#participant-screen .md-card[id^="participant-step-content-"]').forEach(content => {
            content.style.display = 'none';
        });
        
        // すべてのステップインジケーターをリセット
        document.querySelectorAll('#participant-screen .md-step').forEach(step => {
            step.classList.remove('active', 'completed');
        });
        
        // 指定されたステップを表示
        const targetContent = document.getElementById(`participant-step-content-${stepNumber}`);
        if (targetContent) {
            targetContent.style.display = 'block';
        }
        
        // ステップインジケーターを更新
        this.updateStepIndicators('participant', stepNumber);
    },

    /**
     * ステップインジケーターの更新
     */
    updateStepIndicators(role, currentStepNumber) {
        const prefix = role === 'gamemaster' ? 'step' : 'participant-step';
        
        // 完了済みステップをマーク
        for (let i = 1; i < currentStepNumber; i++) {
            const step = document.getElementById(`${prefix}-${i}`);
            if (step) {
                step.classList.add('completed');
                const icon = step.querySelector('.md-step-icon');
                if (icon) {
                    icon.innerHTML = '<span class="material-icons" style="font-size: 12px;">check</span>';
                }
            }
        }
        
        // 現在のステップをアクティブにマーク
        const currentStep = document.getElementById(`${prefix}-${currentStepNumber}`);
        if (currentStep) {
            currentStep.classList.add('active');
        }
    },

    /**
     * 参加者ステップの更新（条件付き）
     */
    updateParticipantStep(stepNumber) {
        if (AppState.currentRole === 'participant') {
            this.goToParticipantStep(stepNumber);
        }
    }
};

// グローバルスコープでの関数エクスポート
window.goToStep = StepManager.goToStep.bind(StepManager);
window.goToParticipantStep = StepManager.goToParticipantStep.bind(StepManager);
window.StepManager = StepManager;