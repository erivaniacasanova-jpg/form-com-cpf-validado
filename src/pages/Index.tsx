import React from 'react';
import { Footer } from '@/components/Footer';
import { RegistrationForm } from '@/components/RegistrationForm';

const Index = () => {
  return (
    <div className="flex flex-col min-h-screen bg-white">
      <main className="flex-grow relative bg-gray-50">
        <div className="container mx-auto px-3 sm:px-4 py-6 sm:py-12">
          <div className="text-center mb-6 sm:mb-8">
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 mb-3 sm:mb-4">
              Seja bem-vindo ao Registro de Associados
            </h1>
            <p className="text-base sm:text-lg text-gray-700 font-semibold mb-1">
              Patrocinador: Francisco Eliedisom Dos Santos
            </p>
            <p className="text-sm sm:text-base text-gray-600">
              Realize seu cadastro sem consulta ao SPC/SERASA e sem fidelidade.
            </p>
          </div>

          <RegistrationForm />
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Index;
