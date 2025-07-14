// Firebase Global Variables (will be set by the <script type="module"> block in index.html)
let db;
let auth;
let userId; // Will be set by onAuthStateChanged
let appId; // Will be set by window.getAppId()

// Ensure Firebase is initialized before using it
document.addEventListener('DOMContentLoaded', () => {
    // Wait for Firebase to be initialized and authenticated
    const checkFirebaseReady = setInterval(() => {
        if (window.db && window.auth && window.getUserId()) {
            clearInterval(checkFirebaseReady);
            db = window.db;
            auth = window.auth;
            userId = window.getUserId();
            appId = window.getAppId(); // Get the appId from the global helper

            console.log("Firebase is ready in script.js! User ID:", userId, "App ID:", appId);
            // Now you can safely call Firestore functions
            // Initial render of panels after Firebase is ready
            if (currentUser && currentUser.role === "admin") {
                renderAdminPanels();
                listenForScheduledAlerts(); // Start listening for alerts
                checkMaintenanceAlerts(); // Initial check for maintenance alerts
            } else if (currentUser && currentUser.role === "driver") {
                renderDriverHome(currentUser);
                renderDriverAccount(currentUser);
            }
        }
    }, 100); // Check every 100ms
});


// Custom Message Modal Logic
const messageModalOverlay = document.getElementById('message-modal-overlay');
const messageModalText = document.getElementById('message-modal-text');
const messageModalClose = document.getElementById('message-modal-close');

function showMessageModal(message) {
    console.log("Mostrando modal con mensaje:", message);
    messageModalText.innerHTML = message;
    messageModalOverlay.classList.remove('hidden');
    messageModalOverlay.style.display = 'flex';
}

function hideMessageModal() {
    console.log("Ocultando modal.");
    messageModalOverlay.classList.add('hidden');
    messageModalOverlay.style.display = 'none';
    // Re-check and update notification count when modal is closed
    checkMaintenanceAlerts();
    updateNotificationCount();
}

messageModalClose.addEventListener('click', hideMessageModal);

messageModalOverlay.addEventListener('click', (event) => {
    if (event.target === messageModalOverlay) {
        hideMessageModal();
    }
});

document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && !messageModalOverlay.classList.contains('hidden')) {
        hideMessageModal();
    }
});


// Demo Data (will be replaced by Firestore data for alerts, but keeping for other sections)
const USERS = [
    { id: "u1", username: "admin", password: "admin123", role: "admin" },
    { id: "u2", username: "conductor1", password: "demo123", role: "driver" },
    { id: "u3", username: "conductor2", password: "demo456", role: "driver" },
];

let vehicles = [
    {
        id: "v1", plate: "ABC-123", driverId: "u2", bond: 500, fee: 150, lastService: "2025-06-01", status: "activo",
        maintenance: {
            verificacion: { lastPerformed: "2025-01-01", nextScheduled: "2025-07-20" },
            seguro: { lastPerformed: "2024-12-01", nextScheduled: "2025-12-01" },
            aceite: { lastPerformed: "2025-04-01", nextScheduled: "2025-08-01" },
            filtroAire: { lastPerformed: "2025-04-01", nextScheduled: "2025-10-01" },
            neumaticos: { lastPerformed: "2025-03-01", nextScheduled: "2025-09-01" },
            frenos: { lastPerformed: "2025-01-15", nextScheduled: "2025-07-25" },
            alineacion: { lastPerformed: "2025-02-01", nextScheduled: "2025-08-01" },
            suspension: { lastPerformed: "2024-11-01", nextScheduled: "2025-11-01" },
            bujias: { lastPerformed: "2024-09-01", nextScheduled: "2025-09-01" },
            liquido: { lastPerformed: "2024-07-01", nextScheduled: "2026-07-01" }
        }
    },
    {
        id: "v2", plate: "XYZ-789", driverId: "u3", bond: 600, fee: 160, lastService: "2025-05-15", status: "activo",
        maintenance: {
            verificacion: { lastPerformed: "2025-02-10", nextScheduled: "2025-08-10" },
            seguro: { lastPerformed: "2025-01-01", nextScheduled: "2026-01-01" },
            aceite: { lastPerformed: "2025-06-01", nextScheduled: "2025-10-01" },
            filtroAire: { lastPerformed: "2025-06-01", nextScheduled: "2025-12-01" },
            neumaticos: { lastPerformed: "2025-05-01", nextScheduled: "2025-11-01" },
            frenos: { lastPerformed: "2025-03-20", nextScheduled: "2025-09-20" },
            alineacion: { lastPerformed: "2025-04-01", nextScheduled: "2025-10-01" },
            suspension: { lastPerformed: "2025-01-01", nextScheduled: "2026-01-01" },
            bujias: { lastPerformed: "2024-10-01", nextScheduled: "2025-10-01" },
            liquido: { lastPerformed: "2025-02-01", nextScheduled: "2027-02-01" }
        }
    },
    {
        id: "v3", plate: "QWE-456", driverId: null, bond: 0, fee: 0, lastService: "2025-07-01", status: "disponible",
        maintenance: {
            verificacion: { lastPerformed: "", nextScheduled: "" },
            seguro: { lastPerformed: "", nextScheduled: "" },
            aceite: { lastPerformed: "", nextScheduled: "" },
            filtroAire: { lastPerformed: "", nextScheduled: "" },
            neumaticos: { lastPerformed: "", nextScheduled: "" },
            frenos: { lastPerformed: "", nextScheduled: "" },
            alineacion: { lastPerformed: "", nextScheduled: "" },
            suspension: { lastPerformed: "", nextScheduled: "" },
            bujias: { lastPerformed: "", nextScheduled: "" },
            liquido: { lastPerformed: "", nextScheduled: "" }
        }
    },
];

