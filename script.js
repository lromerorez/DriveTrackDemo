// script.js

// --- 1. Variables Globales y Datos de Simulación ---
const ADMIN_USERNAME = 'admin';
const ADMIN_PASSWORD = 'password';

// Datos de conductores para simular logins de conductor
const DRIVER_CREDENTIALS = [
    { username: 'driver1', password: 'pass123', id: 'd001' },
    { username: 'driver2', password: 'pass456', id: 'd002' },
    { username: 'driver3', password: 'pass789', id: 'd003' }, // Conductor con vehículo asignado
    { username: 'driver4', password: 'pass101', id: 'd004' }, // Conductor sin vehículo
];

let currentUser = null; // Almacena el ID del usuario logueado (admin o driver ID)
let currentRole = null; // 'admin' o 'driver'

let vehicles = [];
let drivers = [];
let accounts = []; // { id, driverId, vehicleId, period, calculatedAmount, finalAmount, deductions: [], status: 'pending'/'approved', approvalDate }
let notifications = []; // Las notificaciones se compartirán pero se filtrarán por rol/usuario

// Cargar datos al iniciar desde LocalStorage o usar datos predefinidos
function loadData() {
    const storedVehicles = localStorage.getItem('drivetrack_vehicles');
    const storedDrivers = localStorage.getItem('drivetrack_drivers');
    const storedAccounts = localStorage.getItem('drivetrack_accounts');
    const storedNotifications = localStorage.getItem('drivetrack_notifications');

    vehicles = storedVehicles ? JSON.parse(storedVehicles) : [
        { id: 'v001', plate: 'ABC-123', driverId: 'd001', bond: 500, weeklyFee: 150, lastServiceDate: '2025-01-15', lastServiceMileage: 120000, serviceIntervalKm: 10000, serviceIntervalMonths: 6, status: 'ok' },
        { id: 'v002', plate: 'DEF-456', driverId: 'd002', bond: 600, weeklyFee: 160, lastServiceDate: '2024-10-01', lastServiceMileage: 150000, serviceIntervalKm: 10000, serviceIntervalMonths: 6, status: 'warning' },
        { id: 'v003', plate: 'GHI-789', driverId: 'd003', bond: 450, weeklyFee: 140, lastServiceDate: '2025-05-20', lastServiceMileage: 90000, serviceIntervalKm: 10000, serviceIntervalMonths: 6, status: 'ok' },
        { id: 'v004', plate: 'JKL-012', driverId: null, bond: 550, weeklyFee: 155, lastServiceDate: '2024-06-01', lastServiceMileage: 180000, serviceIntervalKm: 10000, serviceIntervalMonths: 6, status: 'critical' },
    ];
    drivers = storedDrivers ? JSON.parse(storedDrivers) : [
        { id: 'd001', name: 'Juan Pérez', contact: '55 1234 5678', status: 'active' },
        { id: 'd002', name: 'María García', contact: '55 8765 4321', status: 'debt' },
        { id: 'd003', name: 'Carlos López', contact: '55 1122 3344', status: 'active' },
        { id: 'd004', name: 'Ana Ramírez', contact: '55 9988 7766', status: 'no-vehicle' },
    ];
    accounts = storedAccounts ? JSON.parse(storedAccounts) : [
        { id: 'acc001', driverId: 'd001', vehicleId: 'v001', period: 'Semana 26 - 2025', calculatedAmount: 150, finalAmount: 150, deductions: [], status: 'pending' },
        { id: 'acc002', driverId: 'd002', vehicleId: 'v002', period: 'Semana 26 - 2025', calculatedAmount: 160, finalAmount: 160, deductions: [{description: 'Multa tránsito', amount: 50}], status: 'pending' },
        { id: 'acc003', driverId: 'd003', vehicleId: 'v003', period: 'Semana 25 - 2025', calculatedAmount: 140, finalAmount: 140, deductions: [], status: 'approved', approvalDate: '2025-07-01' },
    ];
    notifications = storedNotifications ? JSON.parse(storedNotifications) : [
        { id: Date.now(), message: 'Bienvenido a DriveTrack.', timestamp: new Date().toLocaleString(), role: 'all' }
    ];
}

function saveData() {
    localStorage.setItem('drivetrack_vehicles', JSON.stringify(vehicles));
    localStorage.setItem('drivetrack_drivers', JSON.stringify(drivers));
    localStorage.setItem('drivetrack_accounts', JSON.stringify(accounts));
    localStorage.setItem('drivetrack_notifications', JSON.stringify(notifications));
}

function generateUniqueId(prefix) {
    return prefix + Date.now().toString(36) + Math.random().toString(36).substr(2, 5);
}

// Añadido 'role' al añadir notificación
function addNotification(message, role = 'admin', userId = null) {
    const newNotification = {
        id: generateUniqueId('notif'),
        message: message,
        timestamp: new Date().toLocaleString(),
        role: role, // 'admin', 'driver', 'all'
        userId: userId // ID del conductor si es una notificación específica
    };
    notifications.unshift(newNotification); // Añadir al principio
    if (notifications.length > 20) { // Mantener un historial más largo
        notifications.pop();
    }
    updateNotificationDropdown(); // Actualiza el dropdown activo
    saveData();
}

// --- 2. Elementos del DOM ---
const loginContainer = document.getElementById('login-container');
const adminAppContainer = document.getElementById('admin-app-container'); // Nuevo
const driverAppContainer = document.getElementById('driver-app-container'); // Nuevo
const loginForm = document.getElementById('login-form');
const loginMessage = document.getElementById('login-message');

