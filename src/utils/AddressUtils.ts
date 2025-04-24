
/**
 * Formats a Brazilian CEP (postal code) to the standard format (00000-000)
 * @param cep The CEP to format
 * @returns The formatted CEP
 */
export const formatCEP = (cep: string): string => {
  // Remove non-digits
  const digitsOnly = cep.replace(/\D/g, '');
  
  // Format as 00000-000
  if (digitsOnly.length <= 5) {
    return digitsOnly;
  }
  return `${digitsOnly.slice(0, 5)}-${digitsOnly.slice(5, 8)}`;
};

/**
 * Formats a CPF (000.000.000-00) or CNPJ (00.000.000/0000-00)
 * @param document The document number to format
 * @param type The document type (cpf or cnpj)
 * @returns The formatted document
 */
export const formatDocument = (document: string, type: 'cpf' | 'cnpj'): string => {
  // Remove non-digits
  const digitsOnly = document.replace(/\D/g, '');
  
  if (type === 'cpf') {
    // Format as 000.000.000-00
    if (digitsOnly.length <= 3) return digitsOnly;
    if (digitsOnly.length <= 6) return `${digitsOnly.slice(0, 3)}.${digitsOnly.slice(3)}`;
    if (digitsOnly.length <= 9) return `${digitsOnly.slice(0, 3)}.${digitsOnly.slice(3, 6)}.${digitsOnly.slice(6)}`;
    return `${digitsOnly.slice(0, 3)}.${digitsOnly.slice(3, 6)}.${digitsOnly.slice(6, 9)}-${digitsOnly.slice(9, 11)}`;
  } else {
    // Format as 00.000.000/0000-00
    if (digitsOnly.length <= 2) return digitsOnly;
    if (digitsOnly.length <= 5) return `${digitsOnly.slice(0, 2)}.${digitsOnly.slice(2)}`;
    if (digitsOnly.length <= 8) return `${digitsOnly.slice(0, 2)}.${digitsOnly.slice(2, 5)}.${digitsOnly.slice(5)}`;
    if (digitsOnly.length <= 12) return `${digitsOnly.slice(0, 2)}.${digitsOnly.slice(2, 5)}.${digitsOnly.slice(5, 8)}/${digitsOnly.slice(8)}`;
    return `${digitsOnly.slice(0, 2)}.${digitsOnly.slice(2, 5)}.${digitsOnly.slice(5, 8)}/${digitsOnly.slice(8, 12)}-${digitsOnly.slice(12, 14)}`;
  }
};

/**
 * Formats a phone number to the standard Brazilian format
 * @param phone The phone number to format
 * @returns The formatted phone number
 */
export const formatPhone = (phone: string): string => {
  // Remove non-digits
  const digitsOnly = phone.replace(/\D/g, '');
  
  if (digitsOnly.length <= 2) return digitsOnly;
  if (digitsOnly.length <= 7) return `(${digitsOnly.slice(0, 2)}) ${digitsOnly.slice(2)}`;
  if (digitsOnly.length <= 11) return `(${digitsOnly.slice(0, 2)}) ${digitsOnly.slice(2, 7)}-${digitsOnly.slice(7)}`;
  return `(${digitsOnly.slice(0, 2)}) ${digitsOnly.slice(2, 7)}-${digitsOnly.slice(7, 11)}`;
};
