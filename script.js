/* ========================================
   HOLY TRINITY CHURCH CHOIR ATTENDANCE
   Single Class Management System
   Updated: Late -> OD (On Duty)
   ======================================== */

// ========================================
// CONFIGURATION
// ========================================

const CHOIR_MEMBER_COUNT = 50; // Adjust this for your choir size
let currentClass = "Choir";

// ========================================
// INITIALIZATION
// ========================================

document.addEventListener('DOMContentLoaded', function() {
    console.log('%c✝ Holy Trinity Church Vellalanvilai', 'font-size: 20px; font-weight: bold; color: #C9A55A;');
    console.log('%c🎵 Choir Attendance System', 'font-size: 16px; color: #4A90E2;');
    console.log('%c✅ System loaded successfully', 'color: #4CAF50;');
    
    initializeDarkMode();
    setupEventListeners();
    loadChoir();
    
    // Set today's date as default
    const dateInput = document.getElementById("attendanceDate");
    if (dateInput && !dateInput.value) {
        const today = new Date();
        const yyyy = today.getFullYear();
        const mm = String(today.getMonth() + 1).padStart(2, '0');
        const dd = String(today.getDate()).padStart(2, '0');
        dateInput.value = `${yyyy}-${mm}-${dd}`;
    }
});

// ========================================
// DARK MODE MANAGEMENT
// ========================================

function initializeDarkMode() {
    const isDarkMode = localStorage.getItem('darkMode');
    // Default to dark mode if not set
    if (isDarkMode === null || isDarkMode === 'true') {
        document.body.classList.add('dark-mode');
        updateDarkModeButton(true);
        localStorage.setItem('darkMode', 'true');
    } else {
        updateDarkModeButton(false);
    }
}

function updateDarkModeButton(isDark) {
    const toggleBtn = document.getElementById("toggleMode");
    if (!toggleBtn) return;
    
    const icon = toggleBtn.querySelector('.mode-icon');
    const text = toggleBtn.querySelector('.mode-text');
    
    if (icon && text) {
        if (isDark) {
            icon.textContent = '☀️';
            text.textContent = 'Light';
        } else {
            icon.textContent = '🌙';
            text.textContent = 'Dark';
        }
    }
}

// ========================================
// EVENT LISTENERS SETUP
// ========================================

function setupEventListeners() {
    // Dark mode toggle
    const toggleBtn = document.getElementById("toggleMode");
    if (toggleBtn) {
        toggleBtn.addEventListener("click", function () {
            const isDark = document.body.classList.toggle("dark-mode");
            localStorage.setItem('darkMode', isDark);
            updateDarkModeButton(isDark);
            showToast(isDark ? 'Dark mode enabled' : 'Light mode enabled', 'info');
        });
    }
    
    // Date change listener
    const dateInput = document.getElementById("attendanceDate");
    if (dateInput) {
        dateInput.addEventListener("change", function () {
            loadAttendance();
            showToast(`Loaded attendance for ${formatDate(this.value)}`, 'info');
        });
    }
    
    // Prevent data loss on page navigation
    window.addEventListener('beforeunload', function (e) {
        const attendanceSection = document.getElementById('attendanceSection');
        if (attendanceSection && attendanceSection.classList.contains('active')) {
            const hasUnsavedChanges = checkForUnsavedChanges();
            if (hasUnsavedChanges) {
                e.preventDefault();
                e.returnValue = 'You have unsaved changes. Are you sure you want to leave?';
                return e.returnValue;
            }
        }
    });
}

// ========================================
// CHOIR LOADING & INITIALIZATION
// ========================================

function loadChoir() {
    const tbody = document.querySelector("#attendanceTable tbody");
    if (!tbody) {
        console.error('Attendance table body not found');
        return;
    }
    
    tbody.innerHTML = "";

    for (let i = 1; i <= CHOIR_MEMBER_COUNT; i++) {
        const regNo = String(i).padStart(3, "0");
        const defaultName = `Member ${i}`;
        
        const row = document.createElement("tr");
        row.innerHTML = `
            <td>${regNo}</td>
            <td>
                <input 
                    type="text" 
                    class="student-name" 
                    data-reg="${regNo}" 
                    value="${defaultName}"
                    placeholder="Enter member name"
                    aria-label="Member ${regNo} name"
                />
            </td>
            <td style="text-align: center;">
                <input type="radio" name="status-${regNo}" value="present" aria-label="Present" />
            </td>
            <td style="text-align: center;">
                <input type="radio" name="status-${regNo}" value="od" aria-label="On Duty" />
            </td>
            <td style="text-align: center;">
                <input type="radio" name="status-${regNo}" value="absent" aria-label="Absent" />
            </td>
        `;
        tbody.appendChild(row);
    }
    
    loadAttendance();
    console.log(`✅ Loaded ${CHOIR_MEMBER_COUNT} choir members`);
}

// ========================================
// SEARCH & FILTER
// ========================================