// Admin Elements
const logoutButtonAdmin = document.getElementById('logout-button-admin');
const navLinksAdmin = document.querySelectorAll('#admin-app-container .nav-menu a');
const appSectionsAdmin = document.querySelectorAll('#admin-app-container .app-section');
const adminHeaderTitle = document.getElementById('admin-header-title');
const notificationIconAdmin = document.querySelector('#admin-app-container .notification-icon');
const notificationBadgeAdmin = document.getElementById('notification-badge-admin');
const notificationDropdownAdmin = document.getElementById('notification-dropdown-admin');
const notificationListAdmin = document.getElementById('notification-list-admin');

// Dashboard Elements (Admin)
const totalCarsEl = document.getElementById('total-cars');
const totalDriversEl = document.getElementById('total-drivers');
const pendingAccountsEl = document.getElementById('pending-accounts');
const upcomingServicesEl = document.getElementById('upcoming-services');

// Vehicles Elements (Admin)
const addVehicleBtn = document.getElementById('add-vehicle-btn');
const vehiclesTableBody = document.querySelector('#vehicles-table tbody');
const addVehicleModal = document.getElementById('add-vehicle-modal');
const addVehicleForm = document.getElementById('add-vehicle-form');
const newDriverAssignSelect = document.getElementById('new-driver-assign');
const closeVehicleModalBtn = addVehicleModal.querySelector('.close-modal-btn');

// Drivers Elements (Admin)
const addDriverBtn = document.getElementById('add-driver-btn');
const driversTableBody = document.querySelector('#drivers-table tbody');
const addDriverModal = document.getElementById('add-driver-modal');
const addDriverForm = document.getElementById('add-driver-form');
const closeDriverModalBtn = addDriverModal.querySelector('.close-modal-btn');

// Accounts Elements (Admin)
const pendingAccountsList = document.getElementById('pending-accounts-list');
const approvedAccountsTableBody = document.querySelector('#approved-accounts-table tbody');
const reviewAccountModal = document.getElementById('review-account-modal');
const closeReviewAccountModalBtn = reviewAccountModal.querySelector('.close-modal-btn');
const reviewAccountDriver = document.getElementById('review-account-driver');
const reviewAccountPeriod = document.getElementById('review-account-period');
const reviewAccountAmount = document.getElementById('review-account-amount');
const deductionsList = document.getElementById('deductions-list');
const newDeductionDesc = document.getElementById('new-deduction-desc');
const newDeductionAmount = document.getElementById('new-deduction-amount');
const addDeductionBtn = document.getElementById('add-deduction-btn');
const approveAccountBtn = document.getElementById('approve-account-btn');
const generateNewAccountsBtn = document.getElementById('generate-new-accounts-btn');

let currentEditingAccount = null; // Para manejar la cuenta que se está editando

// Alerts Elements (Admin)
const maintenanceAlertsList = document.getElementById('maintenance-alerts-list');
const noAlertsMessageAdmin = document.querySelector('#alerts-section .no-alerts-message');


// --- Driver Elements (NUEVOS) ---
const logoutButtonDriver = document.getElementById('logout-button-driver');
const navLinksDriver = document.querySelectorAll('#driver-app-container .nav-menu a');
const appSectionsDriver = document.querySelectorAll('#driver-app-container .app-section');
const driverHeaderTitle = document.getElementById('driver-header-title');
const currentDriverNameEl = document.getElementById('current-driver-name');
const driverDashboardNameEl = document.getElementById('driver-dashboard-name');
const notificationIconDriver = document.querySelector('#driver-app-container .notification-icon');
const notificationBadgeDriver = document.getElementById('notification-badge-driver');
const notificationDropdownDriver = document.getElementById('notification-dropdown-driver');
const notificationListDriver = document.getElementById('notification-list-driver');
const noNotificationsMessageDriver = document.querySelector('#driver-app-container .no-notifications');


// Driver Dashboard Elements
const driverPendingAccountsEl = document.getElementById('driver-pending-accounts');
const driverUpcomingServiceEl = document.getElementById('driver-upcoming-service');

// Driver Vehicle Elements
const driverVehicleDetails = document.getElementById('driver-vehicle-details');
const driverVehiclePlate = document.getElementById('driver-vehicle-plate');
const driverVehicleBond = document.getElementById('driver-vehicle-bond');
const driverVehicleFee = document.getElementById('driver-vehicle-fee');
const driverVehicleLastService = document.getElementById('driver-vehicle-last-service');
const driverVehicleLastMileage = document.getElementById('driver-vehicle-last-mileage');
const driverVehicleStatus = document.getElementById('driver-vehicle-status');
const noVehicleAssignedMessage = document.getElementById('no-vehicle-assigned');

// Driver Accounts Elements
const driverPendingAccountsList = document.getElementById('driver-pending-accounts-list');
const driverApprovedAccountsTableBody = document.getElementById('driver-approved-accounts-table').querySelector('tbody');

// Driver Alerts Elements
const driverMaintenanceAlertsList = document.getElementById('driver-maintenance-alerts-list');
const noAlertsMessageDriver = document.querySelector('#driver-alerts-section .no-alerts-message');


// --- 3. Funciones de Renderizado y Lógica ---

