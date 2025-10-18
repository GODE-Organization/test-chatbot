import { logger } from '../../utils/logger.js';
import { productModel, guaranteeModel, scheduleModel, storeConfigModel, conversationModel } from '../../database/models.js';
import { GeminiAdapter, GeminiAdapterFactory } from './gemini-adapter.js';
export class AIProcessor {
    static instance;
    geminiAdapter;
    constructor() {
        this.geminiAdapter = GeminiAdapterFactory.createAdapter();
    }
    static getInstance() {
        if (!AIProcessor.instance) {
            AIProcessor.instance = new AIProcessor();
        }
        return AIProcessor.instance;
    }
    async sendMessageToAI(userMessage, userId, chatId, sessionData) {
        try {
            logger.debug(`Enviando mensaje a Gemini - Usuario: ${userId}, Chat: ${chatId}`);
            const result = await this.geminiAdapter.sendMessageToAI(userMessage, userId, sessionData);
            if (!result.success) {
                return result;
            }
            const actionResults = [];
            for (const action of result.actions || []) {
                const actionResult = await this.executeAIAction(action, userId, chatId);
                actionResults.push(actionResult);
                if (action.command === 'CONSULT_CATALOG' && actionResult.success && actionResult.data) {
                    logger.info('🛍️ Enviando datos de catálogo a Gemini para formateo:', {
                        productCount: actionResult.data.length,
                        userId
                    });
                    const catalogResult = await this.sendCatalogDataToGemini(actionResult.data, userId, sessionData);
                    if (catalogResult.success) {
                        result.response = catalogResult.response;
                        logger.info('✅ Respuesta de catálogo formateada por Gemini:', catalogResult.response);
                        if (catalogResult.actions && catalogResult.actions.length > 0) {
                            for (const imageAction of catalogResult.actions) {
                                const imageResult = await this.executeAIAction(imageAction, userId, chatId);
                                actionResults.push(imageResult);
                                if (imageResult.success && imageResult.data) {
                                    if (!result.response.images) {
                                        result.response.images = [];
                                    }
                                    result.response.images.push({
                                        file_id: imageResult.data.file_id,
                                        product: imageResult.data.product
                                    });
                                }
                            }
                        }
                    }
                }
                if (action.command === 'CONSULT_GUARANTEES' && actionResult.success && actionResult.data) {
                    logger.info('🔧 Enviando datos de garantías a Gemini para formateo:', {
                        guaranteeCount: actionResult.data.length,
                        userId
                    });
                    const guaranteesResult = await this.sendGuaranteesDataToGemini(actionResult.data, userId, sessionData);
                    if (guaranteesResult.success) {
                        result.response = guaranteesResult.response;
                        logger.info('✅ Respuesta de garantías formateada por Gemini:', guaranteesResult.response);
                    }
                }
                if (action.command === 'SEND_IMAGE' && actionResult.success && actionResult.data) {
                    logger.info('📸 Preparando imagen de producto:', {
                        productId: actionResult.data.product?.id,
                        fileId: actionResult.data.file_id,
                        userId
                    });
                    if (result.response && !result.response.images) {
                        result.response.images = [];
                    }
                    if (result.response) {
                        result.response.images.push({
                            file_id: actionResult.data.file_id,
                            product: actionResult.data.product
                        });
                    }
                }
            }
            const response = result.response || { text: 'Respuesta procesada correctamente', parse_mode: 'Markdown' };
            return {
                success: true,
                response,
                actions: result.actions || [],
                session_data: result.session_data || {},
                action_results: actionResults
            };
        }
        catch (error) {
            logger.error('Error enviando mensaje a Gemini:', error);
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Error de comunicación con Gemini'
            };
        }
    }
    async processAIResponse(aiResponse, userId, chatId) {
        try {
            if (!this.validateAIResponse(aiResponse)) {
                return {
                    success: false,
                    error: 'Respuesta de IA inválida'
                };
            }
            const actionResults = [];
            for (const action of aiResponse.actions) {
                const result = await this.executeAIAction(action, userId, chatId);
                actionResults.push(result);
            }
            const failedActions = actionResults.filter(result => !result.success);
            if (failedActions.length > 0) {
                logger.error('Algunas acciones de IA fallaron:', failedActions);
            }
            return {
                success: true,
                response: aiResponse.response,
                actions: aiResponse.actions,
                session_data: aiResponse.session_data || {}
            };
        }
        catch (error) {
            logger.error('Error procesando respuesta de IA:', error);
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Error desconocido'
            };
        }
    }
    validateAIResponse(response) {
        return (response &&
            typeof response === 'object' &&
            response.response &&
            typeof response.response.text === 'string' &&
            Array.isArray(response.actions));
    }
    async executeAIAction(action, userId, chatId) {
        try {
            switch (action.command) {
                case 'CONSULT_CATALOG':
                    return await this.handleConsultCatalog(action.parameters);
                case 'CONSULT_GUARANTEES':
                    return await this.handleConsultGuarantees(action.parameters);
                case 'REGISTER_GUARANTEE':
                    return await this.handleRegisterGuarantee(userId);
                case 'CONSULT_SCHEDULE':
                    return await this.handleConsultSchedule();
                case 'SEND_GEOLOCATION':
                    return await this.handleSendGeolocation();
                case 'SEND_IMAGE':
                    return await this.handleSendImage(action.parameters);
                case 'END_CONVERSATION':
                    return await this.handleEndConversation(userId, action.parameters);
                default:
                    return {
                        success: false,
                        error: `Comando no reconocido: ${action.command}`
                    };
            }
        }
        catch (error) {
            logger.error(`Error ejecutando acción ${action.command}:`, error);
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Error desconocido'
            };
        }
    }
    async handleConsultCatalog(parameters) {
        try {
            const filters = parameters?.filters || {};
            const limit = parameters?.limit || 10;
            const result = await productModel.getAllProductsWithBsPrice({
                brand: filters.brand,
                minPrice: filters.minPrice,
                maxPrice: filters.maxPrice,
                limit
            });
            if (!result.success) {
                return {
                    success: false,
                    error: result.error || 'Error desconocido'
                };
            }
            return {
                success: true,
                data: result.data,
                message: `Se encontraron ${result.data?.length || 0} productos`
            };
        }
        catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Error consultando catálogo'
            };
        }
    }
    async handleConsultGuarantees(parameters) {
        try {
            const userId = parameters?.user_id;
            if (!userId) {
                return {
                    success: false,
                    error: 'user_id es requerido para consultar garantías'
                };
            }
            const result = await guaranteeModel.getGuaranteesByUserId(userId);
            if (!result.success) {
                return {
                    success: false,
                    error: result.error || 'Error desconocido'
                };
            }
            return {
                success: true,
                data: result.data,
                message: `Se encontraron ${result.data?.length || 0} garantías`
            };
        }
        catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Error consultando garantías'
            };
        }
    }
    async handleRegisterGuarantee(userId) {
        try {
            const conversationResult = await conversationModel.createConversation({
                user_id: userId,
                ai_session_data: JSON.stringify({ flow: 'guarantee_registration' })
            });
            if (!conversationResult.success) {
                return {
                    success: false,
                    error: conversationResult.error || 'Error desconocido'
                };
            }
            return {
                success: true,
                data: {
                    conversation_id: conversationResult.data?.id,
                    flow_started: true
                },
                message: 'Flujo de registro de garantía iniciado'
            };
        }
        catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Error iniciando flujo de garantía'
            };
        }
    }
    async handleConsultSchedule() {
        try {
            const result = await scheduleModel.getAllSchedules();
            if (!result.success) {
                return {
                    success: false,
                    error: result.error || 'Error desconocido'
                };
            }
            return {
                success: true,
                data: result.data,
                message: 'Horarios obtenidos correctamente'
            };
        }
        catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Error consultando horarios'
            };
        }
    }
    async handleSendGeolocation() {
        try {
            const locationData = {
                latitude: 11.051815957943532,
                longitude: -63.900847183788,
                address: 'Porlamar, Nueva Esparta, Venezuela',
                store_name: 'Tecno Express'
            };
            return {
                success: true,
                data: locationData,
                message: 'Ubicación de Tecno Express obtenida'
            };
        }
        catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Error obteniendo ubicación'
            };
        }
    }
    async handleSendImage(parameters) {
        try {
            const { product_id, file_id } = parameters || {};
            if (!product_id || !file_id) {
                return {
                    success: false,
                    error: 'product_id y file_id son requeridos para enviar imagen'
                };
            }
            const productResult = await productModel.getProductById(product_id);
            if (!productResult.success || !productResult.data) {
                return {
                    success: false,
                    error: 'Producto no encontrado'
                };
            }
            return {
                success: true,
                data: {
                    product: productResult.data,
                    file_id: file_id
                },
                message: 'Imagen de producto preparada para envío'
            };
        }
        catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Error manejando imagen'
            };
        }
    }
    async handleEndConversation(userId, parameters) {
        try {
            const conversationResult = await conversationModel.getActiveConversation(userId);
            if (conversationResult.success && conversationResult.data) {
                await conversationModel.endConversation(conversationResult.data.id);
            }
            return {
                success: true,
                data: {
                    conversation_ended: true,
                    reason: parameters?.reason || 'Usuario terminó la conversación'
                },
                message: 'Conversación terminada'
            };
        }
        catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Error terminando conversación'
            };
        }
    }
    createInitialSession() {
        return {
            state: 'idle',
            last_activity: new Date()
        };
    }
    updateSessionForGuaranteeFlow(session) {
        return {
            ...session,
            state: 'guarantee_flow',
            flow_data: {
                ...session.flow_data,
                guarantee_flow: {
                    step: 'waiting_invoice_number',
                    data: {}
                }
            },
            last_activity: new Date()
        };
    }
    updateSessionForSurvey(session, conversationId) {
        return {
            ...session,
            state: 'survey_waiting',
            flow_data: {
                ...session.flow_data,
                survey_data: {
                    conversation_id: conversationId,
                    waiting_for_rating: true
                }
            },
            last_activity: new Date()
        };
    }
    resetSessionToIdle(session) {
        return {
            state: 'idle',
            last_activity: new Date()
        };
    }
    async sendCatalogDataToGemini(products, userId, sessionData) {
        try {
            const catalogPrompt = `
FORMATEAR CATÁLOGO DE PRODUCTOS:

Tienes que formatear la siguiente lista de productos de Tecno Express de manera atractiva y organizada para el usuario.

PRODUCTOS DISPONIBLES:
${JSON.stringify(products, null, 2)}

INSTRUCCIONES:
1. Presenta los productos de forma atractiva con emojis apropiados
2. Incluye precio en USD y Bs (bolívares venezolanos), descripción y disponibilidad
3. Organiza por categorías si es posible
4. Usa formato Markdown para mejor presentación
5. Si hay productos sin stock, indícalo claramente
6. Mantén un tono amigable y profesional como Max
7. Si un producto tiene imagen disponible (image_file_id), puedes usar el comando SEND_IMAGE para mostrarla
8. Para usar imágenes, incluye en tu respuesta JSON el comando: {"command": "SEND_IMAGE", "parameters": {"product_id": X, "file_id": "file_id_del_producto"}}
9. SIEMPRE muestra ambos precios: USD y Bs usando el formato "Precio: $X USD / Y Bs"
10. Si un producto tiene price_bs, úsalo; si no, indica que la conversión no está disponible

FORMATO DE RESPUESTA:
Responde con JSON en este formato:
{
  "response": {
    "text": "Tu texto formateado aquí",
    "parse_mode": "Markdown"
  },
  "actions": [
    {"command": "SEND_IMAGE", "parameters": {"product_id": 1, "file_id": "file_id_aqui"}}
  ]
}

Ejemplo de texto formateado:
🛍️ **Nuestros Productos Disponibles**

**🍳 Electrodomésticos de Cocina**
• **Freidora de Aire** - Precio: $90 USD / 17,572 Bs
  _Capacidad 5L, 7 programas, 1500W_
  ✅ Disponible (3 unidades)

• **Cafetera de Goteo** - Precio: $27 USD / 5,272 Bs
  _1.2L, función mantener caliente_
  ✅ Disponible (4 unidades)
      `.trim();
            const result = await this.geminiAdapter.sendMessageToAI(catalogPrompt, userId, sessionData);
            if (!result.success) {
                logger.error('Error formateando catálogo con Gemini:', result.error);
                return {
                    success: false,
                    error: result.error || 'Error formateando catálogo'
                };
            }
            const imageActions = result.actions?.filter(action => action.command === 'SEND_IMAGE') || [];
            return {
                success: true,
                response: result.response || { text: 'Catálogo formateado', parse_mode: 'Markdown' },
                actions: imageActions,
                session_data: result.session_data || {}
            };
        }
        catch (error) {
            logger.error('Error enviando datos de catálogo a Gemini:', error);
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Error formateando catálogo'
            };
        }
    }
    async sendGuaranteesDataToGemini(guarantees, userId, sessionData) {
        try {
            const guaranteesPrompt = `
FORMATEAR GARANTÍAS DEL USUARIO:

Tienes que formatear la siguiente lista de garantías del usuario de Tecno Express de manera clara y organizada.

GARANTÍAS DEL USUARIO:
${JSON.stringify(guarantees, null, 2)}

INSTRUCCIONES:
1. Presenta las garantías de forma clara con emojis apropiados
2. Incluye número de garantía, número de factura, estado, fecha de creación y descripción
3. Organiza por estado (Pendiente, En Proceso, Aprobada, Rechazada, Completada)
4. Usa formato Markdown para mejor presentación
5. Muestra el estado con emojis apropiados:
   - ⏳ Pendiente
   - 🔄 En Proceso
   - ✅ Aprobada
   - ❌ Rechazada
   - 🎉 Completada
6. Mantén un tono amigable y profesional como Max
7. Si no hay garantías, explica que el usuario puede registrar una nueva
8. Incluye información sobre cómo registrar una nueva garantía si es necesario

FORMATO DE RESPUESTA:
Responde con JSON en este formato:
{
  "response": {
    "text": "Tu texto formateado aquí",
    "parse_mode": "Markdown",
    "reply_markup": {
      "inline_keyboard": [
        [{"text": "🔧 Registrar Nueva Garantía", "callback_data": "start_guarantee_flow"}]
      ]
    }
  }
}

Ejemplo de texto formateado:
🔧 **Mis Garantías**

**⏳ Garantías Pendientes**
• **Garantía #123** - Factura: INV-2024-001
  _Fecha: 15/10/2024_
  _Descripción: Problema con la pantalla del microondas_
  ⏳ Pendiente de revisión

**✅ Garantías Aprobadas**
• **Garantía #120** - Factura: INV-2024-002
  _Fecha: 10/10/2024_
  _Descripción: Fallo en el motor de la licuadora_
  ✅ Aprobada - En proceso de reparación

**🎉 Garantías Completadas**
• **Garantía #115** - Factura: INV-2024-003
  _Fecha: 05/10/2024_
  _Descripción: Problema con el termostato de la plancha_
  🎉 Completada - Producto reparado exitosamente

💡 **¿Necesitas registrar una nueva garantía?**
Puedes hacerlo enviando el comando /garantia o usando el botón de abajo.
      `.trim();
            const result = await this.geminiAdapter.sendMessageToAI(guaranteesPrompt, userId, sessionData);
            if (!result.success) {
                logger.error('Error formateando garantías con Gemini:', result.error);
                return {
                    success: false,
                    error: result.error || 'Error formateando garantías'
                };
            }
            return {
                success: true,
                response: result.response || { text: 'Garantías formateadas', parse_mode: 'Markdown' },
                actions: result.actions || [],
                session_data: result.session_data || {}
            };
        }
        catch (error) {
            logger.error('Error enviando datos de garantías a Gemini:', error);
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Error formateando garantías'
            };
        }
    }
    async checkGeminiConnectivity() {
        try {
            return await this.geminiAdapter.checkConnectivity();
        }
        catch (error) {
            logger.error('Error verificando conectividad con Gemini:', error);
            return false;
        }
    }
}
//# sourceMappingURL=ai-processor.js.map