let filterTimeout;
function debouncedFilter() {
    clearTimeout(filterTimeout);
    filterTimeout = setTimeout(() => {
        filterTable();
    }, 300);
}

function filterTable() {
    const searchInput = document.getElementById("searchInput");
    if (!searchInput) return;
    
    const searchValue = searchInput.value.toLowerCase().trim();
    const rows = document.querySelectorAll("#attendanceTable tbody tr");
    
    let visibleCount = 0;
    rows.forEach(row => {
        const regNo = row.cells[0].textContent.toLowerCase();
        const nameInput = row.querySelector(".student-name");
        const name = nameInput ? nameInput.value.toLowerCase() : "";
        
        const matches = regNo.includes(searchValue) || name.includes(searchValue);
        row.style.display = matches ? "" : "none";
        if (matches) visibleCount++;
    });
    
    if (searchValue && visibleCount === 0) {
        showToast('No members found', 'info');
    }
}

// ========================================
// ATTENDANCE MANAGEMENT
// ========================================

function saveAttendance() {
    const dateInput = document.getElementById("attendanceDate");
    if (!dateInput) {
        showToast("Date input not found!", "error");
        return;
    }
    
    const selectedDate = dateInput.value;
    
    if (!selectedDate) {
        showToast("Please select a date first!", "error");
        return;
    }
    
    const attendanceData = [];
    const rows = document.querySelectorAll("#attendanceTable tbody tr");
    
    rows.forEach(row => {
        const regNo = row.cells[0].textContent;
        const nameInput = row.querySelector(".student-name");
        const name = nameInput ? nameInput.value.trim() : "";
        
        const statusRadios = row.querySelectorAll('input[type="radio"]');
        let status = "absent"; // Default
        statusRadios.forEach(radio => {
            if (radio.checked) {
                status = radio.value;
            }
        });
        
        attendanceData.push({
            regNo,
            name,
            status
        });
    });
    
    // Save to localStorage
    const storageKey = `choir_attendance_${selectedDate}`;
    localStorage.setItem(storageKey, JSON.stringify(attendanceData));
    
    // Also save member names for persistence
    const memberNames = {};
    rows.forEach(row => {
        const regNo = row.cells[0].textContent;
        const nameInput = row.querySelector(".student-name");
        if (nameInput) {
            memberNames[regNo] = nameInput.value.trim();
        }
    });
    localStorage.setItem('choir_member_names', JSON.stringify(memberNames));
    
    showToast(`✅ Attendance saved for ${formatDate(selectedDate)}!`, "success");
    console.log(`✅ Attendance saved for ${selectedDate}`);
}

function loadAttendance() {
    const dateInput = document.getElementById("attendanceDate");
    if (!dateInput) return;
    
    const selectedDate = dateInput.value;
    
    if (!selectedDate) return;
    
    // Load member names first
    const savedNames = localStorage.getItem('choir_member_names');
    if (savedNames) {
        try {
            const memberNames = JSON.parse(savedNames);
            const nameInputs = document.querySelectorAll('.student-name');
            nameInputs.forEach(input => {
                const regNo = input.dataset.reg;
                if (memberNames[regNo]) {
                    input.value = memberNames[regNo];
                }
            });
        } catch (e) {
            console.error('Error loading member names:', e);
        }
    }
    
    // Load attendance for selected date
    const storageKey = `choir_attendance_${selectedDate}`;
    const savedData = localStorage.getItem(storageKey);
    
    if (savedData) {
        try {
            const attendanceData = JSON.parse(savedData);
            const rows = document.querySelectorAll("#attendanceTable tbody tr");
            
            rows.forEach(row => {
                const regNo = row.cells[0].textContent;
                const member = attendanceData.find(s => s.regNo === regNo);
                
                if (member) {
                    // Set name
                    const nameInput = row.querySelector(".student-name");
                    if (nameInput && member.name) {
                        nameInput.value = member.name;
                    }
                    
                    // Set status
                    const statusRadios = row.querySelectorAll('input[type="radio"]');
                    statusRadios.forEach(radio => {
                        radio.checked = (radio.value === member.status);
                    });
                } else {
                    // Clear status if no data
                    const statusRadios = row.querySelectorAll('input[type="radio"]');
                    statusRadios.forEach(radio => {
                        radio.checked = false;
                    });
                }
            });
            
            console.log(`✅ Loaded attendance for ${selectedDate}`);
        } catch (e) {
            console.error('Error loading attendance:', e);
            showToast('Error loading attendance data', 'error');
        }
    } else {
        // Clear all status radios if no saved data
        const statusRadios = document.querySelectorAll('#attendanceTable input[type="radio"]');
        statusRadios.forEach(radio => {
            radio.checked = false;
        });
    }
}

