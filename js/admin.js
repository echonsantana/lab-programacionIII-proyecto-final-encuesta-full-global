document.addEventListener('DOMContentLoaded', function() {
    console.log('📝 Script admin cargado');
    
    const formEncuesta = document.getElementById('formEncuesta');
    const formOpcion = document.getElementById('formOpcion');
    const encuestaSelect = document.getElementById('encuestaSelect');
    const listaEncuestas = document.getElementById('listaEncuestas');
    
    // Función para mostrar mensajes
    function mostrarMensaje(texto, tipo = 'info') {
        console.log(`💬 [${tipo.toUpperCase()}]: ${texto}`);
        alert(`[${tipo.toUpperCase()}] ${texto}`);
    }
    
    // Cargar encuestas al inicio
    cargarEncuestas();
    
    // Crear encuesta
    formEncuesta.addEventListener('submit', async function(e) {
        e.preventDefault();
        console.log('🔄 Creando encuesta...');
        
        const encuesta = {
            titulo: document.getElementById('titulo').value.trim(),
            descripcion: document.getElementById('descripcion').value.trim(),
            activa: document.getElementById('activa').checked
        };
        
        if (!encuesta.titulo) {
            mostrarMensaje('El título es requerido', 'error');
            return;
        }
        
        try {
            console.log('📤 Insertando encuesta:', encuesta);
            
            const { data, error } = await supabase
                .from('encuestas')
                .insert([encuesta])
                .select();
            
            if (error) {
                console.error('❌ Error Supabase:', error);
                mostrarMensaje(`Error: ${error.message}`, 'error');
                return;
            }
            
            console.log('✅ Encuesta creada:', data);
            mostrarMensaje(`✅ Encuesta "${encuesta.titulo}" creada exitosamente`, 'exito');
            formEncuesta.reset();
            cargarEncuestas();
            
        } catch (error) {
            console.error('❌ Error inesperado:', error);
            mostrarMensaje('Error inesperado', 'error');
        }
    });
    
    // Agregar opción
    formOpcion.addEventListener('submit', async function(e) {
        e.preventDefault();
        console.log('🔄 Agregando opción...');
        
        const opcion = {
            encuesta_id: encuestaSelect.value,
            nombre_opcion: document.getElementById('nombreOpcion').value.trim(),
            descripcion: document.getElementById('descripcionOpcion').value.trim(),
            orden: parseInt(document.getElementById('orden').value) || 0
        };
        
        if (!opcion.encuesta_id || !opcion.nombre_opcion) {
            mostrarMensaje('Selecciona una encuesta y escribe el nombre de la opción', 'error');
            return;
        }
        
        try {
            console.log('📤 Insertando opción:', opcion);
            
            const { data, error } = await supabase
                .from('opciones')
                .insert([opcion])
                .select();
            
            if (error) {
                console.error('❌ Error Supabase:', error);
                mostrarMensaje(`Error: ${error.message}`, 'error');
                return;
            }
            
            console.log('✅ Opción agregada:', data);
            mostrarMensaje(`✅ Opción "${opcion.nombre_opcion}" agregada exitosamente`, 'exito');
            formOpcion.reset();
            cargarEncuestas();
            
        } catch (error) {
            console.error('❌ Error inesperado:', error);
            mostrarMensaje('Error inesperado', 'error');
        }
    });
    
    async function cargarEncuestas() {
        try {
            // Actualizar select de formulario opciones
            const { data: encuestas, error } = await supabase
                .from('encuestas')
                .select('*')
                .order('created_at', { ascending: false });
            
            if (error) {
                console.error('❌ Error al cargar encuestas:', error);
                listaEncuestas.innerHTML = '<p style="color: #e53e3e;">Error al cargar encuestas</p>';
                return;
            }
            
            // Actualizar select del formulario
            encuestaSelect.innerHTML = '<option value="">Selecciona una encuesta</option>';
            encuestas.forEach(encuesta => {
                const option = document.createElement('option');
                option.value = encuesta.id;
                option.textContent = encuesta.titulo + (encuesta.activa ? ' (Activa)' : ' (Inactiva)');
                encuestaSelect.appendChild(option);
            });
            
            // Mostrar lista de encuestas con opciones
            let html = '';
            if (encuestas.length === 0) {
                html = '<p>No hay encuestas creadas</p>';
            } else {
                for (const encuesta of encuestas) {
                    // Obtener opciones de esta encuesta
                    const { data: opciones } = await supabase
                        .from('opciones')
                        .select('*')
                        .eq('encuesta_id', encuesta.id)
                        .order('orden');
                    
                    html += `
                        <div style="margin-bottom: 2rem; padding: 1.5rem; border: 1px solid #e2e8f0; border-radius: 10px; background: white;">
                            <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 1rem;">
                                <div style="flex: 1;">
                                    <h3 style="color: #2d3748; margin-top: 0;">${encuesta.titulo} 
                                        <span style="font-size: 0.9rem; color: ${encuesta.activa ? '#38a169' : '#e53e3e'}">
                                            (${encuesta.activa ? '✅ Activa' : '❌ Inactiva'})
                                        </span>
                                    </h3>
                                    <p style="color: #718096; margin-bottom: 1rem;">${encuesta.descripcion || 'Sin descripción'}</p>
                                </div>
                                
                                <div style="color: #4a5568; font-size: 0.9rem;">
                                    Creada: ${new Date(encuesta.created_at).toLocaleDateString('es-ES')}
                                </div>
                            </div>
                            
                            <div style="background: #f7fafc; padding: 1rem; border-radius: 8px;">
                                <h4 style="margin-top: 0; color: #4a5568; margin-bottom: 0.5rem;">📋 Opciones:</h4>
                                ${opciones && opciones.length > 0 ? 
                                    `<ul style="margin: 0; padding-left: 1.5rem; color: #4a5568;">` + 
                                    opciones.map(op => `<li><strong>${op.nombre_opcion}</strong>${op.descripcion ? ` - ${op.descripcion}` : ''}</li>`).join('') + 
                                    `</ul>` : 
                                    '<p style="color: #a0aec0; font-style: italic; margin: 0;">No hay opciones configuradas</p>'
                                }
                            </div>
                            
                            <div style="margin-top: 1rem; padding-top: 1rem; border-top: 1px solid #e2e8f0;">
                                <small style="color: #718096;">
                                    ID: <code style="font-size: 0.8rem;">${encuesta.id}</code>
                                </small>
                            </div>
                        </div>
                    `;
                }
            }
            
            listaEncuestas.innerHTML = html;
            
        } catch (error) {
            console.error('❌ Error en cargarEncuestas:', error);
            listaEncuestas.innerHTML = '<p style="color: #e53e3e;">Error al cargar encuestas</p>';
        }
    }
    
    // Verificar que supabase esté disponible
    console.log('🔌 Supabase en admin:', window.supabase ? '✅' : '❌');
});