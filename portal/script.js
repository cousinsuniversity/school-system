// Student Portal Script
// Fixed version for portal

const portalState = {
    currentSection: 'portal-dashboard',
    notifications: []
};

// Initialize portal
document.addEventListener('DOMContentLoaded', function() {
    console.log('Student Portal initialized');
    
    // Show initial section
    portalShowSection('portal-dashboard');
    
    // Setup portal event listeners
    setupPortalEvents();
});

// Portal section navigation
function portalShowSection(sectionId) {
    console.log('Portal showing section:', sectionId);
    
    // Hide all portal sections
    document.querySelectorAll('.portal-section').forEach(section => {
        section.classList.remove('active');
    });
    
    // Show selected section
    const targetSection = document.getElementById(sectionId);
    if (targetSection) {
        targetSection.classList.add('active');
        portalState.currentSection = sectionId;
    }
}

// Show portal notification
function portalShowNotification() {
    const notification = document.getElementById('portal-notification');
    if (!notification) {
        console.error('Portal notification element not found');
        return;
    }
    
    // Reset animation
    notification.style.animation = 'none';
    notification.offsetHeight; // Trigger reflow
    notification.style.animation = 'portalNotificationSlideIn 0.6s cubic-bezier(0.68, -0.55, 0.265, 1.55)';
    
    // Show notification
    notification.style.display = 'block';
    
    // Auto-hide after 5 seconds
    setTimeout(() => {
        if (notification.style.display !== 'none') {
            notification.style.opacity = '0';
            notification.style.transform = 'translateX(100px) rotateY(20deg) scale(0.9)';
            
            setTimeout(() => {
                notification.style.display = 'none';
                notification.style.opacity = '1';
                notification.style.transform = '';
            }, 300);
        }
    }, 5000);
    
    // Add to notifications history
    portalState.notifications.push({
        type: 'info',
        message: 'User viewed notification demo',
        timestamp: new Date()
    });
}

// Setup portal events
function setupPortalEvents() {
    // Add click handlers for all portal navigation buttons
    document.querySelectorAll('.portal-nav-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            // Visual feedback
            this.style.transform = 'scale(0.95)';
            setTimeout(() => {
                this.style.transform = '';
            }, 200);
        });
    });
    
    // Card hover effects
    document.querySelectorAll('.portal-card').forEach(card => {
        card.addEventListener('mouseenter', function() {
            this.style.boxShadow = '0 15px 35px rgba(245, 87, 108, 0.2)';
        });
        
        card.addEventListener('mouseleave', function() {
            this.style.boxShadow = '';
        });
    });
}

// Export for testing
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        portalShowSection,
        portalShowNotification,
        portalState
    };
}
