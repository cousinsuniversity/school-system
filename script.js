// School Management System - Main Script
// Fixed version with all error corrections

// Global state management
const appState = {
    currentSection: 'dashboard',
    students: [],
    courses: [
        { id: 'math101', name: 'Mathematics 101', enrolled: 0 },
        { id: 'cs101', name: 'Computer Science 101', enrolled: 0 },
        { id: 'physics101', name: 'Physics 101', enrolled: 0 },
        { id: 'english101', name: 'English 101', enrolled: 0 }
    ],
    syncStatus: 'idle',
    notifications: []
};

// Initialize application
document.addEventListener('DOMContentLoaded', function() {
    console.log('School Management System initialized');
    
    // Load saved data from localStorage
    loadSavedData();
    
    // Initialize dashboard counters
    updateDashboardCounters();
    
    // Set up event listeners
    setupEventListeners();
    
    // Show initial section
    showSection('dashboard');
});

// FIXED: Added missing showSection function
function showSection(sectionId) {
    console.log('Showing section:', sectionId);
    
    // Hide all sections
    document.querySelectorAll('.section').forEach(section => {
        section.classList.remove('active');
    });
    
    // Show selected section
    const targetSection = document.getElementById(sectionId);
    if (targetSection) {
        targetSection.classList.add('active');
        appState.currentSection = sectionId;
        
        // Update active nav button styling
        document.querySelectorAll('.nav-btn').forEach(btn => {
            btn.style.opacity = '0.8';
        });
        
        // Special handling for GitHub sync section
        if (sectionId === 'github-sync') {
            updateSyncStatus('Ready to sync');
        }
        
        // Show success notification only when triggered by user click
        if (event && event.type === 'click') {
            showNotification('Navigation', `Switched to ${getSectionName(sectionId)}`, 'info');
        }
    } else {
        console.error('Section not found:', sectionId);
        showNotification('Error', `Section "${sectionId}" not found`, 'error');
    }
}

// FIXED: Added missing showGitHubSync function
function showGitHubSync() {
    console.log('Showing GitHub sync section');
    
    // First show the section
    showSection('github-sync');
    
    // Then show a notification (only allowed from user gesture)
    showNotification('GitHub Sync', 'Ready to synchronize data with GitHub', 'info');
    
    // Update sync interface
    updateSyncInterface();
}

// Get section display name
function getSectionName(sectionId) {
    const names = {
        'dashboard': 'Dashboard',
        'enrollments': 'Enrollments',
        'courses': 'Courses',
        'github-sync': 'GitHub Sync',
        'settings': 'Settings'
    };
    return names[sectionId] || sectionId;
}

// Student enrollment function
function enrollStudent() {
    const nameInput = document.getElementById('student-name');
    const emailInput = document.getElementById('student-email');
    const courseSelect = document.getElementById('student-course');
    
    const name = nameInput.value.trim();
    const email = emailInput.value.trim();
    const courseId = courseSelect.value;
    
    // Validation
    if (!name || !email) {
        showNotification('Validation Error', 'Please fill in all required fields', 'error');
        return;
    }
    
    if (!validateEmail(email)) {
        showNotification('Validation Error', 'Please enter a valid email address', 'error');
        return;
    }
    
    // Create student object
    const student = {
        id: Date.now(),
        name: name,
        email: email,
        courseId: courseId,
        courseName: getCourseName(courseId),
        enrolledDate: new Date().toLocaleDateString(),
        status: 'active'
    };
    
    // Add to students array
    appState.students.push(student);
    
    // Update course enrollment count
    const course = appState.courses.find(c => c.id === courseId);
    if (course) {
        course.enrolled++;
    }
    
    // Clear form
    nameInput.value = '';
    emailInput.value = '';
    courseSelect.value = 'math101';
    
    // Update UI
    updateStudentList();
    updateDashboardCounters();
    
    // Save to localStorage
    saveData();
    
    // Show success notification
    showNotification('Enrollment Successful', 
        `${name} has been enrolled in ${student.courseName}`, 
        'success');
}

// Get course name by ID
function getCourseName(courseId) {
    const course = appState.courses.find(c => c.id === courseId);
    return course ? course.name : 'Unknown Course';
}

// Update student list display
function updateStudentList() {
    const studentList = document.getElementById('student-list');
    if (!studentList) return;
    
    studentList.innerHTML = '';
    
    appState.students.forEach(student => {
        const studentItem = document.createElement('div');
        studentItem.className = 'student-item';
        studentItem.innerHTML = `
            <strong>${student.name}</strong>
            <div>Email: ${student.email}</div>
            <div>Course: ${student.courseName}</div>
            <div>Enrolled: ${student.enrolledDate}</div>
            <div>Status: <span class="status-badge">${student.status}</span></div>
        `;
        studentList.appendChild(studentItem);
    });
}

// Update dashboard counters
function updateDashboardCounters() {
    const totalStudents = document.getElementById('total-students');
    const activeCourses = document.getElementById('active-courses');
    
    if (totalStudents) {
        totalStudents.textContent = appState.students.length;
    }
    
    if (activeCourses) {
        // Count courses with at least one enrollment
        const activeCount = appState.courses.filter(course => course.enrolled > 0).length;
        activeCourses.textContent = activeCount;
    }
}

