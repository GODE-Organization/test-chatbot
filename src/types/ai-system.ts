/**
 * Tipos para el sistema de integración con IA externa
 */

// Comandos disponibles para la IA externa
export type AICommand = 
  | 'CONSULT_CATALOG'
  | 'CONSULT_GUARANTEES'
  | 'REGISTER_GUARANTEE'
  | 'CONSULT_SCHEDULE'
  | 'SEND_GEOLOCATION'
  | 'END_CONVERSATION';

// Parámetros para cada comando
export interface ConsultCatalogParams {
  filters?: {
    brand?: string;
    minPrice?: number;
    maxPrice?: number;
  };
  limit?: number;
}

export interface ConsultGuaranteesParams {
  user_id: number;
}

export interface RegisterGuaranteeParams {
  // No parámetros específicos, inicia flujo
}

export interface ConsultScheduleParams {
  // No parámetros específicos
}

export interface SendGeolocationParams {
  // No parámetros específicos
}

export interface EndConversationParams {
  reason?: string;
}

// Unión de todos los parámetros posibles
export type AICommandParams = 
  | ConsultCatalogParams
  | ConsultGuaranteesParams
  | RegisterGuaranteeParams
  | ConsultScheduleParams
  | SendGeolocationParams
  | EndConversationParams;

// Estructura de una acción de la IA
export interface AIAction {
  command: AICommand;
  parameters: AICommandParams;
}

// Estructura de respuesta de la IA
export interface AIResponse {
  text: string;
  parse_mode?: 'Markdown' | 'HTML' | null;
  reply_markup?: {
    inline_keyboard?: any[][];
    keyboard?: any[][];
  };
}

// Estructura completa del JSON de la IA externa
export interface AIExternalResponse {
  response: AIResponse;
  actions: AIAction[];
  session_data?: Record<string, any>;
}

// Estados de flujo del bot
export type BotFlowState = 
  | 'idle'           // Estado normal
  | 'guarantee_flow' // Flujo de registro de garantía
  | 'survey_waiting' // Esperando respuesta de encuesta
  | 'conversation_ended'; // Conversación terminada

// Estados específicos del flujo de garantía
export type GuaranteeFlowStep = 
  | 'waiting_invoice_number'
  | 'waiting_invoice_photo'
  | 'waiting_product_photo'
  | 'waiting_description'
  | 'completed';

// Datos de sesión del usuario
export interface UserSessionData {
  state: BotFlowState;
  flow_data?: {
    guarantee_flow?: {
      step: GuaranteeFlowStep;
      data: {
        invoice_number?: string;
        invoice_photo_file_id?: string;
        product_photo_file_id?: string;
        description?: string;
      };
    };
    survey_data?: {
      conversation_id: number;
      waiting_for_rating: boolean;
    };
  };
  ai_session_data?: Record<string, any>;
  last_activity: Date;
}

// Respuesta de comandos de IA
export interface AICommandResponse {
  success: boolean;
  data?: any;
  error?: string;
  message?: string;
}

// Estructura de producto para el catálogo
export interface Product {
  id: number;
  code: string;
  brand: string;
  image_file_id?: string;
  price: number;
  description?: string;
  available_units: number;
  created_at: string;
  updated_at: string;
}

// Estructura de garantía
export interface Guarantee {
  id: number;
  user_id: number;
  invoice_number: string;
  invoice_photo_file_id: string;
  product_photo_file_id: string;
  description: string;
  status: 'pending' | 'approved' | 'rejected' | 'in_progress';
  created_at: string;
}

// Estructura de horario
export interface Schedule {
  id: number;
  day_of_week: number; // 0-6 (domingo-sábado)
  open_time: string;
  close_time: string;
  is_active: boolean;
  created_at: string;
}

// Estructura de configuración de tienda
export interface StoreConfig {
  id: number;
  name: string;
  address: string;
  latitude?: number;
  longitude?: number;
  phone?: string;
  email?: string;
  created_at: string;
  updated_at: string;
}

// Estructura de encuesta de satisfacción
export interface SatisfactionSurvey {
  id: number;
  user_id: number;
  rating: number; // 1-5
  feedback?: string;
  conversation_id?: number;
  created_at: string;
}

// Estructura de conversación
export interface Conversation {
  id: number;
  user_id: number;
  started_at: string;
  ended_at?: string;
  status: 'active' | 'ended';
  ai_session_data?: string;
}

// Configuración del sistema de IA
export interface AISystemConfig {
  external_ai_url: string;
  api_key?: string;
  timeout_ms: number;
  max_retries: number;
  conversation_timeout_minutes: number;
}

// Resultado de procesamiento de mensaje
export interface MessageProcessingResult {
  success: boolean;
  response?: AIResponse;
  actions?: AIAction[];
  session_data?: Record<string, any>;
  action_results?: AICommandResponse[];
  error?: string;
}
