document.addEventListener('DOMContentLoaded', function() {
    // عناصر DOM
    const loginContainer = document.getElementById('login-container');
    const appContainer = document.getElementById('app-container');
    const loginForm = document.getElementById('login-form');
    const logoutBtn = document.getElementById('logout-btn');
    const orderForm = document.getElementById('order-form');
    const ordersBody = document.getElementById('orders-body');
    const searchInput = document.getElementById('search-input');
    const clearSearchBtn = document.getElementById('clear-search');
    const loginError = document.getElementById('login-error');

    // كلمة المرور الصحيحة
    const CORRECT_PASSWORD = '6410';
    const LOGIN_KEY = 'orderSystemLoggedIn';

    // تحقق من حالة تسجيل الدخول عند تحميل الصفحة
    checkLoginStatus();

    // معالجة تسجيل الدخول
    loginForm.addEventListener('submit', function(e) {
        e.preventDefault();
        const enteredPassword = document.getElementById('password').value.trim();
        
        if (enteredPassword === CORRECT_PASSWORD) {
            // حفظ حالة تسجيل الدخول
            localStorage.setItem(LOGIN_KEY, 'true');
            showApp();
            loginError.style.display = 'none';
        } else {
            loginError.textContent = 'كلمة المرور غير صحيحة! الرجاء المحاولة مرة أخرى.';
            loginError.style.display = 'block';
            document.getElementById('password').value = '';
            document.getElementById('password').focus();
        }
    });

    // معالجة تسجيل الخروج
    logoutBtn.addEventListener('click', function() {
        localStorage.removeItem(LOGIN_KEY);
        showLogin();
        document.getElementById('password').value = '';
        document.getElementById('password').focus();
    });

    // معالجة إضافة طلب جديد
    orderForm.addEventListener('submit', function(e) {
        e.preventDefault();
        
        const orderId = document.getElementById('order-id').value.trim();
        const customerName = document.getElementById('customer-name').value.trim();
        const paymentStatus = document.querySelector('input[name="payment"]:checked').value;
        const orderStatus = document.getElementById('order-status').value;
        const deliveryStatus = document.getElementById('delivery-status').value;
        
        if (!orderId || !customerName) {
            showAlert('الرجاء إدخال جميع الحقول المطلوبة', 'error');
            return;
        }
        
        // إنشاء كائن الطلب
        const order = {
            id: orderId,
            customer: customerName,
            payment: paymentStatus,
            orderStatus: orderStatus,
            delivery: deliveryStatus,
            timestamp: new Date().toISOString()
        };
        
        // حفظ الطلب في localStorage
        saveOrder(order);
        
        // عرض الطلب في الجدول
        displayOrders();
        
        // إعادة تعيين النموذج
        orderForm.reset();
        
        // إظهار رسالة نجاح
        showAlert('تم حفظ الطلب بنجاح!', 'success');
    });

    // معالجة البحث
    searchInput.addEventListener('input', function() {
        displayOrders(this.value);
    });

    // مسح البحث
    clearSearchBtn.addEventListener('click', function() {
        searchInput.value = '';
        displayOrders();
        searchInput.focus();
    });

    // وظائف مساعدة
    function checkLoginStatus() {
        const isLoggedIn = localStorage.getItem(LOGIN_KEY) === 'true';
        if (isLoggedIn) {
            showApp();
        } else {
            showLogin();
        }
    }

    function showApp() {
        loginContainer.style.display = 'none';
        appContainer.style.display = 'block';
        displayOrders();
    }

    function showLogin() {
        loginContainer.style.display = 'block';
        appContainer.style.display = 'none';
        document.getElementById('password').focus();
    }

    function saveOrder(order) {
        let orders = JSON.parse(localStorage.getItem('orders')) || [];
        // التأكد من عدم وجود طلب بنفس الرقم
        const existingOrderIndex = orders.findIndex(o => o.id === order.id);
        
        if (existingOrderIndex !== -1) {
            orders[existingOrderIndex] = order; // تحديث الطلب الموجود
        } else {
            orders.push(order); // إضافة طلب جديد
        }
        
        localStorage.setItem('orders', JSON.stringify(orders));
    }

    function displayOrders(searchTerm = '') {
        let orders = JSON.parse(localStorage.getItem('orders')) || [];
        
        // تصفية الطلبات إذا كان هناك بحث
        if (searchTerm) {
            const term = searchTerm.toLowerCase();
            orders = orders.filter(order => 
                order.id.toLowerCase().includes(term) || 
                order.customer.toLowerCase().includes(term)
            );
        }
        
        // عرض الطلبات في الجدول
        ordersBody.innerHTML = '';
        
        if (orders.length === 0) {
            const row = document.createElement('tr');
            row.innerHTML = `<td colspan="6" style="text-align: center; padding: 20px;">لا توجد طلبات مسجلة</td>`;
            ordersBody.appendChild(row);
        } else {
            // ترتيب الطلبات من الأحدث إلى الأقدم
            orders.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
            
            orders.forEach(order => {
                const row = document.createElement('tr');
                row.innerHTML = `
                    <td>${order.id}</td>
                    <td>${order.customer}</td>
                    <td>${order.payment}</td>
                    <td>${order.orderStatus}</td>
                    <td>${order.delivery}</td>
                    <td>
                        <button class="action-btn delete-btn" data-id="${order.id}">حذف</button>
                    </td>
                `;
                ordersBody.appendChild(row);
            });
            
            // إضافة معالجات الأحداث لأزرار الحذف
            document.querySelectorAll('.delete-btn').forEach(btn => {
                btn.addEventListener('click', function() {
                    const orderId = this.getAttribute('data-id');
                    deleteOrder(orderId);
                });
            });
        }
    }

    function deleteOrder(orderId) {
        if (confirm('هل أنت متأكد من حذف هذا الطلب؟')) {
            let orders = JSON.parse(localStorage.getItem('orders')) || [];
            orders = orders.filter(order => order.id !== orderId);
            localStorage.setItem('orders', JSON.stringify(orders));
            displayOrders();
            showAlert('تم حذف الطلب بنجاح', 'success');
        }
    }

    function showAlert(message, type) {
        const alertDiv = document.createElement('div');
        alertDiv.className = `alert alert-${type}`;
        alertDiv.textContent = message;
        
        // إدراج التنبيه قبل النموذج
        orderForm.parentNode.insertBefore(alertDiv, orderForm);
        
        // إزالة التنبيه بعد 3 ثواني
        setTimeout(() => {
            alertDiv.remove();
        }, 3000);
    }
});