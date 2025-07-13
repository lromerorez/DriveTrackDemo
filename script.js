// Custom Message Modal Logic
const messageModalOverlay = document.getElementById('message-modal-overlay');
const messageModalText = document.getElementById('message-modal-text');
const messageModalClose = document.getElementById('message-modal-close');

function showMessageModal(message) {
    console.log("Mostrando modal con mensaje:", message); // Log para depuración
    messageModalText.textContent = message;
    messageModalOverlay.classList.remove('hidden');
    messageModalOverlay.style.display = 'flex'; // Fuerza el display a flex
}

function hideMessageModal() {
    console.log("Ocultando modal."); // Log para depuración
    messageModalOverlay.classList.add('hidden');
    messageModalOverlay.style.display = 'none'; // Fuerza el display a none
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


// Demo Data
const USERS = [
    { id: "u1", username: "admin", password: "admin123", role: "admin" },
    { id: "u2", username: "conductor1", password: "demo123", role: "driver" },
    { id: "u3", username: "conductor2", password: "demo456", role: "driver" },
];

let vehicles = [
    { id: "v1", plate: "ABC-123", driverId: "u2", bond: 500, fee: 150, lastService: "2025-06-01", status: "activo" },
    { id: "v2", plate: "XYZ-789", driverId: "u3", bond: 600, fee: 160, lastService: "2025-05-15", status: "activo" },
    { id: "v3", plate: "QWE-456", driverId: null, bond: 0, fee: 0, lastService: "2025-07-01", status: "disponible" },
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

    // Hide all main sections first
    document.querySelectorAll(".app-section").forEach(sec => sec.classList.add("hidden"));

    if (user.role === "admin") {
        adminMenu.classList.remove("hidden");
        driverMenu.classList.add("hidden");
        showSection("dashboard"); // Default admin view
        renderAdminPanels(); // Render admin specific data
    } else { // role is driver
        adminMenu.classList.add("hidden");
        driverMenu.classList.remove("hidden");
        showSection("driver-home"); // Default driver view
        renderDriverHome(user); // Render driver specific data
        renderDriverAccount(user);
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
    loginForm.reset();
    loginMsg.textContent = "";
    sidebar.classList.add('mobile-hidden');
    sidebar.classList.remove('mobile-visible');
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
        return `
            <tr class="hover:bg-gray-50 dark:hover:bg-gray-700">
                <td class="py-3 px-4 whitespace-nowrap text-sm text-gray-700 dark:text-gray-200">${v.plate}</td>
                <td class="py-3 px-4 whitespace-nowrap text-sm text-gray-700 dark:text-gray-200">${driverName}</td>
                <td class="py-3 px-4 whitespace-nowrap text-sm text-gray-700 dark:text-gray-200">$${v.bond}</td>
                <td class="py-3 px-4 whitespace-nowrap text-sm text-gray-700 dark:text-gray-200">$${v.fee}</td>
                <td class="py-3 px-4 whitespace-nowrap text-sm text-gray-700 dark:text-gray-200">${v.lastService}</td>
                <td class="py-3 px-4 whitespace-nowrap text-right text-sm font-medium">
                    <button class="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-200 ml-2" onclick="editVehicle('${v.id}')">Editar</button>
                    <button class="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-200 ml-2" onclick="deleteVehicle('${v.id}')">Eliminar</button>
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
                    <button class="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-200 ml-2" onclick="editDriver('${d.id}')">Editar</button>
                    <button class="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-200 ml-2" onclick="deleteDriver('${d.id}')">Eliminar</button>
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
                    ${a.status !== 'approved' ? `<button class="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-200 ml-2" onclick="approveAccount('${a.id}')">Aprobar</button>` : ''}
                    ${a.deductions.some(d => d.status === 'pending') ? `<button class="text-purple-600 hover:text-purple-900 dark:text-purple-400 dark:hover:text-purple-200 ml-2" onclick="reviewDeductions('${a.id}')">Revisar Deducciones</button>` : ''}
                </td>
            </tr>
        `;
    }).join('');
}

// Admin Actions (Mock functions as no backend)
function editVehicle(vehicleId) {
    const vehicle = vehicles.find(v => v.id === vehicleId);
    if (vehicle) {
        const newPlate = prompt(`Editar placas para ${vehicle.plate}:`, vehicle.plate);
        if (newPlate !== null) {
            vehicle.plate = newPlate;
            showMessageModal(`Vehículo ${vehicle.id} actualizado.`);
            renderAdminPanels();
        }
    }
}

function deleteVehicle(vehicleId) {
    if (confirm("¿Estás seguro de que quieres eliminar este vehículo?")) {
        vehicles = vehicles.filter(v => v.id !== vehicleId);
        showMessageModal(`Vehículo ${vehicleId} eliminado.`);
        renderAdminPanels();
    }
}