let drivers = [
    { id: "u1", name: "Admin User", username: "admin", role: "admin", contact: "admin@drivetrack.com" },
    { id: "u2", name: "Juan Pérez", username: "conductor1", role: "driver", contact: "juan.perez@example.com", status: "activo" },
    { id: "u3", name: "María García", username: "conductor2", role: "driver", contact: "maria.garcia@example.com", status: "activo" },
];

let accounts = [
    { id: "a1", driverId: "u2", period: "2025-W27", amount: 1200, deductions: [{ description: "Multa", amount: 50, status: "pending" }], status: "pending" },
    { id: "a2", driverId: "u3", period: "2025-W27", amount: 1300, deductions: [{ description: "Reparación menor", amount: 75, status: "approved" }], status: "approved" },
    { id: "a3", driverId: "u2", period: "2025-W26", amount: 1100, deductions: [], status: "approved" },
];

let scheduledAlerts = []; // This will be populated from Firestore
let activeMaintenanceAlerts = []; // Stores maintenance alerts


// DOM Refs
const loginContainer = document.getElementById("login-container");
const appContainer = document.getElementById("main-app-container");
const loginForm = document.getElementById("login-form");
const loginMsg = document.getElementById("login-message");

const adminMenu = document.getElementById("admin-menu");
const driverMenu = document.getElementById("driver-menu");
const logoutButton = document.getElementById("logout-button");

const driverCarInfo = document.getElementById("driver-car-info");
const driverAccInfo = document.getElementById("driver-account-info");
const driverDeductList = document.getElementById("driver-deductions-list");
const sendDeductionBtn = document.getElementById("send-deduction-btn");

const vehiclesList = document.getElementById("vehicles-list");
const driversList = document.getElementById("drivers-list");
const accountsList = document.getElementById("accounts-list");

// Admin Add/Edit fields
const addVehiclePlate = document.getElementById("add-vehicle-plate");
const addVehicleBond = document.getElementById("add-vehicle-bond");
const addVehicleFee = document.getElementById("add-vehicle-fee");
const addVehicleBtn = document.getElementById("add-vehicle-btn");

const addDriverName = document.getElementById("add-driver-name");
const addDriverUsername = document.getElementById("add-driver-username");
const addDriverPassword = document.getElementById("add-driver-password");
const addDriverBtn = document.getElementById("add-driver-btn");

// Alert Programming DOM elements
const alertMessageInput = document.getElementById('alert-message');
const alertTypeSelect = document.getElementById('alert-type');
const alertScheduleInput = document.getElementById('alert-schedule');
const alertTargetSelect = document.getElementById('alert-target');
const saveAlertBtn = document.getElementById('save-alert-btn');
const sendTestAlertBtn = document.getElementById('send-test-alert-btn');
const scheduledAlertsList = document.getElementById('scheduled-alerts-list');

// Notification Icon
const notificationIcon = document.getElementById('notification-icon');
const notificationCount = document.getElementById('notification-count');


let currentUser = null;

// Login
loginForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const username = loginForm.username.value;
    const password = loginForm.password.value;

    const found = USERS.find(u => u.username === username && u.password === password);
    if (!found) {
        loginMsg.textContent = "Credenciales incorrectas";
        return;
    }
    loginMsg.textContent = "";
    startSession(found);
});

function startSession(user) {
    currentUser = user;
    loginContainer.classList.add("hidden");
    loginContainer.style.display = 'none';

    appContainer.classList.remove("hidden");
    appContainer.style.display = 'flex';

    document.getElementById('mobile-menu-toggle').classList.remove('hidden');
    notificationIcon.classList.remove('hidden'); // Show notification icon after login

    // Hide all main sections first
    document.querySelectorAll(".app-section").forEach(sec => sec.classList.add("hidden"));

    if (user.role === "admin") {
        adminMenu.classList.remove("hidden");
        driverMenu.classList.add("hidden");
        showSection("dashboard"); // Default admin view
        renderAdminPanels(); // Render admin specific data
        listenForScheduledAlerts(); // Start listening for alerts
        checkMaintenanceAlerts(); // Initial check for maintenance alerts
        // Set up interval to check for maintenance alerts periodically
        setInterval(checkMaintenanceAlerts, 60 * 1000); // Check every minute
    } else { // role is driver
        adminMenu.classList.add("hidden");
        driverMenu.classList.remove("hidden");
        showSection("driver-home"); // Default driver view
        renderDriverHome(user); // Render driver specific data
        renderDriverAccount(user);
        // Drivers might also need to see alerts relevant to them
        checkMaintenanceAlerts();
        setInterval(checkMaintenanceAlerts, 60 * 1000); // Check every minute
    }
}

