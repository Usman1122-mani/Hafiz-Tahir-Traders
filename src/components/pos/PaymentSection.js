import React from 'react';
import { CreditCard, DollarSign } from 'lucide-react';

const PaymentSection = ({ 
  paymentMethod, 
  setPaymentMethod, 
  manualPaidAmount, 
  setManualPaidAmount, 
  cartTotal 
}) => {
  return (
    <div className="pos-payment-section">
      <label className="pos-section-label"><CreditCard size={14} /> Payment Method</label>
      <div className="pos-payment-methods">
        {['Cash', 'Card', 'Online', 'Partial', 'Credit'].map(method => (
          <div 
            key={method}
            className={`pos-method ${paymentMethod === method ? 'active' : ''}`}
            onClick={() => setPaymentMethod(method)}
          >
            {method}
          </div>
        ))}
      </div>

      {paymentMethod === 'Partial' && (
        <div className="pos-partial-input">
          <label className="pos-section-label"><DollarSign size={14} /> Paid Amount (Rs.)</label>
          <input 
            type="number" 
            className="pos-input" 
            value={manualPaidAmount} 
            onChange={(e) => setManualPaidAmount(e.target.value)}
            placeholder="Enter advance amount"
            min="0"
            max={cartTotal}
          />
        </div>
      )}

      {paymentMethod === 'Credit' && (
        <div className="pos-credit-warning">
          * Full amount (Rs. {cartTotal.toLocaleString()}) goes to Udhaar/Due.
        </div>
      )}
    </div>
  );
};

export default PaymentSection;