// --- Core UI & Navigation ---
function showSection(sectionId, role) {
    // Ocultar todos los contenedores de rol
    adminAppContainer.classList.add('hidden');
    driverAppContainer.classList.add('hidden');

    // Ocultar todas las secciones dentro del rol activo
    const currentAppSections = role === 'admin' ? appSectionsAdmin : appSectionsDriver;
    currentAppSections.forEach(section => {
        section.classList.add('hidden');
    });

    // Mostrar el contenedor de rol correcto
    if (role === 'admin') {
        adminAppContainer.classList.remove('hidden');
        // Actualizar el título de la cabecera del admin
        adminHeaderTitle.textContent = document.querySelector(`#${sectionId}`).querySelector('h2') ? document.querySelector(`#${sectionId}`).querySelector('h2').textContent : 'Dashboard';
        // Actualizar active class en nav links del admin
        navLinksAdmin.forEach(link => {
            link.classList.remove('active');
            if (link.dataset.section === sectionId.replace('-section', '')) {
                link.classList.add('active');
            }
        });
    } else if (role === 'driver') {
        driverAppContainer.classList.remove('hidden');
        // Actualizar el título de la cabecera del conductor
        driverHeaderTitle.textContent = document.querySelector(`#${sectionId}`).querySelector('h2') ? document.querySelector(`#${sectionId}`).querySelector('h2').textContent : 'Mi Panel';
        // Actualizar active class en nav links del conductor
        navLinksDriver.forEach(link => {
            link.classList.remove('active');
            if (link.dataset.section === sectionId.replace('-section', '')) {
                link.classList.add('active');
            }
        });
    }

    // Mostrar la sección activa
    document.getElementById(sectionId).classList.remove('hidden');

    // Rerenderizar la sección activa según el rol
    if (role === 'admin') {
        if (sectionId === 'dashboard-section') renderAdminDashboard();
        if (sectionId === 'vehicles-section') renderVehicles();
        if (sectionId === 'drivers-section') renderDrivers();
        if (sectionId === 'accounts-section') renderAdminAccounts();
        if (sectionId === 'alerts-section') renderAdminAlerts();
    } else if (role === 'driver') {
        if (sectionId === 'driver-dashboard-section') renderDriverDashboard();
        if (sectionId === 'driver-vehicle-section') renderDriverVehicle();
        if (sectionId === 'driver-accounts-section') renderDriverAccounts();
        if (sectionId === 'driver-alerts-section') renderDriverAlerts();
    }
}

// Función para actualizar el dropdown de notificaciones según el rol y usuario
function updateNotificationDropdown() {
    // Para Admin
    notificationListAdmin.innerHTML = '';
    const adminNotifications = notifications.filter(n => n.role === 'admin' || n.role === 'all');
    if (adminNotifications.length === 0) {
        notificationDropdownAdmin.querySelector('.no-notifications').classList.remove('hidden');
        notificationBadgeAdmin.classList.add('hidden');
    } else {
        notificationDropdownAdmin.querySelector('.no-notifications').classList.add('hidden');
        adminNotifications.forEach(notif => {
            const li = document.createElement('li');
            li.innerHTML = `<strong>${notif.message}</strong> <br><small>${notif.timestamp}</small>`;
            notificationListAdmin.appendChild(li);
        });
        notificationBadgeAdmin.textContent = adminNotifications.length;
        notificationBadgeAdmin.classList.remove('hidden');
    }

    // Para Conductor (solo si hay un conductor logueado)
    if (currentRole === 'driver' && currentUser) {
        notificationListDriver.innerHTML = '';
        const driverNotifications = notifications.filter(n => n.role === 'all' || (n.role === 'driver' && n.userId === currentUser));
        if (driverNotifications.length === 0) {
            noNotificationsMessageDriver.classList.remove('hidden');
            notificationBadgeDriver.classList.add('hidden');
        } else {
            noNotificationsMessageDriver.classList.add('hidden');
            driverNotifications.forEach(notif => {
                const li = document.createElement('li');
                li.innerHTML = `<strong>${notif.message}</strong> <br><small>${notif.timestamp}</small>`;
                notificationListDriver.appendChild(li);
            });
            notificationBadgeDriver.textContent = driverNotifications.length;
            notificationBadgeDriver.classList.remove('hidden');
        }
    }
}


// --- Admin Panel Functions ---
function renderAdminDashboard() {
    totalCarsEl.textContent = vehicles.length;
    totalDriversEl.textContent = drivers.length;
    pendingAccountsEl.textContent = accounts.filter(acc => acc.status === 'pending').length;

    const upcoming = getMaintenanceAlerts().filter(alert => alert.status !== 'critical').length;
    const critical = getMaintenanceAlerts().filter(alert => alert.status === 'critical').length;
    upcomingServicesEl.textContent = `${upcoming} (${critical} urgentes)`;
}

function renderVehicles() {
    vehiclesTableBody.innerHTML = '';
    vehicles.forEach(vehicle => {
        const driver = drivers.find(d => d.id === vehicle.driverId);
        const serviceStatusClass = {
            'ok': 'status-ok',
            'warning': 'status-warning',
            'critical': 'status-critical'
        }[vehicle.status] || '';

        const row = vehiclesTableBody.insertRow();
        row.innerHTML = `
            <td>${vehicle.plate}</td>
            <td>${driver ? driver.name : 'Sin asignar'}</td>
            <td>$${vehicle.bond.toFixed(2)}</td>
            <td>$${vehicle.weeklyFee.toFixed(2)}</td>
            <td><span class="status-badge ${serviceStatusClass}">${vehicle.status.toUpperCase()}</span></td>
            <td class="table-actions">
                <button data-id="${vehicle.id}" class="edit-vehicle-btn" title="Editar"><span class="material-icons">edit</span></button>
                <button data-id="${vehicle.id}" class="delete-btn delete-vehicle-btn" title="Eliminar"><span class="material-icons">delete</span></button>
            </td>
        `;
    });

    populateDriverSelect(newDriverAssignSelect); // Actualizar select de conductores en el modal
}

