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

// Handle View Toggle
let currentView = 'table';
function toggleView() {
    currentView = currentView === 'table' ? 'cards' : 'table';
    updateView();
}

function updateView() {
    const tableContainer = document.getElementById('table-container');
    const cardsContainer = document.getElementById('cards-container');
    const summaryBar = document.getElementById('mobile-summary-bar');
    const toggleBtn = document.getElementById('view-toggle-btn');
    
    if (currentView === 'table') {
        tableContainer.classList.remove('hidden');
        cardsContainer.classList.add('hidden');
        summaryBar.classList.add('hidden');
        if(toggleBtn) toggleBtn.innerHTML = '<i class="fa-solid fa-list mr-1"></i> Xem dạng thẻ';
    } else {
        tableContainer.classList.add('hidden');
        cardsContainer.classList.remove('hidden');
        summaryBar.classList.remove('hidden');
        if(toggleBtn) toggleBtn.innerHTML = '<i class="fa-solid fa-table mr-1"></i> Xem dạng bảng';
    }
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
        <th class="sticky-col-1 hidden md:table-cell w-10 min-w-[30px] whitespace-nowrap">STT</th>
        <th class="sticky-col-2 w-64 min-w-[140px] md:min-w-[200px] text-left whitespace-normal md:whitespace-nowrap leading-tight">Học phần (Mã - Tên)</th>
        <th class="w-16 min-w-[60px] whitespace-nowrap">Số TC</th>
        <th class="w-20 min-w-[70px] whitespace-nowrap">Tính ĐTB</th>
    `;
    data.semesters.forEach(sem => {
        headHtml += `<th class="w-20 min-w-[70px] whitespace-nowrap">Học kỳ ${sem}</th>`;
    });
    headHtml += `<th class="w-10 min-w-[40px] whitespace-nowrap"><i class="fa-solid fa-trash"></i></th>`;
    thead.innerHTML = headHtml;

    // 2. Dựng Body (Courses) cho Bảng (Desktop)
    let bodyHtml = '';
    data.courses.forEach((c, index) => {
        // --- Desktop Table Row ---
        let rowHtml = `
            <tr class="bg-white">
                <td class="sticky-col-1 hidden md:table-cell bg-inherit text-center">${index + 1}</td>
                <td class="sticky-col-2 bg-inherit text-left">
                    <div class="flex flex-col gap-1 overflow-hidden">
                        <input type="text" class="score-input text-left font-bold text-sm text-ellipsis" value="${c.tenHP}" onchange="updateCourse('${c.id}', 'tenHP', this.value)" placeholder="Tên học phần...">
                        <input type="text" class="score-input text-left text-xs text-gray-500 text-ellipsis" value="${c.maHP}" onchange="updateCourse('${c.id}', 'maHP', this.value)" placeholder="Mã học phần...">
                    </div>
                </td>
                <td>
                    <input type="number" class="score-input text-center" value="${c.tc}" min="0" step="0.5" onchange="updateCourse('${c.id}', 'tc', this.value)">
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

    // 3. Tính toán Footer (Các dòng tổng kết) và Dựng Giao diện Thẻ (Mobile)
    let footHtmlTc = `<tr class="summary-row">
        <td class="sticky-col-1 hidden md:table-cell bg-inherit" style="border-right: none;"></td>
        <td class="sticky-col-2 bg-inherit text-right whitespace-nowrap" style="border-left: none;">Tín chỉ học kỳ (TC)</td>
        <td colspan="2"></td>`;
    
    let footHtmlGpa = `<tr class="summary-row">
        <td class="sticky-col-1 hidden md:table-cell bg-inherit" style="border-right: none;"></td>
        <td class="sticky-col-2 bg-inherit text-right whitespace-nowrap" style="border-left: none;">Điểm TB học kỳ (ĐTB)</td>
        <td colspan="2"></td>`;
        
    let footHtmlAccTc = `<tr class="summary-row text-blue-800">
        <td class="sticky-col-1 hidden md:table-cell bg-inherit" style="border-right: none;"></td>
        <td class="sticky-col-2 bg-inherit text-right whitespace-nowrap" style="border-left: none;">Tín chỉ tích luỹ</td>
        <td colspan="2"></td>`;
        
    let footHtmlAccGpa = `<tr class="summary-row text-red-700">
        <td class="sticky-col-1 hidden md:table-cell bg-inherit" style="border-right: none;"></td>
        <td class="sticky-col-2 bg-inherit text-right whitespace-nowrap" style="border-left: none;">Điểm TB tích luỹ</td>
        <td colspan="2"></td>`;

    let mobileCardsHtml = '';
    let finalTcTotal = 0;
    let finalGpa = '0.00';

    data.semesters.forEach((sem, semIndex) => {
        // --- XỬ LÝ LOGIC TÍNH TOÁN ĐIỂM HỌC KỲ ---
        let sTcGpa = 0; // Tín chỉ ĐTB của riêng học kỳ này
        let sScoreGpa = 0; // Tổng điểm của riêng học kỳ này

        data.courses.forEach(c => {
            const val = c.scores[sem];
            if (val) {
                const scoreNum = parseFloat(val);
                const isValidScore = !isNaN(scoreNum);
                
                if (c.tinhGPA && isValidScore) {
                    sTcGpa += c.tc;
                    sScoreGpa += (scoreNum * c.tc);
                }
            }
        });

        const sGpa = sTcGpa > 0 ? (sScoreGpa / sTcGpa) : 0;

        // --- XỬ LÝ GIAO DIỆN MOBILE (CARD THEO HỌC KỲ) ---
        let coursesInSem = data.courses.filter(c => c.scores[sem] !== undefined && c.scores[sem].trim() !== '');
        let coursesNotInSem = data.courses.filter(c => c.scores[sem] === undefined || c.scores[sem].trim() === '');
        
        let cardHtml = `
            <div class="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden mb-4 flex flex-col h-full">
                <div class="bg-blue-50 px-4 py-3 border-b border-gray-200 font-bold text-blue-800 flex justify-between items-center">
                    <span>HỌC KỲ ${sem}</span>
                    <span class="text-xs font-normal text-gray-500 bg-white px-2 py-0.5 rounded-full border">${coursesInSem.length} môn</span>
                </div>
                <div class="p-3 flex-1 flex flex-col">
                    <div class="space-y-3 flex-1">
        `;
        
        coursesInSem.forEach(c => {
            cardHtml += `
                        <div class="flex items-center justify-between gap-2 border-b border-gray-50 pb-2">
                            <div class="flex-1">
                                <div class="font-bold text-sm text-gray-800">${c.tenHP}</div>
                                <div class="text-xs text-gray-500">${c.maHP} • ${c.tc} TC ${c.tinhGPA ? '• Có ĐTB' : ''}</div>
                            </div>
                            <div class="w-16">
                                <input type="text" class="w-full border border-gray-300 rounded text-center text-sm py-1 font-bold text-blue-700 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none" value="${c.scores[sem]}" onchange="updateScore('${c.id}', '${sem}', this.value)" placeholder="Điểm">
                            </div>
                        </div>
            `;
        });
        
        if (coursesNotInSem.length > 0) {
            cardHtml += `
                        <details class="group mt-2">
                            <summary class="text-xs font-semibold text-blue-600 cursor-pointer list-none flex items-center justify-center p-2 bg-blue-50/50 rounded-lg hover:bg-blue-50 transition-colors">
                                <span>+ Nhập điểm môn khác vào kỳ này</span>
                            </summary>
                            <div class="pt-3 space-y-3 mt-2 border-t border-gray-100">
            `;
            coursesNotInSem.forEach(c => {
                cardHtml += `
                                <div class="flex items-center justify-between gap-2">
                                    <div class="flex-1">
                                        <div class="font-medium text-sm text-gray-600">${c.tenHP}</div>
                                        <div class="text-[10px] text-gray-400">${c.tc} TC</div>
                                    </div>
                                    <div class="w-16">
                                        <input type="text" class="w-full border border-gray-200 rounded text-center text-sm py-1 bg-gray-50 focus:bg-white focus:border-blue-500 outline-none" placeholder="-" onchange="updateScore('${c.id}', '${sem}', this.value)">
                                    </div>
                                </div>
                `;
            });
            cardHtml += `
                            </div>
                        </details>
            `;
        }
        cardHtml += `
                    </div>
        `;
        
        // Add card footer for semester stats
        if (sTcGpa > 0 || coursesInSem.length > 0) {
            cardHtml += `
                    <div class="mt-4 pt-3 border-t border-gray-100 flex justify-between items-center text-sm bg-gray-50 -mx-3 -mb-3 px-3 py-2 rounded-b-lg">
                        <div><span class="text-gray-500">TC kỳ:</span> <span class="font-bold text-blue-700">${sTcGpa > 0 ? sTcGpa : 0}</span></div>
                        <div><span class="text-gray-500">ĐTB kỳ:</span> <span class="font-bold text-red-600">${sTcGpa > 0 ? sGpa.toFixed(2) : '0.00'}</span></div>
                    </div>
            `;
        }
        
        cardHtml += `
                </div>
            </div>
        `;
        mobileCardsHtml += cardHtml;

        // --- XỬ LÝ LOGIC TÍNH TOÁN ĐIỂM TÍCH LUỸ ---
        let accTcTotal = 0;
        let accTcGpa = 0;
        let accScoreGpa = 0;

        data.courses.forEach(c => {
            if (!c.tinhGPA) return;

            let maxScore = -1;
            let isPassed = false;

            for (let i = 0; i <= semIndex; i++) {
                let pastSem = data.semesters[i];
                let val = c.scores[pastSem];
                if (val) {
                    let isDat = val === 'Đ' || val.toLowerCase() === 'dat' || val.toLowerCase() === 'đạt';
                    let scoreNum = parseFloat(val);
                    
                    if (isDat) isPassed = true;
                    if (!isNaN(scoreNum)) {
                        if (scoreNum > maxScore) maxScore = scoreNum;
                    }
                }
            }
            
            // Theo Điều 15: Điểm học phần từ 5 điểm trở lên được đánh giá là đạt
            if (maxScore >= 5.0) {
                isPassed = true;
            }

            // Theo Điều 14, 17: Tích lũy tính từ đầu khóa học đối với các học phần đã đạt
            if (isPassed) {
                accTcTotal += c.tc;
                if (maxScore >= 5.0) {
                    accTcGpa += c.tc;
                    accScoreGpa += (maxScore * c.tc);
                }
            }
        });

        const aGpa = accTcGpa > 0 ? (accScoreGpa / accTcGpa) : 0;
        
        function getRanking(gpa) {
            if (gpa >= 9.0) return "Xuất sắc";
            if (gpa >= 8.0) return "Giỏi";
            if (gpa >= 7.0) return "Khá";
            if (gpa >= 5.5) return "Trung bình khá";
            if (gpa >= 5.0) return "Trung bình";
            return "Yếu kém";
        }

        footHtmlTc += `<td>${sTcGpa > 0 ? sTcGpa : ''}</td>`;
        footHtmlGpa += `<td>${sTcGpa > 0 ? sGpa.toFixed(2) : ''}</td>`;
        footHtmlAccTc += `<td>${accTcTotal > 0 ? accTcTotal : ''}</td>`;
        
        let rankStr = accTcGpa > 0 ? getRanking(aGpa) : "";
        footHtmlAccGpa += `<td>${accTcGpa > 0 ? aGpa.toFixed(2) + '<br><span class="text-xs font-normal text-gray-500">' + rankStr + '</span>' : ''}</td>`;
        
        if (semIndex === data.semesters.length - 1) {
            finalTcTotal = accTcTotal;
            finalGpa = accTcGpa > 0 ? aGpa.toFixed(2) : '0.00';
            if (accTcGpa > 0) finalGpa += ` <span class="text-sm font-normal text-gray-600">(${rankStr})</span>`;
        }
    });

    document.getElementById('cards-grid').innerHTML = mobileCardsHtml;
    
    footHtmlTc += `<td></td></tr>`;
    footHtmlGpa += `<td></td></tr>`;
    footHtmlAccTc += `<td></td></tr>`;
    footHtmlAccGpa += `<td></td></tr>`;
    tfoot.innerHTML = footHtmlTc + footHtmlGpa + footHtmlAccTc + footHtmlAccGpa;
    
    // Update mobile summary bar
    document.getElementById('mobile-total-tc').innerText = finalTcTotal > 0 ? finalTcTotal : '0';
    document.getElementById('mobile-total-gpa').innerHTML = finalGpa;
}

// Init
if (!data.hasInitialized) {
    saveData(false);
} else {
    // Save initial state for undo
    saveHistory();
    renderTable();
}
