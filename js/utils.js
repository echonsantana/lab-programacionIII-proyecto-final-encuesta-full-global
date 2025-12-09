// Funciones de utilidad
function validarEmail(email) {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return regex.test(email);
}

function obtenerParametroURL(nombre) {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get(nombre);
}

function mostrarToast(mensaje, tipo = 'info') {
    // Crear toast
    const toast = document.createElement('div');
    toast.className = `toast ${tipo}`;
    toast.innerHTML = `
        <div style="display: flex; align-items: center; gap: 0.5rem;">
            ${tipo === 'exito' ? '✅' : tipo === 'error' ? '❌' : 'ℹ️'}
            <span>${mensaje}</span>
        </div>
    `;
    
    // Agregar al contenedor
    let container = document.getElementById('toast-container');
    if (!container) {
        container = document.createElement('div');
        container.id = 'toast-container';
        container.className = 'toast-container';
        document.body.appendChild(container);
    }
    container.appendChild(toast);
    
    // Eliminar después de 5s
    setTimeout(() => toast.remove(), 5000);
}

window.utils = { validarEmail, obtenerParametroURL, mostrarToast };