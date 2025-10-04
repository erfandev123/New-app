// Admin Panel JavaScript - Real-time Version
const API_BASE = 'http://localhost:5000';

// Global state
let currentSection = 'dashboard';
let users = [];
let services = [];
let orders = [];
let payments = [];
let currentUser = null;
let adminToken = null;

// Initialize admin panel
document.addEventListener('DOMContentLoaded', function() {
    initializeFirebaseAuth();
    initializeEventListeners();
});

// Firebase Authentication
function initializeFirebaseAuth() {
    // Check if already logged in with simple auth
    const savedToken = localStorage.getItem('adminToken');
    const savedUser = localStorage.getItem('adminUser');
    
    if (savedToken && savedUser) {
        try {
            adminToken = savedToken;
            currentUser = JSON.parse(savedUser);
            hideLoginModal();
            loadDashboardData();
            showSection('dashboard');
            return;
        } catch (e) {
            localStorage.removeItem('adminToken');
            localStorage.removeItem('adminUser');
        }
    }
    
    // Wait for Firebase to load
    setTimeout(() => {
        if (window.onAuthStateChanged && window.auth) {
            // Check if user is already logged in
            window.onAuthStateChanged(window.auth, (user) => {
                if (user) {
                    currentUser = user;
                    hideLoginModal();
                    getAdminToken().then(() => {
                        loadDashboardData();
                        showSection('dashboard');
                    }).catch(() => {
                        showLoginModal();
                    });
                } else {
                    showLoginModal();
                }
            });
        } else {
            // Fallback - just show login modal
            showLoginModal();
        }
    }, 1000);
}

async function getAdminToken() {
    try {
        adminToken = await currentUser.getIdToken();
        return adminToken;
    } catch (error) {
        console.error('Failed to get admin token:', error);
        throw error;
    }
}

function showLoginModal() {
    document.getElementById('login-modal').classList.remove('hidden');
}

function hideLoginModal() {
    document.getElementById('login-modal').classList.add('hidden');
}

async function handleAdminLogin(event) {
    event.preventDefault();
    
    const email = document.getElementById('admin-email').value;
    const password = document.getElementById('admin-password').value;
    const errorDiv = document.getElementById('login-error');
    
    try {
        errorDiv.classList.add('hidden');
        
        // Always try simple admin authentication first
        if (email === 'darkerfanx@gmail.com' && password === 'Erfanbnp123') {
            adminToken = 'simple-admin-token-' + Date.now();
            currentUser = { 
                email: email, 
                uid: 'admin-uid',
                getIdToken: () => Promise.resolve(adminToken)
            };
            
            // Save to localStorage for persistence
            localStorage.setItem('adminToken', adminToken);
            localStorage.setItem('adminUser', JSON.stringify(currentUser));
            
            console.log('Simple admin login successful, token:', adminToken);
            
            // Verify with backend
            try {
                const response = await fetch(`${API_BASE}/api/admin/verify`, {
                    headers: {
                        'Authorization': `Bearer ${adminToken}`,
                        'Content-Type': 'application/json'
                    }
                });
                
                if (response.ok) {
                    hideLoginModal();
                    loadDashboardData();
                    showSection('dashboard');
                    showNotification('Admin login successful!', 'success');
                    return;
                } else {
                    throw new Error('Backend verification failed');
                }
            } catch (verifyError) {
                console.error('Backend verification failed:', verifyError);
                // Continue with simple auth even if backend fails
                hideLoginModal();
                loadDashboardData();
                showSection('dashboard');
                showNotification('Admin login successful! (Offline Mode)', 'success');
                return;
            }
        }
        
        // Try Firebase authentication if simple auth fails
        if (window.signInWithEmailAndPassword && window.auth) {
            try {
                const userCredential = await window.signInWithEmailAndPassword(window.auth, email, password);
                const token = await userCredential.user.getIdToken();
                
                const response = await fetch(`${API_BASE}/api/admin/verify`, {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    }
                });
                
                if (!response.ok) {
                    throw new Error('Admin verification failed');
                }
                
                adminToken = token;
                currentUser = userCredential.user;
                
                // Save to localStorage
                localStorage.setItem('adminToken', adminToken);
                localStorage.setItem('adminUser', JSON.stringify({
                    email: currentUser.email,
                    uid: currentUser.uid
                }));
                
                hideLoginModal();
                loadDashboardData();
                showSection('dashboard');
                showNotification('Admin login successful!', 'success');
                return;
            } catch (firebaseError) {
                console.error('Firebase login failed:', firebaseError);
                throw firebaseError;
            }
        }
        
        throw new Error('Invalid admin credentials. Use: darkerfanx@gmail.com / Erfanbnp123');
        
    } catch (error) {
        console.error('Login failed:', error);
        
        let errorMessage = 'Invalid admin credentials. Please use: darkerfanx@gmail.com / Erfanbnp123';
        
        if (error.code === 'auth/wrong-password') {
            errorMessage = 'Incorrect password for admin account.';
        } else if (error.code === 'auth/invalid-email') {
            errorMessage = 'Invalid email format.';
        } else if (error.code === 'auth/user-not-found') {
            errorMessage = 'Admin account not found. Use: darkerfanx@gmail.com / Erfanbnp123';
        }
        
        errorDiv.textContent = errorMessage;
        errorDiv.classList.remove('hidden');
    }
}