// Logout
logoutButton.addEventListener("click", () => {
    currentUser = null;
    loginContainer.classList.remove("hidden");
    loginContainer.style.display = 'flex';

    appContainer.classList.add("hidden");
    appContainer.style.display = 'none';

    document.getElementById('mobile-menu-toggle').classList.add('hidden');
    notificationIcon.classList.add('hidden'); // Hide notification icon on logout
    loginForm.reset();
    loginMsg.textContent = "";
    sidebar.classList.add('mobile-hidden');
    sidebar.classList.remove('mobile-visible');
    notificationCount.textContent = '0'; // Reset notification count
    activeMaintenanceAlerts = []; // Clear active alerts
    updateNotificationCount(); // Ensure badge is hidden
});

// Navigation
document.querySelectorAll(".nav-menu a").forEach(link => {
    link.addEventListener("click", () => {
        const sectionKey = link.dataset.section;
        showSection(sectionKey);
        if (window.innerWidth < 768) {
            sidebar.classList.add('mobile-hidden');
            sidebar.classList.remove('mobile-visible');
        }
    });
});

// Close sidebar when clicking outside on mobile
document.addEventListener('click', (event) => {
    const isClickInsideSidebar = sidebar.contains(event.target);
    const isClickOnMobileToggle = mobileMenuToggle.contains(event.target);
    const isClickOnNotificationIcon = notificationIcon.contains(event.target);

    // Only close if sidebar is visible (mobile-visible) and click is outside sidebar and not on the toggle or notification button
    if (window.innerWidth < 768 && sidebar.classList.contains('mobile-visible') && !isClickInsideSidebar && !isClickOnMobileToggle && !isClickOnNotificationIcon) {
        sidebar.classList.add('mobile-hidden');
        sidebar.classList.remove('mobile-visible');
    }
});


function showSection(sectionKey) {
    document.querySelectorAll(".app-section").forEach(sec => sec.classList.add("hidden"));
    const targetSection = document.getElementById(sectionKey + "-section");
    if (targetSection) {
        targetSection.classList.remove("hidden");
    }

    // Re-render specific panels when their section is shown
    if (sectionKey === "vehicles") {
        renderAdminPanels();
    } else if (sectionKey === "drivers") {
        renderAdminPanels();
    } else if (sectionKey === "accounts") {
        renderAdminPanels();
    } else if (sectionKey === "programmable-alerts") {
        renderScheduledAlerts(); // Render alerts when this section is shown
        populateAlertTargetSelect(); // Populate target dropdown with drivers
    } else if (sectionKey === "driver-home" && currentUser) {
        renderDriverHome(currentUser);
    } else if (sectionKey === "driver-account" && currentUser) {
        renderDriverAccount(currentUser);
    }
}

