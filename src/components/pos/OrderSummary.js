import React from 'react';
import { Loader } from '../ui/Loader';

const OrderSummary = ({
  subtotal,
  discountAmount,
  cartTotal,
  paymentMethod,
  manualPaidAmount,
  currentStep,
  onNextStep,
  submitting,
  cartLength
}) => {
  const paidAmtNum = Number(manualPaidAmount) || 0;
  const remaining = Math.max(0, cartTotal - paidAmtNum);

  return (
    <div className="pos-order-summary">
      <div className="pos-summary-rows">
        <div className="pos-s-row">
          <span>Subtotal:</span>
          <span>Rs. {subtotal.toLocaleString()}</span>
        </div>
        {discountAmount > 0 && (
          <div className="pos-s-row text-danger-soft">
            <span>Discount:</span>
            <span>- Rs. {discountAmount.toLocaleString()}</span>
          </div>
        )}
      </div>

      <div className="pos-grand-total">
        <span>TOTAL</span>
        <span className="total-highlight">Rs. {cartTotal.toLocaleString()}</span>
      </div>

      {currentStep === 2 && paymentMethod === 'Partial' && (
        <div className="pos-partial-breakdown">
          <div className="pos-s-row text-success-bold">
            <span>Paid:</span>
            <span>Rs. {paidAmtNum.toLocaleString()}</span>
          </div>
          <div className="pos-s-row text-danger-bold">
            <span>Remaining:</span>
            <span>Rs. {remaining.toLocaleString()}</span>
          </div>
        </div>
      )}

      <button 
        className="pos-complete-btn" 
        onClick={() => currentStep === 1 ? onNextStep(2) : onNextStep(3)}
        disabled={submitting || cartLength === 0}
      >
        {submitting ? <Loader /> : (currentStep === 1 ? 'Next ➔ Payment' : 'Next ➔ Confirm')}
      </button>
    </div>
  );
};

export default OrderSummary;
