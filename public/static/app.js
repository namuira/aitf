// Global state
let currentButtons = [];

// DOM loaded event
document.addEventListener('DOMContentLoaded', function() {
  initializeApp();
});

function initializeApp() {
  // Check if we're on the login page or dashboard
  const loginForm = document.getElementById('loginForm');
  const addButtonForm = document.getElementById('addButtonForm');
  
  if (loginForm) {
    initializeLoginPage();
  }
  
  if (addButtonForm) {
    initializeDashboard();
  }
}

// Login page functionality
function initializeLoginPage() {
  const loginForm = document.getElementById('loginForm');
  const authMessage = document.getElementById('authMessage');
  
  loginForm.addEventListener('submit', async function(e) {
    e.preventDefault();
    
    const password = document.getElementById('password').value;
    const submitBtn = e.target.querySelector('button[type="submit"]');
    
    // Show loading state
    const originalText = submitBtn.innerHTML;
    submitBtn.innerHTML = '<div class="loading-spinner inline-block mr-2"></div>로그인 중...';
    submitBtn.disabled = true;
    
    try {
      const response = await axios.post('/api/login', { password });
      
      if (response.data.success) {
        // Set session cookie
        document.cookie = `session=${response.data.sessionId}; path=/; max-age=${24 * 60 * 60}`;
        
        // Show success message
        authMessage.innerHTML = '<div class="text-green-400"><i class="fas fa-check mr-2"></i>로그인 성공! 리디렉션 중...</div>';
        
        // Redirect to dashboard
        setTimeout(() => {
          window.location.href = '/dashboard';
        }, 1000);
      }
    } catch (error) {
      const message = error.response?.data?.message || '로그인 중 오류가 발생했습니다.';
      authMessage.innerHTML = `<div class="text-red-400"><i class="fas fa-exclamation-triangle mr-2"></i>${message}</div>`;
    } finally {
      // Reset button state
      submitBtn.innerHTML = originalText;
      submitBtn.disabled = false;
    }
  });
}

// Dashboard functionality
function initializeDashboard() {
  const addButtonForm = document.getElementById('addButtonForm');
  const buttonTypeSelect = document.getElementById('buttonType');
  const logoutBtn = document.getElementById('logoutBtn');
  const closeModalBtn = document.getElementById('closeModal');
  const htmlModal = document.getElementById('htmlModal');
  
  // Load existing buttons
  loadButtons();
  
  // Handle button type change
  buttonTypeSelect.addEventListener('change', function() {
    toggleFormFields(this.value);
  });
  
  // Handle form submission
  addButtonForm.addEventListener('submit', async function(e) {
    e.preventDefault();
    await addNewButton();
  });
  
  // Handle logout
  logoutBtn.addEventListener('click', async function() {
    await logout();
  });
  
  // Handle modal close
  closeModalBtn.addEventListener('click', function() {
    closeModal();
  });
  
  // Close modal when clicking outside
  htmlModal.addEventListener('click', function(e) {
    if (e.target === htmlModal) {
      closeModal();
    }
  });
  
  // Handle escape key
  document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape' && !htmlModal.classList.contains('hidden')) {
      closeModal();
    }
  });
}

// Toggle form fields based on button type
function toggleFormFields(type) {
  const urlField = document.getElementById('urlField');
  const htmlField = document.getElementById('htmlField');
  const typebotField = document.getElementById('typebotField');
  const buttonUrl = document.getElementById('buttonUrl');
  const buttonHtml = document.getElementById('buttonHtml');
  const typebotId = document.getElementById('typebotId');
  
  // Hide all fields first
  urlField.style.display = 'none';
  htmlField.style.display = 'none';
  typebotField.style.display = 'none';
  buttonUrl.required = false;
  buttonHtml.required = false;
  typebotId.required = false;
  
  if (type === 'link') {
    urlField.style.display = 'block';
    buttonUrl.required = true;
  } else if (type === 'modal') {
    htmlField.style.display = 'block';
    buttonHtml.required = true;
  } else if (type === 'typebot') {
    typebotField.style.display = 'block';
    typebotId.required = true;
  }
}

