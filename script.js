let undoStack = [];
let isUndoAction = false;

let defaultData = {
    semesters: ["1", "2", "3", "4", "5", "6", "7", "8"],
    courses: [],
    hasInitialized: false
};

let data = JSON.parse(localStorage.getItem('ctdt_matrix_data')) || defaultData;

// Handle history
function saveHistory() {
    if (undoStack.length >= 50) undoStack.shift(); // Max 50 history states
    undoStack.push(JSON.stringify(data));
}

function undo() {
    if (undoStack.length > 0) {
        // Current state is at the end, so we pop it and take the one before
        const prevState = undoStack.pop(); 
        if (undoStack.length > 0) {
            data = JSON.parse(undoStack[undoStack.length - 1]);
        } else {
            // If nothing else, revert to empty or default
            data = JSON.parse(prevState);
        }
        isUndoAction = true;
        saveData(false); // save without pushing history
    }
}

// Add Ctrl+Z listener
document.addEventListener('keydown', function(e) {
    if ((e.ctrlKey || e.metaKey) && e.key === 'z') {
        e.preventDefault();
        undo();
    }
});

function saveData(pushHistory = true) {
    data.hasInitialized = true;
    localStorage.setItem('ctdt_matrix_data', JSON.stringify(data));
    
    if (pushHistory) {
        saveHistory();
    }
    isUndoAction = false;
    
    renderTable();
}

function loadSample() {
    if (data.courses.length > 0 && !confirm('Ghi đè dữ liệu hiện tại bằng dữ liệu mẫu?')) return;
    
    data.semesters = ["1", "2", "3", "4", "5", "6", "7", "8"];
    data.courses = [
        { id: "c1", maHP: "POL307", tenHP: "Triết học Mác - Lênin", tc: 3, tinhGPA: true, scores: {"1": "8.8"} },
        { id: "c2", maHP: "MAT327", tenHP: "Toán 1", tc: 3, tinhGPA: true, scores: {"1": "6.7"} },
        { id: "c3", maHP: "QPAD011", tenHP: "Giáo dục Quốc phòng 1", tc: 3, tinhGPA: false, scores: {"1": "7.8"} },
        { id: "c4", maHP: "SOT301", tenHP: "Nhập môn ngành CNTT", tc: 1, tinhGPA: false, scores: {"1": "Đ"} },
        { id: "c5", maHP: "MAT328", tenHP: "Toán 2", tc: 2, tinhGPA: true, scores: {"2": "8.7"} },
        { id: "c6", maHP: "SOT315", tenHP: "Nhập môn lập trình", tc: 3, tinhGPA: true, scores: {"2": "8.0"} },
        { id: "c7", maHP: "85065", tenHP: "Giáo dục thể chất (Chạy)", tc: 1, tinhGPA: false, scores: {"2": "Đ"} },
        { id: "c8", maHP: "INS326", tenHP: "Cấu trúc dữ liệu và GT", tc: 3, tinhGPA: true, scores: {"3": "8.1"} },
    ];
    saveData();
}

function clearData() {
    if (confirm('Làm mới toàn bộ bảng điểm? Bạn có thể ấn Ctrl+Z để hoàn tác nếu lỡ tay.')) {
        data.courses = [];
        saveData();
    }
}

function openCourseModal() {
    document.getElementById('add-course-form').reset();
    document.getElementById('course-modal').classList.remove('hidden');
    document.getElementById('course-modal').classList.add('flex');
    document.getElementById('modal-maHP').focus();
}

function closeCourseModal() {
    document.getElementById('course-modal').classList.add('hidden');
    document.getElementById('course-modal').classList.remove('flex');
}

// override addCourse button to open modal
function addCourse() {
    openCourseModal();
}

document.getElementById('add-course-form').addEventListener('submit', function(e) {
    e.preventDefault();
    const maHP = document.getElementById('modal-maHP').value.trim();
    const tenHP = document.getElementById('modal-tenHP').value.trim();
    const tc = parseFloat(document.getElementById('modal-tc').value) || 0;
    const tinhGPA = document.getElementById('modal-tinhGPA').checked;

    data.courses.push({
        id: "c" + Date.now(),
        maHP: maHP,
        tenHP: tenHP,
        tc: tc,
        tinhGPA: tinhGPA,
        scores: {}
    });
    
    saveData();
    closeCourseModal();
});