// Admin Panel Rendering and Actions
function renderAdminPanels() {
    // Render Vehicles
    vehiclesList.innerHTML = vehicles.map(v => {
        const driverName = drivers.find(d => d.id === v.driverId)?.name || 'N/A';
        const maintenanceAlertsCount = activeMaintenanceAlerts.filter(alert => alert.vehicleId === v.id).length;
        const alertsDisplay = maintenanceAlertsCount > 0 ?
            `<span class="text-red-600 font-bold">${maintenanceAlertsCount} Pendientes</span>` :
            `<span class="text-green-600">Al día</span>`;

        return `
            <tr class="hover:bg-gray-50 dark:hover:bg-gray-700">
                <td class="py-3 px-4 whitespace-nowrap text-sm text-gray-700 dark:text-gray-200">${v.plate}</td>
                <td class="py-3 px-4 whitespace-nowrap text-sm text-gray-700 dark:text-gray-200">${driverName}</td>
                <td class="py-3 px-4 whitespace-nowrap text-sm text-gray-700 dark:text-gray-200">$${v.bond}</td>
                <td class="py-3 px-4 whitespace-nowrap text-sm text-gray-700 dark:text-gray-200">$${v.fee}</td>
                <td class="py-3 px-4 whitespace-nowrap text-sm text-gray-700 dark:text-gray-200">${v.lastService}</td>
                <td class="py-3 px-4 whitespace-nowrap text-sm text-gray-700 dark:text-gray-200">${alertsDisplay}</td>
                <td class="py-3 px-4 whitespace-nowrap text-right text-sm font-medium">
                    <button class="icon-button text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-200 ml-2" onclick="editVehicle('${v.id}')" title="Editar"><span class="material-icons">edit</span></button>
                    <button class="icon-button delete-button text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-200 ml-2" onclick="deleteVehicle('${v.id}')" title="Eliminar"><span class="material-icons">delete</span></button>
                </td>
            </tr>
        `;
    }).join('');

    // Render Drivers
    driversList.innerHTML = drivers.map(d => {
        // Exclude admin user from driver list
        if (d.role === 'admin') return '';

        const assignedVehicle = vehicles.find(v => v.driverId === d.id)?.plate || 'Ninguno';
        return `
            <tr class="hover:bg-gray-50 dark:hover:bg-gray-700">
                <td class="py-3 px-4 whitespace-nowrap text-sm text-gray-700 dark:text-gray-200">${d.name}</td>
                <td class="py-3 px-4 whitespace-nowrap text-sm text-gray-700 dark:text-gray-200">${d.username}</td>
                <td class="py-3 px-4 whitespace-nowrap text-sm text-gray-700 dark:text-gray-200">${assignedVehicle}</td>
                <td class="py-3 px-4 whitespace-nowrap text-sm text-gray-700 dark:text-gray-200">${d.status}</td>
                <td class="py-3 px-4 whitespace-nowrap text-right text-sm font-medium">
                    <button class="icon-button text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-200 ml-2" onclick="editDriver('${d.id}')" title="Editar"><span class="material-icons">edit</span></button>
                    <button class="icon-button delete-button text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-200 ml-2" onclick="deleteDriver('${d.id}')" title="Eliminar"><span class="material-icons">delete</span></button>
                    <select onchange="assignVehicleToDriver('${d.id}', this.value)" class="ml-2 p-1 border rounded-md dark:bg-gray-600 dark:border-gray-500 dark:text-white">
                        <option value="">Asignar Vehículo</option>
                        ${vehicles.filter(v => !v.driverId || v.driverId === d.id).map(v => `<option value="${v.id}" ${v.driverId === d.id ? 'selected' : ''}>${v.plate}</option>`).join('')}
                    </select>
                </td>
            </tr>
        `;
    }).join('');

    // Render Accounts
    accountsList.innerHTML = accounts.map(a => {
        const driverName = drivers.find(d => d.id === a.driverId)?.name || 'Desconocido';
        const deductionsSummary = a.deductions.map(d => `${d.description} ($${d.amount} - ${d.status})`).join(', ') || 'Ninguna';
        const totalDeductions = a.deductions.reduce((sum, d) => sum + d.amount, 0);
        const finalAmount = a.amount - totalDeductions;

        return `
            <tr class="hover:bg-gray-50 dark:hover:bg-gray-700">
                <td class="py-3 px-4 whitespace-nowrap text-sm text-gray-700 dark:text-gray-200">${driverName}</td>
                <td class="py-3 px-4 whitespace-nowrap text-sm text-gray-700 dark:text-gray-200">${a.period}</td>
                <td class="py-3 px-4 whitespace-nowrap text-sm text-gray-700 dark:text-gray-200">$${a.amount}</td>
                <td class="py-3 px-4 whitespace-nowrap text-sm text-gray-700 dark:text-gray-200">${deductionsSummary}</td>
                <td class="py-3 px-4 whitespace-nowrap text-sm text-gray-700 dark:text-gray-200">
                    <span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${a.status === 'approved' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'}">
                        ${a.status}
                    </span>
                </td>
                <td class="py-3 px-4 whitespace-nowrap text-right text-sm font-medium">
                    ${a.status !== 'approved' ? `<button class="icon-button text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-200 ml-2" onclick="approveAccount('${a.id}')" title="Aprobar"><span class="material-icons">check_circle</span></button>` : ''}
                    ${a.deductions.some(d => d.status === 'pending') ? `<button class="icon-button text-purple-600 hover:text-purple-900 dark:text-purple-400 dark:hover:text-purple-200 ml-2" onclick="reviewDeductions('${a.id}')" title="Revisar Deducciones"><span class="material-icons">visibility</span></button>` : ''}
                </td>
            </tr>
        `;
    }).join('');
}

// Admin Actions (Mock functions as no backend)
function editVehicle(vehicleId) {
    const vehicle = vehicles.find(v => v.id === vehicleId);
    if (vehicle) {
        // For simplicity, only plate is editable via prompt.
        // A full edit form would be needed for all maintenance fields.
        const newPlate = prompt(`Editar placas para ${vehicle.plate}:`, vehicle.plate);
        if (newPlate !== null) {
            vehicle.plate = newPlate;
            showMessageModal(`Vehículo ${vehicle.id} actualizado.`);
            renderAdminPanels();
            checkMaintenanceAlerts(); // Re-check alerts after edit
        }
    }
}

function deleteVehicle(vehicleId) {
    showMessageModal(`
        <h3 class="font-bold text-xl mb-4">Confirmar Eliminación</h3>
        <p>¿Estás seguro de que quieres eliminar este vehículo? Esta acción no se puede deshacer.</p>
        <div class="flex justify-center gap-4 mt-4">
            <button class="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700" onclick="confirmDeleteVehicle('${vehicleId}')">Sí, Eliminar</button>
            <button class="bg-gray-300 text-gray-800 px-4 py-2 rounded-md hover:bg-gray-400" onclick="hideMessageModal()">Cancelar</button>
        </div>
    `);
}

function confirmDeleteVehicle(vehicleId) {
    vehicles = vehicles.filter(v => v.id !== vehicleId);
    showMessageModal(`Vehículo ${vehicleId} eliminado.`);
    renderAdminPanels();
    checkMaintenanceAlerts(); // Re-check alerts after deletion
    hideMessageModal();
}

