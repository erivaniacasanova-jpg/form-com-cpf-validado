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

// Check CPF existence validating against Federal Associados database
export const checkCpfAvailability = async (cpf: string, birthDate: string): Promise<CpfCheckResponse | null> => {
  const cleanCpf = unmask(cpf);

  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

  try {
    const response = await fetch(
      `${supabaseUrl}/functions/v1/validate-cpf-federal`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${anonKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          cpf: cleanCpf,
          birthDate: birthDate
        })
      }
    );

    const data = await response.json();

    return {
      data: {
        id: data.registered ? 1 : null,
        numero_de_cpf: cleanCpf
      },
      available: data.available
    } as CpfCheckResponse;
  } catch (error) {
    console.error("Error checking CPF", error);
    return null;
  }
};

// Submit form data using iframe method
export const submitRegistration = async (formData: RegistrationFormData, token: string, fatherId: string): Promise<{ success: boolean }> => {
  return new Promise((resolve, reject) => {
    try {
      // Criar iframe invisível
      const iframe = document.createElement('iframe');
      iframe.name = 'federal_form_target';
      iframe.style.display = 'none';
      document.body.appendChild(iframe);

      // Criar formulário oculto
      const form = document.createElement('form');
      form.method = 'POST';
      form.action = 'https://federalassociados.com.br/registroSave';
      form.target = 'federal_form_target';
      form.style.display = 'none';

      // Remover máscaras dos campos
      const cleanCPF = unmask(formData.cpf);
      const cleanCell = unmask(formData.cell);
      const cleanCEP = unmask(formData.cep);

      // Adicionar todos os campos como inputs hidden
      const fields = {
        _token: token,
        status: '0',
        father: fatherId,
        type: 'Recorrente',
        cpf: cleanCPF,
        birth: formData.birth,
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        cell: cleanCell,
        cep: cleanCEP,
        district: formData.district,
        city: formData.city,
        state: formData.state,
        street: formData.street,
        number: formData.number,
        complement: formData.complement,
        typeChip: formData.typeChip,
        coupon: formData.coupon,
        plan_id: formData.plan_id,
        typeFrete: formData.typeFrete
      };

      // Criar inputs hidden
      Object.entries(fields).forEach(([key, value]) => {
        const input = document.createElement('input');
        input.type = 'hidden';
        input.name = key;
        input.value = value;
        form.appendChild(input);
      });

      document.body.appendChild(form);

      // Monitorar o carregamento do iframe
      iframe.onload = () => {
        try {
          // Tentar acessar o conteúdo do iframe para detectar erros
          const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document;

          if (iframeDoc) {
            const errorAlert = iframeDoc.querySelector('.alert-danger');
            const errorSpan = iframeDoc.querySelector('.text-danger');

            if ((errorAlert && errorAlert.textContent?.includes('cpf já está sendo utilizado')) ||
                (errorSpan && errorSpan.textContent?.includes('cpf já está sendo utilizado'))) {
              // CPF duplicado detectado
              if (document.body.contains(form)) {
                document.body.removeChild(form);
              }
              if (document.body.contains(iframe)) {
                document.body.removeChild(iframe);
              }
              reject(new Error('CPF já cadastrado'));
              return;
            }
          }
        } catch (error) {
          // Erro de CORS - não conseguimos ler o iframe, mas vamos prosseguir
          console.log('Não foi possível verificar resposta do iframe (CORS)');
        }

        // Aguardar 3 segundos antes de considerar sucesso
        setTimeout(() => {
          // Remover form e iframe do DOM
          if (document.body.contains(form)) {
            document.body.removeChild(form);
          }
          if (document.body.contains(iframe)) {
            document.body.removeChild(iframe);
          }

          resolve({ success: true });
        }, 3000);
      };

      // Tratar erro de carregamento do iframe
      iframe.onerror = () => {
        if (document.body.contains(form)) {
          document.body.removeChild(form);
        }
        if (document.body.contains(iframe)) {
          document.body.removeChild(iframe);
        }
        reject(new Error('Erro ao enviar formulário'));
      };

      // Enviar formulário
      form.submit();

    } catch (error) {
      console.error('Erro ao processar cadastro:', error);
      reject(error);
    }
  });
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
