import { logger } from '../../utils/logger.js';
import { productModel, guaranteeModel, scheduleModel, storeConfigModel, conversationModel } from '../../database/models.js';
export class AIProcessor {
    static instance;
    constructor() { }
    static getInstance() {
        if (!AIProcessor.instance) {
            AIProcessor.instance = new AIProcessor();
        }
        return AIProcessor.instance;
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
            const result = await productModel.getAllProducts({
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
            const result = await storeConfigModel.getStoreConfig();
            if (!result.success) {
                return {
                    success: false,
                    error: result.error || 'Error desconocido'
                };
            }
            if (!result.data) {
                return {
                    success: false,
                    error: 'No se encontró configuración de la tienda'
                };
            }
            return {
                success: true,
                data: result.data,
                message: 'Información de ubicación obtenida'
            };
        }
        catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Error obteniendo ubicación'
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
}
//# sourceMappingURL=ai-processor.js.map