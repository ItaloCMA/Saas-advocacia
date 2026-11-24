// Formata número no padrão CNJ: 0000000-00.0000.0.00.0000
export const formatCNJ = (value) => {
  if (!value) return '';
  const digits = value.replace(/\D/g, '').slice(0, 20);
  let res = digits;
  if (digits.length > 7) res = `${digits.slice(0, 7)}-${digits.slice(7)}`;
  if (digits.length > 9) res = `${res.slice(0, 10)}.${digits.slice(9)}`;
  if (digits.length > 13) res = `${res.slice(0, 15)}.${digits.slice(13)}`;
  if (digits.length > 14) res = `${res.slice(0, 17)}.${digits.slice(14)}`;
  if (digits.length > 16) res = `${res.slice(0, 20)}.${digits.slice(16)}`;
  return res;
};

// Valida se um número CNJ possui exatamente 20 dígitos numéricos
export const isValidCNJ = (value) => {
  if (!value) return false;
  const digits = value.replace(/\D/g, '');
  return digits.length === 20;
};

// Formata CPF (11 dígitos) ou CNPJ (14 dígitos)
export const formatDocument = (value) => {
  if (!value) return '';
  const digits = value.replace(/\D/g, '').slice(0, 14);
  if (digits.length <= 11) {
    return digits
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d{1,2})$/, '$1-$2');
  }
  return digits
    .replace(/^(\d{2})(\d)/, '$1.$2')
    .replace(/^(\d{2})\.(\d{3})(\d)/, '$1.$2.$3')
    .replace(/\.(\d{3})(\d)/, '.$1/$2')
    .replace(/(\d{4})(\d)/, '$1-$2');
};

// Valida dígitos verificadores de CPF
export const isValidCPF = (cpf) => {
  const d = (cpf || '').replace(/\D/g, '');
  if (d.length !== 11 || /^(\d)\1{10}$/.test(d)) return false;
  for (const t of [9, 10]) {
    let sum = 0;
    for (let i = 0; i < t; i++) sum += Number(d[i]) * (t + 1 - i);
    if (((sum * 10) % 11) % 10 !== Number(d[t])) return false;
  }
  return true;
};

// Valida dígitos verificadores de CNPJ
export const isValidCNPJ = (cnpj) => {
  const d = (cnpj || '').replace(/\D/g, '');
  if (d.length !== 14 || /^(\d)\1{13}$/.test(d)) return false;
  const calc = (base) => {
    const weights =
      base.length === 12
        ? [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]
        : [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
    let sum = 0;
    for (let i = 0; i < weights.length; i++) sum += Number(base[i]) * weights[i];
    const rem = sum % 11;
    return rem < 2 ? 0 : 11 - rem;
  };
  return calc(d.slice(0, 12)) === Number(d[12]) && calc(d.slice(0, 13)) === Number(d[13]);
};

// Valida CPF ou CNPJ (vazio é aceito por ser opcional; preenchido exige 11 ou 14 dígitos válidos)
export const isValidDocument = (doc) => {
  const d = (doc || '').replace(/\D/g, '');
  if (!d) return true;
  if (d.length === 11) return isValidCPF(d);
  if (d.length === 14) return isValidCNPJ(d);
  return false;
};

// Formata Telefone / WhatsApp com DDD
export const formatPhone = (value) => {
  if (!value) return '';
  const digits = value.replace(/\D/g, '').slice(0, 11);
  if (digits.length <= 10) {
    return digits.replace(/(\d{2})(\d{4})(\d{0,4})/, '($1) $2-$3').replace(/-$/, '');
  }
  return digits.replace(/(\d{2})(\d{5})(\d{0,4})/, '($1) $2-$3').replace(/-$/, '');
};

// Gera link direto para conversa no WhatsApp
export const getWhatsAppLink = (phone, clientName) => {
  const clean = (phone || '').replace(/\D/g, '');
  if (!clean) return null;
  const fullNumber = clean.length <= 11 ? `55${clean}` : clean;
  const msg = encodeURIComponent(`Olá ${clientName || ''}, tudo bem? Entro em contato pelo escritório de advocacia.`);
  return `https://wa.me/${fullNumber}?text=${msg}`;
};

// Extrai iniciais para avatar SaaS
export const getInitials = (name = '') => {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return 'LF';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
};

// Cópia segura para área de transferência (funciona tanto em HTTPS quanto em HTTP local)
export const safeCopyToClipboard = async (text) => {
  if (!text) return false;
  try {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch (e) {
    // Fallback abaixo
  }
  try {
    const textArea = document.createElement('textarea');
    textArea.value = text;
    textArea.style.position = 'fixed';
    textArea.style.left = '-999999px';
    textArea.style.top = '-999999px';
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    const successful = document.execCommand('copy');
    document.body.removeChild(textArea);
    return successful;
  } catch (err) {
    console.warn('Falha no fallback de cópia:', err);
    return false;
  }
};
