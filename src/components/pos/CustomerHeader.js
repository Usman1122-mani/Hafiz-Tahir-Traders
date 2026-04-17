import React from 'react';
import { User } from 'lucide-react';

const CustomerHeader = ({ customers, selectedCustomerId, onSelect }) => {
  const selectedCustomer = customers.find(c => (c.id || c._id).toString() === selectedCustomerId?.toString());

  const today = new Date().toLocaleDateString('en-GB', {
    day: 'numeric', month: 'long', year: 'numeric'
  });

  return (
    <div className="pos-customer-header">
      <div className="pos-ch-top">
        <div className="pos-ch-info">
          <span className="pos-ch-title">{selectedCustomer ? selectedCustomer.name : 'Walk-in Customer'}</span>
          <span className="pos-ch-date">Date: {today}</span>
        </div>
      </div>

      {selectedCustomer && Number(selectedCustomer.total_due) > 0 && (
        <div className="pos-ch-due">
          <span>Prior Due Balance:</span>
          <span className="due-amt">Rs. {Number(selectedCustomer.total_due).toLocaleString()}</span>
        </div>
      )}

      <div className="pos-ch-selector">
        <User size={14} className="ch-icon" />
        <select 
          className="customer-select" 
          value={selectedCustomerId}
          onChange={(e) => onSelect(e.target.value)}
        >
          <option value="">Walk-in Customer</option>
          {customers.map(c => (
            <option key={c.id || c._id} value={c.id || c._id}>
              {c.name} {c.phone ? `(${c.phone})` : ''} 
            </option>
          ))}
        </select>
      </div>
    </div>
  );
};

export default CustomerHeader;
