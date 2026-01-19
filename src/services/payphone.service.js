const axios = require('axios');
const payphoneConfig = require('../config/payphone');

/**
 * Genera las credenciales para la Cajita de Pagos de Payphone
 * @param {Object} params - Parámetros de la transacción
 * @param {string} params.clientTransactionId - ID único de transacción del comercio
 * @param {number} params.amount - Monto total en centavos
 * @param {number} params.amountWithoutTax - Monto sin impuesto en centavos
 * @param {number} params.amountWithTax - Monto con impuesto (sin el tax) en centavos
 * @param {number} params.tax - Impuesto en centavos
 * @param {string} params.reference - Referencia del pago
 * @param {string} params.email - Email del cliente
 * @param {string} params.phoneNumber - Teléfono del cliente (formato: +593999999999)
 * @param {string} params.documentId - Cédula del cliente
 * @returns {Object} Configuración para la cajita de pagos
 */
function getPaymentConfig({
  clientTransactionId,
  amount,
  amountWithoutTax = 0,
  amountWithTax = 0,
  tax = 0,
  service = 0,
  tip = 0,
  reference,
  email = '',
  phoneNumber = '',
  documentId = '',
  identificationType = 1,
  optionalParameter = ''
}) {
  if (!payphoneConfig.token || !payphoneConfig.storeId) {
    throw new Error('Payphone token y storeId son requeridos en las variables de entorno');
  }

  // Validar que el amount sea la suma correcta
  const calculatedAmount = amountWithoutTax + amountWithTax + tax + service + tip;
  if (calculatedAmount !== amount) {
    console.warn(`El amount (${amount}) no coincide con la suma de componentes (${calculatedAmount})`);
  }

  return {
    token: payphoneConfig.token,
    clientTransactionId,
    amount,
    amountWithoutTax,
    amountWithTax,
    tax,
    service,
    tip,
    currency: "USD",
    storeId: payphoneConfig.storeId,
    reference,
    email,
    phoneNumber,
    documentId,
    identificationType,
    lang: "es",
    defaultMethod: "card",
    timeZone: -5,
    optionalParameter
  };
}

/**
 * Confirma el estado de una transacción con Payphone
 * @param {number} id - ID de la transacción de Payphone
 * @param {string} clientTxId - ID de transacción del cliente
 * @returns {Promise<Object>} Detalles de la transacción
 */
async function confirmTransaction(id, clientTxId) {
  if (!payphoneConfig.token) {
    throw new Error('Payphone token no configurado');
  }

  try {
    const response = await axios.post(
      payphoneConfig.confirmUrl,
      {
        id: parseInt(id),
        clientTxId: clientTxId
      },
      {
        headers: {
          'Authorization': `Bearer ${payphoneConfig.token}`,
          'Content-Type': 'application/json'
        }
      }
    );

    return response.data;
  } catch (error) {
    if (error.response) {
      throw new Error(error.response.data.message || 'Error al confirmar transacción con Payphone');
    }
    throw new Error('Error de conexión con Payphone');
  }
}

/**
 * Valida si una transacción fue aprobada
 * @param {Object} transactionData - Datos de la transacción de Payphone
 * @returns {boolean} true si fue aprobada
 */
function isTransactionApproved(transactionData) {
  return transactionData.statusCode === 3 && transactionData.transactionStatus === 'Approved';
}

/**
 * Valida si una transacción fue cancelada
 * @param {Object} transactionData - Datos de la transacción de Payphone
 * @returns {boolean} true si fue cancelada
 */
function isTransactionCanceled(transactionData) {
  return transactionData.statusCode === 2 && transactionData.transactionStatus === 'Canceled';
}

module.exports = { 
  getPaymentConfig, 
  confirmTransaction,
  isTransactionApproved,
  isTransactionCanceled
};