function checkForUnsavedChanges() {
    const dateInput = document.getElementById("attendanceDate");
    if (!dateInput) return false;
    
    const selectedDate = dateInput.value;
    
    if (!selectedDate) return false;
    
    const storageKey = `choir_attendance_${selectedDate}`;
    const savedData = localStorage.getItem(storageKey);
    
    if (!savedData) {
        // Check if any radio buttons are selected
        const checkedRadios = document.querySelectorAll('#attendanceTable input[type="radio"]:checked');
        return checkedRadios.length > 0;
    }
    
    return false;
}

// ========================================
// EXCEL EXPORT
// ========================================

function exportToExcel() {
    if (typeof XLSX === 'undefined') {
        showToast("Excel library not loaded. Please refresh the page.", "error");
        return;
    }
    
    const dateInput = document.getElementById("attendanceDate");
    if (!dateInput) {
        showToast("Date input not found!", "error");
        return;
    }
    
    const selectedDate = dateInput.value;
    
    if (!selectedDate) {
        showToast("Please select a date first!", "error");
        return;
    }
    
    // Prepare data
    const data = [
        ["Holy Trinity Church Vellalanvilai - Choir Attendance"],
        [`Date: ${formatDate(selectedDate)}`],
        [],
        ["Member No.", "Member Name", "Status"]
    ];
    
    const rows = document.querySelectorAll("#attendanceTable tbody tr");
    rows.forEach(row => {
        const regNo = row.cells[0].textContent;
        const nameInput = row.querySelector(".student-name");
        const name = nameInput ? nameInput.value.trim() : "";
        
        const statusRadios = row.querySelectorAll('input[type="radio"]');
        let status = "Absent";
        statusRadios.forEach(radio => {
            if (radio.checked) {
                if (radio.value === 'present') {
                    status = 'Present';
                } else if (radio.value === 'od') {
                    status = 'OD';
                } else if (radio.value === 'absent') {
                    status = 'Absent';
                }
            }
        });
        
        data.push([regNo, name, status]);
    });
    
    // Calculate statistics
    const presentCount = Array.from(rows).filter(row => 
        Array.from(row.querySelectorAll('input[type="radio"]')).some(r => r.checked && r.value === 'present')
    ).length;
    const odCount = Array.from(rows).filter(row => 
        Array.from(row.querySelectorAll('input[type="radio"]')).some(r => r.checked && r.value === 'od')
    ).length;
    const absentCount = Array.from(rows).filter(row => 
        Array.from(row.querySelectorAll('input[type="radio"]')).some(r => r.checked && r.value === 'absent')
    ).length;
    
    data.push([]);
    data.push(["Summary"]);
    data.push(["Total Members", CHOIR_MEMBER_COUNT]);
    data.push(["Present", presentCount]);
    data.push(["OD (On Duty)", odCount]);
    data.push(["Absent", absentCount]);
    
    try {
        // Create workbook
        const wb = XLSX.utils.book_new();
        const ws = XLSX.utils.aoa_to_sheet(data);
        
        // Set column widths
        ws['!cols'] = [
            { wch: 12 },
            { wch: 25 },
            { wch: 12 }
        ];
        
        XLSX.utils.book_append_sheet(wb, ws, "Attendance");
        
        // Generate filename
        const filename = `Choir_Attendance_${selectedDate}.xlsx`;
        
        // Download
        XLSX.writeFile(wb, filename);
        
        showToast(`📥 Excel file downloaded: ${filename}`, "success");
        console.log(`✅ Excel exported: ${filename}`);
    } catch (e) {
        console.error('Error exporting to Excel:', e);
        showToast('Error exporting to Excel', 'error');
    }
}

// ========================================
// UTILITY FUNCTIONS
// ========================================

function formatDate(dateString) {
    if (!dateString) return "";
    try {
        const date = new Date(dateString + 'T00:00:00');
        const options = { year: 'numeric', month: 'long', day: 'numeric' };
        return date.toLocaleDateString('en-US', options);
    } catch (e) {
        console.error('Error formatting date:', e);
        return dateString;
    }
}

function showToast(message, type = 'info') {
    const container = document.getElementById('toastContainer');
    if (!container) {
        console.warn('Toast container not found');
        return;
    }
    
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.textContent = message;
    toast.setAttribute('role', 'alert');
    
    container.appendChild(toast);
    
    setTimeout(() => {
        toast.style.animation = 'slideOutRight 0.3s ease';
        setTimeout(() => {
            if (container.contains(toast)) {
                container.removeChild(toast);
            }
        }, 300);
    }, 3000);
}

// ========================================
// KEYBOARD SHORTCUTS
// ========================================

document.addEventListener('keydown', function(e) {
    // Ctrl/Cmd + S to save
    if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        saveAttendance();
    }
    
    // Ctrl/Cmd + E to export
    if ((e.ctrlKey || e.metaKey) && e.key === 'e') {
        e.preventDefault();
        exportToExcel();
    }
});

console.log('%c⌨️  Keyboard Shortcuts:', 'font-weight: bold; color: #C9A55A;');
console.log('  Ctrl/Cmd + S: Save Attendance');
console.log('  Ctrl/Cmd + E: Export to Excel');