// Load buttons from server
async function loadButtons() {
  try {
    const response = await axios.get('/api/buttons');
    currentButtons = response.data;
    renderButtons();
  } catch (error) {
    console.error('Failed to load buttons:', error);
    showNotification('버튼 목록을 불러오는 데 실패했습니다.', 'error');
  }
}

// Render buttons in the grid
function renderButtons() {
  const buttonsGrid = document.getElementById('buttonsGrid');
  
  if (currentButtons.length === 0) {
    buttonsGrid.innerHTML = `
      <div class="col-span-full text-center py-12">
        <div class="text-gray-400 text-lg mb-4">
          <i class="fas fa-inbox text-4xl mb-4"></i>
          <p>아직 추가된 에이전트나 링크가 없습니다.</p>
          <p class="text-sm">위 폼을 사용해서 첫 번째 버튼을 만들어보세요!</p>
        </div>
      </div>
    `;
    return;
  }
  
  buttonsGrid.innerHTML = currentButtons.map(button => createButtonHTML(button)).join('');
  
  // Add event listeners to buttons
  currentButtons.forEach(button => {
    const buttonElement = document.getElementById(`button-${button.id}`);
    const deleteBtn = document.getElementById(`delete-${button.id}`);
    
    if (buttonElement) {
      buttonElement.addEventListener('click', () => handleButtonClick(button));
    }
    
    if (deleteBtn) {
      deleteBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        deleteButton(button.id);
      });
    }
  });
}

// Create HTML for a single button
function createButtonHTML(button) {
  const colorClass = `btn-${button.color}`;
  
  return `
    <div class="agent-button ${colorClass} glass rounded-2xl p-6 cursor-pointer relative group" id="button-${button.id}">
      <button 
        id="delete-${button.id}"
        class="absolute top-2 right-2 text-white/70 hover:text-white hover:bg-white/20 rounded-full w-8 h-8 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-200"
        title="삭제"
      >
        <i class="fas fa-trash text-sm"></i>
      </button>
      
      <div class="text-center">
        <div class="mb-4">
          <i class="${button.icon || 'fas fa-star'} text-3xl text-white"></i>
        </div>
        
        <h3 class="text-white font-semibold text-lg mb-2">${button.title}</h3>
        
        ${button.description ? `<p class="text-white/80 text-sm mb-4">${button.description}</p>` : ''}
        
        <div class="flex justify-center items-center space-x-2 text-white/70 text-xs">
          <i class="${button.type === 'link' ? 'fas fa-external-link-alt' : 'fas fa-window-maximize'}"></i>
          <span>${button.type === 'link' ? '링크' : '모달'}</span>
        </div>
      </div>
    </div>
  `;
}

// Handle button click
function handleButtonClick(button) {
  if (button.type === 'link') {
    // Open link in new tab
    window.open(button.url, '_blank');
  } else {
    // Show modal with HTML content
    showModal(button.title, button.htmlContent);
  }
}

// Show modal
function showModal(title, htmlContent) {
  const modal = document.getElementById('htmlModal');
  const modalTitle = document.getElementById('modalTitle');
  const modalContent = document.getElementById('modalContent');
  
  modalTitle.textContent = title;
  modalContent.innerHTML = htmlContent;
  
  modal.classList.remove('hidden');
  modal.classList.add('modal-enter');
  
  // Add animation class to content
  setTimeout(() => {
    modalContent.classList.add('modal-content-enter');
  }, 50);
}

// Close modal
function closeModal() {
  const modal = document.getElementById('htmlModal');
  const modalContent = document.getElementById('modalContent');
  
  modal.classList.add('hidden');
  modal.classList.remove('modal-enter');
  modalContent.classList.remove('modal-content-enter');
}