function populateDriverSelect(selectElement, selectedDriverId = null) {
    selectElement.innerHTML = '<option value="">Sin Asignar</option>';
    drivers.forEach(driver => {
        const option = document.createElement('option');
        option.value = driver.id;
        option.textContent = driver.name;
        if (driver.id === selectedDriverId) {
            option.selected = true;
        }
        selectElement.appendChild(option);
    });
}


function renderDrivers() {
    driversTableBody.innerHTML = '';
    drivers.forEach(driver => {
        const row = driversTableBody.insertRow();
        row.innerHTML = `
            <td>${driver.name}</td>
            <td>${driver.contact}</td>
            <td>${driver.status.toUpperCase()}</td>
            <td class="table-actions">
                <button data-id="${driver.id}" class="edit-driver-btn" title="Editar"><span class="material-icons">edit</span></button>
                <button data-id="${driver.id}" class="delete-btn delete-driver-btn" title="Eliminar"><span class="material-icons">delete</span></button>
            </td>
        `;
    });
}

function renderAdminAccounts() {
    pendingAccountsList.innerHTML = '';
    approvedAccountsTableBody.innerHTML = '';

    const pending = accounts.filter(acc => acc.status === 'pending');
    const approved = accounts.filter(acc => acc.status === 'approved');

    if (pending.length === 0) {
        pendingAccountsList.innerHTML = '<p class="no-notifications">No hay cuentas pendientes de aprobación.</p>';
    } else {
        pending.forEach(account => {
            const driver = drivers.find(d => d.id === account.driverId);
            const accountDiv = document.createElement('div');
            accountDiv.classList.add('todo-item');
            accountDiv.innerHTML = `
                <div class="todo-item-info">
                    <h4>Cuenta de ${driver ? driver.name : 'Desconocido'}</h4>
                    <p>Período: ${account.period}</p>
                    <p>Monto Calculado: $${account.calculatedAmount.toFixed(2)}</p>
                </div>
                <div class="todo-item-actions">
                    <button class="edit-btn" data-id="${account.id}">Editar/Revisar</button>
                    <button class="approve-btn" data-id="${account.id}">Aprobar</button>
                </div>
            `;
            pendingAccountsList.appendChild(accountDiv);
        });
    }

    approved.forEach(account => {
        const driver = drivers.find(d => d.id === account.driverId);
        const deductionsText = account.deductions.map(d => `${d.description} ($${d.amount.toFixed(2)})`).join(', ') || 'Ninguna';
        const row = approvedAccountsTableBody.insertRow();
        row.innerHTML = `
            <td>${driver ? driver.name : 'Desconocido'}</td>
            <td>${account.period}</td>
            <td>$${account.finalAmount.toFixed(2)}</td>
            <td>${deductionsText}</td>
            <td>${account.approvalDate || 'N/A'}</td>
        `;
    });
}

function openReviewAccountModal(accountId) {
    currentEditingAccount = accounts.find(acc => acc.id === accountId);
    if (!currentEditingAccount) return;

    const driver = drivers.find(d => d.id === currentEditingAccount.driverId);
    reviewAccountDriver.textContent = driver ? driver.name : 'Desconocido';
    reviewAccountPeriod.textContent = currentEditingAccount.period;
    reviewAccountAmount.value = currentEditingAccount.finalAmount.toFixed(2);
    renderDeductions(currentEditingAccount.deductions);

    reviewAccountModal.classList.remove('hidden');
}

function renderDeductions(deductions) {
    deductionsList.innerHTML = '';
    deductions.forEach((deduction, index) => {
        const div = document.createElement('div');
        div.classList.add('deduction-item');
        div.innerHTML = `
            <span>${deduction.description}: $${deduction.amount.toFixed(2)}</span>
            <button data-index="${index}"><span class="material-icons">close</span></button>
        `;
        deductionsList.appendChild(div);
    });

    // Añadir listener para eliminar deducción
    deductionsList.querySelectorAll('.deduction-item button').forEach(button => {
        button.onclick = (e) => {
            const index = parseInt(e.target.closest('button').dataset.index);
            currentEditingAccount.deductions.splice(index, 1);
            updateAccountFinalAmount();
            renderDeductions(currentEditingAccount.deductions);
        };
    });
}

function updateAccountFinalAmount() {
    let baseAmount = parseFloat(reviewAccountAmount.value) || 0;
    const totalDeductions = currentEditingAccount.deductions.reduce((sum, d) => sum + d.amount, 0);
    currentEditingAccount.finalAmount = baseAmount - totalDeductions;
}

function generateSimulatedAccounts() {
    // Generar cuentas para vehículos sin cuenta reciente para la semana actual
    const today = new Date();
    const currentWeekNumber = Math.ceil((((today - new Date(today.getFullYear(), 0, 1)) / 86400000) + 1) / 7);
    const currentYear = today.getFullYear();
    const currentPeriod = `Semana ${currentWeekNumber} - ${currentYear}`;

    vehicles.forEach(vehicle => {
        const hasRecentAccount = accounts.some(acc =>
            acc.vehicleId === vehicle.id && acc.period === currentPeriod
        );

        if (!hasRecentAccount && vehicle.driverId) { // Solo si tiene conductor asignado
            accounts.push({
                id: generateUniqueId('acc'),
                driverId: vehicle.driverId,
                vehicleId: vehicle.id,
                period: currentPeriod,
                calculatedAmount: vehicle.weeklyFee,
                finalAmount: vehicle.weeklyFee,
                deductions: [],
                status: 'pending'
            });
            addNotification(`Nueva cuenta generada para ${vehicle.plate} (${currentPeriod})`, 'admin');
            addNotification(`Tienes una nueva cuenta semanal pendiente de revisión para el período ${currentPeriod}.`, 'driver', vehicle.driverId);
        }
    });
    saveData();
    renderAdminAccounts();
    renderAdminDashboard();
    if (currentRole === 'driver') renderDriverDashboard(); // Para actualizar el panel del conductor si está logueado
}


