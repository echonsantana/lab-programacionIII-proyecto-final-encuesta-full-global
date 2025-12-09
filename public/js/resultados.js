document.addEventListener('DOMContentLoaded', async function() {
    const selectEncuesta = document.getElementById('selectEncuesta');
    const resultadosContainer = document.getElementById('resultadosContainer');
    
    // Cargar encuestas activas
    await cargarEncuestas();
    
    // Cuando se selecciona una encuesta
    selectEncuesta.addEventListener('change', async function() {
        const encuestaId = this.value;
        if (!encuestaId) {
            resultadosContainer.innerHTML = `
                <p style="text-align: center; padding: 3rem; color: #718096;">
                    Selecciona una encuesta para ver los resultados
                </p>
            `;
            return;
        }
        
        await cargarResultados(encuestaId);
    });
    
    async function cargarEncuestas() {
        try {
            const { data: encuestas, error } = await supabase
                .from('encuestas')
                .select('id, titulo')
                .eq('activa', true)
                .order('created_at', { ascending: false });
            
            if (error) throw error;
            
            selectEncuesta.innerHTML = '<option value="">Selecciona una encuesta</option>';
            encuestas.forEach(encuesta => {
                const option = document.createElement('option');
                option.value = encuesta.id;
                option.textContent = encuesta.titulo;
                selectEncuesta.appendChild(option);
            });
            
        } catch (error) {
            console.error('Error al cargar encuestas:', error);
            selectEncuesta.innerHTML = '<option value="">Error al cargar encuestas</option>';
        }
    }
    
    async function cargarResultados(encuestaId) {
        resultadosContainer.innerHTML = `
            <div style="text-align: center; padding: 2rem;">
                <p>Cargando resultados...</p>
            </div>
        `;
        
        try {
            // Usar la vista que creamos
            const { data: resultados, error } = await supabase
                .from('resultados_encuestas')
                .select('*')
                .eq('encuesta_id', encuestaId)
                .order('orden');
            
            if (error) throw error;
            
            if (!resultados || resultados.length === 0) {
                resultadosContainer.innerHTML = `
                    <div style="text-align: center; padding: 3rem; color: #718096;">
                        <h3>No hay resultados aún</h3>
                        <p>Aún no hay votos registrados para esta encuesta.</p>
                    </div>
                `;
                return;
            }
            
            // Obtener título de la encuesta
            const tituloEncuesta = resultados[0].encuesta_titulo;
            const totalVotos = resultados.reduce((sum, r) => sum + (r.total_votos || 0), 0);
            
            // Preparar datos para gráfico
            const labels = resultados.map(r => r.nombre_opcion);
            const datos = resultados.map(r => r.total_votos || 0);
            const porcentajes = resultados.map(r => r.porcentaje || 0);
            
            // Colores para el gráfico
            const colores = [
                '#4c51bf', '#805ad5', '#38a169', '#e53e3e', 
                '#d69e2e', '#319795', '#d53f8c', '#3182ce'
            ];
            
            // Crear HTML de resultados
            let resultadosHTML = `
                <div style="margin-bottom: 2rem;">
                    <h3>${tituloEncuesta}</h3>
                    <p style="color: #718096;">Total de votos: <strong>${totalVotos}</strong></p>
                </div>
                
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 2rem; margin-bottom: 2rem;">
                    <div>
                        <h4>📊 Gráfico de Resultados</h4>
                        <div style="height: 300px;">
                            <canvas id="graficoResultados"></canvas>
                        </div>
                    </div>
                    
                    <div>
                        <h4>📋 Tabla de Resultados</h4>
                        <div style="overflow-x: auto;">
                            <table style="width: 100%; border-collapse: collapse;">
                                <thead>
                                    <tr style="background: #f7fafc;">
                                        <th style="padding: 0.75rem; text-align: left; border-bottom: 2px solid #e2e8f0;">Opción</th>
                                        <th style="padding: 0.75rem; text-align: right; border-bottom: 2px solid #e2e8f0;">Votos</th>
                                        <th style="padding: 0.75rem; text-align: right; border-bottom: 2px solid #e2e8f0;">Porcentaje</th>
                                    </tr>
                                </thead>
                                <tbody>
            `;
            
            resultados.forEach((resultado, index) => {
                resultadosHTML += `
                    <tr style="border-bottom: 1px solid #e2e8f0;">
                        <td style="padding: 0.75rem;">
                            <div style="display: flex; align-items: center; gap: 0.5rem;">
                                <div style="width: 12px; height: 12px; border-radius: 50%; background: ${colores[index % colores.length]};"></div>
                                ${resultado.nombre_opcion}
                            </div>
                        </td>
                        <td style="padding: 0.75rem; text-align: right; font-weight: 600;">${resultado.total_votos || 0}</td>
                        <td style="padding: 0.75rem; text-align: right;">
                            <span style="background: ${colores[index % colores.length]}20; color: ${colores[index % colores.length]}; padding: 0.25rem 0.75rem; border-radius: 9999px; font-weight: 600;">
                                ${resultado.porcentaje || 0}%
                            </span>
                        </td>
                    </tr>
                `;
            });
            
            resultadosHTML += `
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            `;
            
            resultadosContainer.innerHTML = resultadosHTML;
            
            // Crear gráfico
            const ctx = document.getElementById('graficoResultados').getContext('2d');
            new Chart(ctx, {
                type: 'bar',
                data: {
                    labels: labels,
                    datasets: [{
                        label: 'Votos',
                        data: datos,
                        backgroundColor: colores,
                        borderColor: colores.map(c => c.replace('0.8', '1')),
                        borderWidth: 1
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: {
                            display: false
                        },
                        tooltip: {
                            callbacks: {
                                label: function(context) {
                                    const porcentaje = porcentajes[context.dataIndex];
                                    return `Votos: ${context.raw} (${porcentaje}%)`;
                                }
                            }
                        }
                    },
                    scales: {
                        y: {
                            beginAtZero: true,
                            ticks: {
                                stepSize: 1
                            }
                        }
                    }
                }
            });
            
        } catch (error) {
            console.error('Error al cargar resultados:', error);
            resultadosContainer.innerHTML = `
                <div style="text-align: center; padding: 3rem; color: #e53e3e;">
                    <h3>Error al cargar resultados</h3>
                    <p>${error.message}</p>
                </div>
            `;
        }
    }
});