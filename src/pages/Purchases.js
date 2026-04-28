import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, X, Trash2 } from 'lucide-react';
import { Card } from '../components/ui/Card';
import { Table } from '../components/ui/Table';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Loader } from '../components/ui/Loader';
import { useTranslation } from '../context/LanguageContext';
import api from '../api/axios';
import { toast } from 'react-toastify';
import './Dashboard.css';

const Purchases = () => {
  const { t } = useTranslation();
  const [purchases, setPurchases] = useState([]);
  const [products, setProducts] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [isRestockModalOpen, setIsRestockModalOpen] = useState(false);
  const [isNewModalOpen, setIsNewModalOpen] = useState(false);
  const [formData, setFormData] = useState({ productId: '', supplierId: '', quantity: '', unitPrice: '', cost: '' });
  const [newProdData, setNewProdData] = useState({ 
    name: '', size: '', buyPrice: '', sellPrice: '', stock: '', lowStockLimit: 10, supplierId: '' 
  });
  const [submitting, setSubmitting] = useState(false);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [purchRes, prodRes, suppRes] = await Promise.all([
        api.get('/purchases').catch(() => ({ data: [] })),
        api.get('/products').catch(() => ({ data: [] })),
        api.get('/suppliers').catch(() => ({ data: [] }))
      ]);
      setPurchases(Array.isArray(purchRes.data) ? purchRes.data : []);
      setProducts(Array.isArray(prodRes.data) ? prodRes.data : []);
      setSuppliers(Array.isArray(suppRes.data) ? suppRes.data : []);
    } catch (err) {
      toast.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Auto-calculate Total Cost for Restock
  useEffect(() => {
    const qty = parseFloat(formData.quantity) || 0;
    const price = parseFloat(formData.unitPrice) || 0;
    setFormData(prev => ({ ...prev, cost: (qty * price).toFixed(2) }));
  }, [formData.quantity, formData.unitPrice]);

  const handleRestockSubmit = async (e) => {
    e.preventDefault();
    if (!formData.productId || !formData.supplierId || !formData.quantity || !formData.unitPrice) {
      toast.warning('All fields are required');
      return;
    }
    setSubmitting(true);
    try {
      await api.post('/purchases', formData);
      toast.success('Stock purchase recorded successfully');
      setIsRestockModalOpen(false);
      setFormData({ productId: '', supplierId: '', quantity: '', unitPrice: '', cost: '' });
      fetchData();
    } catch (error) {
      toast.error(error?.response?.data?.message || 'Failed to record purchase');
    } finally {
      setSubmitting(false);
    }
  };

  const handleNewPurchaseSubmit = async (e) => {
    e.preventDefault();
    const { name, size, buyPrice, sellPrice, stock, lowStockLimit, supplierId } = newProdData;
    
    if (!name || !size || !buyPrice || !sellPrice || !stock || !supplierId) {
      toast.warning('All fields are required');
      return;
    }

    setSubmitting(true);
    try {
      // 1. Create the product with 0 initial stock (purchase will add the stock)
      const prodRes = await api.post('/products', {
        name, size, buyPrice, sellPrice, stock: 0, lowStockLimit
      });
      
      const newProductId = prodRes.data.id;

      // 2. Record the purchase
      await api.post('/purchases', {
        productId: newProductId,
        supplierId,
        quantity: stock,
        unitPrice: buyPrice
      });

      toast.success('New product and purchase recorded successfully');
      setIsNewModalOpen(false);
      setNewProdData({ name: '', size: '', buyPrice: '', sellPrice: '', stock: '', lowStockLimit: 10, supplierId: '' });
      fetchData();
    } catch (error) {
      toast.error(error?.response?.data?.message || 'Failed to complete new purchase');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Delete this purchase record?')) {
      try {
        await api.delete(`/purchases/${id}`);
        toast.success('Purchase deleted');
        setPurchases(prev => prev.filter(p => p.id !== id));
      } catch (error) {
        toast.error(error?.response?.data?.message || 'Failed to delete purchase');
      }
    }
  };

  const columns = [
    { header: t('purchaseId'), accessor: 'id', cell: (row) => `#${row.id}` },
    { 
      header: t('product'), 
      cell: (row) => row.product_name || `Product #${row.product_id}` || '-'
    },
    { 
      header: t('supplier'), 
      cell: (row) => row.supplier_name || '-'
    },
    { header: t('qtyAdded'), accessor: 'quantity' },
    { 
      header: t('costRs'), 
      cell: (row) => `Rs. ${Number(row.total_cost || row.price || 0).toLocaleString()}`
    },
    { 
      header: t('date'), 
      cell: (row) => row.purchase_date 
        ? new Date(row.purchase_date).toLocaleDateString('en-PK', { year: 'numeric', month: 'short', day: 'numeric' })
        : '-'
    },
    {
      header: 'Action',
      cell: (row) => (
        <Button variant="danger" size="sm" onClick={() => handleDelete(row.id)}>
          <Trash2 size={15} />
        </Button>
      )
    }
  ];

  return (
    <div className="page-container">
      <header className="page-header">
        <div>
          <h1 className="page-title">{t('purchasesTitle')}</h1>
          <p className="page-subtitle">{t('managePurchases')}</p>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <Button onClick={() => setIsNewModalOpen(true)} className="glass">
            <Plus size={20} /> {t('newPurchase')}
          </Button>
          <Button onClick={() => setIsRestockModalOpen(true)} className="glass">
            <Plus size={20} /> {t('restockPurchase')}
          </Button>
        </div>
      </header>

      {loading ? (
        <Card><Loader /></Card>
      ) : (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          <Table columns={columns} data={purchases} />
        </motion.div>
      )}

      <AnimatePresence>
        {/* Modal for RESTOCK (Existing Products) */}
        {isRestockModalOpen && (
          <motion.div className="modal-overlay" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <motion.div className="modal-content" initial={{ scale: 0.95, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 20 }}>
              <Card>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
                  <h3>{t('restockPurchase')}</h3>
                  <button onClick={() => setIsRestockModalOpen(false)} className="icon-btn"><X size={20}/></button>
                </div>
                <form onSubmit={handleRestockSubmit}>
                  <div className="input-wrapper">
                    <label className="input-label">{t('selectProduct')}</label>
                    <select 
                      className="input-field" 
                      value={formData.productId}
                      onChange={e => setFormData({...formData, productId: e.target.value})}
                      required
                    >
                      <option value="">{t('chooseRestock')}</option>
                      {products.map(p => (
                        <option key={p.id || p._id} value={p.id || p._id}>{p.name}</option>
                      ))}
                    </select>
                  </div>

                  <div className="input-wrapper">
                    <label className="input-label">{t('selectSupplier')} *</label>
                    <select 
                      className="input-field" 
                      value={formData.supplierId}
                      onChange={e => setFormData({...formData, supplierId: e.target.value})}
                      required
                    >
                      <option value="">{t('chooseSupplier')}</option>
                      {suppliers.map(s => (
                        <option key={s.id || s._id} value={s.id || s._id}>{s.name}</option>
                      ))}
                    </select>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                    <Input 
                      type="number"
                      label={t('unitBuyPrice')} 
                      value={formData.unitPrice} 
                      onChange={e => setFormData({...formData, unitPrice: e.target.value})} 
                      required
                      min="0"
                      step="0.01"
                    />
                    <Input 
                      type="number"
                      label={t('quantityToAdd')} 
                      value={formData.quantity} 
                      onChange={e => setFormData({...formData, quantity: e.target.value})} 
                      required
                      min="1"
                    />
                  </div>

                  <Input 
                    type="number"
                    label={t('totalCost')} 
                    value={formData.cost} 
                    readOnly
                    className="bg-gray-100 cursor-not-allowed"
                    style={{ backgroundColor: 'rgba(255,255,255,0.05)', opacity: 0.8 }}
                  />

                  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '20px' }}>
                    <Button type="button" variant="secondary" onClick={() => setIsRestockModalOpen(false)}>{t('cancel')}</Button>
                    <Button type="submit" isLoading={submitting}>{t('submitPurchase')}</Button>
                  </div>
                </form>
              </Card>
            </motion.div>
          </motion.div>
        )}

        {/* Modal for NEW Product Purchase */}
        {isNewModalOpen && (
          <motion.div className="modal-overlay" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <motion.div className="modal-content" initial={{ scale: 0.95, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 20 }}>
              <Card>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
                  <h3>{t('newPurchase')}</h3>
                  <button onClick={() => setIsNewModalOpen(false)} className="icon-btn"><X size={20}/></button>
                </div>
                <form onSubmit={handleNewPurchaseSubmit}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                    <Input 
                      label={t('productName')} 
                      value={newProdData.name} 
                      onChange={e => setNewProdData({...newProdData, name: e.target.value})} 
                      required
                    />
                    <Input 
                      label="Size" 
                      placeholder="e.g. 1L, 500ml"
                      value={newProdData.size} 
                      onChange={e => setNewProdData({...newProdData, size: e.target.value})} 
                      required
                    />
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                    <Input 
                      type="number"
                      label={t('unitBuyPrice')} 
                      value={newProdData.buyPrice} 
                      onChange={e => setNewProdData({...newProdData, buyPrice: e.target.value})} 
                      required
                      min="0"
                    />
                    <Input 
                      type="number"
                      label="Sell Price" 
                      value={newProdData.sellPrice} 
                      onChange={e => setNewProdData({...newProdData, sellPrice: e.target.value})} 
                      required
                      min="0"
                    />
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                    <Input 
                      type="number"
                      label={t('quantityToAdd')} 
                      value={newProdData.stock} 
                      onChange={e => setNewProdData({...newProdData, stock: e.target.value})} 
                      required
                      min="1"
                    />
                    <Input 
                      type="number"
                      label="Low Stock Limit" 
                      value={newProdData.lowStockLimit} 
                      onChange={e => setNewProdData({...newProdData, lowStockLimit: e.target.value})} 
                      required
                      min="1"
                    />
                  </div>

                  <div className="input-wrapper">
                    <label className="input-label">{t('selectSupplier')} *</label>
                    <select 
                      className="input-field" 
                      value={newProdData.supplierId}
                      onChange={e => setNewProdData({...newProdData, supplierId: e.target.value})}
                      required
                    >
                      <option value="">{t('chooseSupplier')}</option>
                      {suppliers.map(s => (
                        <option key={s.id || s._id} value={s.id || s._id}>{s.name}</option>
                      ))}
                    </select>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '20px' }}>
                    <Button type="button" variant="secondary" onClick={() => setIsNewModalOpen(false)}>{t('cancel')}</Button>
                    <Button type="submit" isLoading={submitting}>{t('submitPurchase')}</Button>
                  </div>
                </form>
              </Card>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
export default Purchases;
