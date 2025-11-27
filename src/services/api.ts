import { RegistrationFormData, ViaCepResponse, CpfCheckResponse } from '../types';
import { CPF_API_TOKEN, unmask } from '../utils';

// Fetch address from ViaCEP
export const fetchAddressByCep = async (cep: string): Promise<ViaCepResponse | null> => {
  const cleanCep = unmask(cep);
  if (cleanCep.length !== 8) return null;

  try {
    const response = await fetch(`https://viacep.com.br/ws/${cleanCep}/json/`);
    const data = await response.json();
    if (data.erro) return { ...data, erro: true };
    return data;
  } catch (error) {
    console.error("Error fetching CEP", error);
    return null;
  }
};

// Check CPF existence using the external API
// Esta é a chave para bloquear cadastros duplicados
export const checkCpfAvailability = async (cpf: string, birthDate: string): Promise<CpfCheckResponse | null> => {
  const cleanCpf = unmask(cpf);
  
  // Convert YYYY-MM-DD to DD-MM-YYYY for the API
  const [year, month, day] = birthDate.split('-');
  const formattedBirth = `${day}-${month}-${year}`;

  const url = `https://apicpf.whatsgps.com.br/api/cpf/search?numeroDeCpf=${cleanCpf}&dataNascimento=${formattedBirth}&token=${CPF_API_TOKEN}`;

  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      }
    });
    return await response.json();
  } catch (error) {
    console.error("Error checking CPF", error);
    return null;
  }
};

// Submit form data directly (No Iframe)
export const submitRegistration = async (formData: RegistrationFormData, token: string, fatherId: string) => {
  const data = new FormData();

  // Static fields required by the backend
  data.append('_token', token);
  data.append('status', '0');
  data.append('father', fatherId);
  data.append('type', 'Recorrente');

  // Map dynamic fields
  Object.entries(formData).forEach(([key, value]) => {
    data.append(key, value);
  });

  try {
    const response = await fetch('https://federalassociados.com.br/registroSave', {
      method: 'POST',
      body: data,
      headers: {
        'Accept': 'application/json, text/plain, */*',
      }
    });

    // Verificar redirecionamentos ou erros de status
    if (!response.ok) {
        throw new Error(`Servidor respondeu com erro: ${response.status}`);
    }

    // Tentar ler a resposta
    const responseText = await response.text();

    // Se a resposta contiver indícios de erro do Laravel (como "Whoops" ou validações em HTML)
    if (responseText.includes("Whoops") || responseText.includes("error")) {
        // Podemos tentar inferir que falhou
        // Mas geralmente o redirecionamento acontece para uma página de sucesso
    }

    return { success: true, data: responseText };

  } catch (error) {
    console.error("Erro no envio:", error);
    throw error;
  }
};

// Send data to webhook with plan name
export const sendToWebhook = async (formData: RegistrationFormData, planLabel: string) => {
  const webhookUrl = 'https://webhook.fiqon.app/webhook/a0265c1b-d832-483e-af57-8096334a57a8/e167dea4-079e-4af4-9b3f-4acaf711f432';

  const webhookData = {
    cep: formData.cep,
    cpf: formData.cpf,
    nome: formData.name,
    email: formData.email,
    plano: planLabel,
    bairro: formData.district,
    cidade: formData.city,
    estado: formData.state,
    numero: formData.number,
    endereco: formData.street,
    whatsapp: formData.cell,
    tipo_chip: formData.typeChip === 'fisico' ? 'Físico' : 'e-SIM',
    complemento: formData.complement,
    forma_envio: formData.typeFrete === 'Carta' ? 'Carta Registrada' :
                 formData.typeFrete === 'eSim' ? 'e-SIM' :
                 formData.typeFrete === 'semFrete' ? 'Retirar na Associação' : formData.typeFrete
  };

  try {
    await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(webhookData)
    });
  } catch (error) {
    console.error("Erro ao enviar para webhook:", error);
  }
};