// Add new button
async function addNewButton() {
  const title = document.getElementById('buttonTitle').value;
  const type = document.getElementById('buttonType').value;
  const description = document.getElementById('buttonDescription').value;
  const url = document.getElementById('buttonUrl').value;
  const htmlContent = document.getElementById('buttonHtml').value;
  const typebotId = document.getElementById('typebotId').value;
  const apiHost = document.getElementById('apiHost').value;
  const icon = document.getElementById('buttonIcon').value;
  const color = document.getElementById('buttonColor').value;
  
  const submitBtn = document.querySelector('#addButtonForm button[type="submit"]');
  const originalText = submitBtn.innerHTML;
  
  // Show loading state
  submitBtn.innerHTML = '<div class="loading-spinner inline-block mr-2"></div>추가 중...';
  submitBtn.disabled = true;
  
  try {
    const buttonData = {
      title,
      type,
      description,
      icon,
      color
    };
    
    if (type === 'link') {
      buttonData.url = url;
    } else if (type === 'modal') {
      buttonData.htmlContent = htmlContent;
    } else if (type === 'typebot') {
      buttonData.typebotId = typebotId;
      buttonData.apiHost = apiHost;
    }
    
    const response = await axios.post('/api/buttons', buttonData);
    
    if (response.data.success) {
      // Reset form
      document.getElementById('addButtonForm').reset();
      toggleFormFields('link'); // Reset to default
      
      // Reload buttons
      await loadButtons();
      
      showNotification('버튼이 성공적으로 추가되었습니다!', 'success');
    }
  } catch (error) {
    const message = error.response?.data?.error || '버튼 추가 중 오류가 발생했습니다.';
    showNotification(message, 'error');
  } finally {
    // Reset button state
    submitBtn.innerHTML = originalText;
    submitBtn.disabled = false;
  }
}

// Delete button
async function deleteButton(buttonId) {
  if (!confirm('정말로 이 버튼을 삭제하시겠습니까?')) {
    return;
  }
  
  try {
    const response = await axios.delete(`/api/buttons/${buttonId}`);
    
    if (response.data.success) {
      await loadButtons();
      showNotification('버튼이 삭제되었습니다.', 'success');
    }
  } catch (error) {
    const message = error.response?.data?.error || '버튼 삭제 중 오류가 발생했습니다.';
    showNotification(message, 'error');
  }
}

// Logout
async function logout() {
  try {
    await axios.post('/api/logout');
    
    // Clear session cookie
    document.cookie = 'session=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT;';
    
    // Redirect to login
    window.location.href = '/login';
  } catch (error) {
    console.error('Logout error:', error);
    // Force redirect even if API call fails
    window.location.href = '/login';
  }
}

// Show notification
function showNotification(message, type = 'info') {
  // Create notification element
  const notification = document.createElement('div');
  notification.className = `
    fixed top-4 right-4 z-50 p-4 rounded-lg shadow-lg text-white max-w-sm
    ${type === 'success' ? 'bg-green-600' : type === 'error' ? 'bg-red-600' : 'bg-blue-600'}
    transform translate-x-full transition-transform duration-300
  `;
  
  const icon = type === 'success' ? 'fas fa-check' : type === 'error' ? 'fas fa-exclamation-triangle' : 'fas fa-info';
  
  notification.innerHTML = `
    <div class="flex items-center space-x-3">
      <i class="${icon}"></i>
      <span>${message}</span>
      <button class="ml-auto text-white/80 hover:text-white">
        <i class="fas fa-times"></i>
      </button>
    </div>
  `;
  
  // Add to DOM
  document.body.appendChild(notification);
  
  // Animate in
  setTimeout(() => {
    notification.classList.remove('translate-x-full');
  }, 100);
  
  // Auto remove after 5 seconds
  setTimeout(() => {
    removeNotification(notification);
  }, 5000);
  
  // Add click to close
  notification.querySelector('button').addEventListener('click', () => {
    removeNotification(notification);
  });
}

// Remove notification
function removeNotification(notification) {
  notification.classList.add('translate-x-full');
  setTimeout(() => {
    if (notification.parentNode) {
      notification.parentNode.removeChild(notification);
    }
  }, 300);
}