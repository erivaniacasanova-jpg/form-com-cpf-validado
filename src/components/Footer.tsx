import React from 'react';

export const Footer: React.FC = () => {
  return (
    <footer className="bg-[#212529] text-gray-400 py-8 mt-12 border-t border-gray-800">
      <div className="container mx-auto px-4">
        <div className="text-center">
          <p className="text-sm">
            2025 © <span className="text-white">Federal Associados (CNPJ 29.383-343-0001/64)</span> - Todos os direitos reservados | 
            <a href="https://federalassociados.com.br/privacy" className="ml-1 hover:text-white transition-colors">Política de Privacidade</a>
          </p>
        </div>
      </div>
    </footer>
  );
};