async function handleLogout() {
    try {
        // Clear localStorage
        localStorage.removeItem('adminToken');
        localStorage.removeItem('adminUser');
        
        // Sign out from Firebase if available
        if (window.signOut && window.auth) {
            await window.signOut(window.auth);
        }
        
        currentUser = null;
        adminToken = null;
        showLoginModal();
        showNotification('Logged out successfully', 'success');
    } catch (error) {
        console.error('Logout failed:', error);
        // Force logout even if Firebase fails
        currentUser = null;
        adminToken = null;
        showLoginModal();
    }
}

function initializeEventListeners() {
    // Mobile menu toggle
    const mobileMenuBtn = document.getElementById('mobile-menu-btn');
    const sidebar = document.getElementById('sidebar');
    
    if (mobileMenuBtn && sidebar) {
        mobileMenuBtn.addEventListener('click', () => {
            sidebar.classList.toggle('-translate-x-full');
        });
    }

    // Login form
    document.getElementById('login-form').addEventListener('submit', handleAdminLogin);
    
    // Add balance form
    const balanceForm = document.getElementById('add-balance-form');
    if (balanceForm) {
        balanceForm.addEventListener('submit', handleAddBalance);
    }
    
    // User search
    const userSearch = document.getElementById('user-search');
    if (userSearch) {
        userSearch.addEventListener('input', filterUsers);
    }
}

// Optimized API Functions with caching and debouncing
const apiCache = new Map();
const CACHE_DURATION = 30000; // 30 seconds

function getCacheKey(method, endpoint, data) {
    return `${method}:${endpoint}:${JSON.stringify(data || {})}`;
}

async function apiRequest(method, endpoint, data = null, useCache = false) {
    console.log('Making API request:', method, endpoint);
    
    // Check cache for GET requests
    if (method === 'GET' && useCache) {
        const cacheKey = getCacheKey(method, endpoint, data);
        const cached = apiCache.get(cacheKey);
        if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
            console.log('Returning cached result for:', endpoint);
            return cached.data;
        }
    }
    
    const options = {
        method,
        headers: {
            'Content-Type': 'application/json'
        }
    };
    
    // Add authorization header if we have a token
    if (adminToken) {
        options.headers['Authorization'] = `Bearer ${adminToken}`;
        console.log('Added auth header with token:', adminToken.substring(0, 20) + '...');
    }
    
    if (data) {
        options.body = JSON.stringify(data);
        console.log('Request data:', data);
    }
    
    try {
        const response = await fetch(`${API_BASE}${endpoint}`, options);
        console.log('Response status:', response.status);
        
        // Handle non-JSON responses
        let result;
        try {
            result = await response.json();
            console.log('Response data:', result);
        } catch (jsonError) {
            console.error('Failed to parse JSON response:', jsonError);
            throw new Error('Invalid server response');
        }
        
        if (!response.ok) {
            console.error('API request failed:', response.status, result);
            throw new Error(result.error || `API request failed with status ${response.status}`);
        }
        
        // Cache GET requests
        if (method === 'GET' && useCache) {
            const cacheKey = getCacheKey(method, endpoint, data);
            apiCache.set(cacheKey, {
                data: result,
                timestamp: Date.now()
            });
        }
        
        return result;
    } catch (error) {
        console.error('API Error:', error);
        showNotification('Error: ' + error.message, 'error');
        throw error;
    }
}

