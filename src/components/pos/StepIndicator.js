import React from 'react';

const StepIndicator = ({ currentStep }) => {
  const steps = [
    { id: 1, label: 'Products' },
    { id: 2, label: 'Payment' },
    { id: 3, label: 'Confirm' }
  ];

  return (
    <div className="wizard-step-indicator">
      {steps.map((step, index) => (
        <React.Fragment key={step.id}>
          <div className={`wizard-step ${currentStep >= step.id ? 'active' : ''}`}>
             {step.label}
          </div>
          {index < steps.length - 1 && (
            <div className={`wizard-line ${currentStep > step.id ? 'active' : ''}`}>➜</div>
          )}
        </React.Fragment>
      ))}
    </div>
  );
};

export default StepIndicator;
