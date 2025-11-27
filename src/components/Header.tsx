import React from 'react';

export const Header: React.FC = () => {
  return (
    <header className="bg-theme-dark border-b border-gray-700 w-full relative z-50">
      <div className="container mx-auto px-4 py-4">
        <div className="flex flex-col md:flex-row items-center justify-between">
          <div className="mb-4 md:mb-0">
            <a href="https://federalassociados.com.br">
              <img 
                alt="Federal Associados" 
                width="190" 
                src="https://federalassociados.com.br/logos/logoaguiabranca.png" 
                className="h-auto"
              />
            </a>
          </div>
          
          <div className="w-full md:w-auto">
            <nav>
              <ul className="flex flex-wrap justify-center md:justify-end gap-2 md:gap-6 text-gray-300 text-sm font-semibold">
                <li>
                  <a href="https://federalassociados.com.br" className="hover:text-theme-primary transition-colors text-theme-primary">Home</a>
                </li>
                <li className="hidden md:block">
                  <span className="cursor-pointer hover:text-white transition-colors">Institucional <i className="fas fa-chevron-down text-xs ml-1"></i></span>
                </li>
                <li className="hidden md:block">
                  <span className="cursor-pointer hover:text-white transition-colors">Área do Associado <i className="fas fa-chevron-down text-xs ml-1"></i></span>
                </li>
                <li>
                  <a href="https://federalassociados.com.br/contato" className="hover:text-white transition-colors">Contato</a>
                </li>
                <li>
                   <a href="https://federalassociados.com.br/home" className="bg-[#17a2b8] hover:bg-[#138496] text-white px-3 py-2 rounded text-xs font-bold uppercase transition-colors">
                     Escritório Virtual
                   </a>
                </li>
              </ul>
            </nav>
          </div>
        </div>
      </div>
    </header>
  );
};
