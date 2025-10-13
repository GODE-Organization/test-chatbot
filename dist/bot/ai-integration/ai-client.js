import { logger } from '../../utils/logger.js';
export class AIClient {
    static instance;
    config;
    constructor(config) {
        this.config = config;
    }
    static getInstance(config) {
        if (!AIClient.instance) {
            if (!config) {
                throw new Error('Configuración de IA requerida para crear instancia');
            }
            AIClient.instance = new AIClient(config);
        }
        return AIClient.instance;
    }
    async sendMessageToAI(userMessage, userId, sessionData) {
        try {
            const requestBody = {
                message: userMessage,
                user_id: userId,
                session_data: sessionData || {},
                timestamp: new Date().toISOString()
            };
            const response = await this.makeRequest(requestBody);
            if (!response.success) {
                return {
                    success: false,
                    error: response.error || 'Error en comunicación con IA'
                };
            }
            return {
                success: true,
                response: response.data?.response,
                actions: response.data?.actions || [],
                session_data: response.data?.session_data || {}
            };
        }
        catch (error) {
            logger.error('Error enviando mensaje a IA externa:', error);
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Error de comunicación'
            };
        }
    }
    async makeRequest(requestBody) {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), this.config.timeout_ms);
        try {
            const headers = {
                'Content-Type': 'application/json',
                'User-Agent': 'TelegramBot/1.0'
            };
            if (this.config.api_key) {
                headers['Authorization'] = `Bearer ${this.config.api_key}`;
            }
            const response = await fetch(this.config.external_ai_url, {
                method: 'POST',
                headers,
                body: JSON.stringify(requestBody),
                signal: controller.signal
            });
            clearTimeout(timeoutId);
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            const data = await response.json();
            if (!this.validateAIResponse(data)) {
                throw new Error('Respuesta de IA inválida');
            }
            return {
                success: true,
                data
            };
        }
        catch (error) {
            clearTimeout(timeoutId);
            if (error instanceof Error) {
                if (error.name === 'AbortError') {
                    throw new Error('Timeout en comunicación con IA');
                }
                throw error;
            }
            throw new Error('Error desconocido en comunicación con IA');
        }
    }
    validateAIResponse(data) {
        return (data &&
            typeof data === 'object' &&
            data.response &&
            typeof data.response.text === 'string' &&
            Array.isArray(data.actions));
    }
    async checkConnectivity() {
        try {
            const testMessage = {
                message: 'test',
                user_id: 0,
                session_data: {},
                timestamp: new Date().toISOString()
            };
            const response = await this.makeRequest(testMessage);
            return response.success;
        }
        catch (error) {
            logger.error('Error verificando conectividad con IA:', error);
            return false;
        }
    }
    getConfig() {
        return { ...this.config };
    }
    updateConfig(newConfig) {
        this.config = { ...this.config, ...newConfig };
    }
}
export class AIClientFactory {
    static defaultConfig = {
        external_ai_url: process.env['AI_EXTERNAL_URL'] || 'http://localhost:3001/api/ai',
        api_key: process.env['AI_API_KEY'] || '',
        timeout_ms: parseInt(process.env['AI_TIMEOUT_MS'] || '30000'),
        max_retries: parseInt(process.env['AI_MAX_RETRIES'] || '3'),
        conversation_timeout_minutes: parseInt(process.env['CONVERSATION_TIMEOUT_MINUTES'] || '15')
    };
    static createClient(config) {
        const finalConfig = { ...this.defaultConfig, ...config };
        return AIClient.getInstance(finalConfig);
    }
    static getDefaultConfig() {
        return { ...this.defaultConfig };
    }
}
//# sourceMappingURL=ai-client.js.map