function getMaintenanceAlerts() {
    const alerts = [];
    const today = new Date();

    vehicles.forEach(vehicle => {
        const lastService = new Date(vehicle.lastServiceDate);
        const daysSinceLastService = (today - lastService) / (1000 * 60 * 60 * 24);
        const monthsSinceLastService = daysSinceLastService / 30.44; // Promedio de días por mes

        // Simulación de kilometraje (asumir un incremento constante para el prototipo)
        const kmDrivenSinceService = (daysSinceLastService * 100); // 100 km por día
        const currentMileage = vehicle.lastServiceMileage + kmDrivenSinceService;

        let alertStatus = 'ok';
        let alertMessage = '';

        // Alerta por kilometraje
        if (currentMileage >= (vehicle.lastServiceMileage + vehicle.serviceIntervalKm)) {
            alertStatus = 'critical';
            alertMessage += `Superado por ${(currentMileage - (vehicle.lastServiceMileage + vehicle.serviceIntervalKm)).toFixed(0)} km. `;
        } else if (currentMileage >= (vehicle.lastServiceMileage + vehicle.serviceIntervalKm * 0.9)) {
            if (alertStatus === 'ok') alertStatus = 'warning'; // No degradar de critical a warning
            alertMessage += `Próximo a mantenimiento por km (${((vehicle.lastServiceMileage + vehicle.serviceIntervalKm) - currentMileage).toFixed(0)} km restantes). `;
        }

        // Alerta por tiempo
        if (monthsSinceLastService >= vehicle.serviceIntervalMonths) {
            alertStatus = 'critical';
            alertMessage += `Superado por ${(monthsSinceLastService - vehicle.serviceIntervalMonths).toFixed(1)} meses.`;
        } else if (monthsSinceLastService >= vehicle.serviceIntervalMonths * 0.8) {
            if (alertStatus === 'ok') alertStatus = 'warning'; // No degradar de critical a warning
            alertMessage += `Próximo a mantenimiento por tiempo (${(vehicle.serviceIntervalMonths - monthsSinceLastService).toFixed(1)} meses restantes).`;
        }

        if (alertStatus !== 'ok') {
            alerts.push({
                id: vehicle.id,
                plate: vehicle.plate,
                message: alertMessage || 'Requiere revisión.',
                status: alertStatus,
                currentMileage: currentMileage.toFixed(0),
                driverId: vehicle.driverId // Para filtrar por conductor
            });
        }
    });
    return alerts;
}

function renderAdminAlerts() {
    const alerts = getMaintenanceAlerts();
    maintenanceAlertsList.innerHTML = '';

    if (alerts.length === 0) {
        noAlertsMessageAdmin.classList.remove('hidden');
    } else {
        noAlertsMessageAdmin.classList.add('hidden');
        alerts.forEach(alert => {
            const alertDiv = document.createElement('div');
            alertDiv.classList.add('maintenance-alert-item', alert.status);
            alertDiv.innerHTML = `
                <div>
                    <h4>Vehículo: ${alert.plate}</h4>
                    <p>${alert.message}</p>
                    <p>Kilometraje actual (simulado): ${alert.currentMileage} km</p>
                </div>
                <span class="alert-status">${alert.status.toUpperCase()}</span>
            `;
            maintenanceAlertsList.appendChild(alertDiv);
        });
    }
}

// --- Driver Panel Functions (NUEVAS) ---
function renderDriverDashboard() {
    const driver = drivers.find(d => d.id === currentUser);
    if (!driver) return; // No debería pasar si el login fue exitoso

    driverDashboardNameEl.textContent = driver.name;
    currentDriverNameEl.textContent = driver.name;

    const driverPendingAccounts = accounts.filter(acc => acc.driverId === currentUser && acc.status === 'pending').length;
    driverPendingAccountsEl.textContent = driverPendingAccounts;

    const assignedVehicle = vehicles.find(v => v.driverId === currentUser);
    if (assignedVehicle) {
        const vehicleAlerts = getMaintenanceAlerts().filter(alert => alert.id === assignedVehicle.id);
        if (vehicleAlerts.length > 0) {
            const criticalAlert = vehicleAlerts.find(a => a.status === 'critical');
            if (criticalAlert) {
                driverUpcomingServiceEl.textContent = `¡URGENTE! (${criticalAlert.message.split('.')[0]})`;
                driverUpcomingServiceEl.style.color = 'var(--accent-red)';
            } else {
                driverUpcomingServiceEl.textContent = `Próximo (${vehicleAlerts[0].message.split('.')[0]})`;
                driverUpcomingServiceEl.style.color = 'var(--accent-yellow)';
            }
        } else {
            driverUpcomingServiceEl.textContent = 'Servicio al día';
            driverUpcomingServiceEl.style.color = 'var(--accent-green)';
        }
    } else {
        driverUpcomingServiceEl.textContent = 'Sin vehículo asignado';
        driverUpcomingServiceEl.style.color = 'var(--text-secondary)';
    }
}

