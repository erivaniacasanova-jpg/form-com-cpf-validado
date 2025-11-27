import React, { useState } from 'react';
import { RegistrationFormData } from '../types';
import { masks, FATHER_ID, CSRF_TOKEN, PLANS, STATES } from '../utils';
import { fetchAddressByCep, checkCpfAvailability, submitRegistration, sendToWebhook } from '../services/api';
import { SuccessModal } from './SuccessModal';

export const RegistrationForm: React.FC = () => {
  const [formData, setFormData] = useState<RegistrationFormData>({
    cpf: '', birth: '', name: '', email: '', phone: '', cell: '',
    cep: '', district: '', city: '', state: '', street: '', number: '',
    complement: '', typeChip: 'fisico', coupon: '', plan_id: '', typeFrete: ''
  });

  const [status, setStatus] = useState<{
    loading: boolean;
    message: string | null;
    type: 'success' | 'error' | 'warning' | null;
  }>({ loading: false, message: null, type: null });

  const [fieldStatus, setFieldStatus] = useState({
    cpf: 'idle' as 'idle' | 'valid' | 'invalid' | 'exists',
    cep: 'idle' as 'idle' | 'found' | 'not-found'
  });

  const [showSuccessModal, setShowSuccessModal] = useState(false);

  const inputStyle = { backgroundColor: '#ffffff', color: '#333333' };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;

    let formattedValue = value;
    if (masks[name as keyof typeof masks]) {
      formattedValue = masks[name as keyof typeof masks](value);
    }

    setFormData(prev => ({ ...prev, [name]: formattedValue }));

    if (name === 'cpf') setFieldStatus(prev => ({ ...prev, cpf: 'idle' }));
    if (name === 'cep') setFieldStatus(prev => ({ ...prev, cep: 'idle' }));
  };

  const handleChipTypeChange = (type: 'fisico' | 'eSim') => {
    setFormData(prev => ({
      ...prev,
      typeChip: type,
      plan_id: '',
      typeFrete: type === 'eSim' ? 'eSim' : ''
    }));
  };

  const handleCepBlur = async () => {
    if (formData.cep.length < 9) return;

    setStatus({ loading: true, message: 'Buscando CEP...', type: null });
    const address = await fetchAddressByCep(formData.cep);
    setStatus({ loading: false, message: null, type: null });

    if (address && !address.erro) {
      setFieldStatus(prev => ({ ...prev, cep: 'found' }));
      setFormData(prev => ({
        ...prev,
        street: address.logradouro,
        district: address.bairro,
        city: address.localidade,
        state: address.uf,
        complement: address.complemento
      }));
    } else {
      setFieldStatus(prev => ({ ...prev, cep: 'not-found' }));
      setStatus({ loading: false, message: "CEP não encontrado! Verifique o número.", type: 'error' });
    }
  };

  const handleDateBlur = async () => {
    if (formData.cpf.length === 14 && formData.birth) {
      setStatus({ loading: true, message: 'Validando CPF...', type: null });

      try {
        const result = await checkCpfAvailability(formData.cpf, formData.birth);

        if (result && result.data && result.data.id) {
          setFieldStatus(prev => ({ ...prev, cpf: 'exists' }));
          setStatus({
            loading: false,
            message: "CPF já consta na base de dados! Não é possível prosseguir com este cadastro.",
            type: 'error'
          });

          if(result.data.nome_da_pf) {
             setFormData(prev => ({ ...prev, name: result.data.nome_da_pf || '' }));
          }

        } else {
          setFieldStatus(prev => ({ ...prev, cpf: 'valid' }));
          setStatus({ loading: false, message: null, type: null });
        }
      } catch (error) {
        console.error(error);
        setStatus({ loading: false, message: null, type: null });
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (fieldStatus.cpf === 'exists') {
      setStatus({
        loading: false,
        message: "Atenção: Este CPF já possui cadastro. Entre em contato com o suporte.",
        type: 'error'
      });
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    if (formData.typeChip === 'fisico' && !formData.typeFrete) {
      alert("Por favor, escolha uma forma de envio.");
      return;
    }

    if (!formData.plan_id) {
        alert("Por favor, selecione um benefício (Plano).");
        return;
    }

    setStatus({ loading: true, message: 'Enviando dados para a Federal Associados...', type: null });

    try {
      await submitRegistration(formData, CSRF_TOKEN, FATHER_ID);

      setStatus({
        loading: false,
        message: null,
        type: null
      });

      setShowSuccessModal(true);

      const getPlanLabel = () => {
        const allPlans = [...PLANS.VIVO, ...PLANS.TIM, ...PLANS.CLARO];
        const selectedPlan = allPlans.find(plan => plan.id === formData.plan_id);
        return selectedPlan ? selectedPlan.label : formData.plan_id;
      };

      const planLabel = getPlanLabel();
      sendToWebhook(formData, planLabel);

    } catch (error: any) {
      console.error(error);

      if (error?.message === 'CPF já cadastrado') {
        setStatus({
          loading: false,
          message: "CPF já cadastrado. Não é possível realizar o cadastro.",
          type: 'error'
        });
      } else {
        setStatus({
          loading: false,
          message: "Não foi possível completar o cadastro. Verifique sua conexão e tente novamente.",
          type: 'error'
        });
      }

      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  return (
    <>
      <SuccessModal isOpen={showSuccessModal} />
      <div className="max-w-4xl mx-auto space-y-6">
      {status.message && (
        <div className={`p-4 rounded-lg text-white text-center font-bold ${
          status.type === 'error' ? 'bg-red-500' :
          status.type === 'success' ? 'bg-green-500' :
          status.type === 'warning' ? 'bg-yellow-500' : 'bg-blue-500'
        }`}>
          {status.loading && <span className="inline-block loader w-4 h-4 border-white border-t-transparent mr-2 align-middle"></span>}
          {status.message}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">

        <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
          <h3 className="text-lg font-bold text-gray-900 mb-4">Escolha seu Plano</h3>

          <div className="space-y-4">
            <div>
              <label className="block text-gray-700 font-semibold mb-2 text-sm">
                Tipo de Chip
              </label>
              <div className="flex gap-4">
                <label className="flex items-center cursor-pointer">
                  <input
                    type="radio"
                    name="typeChip"
                    value="fisico"
                    checked={formData.typeChip === 'fisico'}
                    onChange={() => handleChipTypeChange('fisico')}
                    className="h-4 w-4 text-theme-primary focus:ring-theme-primary border-gray-300"
                  />
                  <span className="ml-2 text-sm text-gray-700">Físico</span>
                </label>
                <label className="flex items-center cursor-pointer">
                  <input
                    type="radio"
                    name="typeChip"
                    value="eSim"
                    checked={formData.typeChip === 'eSim'}
                    onChange={() => handleChipTypeChange('eSim')}
                    className="h-4 w-4 text-theme-primary focus:ring-theme-primary border-gray-300"
                  />
                  <span className="ml-2 text-sm text-gray-700">e-SIM</span>
                </label>
              </div>
            </div>

            <div>
              <label htmlFor="plan_id" className="block text-gray-700 font-semibold mb-2 text-sm">
                Plano <span className="text-red-500">*</span>
              </label>
              <select
                name="plan_id"
                id="plan_id"
                value={formData.plan_id}
                onChange={handleChange}
                style={inputStyle}
                className="form-control w-full border border-gray-300 rounded-lg px-3 py-2.5 text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-theme-primary"
                required
              >
                <option value="" style={inputStyle}>Selecione um plano</option>
                <optgroup label="VIVO" style={{ ...inputStyle, fontWeight: 'bold', color: '#660099' }}>
                  {PLANS.VIVO.map(plan => (
                    <option key={plan.id} value={plan.id} style={{ ...inputStyle, color: '#000000' }}>{plan.label}</option>
                  ))}
                </optgroup>
                <optgroup label="TIM" style={{ ...inputStyle, fontWeight: 'bold', color: '#0066CC' }}>
                  {PLANS.TIM.map(plan => (
                    <option key={plan.id} value={plan.id} style={{ ...inputStyle, color: '#000000' }}>{plan.label}</option>
                  ))}
                </optgroup>
                <optgroup label="CLARO" style={{ ...inputStyle, fontWeight: 'bold', color: '#FF0000' }}>
                  {PLANS.CLARO.map(plan => (
                    <option key={plan.id} value={plan.id} style={{ ...inputStyle, color: '#000000' }}>{plan.label}</option>
                  ))}
                </optgroup>
              </select>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
          <h3 className="text-lg font-bold text-gray-900 mb-4">Dados Pessoais</h3>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label htmlFor="cpf" className="block text-gray-700 font-semibold mb-1 text-sm">
                CPF <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="cpf"
                id="cpf"
                value={formData.cpf}
                onChange={handleChange}
                style={inputStyle}
                className={`form-control w-full border rounded-lg px-3 py-2.5 text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-theme-primary ${fieldStatus.cpf === 'exists' ? 'border-red-500 bg-red-50 text-red-700' : fieldStatus.cpf === 'valid' ? 'border-green-500 bg-green-50' : 'border-gray-300'}`}
                required
                placeholder="000.000.000-00"
              />
              {fieldStatus.cpf === 'exists' && <small className="text-red-600 font-bold text-xs">CPF JÁ CADASTRADO</small>}
            </div>
            <div>
              <label htmlFor="birth" className="block text-gray-700 font-semibold mb-1 text-sm">
                Data de Nascimento <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                name="birth"
                id="birth"
                value={formData.birth}
                onChange={handleChange}
                onBlur={handleDateBlur}
                style={inputStyle}
                className="form-control w-full border border-gray-300 rounded-lg px-3 py-2.5 text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-theme-primary"
                required
                placeholder="DD/MM/AAAA"
              />
            </div>
            <div>
              <label htmlFor="name" className="block text-gray-700 font-semibold mb-1 text-sm">
                Nome Completo <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="name"
                id="name"
                value={formData.name}
                onChange={handleChange}
                readOnly={fieldStatus.cpf === 'valid' || fieldStatus.cpf === 'exists'}
                style={inputStyle}
                className={`form-control w-full border rounded-lg px-3 py-2.5 text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-theme-primary ${fieldStatus.cpf !== 'idle' ? 'bg-gray-100' : 'border-gray-300'}`}
                required
                placeholder="Seu nome completo"
              />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
          <h3 className="text-lg font-bold text-gray-900 mb-4">Contato</h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="email" className="block text-gray-700 font-semibold mb-1 text-sm">
                Email <span className="text-red-500">*</span>
              </label>
              <input
                type="email"
                name="email"
                id="email"
                value={formData.email}
                onChange={handleChange}
                style={inputStyle}
                className="form-control w-full border border-gray-300 rounded-lg px-3 py-2.5 text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-theme-primary"
                required
                placeholder="seu@email.com"
              />
            </div>
            <div>
              <label htmlFor="cell" className="block text-gray-700 font-semibold mb-1 text-sm">
                WhatsApp <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="cell"
                id="cell"
                value={formData.cell}
                onChange={handleChange}
                style={inputStyle}
                className="form-control w-full border border-gray-300 rounded-lg px-3 py-2.5 text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-theme-primary"
                required
                placeholder="(00) 00000-0000"
              />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
          <h3 className="text-lg font-bold text-gray-900 mb-4">Endereço</h3>

          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label htmlFor="cep" className="block text-gray-700 font-semibold mb-1 text-sm">
                  CEP <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="cep"
                  id="cep"
                  value={formData.cep}
                  onChange={handleChange}
                  onBlur={handleCepBlur}
                  style={inputStyle}
                  className={`form-control w-full border rounded-lg px-3 py-2.5 text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-theme-primary ${fieldStatus.cep === 'found' ? 'border-green-500 bg-green-50' : 'border-gray-300'}`}
                  required
                  placeholder="00000-000"
                />
              </div>
              <div>
                <label htmlFor="district" className="block text-gray-700 font-semibold mb-1 text-sm">
                  Bairro <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="district"
                  id="district"
                  value={formData.district}
                  onChange={handleChange}
                  style={inputStyle}
                  className="form-control w-full border border-gray-300 rounded-lg px-3 py-2.5 text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-theme-primary"
                  required
                  placeholder="Seu bairro"
                />
              </div>
              <div>
                <label htmlFor="city" className="block text-gray-700 font-semibold mb-1 text-sm">
                  Cidade <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="city"
                  id="city"
                  value={formData.city}
                  onChange={handleChange}
                  style={inputStyle}
                  className="form-control w-full border border-gray-300 rounded-lg px-3 py-2.5 text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-theme-primary"
                  required
                  placeholder="Sua cidade"
                />
              </div>
              <div>
                <label htmlFor="state" className="block text-gray-700 font-semibold mb-1 text-sm">
                  Estado <span className="text-red-500">*</span>
                </label>
                <select
                  name="state"
                  id="state"
                  value={formData.state}
                  onChange={handleChange}
                  style={inputStyle}
                  className="form-control w-full border border-gray-300 rounded-lg px-3 py-2.5 text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-theme-primary"
                  required
                >
                  <option value="" style={inputStyle}>Selecione</option>
                  {STATES.map(uf => (
                    <option key={uf} value={uf} style={inputStyle}>{uf}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="md:col-span-3">
                <label htmlFor="street" className="block text-gray-700 font-semibold mb-1 text-sm">
                  Endereço <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="street"
                  id="street"
                  value={formData.street}
                  onChange={handleChange}
                  style={inputStyle}
                  className="form-control w-full border border-gray-300 rounded-lg px-3 py-2.5 text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-theme-primary"
                  required
                  placeholder="Rua, Avenida, etc"
                />
              </div>
              <div>
                <label htmlFor="number" className="block text-gray-700 font-semibold mb-1 text-sm">
                  Número
                </label>
                <input
                  type="text"
                  name="number"
                  id="number"
                  value={formData.number}
                  onChange={handleChange}
                  style={inputStyle}
                  className="form-control w-full border border-gray-300 rounded-lg px-3 py-2.5 text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-theme-primary"
                  placeholder="123"
                />
              </div>
            </div>

            <div>
              <label htmlFor="complement" className="block text-gray-700 font-semibold mb-1 text-sm">
                Complemento
              </label>
              <input
                type="text"
                name="complement"
                id="complement"
                value={formData.complement}
                onChange={handleChange}
                style={inputStyle}
                className="form-control w-full border border-gray-300 rounded-lg px-3 py-2.5 text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-theme-primary"
                placeholder="Apto, Bloco, etc"
              />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
          <h3 className="text-lg font-bold text-gray-900 mb-4">Forma de Envio</h3>
          <div className="space-y-3">
            {formData.typeChip === 'fisico' && (
              <>
                <label className="flex items-start p-4 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50 transition">
                  <input
                    type="radio"
                    name="typeFrete"
                    value="Carta"
                    checked={formData.typeFrete === 'Carta'}
                    onChange={() => setFormData(prev => ({ ...prev, typeFrete: 'Carta' }))}
                    className="h-4 w-4 mt-0.5 text-theme-primary focus:ring-theme-primary border-gray-300"
                  />
                  <div className="ml-3">
                    <div className="text-sm font-semibold text-gray-900">Enviar via Carta Registrada</div>
                    <div className="text-xs text-gray-500 mt-1">Para quem vai receber o chip pelos Correios</div>
                  </div>
                </label>
                <label className="flex items-start p-4 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50 transition">
                  <input
                    type="radio"
                    name="typeFrete"
                    value="semFrete"
                    checked={formData.typeFrete === 'semFrete'}
                    onChange={() => setFormData(prev => ({ ...prev, typeFrete: 'semFrete' }))}
                    className="h-4 w-4 mt-0.5 text-theme-primary focus:ring-theme-primary border-gray-300"
                  />
                  <div className="ml-3">
                    <div className="text-sm font-semibold text-gray-900">Retirar na Associação ou com um Associado</div>
                    <div className="text-xs text-gray-500 mt-1">Se você vai retirar o chip pessoalmente com um representante ou no caso dos planos da Vivo, vai comprar um chip para ativar de forma imediata</div>
                  </div>
                </label>
              </>
            )}

            {formData.typeChip === 'eSim' && (
              <label className="flex items-start p-4 border border-gray-200 rounded-lg bg-blue-50">
                <input
                  type="radio"
                  name="typeFrete"
                  value="eSim"
                  checked={formData.typeFrete === 'eSim'}
                  readOnly
                  className="h-4 w-4 mt-0.5 text-theme-primary focus:ring-theme-primary border-gray-300"
                />
                <div className="ml-3">
                  <div className="text-sm font-semibold text-gray-900">Sem a necessidade de envio (e-SIM)</div>
                </div>
              </label>
            )}
          </div>
        </div>

        <div className="bg-gray-50 rounded-lg p-4 text-xs text-gray-600 text-center border border-gray-200">
          Ao clicar em salvar, você será redirecionado para realizar o pagamento da sua taxa associativa, sendo ela o valor proporcional ao plano que você escolheu.
        </div>

        <div className="flex items-center justify-end gap-3 pt-2">
          <a
            href="https://federalassociados.com.br"
            className="btn bg-gray-500 hover:bg-gray-600 text-white font-semibold py-2.5 px-6 rounded-lg transition-colors text-sm"
          >
            Voltar
          </a>
          <button
            type="submit"
            disabled={status.loading || fieldStatus.cpf === 'exists'}
            className={`btn bg-green-600 hover:bg-green-700 text-white font-semibold py-2.5 px-8 rounded-lg transition-colors text-sm flex items-center ${(status.loading || fieldStatus.cpf === 'exists') ? 'opacity-60 cursor-not-allowed' : ''}`}
          >
            Salvar
          </button>
        </div>

      </form>
    </div>
    </>
  );
};
