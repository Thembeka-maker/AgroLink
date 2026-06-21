import React, { useState } from 'react';
import { CreditCard, Smartphone, Building2, CheckCircle, X, Lock, AlertTriangle } from 'lucide-react';
import { DealOffer, PaymentDetails } from '../types';
import { formatCurrency } from '../services/currencyService';

interface PaymentModalProps {
  deal: DealOffer;
  buyerCurrency: string;
  onConfirm: (details: PaymentDetails) => void;
  onClose: () => void;
}

type PaymentStep = 'method' | 'details' | 'confirm' | 'success';

export const PaymentModal: React.FC<PaymentModalProps> = ({
  deal,
  buyerCurrency,
  onConfirm,
  onClose,
}) => {
  const [step, setStep] = useState<PaymentStep>('method');
  const [method, setMethod] = useState<PaymentDetails['method']>('card');
  const [processing, setProcessing] = useState(false);

  // Card fields
  const [cardNumber, setCardNumber] = useState('');
  const [cardHolder, setCardHolder] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCvv, setCardCvv] = useState('');

  // Mobile Money
  const [mobileNumber, setMobileNumber] = useState('');
  const [mobilePin, setMobilePin] = useState('');

  // Bank Transfer
  const [bankRef, setBankRef] = useState('');

  const totalUSD = deal.totalAmount;
  const paymentRef = `AGL-${deal.id.toUpperCase()}-${Date.now().toString(36).toUpperCase()}`;

  const formatCard = (val: string) =>
    val.replace(/\D/g, '').slice(0, 16).replace(/(.{4})/g, '$1 ').trim();
  const formatExpiry = (val: string) =>
    val.replace(/\D/g, '').slice(0, 4).replace(/(.{2})/, '$1/');

  const handleProceed = () => {
    if (step === 'method') { setStep('details'); return; }
    if (step === 'details') { setStep('confirm'); return; }
    if (step === 'confirm') {
      setProcessing(true);
      setTimeout(() => {
        setProcessing(false);
        setStep('success');
        onConfirm({
          dealId: deal.id,
          method,
          amountUSD: totalUSD,
          buyerCurrency,
          cardNumber: method === 'card' ? cardNumber : undefined,
          cardHolder: method === 'card' ? cardHolder : undefined,
          cardExpiry: method === 'card' ? cardExpiry : undefined,
          cardCvv: method === 'card' ? cardCvv : undefined,
          mobileNumber: method === 'mobile_money' ? mobileNumber : undefined,
          bankRef: method === 'bank_transfer' ? bankRef : undefined,
        });
      }, 2500);
    }
  };

  const canProceed = () => {
    if (step === 'method') return true;
    if (step === 'details') {
      if (method === 'card') return cardNumber.length >= 19 && cardHolder.length > 2 && cardExpiry.length >= 5 && cardCvv.length >= 3;
      if (method === 'mobile_money') return mobileNumber.length >= 8 && mobilePin.length >= 4;
      if (method === 'bank_transfer') return bankRef.length > 3;
    }
    if (step === 'confirm') return true;
    return false;
  };

  const methodLabel = { card: 'Debit / Credit Card', mobile_money: 'Mobile Money', bank_transfer: 'Bank Transfer' }[method];

  return (
    <div style={{
      position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.55)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      zIndex: 9999, padding: '1rem', backdropFilter: 'blur(4px)',
    }}>
      <div style={{
        backgroundColor: '#fff', borderRadius: '1.25rem', width: '100%', maxWidth: '480px',
        boxShadow: '0 25px 60px rgba(0,0,0,0.25)', overflow: 'hidden',
      }}>
        {/* Header */}
        <div style={{
          background: 'linear-gradient(135deg, var(--color-primary-dark) 0%, var(--color-primary-light) 100%)',
          padding: '1.5rem', color: '#fff', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start',
        }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
              <Lock size={16} />
              <span style={{ fontSize: '0.75rem', opacity: 0.85, fontWeight: 600 }}>SECURE PAYMENT</span>
            </div>
            <h2 style={{ margin: 0, fontSize: '1.4rem', fontWeight: 800 }}>
              {step === 'success' ? 'Payment Confirmed!' : 'Complete Payment'}
            </h2>
            <p style={{ margin: '0.25rem 0 0', opacity: 0.85, fontSize: '0.85rem' }}>
              {deal.crop} · {deal.quantity.toLocaleString()} kg
            </p>
          </div>
          {step !== 'success' && (
            <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer', opacity: 0.7, padding: '0.25rem' }}>
              <X size={20} />
            </button>
          )}
        </div>

        {/* Amount Banner */}
        <div style={{
          background: 'linear-gradient(90deg, rgba(82,183,136,0.08), rgba(82,183,136,0.04))',
          borderBottom: '1px solid var(--color-border)',
          padding: '1rem 1.5rem',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        }}>
          <div>
            <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', fontWeight: 600, marginBottom: '0.15rem' }}>TOTAL DUE</div>
            <div style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--color-primary-dark)', lineHeight: 1 }}>
              {formatCurrency(totalUSD, buyerCurrency)}
            </div>
            {buyerCurrency !== 'USD' && (
              <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginTop: '0.15rem' }}>
                ≈ ${totalUSD.toFixed(2)} USD
              </div>
            )}
          </div>
          <div style={{ textAlign: 'right', fontSize: '0.78rem', color: 'var(--color-text-muted)' }}>
            <div>{deal.farmerName}</div>
            <div style={{ fontWeight: 600, color: 'var(--color-text)' }}>Ref: {paymentRef.slice(0, 16)}</div>
          </div>
        </div>

        <div style={{ padding: '1.5rem' }}>
          {/* STEP 1: Method Selection */}
          {step === 'method' && (
            <div>
              <p style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', marginBottom: '1rem' }}>
                Choose your preferred payment method
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                {([
                  { id: 'card', label: 'Debit / Credit Card', sub: 'Visa, Mastercard, Amex', icon: <CreditCard size={20} /> },
                  { id: 'mobile_money', label: 'Mobile Money', sub: 'ESwatini Mobile, M-Pesa, MTN MoMo', icon: <Smartphone size={20} /> },
                  { id: 'bank_transfer', label: 'Bank Transfer', sub: 'Standard Bank, FNB, Nedbank, Eswatini Bank', icon: <Building2 size={20} /> },
                ] as const).map((opt) => (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => setMethod(opt.id)}
                    style={{
                      display: 'flex', alignItems: 'center', gap: '1rem',
                      padding: '0.9rem 1rem', borderRadius: 'var(--radius-md)',
                      border: `2px solid ${method === opt.id ? 'var(--color-primary-light)' : 'var(--color-border)'}`,
                      backgroundColor: method === opt.id ? 'rgba(82,183,136,0.07)' : '#fff',
                      cursor: 'pointer', textAlign: 'left', transition: 'all 0.18s',
                    }}
                  >
                    <div style={{
                      width: '40px', height: '40px', borderRadius: '10px', flexShrink: 0,
                      background: method === opt.id ? 'linear-gradient(135deg, var(--color-primary-dark), var(--color-primary-light))' : 'var(--color-background)',
                      color: method === opt.id ? '#fff' : 'var(--color-primary-dark)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      transition: 'all 0.18s',
                    }}>
                      {opt.icon}
                    </div>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--color-text)' }}>{opt.label}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>{opt.sub}</div>
                    </div>
                    {method === opt.id && (
                      <CheckCircle size={18} style={{ marginLeft: 'auto', color: 'var(--color-primary-light)', flexShrink: 0 }} />
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* STEP 2: Payment Details */}
          {step === 'details' && (
            <div>
              <p style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', marginBottom: '1rem' }}>
                Enter your {methodLabel} details
              </p>

              {method === 'card' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  <div className="form-group" style={{ margin: 0 }}>
                    <label className="form-label">Card Number</label>
                    <input
                      className="form-control"
                      placeholder="0000 0000 0000 0000"
                      value={formatCard(cardNumber)}
                      onChange={(e) => setCardNumber(e.target.value.replace(/\s/g, ''))}
                      maxLength={19}
                    />
                  </div>
                  <div className="form-group" style={{ margin: 0 }}>
                    <label className="form-label">Cardholder Name</label>
                    <input className="form-control" placeholder="Full name on card"
                      value={cardHolder} onChange={(e) => setCardHolder(e.target.value)} />
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                    <div className="form-group" style={{ margin: 0 }}>
                      <label className="form-label">Expiry</label>
                      <input className="form-control" placeholder="MM/YY"
                        value={formatExpiry(cardExpiry)} onChange={(e) => setCardExpiry(e.target.value.replace('/', ''))} maxLength={5} />
                    </div>
                    <div className="form-group" style={{ margin: 0 }}>
                      <label className="form-label">CVV</label>
                      <input className="form-control" placeholder="•••" type="password"
                        value={cardCvv} onChange={(e) => setCardCvv(e.target.value.slice(0, 4))} maxLength={4} />
                    </div>
                  </div>
                  <div style={{
                    display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.75rem',
                    color: 'var(--color-text-muted)', backgroundColor: 'var(--color-background)',
                    padding: '0.5rem 0.75rem', borderRadius: 'var(--radius-sm)',
                  }}>
                    <Lock size={12} /> 256-bit SSL encrypted. Card data is never stored.
                  </div>
                </div>
              )}

              {method === 'mobile_money' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  <div className="form-group" style={{ margin: 0 }}>
                    <label className="form-label">Mobile Number</label>
                    <input className="form-control" placeholder="e.g. +268 7602-1234"
                      value={mobileNumber} onChange={(e) => setMobileNumber(e.target.value)} />
                  </div>
                  <div className="form-group" style={{ margin: 0 }}>
                    <label className="form-label">Mobile PIN</label>
                    <input className="form-control" type="password" placeholder="Enter your mobile money PIN"
                      value={mobilePin} onChange={(e) => setMobilePin(e.target.value.slice(0, 6))} maxLength={6} />
                  </div>
                  <div style={{
                    backgroundColor: 'rgba(234,179,8,0.08)', border: '1px solid rgba(234,179,8,0.3)',
                    borderRadius: 'var(--radius-sm)', padding: '0.6rem 0.75rem',
                    fontSize: '0.75rem', color: '#92600a', display: 'flex', gap: '0.4rem',
                  }}>
                    <AlertTriangle size={13} style={{ flexShrink: 0, marginTop: '1px' }} />
                    You will receive a USSD push notification to approve this payment on your handset.
                  </div>
                </div>
              )}

              {method === 'bank_transfer' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  <div style={{
                    backgroundColor: 'var(--color-background)', borderRadius: 'var(--radius-md)',
                    padding: '1rem', fontSize: '0.82rem', lineHeight: 1.7,
                    border: '1px solid var(--color-border)',
                  }}>
                    <div style={{ fontWeight: 700, marginBottom: '0.4rem', color: 'var(--color-primary-dark)' }}>AgroLink Bank Account Details</div>
                    <div><span style={{ color: 'var(--color-text-muted)' }}>Bank:</span> <strong>Standard Bank Eswatini</strong></div>
                    <div><span style={{ color: 'var(--color-text-muted)' }}>Account Name:</span> <strong>AgroLink SADC (Pty) Ltd</strong></div>
                    <div><span style={{ color: 'var(--color-text-muted)' }}>Account No:</span> <strong>0012-3456-7890</strong></div>
                    <div><span style={{ color: 'var(--color-text-muted)' }}>Branch Code:</span> <strong>051001</strong></div>
                    <div><span style={{ color: 'var(--color-text-muted)' }}>Amount:</span> <strong>{formatCurrency(totalUSD, buyerCurrency)}</strong></div>
                    <div><span style={{ color: 'var(--color-text-muted)' }}>Reference:</span> <strong>{paymentRef}</strong></div>
                  </div>
                  <div className="form-group" style={{ margin: 0 }}>
                    <label className="form-label">Your Bank Reference / POP Number</label>
                    <input className="form-control" placeholder="Enter proof of payment reference"
                      value={bankRef} onChange={(e) => setBankRef(e.target.value)} />
                  </div>
                </div>
              )}
            </div>
          )}

          {/* STEP 3: Confirmation */}
          {step === 'confirm' && (
            <div>
              <p style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', marginBottom: '1rem' }}>
                Review and confirm your payment
              </p>
              {[
                { label: 'Crop', value: `${deal.crop} — Grade ${(deal as any).grade ?? 'A'}` },
                { label: 'Quantity', value: `${deal.quantity.toLocaleString()} kg` },
                { label: 'Seller', value: deal.farmerName },
                { label: 'Payment Method', value: methodLabel },
                { label: 'Amount (Local)', value: formatCurrency(totalUSD, buyerCurrency) },
                { label: 'Amount (USD)', value: `$${totalUSD.toFixed(2)}` },
                { label: 'Reference', value: paymentRef },
              ].map((row) => (
                <div key={row.label} style={{
                  display: 'flex', justifyContent: 'space-between',
                  padding: '0.6rem 0', borderBottom: '1px solid var(--color-border)',
                  fontSize: '0.85rem',
                }}>
                  <span style={{ color: 'var(--color-text-muted)' }}>{row.label}</span>
                  <span style={{ fontWeight: 600, color: 'var(--color-text)', textAlign: 'right', maxWidth: '55%' }}>{row.value}</span>
                </div>
              ))}
            </div>
          )}

          {/* STEP 4: Success */}
          {step === 'success' && (
            <div style={{ textAlign: 'center', padding: '1rem 0' }}>
              <div style={{
                width: '72px', height: '72px', borderRadius: '50%', margin: '0 auto 1.25rem',
                background: 'linear-gradient(135deg, var(--color-primary-dark), var(--color-primary-light))',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <CheckCircle size={36} color="#fff" />
              </div>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 800, marginBottom: '0.5rem' }}>Payment Successful!</h3>
              <p style={{ color: 'var(--color-text-muted)', fontSize: '0.85rem', marginBottom: '1.25rem' }}>
                Your payment of <strong>{formatCurrency(totalUSD, buyerCurrency)}</strong> has been processed and recorded in the AgroLink ledger.
              </p>
              <div style={{
                backgroundColor: 'var(--color-background)', borderRadius: 'var(--radius-md)',
                padding: '0.75rem 1rem', fontSize: '0.8rem', marginBottom: '1.25rem',
              }}>
                <div style={{ color: 'var(--color-text-muted)', marginBottom: '0.2rem' }}>Transaction Reference</div>
                <div style={{ fontWeight: 800, fontFamily: 'monospace', fontSize: '0.9rem', color: 'var(--color-primary-dark)', letterSpacing: '0.05em' }}>{paymentRef}</div>
              </div>
              <button onClick={onClose} className="btn btn-primary" style={{ width: '100%' }}>
                Close &amp; Return to Dashboard
              </button>
            </div>
          )}

          {/* Action buttons */}
          {step !== 'success' && (
            <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.25rem' }}>
              {step !== 'method' && (
                <button
                  onClick={() => setStep(step === 'confirm' ? 'details' : 'method')}
                  className="btn btn-secondary"
                  style={{ flex: 1 }}
                  disabled={processing}
                >
                  Back
                </button>
              )}
              <button
                onClick={handleProceed}
                className="btn btn-primary"
                style={{ flex: 2, position: 'relative' }}
                disabled={!canProceed() || processing}
              >
                {processing ? (
                  <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                    <span style={{
                      width: '16px', height: '16px', border: '2px solid rgba(255,255,255,0.4)',
                      borderTopColor: '#fff', borderRadius: '50%',
                      animation: 'spin 0.8s linear infinite', display: 'inline-block',
                    }} />
                    Processing...
                  </span>
                ) : step === 'method' ? 'Continue' : step === 'details' ? 'Review Payment' : 'Confirm & Pay'}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
