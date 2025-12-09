document.addEventListener('DOMContentLoaded', function() {
    console.log('📝 Script de registro cargado');
    
    const formulario = document.getElementById('registroForm');
    const mensajeResultado = document.getElementById('mensajeResultado');
    
    if (!formulario) {
        console.error('❌ No se encontró el formulario');
        return;
    }
    
    console.log('✅ Formulario encontrado');
    console.log('🔌 Supabase disponible:', window.supabase ? '✅' : '❌');
    
    // Función de validación de email
    function validarEmail(email) {
        const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return regex.test(email);
    }
    
    formulario.addEventListener('submit', async function(e) {
        e.preventDefault();
        console.log('🔄 Formulario enviado');
        
        // Deshabilitar botón mientras procesa
        const btnSubmit = formulario.querySelector('button[type="submit"]');
        const btnOriginalText = btnSubmit.innerHTML;
        btnSubmit.disabled = true;
        btnSubmit.innerHTML = '⏳ Procesando...';
        
        try {
            // Obtener datos
            const participante = {
                email: document.getElementById('email').value.trim(),
                nombre: document.getElementById('nombre').value.trim(),
                apellido: document.getElementById('apellido').value.trim(),
                campo1: document.getElementById('campo1').value.trim(),
                campo2: document.getElementById('campo2').value.trim(),
                campo3: document.getElementById('campo3').value.trim()
            };
            
            console.log('📋 Datos:', participante);
            
            // Validar campos obligatorios
            if (!participante.email || !participante.nombre || !participante.apellido) {
                mostrarMensaje('❌ Completa todos los campos obligatorios', 'error');
                return;
            }
            
            // Validar email
            if (!validarEmail(participante.email)) {
                mostrarMensaje('❌ Correo electrónico inválido', 'error');
                return;
            }
            
            // VERIFICAR SI SUPABASE ESTÁ DISPONIBLE
            if (!window.supabase) {
                mostrarMensaje('❌ Error de conexión a la base de datos', 'error');
                return;
            }
            
            console.log('🔍 Verificando si el correo ya existe...');
            
            // PRIMERO: Probar una consulta SIMPLE para verificar conexión
            try {
                const testConnection = await window.supabase
                    .from('participantes')
                    .select('count', { count: 'exact', head: true })
                    .limit(1);
                
                console.log('🔌 Test conexión:', testConnection.error ? '❌' : '✅');
                
                if (testConnection.error) {
                    console.error('❌ Error de conexión:', testConnection.error);
                    mostrarMensaje(`Error de conexión: ${testConnection.error.message}`, 'error');
                    return;
                }
            } catch (testError) {
                console.error('❌ Error en test de conexión:', testError);
                mostrarMensaje('No se pudo conectar a la base de datos', 'error');
                return;
            }
            
            // Ahora verificar si el correo ya existe
            const { data: existe, error: errorVerificacion } = await window.supabase
                .from('participantes')
                .select('id')
                .eq('email', participante.email);
            
            if (errorVerificacion) {
                console.error('❌ Error en verificación:', errorVerificacion);
                mostrarMensaje(`Error: ${errorVerificacion.message}`, 'error');
                return;
            }
            
            if (existe && existe.length > 0) {
                mostrarMensaje('⚠️ Este correo ya está registrado', 'error');
                return;
            }
            
            console.log('📤 Insertando en Supabase...');
            
            // Insertar en Supabase con headers explícitos
            const { data, error } = await window.supabase
                .from('participantes')
                .insert([participante]);
            
            if (error) {
                console.error('❌ Error al insertar:', error);
                
                // Mensaje más amigable según el tipo de error
                if (error.code === '23505') {
                    mostrarMensaje('⚠️ Este correo ya está registrado', 'error');
                } else if (error.code === '42501') {
                    mostrarMensaje('❌ Error de permisos. Contacta al administrador.', 'error');
                } else {
                    mostrarMensaje(`Error: ${error.message}`, 'error');
                }
                return;
            }
            
            console.log('✅ Insertado correctamente');
            
            // Éxito
            mostrarMensaje(
                `✅ Participante "${participante.nombre} ${participante.apellido}" registrado exitosamente`, 
                'exito'
            );
            
            // Limpiar formulario
            formulario.reset();
            
        } catch (error) {
            console.error('❌ Error inesperado:', error);
            mostrarMensaje('❌ Error inesperado. Intenta nuevamente.', 'error');
        } finally {
            // Rehabilitar botón
            if (btnSubmit) {
                btnSubmit.disabled = false;
                btnSubmit.innerHTML = btnOriginalText;
            }
        }
    });
    
    function mostrarMensaje(texto, tipo) {
        console.log(`💬 Mensaje [${tipo}]:`, texto);
        
        if (!mensajeResultado) {
            alert(texto);
            return;
        }
        
        mensajeResultado.textContent = texto;
        mensajeResultado.className = `mensaje ${tipo}`;
        mensajeResultado.style.display = 'block';
        
        setTimeout(() => {
            if (mensajeResultado) {
                mensajeResultado.style.display = 'none';
            }
        }, 5000);
    }
});