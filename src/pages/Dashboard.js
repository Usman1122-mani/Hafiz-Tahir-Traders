import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Package, DollarSign, AlertTriangle, TrendingUp } from 'lucide-react';
import { Skeleton } from '../components/ui/Loader';
import { useTranslation } from '../context/LanguageContext';
import api from '../api/axios';
import { toast } from 'react-toastify';
import './Dashboard.css';

const StatCard = ({ title, value, icon, color, delay }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay, duration: 0.4 }}
    className="stat-card glass"
  >
    <div className="stat-content">
      <div className="stat-info">
        <p className="stat-title">{title}</p>
        <h3 className="stat-value">{value}</h3>
      </div>
      <div className="stat-icon" style={{ backgroundColor: `${color}20`, color }}>
        {icon}
      </div>
    </div>
  </motion.div>
);

const Dashboard = () => {
  const { t } = useTranslation();
  const [stats, setStats] = useState({
    totalProducts: 0,
    totalSales: 0,
    lowStock: 0,
    revenue: 0,
  });
  const [lowStockItems, setLowStockItems] = useState([]);
  const [salesWeekly, setSalesWeekly] = useState([0, 0, 0, 0]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const [prodRes, salesRes] = await Promise.all([
          api.get('/products').catch(() => ({ data: [] })),
          api.get('/sales').catch(() => ({ data: [] })),
        ]);

        const products = Array.isArray(prodRes.data) ? prodRes.data : [];
        const sales = Array.isArray(salesRes.data) ? salesRes.data : [];

        const lowStockProducts = products.filter(
          (p) => (p.stock !== undefined ? p.stock : p.quantity) <= (p.low_stock_limit || 10)
        );
        const totalRev = sales.reduce(
          (acc, sale) => acc + Number(sale.total || sale.amount || 0),
          0
        );

        // ── Real weekly bucketing based on sale_date ──────────────────────
        // Week 1: day 1–7  | Week 2: day 8–14 | Week 3: day 15–21 | Week 4: day 22+
        const now       = new Date();
        const thisYear  = now.getFullYear();
        const thisMonth = now.getMonth(); // 0-indexed

        const weekSales = [0, 0, 0, 0];
        sales.forEach((sale) => {
          const rawDate = sale.sale_date || sale.date;
          if (!rawDate) return; // skip if no date

          // Normalize: extract YYYY-MM-DD regardless of whether rawDate
          // is a Date object, ISO string, or "YYYY-MM-DD HH:MM:SS" string.
          // This avoids UTC-vs-local timezone shifts that can move a date
          // to a different day/month.
          let dateStr;
          if (rawDate instanceof Date) {
            // MySQL driver may return a Date object in UTC — use UTC methods
            const y = rawDate.getUTCFullYear();
            const m = rawDate.getUTCMonth(); // 0-indexed
            const d = rawDate.getUTCDate();
            if (y !== thisYear || m !== thisMonth) return;
            const weekIdx = d <= 7 ? 0 : d <= 14 ? 1 : d <= 21 ? 2 : 3;
            weekSales[weekIdx] += Number(sale.total || sale.amount || 0);
            return;
          } else {
            // String like "2026-04-01 10:30:00" or "2026-04-01T10:30:00.000Z"
            dateStr = String(rawDate).substring(0, 10); // "YYYY-MM-DD"
          }

          const parts = dateStr.split('-');
          if (parts.length < 3) return;
          const saleYear  = parseInt(parts[0], 10);
          const saleMonth = parseInt(parts[1], 10) - 1; // convert to 0-indexed
          const saleDay   = parseInt(parts[2], 10);

          if (saleYear !== thisYear || saleMonth !== thisMonth) return;
          const weekIdx = saleDay <= 7 ? 0 : saleDay <= 14 ? 1 : saleDay <= 21 ? 2 : 3;
          weekSales[weekIdx] += Number(sale.total || sale.amount || 0);
        });

        setStats({
          totalProducts: products.length,
          totalSales: sales.length,
          lowStock: lowStockProducts.length,
          revenue: totalRev,
        });
        setLowStockItems(lowStockProducts.slice(0, 5));
        setSalesWeekly(weekSales);
      } catch (error) {
        toast.error('Failed to load dashboard data');
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  const maxSale = Math.max(...salesWeekly, 1);

  return (
    <div className="page-container">
      <header className="page-header">
        <div>
          <h1 className="page-title">{t('storeOverview')}</h1>
        </div>
      </header>

      {/* Stat Cards */}
      {loading ? (
        <div className="stats-grid">
          {[1, 2, 3, 4].map((k) => (
            <div key={k} className="stat-card glass">
              <Skeleton height="70px" />
            </div>
          ))}
        </div>
      ) : (
        <div className="stats-grid">
          <StatCard
            title={t('totalProducts')}
            value={stats.totalProducts}
            icon={<Package size={24} />}
            color="var(--accent-primary)"
            delay={0.1}
          />
          <StatCard
            title={t('monthlySales')}
            value={`Rs. ${stats.revenue.toLocaleString()}`}
            icon={<DollarSign size={24} />}
            color="var(--success)"
            delay={0.2}
          />
          <StatCard
            title={t('lowStockAlerts')}
            value={stats.lowStock}
            icon={<AlertTriangle size={24} />}
            color="var(--danger)"
            delay={0.3}
          />
          <StatCard
            title={t('recentOrders')}
            value={stats.totalSales}
            icon={<TrendingUp size={24} />}
            color="#8b5cf6"
            delay={0.4}
          />
        </div>
      )}

      {/* Bottom Row: Chart + Low Stock Panel */}
      <div className="dashboard-bottom-row">
        {/* Sales Trend Chart */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.4 }}
          className="chart-card glass"
        >
          <h3 className="section-title">{t('salesTrend')}</h3>
          <div className="bar-chart">
            <div className="bar-chart-y-axis">
              {[...Array(5)].map((_, i) => {
                const val = Math.round((maxSale / 4) * (4 - i));
                return <span key={i}>Rs. {val.toLocaleString()}</span>;
              })}
            </div>
            <div className="bar-chart-bars">
              {salesWeekly.map((val, index) => (
                <div key={index} className="bar-column">
                  <motion.div
                    className="bar"
                    initial={{ height: 0 }}
                    animate={{ height: `${Math.max((val / maxSale) * 100, 4)}%` }}
                    transition={{ delay: 0.6 + index * 0.1, duration: 0.5, ease: 'easeOut' }}
                    title={`Week ${index + 1}: Rs. ${val.toLocaleString()}`}
                  >
                    <span className="bar-tooltip">
                      {t('sales')}: {val.toLocaleString()}
                    </span>
                  </motion.div>
                  <span className="bar-label">{t('week')} {index + 1}</span>
                </div>
              ))}
            </div>
          </div>
        </motion.div>

        {/* Items Needing Restock */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7, duration: 0.4 }}
          className="restock-card glass"
        >
          <div className="restock-header">
            <h3 className="section-title">{t('itemsNeedingRestock')}</h3>
            <span className="restock-count">{lowStockItems.length} {t('items')}</span>
          </div>
          <div className="restock-list">
            {lowStockItems.length === 0 ? (
              <p className="no-items">{t('allWellStocked')}</p>
            ) : (
              lowStockItems.map((item, i) => {
                const qty = item.quantity !== undefined ? item.quantity : item.stock;
                return (
                  <motion.div
                    key={item.id || i}
                    className="restock-item"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.8 + i * 0.1 }}
                  >
                    <div className="restock-item-icon">
                      <AlertTriangle size={18} />
                    </div>
                    <div className="restock-item-info">
                      <span className="restock-item-name">{item.name || 'Unnamed'}</span>
                      <span className="restock-item-sku">SKU: {item.id}</span>
                    </div>
                    <div className="restock-item-qty">
                      <span className="qty-value">{qty} left</span>
                      <span className="qty-min">Min: 10</span>
                    </div>
                  </motion.div>
                );
              })
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default Dashboard;