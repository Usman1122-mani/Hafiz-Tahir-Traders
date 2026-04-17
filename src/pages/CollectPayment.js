import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { DollarSign, UserCheck } from 'lucide-react';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Loader } from '../components/ui/Loader';

import api from '../api/axios';
import { toast } from 'react-toastify';
import './Dashboard.css';
import './CollectPayment.css';

const CollectPayment = () => {

  const navigate = useNavigate();
  const location = useLocation();
  const initialCustomerId = location.state?.customerId || '';

  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [selectedCustomerId, setSelectedCustomerId] = useState(initialCustomerId);
  const [amountPaid, setAmountPaid] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('Cash');

  useEffect(() => {
    fetchCustomers();
  }, []);

  const fetchCustomers = async () => {
    try {
      setLoading(true);
      const res = await api.get('/customers');
      // Filter out Walk-in since we don't track ledger for walk-ins
      const manualCustomers = res.data.filter(c => c.name.toLowerCase() !== 'walk-in' && c.name.toLowerCase() !== 'walk-in customer');
      setCustomers(manualCustomers);
    } catch (err) {
      toast.error('Failed to load customers');
    } finally {
      setLoading(false);
    }
  };

  const selectedCustomer = customers.find(c => (c.id || c._id).toString() === selectedCustomerId.toString());

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!selectedCustomerId) {
      toast.error('Please select a customer.');
      return;
    }
    
    if (Number(amountPaid) <= 0) {
      toast.error('Payment amount must be greater than 0.');
      return;
    }

    if (Number(amountPaid) > Number(selectedCustomer.total_due || 0)) {
       if (!window.confirm(`Warning: You are collecting more than the total due. Excess amount will reduce the due below zero (advance payment). Proceed?`)) {
           return;
       }
    }

    setSubmitting(true);
    try {
      await api.post('/payments', {
        customer_id: selectedCustomerId,
        amount_paid: Number(amountPaid),
        payment_method: paymentMethod
      });
      toast.success('Payment collected successfully!');
      navigate('/ledger');
    } catch (error) {
      toast.error('Failed to collect payment');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div className="page-container"><Loader /></div>;

  return (
    <div className="page-container">
      <header className="page-header collect-payment-header">
        <div>
          <h1 className="page-title"><DollarSign size={24} /> Collect Payment</h1>
          <p className="page-subtitle">Receive and log khata payments from recorded customers.</p>
        </div>
      </header>

      <div className="collect-payment-container">
        <Card>
          <form onSubmit={handleSubmit}>
            <div className="form-group" style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text-secondary)' }}>
                <UserCheck size={16} /> Select Customer
              </label>
              <select 
                className="input-field" 
                value={selectedCustomerId}
                onChange={(e) => setSelectedCustomerId(e.target.value)}
                style={{ width: '100%', padding: '10px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)', background: 'var(--bg-secondary)', color: 'var(--text-primary)' }}
                required
              >
                <option value="">-- Choose a Customer --</option>
                {customers.map(c => (
                  <option key={c.id || c._id} value={c.id || c._id}>
                    {c.name} {c.phone ? `(${c.phone})` : ''} - Due: Rs. {Number(c.total_due || 0).toLocaleString()}
                  </option>
                ))}
              </select>
            </div>

            {selectedCustomer && (
              <div className="payment-details-card">
                <div className="balance-display">
                  <span className="balance-title">Current Outstanding Due:</span>
                  <span className={`balance-amount ${Number(selectedCustomer.total_due || 0) > 0 ? 'text-danger' : 'text-success'}`}>
                    Rs. {Number(selectedCustomer.total_due || 0).toLocaleString()}
                  </span>
                </div>

                <Input 
                  type="number"
                  label="Amount Being Paid (Rs.)"
                  value={amountPaid}
                  onChange={(e) => setAmountPaid(e.target.value)}
                  placeholder="e.g. 5000"
                  min="1"
                  required
                />

                <div className="settings-group" style={{ marginTop: '20px' }}>
                  <label className="settings-label">Payment Method</label>
                  <div className="payment-method-options">
                    {['Cash', 'Card', 'Online'].map(method => (
                      <div 
                        key={method}
                        className={`payment-method ${paymentMethod === method ? 'active' : ''}`}
                        onClick={() => setPaymentMethod(method)}
                      >
                        {method}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            <div className="action-buttons">
              <Button type="button" variant="secondary" onClick={() => navigate('/ledger')}>Cancel</Button>
              <Button type="submit" isLoading={submitting} disabled={!selectedCustomerId || submitting}>
                Complete Collection
              </Button>
            </div>
          </form>
        </Card>
      </div>
    </div>
  );
};

export default CollectPayment;
