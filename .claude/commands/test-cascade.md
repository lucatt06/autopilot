---
description: Verificar que una cascada de efectos automáticos funciona correctamente end-to-end
---

# /test-cascade

Probar cascada de: $ARGUMENTS

## Cascadas críticas del sistema

### 1. Creación de Venta
Al crear Sale → 11 efectos en cascada (ver documento 3, sección 4.5):
1. Crear Sale
2. Unit.status → VENDIDA
3. Crear PaymentPlan con cuotas
4. Generar PaymentInstallments
5. Calcular y crear Commission
6. Crear Customer (vinculado a Contact)
7. Marcar Reservation como CONVERTED_TO_SALE (si aplica)
8. Mover Contact a etapa isWon del pipeline
9. ContactEvent: "Venta cerrada"
10. Activar Customer.portalEnabled = true
11. Notificación al admin

### 2. Registro de Pago
Al registrar Payment → efectos:
- Actualizar PaymentPlan.totalPaid
- Actualizar PaymentInstallment.status
- Recalcular status del Payment (paid/partial/overdue)

### 3. Vencimiento de Bloqueo
Job horario:
- Bloqueos con expiresAt pasado → EXPIRED
- Unit.status → DISPONIBLE
- Notificar responsable

### 4. Recordatorios de Cobro
Job diario 8 AM:
- 3 días antes → WhatsApp + Email al cliente
- Día del vencimiento → WhatsApp + Email al cliente
- Día después → status OVERDUE + notificar admin

### 5. Acta de Entrega Completada
Al firmar Acta → efectos:
- Unit.status → ENTREGADA
- Customer.status → DELIVERED
- PDF firmado a ContactDocument
- Notificación al admin

## Pasos para probar

1. **Identificar cascada** en `$ARGUMENTS`
2. **Leer la sección correspondiente** en `@docs/03_Autopilot_Business_Rules.md`
3. **Identificar todos los efectos esperados**
4. **Buscar tests existentes** en `__tests__/` o `tests/`
5. **Si no existen tests, crearlos**:
   - Setup: crear workspace de prueba, contactos, unidades, etc.
   - Action: ejecutar la operación que dispara la cascada
   - Assertions: verificar cada uno de los efectos esperados
   - Cleanup: revertir BD
6. **Ejecutar tests**: `npm test [archivo]`
7. **Reportar resultado**:
   - ✅ Cascada funciona — todos los efectos verificados
   - 🔴 Cascada rota — efectos faltantes [lista]

## Ejemplo

```bash
# Test de cascada de venta
npm test sale.cascade.test.ts
```

```typescript
// sale.cascade.test.ts
describe('Sale Creation Cascade', () => {
  it('triggers all 11 expected effects', async () => {
    // Setup
    const ws = await createTestWorkspace()
    const contact = await createTestContact(ws.id)
    const unit = await createTestUnit(ws.id, { status: 'RESERVADA' })

    // Action
    const sale = await createSale({ ... })

    // Assertions
    expect(sale.status).toBe('ACTIVE')
    expect(await getUnit(unit.id)).toMatchObject({ status: 'VENDIDA' })
    expect(await getPaymentPlan(sale.id)).toBeTruthy()
    expect(await getCommission(sale.id)).toBeTruthy()
    expect(await getCustomer(contact.id)).toMatchObject({ portalEnabled: true })
    // ... resto de assertions
  })
})
```