// Removed mock data - using real API only

// Dashboard Functions
async function loadDashboardData() {
    try {
        console.log('Loading dashboard data with token:', adminToken ? 'Available' : 'Missing');
        
        // Ensure we have a token before making requests
        if (!adminToken) {
            console.error('No admin token available for dashboard data');
            showNotification('Authentication required. Please login again.', 'error');
            showLoginModal();
            return;
        }
        
        // Load users with caching
        try {
            const usersData = await apiRequest('GET', '/api/admin/users', null, true);
            displayUsers(usersData.users || []);
        } catch (error) {
            console.error('Failed to load users:', error);
            displayUsers([]);
        }
        
        // Load orders with caching
        try {
            const ordersData = await apiRequest('GET', '/api/admin/orders', null, true);
            displayOrders(ordersData.orders || []);
        } catch (error) {
            console.error('Failed to load orders:', error);
            displayOrders([]);
        }
        
        // Load services for price management with caching
        try {
            const servicesData = await apiRequest('GET', '/api/services', null, true);
            displayServices(servicesData || []);
        } catch (error) {
            console.error('Failed to load services:', error);
            displayServices([]);
        }
        
        showNotification('Dashboard loaded successfully', 'success');
    } catch (error) {
        console.error('Failed to load dashboard data:', error);
        showNotification('Dashboard loaded with limited data', 'warning');
        
        // Initialize with empty data
        displayUsers([]);
        displayOrders([]);
        displayServices([]);
    }
}

function updateDashboardStats() {
    document.getElementById('total-users').textContent = users.length;
    document.getElementById('total-services').textContent = services.length;
    document.getElementById('total-orders').textContent = orders.length;
    
    // Calculate revenue (sum of all completed orders)
    const revenue = orders
        .filter(order => order.status === 'Completed')
        .reduce((sum, order) => sum + parseFloat(order.charge || 0), 0);
    
    document.getElementById('total-revenue').textContent = `৳${revenue.toFixed(2)}`;
}

// Display functions
function displayUsers(usersData) {
    users = usersData || [];
    renderUsersTable();
    updateDashboardStats();
}

function displayOrders(ordersData) {
    orders = ordersData || [];
    renderOrdersTable();
    updateDashboardStats();
}

function displayServices(servicesData) {
    services = servicesData || [];
    renderServicesGrid();
    updateDashboardStats();
}

// User Management with Real API
async function loadUsers() {
    try {
        const response = await apiRequest('GET', '/api/admin/users');
        users = response.users || [];
        renderUsersTable();
        return users;
    } catch (error) {
        console.error('Failed to load users:', error);
        // Fallback to empty array if API fails
        users = [];
        renderUsersTable();
        return [];
    }
}

function renderUsersTable() {
    const tbody = document.getElementById('users-table');
    if (!tbody) return;
    
    tbody.innerHTML = '';
    
    if (!users || users.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" class="p-8 text-center text-gray-500">No users found</td></tr>';
        return;
    }
    
    users.forEach(user => {
        const row = document.createElement('tr');
        row.className = 'border-b hover:bg-gray-50';
        row.innerHTML = `
            <td class="p-3">
                <div class="flex items-center">
                    <div class="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white text-sm mr-3">
                        ${user.display_name ? user.display_name[0].toUpperCase() : 'U'}
                    </div>
                    <div>
                        <div class="font-medium">${user.display_name || 'Unknown'}</div>
                        <div class="text-sm text-gray-500">ID: ${user.id}</div>
                    </div>
                </div>
            </td>
            <td class="p-3">${user.email}</td>
            <td class="p-3">
                <span class="font-bold text-green-600">৳${parseFloat(user.balance || 0).toFixed(2)}</span>
            </td>
            <td class="p-3">
                <span class="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-sm">
                    ${orders.filter(o => o.user_id === user.id).length}
                </span>
            </td>
            <td class="p-3">
                <button onclick="addBalanceToUser('${user.email}')" class="bg-green-500 text-white px-3 py-1 rounded hover:bg-green-600 text-sm">
                    Add Balance
                </button>
            </td>
        `;
        tbody.appendChild(row);
    });
}

