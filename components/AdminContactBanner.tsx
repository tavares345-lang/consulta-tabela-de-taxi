import React, { useState } from 'react';
import { Phone, MessageCircle, Copy, Check, Headphones, ShieldAlert, Sparkles } from 'lucide-react';

export const ADMIN_PHONE_DISPLAY = '(31) 99869-9742';
export const ADMIN_PHONE_RAW = '5531998699742';
export const ADMIN_PHONE_TEL = '+5531998699742';

export const getWhatsAppLink = (message?: string) => {
  const defaultMsg = 'Olá! Gostaria de solicitar uma alteração, inclusão de destino ou suporte no aplicativo Tabela Táxi.';
  const encoded = encodeURIComponent(message || defaultMsg);
  return `https://wa.me/${ADMIN_PHONE_RAW}?text=${encoded}`;
};

interface AdminContactBannerProps {
  variant?: 'card' | 'compact' | 'bar';
}

export const AdminContactBanner: React.FC<AdminContactBannerProps> = ({ variant = 'card' }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText('31 99869-9742');
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (variant === 'compact') {
    return (
      <a
        href={getWhatsAppLink()}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-2 bg-emerald-500 hover:bg-emerald-600 active:scale-95 text-white px-3.5 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all shadow-sm group"
        title="Falar com o Administrador via WhatsApp"
      >
        <MessageCircle className="w-4 h-4 group-hover:rotate-12 transition-transform" />
        <span className="hidden sm:inline">Suporte Admin:</span>
        <span className="font-extrabold">{ADMIN_PHONE_DISPLAY}</span>
      </a>
    );
  }

  if (variant === 'bar') {
    return (
      <div className="bg-amber-400/90 text-gray-950 px-4 py-2.5 shadow-sm border-b border-amber-300">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2 text-xs font-bold">
          <div className="flex items-center gap-2 text-center sm:text-left">
            <Headphones className="w-4 h-4 text-gray-900 shrink-0" />
            <span>
              <strong>Suporte & Alterações com o Administrador:</strong> Para inclusão de destinos, alterações ou dúvidas.
            </span>
          </div>
          <div className="flex items-center gap-2">
            <a
              href={`tel:${ADMIN_PHONE_TEL}`}
              className="flex items-center gap-1 bg-white/90 hover:bg-white text-gray-900 px-3 py-1 rounded-lg text-xs font-black uppercase tracking-tight shadow-sm transition-all"
            >
              <Phone className="w-3.5 h-3.5 text-amber-600" />
              <span>{ADMIN_PHONE_DISPLAY}</span>
            </a>
            <a
              href={getWhatsAppLink()}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-1 rounded-lg text-xs font-black uppercase tracking-tight shadow-sm transition-all"
            >
              <MessageCircle className="w-3.5 h-3.5" />
              <span>WhatsApp</span>
            </a>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-br from-amber-500 via-amber-400 to-yellow-400 rounded-3xl p-6 sm:p-8 text-gray-950 shadow-xl border border-amber-300 relative overflow-hidden my-6">
      {/* Background visual detail */}
      <div className="absolute right-0 bottom-0 translate-x-8 translate-y-8 opacity-10 pointer-events-none">
        <Headphones className="w-64 h-64 text-gray-900" />
      </div>

      <div className="relative z-10 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
        <div className="max-w-2xl">
          <div className="inline-flex items-center gap-2 bg-gray-950/10 backdrop-blur-sm px-3.5 py-1.5 rounded-full text-[11px] font-black uppercase tracking-widest text-gray-900 mb-3 border border-gray-950/10">
            <Sparkles className="w-3.5 h-3.5 text-gray-900" />
            <span>Central de Suporte & Solicitações</span>
          </div>
          
          <h3 className="text-2xl sm:text-3xl font-black uppercase tracking-tight text-gray-950 mb-2">
            Contato com o Administrador
          </h3>
          
          <p className="text-sm sm:text-base font-semibold text-gray-900/90 leading-relaxed">
            Precisa <strong>solicitar alteração de valores</strong>, <strong>inclusão de novos destinos / cidades</strong> ou <strong>suporte técnico</strong> no aplicativo? Entre em contato diretamente pelo telefone abaixo:
          </p>
        </div>

        <div className="w-full lg:w-auto flex flex-col sm:flex-row items-stretch sm:items-center gap-3 shrink-0">
          <div className="bg-white/95 backdrop-blur-md px-5 py-3.5 rounded-2xl border border-white/60 shadow-lg flex items-center justify-between sm:justify-start gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center text-amber-700">
                <Phone className="w-5 h-5" />
              </div>
              <div>
                <span className="block text-[9px] font-black uppercase tracking-wider text-gray-400">Telefone / WhatsApp</span>
                <span className="text-lg sm:text-xl font-black text-gray-950 tracking-tight">{ADMIN_PHONE_DISPLAY}</span>
              </div>
            </div>

            <button
              onClick={handleCopy}
              className="p-2.5 rounded-xl hover:bg-gray-100 text-gray-500 hover:text-gray-900 transition-all border border-gray-100 active:scale-95"
              title="Copiar número"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
            </button>
          </div>

          <div className="flex items-center gap-2">
            <a
              href={getWhatsAppLink()}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 sm:flex-none flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-black text-xs uppercase tracking-wider px-5 py-4 rounded-2xl shadow-lg shadow-emerald-900/20 transition-all"
            >
              <MessageCircle className="w-4 h-4" />
              <span>Chamar no WhatsApp</span>
            </a>

            <a
              href={`tel:${ADMIN_PHONE_TEL}`}
              className="flex items-center justify-center p-4 bg-gray-950 hover:bg-gray-900 active:scale-95 text-white rounded-2xl shadow-lg transition-all"
              title="Ligar agora"
            >
              <Phone className="w-4 h-4" />
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};
