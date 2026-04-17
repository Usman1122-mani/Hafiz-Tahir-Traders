import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FileText, X, DollarSign, Eye } from 'lucide-react';
import { Card } from '../components/ui/Card';
import { Table } from '../components/ui/Table';
import { Button } from '../components/ui/Button';
import { Loader } from '../components/ui/Loader';
import { useTranslation } from '../context/LanguageContext';
import api from '../api/axios';
import { toast } from 'react-toastify';
import { useNavigate } from 'react-router-dom';
import './Dashboard.css';
import './Ledger.css';

const Ledger = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [selectedCustomerId, setSelectedCustomerId] = useState(null);
  const [ledgerData, setLedgerData] = useState(null);
  const [ledgerLoading, setLedgerLoading] = useState(false);

  const fetchCustomers = async () => {
    try {
      setLoading(true);
      const res = await api.get('/customers');
      setCustomers(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      toast.error('Failed to load ledger data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, []);

  const openLedger = async (customerId) => {
    setSelectedCustomerId(customerId);
    setLedgerLoading(true);
    try {
      const res = await api.get(`/customers/${customerId}/ledger`);
      
      // Combine sales and payments into a single timeline array
      const sales = res.data.sales.map(s => ({
        ...s,
        txType: 'SALE',
        dateStr: s.sale_date,
        dateObj: new Date(s.sale_date)
      }));
      const payments = res.data.payments.map(p => ({
        ...p,
        txType: 'PAYMENT',
        dateStr: p.payment_date,
        dateObj: new Date(p.payment_date)
      }));
      
      const combined = [...sales, ...payments].sort((a, b) => b.dateObj - a.dateObj);
      
      setLedgerData({
        ...res.data,
        timeline: combined
      });
    } catch (err) {
      toast.error('Failed to load customer ledger details');
      closeLedger();
    } finally {
      setLedgerLoading(false);
    }
  };

  const closeLedger = () => {
    setSelectedCustomerId(null);
    setLedgerData(null);
  };

  const columns = [
    { header: 'Customer ID', accessor: 'id', cell: (row) => row.id || row._id || '-' },
    { header: 'Name', accessor: 'name' },
    { header: 'Phone', accessor: 'phone' },
    { 
      header: 'Total Due (Rs.)', 
      accessor: 'total_due',
      cell: (row) => (
        <span className={Number(row.total_due) > 0 ? 'text-danger fw-bold' : 'text-success'}>
          {Number(row.total_due || 0).toLocaleString()}
        </span>
      )
    },
    {
      header: 'Actions',
      cell: (row) => (
        <div className="ledger-actions">
          <Button variant="secondary" size="sm" onClick={() => openLedger(row.id || row._id)}>
            <Eye size={16} /> View Ledger
          </Button>
          <Button variant="primary" size="sm" onClick={() => navigate('/collect-payment', { state: { customerId: row.id || row._id } })}>
            <DollarSign size={16} /> Collect
          </Button>
        </div>
      )
    }
  ];

  return (
    <div className="page-container">
      <header className="page-header">
        <div>
          <h1 className="page-title">Customer Ledger</h1>
          <p className="page-subtitle">Track Udhaar and customer payment histories.</p>
        </div>
      </header>

      {loading ? (
        <Card><Loader /></Card>
      ) : (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          <Table columns={columns} data={customers.filter(c => c.name.toLowerCase() !== 'walk-in' && c.name.toLowerCase() !== 'walk-in customer')} />
        </motion.div>
      )}

      <AnimatePresence>
        {selectedCustomerId && (
          <motion.div 
            className="modal-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div 
              className="modal-content ledger-modal-content"
              initial={{ scale: 0.95, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 20 }}
            >
              <Card>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
                  <h3>Ledger: {ledgerData?.customer?.name || 'Loading...'}</h3>
                  <button onClick={closeLedger} className="icon-btn"><X size={20}/></button>
                </div>

                {ledgerLoading || !ledgerData ? <Loader /> : (
                  <>
                    <div className="ledger-summary-cards">
                      <div className="summary-card">
                        <h4>Total Purchases</h4>
                        <p className="text-primary">Rs. {Number(ledgerData.totalPurchases || 0).toLocaleString()}</p>
                      </div>
                      <div className="summary-card">
                        <h4>Total Paid</h4>
                        <p className="text-success">Rs. {Number(ledgerData.totalPaid || 0).toLocaleString()}</p>
                      </div>
                      <div className="summary-card">
                        <h4>Total Due</h4>
                        <p className="text-danger">Rs. {Number(ledgerData.customer.total_due || 0).toLocaleString()}</p>
                      </div>
                    </div>

                    <h4 style={{ marginBottom: '10px' }}>Transaction History</h4>
                    {ledgerData.timeline.length === 0 ? (
                      <p>No transactions found.</p>
                    ) : (
                      <div className="transaction-list">
                        {ledgerData.timeline.map((tx, idx) => (
                          <div key={idx} className="tx-row">
                            <div className="tx-left">
                              <span className="tx-type">
                                {tx.txType === 'SALE' ? `Sale (ID: ${tx.id})` : `Payment Received`}
                              </span>
                              <span className="tx-date">{new Date(tx.dateStr).toLocaleString()}</span>
                            </div>
                            <div className="tx-right">
                              {tx.txType === 'SALE' ? (
                                <>
                                  <span className="tx-amount text-danger">- Rs. {Number(tx.total).toLocaleString()}</span>
                                  <span className={`tx-status ${tx.status === 'PAID' ? 'bg-success' : tx.status === 'PARTIAL' ? 'bg-warning' : 'bg-danger'}`}>
                                    {tx.status} 
                                    {tx.status !== 'PAID' ? ` (Rem: ${Number(tx.remaining_amount).toLocaleString()})` : ''}
                                  </span>
                                </>
                              ) : (
                                <>
                                  <span className="tx-amount text-success">+ Rs. {Number(tx.amount_paid).toLocaleString()}</span>
                                  <span className="tx-status" style={{background: 'var(--bg-secondary)', color: 'var(--text-secondary)'}}>
                                    {tx.payment_method}
                                  </span>
                                </>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </>
                )}
              </Card>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Ledger;