addVehicleBtn.addEventListener('click', () => {
    const plate = addVehiclePlate.value;
    const bond = parseFloat(addVehicleBond.value);
    const fee = parseFloat(addVehicleFee.value);

    // Collect maintenance dates
    const maintenance = {
        verificacion: {
            lastPerformed: document.getElementById('maint-verificacion-last').value,
            nextScheduled: document.getElementById('maint-verificacion-next').value
        },
        seguro: {
            lastPerformed: document.getElementById('maint-seguro-last').value,
            nextScheduled: document.getElementById('maint-seguro-next').value
        },
        aceite: {
            lastPerformed: document.getElementById('maint-aceite-last').value,
            nextScheduled: document.getElementById('maint-aceite-next').value
        },
        filtroAire: {
            lastPerformed: document.getElementById('maint-filtro-aire-last').value,
            nextScheduled: document.getElementById('maint-filtro-aire-next').value
        },
        neumaticos: {
            lastPerformed: document.getElementById('maint-neumaticos-last').value,
            nextScheduled: document.getElementById('maint-neumaticos-next').value
        },
        frenos: {
            lastPerformed: document.getElementById('maint-frenos-last').value,
            nextScheduled: document.getElementById('maint-frenos-next').value
        },
        alineacion: {
            lastPerformed: document.getElementById('maint-alineacion-last').value,
            nextScheduled: document.getElementById('maint-alineacion-next').value
        },
        suspension: {
            lastPerformed: document.getElementById('maint-suspension-last').value,
            nextScheduled: document.getElementById('maint-suspension-next').value
        },
        bujias: {
            lastPerformed: document.getElementById('maint-bujias-last').value,
            nextScheduled: document.getElementById('maint-bujias-next').value
        },
        liquido: {
            lastPerformed: document.getElementById('maint-liquido-last').value,
            nextScheduled: document.getElementById('maint-liquido-next').value
        }
    };


    if (!plate || isNaN(bond) || isNaN(fee) || bond < 0 || fee < 0) {
        showMessageModal("Por favor, ingresa datos válidos para el vehículo (Placas, Fianza, Cuota Semanal).");
        return;
    }
    const newVehicle = {
        id: 'v' + Date.now().toString(), // More robust ID generation
        plate: plate,
        driverId: null,
        bond: bond,
        fee: fee,
        lastService: new Date().toISOString().slice(0, 10), // General last service date
        status: "disponible",
        maintenance: maintenance // Add detailed maintenance data
    };
    vehicles.push(newVehicle);
    showMessageModal(`Vehículo ${plate} añadido.`);
    renderAdminPanels();
    checkMaintenanceAlerts(); // Re-check alerts after adding new vehicle

    // Clear form fields
    addVehiclePlate.value = '';
    addVehicleBond.value = '';
    addVehicleFee.value = '';
    document.getElementById('maint-verificacion-last').value = '';
    document.getElementById('maint-verificacion-next').value = '';
    document.getElementById('maint-seguro-last').value = '';
    document.getElementById('maint-seguro-next').value = '';
    document.getElementById('maint-aceite-last').value = '';
    document.getElementById('maint-aceite-next').value = '';
    document.getElementById('maint-filtro-aire-last').value = '';
    document.getElementById('maint-filtro-aire-next').value = '';
    document.getElementById('maint-neumaticos-last').value = '';
    document.getElementById('maint-neumaticos-next').value = '';
    document.getElementById('maint-frenos-last').value = '';
    document.getElementById('maint-frenos-next').value = '';
    document.getElementById('maint-alineacion-last').value = '';
    document.getElementById('maint-alineacion-next').value = '';
    document.getElementById('maint-suspension-last').value = '';
    document.getElementById('maint-suspension-next').value = '';
    document.getElementById('maint-bujias-last').value = '';
    document.getElementById('maint-bujias-next').value = '';
    document.getElementById('maint-liquido-last').value = '';
    document.getElementById('maint-liquido-next').value = '';
});


function editDriver(driverId) {
    const driver = drivers.find(d => d.id === driverId);
    if (driver) {
        const newName = prompt(`Editar nombre para ${driver.name}:`, driver.name);
        if (newName !== null) {
            driver.name = newName;
            showMessageModal(`Conductor ${driver.id} actualizado.`);
            renderAdminPanels();
        }
    }
}

function deleteDriver(driverId) {
    showMessageModal(`
        <h3 class="font-bold text-xl mb-4">Confirmar Eliminación</h3>
        <p>¿Estás seguro de que quieres eliminar a este conductor? Esta acción no se puede deshacer.</p>
        <div class="flex justify-center gap-4 mt-4">
            <button class="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700" onclick="confirmDeleteDriver('${driverId}')">Sí, Eliminar</button>
            <button class="bg-gray-300 text-gray-800 px-4 py-2 rounded-md hover:bg-gray-400" onclick="hideMessageModal()">Cancelar</button>
        </div>
    `);
}

function confirmDeleteDriver(driverId) {
    drivers = drivers.filter(d => d.id !== driverId);
    // Also unassign vehicle if any
    const vehicle = vehicles.find(v => v.driverId === driverId);
    if (vehicle) vehicle.driverId = null;
    showMessageModal(`Conductor ${driverId} eliminado.`);
    renderAdminPanels();
    hideMessageModal();
}

addDriverBtn.addEventListener('click', () => {
    const name = addDriverName.value;
    const username = addDriverUsername.value;
    const password = addDriverPassword.value;

    if (!name || !username || !password) {
        showMessageModal("Por favor, completa todos los campos para el conductor.");
        return;
    }
    const newDriver = {
        id: 'u' + (USERS.length + 1), // Simple ID generation
        name: name,
        username: username,
        password: password, // In a real app, hash this!
        role: "driver",
        contact: "", // Add contact field if needed
        status: "activo"
    };
    drivers.push(newDriver);
    USERS.push({ id: newDriver.id, username: newDriver.username, password: newDriver.password, role: newDriver.role });
    showMessageModal(`Conductor ${name} añadido.`);
    renderAdminPanels();
    addDriverName.value = '';
    addDriverUsername.value = '';
    addDriverPassword.value = '';
});