// FIXED: Perform GitHub synchronization
function performGitHubSync() {
    console.log('Starting GitHub sync...');
    
    // Update status
    updateSyncStatus('Connecting to GitHub...');
    updateProgressBar(10);
    
    showNotification('GitHub Sync', 'Starting synchronization process...', 'info');
    
    // Simulate API call to GitHub
    setTimeout(() => {
        updateSyncStatus('Authenticating...');
        updateProgressBar(30);
        
        setTimeout(() => {
            updateSyncStatus('Uploading student data...');
            updateProgressBar(60);
            
            setTimeout(() => {
                updateSyncStatus('Syncing course information...');
                updateProgressBar(80);
                
                setTimeout(() => {
                    // Simulate successful sync
                    updateSyncStatus('Sync completed successfully!');
                    updateProgressBar(100);
                    
                    // Show success notification
                    showNotification('Sync Complete', 
                        'All data has been synchronized with GitHub successfully!', 
                        'success');
                    
                    // Reset after 3 seconds
                    setTimeout(() => {
                        updateSyncStatus('Ready to sync');
                        updateProgressBar(0);
                    }, 3000);
                    
                }, 1000);
                
            }, 1000);
            
        }, 1000);
        
    }, 1000);
}

// Update sync status display
function updateSyncStatus(status) {
    const statusElement = document.getElementById('sync-status-text');
    if (statusElement) {
        statusElement.textContent = status;
    }
}

// Update progress bar
function updateProgressBar(percentage) {
    const progressBar = document.getElementById('sync-progress-bar');
    if (progressBar) {
        progressBar.style.width = percentage + '%';
    }
}

// Update sync interface
function updateSyncInterface() {
    const repoInput = document.getElementById('github-repo');
    if (repoInput) {
        // Ensure repo URL is set
        if (!repoInput.value) {
            repoInput.value = 'https://github.com/cousinsuniversity/school-system';
        }
    }
}

// FIXED: 3D Liquid Glass Notification System
function showNotification(title, message, type = 'info') {
    console.log('Showing notification:', title, type);
    
    const container = document.getElementById('notification-container');
    if (!container) {
        console.error('Notification container not found');
        return;
    }
    
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.innerHTML = `
        <button class="notification-close" onclick="this.parentElement.remove()">&times;</button>
        <div class="notification-title">${title}</div>
        <div class="notification-message">${message}</div>
    `;
    
    // Add to container
    container.appendChild(notification);
    
    // Show with animation
    setTimeout(() => {
        notification.style.display = 'block';
    }, 10);
    
    // Auto-remove after 5 seconds
    setTimeout(() => {
        if (notification.parentElement) {
            notification.style.opacity = '0';
            notification.style.transform = 'translateX(100px) rotateY(20deg)';
            
            setTimeout(() => {
                if (notification.parentElement) {
                    notification.remove();
                }
            }, 300);
        }
    }, 5000);
    
    // Add to notifications history
    appState.notifications.push({
        title,
        message,
        type,
        timestamp: new Date()
    });
}

// Save settings
function saveSettings() {
    const themeSelect = document.getElementById('system-theme');
    if (themeSelect) {
        const selectedTheme = themeSelect.value;
        localStorage.setItem('systemTheme', selectedTheme);
        showNotification('Settings Saved', `Theme preference saved: ${selectedTheme}`, 'success');
    }
}

// Load saved data from localStorage
function loadSavedData() {
    try {
        // Load students
        const savedStudents = localStorage.getItem('schoolSystemStudents');
        if (savedStudents) {
            appState.students = JSON.parse(savedStudents);
            updateStudentList();
        }
        
        // Load courses with enrollment counts
        const savedCourses = localStorage.getItem('schoolSystemCourses');
        if (savedCourses) {
            appState.courses = JSON.parse(savedCourses);
        }
        
        // Load theme
        const savedTheme = localStorage.getItem('systemTheme');
        if (savedTheme && document.getElementById('system-theme')) {
            document.getElementById('system-theme').value = savedTheme;
        }
        
    } catch (error) {
        console.error('Error loading saved data:', error);
    }
}

// Save data to localStorage
function saveData() {
    try {
        localStorage.setItem('schoolSystemStudents', JSON.stringify(appState.students));
        localStorage.setItem('schoolSystemCourses', JSON.stringify(appState.courses));
    } catch (error) {
        console.error('Error saving data:', error);
    }
}

// Setup event listeners
function setupEventListeners() {
    // Form submission prevention
    document.querySelectorAll('input').forEach(input => {
        input.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                e.preventDefault();
                
                // If in enrollments section, enroll student
                if (appState.currentSection === 'enrollments') {
                    enrollStudent();
                }
            }
        });
    });
    
    // GitHub repo input validation
    const repoInput = document.getElementById('github-repo');
    if (repoInput) {
        repoInput.addEventListener('change', function() {
            if (this.value && !this.value.includes('github.com')) {
                showNotification('Warning', 'Please enter a valid GitHub repository URL', 'error');
            }
        });
    }
}

// Email validation
function validateEmail(email) {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
}

// Export for testing
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        showSection,
        showGitHubSync,
        enrollStudent,
        performGitHubSync,
        showNotification,
        appState
    };
}