function addSemester() {
    const nextSem = (data.semesters.length + 1).toString();
    data.semesters.push(nextSem);
    saveData();
}

function updateCourse(id, field, value) {
    const course = data.courses.find(c => c.id === id);
    if (course) {
        if (field === 'tc') value = parseFloat(value) || 0;
        course[field] = value;
        saveData();
    }
}

function updateScore(courseId, sem, value) {
    const course = data.courses.find(c => c.id === courseId);
    if (course) {
        if (value.trim() === '') {
            delete course.scores[sem];
        } else {
            // Thay dấu phẩy thành dấu chấm nếu user nhập kiểu VN
            value = value.replace(',', '.').toUpperCase();
            course.scores[sem] = value;
        }
        saveData();
    }
}

function deleteCourse(id) {
    if (confirm('Xoá học phần này?')) {
        data.courses = data.courses.filter(c => c.id !== id);
        saveData();
    }
}

function renderTable() {
    const thead = document.getElementById('header-row');
    const tbody = document.getElementById('table-body');
    const tfoot = document.getElementById('table-foot');

    // 1. Dựng Header
    let headHtml = `
        <th class="sticky-col-1 w-10 min-w-[40px] whitespace-nowrap">TT</th>
        <th class="sticky-col-2 w-24 min-w-[96px] whitespace-nowrap">Mã HP</th>
        <th class="sticky-col-3 w-64 min-w-[250px] text-left whitespace-nowrap">Tên học phần</th>
        <th class="w-16 min-w-[64px] whitespace-nowrap">Số TC</th>
        <th class="w-20 min-w-[80px] whitespace-nowrap">Tính điểm</th>
    `;
    data.semesters.forEach(sem => {
        headHtml += `<th class="w-20 min-w-[80px] whitespace-nowrap">Học kỳ ${sem}</th>`;
    });
    headHtml += `<th class="w-10 min-w-[40px] whitespace-nowrap">Xoá</th>`;
    thead.innerHTML = headHtml;

    // 2. Dựng Body (Courses)
    let bodyHtml = '';
    data.courses.forEach((c, index) => {
        let rowHtml = `
            <tr class="bg-white">
                <td class="sticky-col-1 bg-inherit">${index + 1}</td>
                <td class="sticky-col-2 bg-inherit">
                    <input type="text" class="score-input" value="${c.maHP}" onchange="updateCourse('${c.id}', 'maHP', this.value)" placeholder="...">
                </td>
                <td class="sticky-col-3 bg-inherit text-left">
                    <input type="text" class="score-input text-left" value="${c.tenHP}" onchange="updateCourse('${c.id}', 'tenHP', this.value)">
                </td>
                <td>
                    <input type="number" class="score-input" value="${c.tc}" min="0" step="0.5" onchange="updateCourse('${c.id}', 'tc', this.value)">
                </td>
                <td>
                    <input type="checkbox" ${c.tinhGPA ? 'checked' : ''} onchange="updateCourse('${c.id}', 'tinhGPA', this.checked)">
                </td>
        `;
        
        data.semesters.forEach(sem => {
            const score = c.scores[sem] || '';
            rowHtml += `
                <td>
                    <input type="text" class="score-input font-medium" value="${score}" onchange="updateScore('${c.id}', '${sem}', this.value)">
                </td>
            `;
        });
        
        rowHtml += `
                <td>
                    <button onclick="deleteCourse('${c.id}')" class="text-red-500 hover:text-red-700"><i class="fa-solid fa-trash"></i></button>
                </td>
            </tr>
        `;
        bodyHtml += rowHtml;
    });
    tbody.innerHTML = bodyHtml;

    // 3. Tính toán Footer (Các dòng tổng kết)
    // Tính toán theo từng cột (học kỳ)
    let semTcs = {};
    let semScores = {};
    
    let accTcGpa = 0;
    let accScoreGpa = 0;
    let accTcTotal = 0;
    
    let footHtmlTc = `<tr class="summary-row">
        <td class="sticky-col-1 bg-inherit" style="border-right: none;"></td>
        <td class="sticky-col-2 bg-inherit" style="border-left: none; border-right: none;"></td>
        <td colspan="3" class="text-right sticky-col-3 bg-inherit" style="border-left: none;">Tín chỉ học kỳ (TC)</td>`;
    
    let footHtmlGpa = `<tr class="summary-row">
        <td class="sticky-col-1 bg-inherit" style="border-right: none;"></td>
        <td class="sticky-col-2 bg-inherit" style="border-left: none; border-right: none;"></td>
        <td colspan="3" class="text-right sticky-col-3 bg-inherit" style="border-left: none;">Điểm TB học kỳ (ĐTB)</td>`;
        
    let footHtmlAccTc = `<tr class="summary-row text-blue-800">
        <td class="sticky-col-1 bg-inherit" style="border-right: none;"></td>
        <td class="sticky-col-2 bg-inherit" style="border-left: none; border-right: none;"></td>
        <td colspan="3" class="text-right sticky-col-3 bg-inherit" style="border-left: none;">Tín chỉ tích luỹ</td>`;
        
    let footHtmlAccGpa = `<tr class="summary-row text-red-700">
        <td class="sticky-col-1 bg-inherit" style="border-right: none;"></td>
        <td class="sticky-col-2 bg-inherit" style="border-left: none; border-right: none;"></td>
        <td colspan="3" class="text-right sticky-col-3 bg-inherit" style="border-left: none;">Điểm TB tích luỹ</td>`;

    data.semesters.forEach(sem => {
        let sTcAll = 0; // Tất cả tín chỉ pass trong kỳ (để tính Tín chỉ tích luỹ toàn khoá)
        let sTcGpa = 0; // Tín chỉ môn CÓ TÍNH GPA (để tính TC học kỳ và ĐTB học kỳ)
        let sScoreGpa = 0; // Tổng điểm môn CÓ TÍNH GPA

        data.courses.forEach(c => {
            const val = c.scores[sem];
            if (val) {
                const isDat = val === 'Đ' || val.toLowerCase() === 'dat';
                const scoreNum = parseFloat(val);
                const isValidScore = !isNaN(scoreNum);
                
                // Chỉ cộng vào Tín chỉ tích luỹ nếu học phần đó tính điểm và pass (có điểm số >= 0 hoặc 'Đ')
                if (c.tinhGPA && (isValidScore || isDat)) {
                    sTcAll += c.tc;
                }
                
                // CHỈ môn nào đánh dấu "Tính điểm" VÀ có điểm số thì mới đưa vào tính toán học kỳ và ĐTB
                if (c.tinhGPA && isValidScore) {
                    sTcGpa += c.tc;
                    sScoreGpa += (scoreNum * c.tc);
                }
            }
        });

        // Semester GPA
        const sGpa = sTcGpa > 0 ? (sScoreGpa / sTcGpa) : 0;
        
        // Cập nhật tích luỹ
        accTcTotal += sTcAll;
        accTcGpa += sTcGpa;
        accScoreGpa += sScoreGpa;
        const aGpa = accTcGpa > 0 ? (accScoreGpa / accTcGpa) : 0;

        footHtmlTc += `<td>${sTcGpa > 0 ? sTcGpa : ''}</td>`;
        footHtmlGpa += `<td>${sTcGpa > 0 ? sGpa.toFixed(2) : ''}</td>`;
        footHtmlAccTc += `<td>${accTcTotal > 0 ? accTcTotal : ''}</td>`;
        footHtmlAccGpa += `<td>${accTcGpa > 0 ? aGpa.toFixed(2) : ''}</td>`;
    });

    footHtmlTc += `<td></td></tr>`;
    footHtmlGpa += `<td></td></tr>`;
    footHtmlAccTc += `<td></td></tr>`;
    footHtmlAccGpa += `<td></td></tr>`;

    tfoot.innerHTML = footHtmlTc + footHtmlGpa + footHtmlAccTc + footHtmlAccGpa;
}

// Init
if (!data.hasInitialized) {
    loadSample();
} else {
    // Save initial state for undo
    saveHistory();
    renderTable();
}