function assignVehicleToDriver(driverId, vehicleId) {
    // Unassign vehicle from any other driver first
    vehicles.forEach(v => {
        if (v.driverId === driverId) {
            v.driverId = null;
        }
    });

    const selectedVehicle = vehicles.find(v => v.id === vehicleId);
    if (selectedVehicle) {
        selectedVehicle.driverId = driverId;
        showMessageModal(`Vehículo ${selectedVehicle.plate} asignado.`);
    } else {
        // If vehicleId is empty, it means "unassign"
        showMessageModal(`Vehículo desasignado del conductor.`);
    }
    renderAdminPanels();
}

function approveAccount(accountId) {
    const account = accounts.find(a => a.id === accountId);
    if (account) {
        account.status = 'approved';
        showMessageModal('Cuenta aprobada con éxito.');
        renderAdminPanels(); // Re-render accounts list
    }
}

function reviewDeductions(accountId) {
    const account = accounts.find(a => a.id === accountId);
    if (!account || !account.deductions || account.deductions.length === 0) {
        showMessageModal("No hay deducciones para revisar en esta cuenta.");
        return;
    }

    let deductionListHtml = account.deductions.map((d, index) => `
        <div class="flex justify-between items-center p-2 border-b last:border-b-0 dark:border-gray-600">
            <span>${d.description} - $${d.amount} (${d.status})</span>
            ${d.status === 'pending' ? `
                <div>
                    <button class="icon-button text-green-600 hover:text-green-800 dark:text-green-400 dark:hover:text-green-200 mr-2" onclick="approveDeduction('${accountId}', ${index})" title="Aprobar Deducción"><span class="material-icons">check_circle</span></button>
                    <button class="icon-button text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-200" onclick="rejectDeduction('${accountId}', ${index})" title="Rechazar Deducción"><span class="material-icons">cancel</span></button>
                </div>
            ` : ''}
        </div>
    `).join('');

    showMessageModal(`
        <h3 class="font-bold text-xl mb-4">Revisar Deducciones para ${account.period}</h3>
        ${deductionListHtml || '<p>No hay deducciones.</p>'}
    `);
}

function approveDeduction(accountId, deductionIndex) {
    const account = accounts.find(a => a.id === accountId);
    if (account && account.deductions[deductionIndex]) {
        account.deductions[deductionIndex].status = 'approved';
        showMessageModal('Deducción aprobada.');
        renderAdminPanels();
        hideMessageModal();
    }
}

function rejectDeduction(accountId, deductionIndex) {
    const account = accounts.find(a => a.id === accountId);
    if (account && account.deductions[deductionIndex]) {
        account.deductions[deductionIndex].status = 'rejected';
        showMessageModal('Deducción rechazada.');
        renderAdminPanels();
        hideMessageModal();
    }
}

// --- Maintenance Alert Logic ---
const MAINTENANCE_ITEMS = {
    verificacion: "Verificación Vehicular (Emisiones)",
    seguro: "Seguro de Responsabilidad Civil Obligatorio",
    aceite: "Cambio de Aceite y Filtro de Aceite",
    filtroAire: "Filtro de Aire del Motor",
    neumaticos: "Rotación y Balanceo de Neumáticos",
    frenos: "Revisión y/o Cambio de Frenos (Pastillas y Discos)",
    alineacion: "Alineación de la Dirección",
    suspension: "Revisión de la Suspensión (Amortiguadores y Componentes)",
    bujias: "Bujías",
    liquido: "Reemplazo de Líquido de Frenos y de Dirección Asistida"
};

function checkMaintenanceAlerts() {
    activeMaintenanceAlerts = []; // Clear previous alerts
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Normalize to start of day

    vehicles.forEach(vehicle => {
        for (const key in vehicle.maintenance) {
            const item = vehicle.maintenance[key];
            if (item.nextScheduled) {
                const nextDate = new Date(item.nextScheduled);
                nextDate.setHours(0, 0, 0, 0); // Normalize to start of day

                const diffTime = nextDate.getTime() - today.getTime();
                const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

                if (diffDays >= 0 && diffDays <= 10) { // Alert if within 10 days or overdue
                    activeMaintenanceAlerts.push({
                        vehicleId: vehicle.id,
                        plate: vehicle.plate,
                        itemKey: key,
                        itemName: MAINTENANCE_ITEMS[key],
                        nextScheduled: item.nextScheduled,
                        daysRemaining: diffDays
                    });
                }
            }
        }
    });
    updateNotificationCount();
    console.log("Active Maintenance Alerts:", activeMaintenanceAlerts);
    renderAdminPanels(); // Re-render vehicle list to show updated alerts
}

function updateNotificationCount() {
    const totalAlerts = activeMaintenanceAlerts.length + scheduledAlerts.length; // Combine all types of alerts
    
    if (totalAlerts > 0) {
        notificationCount.textContent = totalAlerts.toString();
        notificationCount.classList.remove('hidden'); // Show the badge
        notificationCount.classList.add('active'); // Add pulse animation
    } else {
        notificationCount.textContent = ''; // Clear text content
        notificationCount.classList.add('hidden'); // Hide the badge
        notificationCount.classList.remove('active'); // Remove pulse animation
    }
}

