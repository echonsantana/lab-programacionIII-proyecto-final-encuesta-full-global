document.addEventListener('DOMContentLoaded', async function() {
    console.log('🗳️ Script de votación cargado');
    
    // Elementos DOM
    const tituloEncuesta = document.getElementById('tituloEncuesta');
    const descripcionEncuesta = document.getElementById('descripcionEncuesta');
    const contenidoVotacion = document.getElementById('contenidoVotacion');
    const mensajeResultado = document.getElementById('mensajeResultado');
    
    // Mostrar estado inicial
    contenidoVotacion.innerHTML = `
        <div style="text-align: center; padding: 3rem;">
            <p>🔄 Cargando información de la encuesta...</p>
            <p><small id="estadoCarga">Iniciando...</small></p>
        </div>
    `;
    
    // Función para actualizar estado
    function actualizarEstado(mensaje) {
        const estado = document.getElementById('estadoCarga');
        if (estado) estado.textContent = mensaje;
        console.log('📊 Estado:', mensaje);
    }
    
    try {
        actualizarEstado('Obteniendo parámetros de URL...');
        
        // Obtener parámetros de la URL
        const urlParams = new URLSearchParams(window.location.search);
        const email = urlParams.get('email');
        const encuestaId = urlParams.get('encuesta_id');
        
        console.log('📋 Parámetros recibidos:');
        console.log('📧 Email:', email);
        console.log('🗳️ Encuesta ID:', encuestaId);
        
        // Validar parámetros
        if (!email || !encuestaId) {
            actualizarEstado('Error: Faltan parámetros');
            contenidoVotacion.innerHTML = `
                <div style="text-align: center; padding: 3rem 1rem; color: #e53e3e;">
                    <h3>❌ Enlace inválido</h3>
                    <p>Este enlace no contiene la información necesaria para votar.</p>
                    <p><strong>Parámetros requeridos:</strong></p>
                    <ul style="text-align: left; display: inline-block;">
                        <li><code>email</code>: ${email || 'NO PROPORCIONADO'}</li>
                        <li><code>encuesta_id</code>: ${encuestaId || 'NO PROPORCIONADO'}</li>
                    </ul>
                    <p style="margin-top: 1rem;">Por favor, usa el enlace que recibiste en tu correo electrónico.</p>
                </div>
            `;
            return;
        }
        
        actualizarEstado('Verificando participante...');
        
        // 1. Verificar que el correo esté registrado
        const { data: participante, error: errorParticipante } = await supabase
            .from('participantes')
            .select('id, nombre, apellido')
            .eq('email', email)
            .single();
        
        console.log('👤 Resultado verificación participante:', participante ? '✅ Encontrado' : '❌ No encontrado');
        
        if (errorParticipante) {
            console.error('❌ Error al buscar participante:', errorParticipante);
            
            if (errorParticipante.code === 'PGRST116') {
                // Participante no encontrado
                contenidoVotacion.innerHTML = `
                    <div style="text-align: center; padding: 3rem 1rem; color: #e53e3e;">
                        <h3>❌ Correo no registrado</h3>
                        <p>El correo <strong>${email}</strong> no está registrado en el sistema.</p>
                        <p>Contacta al administrador para registrarte.</p>
                    </div>
                `;
            } else {
                contenidoVotacion.innerHTML = `
                    <div style="text-align: center; padding: 3rem 1rem; color: #e53e3e;">
                        <h3>❌ Error al verificar participante</h3>
                        <p>${errorParticipante.message}</p>
                    </div>
                `;
            }
            return;
        }
        
        if (!participante) {
            contenidoVotacion.innerHTML = `
                <div style="text-align: center; padding: 3rem 1rem; color: #e53e3e;">
                    <h3>❌ Correo no registrado</h3>
                    <p>El correo <strong>${email}</strong> no está registrado en el sistema.</p>
                </div>
            `;
            return;
        }
        
        console.log('👤 Participante encontrado:', participante);
        actualizarEstado('Verificando encuesta...');
        
        // 2. Verificar que la encuesta existe y está activa
        const { data: encuesta, error: errorEncuesta } = await supabase
            .from('encuestas')
            .select('*')
            .eq('id', encuestaId)
            .single();
        
        console.log('📝 Resultado verificación encuesta:', encuesta ? '✅ Encontrada' : '❌ No encontrada');
        
        if (errorEncuesta) {
            console.error('❌ Error al buscar encuesta:', errorEncuesta);
            
            contenidoVotacion.innerHTML = `
                <div style="text-align: center; padding: 3rem 1rem; color: #e53e3e;">
                    <h3>❌ Error al cargar encuesta</h3>
                    <p>${errorEncuesta.message}</p>
                    <p><small>Código: ${errorEncuesta.code}</small></p>
                </div>
            `;
            return;
        }
        
        if (!encuesta) {
            contenidoVotacion.innerHTML = `
                <div style="text-align: center; padding: 3rem 1rem; color: #e53e3e;">
                    <h3>❌ Encuesta no encontrada</h3>
                    <p>La encuesta solicitada no existe en el sistema.</p>
                </div>
            `;
            return;
        }
        
        if (!encuesta.activa) {
            contenidoVotacion.innerHTML = `
                <div style="text-align: center; padding: 3rem 1rem; color: #e53e3e;">
                    <h3>❌ Encuesta inactiva</h3>
                    <p>La encuesta <strong>"${encuesta.titulo}"</strong> no está activa.</p>
                    <p>Contacta al administrador si crees que esto es un error.</p>
                </div>
            `;
            return;
        }
        
        console.log('📝 Encuesta encontrada:', encuesta.titulo);
        actualizarEstado('Verificando voto previo...');
        
        // 3. Verificar que no haya votado antes
        const { data: votoPrevio, error: errorVoto } = await supabase
            .from('votos')
            .select('id')
            .eq('participante_id', participante.id)
            .eq('encuesta_id', encuestaId)
            .maybeSingle();  // Usamos maybeSingle en lugar de single
        
        console.log('✅ Verificación voto previo:', votoPrevio ? '⚠️ Ya votó' : '✅ Puede votar');
        
        if (errorVoto && errorVoto.code !== 'PGRST116') {
            console.error('❌ Error al verificar voto previo:', errorVoto);
            // Continuamos aunque haya error en esta verificación
        }
        
        if (votoPrevio) {
            contenidoVotacion.innerHTML = `
                <div style="text-align: center; padding: 3rem 1rem;">
                    <h3>✅ Ya has votado</h3>
                    <p>Hola <strong>${participante.nombre} ${participante.apellido}</strong>,</p>
                    <p>Ya has emitido tu voto en esta encuesta.</p>
                    <p>Solo se permite un voto por persona.</p>
                    <p style="margin-top: 2rem;">
                        <a href="resultados.html" class="btn btn-primary">Ver Resultados</a>
                    </p>
                </div>
            `;
            return;
        }
        
        actualizarEstado('Cargando opciones...');
        
        // 4. Obtener opciones de la encuesta
        const { data: opciones, error: errorOpciones } = await supabase
            .from('opciones')
            .select('*')
            .eq('encuesta_id', encuestaId)
            .order('orden');
        
        console.log('📋 Resultado opciones:', opciones ? `${opciones.length} opciones` : 'Error');
        
        if (errorOpciones) {
            console.error('❌ Error al cargar opciones:', errorOpciones);
            contenidoVotacion.innerHTML = `
                <div style="text-align: center; padding: 3rem 1rem; color: #e53e3e;">
                    <h3>❌ Error al cargar opciones</h3>
                    <p>${errorOpciones.message}</p>
                </div>
            `;
            return;
        }
        
        if (!opciones || opciones.length === 0) {
            contenidoVotacion.innerHTML = `
                <div style="text-align: center; padding: 3rem 1rem; color: #e53e3e;">
                    <h3>❌ Encuesta sin opciones</h3>
                    <p>Esta encuesta no tiene opciones configuradas.</p>
                    <p>Contacta al administrador para que agregue opciones.</p>
                </div>
            `;
            return;
        }
        
        console.log('✅ Todo listo para votar');
        
        // 5. Mostrar formulario de votación
        tituloEncuesta.textContent = encuesta.titulo;
        descripcionEncuesta.textContent = encuesta.descripcion || '';
        
        let opcionesHTML = '';
        opciones.forEach((opcion, index) => {
            opcionesHTML += `
                <div style="margin-bottom: 1rem; padding: 1rem; border: 1px solid #e2e8f0; border-radius: 8px; cursor: pointer; transition: all 0.2s;"
                     class="opcion-voto"
                     data-opcion-id="${opcion.id}"
                     onclick="seleccionarOpcion(this, '${opcion.id}')">
                    <div style="display: flex; align-items: center; gap: 1rem;">
                        <div style="width: 24px; height: 24px; border: 2px solid #cbd5e0; border-radius: 50%; display: flex; align-items: center; justify-content: center;">
                            <div class="circulo-seleccion" style="width: 14px; height: 14px; border-radius: 50%; background: #4c51bf; display: none;"></div>
                        </div>
                        <div>
                            <h4 style="margin: 0; color: #2d3748;">${opcion.nombre_opcion}</h4>
                            ${opcion.descripcion ? `<p style="margin: 0.25rem 0 0 0; color: #718096;">${opcion.descripcion}</p>` : ''}
                        </div>
                    </div>
                </div>
            `;
        });
        
        contenidoVotacion.innerHTML = `
            <div style="margin-top: 2rem;">
                <p>Hola <strong>${participante.nombre} ${participante.apellido}</strong> (${email})</p>
                <p>Selecciona una opción:</p>
                
                <form id="formVotacion">
                    <div id="listaOpciones">
                        ${opcionesHTML}
                    </div>
                    
                    <input type="hidden" id="opcionSeleccionada" name="opcion_id">
                    
                    <div style="margin-top: 2rem; padding-top: 1.5rem; border-top: 1px solid #e2e8f0;">
                        <button type="submit" id="btnVotar" class="btn btn-primary" style="width: 100%;" disabled>
                            <span id="btnTexto">Selecciona una opción para votar</span>
                            <span id="btnCargando" style="display: none;">⏳ Enviando voto...</span>
                        </button>
                    </div>
                </form>
            </div>
        `;
        
        // Configurar evento del formulario
        document.getElementById('formVotacion').addEventListener('submit', async function(e) {
            e.preventDefault();
            
            const opcionId = document.getElementById('opcionSeleccionada').value;
            if (!opcionId) return;
            
            const btnVotar = document.getElementById('btnVotar');
            const btnTexto = document.getElementById('btnTexto');
            const btnCargando = document.getElementById('btnCargando');
            
            btnVotar.disabled = true;
            btnTexto.style.display = 'none';
            btnCargando.style.display = 'inline';
            
            try {
                // Insertar voto
                const voto = {
                    encuesta_id: encuestaId,
                    participante_id: participante.id,
                    opcion_id: opcionId
                };
                
                console.log('📤 Insertando voto:', voto);
                
                const { data, error } = await supabase
                    .from('votos')
                    .insert([voto])
                    .select();
                
                if (error) {
                    console.error('❌ Error al insertar voto:', error);
                    throw error;
                }
                
                console.log('✅ Voto registrado:', data);
                
                // Éxito
                mensajeResultado.innerHTML = `
                    <div style="text-align: center;">
                        <h3 style="color: #38a169;">✅ ¡Voto registrado exitosamente!</h3>
                        <p>Gracias por participar en la encuesta.</p>
                        <p style="margin-top: 1rem;">
                            <a href="resultados.html" class="btn btn-primary">Ver Resultados</a>
                        </p>
                    </div>
                `;
                mensajeResultado.style.display = 'block';
                contenidoVotacion.style.display = 'none';
                
            } catch (error) {
                console.error('❌ Error al votar:', error);
                
                // Mostrar error específico
                let mensajeError = 'Error al registrar el voto';
                if (error.code === '42501') {
                    mensajeError = 'Error de permisos. Contacta al administrador.';
                } else if (error.code === '23505') {
                    mensajeError = 'Ya has votado en esta encuesta.';
                }
                
                alert(`❌ ${mensajeError}\n\nDetalles: ${error.message}`);
                
                // Rehabilitar botón
                btnVotar.disabled = false;
                btnTexto.style.display = 'inline';
                btnCargando.style.display = 'none';
            }
        });
        
        console.log('✅ Formulario de votación listo');
        
    } catch (error) {
        console.error('❌ Error general inesperado:', error);
        contenidoVotacion.innerHTML = `
            <div style="text-align: center; padding: 3rem 1rem; color: #e53e3e;">
                <h3>❌ Error inesperado</h3>
                <p>${error.message}</p>
                <p><small>Revisa la consola para más detalles.</small></p>
            </div>
        `;
    }
});

// Función para seleccionar opción (global para onclick)
window.seleccionarOpcion = function(elemento, opcionId) {
    // Deseleccionar todas
    document.querySelectorAll('.opcion-voto').forEach(op => {
        op.style.borderColor = '#e2e8f0';
        op.style.backgroundColor = 'white';
        op.querySelector('.circulo-seleccion').style.display = 'none';
    });
    
    // Seleccionar esta
    elemento.style.borderColor = '#4c51bf';
    elemento.style.backgroundColor = '#f7fafc';
    elemento.querySelector('.circulo-seleccion').style.display = 'block';
    
    // Actualizar input hidden
    document.getElementById('opcionSeleccionada').value = opcionId;
    
    // Habilitar botón
    const btnVotar = document.getElementById('btnVotar');
    const btnTexto = document.getElementById('btnTexto');
    if (btnVotar && btnTexto) {
        btnVotar.disabled = false;
        btnTexto.textContent = 'Enviar mi voto';
    }
};