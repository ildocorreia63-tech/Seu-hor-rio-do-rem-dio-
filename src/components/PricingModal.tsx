import React, { useState } from 'react';
import { PlanConfig, User } from '../types';
import { PLANS } from '../../server/stripe';
import { X, Check, Sparkles, Crown, Zap, ShieldCheck, ArrowRight, CreditCard } from 'lucide-react';
import confetti from 'canvas-confetti';

interface PricingModalProps {
  user: User | null;
  onClose: () => void;
  onCheckoutStripe: (planId: string) => Promise<void>;
  onActivatePlan: (planId: string) => Promise<void>;
}

export const PricingModal: React.FC<PricingModalProps> = ({
  user,
  onClose,
  onCheckoutStripe,
  onActivatePlan,
}) => {
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null);

  const handleSubscribe = async (planId: string, simulated: boolean = false) => {
    try {
      setLoadingPlan(planId);
      if (simulated) {
        await onActivatePlan(planId);
        try {
          confetti({
            particleCount: 100,
            spread: 70,
            origin: { y: 0.6 }
          });
        } catch {}
        onClose();
      } else {
        await onCheckoutStripe(planId);
      }
    } catch (err: any) {
      alert(err.message || 'Erro ao processar plano');
    } finally {
      setLoadingPlan(null);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="w-full max-w-2xl bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden my-auto animate-in fade-in zoom-in-95 duration-200 text-slate-900 dark:text-white">
        
        {/* Header */}
        <div className="px-6 py-5 bg-gradient-to-r from-teal-800 via-teal-900 to-slate-900 text-white flex items-center justify-between relative overflow-hidden">
          <div className="relative z-10">
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-teal-500/20 text-teal-300 text-xs font-bold uppercase tracking-wider mb-1">
              <Sparkles className="w-3.5 h-3.5" /> Planos & Assinaturas
            </span>
            <h2 className="text-xl sm:text-2xl font-black">
              Evolua o Cuidado com a sua Saúde
            </h2>
            <p className="text-xs text-teal-200/80 mt-0.5">
              Escolha o plano ideal para você e sua família. Cancele quando quiser.
            </p>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-white/10 transition text-teal-200 hover:text-white relative z-10"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Plans Container */}
        <div className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
          
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
            {PLANS.map((plan) => {
              const isCurrent = user?.plan === plan.id;
              const isPro = plan.id === 'pro_monthly' || plan.id === 'pro_yearly';
              const isFamily = plan.id === 'family';

              return (
                <div
                  key={plan.id}
                  className={`rounded-2xl p-4 border flex flex-col justify-between relative transition ${
                    isFamily
                      ? 'border-amber-500 bg-amber-50/20 dark:bg-amber-950/10 shadow-md ring-1 ring-amber-500'
                      : isPro
                      ? 'border-teal-500 bg-teal-50/30 dark:bg-teal-950/20 shadow-md ring-1 ring-teal-500'
                      : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900'
                  }`}
                >
                  {plan.badge && (
                    <span className={`absolute -top-2.5 left-1/2 -translate-x-1/2 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider shadow-sm ${
                      isFamily
                        ? 'bg-amber-500 text-slate-950'
                        : 'bg-teal-600 text-white'
                    }`}>
                      {plan.badge}
                    </span>
                  )}

                  <div>
                    <h3 className="font-extrabold text-base text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                      {isFamily ? <Crown className="w-4 h-4 text-amber-500" /> : <Sparkles className="w-4 h-4 text-teal-600" />}
                      {plan.name}
                    </h3>

                    <div className="my-2.5">
                      <span className="text-2xl font-black text-slate-900 dark:text-white">
                        {plan.priceFormatted}
                      </span>
                      {plan.interval !== 'grátis' && (
                        <span className="text-xs text-slate-500 dark:text-slate-400 font-semibold ml-1">
                          /{plan.interval}
                        </span>
                      )}
                    </div>

                    <ul className="space-y-1.5 my-3 text-[11px] text-slate-600 dark:text-slate-300">
                      {plan.features.map((feat, idx) => (
                        <li key={idx} className="flex items-start gap-1.5 leading-tight">
                          <Check className="w-3.5 h-3.5 text-teal-600 shrink-0 mt-0.5 stroke-[3]" />
                          <span>{feat}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="space-y-1.5 pt-3 border-t border-slate-100 dark:border-slate-800">
                    {isCurrent ? (
                      <div className="w-full py-2 bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 rounded-xl text-center text-xs font-bold">
                        ✓ Plano Atual
                      </div>
                    ) : plan.id === 'free' ? (
                      <button
                        disabled
                        className="w-full py-2 bg-slate-100 dark:bg-slate-800 text-slate-400 rounded-xl text-xs font-bold"
                      >
                        Básico
                      </button>
                    ) : (
                      <>
                        <button
                          onClick={() => handleSubscribe(plan.id, false)}
                          disabled={loadingPlan === plan.id}
                          className={`w-full py-2.5 rounded-xl font-black text-xs shadow-md transition active:scale-95 flex items-center justify-center gap-1.5 ${
                            isFamily
                              ? 'bg-amber-500 hover:bg-amber-600 text-slate-950 shadow-amber-500/20'
                              : 'bg-teal-600 hover:bg-teal-700 text-white shadow-teal-600/20'
                          }`}
                        >
                          <CreditCard className="w-3.5 h-3.5" />
                          <span>{loadingPlan === plan.id ? 'Processando...' : 'Testar 7 Dias Grátis'}</span>
                        </button>

                        <button
                          onClick={() => handleSubscribe(plan.id, true)}
                          className="w-full py-1.5 text-[11px] font-bold text-teal-700 dark:text-teal-400 hover:underline flex items-center justify-center gap-1"
                          title="Ativação instantânea para testes no ambiente de demonstração"
                        >
                          <Zap className="w-3 h-3 text-amber-500" />
                          <span>Testar Agora Sem Cartão</span>
                        </button>
                      </>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Guarantee and security note */}
          <div className="bg-slate-50 dark:bg-slate-800/50 rounded-2xl p-3.5 border border-slate-200 dark:border-slate-800 flex items-center gap-3 text-xs text-slate-600 dark:text-slate-300">
            <ShieldCheck className="w-5 h-5 text-teal-600 shrink-0" />
            <div>
              <strong>Pagamentos Seguros com Criptografia de Ponta a Ponta via Stripe.</strong>
              <p className="text-[11px] text-slate-400">
                Seus dados de cartão nunca passam por servidores não autorizados. Garantia de reembolso em até 7 dias.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
