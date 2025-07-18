// 导航卡片管理服务
class NavigationService {
    constructor() {
        this.items = [];
        this.isEditMode = false;
        this.currentEditId = null;
        this.sortableInstance = null;
        
        // DOM 元素
        this.cardGrid = null;
        this.loadingIndicator = null;
        this.emptyState = null;
        this.modal = null;
        this.modalTitle = null;
        this.cardForm = null;
        this.addCardBtn = null;
        this.closeModalBtn = null;
        this.cancelBtn = null;
        this.deleteCardBtn = null;
        
        // 表单元素
        this.cardIdInput = null;
        this.cardTitleInput = null;
        this.cardDescriptionInput = null;
        this.cardUrlInput = null;
        this.cardIconInput = null;
        this.iconPreview = null;
    }

    init() {
        this.initDOMElements();
        this.setupEventListeners();
        this.loadItems();
    }    initDOMElements() {
        this.cardGrid = document.getElementById('card-grid');
        this.loadingIndicator = document.getElementById('loading-indicator');
        this.emptyState = document.getElementById('empty-state');
        this.modal = document.getElementById('card-modal');
        this.modalTitle = document.getElementById('modal-title');
        this.cardForm = document.getElementById('card-form');
        this.addCardBtn = document.getElementById('add-card-btn');
        this.closeModalBtn = document.getElementById('close-modal-btn');
        this.cancelBtn = document.getElementById('cancel-btn');
        this.deleteCardBtn = document.getElementById('delete-card-btn');
        
        this.cardIdInput = document.getElementById('card-id');
        this.cardTitleInput = document.getElementById('card-title');
        this.cardDescriptionInput = document.getElementById('card-description');
        this.cardUrlInput = document.getElementById('card-url');
        this.cardIconInput = document.getElementById('card-icon');
        this.iconPreview = document.getElementById('icon-preview');
    }