addVehicleBtn.addEventListener('click', () => {
    const plate = addVehiclePlate.value;
    const bond = parseFloat(addVehicleBond.value);
    const fee = parseFloat(addVehicleFee.value);

    if (!plate || isNaN(bond) || isNaN(fee) || bond < 0 || fee < 0) {
        showMessageModal("Por favor, ingresa datos válidos para el vehículo.");
        return;
    }
    const newVehicle = {
        id: 'v' + (vehicles.length + 1), // Simple ID generation
        plate: plate,
        driverId: null,
        bond: bond,
        fee: fee,
        lastService: new Date().toISOString().slice(0, 10),
        status: "disponible"
    };
    vehicles.push(newVehicle);
    showMessageModal(`Vehículo ${plate} añadido.`);
    renderAdminPanels();
    addVehiclePlate.value = '';
    addVehicleBond.value = '';
    addVehicleFee.value = '';
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
    if (confirm("¿Estás seguro de que quieres eliminar este conductor?")) {
        drivers = drivers.filter(d => d.id !== driverId);
        // Also unassign vehicle if any
        const vehicle = vehicles.find(v => v.driverId === driverId);
        if (vehicle) vehicle.driverId = null;
        showMessageModal(`Conductor ${driverId} eliminado.`);
        renderAdminPanels();
    }
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
                    <button class="text-green-600 hover:text-green-800 dark:text-green-400 dark:hover:text-green-200 mr-2" onclick="approveDeduction('${accountId}', ${index})">Aprobar</button>
                    <button class="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-200" onclick="rejectDeduction('${accountId}', ${index})">Rechazar</button>
                </div>
            ` : ''}
        </div>
    `).join('');

    showMessageModal(`
        <h3 class="font-bold text-xl mb-4">Revisar Deducciones para ${account.period}</h3>
        ${deductionListHtml || '<p>No hay deducciones.</p>'}
    `);
    // Override the default modal close button behavior for this specific modal instance if needed,
    // or ensure the buttons inside this modal also call hideMessageModal.
}

function approveDeduction(accountId, deductionIndex) {
    const account = accounts.find(a => a.id === accountId);
    if (account && account.deductions[deductionIndex]) {
        account.deductions[deductionIndex].status = 'approved';
        showMessageModal('Deducción aprobada.');
        renderAdminPanels();
        hideMessageModal(); // Close the modal after action
    }
}

function rejectDeduction(accountId, deductionIndex) {
    const account = accounts.find(a => a.id === accountId);
    if (account && account.deductions[deductionIndex]) {
        account.deductions[deductionIndex].status = 'rejected';
        showMessageModal('Deducción rechazada.');
        renderAdminPanels();
        hideMessageModal(); // Close the modal after action
    }
}


// Render Driver Panels
function renderDriverHome(user) {
    const myCar = vehicles.find(v => v.driverId === user.id);
    if (myCar) {
        driverCarInfo.innerHTML = `
            <p><strong>Placas:</strong> <span class="text-blue-600 dark:text-blue-400">${myCar.plate}</span></p>
            <p><strong>Fianza:</strong> <span class="text-green-600 dark:text-green-400">$${myCar.bond}</span></p>
            <p><strong>Cuota Semanal:</strong> <span class="text-green-600 dark:text-green-400">$${myCar.fee}</span></p>
            <p><strong>Último Servicio:</strong> ${myCar.lastService}</p>
            <p class="mt-2 text-sm ${myCar.status === 'activo' ? 'text-green-500 dark:text-green-400' : 'text-red-500 dark:text-red-400'}">Estado: ${myCar.status === 'activo' ? 'Vehículo asignado y listo.' : 'Requiere atención.'}</p>
        `;
    } else {
        driverCarInfo.innerHTML = `<p class="text-yellow-600 dark:text-yellow-400">No tienes vehículo asignado actualmente.</p>`;
    }
}

