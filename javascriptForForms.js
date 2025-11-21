 function enviarWhatsApp(event) {
            event.preventDefault(); // Evita el envío tradicional del formulario
            
            const form = event.target;
            const nombre = form.nombre.value + ' ' + form.apellidos.value;
            const email = form.email.value;
            const telefono = form.telefono.value;
            const instrumento = form.instrumento.value;
            
            const nivelElemento = form.elements['nivel'];
            let nivel = '';
            for (let i = 0; i < nivelElemento.length; i++) {
                if (nivelElemento[i].checked) {
                    nivel = nivelElemento[i].value;
                    break;
                }
            }
            if (!nivel) {
                 nivel = 'No especificado';
            }

            const dias = form.dias.value || 'No especificado';
            const comentarios = form.comentarios.value || 'No hay comentarios adicionales.';
            
            // ⚠️ Nuevo Número de destino: +52 1 81 8029 0034 (formato para WhatsApp: 52 + 10 dígitos)
            const numeroDestino = '528180290034'; 
            
            const mensaje = `*Nueva Solicitud de Inscripción - Academia SONATA*%0A%0A` +
                            `*Datos del Alumno:*%0A` +
                            `  Nombre: ${nombre}%0A` +
                            `  Email: ${email}%0A` +
                            `  Teléfono: ${telefono}%0A%0A` +
                            `*Detalles del Curso:*%0A` +
                            `  Instrumento de Interés: ${instrumento}%0A` +
                            `  Nivel de Experiencia: ${nivel}%0A` +
                            `  Días/Horarios Preferidos: ${dias}%0A%0A` +
                            `*Comentarios Adicionales:*%0A` +
                            `${comentarios}`;

            const urlWhatsApp = `https://api.whatsapp.com/send?phone=${numeroDestino}&text=${encodeURIComponent(mensaje)}`;
            
            // Redirigir al usuario
            window.open(urlWhatsApp, '_blank');
        }