    setupEventListeners() {
        if (this.addCardBtn) {
            this.addCardBtn.addEventListener('click', () => this.openAddModal());
        }
        
        if (this.closeModalBtn) {
            this.closeModalBtn.addEventListener('click', () => this.closeModal());
        }
        
        if (this.cancelBtn) {
            this.cancelBtn.addEventListener('click', () => this.closeModal());
        }
        
        if (this.modal) {
            this.modal.addEventListener('click', (e) => {
                if (e.target === this.modal) {
                    this.closeModal();
                }
            });
        }
        
        if (this.cardForm) {
            this.cardForm.addEventListener('submit', (e) => this.handleFormSubmit(e));
        }        if (this.deleteCardBtn) {
            this.deleteCardBtn.addEventListener('click', () => this.handleDelete());
        }
        
        if (this.cardIconInput) {
            this.cardIconInput.addEventListener('input', () => this.updateIconPreview());
        }

        // 示例图标点击事件
        document.addEventListener('click', (e) => {
            if (e.target.closest('.icon-example-btn')) {
                const iconBtn = e.target.closest('.icon-example-btn');
                const iconClass = iconBtn.dataset.icon;
                if (this.cardIconInput) {
                    this.cardIconInput.value = iconClass;
                    this.updateIconPreview();
                }
            }
        });

        // ESC键关闭模态框
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.closeModal();
            }
        });
    }

    async loadItems() {
        try {
            this.showLoading();
            this.items = await apiService.getItems();
            this.renderItems();
        } catch (error) {
            console.error('加载导航项失败:', error);
            this.showEmptyState();
        } finally {
            this.hideLoading();
        }
    }

    renderItems() {
        if (!this.cardGrid) return;
        
        if (this.items.length === 0) {
            this.showEmptyState();
            return;
        }
        
        this.hideEmptyState();
        this.cardGrid.innerHTML = '';
        
        this.items.forEach((item, index) => {
            const cardElement = this.createCardElement(item, index);
            this.cardGrid.appendChild(cardElement);
        });
        
        // 应用淡入动画
        const cards = this.cardGrid.querySelectorAll('.card-container');
        cards.forEach((card, index) => {
            card.classList.add('fade-in', `fade-in-delay-${Math.min(index + 1, 6)}`);
        });
        
        // 重新初始化排序功能
        this.setupSortable();
    }

    createCardElement(item, index) {
        const cardContainer = document.createElement('div');
        cardContainer.className = 'card-container';
        cardContainer.dataset.id = item.id;
        
        cardContainer.innerHTML = `
            <div class="card-grab-handle">
                <i class="fas fa-grip-vertical"></i>
            </div>
            <div class="relative group">
                <a href="${item.url}" target="_blank" rel="noopener noreferrer"
                   class="group block bg-card-light dark:bg-card-dark rounded-xl shadow-sm hover:shadow-lg dark:hover:shadow-gray-700/50 border border-transparent hover:border-primary-light/30 dark:hover:border-primary-dark/30 p-6 pr-12 transition-all duration-300 transform hover:-translate-y-1">
                    <div class="flex items-center space-x-4">
                        <div class="flex-shrink-0 text-primary-light dark:text-primary-dark text-2xl">
                            <i class="${item.icon || 'fas fa-link'} w-8 h-8"></i>
                        </div>
                        <div class="flex-1">
                            <h3 class="text-lg font-semibold text-text-light dark:text-text-dark group-hover:text-primary-light dark:group-hover:text-primary-dark transition-colors">
                                ${Utils.escapeHtml(item.title)}
                            </h3>
                            <p class="text-sm text-muted-light dark:text-muted-dark mt-1">
                                ${Utils.escapeHtml(item.description)}
                            </p>
                        </div>
                    </div>
                </a>
                <button onclick="navigationService.openEditModal(${item.id})" 
                        class="edit-card-btn absolute bottom-3 right-3 w-6 h-6 flex items-center justify-center rounded-full bg-white dark:bg-gray-700 shadow-md opacity-0 group-hover:opacity-100 transition-all duration-200 text-muted-light dark:text-muted-dark hover:text-primary-light dark:hover:text-primary-dark hover:bg-gray-50 dark:hover:bg-gray-600 hover:scale-110">
                    <i class="fas fa-edit text-xs"></i>
                </button>
            </div>
        `;
        
        return cardContainer;
    }    openAddModal() {
        // 检查认证后再打开模态框
        if (window.secretKeyManager) {
            window.secretKeyManager.checkAuthenticationForAction(() => {
                this.doOpenAddModal();
            });
        } else {
            this.doOpenAddModal();
        }
    }

    doOpenAddModal() {
        if (!this.modal || !this.modalTitle || !this.deleteCardBtn) return;
        
        this.isEditMode = false;
        this.currentEditId = null;
        this.modalTitle.textContent = '添加新卡片';
        this.deleteCardBtn.classList.add('hidden');
        this.resetForm();
        this.showModal();
    }    openEditModal(id) {
        // 检查认证后再打开编辑模态框
        if (window.secretKeyManager) {
            window.secretKeyManager.checkAuthenticationForAction(() => {
                this.doOpenEditModal(id);
            });
        } else {
            this.doOpenEditModal(id);
        }
    }

    doOpenEditModal(id) {
        if (!this.modal || !this.modalTitle || !this.deleteCardBtn) return;
        
        const item = this.items.find(item => item.id === id);
        if (!item) return;
        
        this.isEditMode = true;
        this.currentEditId = id;
        this.modalTitle.textContent = '编辑卡片';
        this.deleteCardBtn.classList.remove('hidden');
        
        // 填充表单
        if (this.cardIdInput) this.cardIdInput.value = item.id;
        if (this.cardTitleInput) this.cardTitleInput.value = item.title;
        if (this.cardDescriptionInput) this.cardDescriptionInput.value = item.description;
        if (this.cardUrlInput) this.cardUrlInput.value = item.url;
        if (this.cardIconInput) this.cardIconInput.value = item.icon || '';
        this.updateIconPreview();
        
        this.showModal();
    }

    showModal() {
        if (!this.modal) return;
        this.modal.classList.remove('hidden');
        this.modal.querySelector('.bg-card-light').classList.add('modal-enter');
        document.body.style.overflow = 'hidden';
        
        setTimeout(() => {
            if (this.cardTitleInput) this.cardTitleInput.focus();
        }, 100);
    }

    closeModal() {
        if (!this.modal) return;
        this.modal.classList.add('hidden');
        document.body.style.overflow = '';
        this.resetForm();
    }

    resetForm() {
        if (this.cardForm) this.cardForm.reset();
        if (this.cardIdInput) this.cardIdInput.value = '';
        this.updateIconPreview();
    }

    async handleFormSubmit(e) {
        e.preventDefault();
        
        if (!this.cardTitleInput || !this.cardDescriptionInput || !this.cardUrlInput) {
            NotificationService.error('表单元素未找到');
            return;
        }
        
        const formData = {
            title: this.cardTitleInput.value.trim(),
            description: this.cardDescriptionInput.value.trim(),
            url: this.cardUrlInput.value.trim(),
            icon: this.cardIconInput ? this.cardIconInput.value.trim() || 'fas fa-link' : 'fas fa-link'
        };
        
        if (!formData.title || !formData.description || !formData.url) {
            NotificationService.error('请填写所有必填字段');
            return;
        }
        
        try {
            if (this.isEditMode) {
                await apiService.updateItem(this.currentEditId, formData);
                NotificationService.success('卡片更新成功');
            } else {
                await apiService.createItem(formData);
                NotificationService.success('卡片创建成功');
            }
            
            this.closeModal();
            await this.loadItems();
        } catch (error) {
            // 错误已在apiService中处理
        }
    }    async handleDelete() {
        if (!this.currentEditId) {
            NotificationService.error('无法删除：未选择要删除的项目');
            return;
        }
        
        // 使用自定义确认对话框
        const confirmed = await showConfirm({
            title: '确认删除',
            message: '确定要删除这个导航项吗？此操作不可撤销。',
            confirmText: '删除',
            cancelText: '取消'
        });
        
        if (!confirmed) {
            return;
        }
        
        try {
            await apiService.deleteItem(this.currentEditId);
            NotificationService.success('卡片删除成功');
            this.closeModal();
            await this.loadItems();
        } catch (error) {
            console.error('Delete error:', error);
            NotificationService.error('删除失败: ' + error.message);
        }
    }

    updateIconPreview() {
        if (!this.iconPreview || !this.cardIconInput) return;
        const iconValue = this.cardIconInput.value.trim() || 'fas fa-link';
        this.iconPreview.innerHTML = `<i class="${iconValue}"></i>`;
    }

    showLoading() {
        if (this.loadingIndicator) this.loadingIndicator.classList.remove('hidden');
        if (this.cardGrid) this.cardGrid.classList.add('hidden');
        if (this.emptyState) this.emptyState.classList.add('hidden');
    }

    hideLoading() {
        if (this.loadingIndicator) this.loadingIndicator.classList.add('hidden');
        if (this.cardGrid) this.cardGrid.classList.remove('hidden');
    }

    showEmptyState() {
        if (this.emptyState) this.emptyState.classList.remove('hidden');
        if (this.cardGrid) this.cardGrid.classList.add('hidden');
    }

    hideEmptyState() {
        if (this.emptyState) this.emptyState.classList.add('hidden');
        if (this.cardGrid) this.cardGrid.classList.remove('hidden');
    }

    setupSortable() {
        if (!this.cardGrid || typeof Sortable === 'undefined') return;
        
        // 销毁之前的实例
        if (this.sortableInstance) {
            this.sortableInstance.destroy();
        }
        
        this.sortableInstance = new Sortable(this.cardGrid, {
            animation: 150,
            ghostClass: 'sortable-ghost',
            dragClass: 'sortable-drag',
            handle: '.card-grab-handle',
            onStart: () => {
                document.querySelectorAll('.edit-card-btn').forEach(btn => {
                    btn.style.display = 'none';
                });
            },
            onEnd: async (evt) => {
                document.querySelectorAll('.edit-card-btn').forEach(btn => {
                    btn.style.display = '';
                });
                
                if (evt.oldIndex !== evt.newIndex) {
                    const movedItem = this.items.splice(evt.oldIndex, 1)[0];
                    this.items.splice(evt.newIndex, 0, movedItem);
                    await this.updateSortOrder();
                }
            }
        });
    }

    async updateSortOrder() {
        try {
            const items = this.items.map((item, index) => ({
                id: item.id,
                sort_order: index + 1
            }));
            
            await apiService.reorderItems(items);
            NotificationService.success('排序已保存');
        } catch (error) {
            console.error('更新排序失败:', error);
            NotificationService.error('排序保存失败');
            await this.loadItems();
        }
    }
}

// 创建全局导航服务实例
window.navigationService = new NavigationService();