function filterUsers() {
    const searchTerm = document.getElementById('user-search').value.toLowerCase();
    const filteredUsers = users.filter(user => 
        user.email.toLowerCase().includes(searchTerm) ||
        (user.display_name && user.display_name.toLowerCase().includes(searchTerm))
    );
    
    // Re-render table with filtered users
    const tbody = document.getElementById('users-table');
    tbody.innerHTML = '';
    
    filteredUsers.forEach(user => {
        const row = document.createElement('tr');
        row.className = 'border-b hover:bg-gray-50';
        row.innerHTML = `
            <td class="p-3">
                <div class="flex items-center">
                    <div class="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white text-sm mr-3">
                        ${user.display_name ? user.display_name[0].toUpperCase() : 'U'}
                    </div>
                    <div>
                        <div class="font-medium">${user.display_name || 'Unknown'}</div>
                        <div class="text-sm text-gray-500">ID: ${user.id}</div>
                    </div>
                </div>
            </td>
            <td class="p-3">${user.email}</td>
            <td class="p-3">
                <span class="font-bold text-green-600">৳${parseFloat(user.balance || 0).toFixed(2)}</span>
            </td>
            <td class="p-3">
                <span class="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-sm">
                    ${orders.filter(o => o.user_id === user.id).length}
                </span>
            </td>
            <td class="p-3">
                <button onclick="addBalanceToUser('${user.email}')" class="bg-green-500 text-white px-3 py-1 rounded hover:bg-green-600 text-sm">
                    Add Balance
                </button>
            </td>
        `;
        tbody.appendChild(row);
    });
}

// Service Management with Price Customization
async function loadServices() {
    try {
        const response = await apiRequest('GET', '/api/services');
        services = response || [];
        console.log('Loaded services:', services.length);
        renderServicesGrid();
        return services;
    } catch (error) {
        console.error('Failed to load services:', error);
        services = [];
        renderServicesGrid();
        return [];
    }
}

async function updateServicePrice(serviceId, newRate) {
    try {
        console.log('Updating service price - ID:', serviceId, 'Rate:', newRate);
        
        const result = await apiRequest('PUT', `/api/admin/services/${serviceId}`, {
            rate: newRate
        });
        
        console.log('Service update result:', result);
        
        if (result.success) {
            showNotification(result.message || 'Service price updated successfully!', 'success');
            
            // Real-time update: reload services immediately
            await loadServices();
            updateDashboardStats();
        } else {
            throw new Error(result.error || 'Unknown error');
        }
    } catch (error) {
        console.error('Failed to update service price:', error);
        showNotification('Failed to update service price: ' + error.message, 'error');
    }
}