function renderDriverAccount(user) {
    const driverAccounts = accounts.filter(a => a.driverId === user.id);
    const pendingAccount = driverAccounts.find(a => a.status === "pending");

    if (pendingAccount) {
        const totalApprovedDeductions = pendingAccount.deductions.filter(d => d.status === "approved").reduce((s, d) => s + d.amount, 0);
        const totalPendingDeductions = pendingAccount.deductions.filter(d => d.status === "pending").reduce((s, d) => s + d.amount, 0);
        
        driverAccInfo.innerHTML = `
            <p><strong>Período Actual:</strong> <span class="text-blue-600 dark:text-blue-400">${pendingAccount.period}</span></p>
            <p><strong>Monto Base:</strong> <span class="text-green-600 dark:text-green-400">$${pendingAccount.amount}</span></p>
            <p><strong>Deducciones Aprobadas:</strong> <span class="text-red-600 dark:text-red-400">$${totalApprovedDeductions}</span></p>
            <p><strong>Deducciones Pendientes:</strong> <span class="text-yellow-600 dark:text-yellow-400">$${totalPendingDeductions}</span></p>
            <p class="font-bold text-lg mt-2">Monto Pendiente: <span class="text-purple-600 dark:text-purple-400">$${pendingAccount.amount - totalApprovedDeductions}</span></p>
        `;
        renderDriverDeductions(pendingAccount.deductions);
    } else {
        driverAccInfo.innerHTML = `<p class="text-gray-600 dark:text-gray-300">No hay cuenta pendiente para el período actual.</p>`;
        driverDeductList.innerHTML = `<p class="text-gray-600 dark:text-gray-300">No hay deducciones registradas para la cuenta actual.</p>`;
    }

    // Display all historical accounts
    const historicalAccounts = driverAccounts.filter(a => a.status === "approved");
    const historicalAccountsContainer = document.getElementById('driver-historical-accounts');
    if (historicalAccountsContainer) {
        if (historicalAccounts.length > 0) {
            let historyHtml = '<h4 class="font-semibold text-lg mt-6 mb-2">Historial de Cuentas Aprobadas</h4><ul class="space-y-2">';
            historicalAccounts.forEach(acc => {
                const totalDeds = acc.deductions.reduce((s, d) => s + d.amount, 0);
                historyHtml += `
                    <li class="bg-gray-50 p-3 rounded-md shadow-sm dark:bg-gray-700 dark:text-gray-200">
                        <p><strong>Período:</strong> ${acc.period}</p>
                        <p><strong>Monto Final:</strong> $${acc.amount - totalDeds}</p>
                        <p><strong>Deducciones:</strong> ${acc.deductions.map(d => `${d.description} ($${d.amount})`).join(', ') || 'Ninguna'}</p>
                    </li>
                `;
            });
            historyHtml += '</ul>';
            historicalAccountsContainer.innerHTML = historyHtml;
        } else {
            historicalAccountsContainer.innerHTML = `<p class="text-gray-600 dark:text-gray-300">No hay historial de cuentas aprobadas.</p>`;
        }
    }
}

function renderDriverDeductions(deds) {
    if (deds.length > 0) {
        driverDeductList.innerHTML = `
            <h4 class="font-semibold text-lg mb-2">Deducciones Solicitadas</h4>
            <ul class="space-y-2">
                ${deds.map(d => `
                    <li class="bg-gray-50 p-3 rounded-md shadow-sm dark:bg-gray-700 dark:text-gray-200">
                        ${d.description} - <span class="font-semibold">$${d.amount}</span> (<span class="${d.status === 'approved' ? 'text-green-600 dark:text-green-400' : d.status === 'pending' ? 'text-yellow-600 dark:text-yellow-400' : 'text-red-600 dark:text-red-400'}">${d.status === 'pending' ? 'Pendiente' : d.status === 'approved' ? 'Aprobada' : 'Rechazada'}</span>)
                    </li>
                `).join("")}
            </ul>
        `;
    } else {
        driverDeductList.innerHTML = `<p class="text-gray-600 dark:text-gray-300">No hay deducciones solicitadas para esta cuenta.</p>`;
    }
}

// Send Deduction (simulated)
sendDeductionBtn.addEventListener("click", () => {
    const desc = document.getElementById("deduct-desc").value;
    const amt = parseFloat(document.getElementById("deduct-amount").value);

    if (!desc || isNaN(amt) || amt <= 0) {
        showMessageModal("Datos inválidos. Asegúrate de que la descripción no esté vacía y el monto sea un número positivo.");
        return;
    }

    let acc = accounts.find(a => a.driverId === currentUser.id && a.status === "pending");
    if (!acc) {
        const now = new Date();
        const year = now.getFullYear();
        // Calculate week number (simple approximation)
        const startOfYear = new Date(year, 0, 1);
        const diff = now - startOfYear;
        const oneWeek = 1000 * 60 * 60 * 24 * 7;
        const week = Math.ceil(diff / oneWeek);

        acc = { id: 'a' + Date.now().toString(), driverId: currentUser.id, period: `${year}-W${week}`, amount: 0, deductions: [], status: "pending" };
        accounts.push(acc);
    }
    acc.deductions.push({ id: 'd' + Date.now().toString(), description: desc, amount: amt, status: "pending" });

    document.getElementById("deduct-desc").value = "";
    document.getElementById("deduct-amount").value = "";

    renderDriverAccount(currentUser);
    showMessageModal("Deducción enviada a aprobación. Será revisada por el administrador.");
});

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

    // Oculta el botón de menú móvil inicialmente hasta que se inicie sesión
    document.getElementById('mobile-menu-toggle').classList.add('hidden');
});
