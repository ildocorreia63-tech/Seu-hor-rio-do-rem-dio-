import Stripe from 'stripe';
import { PlanConfig, User } from '../src/types';

export const PLANS: PlanConfig[] = [
  {
    id: 'free',
    name: 'Plano Gratuito',
    priceFormatted: 'R$ 0',
    interval: 'grátis',
    priceInCents: 0,
    features: [
      'Até 2 medicamentos cadastrados',
      '1 perfil de usuário',
      'Alarme sonoro em tela cheia',
      'Controle básico de horários',
      'Armazenamento local'
    ],
    maxMeds: 2,
    maxMembers: 1,
  },
  {
    id: 'pro_monthly',
    name: 'Pro Mensal',
    priceFormatted: 'R$ 19,90',
    interval: 'mês',
    priceInCents: 1990,
    badge: 'Mais Popular',
    features: [
      'Medicamentos ilimitados',
      'Até 3 membros da família',
      'Fotos de remédios e receitas médicas',
      'Controle e alertas de estoque baixo',
      'Histórico completo e taxas de adesão',
      'Sincronização em nuvem e backup',
      'IA assistente para ler receitas e bulas'
    ],
    maxMeds: 999,
    maxMembers: 3,
  },
  {
    id: 'pro_yearly',
    name: 'Pro Anual (2 meses grátis)',
    priceFormatted: 'R$ 189,90',
    interval: 'ano',
    priceInCents: 18990,
    badge: 'Economize 20%',
    features: [
      'Tudo do Pro Mensal',
      'Economia equivalente a 2 meses grátis',
      'Exportação de relatórios em PDF para médicos',
      'Notificações push em tempo real',
      'Suporte VIP prioritário via WhatsApp'
    ],
    maxMeds: 999,
    maxMembers: 3,
  },
  {
    id: 'family',
    name: 'Plano Família VIP',
    priceFormatted: 'R$ 34,90',
    interval: 'mês',
    priceInCents: 3490,
    badge: 'Família Completa',
    features: [
      'Até 10 membros e dependentes (filhos, pais, avós)',
      'Medicamentos e alarmes ilimitados',
      'Fotos e receitas médicas em alta resolução',
      'Relatórios individuais e compartilhados em PDF',
      'Avisos de reposição de farmácia',
      'Acesso multi-dispositivo simultâneo'
    ],
    maxMeds: 999,
    maxMembers: 10,
  }
];

let stripeInstance: Stripe | null = null;

export function getStripe(): Stripe | null {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key || key.includes('MY_') || key.startsWith('sk_test_placeholder')) {
    return null;
  }
  if (!stripeInstance) {
    stripeInstance = new Stripe(key);
  }
  return stripeInstance;
}

export async function createStripeCheckoutSession(params: {
  planId: User['plan'];
  userId: string;
  userEmail: string;
  userName: string;
  appUrl: string;
}): Promise<{ url: string; mode: 'stripe' | 'simulator' }> {
  const plan = PLANS.find(p => p.id === params.planId);
  if (!plan || plan.id === 'free') {
    throw new Error('Plano inválido para checkout');
  }

  const stripe = getStripe();
  const origin = params.appUrl.replace(/\/$/, '');

  if (!stripe) {
    // Return sandbox simulation checkout URL
    return {
      url: `${origin}/?checkout_session=sim_${Date.now()}&plan=${plan.id}&simulated=true`,
      mode: 'simulator'
    };
  }

  try {
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      customer_email: params.userEmail,
      client_reference_id: params.userId,
      line_items: [
        {
          price_data: {
            currency: 'brl',
            product_data: {
              name: `Seu Horário do Remédio - ${plan.name}`,
              description: `Acesso completo ao plano ${plan.name} para controle de medicamentos e saúde familiar`,
            },
            unit_amount: plan.priceInCents,
            recurring: {
              interval: plan.interval === 'ano' ? 'year' : 'month',
            },
          },
          quantity: 1,
        },
      ],
      mode: 'subscription',
      success_url: `${origin}/?checkout_success=true&session_id={CHECKOUT_SESSION_ID}&plan=${plan.id}`,
      cancel_url: `${origin}/?checkout_canceled=true`,
      metadata: {
        userId: params.userId,
        planId: plan.id,
      },
    });

    return {
      url: session.url || `${origin}/?checkout_success=true&plan=${plan.id}`,
      mode: 'stripe'
    };
  } catch (err: any) {
    console.error('Stripe API error:', err);
    // Fallback to simulated checkout on error
    return {
      url: `${origin}/?checkout_session=sim_${Date.now()}&plan=${plan.id}&simulated=true`,
      mode: 'simulator'
    };
  }
}