function renderDriverVehicle() {
    const assignedVehicle = vehicles.find(v => v.driverId === currentUser);
    if (assignedVehicle) {
        driverVehicleDetails.classList.remove('hidden');
        noVehicleAssignedMessage.classList.add('hidden');

        driverVehiclePlate.textContent = assignedVehicle.plate;
        driverVehicleBond.textContent = `$${assignedVehicle.bond.toFixed(2)}`;
        driverVehicleFee.textContent = `$${assignedVehicle.weeklyFee.toFixed(2)}`;
        driverVehicleLastService.textContent = assignedVehicle.lastServiceDate;
        driverVehicleLastMileage.textContent = assignedVehicle.lastServiceMileage;

        const serviceStatusClass = {
            'ok': 'status-ok',
            'warning': 'status-warning',
            'critical': 'status-critical'
        }[assignedVehicle.status] || '';
        driverVehicleStatus.textContent = assignedVehicle.status.toUpperCase();
        driverVehicleStatus.className = `status-badge ${serviceStatusClass}`;

    } else {
        driverVehicleDetails.classList.add('hidden');
        noVehicleAssignedMessage.classList.remove('hidden');
    }
}

function renderDriverAccounts() {
    driverPendingAccountsList.innerHTML = '';
    driverApprovedAccountsTableBody.innerHTML = '';

    const driverPending = accounts.filter(acc => acc.driverId === currentUser && acc.status === 'pending');
    const driverApproved = accounts.filter(acc => acc.driverId === currentUser && acc.status === 'approved');

    if (driverPending.length === 0) {
        driverPendingAccountsList.innerHTML = '<p class="no-notifications">No tienes cuentas pendientes de aprobación.</p>';
    } else {
        driverPending.forEach(account => {
            const accountDiv = document.createElement('div');
            accountDiv.classList.add('todo-item');
            accountDiv.innerHTML = `
                <div class="todo-item-info">
                    <h4>Cuenta Semanal</h4>
                    <p>Período: ${account.period}</p>
                    <p>Monto Calculado: $${account.calculatedAmount.toFixed(2)}</p>
                    <p>Deducciones: ${account.deductions.map(d => `${d.description} ($${d.amount.toFixed(2)})`).join(', ') || 'Ninguna'}</p>
                </div>
                <div class="todo-item-actions">
                    <button class="view-account-btn" data-id="${account.id}">Ver Detalle</button>
                </div>
            `;
            driverPendingAccountsList.appendChild(accountDiv);
        });
    }

    driverApproved.forEach(account => {
        const deductionsText = account.deductions.map(d => `${d.description} ($${d.amount.toFixed(2)})`).join(', ') || 'Ninguna';
        const row = driverApprovedAccountsTableBody.insertRow();
        row.innerHTML = `
            <td>${account.period}</td>
            <td>$${account.finalAmount.toFixed(2)}</td>
            <td>${deductionsText}</td>
            <td>${account.approvalDate || 'N/A'}</td>
        `;
    });
}

function renderDriverAlerts() {
    const alerts = getMaintenanceAlerts().filter(alert => alert.driverId === currentUser);
    driverMaintenanceAlertsList.innerHTML = '';

    if (alerts.length === 0) {
        noAlertsMessageDriver.classList.remove('hidden');
    } else {
        noAlertsMessageDriver.classList.add('hidden');
        alerts.forEach(alert => {
            const alertDiv = document.createElement('div');
            alertDiv.classList.add('maintenance-alert-item', alert.status);
            alertDiv.innerHTML = `
                <div>
                    <h4>Vehículo: ${alert.plate}</h4>
                    <p>${alert.message}</p>
                    <p>Kilometraje actual (simulado): ${alert.currentMileage} km</p>
                </div>
                <span class="alert-status">${alert.status.toUpperCase()}</span>
            `;
            driverMaintenanceAlertsList.appendChild(alertDiv);
        });
    }
}


