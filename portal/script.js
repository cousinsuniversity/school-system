class SchoolPortal {
    constructor() {
        this.currentUser = null;
        this.currentSection = 'dashboard';
        this.data = {
            students: [],
            enrollments: [],
            grades: {},
            subjects: {}
        };
        
        this.initialize();
    }

    async initialize() {
        await this.loadData();
        this.checkLoginStatus();
        this.setupAutoSync();
        
        // Request notification permission
        if ('Notification' in window) {
            Notification.requestPermission();
        }
    }

    async loadData() {
        try {
            // Load from GitHub repository
            const response = await fetch('https://raw.githubusercontent.com/yourusername/school-management-system/main/data/school_data.json');
            if (response.ok) {
                const data = await response.json();
                this.data = { ...this.data, ...data };
            }
            
            // Load portal-specific data
            const portalData = localStorage.getItem('portalData');
            if (portalData) {
                const parsed = JSON.parse(portalData);
                this.data.students = parsed.students || [];
                this.data.enrollments = parsed.enrollments || [];
                this.data.grades = parsed.grades || {};
                this.data.subjects = parsed.subjects || {};
            }
        } catch (error) {
            console.log('Error loading data:', error);
        }
    }

    async saveData() {
        try {
            const portalData = {
                students: this.data.students,
                enrollments: this.data.enrollments,
                grades: this.data.grades,
                subjects: this.data.subjects
            };
            
            localStorage.setItem('portalData', JSON.stringify(portalData));
            this.showNotification('Data saved', 'success');
        } catch (error) {
            this.showNotification('Error saving data', 'error');
        }
    }

    setupAutoSync() {
        // Auto-sync every 5 minutes
        setInterval(() => this.syncWithSMS(), 5 * 60 * 1000);
    }

    async syncWithSMS() {
        try {
            // In a real implementation, this would sync with the School Management System
            // For now, we'll just save data
            await this.saveData();
            this.showNotification('Data synced', 'success');
        } catch (error) {
            console.log('Sync error:', error);
        }
    }

    checkLoginStatus() {
        const savedUser = localStorage.getItem('currentUser');
        if (savedUser) {
            this.currentUser = JSON.parse(savedUser);
            this.showDashboard();
        }
    }

    login() {
        const email = document.getElementById('loginEmail').value;
        const password = document.getElementById('loginPassword').value;
        
        if (!email || !password) {
            this.showNotification('Please enter email and password', 'error');
            return;
        }
        
        // Check if user exists in students data
        const student = this.data.students.find(s => s.email === email);
        
        if (student) {
            this.currentUser = student;
            localStorage.setItem('currentUser', JSON.stringify(student));
            this.showDashboard();
            this.showNotification('Login successful', 'success');
            
            // Show browser notification
            if ('Notification' in window && Notification.permission === 'granted') {
                new Notification('Welcome to School Portal', {
                    body: `Welcome back, ${student.name}!`,
                    icon: '/favicon.ico'
                });
            }
        } else {
            // Check if there's a pending enrollment
            const enrollment = this.data.enrollments.find(e => e.studentEmail === email);
            if (enrollment) {
                this.showNotification('Your enrollment is being processed. Please wait for approval.', 'info');
                return;
            }
            
            this.showNotification('Account not found. Please register first.', 'error');
        }
    }

    logout() {
        this.currentUser = null;
        localStorage.removeItem('currentUser');
        document.getElementById('loginSection').style.display = 'flex';
        document.getElementById('dashboardSection').style.display = 'none';
        this.showNotification('Logged out successfully', 'success');
    }

    showDashboard() {
        document.getElementById('loginSection').style.display = 'none';
        document.getElementById('dashboardSection').style.display = 'block';
        
        // Update user info
        if (this.currentUser) {
            document.getElementById('userName').textContent = this.currentUser.name;
            document.getElementById('userGrade').textContent = this.currentUser.gradeLevel || 'Not enrolled';
            
            // Create avatar from initials
            const initials = this.currentUser.name.split(' ').map(n => n[0]).join('').toUpperCase();
            document.getElementById('userAvatar').textContent = initials;
            
            // Update user section in header
            document.getElementById('userSection').innerHTML = `
                <div style="display: flex; align-items: center; gap: 10px;">
                    <span style="color: var(--secondary); font-weight: 500;">${this.currentUser.name}</span>
                    <button class="btn btn-outline" onclick="portal.logout()" style="padding: 8px 15px; font-size: 14px;">
                        <i class="fas fa-sign-out-alt"></i> Logout
                    </button>
                </div>
            `;
        }
        
        this.showSection('dashboard');
    }

    showSection(section) {
        this.currentSection = section;
        
        // Update active nav item
        document.querySelectorAll('.nav-item').forEach(item => {
            item.classList.remove('active');
        });
        
        const navItem = document.querySelector(`.nav-item[onclick="portal.showSection('${section}')"]`);
        if (navItem) {
            navItem.classList.add('active');
        }
        
        // Load section content
        const container = document.getElementById('mainContent');
        
        switch(section) {
            case 'dashboard':
                this.loadDashboard(container);
                break;
            case 'enrollment':
                this.loadEnrollmentSection(container);
                break;
            case 'grades':
                this.loadGradesSection(container);
                break;
            case 'subjects':
                this.loadSubjectsSection(container);
                break;
            case 'profile':
                this.loadProfileSection(container);
                break;
        }
    }

    loadDashboard(container) {
        const student = this.currentUser;
        
        // Check enrollment status
        const enrollment = this.data.enrollments.find(e => e.studentEmail === student.email);
        
        let statusContent = '';
        if (enrollment) {
            const status = enrollment.status || 'pending';
            const statusMessages = {
                pending: 'Your enrollment application is being reviewed.',
                approved: 'Your enrollment has been approved! Welcome to Cousins University.',
                rejected: 'Your enrollment application was rejected. Please contact the administration.',
                enrolled: 'You are successfully enrolled for the current academic year.'
            };
            
            statusContent = `
                <div class="status-container">
                    <div class="status-card">
                        <div class="status-icon ${status}">
                            <i class="fas fa-${status === 'approved' ? 'check' : status === 'rejected' ? 'times' : 'clock'}"></i>
                        </div>
                        <h2 class="status-title">Enrollment ${status.toUpperCase()}</h2>
                        <p class="status-message">${statusMessages[status]}</p>
                        
                        ${status === 'rejected' && enrollment.requiredDocuments ? `
                            <div class="status-details">
                                <h4>Required Documents:</h4>
                                <ul>
                                    ${enrollment.requiredDocuments.map(doc => `
                                        <li>${doc} <span style="color: var(--accent);">Missing</span></li>
                                    `).join('')}
                                </ul>
                                <button class="btn btn-primary" onclick="portal.showDocumentUpload()" style="margin-top: 15px;">
                                    <i class="fas fa-upload"></i> Upload Documents
                                </button>
                            </div>
                        ` : ''}
                        
                        ${status === 'pending' ? `
                            <div class="status-details">
                                <h4>Application Details:</h4>
                                <ul>
                                    <li>Application ID: <strong>${enrollment.id}</strong></li>
                                    <li>Applied for: <strong>${enrollment.gradeLevel}</strong></li>
                                    <li>Date Applied: <strong>${new Date(enrollment.date).toLocaleDateString()}</strong></li>
                                    <li>Documents Submitted: <strong>${Object.values(enrollment.documents || {}).filter(d => d).length}</strong></li>
                                </ul>
                            </div>
                        ` : ''}
                    </div>
                </div>
            `;
        } else {
            statusContent = `
                <div class="status-container">
                    <div class="status-card">
                        <div class="status-icon">
                            <i class="fas fa-user-plus"></i>
                        </div>
                        <h2 class="status-title">Start Your Journey</h2>
                        <p class="status-message">You haven't enrolled yet. Begin your educational journey with Cousins University.</p>
                        <button class="btn btn-primary" onclick="portal.showRegistration()" style="margin-top: 20px;">
                            <i class="fas fa-user-graduate"></i> Start Enrollment Process
                        </button>
                    </div>
                </div>
            `;
        }
        
        container.innerHTML = `
            <div class="content-header">
                <h2>Welcome, ${student.name}!</h2>
                <div class="action-buttons">
                    ${enrollment && enrollment.status === 'pending' ? `
                        <button class="btn btn-outline" onclick="portal.checkEnrollmentStatus()">
                            <i class="fas fa-sync"></i> Check Status
                        </button>
                    ` : ''}
                </div>
            </div>
            
            ${statusContent}
            
            ${student.gradeLevel ? `
                <div class="content-header" style="margin-top: 40px;">
                    <h3>Quick Stats</h3>
                </div>
                
                <div class="grades-grid">
                    <div class="grade-card">
                        <div class="grade-header">
                            <div class="subject-name">Current Average</div>
                            <div class="grade-value" id="currentAverage">0.00</div>
                        </div>
                        <div class="grade-progress">
                            <div class="grade-progress-bar" id="averageProgress" style="width: 0%"></div>
                        </div>
                        <div class="grade-details">
                            <span>GPA</span>
                            <span id="gpa">0.00</span>
                        </div>
                    </div>
                    
                    <div class="grade-card">
                        <div class="grade-header">
                            <div class="subject-name">Enrolled Subjects</div>
                            <div class="grade-value" id="subjectCount">0</div>
                        </div>
                        <div class="grade-progress">
                            <div class="grade-progress-bar" style="width: 0%"></div>
                        </div>
                        <div class="grade-details">
                            <span>Total Units</span>
                            <span id="totalUnits">0</span>
                        </div>
                    </div>
                </div>
            ` : ''}
        `;
        
        // Load stats if enrolled
        if (student.gradeLevel) {
            this.loadStudentStats();
        }
    }

    loadStudentStats() {
        const studentId = this.currentUser.id;
        const studentGrades = this.data.grades[studentId] || {};
        
        // Calculate average
        const grades = Object.values(studentGrades);
        if (grades.length > 0) {
            const average = grades.reduce((a, b) => a + b, 0) / grades.length;
            document.getElementById('currentAverage').textContent = average.toFixed(2);
            document.getElementById('averageProgress').style.width = `${Math.min(average, 100)}%`;
            
            // Calculate GPA (simplified)
            const gpa = average >= 90 ? 1.0 :
                       average >= 85 ? 1.5 :
                       average >= 80 ? 2.0 :
                       average >= 75 ? 2.5 : 3.0;
            document.getElementById('gpa').textContent = gpa.toFixed(2);
        }
        
        // Count subjects
        const subjects = this.data.subjects[studentId] || [];
        document.getElementById('subjectCount').textContent = subjects.length;
        document.getElementById('totalUnits').textContent = subjects.length * 3; // Assume 3 units per subject
    }

    showRegistration() {
        const modal = document.getElementById('registrationModal');
        const form = document.getElementById('registrationForm');
        
        form.innerHTML = `
            <form onsubmit="portal.submitRegistration(event)">
                <div class="form-section">
                    <h3 class="section-title"><i class="fas fa-user"></i> Personal Information</h3>
                    <div class="form-row">
                        <div class="form-group">
                            <label class="form-label">First Name *</label>
                            <input type="text" class="form-control" id="firstName" required>
                        </div>
                        <div class="form-group">
                            <label class="form-label">Last Name *</label>
                            <input type="text" class="form-control" id="lastName" required>
                        </div>
                    </div>
                    
                    <div class="form-row">
                        <div class="form-group">
                            <label class="form-label">Email Address *</label>
                            <input type="email" class="form-control" id="regEmail" required>
                        </div>
                        <div class="form-group">
                            <label class="form-label">Phone Number *</label>
                            <input type="tel" class="form-control" id="phone" required>
                        </div>
                    </div>
                    
                    <div class="form-row">
                        <div class="form-group">
                            <label class="form-label">Birth Date *</label>
                            <input type="date" class="form-control" id="birthDate" required>
                        </div>
                        <div class="form-group">
                            <label class="form-label">Gender *</label>
                            <select class="form-control" id="gender" required>
                                <option value="">Select Gender</option>
                                <option value="male">Male</option>
                                <option value="female">Female</option>
                                <option value="other">Other</option>
                            </select>
                        </div>
                    </div>
                    
                    <div class="form-group">
                        <label class="form-label">Complete Address *</label>
                        <textarea class="form-control" id="address" rows="3" required></textarea>
                    </div>
                </div>
                
                <div class="form-section">
                    <h3 class="section-title"><i class="fas fa-graduation-cap"></i> Educational Information</h3>
                    
                    <div class="form-group">
                        <label class="form-label">Grade Level to Enroll *</label>
                        <select class="form-control" id="gradeLevel" required>
                            <option value="">Select Grade Level</option>
                            <optgroup label="Junior High School">
                                <option value="Grade 7">Grade 7</option>
                                <option value="Grade 8">Grade 8</option>
                                <option value="Grade 9">Grade 9</option>
                                <option value="Grade 10">Grade 10</option>
                            </optgroup>
                            <optgroup label="Senior High School">
                                <option value="Grade 11 - STEM">Grade 11 - STEM</option>
                                <option value="Grade 11 - ABM">Grade 11 - ABM</option>
                                <option value="Grade 11 - HUMSS">Grade 11 - HUMSS</option>
                                <option value="Grade 11 - GAS">Grade 11 - GAS</option>
                                <option value="Grade 11 - TVL">Grade 11 - TVL</option>
                                <option value="Grade 12 - STEM">Grade 12 - STEM</option>
                                <option value="Grade 12 - ABM">Grade 12 - ABM</option>
                                <option value="Grade 12 - HUMSS">Grade 12 - HUMSS</option>
                                <option value="Grade 12 - GAS">Grade 12 - GAS</option>
                                <option value="Grade 12 - TVL">Grade 12 - TVL</option>
                            </optgroup>
                            <optgroup label="College">
                                <option value="1st Year - BS Computer Science">1st Year - BS Computer Science</option>
                                <option value="1st Year - BS Information Systems">1st Year - BS Information Systems</option>
                                <option value="1st Year - BS Entertainment and Multimedia Computing">1st Year - BS Entertainment and Multimedia Computing</option>
                            </optgroup>
                        </select>
                    </div>
                    
                    <div class="form-group">
                        <label class="form-label">Previous School</label>
                        <input type="text" class="form-control" id="previousSchool" placeholder="Name of your previous school">
                    </div>
                    
                    <div class="form-group">
                        <label class="form-label">Last Grade Level Completed</label>
                        <input type="text" class="form-control" id="lastGradeLevel" placeholder="e.g., Grade 10, Grade 12">
                    </div>
                </div>
                
                <div class="form-section">
                    <h3 class="section-title"><i class="fas fa-file-alt"></i> Required Documents</h3>
                    <p style="color: #666; margin-bottom: 20px;">Please check the documents you can submit:</p>
                    
                    <div class="checkbox-group">
                        <div class="checkbox-item">
                            <input type="checkbox" id="doc_birth" value="Birth Certificate" required>
                            <label for="doc_birth">Birth Certificate</label>
                        </div>
                        <div class="checkbox-item">
                            <input type="checkbox" id="doc_report" value="Form 138 (Report Card)">
                            <label for="doc_report">Form 138 (Report Card)</label>
                        </div>
                        <div class="checkbox-item">
                            <input type="checkbox" id="doc_moral" value="Good Moral Certificate">
                            <label for="doc_moral">Good Moral Certificate</label>
                        </div>
                        <div class="checkbox-item">
                            <input type="checkbox" id="doc_pictures" value="2x2 ID Pictures">
                            <label for="doc_pictures">2x2 ID Pictures</label>
                        </div>
                        <div class="checkbox-item">
                            <input type="checkbox" id="doc_medical" value="Medical Certificate">
                            <label for="doc_medical">Medical Certificate</label>
                        </div>
                    </div>
                </div>
                
                <div class="form-section">
                    <h3 class="section-title"><i class="fas fa-lock"></i> Account Security</h3>
                    
                    <div class="form-row">
                        <div class="form-group">
                            <label class="form-label">Create Password *</label>
                            <input type="password" class="form-control" id="password" required minlength="6">
                        </div>
                        <div class="form-group">
                            <label class="form-label">Confirm Password *</label>
                            <input type="password" class="form-control" id="confirmPassword" required>
                        </div>
                    </div>
                </div>
                
                <div class="form-section">
                    <div class="checkbox-item">
                        <input type="checkbox" id="agreeTerms" required>
                        <label for="agreeTerms">I agree to the Terms and Conditions and Privacy Policy</label>
                    </div>
                </div>
                
                <div style="display: flex; gap: 15px; margin-top: 30px;">
                    <button type="button" class="btn btn-outline" onclick="portal.hideRegistration()" style="flex: 1;">
                        Cancel
                    </button>
                    <button type="submit" class="btn btn-primary" style="flex: 2;">
                        <i class="fas fa-paper-plane"></i> Submit Enrollment Application
                    </button>
                </div>
            </form>
        `;
        
        modal.style.display = 'flex';
    }

    hideRegistration() {
        document.getElementById('registrationModal').style.display = 'none';
    }

    submitRegistration(event) {
        event.preventDefault();
        
        // Validate passwords match
        const password = document.getElementById('password').value;
        const confirmPassword = document.getElementById('confirmPassword').value;
        
        if (password !== confirmPassword) {
            this.showNotification('Passwords do not match', 'error');
            return;
        }
        
        // Collect form data
        const enrollment = {
            id: 'ENR-' + Date.now(),
            studentName: document.getElementById('firstName').value + ' ' + document.getElementById('lastName').value,
            studentEmail: document.getElementById('regEmail').value,
            phone: document.getElementById('phone').value,
            birthDate: document.getElementById('birthDate').value,
            gender: document.getElementById('gender').value,
            address: document.getElementById('address').value,
            gradeLevel: document.getElementById('gradeLevel').value,
            previousSchool: document.getElementById('previousSchool').value,
            lastGradeLevel: document.getElementById('lastGradeLevel').value,
            
            // Collect document status
            documents: {
                'Birth Certificate': document.getElementById('doc_birth').checked,
                'Form 138 (Report Card)': document.getElementById('doc_report').checked,
                'Good Moral Certificate': document.getElementById('doc_moral').checked,
                '2x2 ID Pictures': document.getElementById('doc_pictures').checked,
                'Medical Certificate': document.getElementById('doc_medical').checked
            },
            
            status: 'pending',
            date: new Date().toISOString(),
            password: password // In real app, this should be hashed
        };
        
        // Check if email already exists
        const existing = this.data.enrollments.find(e => e.studentEmail === enrollment.studentEmail);
        if (existing) {
            this.showNotification('Email already registered. Please login instead.', 'error');
            return;
        }
        
        // Add to enrollments
        this.data.enrollments.push(enrollment);
        this.saveData();
        
        this.hideRegistration();
        this.showNotification('Enrollment application submitted successfully!', 'success');
        
        // Auto-login with the new account
        this.currentUser = {
            id: 'TEMP-' + Date.now(),
            name: enrollment.studentName,
            email: enrollment.studentEmail,
            gradeLevel: enrollment.gradeLevel
        };
        
        localStorage.setItem('currentUser', JSON.stringify(this.currentUser));
        this.showDashboard();
        
        // Show browser notification
        if ('Notification' in window && Notification.permission === 'granted') {
            new Notification('Enrollment Submitted', {
                body: 'Your enrollment application has been received and is pending review.',
                icon: '/favicon.ico'
            });
        }
    }

    loadEnrollmentSection(container) {
        const student = this.currentUser;
        const enrollment = this.data.enrollments.find(e => e.studentEmail === student.email);
        
        if (!enrollment) {
            container.innerHTML = `
                <div class="content-header">
                    <h2>Enrollment</h2>
                    <div class="action-buttons">
                        <button class="btn btn-primary" onclick="portal.showRegistration()">
                            <i class="fas fa-user-plus"></i> Start Enrollment
                        </button>
                    </div>
                </div>
                
                <div style="text-align: center; padding: 60px 20px;">
                    <i class="fas fa-user-graduate" style="font-size: 64px; color: #ddd; margin-bottom: 20px;"></i>
                    <h3 style="color: var(--secondary); margin-bottom: 10px;">No Enrollment Found</h3>
                    <p style="color: #666; margin-bottom: 30px;">You haven't started the enrollment process yet.</p>
                    <button class="btn btn-primary" onclick="portal.showRegistration()">
                        <i class="fas fa-user-plus"></i> Begin Enrollment Process
                    </button>
                </div>
            `;
            return;
        }
        
        const documentsList = Object.entries(enrollment.documents || {}).map(([doc, submitted]) => `
            <li>
                ${doc}
                <span style="color: ${submitted ? 'var(--success)' : 'var(--accent)'};">
                    ${submitted ? '✓ Submitted' : '✗ Missing'}
                </span>
            </li>
        `).join('');
        
        container.innerHTML = `
            <div class="content-header">
                <h2>Enrollment Status</h2>
                <div class="action-buttons">
                    <button class="btn btn-outline" onclick="portal.checkEnrollmentStatus()">
                        <i class="fas fa-sync"></i> Refresh Status
                    </button>
                    ${enrollment.status === 'rejected' && enrollment.requiredDocuments ? `
                        <button class="btn btn-primary" onclick="portal.showDocumentUpload()">
                            <i class="fas fa-upload"></i> Upload Documents
                        </button>
                    ` : ''}
                </div>
            </div>
            
            <div class="status-container">
                <div class="status-card">
                    <div class="status-icon ${enrollment.status}">
                        <i class="fas fa-${enrollment.status === 'approved' ? 'check' : enrollment.status === 'rejected' ? 'times' : 'clock'}"></i>
                    </div>
                    <h2 class="status-title">${enrollment.status.toUpperCase()}</h2>
                    
                    <div class="status-details">
                        <h4>Application Information</h4>
                        <ul>
                            <li>Application ID: <strong>${enrollment.id}</strong></li>
                            <li>Name: <strong>${enrollment.studentName}</strong></li>
                            <li>Grade Level: <strong>${enrollment.gradeLevel}</strong></li>
                            <li>Date Applied: <strong>${new Date(enrollment.date).toLocaleDateString()}</strong></li>
                            <li>Status: <strong style="color: ${
                                enrollment.status === 'approved' ? 'var(--success)' :
                                enrollment.status === 'rejected' ? 'var(--accent)' :
                                'var(--warning)'
                            };">${enrollment.status.toUpperCase()}</strong></li>
                        </ul>
                    </div>
                    
                    <div class="status-details">
                        <h4>Documents Status</h4>
                        <ul>
                            ${documentsList}
                        </ul>
                    </div>
                    
                    ${enrollment.adminNotes && enrollment.adminNotes.length > 0 ? `
                        <div class="status-details">
                            <h4>Administrator Notes</h4>
                            ${enrollment.adminNotes.map(note => `
                                <div style="background: white; padding: 15px; border-radius: 8px; margin-bottom: 10px; border-left: 3px solid var(--primary);">
                                    <p style="margin: 0; color: #666;">${note.note}</p>
                                    <small style="color: #999; display: block; margin-top: 5px;">
                                        ${new Date(note.date).toLocaleDateString()} by ${note.by}
                                    </small>
                                </div>
                            `).join('')}
                        </div>
                    ` : ''}
                </div>
            </div>
        `;
    }

    checkEnrollmentStatus() {
        // Simulate checking status
        this.showNotification('Checking enrollment status...', 'info');
        
        setTimeout(() => {
            this.showNotification('Status refreshed', 'success');
            this.loadEnrollmentSection(document.getElementById('mainContent'));
        }, 1000);
    }

    showDocumentUpload() {
        const student = this.currentUser;
        const enrollment = this.data.enrollments.find(e => e.studentEmail === student.email);
        
        if (!enrollment || !enrollment.requiredDocuments) return;
        
        let content = `
            <div style="max-width: 500px; margin: 0 auto;">
                <h3 style="color: var(--secondary); margin-bottom: 20px;">Upload Required Documents</h3>
                <p style="color: #666; margin-bottom: 30px;">Please upload the following documents to complete your enrollment:</p>
                
                ${enrollment.requiredDocuments.map((doc, index) => `
                    <div class="form-group" style="margin-bottom: 25px;">
                        <label class="form-label">${doc}</label>
                        <div style="display: flex; gap: 10px;">
                            <input type="file" class="form-control" id="file_${index}" accept=".pdf,.jpg,.jpeg,.png" style="flex: 1;">
                            <button class="btn btn-outline" onclick="portal.previewFile('file_${index}')">
                                <i class="fas fa-eye"></i>
                            </button>
                        </div>
                        <small style="color: #666; display: block; margin-top: 5px;">Accepted: PDF, JPG, PNG (Max 5MB)</small>
                    </div>
                `).join('')}
                
                <div style="display: flex; gap: 15px; margin-top: 30px;">
                    <button class="btn btn-outline" onclick="portal.hideDialog()" style="flex: 1;">
                        Cancel
                    </button>
                    <button class="btn btn-primary" onclick="portal.submitDocuments()" style="flex: 2;">
                        <i class="fas fa-upload"></i> Submit Documents
                    </button>
                </div>
            </div>
        `;
        
        this.showDialog('Upload Documents', content);
    }

    submitDocuments() {
        // In a real implementation, this would upload files to server
        // For now, we'll simulate it
        
        const student = this.currentUser;
        const enrollment = this.data.enrollments.find(e => e.studentEmail === student.email);
        
        if (enrollment) {
            enrollment.status = 'pending'; // Reset to pending for review
            enrollment.documentsSubmitted = true;
            enrollment.documentSubmissionDate = new Date().toISOString();
            
            this.saveData();
            this.hideDialog();
            this.showNotification('Documents submitted for review', 'success');
            this.loadEnrollmentSection(document.getElementById('mainContent'));
        }
    }

    loadGradesSection(container) {
        const student = this.currentUser;
        
        if (!student.gradeLevel) {
            container.innerHTML = `
                <div class="content-header">
                    <h2>My Grades</h2>
                </div>
                
                <div style="text-align: center; padding: 60px 20px;">
                    <i class="fas fa-chart-bar" style="font-size: 64px; color: #ddd; margin-bottom: 20px;"></i>
                    <h3 style="color: var(--secondary); margin-bottom: 10px;">No Grades Available</h3>
                    <p style="color: #666;">Grades will appear here once you are enrolled and grades are encoded.</p>
                </div>
            `;
            return;
        }
        
        const studentGrades = this.data.grades[student.id] || {};
        const subjects = this.data.subjects[student.id] || [];
        
        if (subjects.length === 0) {
            // Generate sample subjects based on grade level
            const sampleSubjects = this.getSampleSubjects(student.gradeLevel);
            this.data.subjects[student.id] = sampleSubjects;
            this.saveData();
            
            // Generate sample grades
            sampleSubjects.forEach(subject => {
                studentGrades[subject] = Math.floor(Math.random() * 30) + 70; // Random grade 70-100
            });
            this.data.grades[student.id] = studentGrades;
            this.saveData();
        }
        
        const gradeCards = Object.entries(studentGrades).map(([subject, grade]) => {
            const gradeColor = grade >= 90 ? 'var(--success)' :
                             grade >= 80 ? 'var(--primary)' :
                             grade >= 75 ? 'var(--warning)' : 'var(--accent)';
            
            return `
                <div class="grade-card">
                    <div class="grade-header">
                        <div class="subject-name">${subject}</div>
                        <div class="grade-value" style="color: ${gradeColor};">${grade.toFixed(2)}</div>
                    </div>
                    <div class="grade-progress">
                        <div class="grade-progress-bar" style="width: ${Math.min(grade, 100)}%; background: ${gradeColor};"></div>
                    </div>
                    <div class="grade-details">
                        <span>${grade >= 75 ? 'PASSED' : 'FAILED'}</span>
                        <span>${this.getGradeEquivalent(grade)}</span>
                    </div>
                </div>
            `;
        }).join('');
        
        // Calculate statistics
        const grades = Object.values(studentGrades);
        const average = grades.length > 0 ? grades.reduce((a, b) => a + b, 0) / grades.length : 0;
        const passed = grades.filter(g => g >= 75).length;
        const failed = grades.filter(g => g < 75).length;
        
        container.innerHTML = `
            <div class="content-header">
                <h2>My Grades</h2>
                <div class="action-buttons">
                    <button class="btn btn-outline" onclick="portal.printGrades()">
                        <i class="fas fa-print"></i> Print Grades
                    </button>
                </div>
            </div>
            
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 20px; margin-bottom: 30px;">
                <div style="background: linear-gradient(135deg, var(--primary), #9b59b6); border-radius: 15px; padding: 25px; color: white;">
                    <h3 style="font-size: 32px; margin-bottom: 5px;">${average.toFixed(2)}</h3>
                    <p>General Average</p>
                </div>
                
                <div style="background: white; border-radius: 15px; padding: 25px; border: 2px solid var(--success);">
                    <h3 style="font-size: 32px; margin-bottom: 5px; color: var(--success);">${passed}</h3>
                    <p>Passed Subjects</p>
                </div>
                
                <div style="background: white; border-radius: 15px; padding: 25px; border: 2px solid var(--accent);">
                    <h3 style="font-size: 32px; margin-bottom: 5px; color: var(--accent);">${failed}</h3>
                    <p>Failed Subjects</p>
                </div>
                
                <div style="background: white; border-radius: 15px; padding: 25px; border: 2px solid var(--warning);">
                    <h3 style="font-size: 32px; margin-bottom: 5px; color: var(--warning);">${this.getGPA(average)}</h3>
                    <p>GPA</p>
                </div>
            </div>
            
            <div class="grades-grid">
                ${gradeCards}
            </div>
            
            <div style="margin-top: 40px; padding: 20px; background: #f8f9fa; border-radius: 10px;">
                <h4 style="color: var(--secondary); margin-bottom: 15px;">Grading Legend</h4>
                <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 10px;">
                    <div style="display: flex; align-items: center; gap: 10px;">
                        <div style="width: 20px; height: 20px; background: var(--success); border-radius: 4px;"></div>
                        <span>90-100: Excellent (1.00)</span>
                    </div>
                    <div style="display: flex; align-items: center; gap: 10px;">
                        <div style="width: 20px; height: 20px; background: var(--primary); border-radius: 4px;"></div>
                        <span>85-89: Very Good (1.25-1.75)</span>
                    </div>
                    <div style="display: flex; align-items: center; gap: 10px;">
                        <div style="width: 20px; height: 20px; background: var(--warning); border-radius: 4px;"></div>
                        <span>80-84: Good (2.00-2.25)</span>
                    </div>
                    <div style="display: flex; align-items: center; gap: 10px;">
                        <div style="width: 20px; height: 20px; background: #ff6b6b; border-radius: 4px;"></div>
                        <span>75-79: Satisfactory (2.50-2.75)</span>
                    </div>
                    <div style="display: flex; align-items: center; gap: 10px;">
                        <div style="width: 20px; height: 20px; background: var(--accent); border-radius: 4px;"></div>
                        <span>Below 75: Failed (5.00)</span>
                    </div>
                </div>
            </div>
        `;
    }

    getSampleSubjects(gradeLevel) {
        const subjects = {
            'Grade 7': ['English', 'Mathematics', 'Science', 'Filipino', 'Araling Panlipunan', 'MAPEH', 'TLE'],
            'Grade 8': ['English', 'Mathematics', 'Science', 'Filipino', 'Araling Panlipunan', 'MAPEH', 'TLE'],
            'Grade 9': ['English', 'Mathematics', 'Science', 'Filipino', 'Araling Panlipunan', 'MAPEH', 'TLE'],
            'Grade 10': ['English', 'Mathematics', 'Science', 'Filipino', 'Araling Panlipunan', 'MAPEH', 'TLE'],
            'Grade 11 - STEM': ['Oral Communication', 'General Mathematics', 'Earth Science', 'Pre-Calculus', 'Basic Calculus', 'General Biology'],
            'Grade 12 - STEM': ['21st Century Literature', 'Statistics & Probability', 'Physics', 'Chemistry', 'Research Project', 'Work Immersion'],
            '1st Year - BS Computer Science': ['Introduction to Computing', 'Computer Programming 1', 'Discrete Mathematics', 'Purposive Communication']
        };
        
        return subjects[gradeLevel] || ['Subject 1', 'Subject 2', 'Subject 3', 'Subject 4'];
    }

    getGradeEquivalent(grade) {
        if (grade >= 97) return '1.00';
        if (grade >= 94) return '1.25';
        if (grade >= 91) return '1.50';
        if (grade >= 88) return '1.75';
        if (grade >= 85) return '2.00';
        if (grade >= 82) return '2.25';
        if (grade >= 79) return '2.50';
        if (grade >= 76) return '2.75';
        if (grade >= 75) return '3.00';
        return '5.00';
    }

    getGPA(average) {
        if (average >= 90) return '1.00';
        if (average >= 85) return '1.5';
        if (average >= 80) return '2.0';
        if (average >= 75) return '2.5';
        return '3.0';
    }

    printGrades() {
        const student = this.currentUser;
        const studentGrades = this.data.grades[student.id] || {};
        
        let report = `Grades Report - ${student.name}\n`;
        report += `Grade Level: ${student.gradeLevel}\n`;
        report += `Generated: ${new Date().toLocaleString()}\n\n`;
        report += 'Subject,Grade,Equivalent,Status\n';
        
        Object.entries(studentGrades).forEach(([subject, grade]) => {
            report += `${subject},${grade.toFixed(2)},${this.getGradeEquivalent(grade)},`;
            report += `${grade >= 75 ? 'PASSED' : 'FAILED'}\n`;
        });
        
        // Calculate average
        const grades = Object.values(studentGrades);
        if (grades.length > 0) {
            const average = grades.reduce((a, b) => a + b, 0) / grades.length;
            report += `\nGeneral Average: ${average.toFixed(2)}\n`;
            report += `GPA: ${this.getGPA(average)}\n`;
            report += `Status: ${average >= 75 ? 'PASSING' : 'FAILING'}`;
        }
        
        // Download as text file
        const blob = new Blob([report], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `grades_${student.name}_${new Date().toISOString().split('T')[0]}.txt`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        this.showNotification('Grades report downloaded', 'success');
    }

    loadSubjectsSection(container) {
        const student = this.currentUser;
        
        if (!student.gradeLevel) {
            container.innerHTML = `
                <div class="content-header">
                    <h2>My Subjects</h2>
                </div>
                
                <div style="text-align: center; padding: 60px 20px;">
                    <i class="fas fa-book" style="font-size: 64px; color: #ddd; margin-bottom: 20px;"></i>
                    <h3 style="color: var(--secondary); margin-bottom: 10px;">No Subjects Enrolled</h3>
                    <p style="color: #666;">Subjects will appear here once you are enrolled.</p>
                </div>
            `;
            return;
        }
        
        const subjects = this.data.subjects[student.id] || this.getSampleSubjects(student.gradeLevel);
        
        container.innerHTML = `
            <div class="content-header">
                <h2>My Subjects</h2>
                <div class="action-buttons">
                    <button class="btn btn-outline" onclick="portal.downloadClassSchedule()">
                        <i class="fas fa-download"></i> Download Schedule
                    </button>
                </div>
            </div>
            
            <div style="margin-bottom: 30px;">
                <h3 style="color: var(--secondary); margin-bottom: 20px;">${student.gradeLevel}</h3>
                <p style="color: #666;">Academic Year: ${new Date().getFullYear()}-${new Date().getFullYear() + 1}</p>
            </div>
            
            <div class="grades-grid">
                ${subjects.map(subject => `
                    <div class="grade-card">
                        <div class="grade-header">
                            <div class="subject-name">${subject}</div>
                            <div class="grade-value">
                                <i class="fas fa-book-open"></i>
                            </div>
                        </div>
                        <div style="margin: 15px 0;">
                            <div style="display: flex; justify-content: space-between; margin-bottom: 5px;">
                                <small>Schedule:</small>
                                <small>MWF 8:00-9:00 AM</small>
                            </div>
                            <div style="display: flex; justify-content: space-between; margin-bottom: 5px;">
                                <small>Room:</small>
                                <small>Room ${Math.floor(Math.random() * 20) + 100}</small>
                            </div>
                            <div style="display: flex; justify-content: space-between;">
                                <small>Units:</small>
                                <small>3.0</small>
                            </div>
                        </div>
                        <div class="grade-details">
                            <span>Teacher</span>
                            <span>Prof. ${['Smith', 'Johnson', 'Williams', 'Brown', 'Jones'][Math.floor(Math.random() * 5)]}</span>
                        </div>
                    </div>
                `).join('')}
            </div>
            
            <div style="margin-top: 40px; padding: 20px; background: #f8f9fa; border-radius: 10px;">
                <h4 style="color: var(--secondary); margin-bottom: 15px;">Class Schedule</h4>
                <div class="table-container">
                    <table style="width: 100%; border-collapse: collapse;">
                        <thead>
                            <tr style="background: var(--primary); color: white;">
                                <th style="padding: 12px; text-align: left;">Time</th>
                                <th style="padding: 12px; text-align: left;">Monday</th>
                                <th style="padding: 12px; text-align: left;">Tuesday</th>
                                <th style="padding: 12px; text-align: left;">Wednesday</th>
                                <th style="padding: 12px; text-align: left;">Thursday</th>
                                <th style="padding: 12px; text-align: left;">Friday</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${this.generateScheduleRows(subjects)}
                        </tbody>
                    </table>
                </div>
            </div>
        `;
    }

    generateScheduleRows(subjects) {
        const timeSlots = [
            '7:00-8:00', '8:00-9:00', '9:00-10:00', '10:00-11:00',
            '11:00-12:00', '1:00-2:00', '2:00-3:00', '3:00-4:00'
        ];
        
        return timeSlots.map((time, index) => {
            const getSubject = (dayIndex) => {
                if (index < subjects.length) {
                    return subjects[index];
                }
                return '';
            };
            
            return `
                <tr style="${index % 2 === 0 ? 'background: white;' : 'background: #f8f9fa;'}">
                    <td style="padding: 12px; border: 1px solid #eee;">${time}</td>
                    <td style="padding: 12px; border: 1px solid #eee;">${getSubject(0)}</td>
                    <td style="padding: 12px; border: 1px solid #eee;">${getSubject(1)}</td>
                    <td style="padding: 12px; border: 1px solid #eee;">${getSubject(2)}</td>
                    <td style="padding: 12px; border: 1px solid #eee;">${getSubject(3)}</td>
                    <td style="padding: 12px; border: 1px solid #eee;">${getSubject(4)}</td>
                </tr>
            `;
        }).join('');
    }

    downloadClassSchedule() {
        const student = this.currentUser;
        const subjects = this.data.subjects[student.id] || [];
        
        let schedule = `Class Schedule - ${student.name}\n`;
        schedule += `Grade Level: ${student.gradeLevel}\n`;
        schedule += `Academic Year: ${new Date().getFullYear()}-${new Date().getFullYear() + 1}\n\n`;
        schedule += 'Subject,Schedule,Room,Teacher,Units\n';
        
        subjects.forEach((subject, index) => {
            const days = ['MWF', 'TTH'][index % 2];
            const time = `${8 + (index % 4)}:00-${9 + (index % 4)}:00`;
            const room = `Room ${100 + index}`;
            const teacher = `Prof. ${['Smith', 'Johnson', 'Williams', 'Brown', 'Jones'][index % 5]}`;
            
            schedule += `${subject},${days} ${time},${room},${teacher},3.0\n`;
        });
        
        const blob = new Blob([schedule], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `schedule_${student.name}.txt`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        this.showNotification('Class schedule downloaded', 'success');
    }

    loadProfileSection(container) {
        const student = this.currentUser;
        const enrollment = this.data.enrollments.find(e => e.studentEmail === student.email);
        
        container.innerHTML = `
            <div class="content-header">
                <h2>My Profile</h2>
                <div class="action-buttons">
                    <button class="btn btn-outline" onclick="portal.editProfile()">
                        <i class="fas fa-edit"></i> Edit Profile
                    </button>
                </div>
            </div>
            
            <div style="max-width: 600px;">
                <div style="display: flex; gap: 30px; margin-bottom: 40px; align-items: center;">
                    <div class="avatar" style="width: 100px; height: 100px; font-size: 36px;">
                        ${student.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                    </div>
                    <div>
                        <h3 style="color: var(--secondary); margin-bottom: 5px;">${student.name}</h3>
                        <p style="color: var(--primary); margin-bottom: 10px;">${student.gradeLevel || 'Not enrolled'}</p>
                        <p style="color: #666;">${student.email}</p>
                    </div>
                </div>
                
                <div class="form-section">
                    <h3 class="section-title"><i class="fas fa-info-circle"></i> Personal Information</h3>
                    <div class="form-row">
                        <div class="form-group">
                            <label class="form-label">Full Name</label>
                            <p style="padding: 10px; background: #f8f9fa; border-radius: 5px;">${student.name}</p>
                        </div>
                        <div class="form-group">
                            <label class="form-label">Email Address</label>
                            <p style="padding: 10px; background: #f8f9fa; border-radius: 5px;">${student.email}</p>
                        </div>
                    </div>
                    
                    ${enrollment ? `
                        <div class="form-row">
                            <div class="form-group">
                                <label class="form-label">Phone Number</label>
                                <p style="padding: 10px; background: #f8f9fa; border-radius: 5px;">${enrollment.phone || 'Not provided'}</p>
                            </div>
                            <div class="form-group">
                                <label class="form-label">Birth Date</label>
                                <p style="padding: 10px; background: #f8f9fa; border-radius: 5px;">${enrollment.birthDate || 'Not provided'}</p>
                            </div>
                        </div>
                        
                        <div class="form-group">
                            <label class="form-label">Address</label>
                            <p style="padding: 10px; background: #f8f9fa; border-radius: 5px;">${enrollment.address || 'Not provided'}</p>
                        </div>
                    ` : ''}
                </div>
                
                ${enrollment ? `
                    <div class="form-section">
                        <h3 class="section-title"><i class="fas fa-graduation-cap"></i> Academic Information</h3>
                        <div class="form-row">
                            <div class="form-group">
                                <label class="form-label">Grade Level</label>
                                <p style="padding: 10px; background: #f8f9fa; border-radius: 5px;">${enrollment.gradeLevel}</p>
                            </div>
                            <div class="form-group">
                                <label class="form-label">Previous School</label>
                                <p style="padding: 10px; background: #f8f9fa; border-radius: 5px;">${enrollment.previousSchool || 'Not provided'}</p>
                            </div>
                        </div>
                        
                        <div class="form-group">
                            <label class="form-label">Enrollment Status</label>
                            <p style="padding: 10px; background: #f8f9fa; border-radius: 5px;">
                                <span class="status-badge status-${enrollment.status}">
                                    ${enrollment.status.toUpperCase()}
                                </span>
                            </p>
                        </div>
                    </div>
                ` : ''}
                
                <div class="form-section">
                    <h3 class="section-title"><i class="fas fa-lock"></i> Account Security</h3>
                    <button class="btn btn-outline" onclick="portal.changePassword()">
                        <i class="fas fa-key"></i> Change Password
                    </button>
                </div>
            </div>
        `;
    }

    editProfile() {
        this.showNotification('Profile editing feature coming soon', 'info');
    }

    changePassword() {
        this.showNotification('Password change feature coming soon', 'info');
    }

    // Dialog System
    showDialog(title, content) {
        const overlay = document.createElement('div');
        overlay.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(0, 0, 0, 0.7);
            backdrop-filter: blur(5px);
            display: flex;
            justify-content: center;
            align-items: center;
            z-index: 1000;
        `;
        
        const dialog = document.createElement('div');
        dialog.style.cssText = `
            background: white;
            border-radius: 15px;
            width: 90%;
            max-width: 500px;
            max-height: 90vh;
            overflow-y: auto;
            animation: slideIn 0.3s ease;
        `;
        
        dialog.innerHTML = `
            <div style="padding: 30px;">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
                    <h3 style="color: var(--secondary); margin: 0;">${title}</h3>
                    <button onclick="this.closest('[style*=\"position: fixed\"]').remove()" 
                            style="background: none; border: none; font-size: 24px; cursor: pointer; color: #666;">
                        &times;
                    </button>
                </div>
                <div>${content}</div>
            </div>
        `;
        
        overlay.appendChild(dialog);
        document.body.appendChild(overlay);
        
        // Close on overlay click
        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) {
                overlay.remove();
            }
        });
    }

    hideDialog() {
        const overlay = document.querySelector('[style*="position: fixed"]');
        if (overlay) {
            overlay.remove();
        }
    }

    // Notification System
    showNotification(message, type = 'info', duration = 5000) {
        const notification = document.createElement('div');
        notification.className = 'notification ' + type;
        
        const icons = {
            success: 'fas fa-check-circle',
            error: 'fas fa-exclamation-circle',
            warning: 'fas fa-exclamation-triangle',
            info: 'fas fa-info-circle'
        };
        
        notification.innerHTML = `
            <div style="flex: 1;">${message}</div>
            <button class="notification-close">&times;</button>
        `;
        
        notification.querySelector('.notification-close').onclick = () => {
            notification.remove();
        };
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            if (notification.parentNode) {
                notification.style.transform = 'translateX(400px)';
                setTimeout(() => notification.remove(), 300);
            }
        }, duration);
        
        // Show browser notification if enabled
        if ('Notification' in window && Notification.permission === 'granted') {
            new Notification('School Portal', {
                body: message,
                icon: '/favicon.ico'
            });
        }
    }

    previewFile(inputId) {
        const input = document.getElementById(inputId);
        if (input.files && input.files[0]) {
            const file = input.files[0];
            this.showNotification(`Selected: ${file.name} (${(file.size / 1024 / 1024).toFixed(2)} MB)`, 'info');
        }
    }
}

// Initialize the portal
const portal = new SchoolPortal();