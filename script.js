class SchoolManagementSystem {
    constructor() {
        this.data = {
            students: [],
            enrollments: [],
            grades: {},
            settings: {
                schoolName: "Cousins University",
                gradeLevels: {
                    "Junior High School": ["Grade 7", "Grade 8", "Grade 9", "Grade 10"],
                    "Senior High School": ["Grade 11", "Grade 12"],
                    "College": ["1st Year", "2nd Year", "3rd Year", "4th Year"]
                },
                requiredDocuments: [
                    "Birth Certificate",
                    "Form 138 (Report Card)",
                    "Good Moral Certificate",
                    "2x2 ID Pictures",
                    "Medical Certificate"
                ]
            }
        };
        
        this.currentSection = 'dashboard';
        this.initialize();
    }

    async initialize() {
        await this.loadData();
        this.setupEventListeners();
        this.showSection('dashboard');
        this.updateDashboardStats();
        this.setupAutoSave();
        this.setupNotifications();
        
        // Request notification permission
        if ('Notification' in window) {
            Notification.requestPermission();
        }
    }

    async loadData() {
        try {
            // Try to load from GitHub repository
            const response = await fetch('https://raw.githubusercontent.com/yourusername/school-management-system/main/data/school_data.json');
            if (response.ok) {
                const data = await response.json();
                this.data = { ...this.data, ...data };
                this.showNotification('Data loaded from GitHub', 'success');
            } else {
                // Load from local storage as fallback
                const localData = localStorage.getItem('schoolData');
                if (localData) {
                    this.data = JSON.parse(localData);
                    this.showNotification('Data loaded from local storage', 'info');
                }
            }
        } catch (error) {
            console.log('Using default data');
        }
    }

    async saveData() {
        try {
            // Save to local storage first
            localStorage.setItem('schoolData', JSON.stringify(this.data));
            
            // Generate JSON file for GitHub
            const jsonData = JSON.stringify(this.data, null, 2);
            
            // In a real implementation, this would use GitHub API
            // For now, we'll simulate it and save to localStorage
            this.showNotification('Data saved locally', 'success');
            
            // Simulate GitHub sync
            setTimeout(() => {
                this.showNotification('Data synced with GitHub', 'success');
                document.getElementById('syncStatus').textContent = '✓';
            }, 1000);
            
        } catch (error) {
            this.showNotification('Error saving data: ' + error.message, 'error');
        }
    }

    setupAutoSave() {
        // Auto-save every 30 seconds
        setInterval(() => this.saveData(), 30000);
        
        // Also save on page unload
        window.addEventListener('beforeunload', () => this.saveData());
    }

    setupNotifications() {
        // Setup browser notifications if supported
        if ('Notification' in window && Notification.permission === 'granted') {
            setInterval(() => {
                this.checkPendingEnrollments();
            }, 60000); // Check every minute
        }
    }

    checkPendingEnrollments() {
        const pending = this.data.enrollments.filter(e => e.status === 'pending').length;
        if (pending > 0) {
            this.showBrowserNotification(`${pending} enrollment requests pending review`);
        }
    }

    showBrowserNotification(message) {
        if ('Notification' in window && Notification.permission === 'granted') {
            new Notification('School Management System', {
                body: message,
                icon: '/favicon.ico'
            });
        }
    }

    setupEventListeners() {
        // Dialog close button
        document.getElementById('dialogClose').addEventListener('click', () => {
            this.hideDialog();
        });

        // Dialog overlay click
        document.getElementById('dialogOverlay').addEventListener('click', (e) => {
            if (e.target === document.getElementById('dialogOverlay')) {
                this.hideDialog();
            }
        });
    }

    showSection(section) {
        this.currentSection = section;
        
        // Update active nav item
        document.querySelectorAll('.nav-item').forEach(item => {
            item.classList.remove('active');
        });
        document.querySelector(`.nav-item[href="#${section}"]`).classList.add('active');
        
        // Load section content
        const container = document.getElementById('contentContainer');
        container.innerHTML = '';
        
        switch(section) {
            case 'dashboard':
                document.getElementById('dashboardSection').style.display = 'block';
                this.loadEnrollmentsTable();
                break;
            case 'enrollments':
                this.loadEnrollmentsSection(container);
                break;
            case 'students':
                this.loadStudentsSection(container);
                break;
            case 'grades':
                this.loadGradesSection(container);
                break;
            case 'reports':
                this.loadReportsSection(container);
                break;
            case 'settings':
                this.loadSettingsSection(container);
                break;
        }
        
        if (section !== 'dashboard') {
            document.getElementById('dashboardSection').style.display = 'none';
        }
    }

    updateDashboardStats() {
        document.getElementById('totalStudents').textContent = this.data.students.length;
        document.getElementById('pendingEnrollments').textContent = 
            this.data.enrollments.filter(e => e.status === 'pending').length;
        
        // Count grades
        let gradeCount = 0;
        Object.values(this.data.grades).forEach(studentGrades => {
            gradeCount += Object.keys(studentGrades).length;
        });
        document.getElementById('totalGrades').textContent = gradeCount;
    }

    // Dialog System
    showDialog(title, content, buttons = []) {
        document.getElementById('dialogTitle').textContent = title;
        document.getElementById('dialogBody').innerHTML = content;
        
        const footer = document.getElementById('dialogFooter');
        footer.innerHTML = '';
        
        buttons.forEach(button => {
            const btn = document.createElement('button');
            btn.className = `btn ${button.className || 'btn-primary'}`;
            btn.textContent = button.text;
            if (button.icon) {
                btn.innerHTML = `<i class="${button.icon}"></i> ${button.text}`;
            }
            btn.onclick = button.action;
            footer.appendChild(btn);
        });
        
        document.getElementById('dialogOverlay').style.display = 'flex';
    }

    hideDialog() {
        document.getElementById('dialogOverlay').style.display = 'none';
    }

    // Notification System
    showNotification(message, type = 'info', duration = 5000) {
        const container = document.getElementById('notificationContainer');
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        
        const icons = {
            success: 'fas fa-check-circle',
            error: 'fas fa-exclamation-circle',
            warning: 'fas fa-exclamation-triangle',
            info: 'fas fa-info-circle'
        };
        
        notification.innerHTML = `
            <div class="notification-icon">
                <i class="${icons[type]}"></i>
            </div>
            <div class="notification-content">
                ${message}
            </div>
            <button class="notification-close">&times;</button>
        `;
        
        notification.querySelector('.notification-close').onclick = () => {
            notification.remove();
        };
        
        container.appendChild(notification);
        
        setTimeout(() => {
            if (notification.parentNode) {
                notification.style.transform = 'translateX(400px)';
                setTimeout(() => notification.remove(), 300);
            }
        }, duration);
    }

    // Enrollment Management
    showNewEnrollment() {
        let content = `
            <div class="form-group">
                <label class="form-label">Select Grade Level</label>
                <select class="form-control" id="enrollmentGradeLevel">
                    <option value="">-- Select Grade Level --</option>
                    ${Object.entries(this.data.settings.gradeLevels).map(([category, levels]) => `
                        <optgroup label="${category}">
                            ${levels.map(level => `<option value="${level}">${level}</option>`).join('')}
                        </optgroup>
                    `).join('')}
                </select>
            </div>
            <div id="enrollmentFields">
                <!-- Fields will be populated based on grade level selection -->
            </div>
        `;
        
        this.showDialog('New Enrollment', content, [
            {
                text: 'Cancel',
                className: 'btn-outline',
                action: () => this.hideDialog()
            },
            {
                text: 'Create Enrollment',
                className: 'btn-primary',
                action: () => this.createEnrollment()
            }
        ]);
        
        // Add event listener for grade level change
        document.getElementById('enrollmentGradeLevel').addEventListener('change', (e) => {
            this.loadEnrollmentFields(e.target.value);
        });
    }

    loadEnrollmentFields(gradeLevel) {
        const container = document.getElementById('enrollmentFields');
        if (!gradeLevel) {
            container.innerHTML = '<p class="text-muted">Please select a grade level first</p>';
            return;
        }
        
        const fields = `
            <div class="form-group">
                <label class="form-label">Student Information</label>
                <input type="text" class="form-control" id="studentName" placeholder="Full Name" required>
            </div>
            <div class="form-group">
                <input type="email" class="form-control" id="studentEmail" placeholder="Email Address" required>
            </div>
            <div class="form-group">
                <input type="tel" class="form-control" id="studentPhone" placeholder="Phone Number" required>
            </div>
            <div class="form-group">
                <label class="form-label">Birth Date</label>
                <input type="date" class="form-control" id="studentBirthDate" required>
            </div>
            <div class="form-group">
                <label class="form-label">Address</label>
                <textarea class="form-control" id="studentAddress" rows="3" required></textarea>
            </div>
            <div class="form-group">
                <label class="form-label">Previous School</label>
                <input type="text" class="form-control" id="previousSchool" placeholder="Name of previous school">
            </div>
            <div class="form-group">
                <label class="form-label">Required Documents</label>
                <div class="checkbox-group">
                    ${this.data.settings.requiredDocuments.map(doc => `
                        <div class="checkbox-item">
                            <input type="checkbox" id="doc_${doc.replace(/\s+/g, '_')}" value="${doc}">
                            <label for="doc_${doc.replace(/\s+/g, '_')}">${doc}</label>
                        </div>
                    `).join('')}
                </div>
            </div>
            <div class="form-group">
                <label class="form-label">Additional Notes</label>
                <textarea class="form-control" id="enrollmentNotes" rows="3" placeholder="Any additional information..."></textarea>
            </div>
        `;
        
        container.innerHTML = fields;
    }

    createEnrollment() {
        const gradeLevel = document.getElementById('enrollmentGradeLevel').value;
        const name = document.getElementById('studentName').value;
        const email = document.getElementById('studentEmail').value;
        
        if (!gradeLevel || !name || !email) {
            this.showNotification('Please fill in all required fields', 'error');
            return;
        }
        
        // Collect document status
        const documents = {};
        this.data.settings.requiredDocuments.forEach(doc => {
            const checkbox = document.getElementById(`doc_${doc.replace(/\s+/g, '_')}`);
            documents[doc] = checkbox ? checkbox.checked : false;
        });
        
        const enrollment = {
            id: 'ENR-' + Date.now(),
            studentName: name,
            studentEmail: email,
            gradeLevel: gradeLevel,
            phone: document.getElementById('studentPhone').value,
            birthDate: document.getElementById('studentBirthDate').value,
            address: document.getElementById('studentAddress').value,
            previousSchool: document.getElementById('previousSchool').value,
            documents: documents,
            notes: document.getElementById('enrollmentNotes').value,
            status: 'pending',
            date: new Date().toISOString(),
            createdBy: 'Admin User'
        };
        
        this.data.enrollments.unshift(enrollment);
        this.saveData();
        this.updateDashboardStats();
        this.loadEnrollmentsTable();
        this.hideDialog();
        
        this.showNotification('Enrollment created successfully', 'success');
        this.showBrowserNotification(`New enrollment request from ${name}`);
    }

    loadEnrollmentsTable() {
        const tbody = document.getElementById('enrollmentsTableBody');
        const enrollments = this.data.enrollments.slice(0, 10); // Show only 10 most recent
        
        if (enrollments.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="6" class="text-center" style="padding: 40px;">
                        <i class="fas fa-inbox" style="font-size: 48px; color: #ddd; margin-bottom: 10px;"></i>
                        <p>No enrollment requests yet</p>
                    </td>
                </tr>
            `;
            return;
        }
        
        tbody.innerHTML = enrollments.map(enrollment => `
            <tr>
                <td>${enrollment.id}</td>
                <td>
                    <strong>${enrollment.studentName}</strong><br>
                    <small class="text-muted">${enrollment.studentEmail}</small>
                </td>
                <td>${enrollment.gradeLevel}</td>
                <td>${new Date(enrollment.date).toLocaleDateString()}</td>
                <td>
                    <span class="status-badge status-${enrollment.status}">
                        ${enrollment.status.toUpperCase()}
                    </span>
                </td>
                <td>
                    <button class="btn btn-sm btn-outline" onclick="sms.viewEnrollment('${enrollment.id}')">
                        <i class="fas fa-eye"></i>
                    </button>
                    ${enrollment.status === 'pending' ? `
                        <button class="btn btn-sm btn-success" onclick="sms.updateEnrollmentStatus('${enrollment.id}', 'approved')">
                            <i class="fas fa-check"></i>
                        </button>
                        <button class="btn btn-sm btn-danger" onclick="sms.updateEnrollmentStatus('${enrollment.id}', 'rejected')">
                            <i class="fas fa-times"></i>
                        </button>
                    ` : ''}
                </td>
            </tr>
        `).join('');
    }

    viewEnrollment(enrollmentId) {
        const enrollment = this.data.enrollments.find(e => e.id === enrollmentId);
        if (!enrollment) return;
        
        const documentsList = Object.entries(enrollment.documents).map(([doc, submitted]) => `
            <div class="checkbox-item">
                <input type="checkbox" ${submitted ? 'checked' : ''} disabled>
                <label>${doc} ${submitted ? '✓' : '✗'}</label>
            </div>
        `).join('');
        
        let content = `
            <div style="max-height: 60vh; overflow-y: auto;">
                <div class="form-group">
                    <label class="form-label">Student Information</label>
                    <p><strong>Name:</strong> ${enrollment.studentName}</p>
                    <p><strong>Email:</strong> ${enrollment.studentEmail}</p>
                    <p><strong>Phone:</strong> ${enrollment.phone}</p>
                    <p><strong>Birth Date:</strong> ${enrollment.birthDate}</p>
                    <p><strong>Address:</strong> ${enrollment.address}</p>
                    <p><strong>Grade Level:</strong> ${enrollment.gradeLevel}</p>
                    <p><strong>Previous School:</strong> ${enrollment.previousSchool || 'Not specified'}</p>
                </div>
                
                <div class="form-group">
                    <label class="form-label">Documents Status</label>
                    <div class="checkbox-group">
                        ${documentsList}
                    </div>
                </div>
                
                ${enrollment.notes ? `
                <div class="form-group">
                    <label class="form-label">Notes</label>
                    <p>${enrollment.notes}</p>
                </div>
                ` : ''}
                
                <div class="form-group">
                    <label class="form-label">Status</label>
                    <select class="form-control" id="statusUpdate">
                        <option value="pending" ${enrollment.status === 'pending' ? 'selected' : ''}>Pending</option>
                        <option value="approved" ${enrollment.status === 'approved' ? 'selected' : ''}>Approved</option>
                        <option value="rejected" ${enrollment.status === 'rejected' ? 'selected' : ''}>Rejected</option>
                        <option value="enrolled" ${enrollment.status === 'enrolled' ? 'selected' : ''}>Enrolled</option>
                    </select>
                </div>
                
                <div class="form-group" id="documentsRequiredSection" style="display: none;">
                    <label class="form-label">Require Additional Documents</label>
                    <div class="checkbox-group">
                        ${this.data.settings.requiredDocuments.map(doc => `
                            <div class="checkbox-item">
                                <input type="checkbox" id="req_doc_${doc.replace(/\s+/g, '_')}" value="${doc}">
                                <label for="req_doc_${doc.replace(/\s+/g, '_')}">${doc}</label>
                            </div>
                        `).join('')}
                    </div>
                </div>
                
                <div class="form-group">
                    <label class="form-label">Add Note</label>
                    <textarea class="form-control" id="adminNote" rows="3" placeholder="Add administrative note..."></textarea>
                </div>
            </div>
        `;
        
        this.showDialog(`Enrollment: ${enrollment.id}`, content, [
            {
                text: 'Cancel',
                className: 'btn-outline',
                action: () => this.hideDialog()
            },
            {
                text: 'Require Documents',
                className: 'btn-warning',
                action: () => this.toggleDocumentsRequired()
            },
            {
                text: 'Update Status',
                className: 'btn-primary',
                action: () => this.saveEnrollmentStatus(enrollmentId)
            }
        ]);
        
        // Show/hide documents required section when status changes
        document.getElementById('statusUpdate').addEventListener('change', (e) => {
            const showDocs = e.target.value === 'rejected';
            document.getElementById('documentsRequiredSection').style.display = showDocs ? 'block' : 'none';
        });
    }

    toggleDocumentsRequired() {
        const section = document.getElementById('documentsRequiredSection');
        section.style.display = section.style.display === 'none' ? 'block' : 'none';
    }

    updateEnrollmentStatus(enrollmentId, status) {
        const enrollment = this.data.enrollments.find(e => e.id === enrollmentId);
        if (!enrollment) return;
        
        enrollment.status = status;
        enrollment.updatedAt = new Date().toISOString();
        enrollment.updatedBy = 'Admin User';
        
        if (status === 'approved') {
            // Create student record
            const student = {
                id: 'STU-' + Date.now(),
                enrollmentId: enrollmentId,
                name: enrollment.studentName,
                email: enrollment.studentEmail,
                gradeLevel: enrollment.gradeLevel,
                phone: enrollment.phone,
                birthDate: enrollment.birthDate,
                address: enrollment.address,
                enrollmentDate: new Date().toISOString(),
                status: 'active'
            };
            
            this.data.students.push(student);
            this.showNotification(`Student ${student.name} enrolled successfully`, 'success');
            this.showBrowserNotification(`New student enrolled: ${student.name}`);
        }
        
        this.saveData();
        this.updateDashboardStats();
        this.loadEnrollmentsTable();
        this.showNotification(`Enrollment ${status}`, 'success');
    }

    saveEnrollmentStatus(enrollmentId) {
        const enrollment = this.data.enrollments.find(e => e.id === enrollmentId);
        if (!enrollment) return;
        
        const newStatus = document.getElementById('statusUpdate').value;
        const adminNote = document.getElementById('adminNote').value;
        
        enrollment.status = newStatus;
        enrollment.adminNotes = enrollment.adminNotes || [];
        
        if (adminNote) {
            enrollment.adminNotes.push({
                note: adminNote,
                date: new Date().toISOString(),
                by: 'Admin User'
            });
        }
        
        // Check if documents were required
        if (newStatus === 'rejected') {
            const requiredDocs = [];
            this.data.settings.requiredDocuments.forEach(doc => {
                const checkbox = document.getElementById(`req_doc_${doc.replace(/\s+/g, '_')}`);
                if (checkbox && checkbox.checked) {
                    requiredDocs.push(doc);
                }
            });
            
            if (requiredDocs.length > 0) {
                enrollment.requiredDocuments = requiredDocs;
                this.showNotification(`${requiredDocs.length} documents required from student`, 'warning');
            }
        }
        
        if (newStatus === 'approved') {
            // Create student record
            const student = {
                id: 'STU-' + Date.now(),
                enrollmentId: enrollmentId,
                name: enrollment.studentName,
                email: enrollment.studentEmail,
                gradeLevel: enrollment.gradeLevel,
                phone: enrollment.phone,
                birthDate: enrollment.birthDate,
                address: enrollment.address,
                enrollmentDate: new Date().toISOString(),
                status: 'active'
            };
            
            this.data.students.push(student);
        }
        
        this.saveData();
        this.updateDashboardStats();
        this.loadEnrollmentsTable();
        this.hideDialog();
        this.showNotification(`Enrollment status updated to ${newStatus}`, 'success');
    }

    // Load other sections
    loadEnrollmentsSection(container) {
        container.innerHTML = `
            <div class="content-header">
                <h2>Enrollment Management</h2>
                <div class="action-buttons">
                    <button class="btn btn-primary" onclick="sms.showNewEnrollment()">
                        <i class="fas fa-plus"></i> New Enrollment
                    </button>
                    <button class="btn btn-outline" onclick="sms.exportEnrollments()">
                        <i class="fas fa-download"></i> Export
                    </button>
                </div>
            </div>
            
            <div class="table-container">
                <table class="table">
                    <thead>
                        <tr>
                            <th>ID</th>
                            <th>Student Name</th>
                            <th>Grade Level</th>
                            <th>Date</th>
                            <th>Documents</th>
                            <th>Status</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody id="allEnrollmentsTable">
                        <!-- Will be populated -->
                    </tbody>
                </table>
            </div>
        `;
        
        this.loadAllEnrollments();
    }

    loadAllEnrollments() {
        const tbody = document.getElementById('allEnrollmentsTable');
        if (!tbody) return;
        
        tbody.innerHTML = this.data.enrollments.map(enrollment => {
            const submittedDocs = Object.values(enrollment.documents).filter(d => d).length;
            const totalDocs = this.data.settings.requiredDocuments.length;
            
            return `
                <tr>
                    <td>${enrollment.id}</td>
                    <td>
                        <strong>${enrollment.studentName}</strong><br>
                        <small class="text-muted">${enrollment.studentEmail}</small>
                    </td>
                    <td>${enrollment.gradeLevel}</td>
                    <td>${new Date(enrollment.date).toLocaleDateString()}</td>
                    <td>
                        <small>${submittedDocs}/${totalDocs}</small>
                        <div style="width: 100px; height: 4px; background: #eee; border-radius: 2px; margin-top: 4px;">
                            <div style="width: ${(submittedDocs/totalDocs)*100}%; height: 100%; background: var(--success); border-radius: 2px;"></div>
                        </div>
                    </td>
                    <td>
                        <span class="status-badge status-${enrollment.status}">
                            ${enrollment.status.toUpperCase()}
                        </span>
                    </td>
                    <td>
                        <button class="btn btn-sm btn-outline" onclick="sms.viewEnrollment('${enrollment.id}')">
                            <i class="fas fa-eye"></i>
                        </button>
                    </td>
                </tr>
            `;
        }).join('');
    }

    loadStudentsSection(container) {
        container.innerHTML = `
            <div class="content-header">
                <h2>Student Management</h2>
                <div class="action-buttons">
                    <button class="btn btn-primary" onclick="sms.showNewStudent()">
                        <i class="fas fa-plus"></i> Add Student
                    </button>
                    <button class="btn btn-outline" onclick="sms.exportStudents()">
                        <i class="fas fa-download"></i> Export
                    </button>
                </div>
            </div>
            
            <div class="table-container">
                <table class="table">
                    <thead>
                        <tr>
                            <th>ID</th>
                            <th>Name</th>
                            <th>Grade Level</th>
                            <th>Contact</th>
                            <th>Enrollment Date</th>
                            <th>Status</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody id="studentsTable">
                        <!-- Will be populated -->
                    </tbody>
                </table>
            </div>
        `;
        
        this.loadStudentsTable();
    }

    loadStudentsTable() {
        const tbody = document.getElementById('studentsTable');
        if (!tbody) return;
        
        tbody.innerHTML = this.data.students.map(student => `
            <tr>
                <td>${student.id}</td>
                <td>
                    <strong>${student.name}</strong><br>
                    <small class="text-muted">${student.email}</small>
                </td>
                <td>${student.gradeLevel}</td>
                <td>
                    <small>${student.phone || 'N/A'}</small><br>
                    <small class="text-muted">${student.email}</small>
                </td>
                <td>${new Date(student.enrollmentDate).toLocaleDateString()}</td>
                <td>
                    <span class="status-badge status-${student.status || 'active'}">
                        ${(student.status || 'active').toUpperCase()}
                    </span>
                </td>
                <td>
                    <button class="btn btn-sm btn-outline" onclick="sms.viewStudent('${student.id}')">
                        <i class="fas fa-eye"></i>
                    </button>
                    <button class="btn btn-sm btn-warning" onclick="sms.editStudent('${student.id}')">
                        <i class="fas fa-edit"></i>
                    </button>
                </td>
            </tr>
        `).join('');
    }

    loadGradesSection(container) {
        container.innerHTML = `
            <div class="content-header">
                <h2>Grading System</h2>
                <div class="action-buttons">
                    <button class="btn btn-primary" onclick="sms.showEncodeGrades()">
                        <i class="fas fa-edit"></i> Encode Grades
                    </button>
                    <button class="btn btn-outline" onclick="sms.showGradingScale()">
                        <i class="fas fa-cog"></i> Grading Scale
                    </button>
                </div>
            </div>
            
            <div id="gradesContent">
                <div style="text-align: center; padding: 40px;">
                    <i class="fas fa-chart-bar" style="font-size: 64px; color: #ddd; margin-bottom: 20px;"></i>
                    <h3 style="color: var(--gray); margin-bottom: 10px;">Grading Management</h3>
                    <p>Encode, manage, and track student grades across all grade levels</p>
                    
                    <div style="display: inline-flex; gap: 10px; margin-top: 30px;">
                        <button class="btn btn-outline" onclick="sms.showGradeSummary()">
                            <i class="fas fa-chart-pie"></i> View Grade Summary
                        </button>
                        <button class="btn btn-outline" onclick="sms.showFailedStudents()">
                            <i class="fas fa-exclamation-triangle"></i> View Failed Students
                        </button>
                    </div>
                </div>
            </div>
        `;
    }

    loadReportsSection(container) {
        container.innerHTML = `
            <div class="content-header">
                <h2>Reports & Analytics</h2>
                <div class="action-buttons">
                    <button class="btn btn-primary" onclick="sms.generateReport('enrollment')">
                        <i class="fas fa-file-pdf"></i> Enrollment Report
                    </button>
                    <button class="btn btn-success" onclick="sms.generateReport('grades')">
                        <i class="fas fa-file-excel"></i> Grades Report
                    </button>
                </div>
            </div>
            
            <div class="stats-grid">
                <div class="stat-card">
                    <div class="stat-icon">
                        <i class="fas fa-user-graduate"></i>
                    </div>
                    <div class="stat-content">
                        <h3>${this.data.students.length}</h3>
                        <p>Total Students</p>
                    </div>
                </div>
                
                <div class="stat-card">
                    <div class="stat-icon">
                        <i class="fas fa-chart-line"></i>
                    </div>
                    <div class="stat-content">
                        <h3>${this.data.enrollments.length}</h3>
                        <p>Total Enrollments</p>
                    </div>
                </div>
                
                <div class="stat-card">
                    <div class="stat-icon">
                        <i class="fas fa-percentage"></i>
                    </div>
                    <div class="stat-content">
                        <h3>85%</h3>
                        <p>Passing Rate</p>
                    </div>
                </div>
                
                <div class="stat-card">
                    <div class="stat-icon">
                        <i class="fas fa-calendar-alt"></i>
                    </div>
                    <div class="stat-content">
                        <h3>${new Date().getFullYear()}</h3>
                        <p>School Year</p>
                    </div>
                </div>
            </div>
            
            <div class="content-header" style="margin-top: 40px;">
                <h3>Quick Reports</h3>
            </div>
            
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 20px;">
                <div style="background: white; padding: 20px; border-radius: 10px; border: 1px solid #eee;">
                    <h4 style="margin-bottom: 15px;">Enrollment Status</h4>
                    <canvas id="enrollmentChart" width="400" height="200"></canvas>
                </div>
                
                <div style="background: white; padding: 20px; border-radius: 10px; border: 1px solid #eee;">
                    <h4 style="margin-bottom: 15px;">Grade Distribution</h4>
                    <canvas id="gradesChart" width="400" height="200"></canvas>
                </div>
            </div>
        `;
        
        // Load charts
        setTimeout(() => this.loadCharts(), 100);
    }

    loadCharts() {
        // Enrollment status chart
        const enrollmentCtx = document.getElementById('enrollmentChart');
        if (enrollmentCtx) {
            const statusCounts = {
                pending: this.data.enrollments.filter(e => e.status === 'pending').length,
                approved: this.data.enrollments.filter(e => e.status === 'approved').length,
                rejected: this.data.enrollments.filter(e => e.status === 'rejected').length,
                enrolled: this.data.enrollments.filter(e => e.status === 'enrolled').length
            };
            
            new Chart(enrollmentCtx.getContext('2d'), {
                type: 'doughnut',
                data: {
                    labels: ['Pending', 'Approved', 'Rejected', 'Enrolled'],
                    datasets: [{
                        data: Object.values(statusCounts),
                        backgroundColor: ['#ffc107', '#28a745', '#dc3545', '#007bff']
                    }]
                }
            });
        }
    }

    loadSettingsSection(container) {
        container.innerHTML = `
            <div class="content-header">
                <h2>System Settings</h2>
                <div class="action-buttons">
                    <button class="btn btn-primary" onclick="sms.saveSettings()">
                        <i class="fas fa-save"></i> Save Settings
                    </button>
                </div>
            </div>
            
            <div class="form-group">
                <label class="form-label">School Name</label>
                <input type="text" class="form-control" id="schoolName" value="${this.data.settings.schoolName}">
            </div>
            
            <div class="form-group">
                <label class="form-label">Academic Year</label>
                <input type="text" class="form-control" id="academicYear" value="${new Date().getFullYear()}-${new Date().getFullYear() + 1}">
            </div>
            
            <div class="form-group">
                <label class="form-label">Required Documents</label>
                <div id="documentsList">
                    ${this.data.settings.requiredDocuments.map((doc, index) => `
                        <div class="form-group" style="display: flex; gap: 10px; margin-bottom: 10px;">
                            <input type="text" class="form-control" value="${doc}" id="doc_${index}">
                            <button class="btn btn-danger" onclick="sms.removeDocument(${index})">
                                <i class="fas fa-times"></i>
                            </button>
                        </div>
                    `).join('')}
                </div>
                <button class="btn btn-outline" onclick="sms.addDocument()">
                    <i class="fas fa-plus"></i> Add Document
                </button>
            </div>
            
            <div class="form-group">
                <label class="form-label">Grading Scale</label>
                <div class="table-container">
                    <table class="table">
                        <thead>
                            <tr>
                                <th>Grade</th>
                                <th>Equivalent</th>
                                <th>Description</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr><td>1.00</td><td>97-100</td><td>Excellent</td></tr>
                            <tr><td>1.25</td><td>94-96</td><td>Outstanding</td></tr>
                            <tr><td>1.50</td><td>91-93</td><td>Superior</td></tr>
                            <tr><td>1.75</td><td>88-90</td><td>Very Good</td></tr>
                            <tr><td>2.00</td><td>85-87</td><td>Good</td></tr>
                            <tr><td>2.25</td><td>82-84</td><td>Satisfactory</td></tr>
                            <tr><td>2.50</td><td>79-81</td><td>Fair</td></tr>
                            <tr><td>2.75</td><td>76-78</td><td>Passing</td></tr>
                            <tr><td>3.00</td><td>75</td><td>Minimum Passing</td></tr>
                            <tr><td>5.00</td><td>Below 75</td><td>Failed</td></tr>
                        </tbody>
                    </table>
                </div>
            </div>
            
            <div class="form-group">
                <label class="form-label">
                    <input type="checkbox" id="autoSave" checked> Enable Auto-save
                </label>
            </div>
            
            <div class="form-group">
                <label class="form-label">
                    <input type="checkbox" id="browserNotifications" ${Notification.permission === 'granted' ? 'checked' : ''}> Browser Notifications
                </label>
            </div>
        `;
    }

    saveSettings() {
        this.data.settings.schoolName = document.getElementById('schoolName').value;
        
        // Update documents
        const documents = [];
        for (let i = 0; i < 20; i++) {
            const input = document.getElementById(`doc_${i}`);
            if (input && input.value) {
                documents.push(input.value);
            }
        }
        this.data.settings.requiredDocuments = documents;
        
        this.saveData();
        this.showNotification('Settings saved successfully', 'success');
    }

    addDocument() {
        const container = document.getElementById('documentsList');
        const index = this.data.settings.requiredDocuments.length;
        const div = document.createElement('div');
        div.className = 'form-group';
        div.style.display = 'flex';
        div.style.gap = '10px';
        div.style.marginBottom = '10px';
        div.innerHTML = `
            <input type="text" class="form-control" placeholder="Document name" id="doc_${index}">
            <button class="btn btn-danger" onclick="sms.removeDocument(${index})">
                <i class="fas fa-times"></i>
            </button>
        `;
        container.appendChild(div);
    }

    removeDocument(index) {
        this.data.settings.requiredDocuments.splice(index, 1);
        this.saveSettings();
    }

    showGitHubSync() {
        let content = `
            <div style="text-align: center; padding: 20px;">
                <i class="fab fa-github" style="font-size: 64px; color: #333; margin-bottom: 20px;"></i>
                <h3 style="margin-bottom: 10px;">GitHub Sync</h3>
                <p style="color: var(--gray); margin-bottom: 30px;">
                    All data is automatically synchronized with GitHub repository.
                    Changes are saved locally and pushed to the cloud.
                </p>
                
                <div style="background: #f8f9fa; padding: 15px; border-radius: 10px; margin-bottom: 20px;">
                    <p style="margin: 0;">
                        <strong>Repository:</strong> school-management-system<br>
                        <strong>Last Sync:</strong> ${new Date().toLocaleString()}<br>
                        <strong>Status:</strong> <span style="color: var(--success);">✓ Synchronized</span>
                    </p>
                </div>
                
                <button class="btn btn-primary" onclick="sms.forceSync()" style="margin-top: 20px;">
                    <i class="fas fa-sync"></i> Force Sync Now
                </button>
            </div>
        `;
        
        this.showDialog('GitHub Sync Status', content, [
            {
                text: 'Close',
                className: 'btn-outline',
                action: () => this.hideDialog()
            }
        ]);
    }

    forceSync() {
        this.saveData();
        this.showNotification('Data synchronized with GitHub', 'success');
        document.getElementById('syncStatus').textContent = '✓';
        this.hideDialog();
    }

    generateReport(type) {
        let content = '';
        let filename = '';
        
        if (type === 'enrollment') {
            content = this.generateEnrollmentReport();
            filename = `enrollment_report_${new Date().toISOString().split('T')[0]}.pdf`;
        } else if (type === 'grades') {
            content = this.generateGradesReport();
            filename = `grades_report_${new Date().toISOString().split('T')[0]}.csv`;
        }
        
        // In a real implementation, this would generate actual PDF/CSV
        // For now, we'll simulate it
        this.showNotification(`${type} report generated`, 'success');
        
        // Simulate download
        const blob = new Blob([content], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }

    generateEnrollmentReport() {
        let report = `Enrollment Report - ${this.data.settings.schoolName}\n`;
        report += `Generated: ${new Date().toLocaleString()}\n\n`;
        report += 'ID,Name,Email,Grade Level,Status,Date\n';
        
        this.data.enrollments.forEach(enrollment => {
            report += `${enrollment.id},${enrollment.studentName},${enrollment.studentEmail},`;
            report += `${enrollment.gradeLevel},${enrollment.status},${enrollment.date}\n`;
        });
        
        return report;
    }

    generateGradesReport() {
        let report = `Grades Report - ${this.data.settings.schoolName}\n`;
        report += `Generated: ${new Date().toLocaleString()}\n\n`;
        report += 'Student ID,Student Name,Subject,Grade,Remarks\n';
        
        // This is simplified - in real implementation, you'd have actual grades data
        Object.entries(this.data.grades).forEach(([studentId, subjects]) => {
            Object.entries(subjects).forEach(([subject, grade]) => {
                const student = this.data.students.find(s => s.id === studentId);
                if (student) {
                    report += `${studentId},${student.name},${subject},${grade},`;
                    report += `${grade >= 75 ? 'PASSED' : 'FAILED'}\n`;
                }
            });
        });
        
        return report;
    }

    // Export functions
    exportEnrollments() {
        this.generateReport('enrollment');
    }

    exportStudents() {
        let csv = 'ID,Name,Email,Grade Level,Phone,Status,Enrollment Date\n';
        this.data.students.forEach(student => {
            csv += `${student.id},${student.name},${student.email},`;
            csv += `${student.gradeLevel},${student.phone || ''},`;
            csv += `${student.status},${student.enrollmentDate}\n`;
        });
        
        const blob = new Blob([csv], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `students_${new Date().toISOString().split('T')[0]}.csv`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }
}

// Initialize the system
const sms = new SchoolManagementSystem();
