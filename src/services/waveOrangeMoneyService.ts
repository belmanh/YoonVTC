import { PaymentMethod } from '../types/vtc';

export interface WaveCheckoutResponse {
  id: string;
  amount: string;
  currency: 'XOF';
  client_reference: string;
  wave_launch_url: string;
  checkout_status: 'complete' | 'incomplete';
  when_created: string;
  when_expires: string;
}

export interface OrangeMoneyWebPayResponse {
  status: number;
  message: string;
  payment_token: string;
  payment_url: string;
  notif_token: string;
  txnid: string;
}

/**
 * Service gérant l'intégration Wave & Orange Money pour le Sénégal
 */
export class SenegalPaymentService {
  /**
   * Simulation création session Wave Checkout API
   */
  static async createWaveSession(params: {
    amountFcfa: number;
    clientReference: string;
    passengerPhone: string;
  }): Promise<WaveCheckoutResponse> {
    // Simulation du temps réseau
    await new Promise((resolve) => setTimeout(resolve, 800));

    const sessionId = `cos_${Math.random().toString(36).substring(2, 12)}`;
    return {
      id: sessionId,
      amount: params.amountFcfa.toString(),
      currency: 'XOF',
      client_reference: params.clientReference,
      wave_launch_url: `https://pay.wave.com/c/${sessionId}?phone=${encodeURIComponent(params.passengerPhone)}`,
      checkout_status: 'complete',
      when_created: new Date().toISOString(),
      when_expires: new Date(Date.now() + 30 * 60 * 1000).toISOString(),
    };
  }

  /**
   * Simulation initialisation Orange Money WebPay API (OM Sénégal)
   */
  static async createOrangeMoneyPayment(params: {
    amountFcfa: number;
    orderId: string;
    passengerPhone: string;
  }): Promise<OrangeMoneyWebPayResponse> {
    await new Promise((resolve) => setTimeout(resolve, 900));

    const token = `OM_SN_${Date.now()}_${Math.random().toString(36).substring(2, 7).toUpperCase()}`;
    return {
      status: 200,
      message: 'OK: OTP generated or USSD push notification sent',
      payment_token: token,
      payment_url: `https://om-senegal-webpay.orange.sn/pay?token=${token}`,
      notif_token: `NOTIF_${token}`,
      txnid: `OMTXN_${Date.now()}`,
    };
  }

  /**
   * Formatage standard des prix en Franc CFA (FCFA / XOF)
   */
  static formatFCFA(amount: number): string {
    return new Intl.NumberFormat('fr-SN', {
      style: 'decimal',
      maximumFractionDigits: 0,
    }).format(amount) + ' FCFA';
  }
}