// Show Maintenance Alerts Modal when notification icon is clicked
notificationIcon.addEventListener('click', () => {
    let alertsHtml = '<h3 class="font-bold text-xl mb-4">Notificaciones y Alertas</h3>';

    if (activeMaintenanceAlerts.length > 0) {
        alertsHtml += '<h4 class="font-semibold text-lg mt-4 mb-2">Alertas de Mantenimiento Próximo:</h4><ul>';
        activeMaintenanceAlerts.forEach(alert => {
            alertsHtml += `<li>Vehículo: <strong>${alert.plate}</strong> - ${alert.itemName} (${alert.daysRemaining} días restantes)</li>`;
        });
        alertsHtml += '</ul>';
    } else {
        alertsHtml += '<p class="mt-4">No hay alertas de mantenimiento próximas.</p>';
    }

    if (scheduledAlerts.length > 0) {
        alertsHtml += '<h4 class="font-semibold text-lg mt-4 mb-2">Alertas Programadas (Administrador):</h4><ul>';
        scheduledAlerts.forEach(alert => {
            alertsHtml += `<li><strong>${alert.message}</strong> - Tipo: ${alert.type} - Fecha: ${new Date(alert.schedule).toLocaleString()}</li>`;
        });
        alertsHtml += '</ul>';
    } else {
        alertsHtml += '<p class="mt-4">No hay alertas programadas por el administrador.</p>';
    }

    if (activeMaintenanceAlerts.length === 0 && scheduledAlerts.length === 0) {
        alertsHtml = '<h3 class="font-bold text-xl mb-4">Notificaciones y Alertas</h3><p>No hay notificaciones o alertas pendientes.</p>';
    }

    showMessageModal(alertsHtml);
});


// --- Alert Programming Logic (Firestore) ---

// Populate target select with drivers
function populateAlertTargetSelect() {
    // Clear existing options except "all"
    alertTargetSelect.innerHTML = '<option value="all">Todos los Conductores</option>';
    drivers.filter(d => d.role === 'driver').forEach(driver => {
        const option = document.createElement('option');
        option.value = driver.id;
        option.textContent = driver.name;
        alertTargetSelect.appendChild(option);
    });
}

// Save Alert to Firestore
saveAlertBtn.addEventListener('click', async () => {
    const message = alertMessageInput.value;
    const type = alertTypeSelect.value;
    const schedule = alertScheduleInput.value; // ISO string or empty
    const target = alertTargetSelect.value;

    if (!message) {
        showMessageModal("El mensaje de la alerta no puede estar vacío.");
        return;
    }

    if (!db || !userId || !appId) {
        showMessageModal("Error: Firebase no está inicializado. Intenta recargar la página.");
        console.error("Firestore, userId, or appId not ready when trying to save alert.");
        return;
    }

    try {
        // Firestore collection path: /artifacts/{appId}/users/{userId}/alerts
        const alertsCollectionRef = window.collection(db, `artifacts/${appId}/users/${userId}/alerts`);
        await window.addDoc(alertsCollectionRef, {
            message: message,
            type: type,
            schedule: schedule ? new Date(schedule).toISOString() : null, // Store as ISO string
            target: target,
            createdAt: window.serverTimestamp ? window.serverTimestamp() : new Date().toISOString(), // Use server timestamp if available
            status: 'scheduled' // or 'sent', 'pending'
        });
        showMessageModal("Alerta guardada con éxito.");
        alertMessageInput.value = '';
        alertScheduleInput.value = '';
        alertTypeSelect.value = 'general';
        alertTargetSelect.value = 'all';
    } catch (error) {
        console.error("Error al guardar la alerta:", error);
        showMessageModal(`Error al guardar la alerta: ${error.message}`);
    }
});

// Listen for real-time updates to scheduled alerts from Firestore
function listenForScheduledAlerts() {
    if (!db || !userId || !appId) {
        console.warn("Firestore, userId, or appId not ready for listening to alerts.");
        return;
    }

    const alertsCollectionRef = window.collection(db, `artifacts/${appId}/users/${userId}/alerts`);
    window.onSnapshot(alertsCollectionRef, (snapshot) => {
        scheduledAlerts = [];
        snapshot.forEach(doc => {
            scheduledAlerts.push({ id: doc.id, ...doc.data() });
        });
        renderScheduledAlerts(); // Re-render the list whenever data changes
        updateNotificationCount(); // Update notification count
    }, (error) => {
        console.error("Error listening to scheduled alerts:", error);
        showMessageModal(`Error al cargar alertas: ${error.message}`);
    });
}

