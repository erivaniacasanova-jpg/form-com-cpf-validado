import React from 'react';

interface SuccessModalProps {
  isOpen: boolean;
}

export const SuccessModal: React.FC<SuccessModalProps> = ({ isOpen }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
      <div className="bg-white rounded-2xl shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 sm:p-8">
          <div className="text-center mb-6">
            <div className="text-4xl mb-3">🎉</div>
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
              Parabéns! Seu cadastro foi realizado com sucesso.
            </h2>
          </div>

          <div className="space-y-4 text-gray-700 text-sm sm:text-base mb-6">
            <p>
              Para darmos continuidade com a ativação do seu plano, é necessário realizar o pagamento da sua taxa associativa, no valor proporcional ao plano escolhido por você.
            </p>

            <p>
              Essa taxa é solicitada antes da ativação, pois ela confirma oficialmente a sua entrada na Federal Associados.
            </p>

            <p className="font-semibold">
              O valor é usado para cobrir os custos administrativos e operacionais, como:
            </p>

            <ul className="list-disc list-inside space-y-1 ml-2">
              <li>Geração do número.</li>
              <li>Configuração da linha.</li>
              <li>Liberação do seu escritório virtual.</li>
              <li>E acesso a todos os benefícios exclusivos da empresa, como o Clube de Descontos, Cinema Grátis, Programa PBI, entre outros.</li>
            </ul>

            <p>
              O pagamento da taxa é o primeiro passo para liberar o seu benefício de internet móvel e garantir sua ativação com total segurança.
            </p>

            <p>
              Logo após efetuar o pagamento, você receberá um e-mail para fazer a biometria digital.
            </p>

            <p className="font-semibold">
              Após isso já partimos para ativação do seu plano.
            </p>

            <p className="text-center font-semibold text-gray-900 mt-6">
              Clique no botão abaixo para continuar:
            </p>
          </div>

          <a
            href="https://federalassociados.com.br/boletos"
            className="block w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 px-6 rounded-xl text-center transition-colors text-lg"
          >
            Realizar Adesão
          </a>
        </div>
      </div>
    </div>
  );
};