function renderServicesGrid() {
    const grid = document.getElementById('services-grid');
    if (!grid) return;
    
    grid.innerHTML = '';
    
    if (!services || services.length === 0) {
        grid.innerHTML = '<div class="col-span-full text-center text-gray-500 py-8">No services available</div>';
        return;
    }
    
    // Group services by category
    const servicesByCategory = {};
    services.forEach(service => {
        const category = service.category || 'General';
        if (!servicesByCategory[category]) {
            servicesByCategory[category] = [];
        }
        servicesByCategory[category].push(service);
    });
    
    // Render category sections
    Object.keys(servicesByCategory).forEach(category => {
        const categorySection = document.createElement('div');
        categorySection.className = 'col-span-full mb-6';
        categorySection.innerHTML = `
            <h3 class="text-lg font-semibold text-gray-800 mb-3 border-b pb-2">${category}</h3>
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4" id="category-${category.replace(/\s+/g, '-')}"></div>
        `;
        grid.appendChild(categorySection);
        
        const categoryGrid = document.getElementById(`category-${category.replace(/\s+/g, '-')}`);
        servicesByCategory[category].forEach(service => {
            const card = document.createElement('div');
            card.className = 'bg-gray-50 p-4 rounded-lg border hover:shadow-md transition-shadow';
            card.innerHTML = `
                <div class="flex items-start justify-between mb-3">
                    <div class="flex-1">
                        <h4 class="font-medium text-sm">${service.name || 'Unknown Service'}</h4>
                        <p class="text-xs text-gray-500 mt-1">${service.category || 'General'}</p>
                    </div>
                </div>
                <div class="grid grid-cols-2 gap-2 text-xs mb-3">
                    <div>
                        <span class="text-gray-500">Min:</span>
                        <span class="font-medium">${service.min ? service.min.toLocaleString() : 'N/A'}</span>
                    </div>
                    <div>
                        <span class="text-gray-500">Max:</span>
                        <span class="font-medium">${service.max ? service.max.toLocaleString() : 'N/A'}</span>
                    </div>
                </div>
                <div class="flex items-center justify-between">
                    <span class="font-bold text-green-600">৳${parseFloat(service.rate || 0).toFixed(4)}</span>
                    <button onclick="editService(${service.id})" class="bg-blue-500 text-white px-2 py-1 rounded text-xs hover:bg-blue-600">
                        Edit Price
                    </button>
                </div>
            `;
            categoryGrid.appendChild(card);
        });
    });
}

// Orders Management with Real Data
async function loadOrders() {
    try {
        const response = await apiRequest('GET', '/api/admin/orders');
        orders = response.orders || [];
        renderOrdersTable();
        return orders;
    } catch (error) {
        console.error('Failed to load orders:', error);
        orders = [];
        renderOrdersTable();
        return [];
    }
}

function renderOrdersTable() {
    const tbody = document.getElementById('orders-table');
    if (!tbody) return;
    
    tbody.innerHTML = '';
    
    if (!orders || orders.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" class="p-8 text-center text-gray-500">No orders found</td></tr>';
        return;
    }
    
    orders.forEach(order => {
        const row = document.createElement('tr');
        row.className = 'border-b hover:bg-gray-50';
        row.innerHTML = `
            <td class="p-3">#${order.id}</td>
            <td class="p-3">${order.user_email || 'Unknown'}</td>
            <td class="p-3">${order.service_name || 'Unknown Service'}</td>
            <td class="p-3">৳${parseFloat(order.charge || 0).toFixed(2)}</td>
            <td class="p-3">
                <span class="px-2 py-1 rounded-full text-sm ${
                    order.status === 'Completed' ? 'bg-green-100 text-green-800' :
                    order.status === 'In progress' ? 'bg-blue-100 text-blue-800' :
                    order.status === 'Pending' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-red-100 text-red-800'
                }">
                    ${order.status || 'Unknown'}
                </span>
            </td>
            <td class="p-3">
                <button onclick="viewOrderDetails(${order.id})" class="bg-blue-500 text-white px-2 py-1 rounded text-sm hover:bg-blue-600">
                    View
                </button>
            </td>
        `;
        tbody.appendChild(row);
    });
}

function viewOrderDetails(orderId) {
    const order = orders.find(o => o.id === orderId);
    if (order) {
        alert(`Order Details:\nID: ${order.id}\nUser: ${order.user_email}\nService: ${order.service_name}\nAmount: ৳${order.charge}\nStatus: ${order.status}`);
    }
}

// Balance Management
function addBalanceToUser(email) {
    document.getElementById('balance-email').value = email;
    showAddUserModal();
}