// Render Scheduled Alerts to the table
function renderScheduledAlerts() {
    scheduledAlertsList.innerHTML = ''; // Clear current list
    if (scheduledAlerts.length === 0) {
        scheduledAlertsList.innerHTML = `<tr><td colspan="5" class="py-3 px-4 text-center text-gray-600 dark:text-gray-300">No hay alertas programadas.</td></tr>`;
        return;
    }

    scheduledAlerts.forEach(alert => {
        const row = document.createElement('tr');
        row.className = "hover:bg-gray-50 dark:hover:bg-gray-700";
        
        const scheduleTime = alert.schedule ? new Date(alert.schedule).toLocaleString() : 'Inmediato';
        const targetName = alert.target === 'all' ? 'Todos' : drivers.find(d => d.id === alert.target)?.name || 'Desconocido';

        row.innerHTML = `
            <td class="py-3 px-4 whitespace-nowrap text-sm text-gray-700 dark:text-gray-200">${alert.message}</td>
            <td class="py-3 px-4 whitespace-nowrap text-sm text-gray-700 dark:text-gray-200">${alert.type}</td>
            <td class="py-3 px-4 whitespace-nowrap text-sm text-gray-700 dark:text-gray-200">${scheduleTime}</td>
            <td class="py-3 px-4 whitespace-nowrap text-sm text-gray-700 dark:text-gray-200">${targetName}</td>
            <td class="py-3 px-4 whitespace-nowrap text-right text-sm font-medium">
                <button class="icon-button delete-button text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-200 ml-2" onclick="deleteAlert('${alert.id}')" title="Eliminar"><span class="material-icons">delete</span></button>
                <button class="icon-button text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-200 ml-2" onclick="sendDesktopNotification('${alert.message}', 'Alerta de ${alert.type}')" title="Enviar Ahora"><span class="material-icons">send</span></button>
            </td>
        `;
        scheduledAlertsList.appendChild(row);
    });
}

// Delete Alert from Firestore
async function deleteAlert(alertId) {
    showMessageModal(`
        <h3 class="font-bold text-xl mb-4">Confirmar Eliminación</h3>
        <p>¿Estás seguro de que quieres eliminar esta alerta programada?</p>
        <div class="flex justify-center gap-4 mt-4">
            <button class="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700" onclick="confirmDeleteAlert('${alertId}')">Sí, Eliminar</button>
            <button class="bg-gray-300 text-gray-800 px-4 py-2 rounded-md hover:bg-gray-400" onclick="hideMessageModal()">Cancelar</button>
        </div>
    `);
}

async function confirmDeleteAlert(alertId) {
    if (!db || !userId || !appId) {
        showMessageModal("Error: Firebase no está inicializado.");
        console.error("Firestore, userId, or appId not ready when trying to delete alert.");
        hideMessageModal();
        return;
    }
    try {
        const alertDocRef = window.doc(db, `artifacts/${appId}/users/${userId}/alerts`, alertId);
        await window.deleteDoc(alertDocRef);
        showMessageModal("Alerta eliminada con éxito.");
    } catch (error) {
        console.error("Error al eliminar la alerta:", error);
        showMessageModal(`Error al eliminar la alerta: ${error.message}`);
    } finally {
        hideMessageModal();
    }
}

// Send Desktop Notification
sendTestAlertBtn.addEventListener('click', () => {
    const message = alertMessageInput.value || "¡Alerta de prueba de DriveTrack!";
    const type = alertTypeSelect.value || "general";
    sendDesktopNotification(message, `Alerta de ${type.charAt(0).toUpperCase() + type.slice(1)}`);
});

function sendDesktopNotification(message, title = 'DriveTrack Notification') {
    if (!("Notification" in window)) {
        showMessageModal("Este navegador no soporta notificaciones de escritorio.");
    } else if (Notification.permission === "granted") {
        new Notification(title, { body: message, icon: 'https://placehold.co/40x40/3498db/ffffff?text=DT' });
    } else if (Notification.permission !== "denied") {
        Notification.requestPermission().then(permission => {
            if (permission === "granted") {
                new Notification(title, { body: message, icon: 'https://placehold.co/40x40/3498db/ffffff?text=DT' });
            } else {
                showMessageModal("Permiso de notificación denegado. No se pueden mostrar alertas de escritorio.");
            }
        });
    } else {
        showMessageModal("Permiso de notificación denegado. Por favor, habilita las notificaciones en la configuración de tu navegador.");
    }
}


// --- General App Setup ---

// Mobile Menu Toggle
const mobileMenuToggle = document.getElementById('mobile-menu-toggle');
const sidebar = document.getElementById('sidebar');

mobileMenuToggle.addEventListener('click', () => {
    sidebar.classList.toggle('mobile-hidden');
    sidebar.classList.toggle('mobile-visible');
});

// Dark Mode Toggle
const darkModeToggle = document.getElementById('dark-mode-toggle');
const htmlElement = document.documentElement;

function enableDarkMode() {
    htmlElement.classList.add('dark');
    localStorage.setItem('theme', 'dark');
    darkModeToggle.innerHTML = '<span class="material-icons">light_mode</span>';
}

function disableDarkMode() {
    htmlElement.classList.remove('dark');
    localStorage.setItem('theme', 'light');
    darkModeToggle.innerHTML = '<span class="material-icons">dark_mode</span>';
}

darkModeToggle.addEventListener('click', () => {
    if (htmlElement.classList.contains('dark')) {
        disableDarkMode();
    } else {
        enableDarkMode();
    }
});

// Check for saved theme preference on load and set initial state
document.addEventListener('DOMContentLoaded', () => {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark') {
        enableDarkMode();
    } else {
        disableDarkMode();
    }

    // Asegura que el contenedor de login esté visible y el de la app oculto al cargar
    loginContainer.classList.remove('hidden');
    loginContainer.style.display = 'flex';

    appContainer.classList.add('hidden');
    appContainer.style.display = 'none';

    // Oculta el botón de menú móvil y el icono de notificación inicialmente hasta que se inicie sesión
    document.getElementById('mobile-menu-toggle').classList.add('hidden');
    notificationIcon.classList.add('hidden');
    updateNotificationCount(); // Initial call to hide the badge if no alerts
});
