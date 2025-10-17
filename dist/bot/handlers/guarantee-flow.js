import { logger } from '../../utils/logger.js';
import { guaranteeModel } from '../../database/models.js';
import { AIProcessor } from '../ai-integration/ai-processor.js';
export class GuaranteeFlowHandler {
    static instance;
    aiProcessor;
    constructor() {
        this.aiProcessor = AIProcessor.getInstance();
    }
    static getInstance() {
        if (!GuaranteeFlowHandler.instance) {
            GuaranteeFlowHandler.instance = new GuaranteeFlowHandler();
        }
        return GuaranteeFlowHandler.instance;
    }
    async startGuaranteeFlow(ctx) {
        try {
            if (!ctx.user || !ctx.session) {
                await ctx.reply('❌ Error: No se pudo iniciar el flujo de garantía.');
                return;
            }
            ctx.session = this.aiProcessor.updateSessionForGuaranteeFlow(ctx.session);
            const message = `
🔧 <b>Registro de Garantía</b>

Por favor, envía el <b>número de factura</b> para comenzar.

Puedes cancelar en cualquier momento escribiendo <b>/cancel</b>
      `.trim();
            await ctx.replyWithHTML(message);
            logger.user.action(ctx.user.id, 'Flujo de garantía iniciado');
            logger.debug('Sesión actualizada para flujo de garantía:', {
                userId: ctx.user.id,
                sessionState: ctx.session.state,
                flowStep: ctx.session.flow_data?.guarantee_flow?.step
            });
        }
        catch (error) {
            logger.error('Error iniciando flujo de garantía:', error);
            await ctx.reply('❌ Ocurrió un error iniciando el flujo de garantía.');
        }
    }
    async processGuaranteeStep(ctx, messageType) {
        try {
            if (!ctx.user || !ctx.session || !ctx.session.flow_data?.guarantee_flow) {
                return false;
            }
            const flow = ctx.session.flow_data.guarantee_flow;
            const currentStep = flow.step;
            switch (currentStep) {
                case 'waiting_invoice_number':
                    return await this.handleInvoiceNumber(ctx, messageType);
                case 'waiting_invoice_photo':
                    return await this.handleInvoicePhoto(ctx, messageType);
                case 'waiting_product_photo':
                    return await this.handleProductPhoto(ctx, messageType);
                case 'waiting_description':
                    return await this.handleDescription(ctx, messageType);
                default:
                    return false;
            }
        }
        catch (error) {
            logger.error('Error procesando paso de garantía:', error);
            await ctx.reply('❌ Ocurrió un error procesando tu solicitud.');
            return false;
        }
    }
    async handleInvoiceNumber(ctx, messageType) {
        if (messageType !== 'text' || !ctx.message || !('text' in ctx.message)) {
            await ctx.reply('❌ Por favor, envía el **número de factura** como texto.');
            return false;
        }
        const invoiceNumber = ctx.message.text.trim();
        if (invoiceNumber.length < 3) {
            await ctx.reply('❌ El número de factura debe tener al menos 3 caracteres. Intenta de nuevo.');
            return false;
        }
        if (ctx.session?.flow_data?.guarantee_flow) {
            ctx.session.flow_data.guarantee_flow.data.invoice_number = invoiceNumber;
            ctx.session.flow_data.guarantee_flow.step = 'waiting_invoice_photo';
        }
        await ctx.reply(`
✅ Número de factura registrado: ${invoiceNumber}

Ahora envía una foto de la factura para continuar.
    `.trim());
        return true;
    }
    async handleInvoicePhoto(ctx, messageType) {
        if (messageType !== 'photo' || !ctx.message || !('photo' in ctx.message)) {
            await ctx.reply('❌ Por favor, envía una foto de la factura.');
            return false;
        }
        const photo = ctx.message.photo[ctx.message.photo.length - 1];
        if (!photo) {
            await ctx.reply('❌ Error procesando la foto. Intenta de nuevo.');
            return false;
        }
        const fileId = photo.file_id;
        if (ctx.session?.flow_data?.guarantee_flow) {
            ctx.session.flow_data.guarantee_flow.data.invoice_photo_file_id = fileId;
            ctx.session.flow_data.guarantee_flow.step = 'waiting_product_photo';
        }
        await ctx.reply(`
✅ Foto de factura recibida

Ahora envía una foto del producto para continuar.
    `.trim());
        return true;
    }
    async handleProductPhoto(ctx, messageType) {
        if (messageType !== 'photo' || !ctx.message || !('photo' in ctx.message)) {
            await ctx.reply('❌ Por favor, envía una foto del producto.');
            return false;
        }
        const photo = ctx.message.photo[ctx.message.photo.length - 1];
        if (!photo) {
            await ctx.reply('❌ Error procesando la foto. Intenta de nuevo.');
            return false;
        }
        const fileId = photo.file_id;
        if (ctx.session?.flow_data?.guarantee_flow) {
            ctx.session.flow_data.guarantee_flow.data.product_photo_file_id = fileId;
            ctx.session.flow_data.guarantee_flow.step = 'waiting_description';
        }
        await ctx.reply(`
✅ Foto del producto recibida

Finalmente, describe el problema o motivo de la garantía.
    `.trim());
        return true;
    }
    async handleDescription(ctx, messageType) {
        if (messageType !== 'text' || !ctx.message || !('text' in ctx.message)) {
            await ctx.reply('❌ Por favor, envía la descripción del problema como texto.');
            return false;
        }
        const description = ctx.message.text.trim();
        if (description.length < 10) {
            await ctx.reply('❌ La descripción debe tener al menos 10 caracteres. Intenta de nuevo.');
            return false;
        }
        return await this.completeGuaranteeRegistration(ctx, description);
    }
    async completeGuaranteeRegistration(ctx, description) {
        try {
            if (!ctx.user || !ctx.session?.flow_data?.guarantee_flow) {
                return false;
            }
            const flowData = ctx.session.flow_data.guarantee_flow.data;
            if (!flowData.invoice_number || !flowData.invoice_photo_file_id || !flowData.product_photo_file_id) {
                await ctx.reply('❌ Error: Faltan datos del flujo de garantía.');
                return false;
            }
            const result = await guaranteeModel.createGuarantee({
                user_id: ctx.user.id,
                invoice_number: flowData.invoice_number,
                invoice_photo_file_id: flowData.invoice_photo_file_id,
                product_photo_file_id: flowData.product_photo_file_id,
                description: description
            });
            if (!result.success) {
                await ctx.reply('❌ Error registrando la garantía. Intenta de nuevo.');
                return false;
            }
            ctx.session = this.aiProcessor.resetSessionToIdle(ctx.session);
            await ctx.reply(`
✅ Garantía registrada exitosamente

Número de garantía: #${result.data?.id}
Número de factura: ${flowData.invoice_number}
Estado: Pendiente de revisión

Tu solicitud de garantía ha sido registrada y será revisada por nuestro equipo. Te contactaremos pronto.

¿Hay algo más en lo que pueda ayudarte?
      `.trim());
            logger.user.action(ctx.user.id, `Garantía registrada: #${result.data?.id}`);
            return true;
        }
        catch (error) {
            logger.error('Error completando registro de garantía:', error);
            await ctx.reply('❌ Ocurrió un error registrando la garantía.');
            return false;
        }
    }
    async cancelGuaranteeFlow(ctx) {
        try {
            if (!ctx.session) {
                return;
            }
            ctx.session = this.aiProcessor.resetSessionToIdle(ctx.session);
            await ctx.reply(`
❌ Flujo de garantía cancelado

¿En qué más puedo ayudarte?
      `.trim());
            if (ctx.user) {
                logger.user.action(ctx.user.id, 'Flujo de garantía cancelado');
            }
        }
        catch (error) {
            logger.error('Error cancelando flujo de garantía:', error);
        }
    }
    isInGuaranteeFlow(session) {
        const isInFlow = session?.state === 'guarantee_flow' &&
            session?.flow_data?.guarantee_flow?.step !== 'completed';
        logger.debug('Verificando flujo de garantía:', {
            sessionState: session?.state,
            flowStep: session?.flow_data?.guarantee_flow?.step,
            isInFlow
        });
        return isInFlow;
    }
}
//# sourceMappingURL=guarantee-flow.js.map