async function handleAddBalance(event) {
    event.preventDefault();
    
    const email = document.getElementById('balance-email').value;
    const amount = parseFloat(document.getElementById('balance-amount').value);
    
    if (!email || !amount || amount <= 0) {
        showNotification('Please enter valid email and amount', 'error');
        return;
    }
    
    try {
        showLoading();
        console.log('Adding balance - Email:', email, 'Amount:', amount);
        
        const result = await apiRequest('POST', '/api/admin/topup', {
            email: email,
            amount: amount
        });
        
        console.log('Balance add result:', result);
        
        if (result.success) {
            showNotification(result.message || `Successfully added ৳${amount} to ${email}`, 'success');
            hideAddUserModal();
            
            // Refresh users data in real-time
            await loadUsers();
            updateDashboardStats();
        } else {
            throw new Error(result.error || 'Unknown error');
        }
        
        hideLoading();
    } catch (error) {
        console.error('Failed to add balance:', error);
        showNotification('Failed to add balance: ' + error.message, 'error');
        hideLoading();
    }
}

// UI Functions
function showSection(sectionName) {
    // Hide all sections
    document.querySelectorAll('[id$="-section"]').forEach(section => {
        section.classList.add('hidden');
    });
    
    // Show selected section
    document.getElementById(`${sectionName}-section`).classList.remove('hidden');
    
    // Update page title
    const titles = {
        dashboard: 'Dashboard',
        users: 'User Management',
        services: 'Service Management',
        orders: 'Orders Management',
        payments: 'Payments Management',
        analytics: 'Analytics'
    };
    
    document.getElementById('page-title').textContent = titles[sectionName] || 'Admin Panel';
    
    // Update active sidebar item
    document.querySelectorAll('.sidebar-item').forEach(item => {
        item.classList.remove('bg-gradient-to-r', 'from-blue-500', 'to-purple-500', 'text-white');
    });
    
    const activeItem = document.querySelector(`[onclick="showSection('${sectionName}')"]`);
    if (activeItem) {
        activeItem.classList.add('bg-gradient-to-r', 'from-blue-500', 'to-purple-500', 'text-white');
    }
    
    currentSection = sectionName;
    
    // Load section-specific data
    switch (sectionName) {
        case 'users':
            loadUsers();
            break;
        case 'services':
            loadServices();
            break;
        case 'orders':
            loadOrders();
            break;
    }
}

function showAddUserModal() {
    document.getElementById('add-balance-modal').classList.remove('hidden');
}

function hideAddUserModal() {
    document.getElementById('add-balance-modal').classList.add('hidden');
    document.getElementById('add-balance-form').reset();
}

function showLoading() {
    // You can implement a loading spinner here
    console.log('Loading...');
}

function hideLoading() {
    console.log('Loading complete');
}

function showNotification(message, type = 'info') {
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `fixed top-4 right-4 p-4 rounded-lg text-white z-50 ${
        type === 'success' ? 'bg-green-500' : 
        type === 'error' ? 'bg-red-500' : 'bg-blue-500'
    }`;
    notification.textContent = message;
    
    document.body.appendChild(notification);
    
    // Auto remove after 3 seconds
    setTimeout(() => {
        notification.remove();
    }, 3000);
}

async function editService(serviceId) {
    const service = services.find(s => s.id === serviceId);
    if (!service) return;
    
    const newRate = prompt(`Edit price for ${service.name}\nCurrent rate: ৳${service.rate}`, service.rate);
    if (newRate && !isNaN(newRate) && parseFloat(newRate) > 0) {
        try {
            // Update via real API
            await updateServicePrice(serviceId, newRate);
            
            // Update local data after successful API call
            service.rate = parseFloat(newRate).toFixed(4);
            renderServicesGrid();
            updateDashboardStats();
        } catch (error) {
            console.error('Failed to update service price:', error);
        }
    }
}

// Close mobile menu when clicking outside
document.addEventListener('click', (e) => {
    const sidebar = document.getElementById('sidebar');
    const mobileMenuBtn = document.getElementById('mobile-menu-btn');
    
    if (!sidebar.contains(e.target) && !mobileMenuBtn.contains(e.target)) {
        sidebar.classList.add('-translate-x-full');
    }
});
