#!/usr/bin/env node

/**
 * Seeder de Horarios de Atención
 * 
 * Este script popula la base de datos con los horarios de atención de Tecno Express
 */

import { connectDatabase } from '../connection.js'
import { scheduleModel } from '../models.js'
import { logger } from '../../utils/logger.js'

// Datos de horarios de atención
const schedulesData = [
  // Lunes a Viernes
  { day_of_week: 1, open_time: '08:00', close_time: '18:00', is_active: true }, // Lunes
  { day_of_week: 2, open_time: '08:00', close_time: '18:00', is_active: true }, // Martes
  { day_of_week: 3, open_time: '08:00', close_time: '18:00', is_active: true }, // Miércoles
  { day_of_week: 4, open_time: '08:00', close_time: '18:00', is_active: true }, // Jueves
  { day_of_week: 5, open_time: '08:00', close_time: '18:00', is_active: true }, // Viernes
  
  // Sábado (horario reducido)
  { day_of_week: 6, open_time: '09:00', close_time: '15:00', is_active: true }, // Sábado
  
  // Domingo (cerrado)
  { day_of_week: 0, open_time: '00:00', close_time: '00:00', is_active: false } // Domingo
]

async function seedSchedules(): Promise<void> {
  try {
    // Conectar a la base de datos primero
    await connectDatabase()
    console.log('🌱 Iniciando seeder de horarios...')

    // Verificar si ya existen horarios
    const existingSchedules = await scheduleModel.getAllSchedules()
    
    if (existingSchedules.success && existingSchedules.data && existingSchedules.data.length > 0) {
      const forceFlag = process.argv.includes('--force')
      
      if (!forceFlag) {
        console.log('⚠️  Ya existen horarios en la base de datos')
        console.log('💡 Usa --force para sobrescribir los horarios existentes')
        console.log('   Ejemplo: npm run seed:schedules:force')
        return
      }
      
      console.log('🔄 Modo force activado, sobrescribiendo horarios...')
    }

    // Crear horarios
    let createdCount = 0
    let errorCount = 0

    for (const schedule of schedulesData) {
      try {
        const result = await scheduleModel.createSchedule(schedule)
        
        if (result.success) {
          createdCount++
          console.log(`✅ Horario creado: ${getDayName(schedule.day_of_week)} ${schedule.open_time}-${schedule.close_time}`)
        } else {
          errorCount++
          console.log(`❌ Error creando horario: ${result.error}`)
        }
      } catch (error) {
        errorCount++
        console.log(`❌ Error inesperado creando horario:`, error)
      }
    }

    // Resumen
    console.log('📊 Resumen del seeder de horarios:')
    console.log(`   ✅ Horarios creados: ${createdCount}`)
    console.log(`   ❌ Errores: ${errorCount}`)
    console.log(`   📅 Total de días: ${schedulesData.length}`)

    if (createdCount > 0) {
      console.log('🎉 Seeder de horarios completado exitosamente')
    } else {
      console.log('⚠️  No se crearon horarios nuevos')
    }

  } catch (error) {
    console.log('💥 Error fatal en seeder de horarios:', error)
    process.exit(1)
  }
}

function getDayName(dayOfWeek: number): string {
  const dayNames = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado']
  return dayNames[dayOfWeek] || 'Día desconocido'
}

// Ejecutar seeder
seedSchedules()
  .then(() => {
    console.log('✅ Seeder de horarios finalizado')
    process.exit(0)
  })
  .catch((error) => {
    console.log('💥 Error ejecutando seeder de horarios:', error)
    process.exit(1)
  })

export { seedSchedules }