// --- 4. Inicialización y Event Listeners ---
document.addEventListener('DOMContentLoaded', () => {
    loadData();
    updateNotificationDropdown(); // Inicializar dropdowns de notificaciones

    // --- Login Form Submission ---
    loginForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const username = document.getElementById('username').value;
        const password = document.getElementById('password').value;

        // Intentar login como ADMIN
        if (username === ADMIN_USERNAME && password === ADMIN_PASSWORD) {
            currentUser = 'admin';
            currentRole = 'admin';
            loginContainer.classList.add('hidden');
            adminAppContainer.classList.remove('hidden');
            addNotification('Sesión iniciada como Administrador.', 'admin');
            showSection('dashboard-section', 'admin'); // Muestra el dashboard del admin
            return; // Salir de la función
        }

        // Intentar login como CONDUCTOR
        const driverLogin = DRIVER_CREDENTIALS.find(d => d.username === username && d.password === password);
        if (driverLogin) {
            currentUser = driverLogin.id;
            currentRole = 'driver';
            loginContainer.classList.add('hidden');
            driverAppContainer.classList.remove('hidden');
            addNotification(`Sesión iniciada como Conductor (${drivers.find(d => d.id === currentUser).name}).`, 'driver', currentUser);
            showSection('driver-dashboard-section', 'driver'); // Muestra el dashboard del conductor
            return; // Salir de la función
        }

        // Si no coincide con ningún rol
        loginMessage.textContent = 'Usuario o contraseña incorrectos.';
    });

    // --- Logout Buttons ---
    logoutButtonAdmin.addEventListener('click', () => {
        adminAppContainer.classList.add('hidden');
        loginContainer.classList.remove('hidden');
        document.getElementById('username').value = '';
        document.getElementById('password').value = '';
        loginMessage.textContent = '';
        addNotification('Sesión de administrador cerrada.', 'admin');
        currentUser = null;
        currentRole = null;
    });

    logoutButtonDriver.addEventListener('click', () => {
        driverAppContainer.classList.add('hidden');
        loginContainer.classList.remove('hidden');
        document.getElementById('username').value = '';
        document.getElementById('password').value = '';
        loginMessage.textContent = '';
        addNotification('Sesión de conductor cerrada.', 'driver', currentUser);
        currentUser = null;
        currentRole = null;
    });

    // --- Navigation Links (Admin) ---
    navLinksAdmin.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const sectionId = link.dataset.section + '-section';
            showSection(sectionId, 'admin');
        });
    });

    // --- Navigation Links (Driver) ---
    navLinksDriver.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const sectionId = link.dataset.section + '-section';
            showSection(sectionId, 'driver');
        });
    });


    // --- Notifications Dropdown Toggle (Admin) ---
    notificationIconAdmin.addEventListener('click', (e) => {
        e.stopPropagation(); // Evita que el clic se propague y cierre inmediatamente
        notificationDropdownAdmin.classList.toggle('hidden');
    });

    // --- Notifications Dropdown Toggle (Driver) ---
    notificationIconDriver.addEventListener('click', (e) => {
        e.stopPropagation(); // Evita que el clic se propague y cierre inmediatamente
        notificationDropdownDriver.classList.toggle('hidden');
    });

    // Cerrar dropdown si se hace clic fuera (para ambos)
    document.addEventListener('click', (e) => {
        if (!notificationIconAdmin.contains(e.target) && !notificationDropdownAdmin.contains(e.target)) {
            notificationDropdownAdmin.classList.add('hidden');
        }
        if (currentRole === 'driver' && !notificationIconDriver.contains(e.target) && !notificationDropdownDriver.contains(e.target)) {
            notificationDropdownDriver.classList.add('hidden');
        }
    });


    // --- Vehicles Section Listeners (Admin) ---
    addVehicleBtn.addEventListener('click', () => {
        addVehicleModal.classList.remove('hidden');
        // Resetear formulario
        addVehicleForm.reset();
        populateDriverSelect(newDriverAssignSelect); // Asegurarse de que el select de conductores esté actualizado
    });

    closeVehicleModalBtn.addEventListener('click', () => {
        addVehicleModal.classList.add('hidden');
    });

    addVehicleForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const newVehicle = {
            id: generateUniqueId('v'),
            plate: document.getElementById('new-plate').value.toUpperCase(),
            driverId: document.getElementById('new-driver-assign').value || null,
            bond: parseFloat(document.getElementById('new-bond').value),
            weeklyFee: parseFloat(document.getElementById('new-fee').value),
            lastServiceDate: document.getElementById('new-service-date').value,
            lastServiceMileage: parseInt(document.getElementById('new-service-mileage').value),
            serviceIntervalKm: 10000, // Valor por defecto
            serviceIntervalMonths: 6, // Valor por defecto
            status: 'ok' // Nuevo vehículo empieza con servicio OK
        };
        vehicles.push(newVehicle);
        if (newVehicle.driverId) {
            // Actualizar el estado del conductor a 'active' si no lo estaba
            const driver = drivers.find(d => d.id === newVehicle.driverId);
            if (driver) driver.status = 'active';
            addNotification(`Vehículo ${newVehicle.plate} asignado a ${driver.name}.`, 'admin');
            addNotification(`Se te ha asignado el vehículo ${newVehicle.plate}.`, 'driver', newVehicle.driverId);
        } else {
            addNotification(`Vehículo ${newVehicle.plate} añadido (sin asignar).`, 'admin');
        }
        saveData();
        renderVehicles();
        renderAdminDashboard(); // Actualizar el dashboard
        if (currentRole === 'driver') renderDriverDashboard(); // Actualizar panel conductor si está logueado
        addVehicleModal.classList.add('hidden');
    });

    // Delegación de eventos para botones de tabla de vehículos (editar/eliminar)
    vehiclesTableBody.addEventListener('click', (e) => {
        if (e.target.closest('.delete-vehicle-btn')) {
            const vehicleIdToDelete = e.target.closest('button').dataset.id;
            if (confirm('¿Estás seguro de que quieres eliminar este vehículo?')) {
                const vehicle = vehicles.find(v => v.id === vehicleIdToDelete);
                if (vehicle && vehicle.driverId) {
                    // Si el vehículo tiene conductor asignado, desasignar al conductor
                    const driver = drivers.find(d => d.id === vehicle.driverId);
                    if (driver) driver.status = 'no-vehicle'; // O ajustar según tu lógica
                    addNotification(`Vehículo ${vehicle.plate} desasignado de ${driver.name}.`, 'admin');
                    addNotification(`El vehículo ${vehicle.plate} ha sido desasignado.`, 'driver', vehicle.driverId);
                }
                vehicles = vehicles.filter(v => v.id !== vehicleIdToDelete);
                addNotification(`Vehículo ${vehicle.plate} eliminado.`, 'admin');
                saveData();
                renderVehicles();
                renderAdminDashboard();
                if (currentRole === 'driver') renderDriverDashboard(); // Actualizar panel conductor si está logueado
            }
        }
        // TODO: Implementar edición de vehículo si se necesita en el prototipo
    });


    // --- Drivers Section Listeners (Admin) ---
    addDriverBtn.addEventListener('click', () => {
        addDriverModal.classList.remove('hidden');
        addDriverForm.reset();
    });

    closeDriverModalBtn.addEventListener('click', () => {
        addDriverModal.classList.add('hidden');
    });

    addDriverForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const newDriver = {
            id: generateUniqueId('d'),
            name: document.getElementById('new-driver-name').value,
            contact: document.getElementById('new-driver-contact').value,
            status: 'no-vehicle' // Nuevo conductor inicialmente sin vehículo
        };
        drivers.push(newDriver);
        // También añadir credenciales simuladas para este nuevo conductor
        DRIVER_CREDENTIALS.push({
            username: newDriver.name.toLowerCase().replace(/\s/g, ''), // Ej. juanperez
            password: 'password', // Contraseña por defecto
            id: newDriver.id
        });
        addNotification(`Conductor ${newDriver.name} añadido.`, 'admin');
        saveData();
        renderDrivers();
        renderAdminDashboard(); // Actualizar el dashboard
        addDriverModal.classList.add('hidden');
    });

    // Delegación de eventos para botones de tabla de conductores (eliminar)
    driversTableBody.addEventListener('click', (e) => {
        if (e.target.closest('.delete-driver-btn')) {
            const driverIdToDelete = e.target.closest('button').dataset.id;
            if (confirm('¿Estás seguro de que quieres eliminar este conductor?')) {
                // Verificar si el conductor tiene vehículos asignados antes de eliminar
                const hasVehicles = vehicles.some(v => v.driverId === driverIdToDelete);
                if (hasVehicles) {
                    alert('No se puede eliminar un conductor que tiene vehículos asignados. Desasigna los vehículos primero.');
                    return;
                }
                const driverToDelete = drivers.find(d => d.id === driverIdToDelete);
                drivers = drivers.filter(d => d.id !== driverIdToDelete);
                // Eliminar también las credenciales simuladas
                const index = DRIVER_CREDENTIALS.findIndex(d => d.id === driverIdToDelete);
                if (index > -1) {
                    DRIVER_CREDENTIALS.splice(index, 1);
                }
                addNotification(`Conductor ${driverToDelete ? driverToDelete.name : 'Desconocido'} eliminado.`, 'admin');
                saveData();
                renderDrivers();
                renderAdminDashboard();
            }
        }
        // TODO: Implementar edición de conductor
    });


    // --- Accounts Section Listeners (Admin) ---
    // Delegación de eventos para botones de la lista de cuentas
    pendingAccountsList.addEventListener('click', (e) => {
        if (e.target.classList.contains('edit-btn')) {
            const accountId = e.target.dataset.id;
            openReviewAccountModal(accountId);
        } else if (e.target.classList.contains('approve-btn')) {
            const accountId = e.target.dataset.id;
            const accountToApprove = accounts.find(acc => acc.id === accountId);
            if (accountToApprove) {
                const driver = drivers.find(d=>d.id === accountToApprove.driverId);
                if (confirm(`¿Estás seguro de aprobar la cuenta para ${driver ? driver.name : 'Desconocido'}?`)) {
                    accountToApprove.status = 'approved';
                    accountToApprove.approvalDate = new Date().toLocaleDateString();
                    addNotification(`Cuenta para ${driver ? driver.name : 'Desconocido'} aprobada.`, 'admin');
                    addNotification(`Tu cuenta semanal del período ${accountToApprove.period} ha sido aprobada.`, 'driver', accountToApprove.driverId);
                    saveData();
                    renderAdminAccounts();
                    renderAdminDashboard();
                    if (currentRole === 'driver') renderDriverDashboard(); // Para actualizar el panel del conductor si está logueado
                }
            }
        }
    });

    closeReviewAccountModalBtn.addEventListener('click', () => {
        reviewAccountModal.classList.add('hidden');
        currentEditingAccount = null;
    });

    // Actualizar monto final al cambiar el monto calculado
    reviewAccountAmount.addEventListener('input', () => {
        if (currentEditingAccount) {
            updateAccountFinalAmount();
        }
    });

    // Añadir deducción
    addDeductionBtn.addEventListener('click', () => {
        const desc = newDeductionDesc.value.trim();
        const amount = parseFloat(newDeductionAmount.value);

        if (desc && !isNaN(amount) && amount > 0) {
            currentEditingAccount.deductions.push({ description: desc, amount: amount });
            updateAccountFinalAmount();
            renderDeductions(currentEditingAccount.deductions);
            newDeductionDesc.value = '';
            newDeductionAmount.value = '';
        } else {
            alert('Por favor, ingrese una descripción y un monto válido para la deducción.');
        }
    });

    // Botón Aprobar dentro del modal de revisión
    approveAccountBtn.addEventListener('click', () => {
        if (currentEditingAccount) {
            currentEditingAccount.status = 'approved';
            currentEditingAccount.approvalDate = new Date().toLocaleDateString();
            const driver = drivers.find(d=>d.id === currentEditingAccount.driverId);
            addNotification(`Cuenta para ${driver ? driver.name : 'Desconocido'} (revisada) aprobada.`, 'admin');
            addNotification(`Tu cuenta semanal del período ${currentEditingAccount.period} ha sido aprobada con deducciones.`, 'driver', currentEditingAccount.driverId);
            saveData();
            renderAdminAccounts();
            renderAdminDashboard();
            if (currentRole === 'driver') renderDriverDashboard(); // Para actualizar el panel del conductor si está logueado
            reviewAccountModal.classList.add('hidden');
            currentEditingAccount = null;
        }
    });

    // Botón para generar cuentas simuladas (útil para la demo)
    generateNewAccountsBtn.addEventListener('click', () => {
        generateSimulatedAccounts();
    });
});

// Al final de script.js, o dentro de DOMContentLoaded
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/service-worker.js')
            .then(registration => {
                console.log('ServiceWorker registrado con éxito:', registration.scope);
            })
            .catch(error => {
                console.error('Fallo el registro del ServiceWorker:', error);
            });
    });
}