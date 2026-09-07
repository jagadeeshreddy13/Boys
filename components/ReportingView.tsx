'use client';

import React, { useState, useMemo, useCallback } from 'react';
import {
  Resident,
  Invoice,
  Payment,
  Expense,
  Complaint,
  CheckoutRecord,
  Bed,
  Room,
  Hostel,
  Building
} from '@/lib/db/types';
import * as XLSX from 'xlsx';
import {
  FileSpreadsheet,
  Download,
  Printer,
  Filter,
  Calendar,
  Building2,
  TrendingUp,
  DollarSign,
  Users,
  BedDouble,
  Receipt,
  Wrench,
  LogOut,
  CheckCircle2,
  AlertCircle,
  Clock,
  Search,
  ChevronDown
} from 'lucide-react';

export type ReportType =
  | 'REVENUE_COLLECTION'
  | 'OCCUPANCY_UTILIZATION'
  | 'BUILDING_COMPARISON'
  | 'RESIDENT_DUES'
  | 'OPERATIONAL_EXPENSES'
  | 'CHECKOUTS_SETTLEMENT'
  | 'COMPLAINTS_SLA';

interface ReportingViewProps {
  residents: Resident[];
  invoices: Invoice[];
  payments: Payment[];
  expenses: Expense[];
  complaints: Complaint[];
  checkoutRecords: CheckoutRecord[];
  beds: Bed[];
  rooms: Room[];
  hostel: Hostel | null;
  onShowToast: (message: string, type?: 'success' | 'error' | 'info') => void;
}

export default function ReportingView({
  residents,
  invoices,
  payments,
  expenses,
  complaints,
  checkoutRecords,
  beds,
  rooms,
  hostel,
  onShowToast
}: ReportingViewProps) {
  const [selectedReport, setSelectedReport] = useState<ReportType>('REVENUE_COLLECTION');
  const [selectedBuilding, setSelectedBuilding] = useState<string>('ALL');
  const [dateRangePreset, setDateRangePreset] = useState<string>('ALL_TIME');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState<string>('');

  // Identify buildings from rooms and beds
  const availableBuildings = useMemo(() => {
    const list = [
      { id: 'ALL', name: 'All Buildings (Entire Facility)' },
      { id: 'bld-01', code: 'A', name: 'Building A (Main Block - Madhapur)' },
      { id: 'bld-02', code: 'B', name: 'Building B (New Annex - High-Tech City)' }
    ];
    return list;
  }, []);

  // Set date ranges according to preset
  const handlePresetChange = (preset: string) => {
    setDateRangePreset(preset);
    const now = new Date();

    if (preset === 'ALL_TIME') {
      setStartDate('');
      setEndDate('');
    } else if (preset === 'THIS_MONTH') {
      const firstDay = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
      const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0];
      setStartDate(firstDay);
      setEndDate(lastDay);
    } else if (preset === 'LAST_MONTH') {
      const firstDay = new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString().split('T')[0];
      const lastDay = new Date(now.getFullYear(), now.getMonth(), 0).toISOString().split('T')[0];
      setStartDate(firstDay);
      setEndDate(lastDay);
    } else if (preset === 'THIS_QUARTER') {
      const currentQuarter = Math.floor(now.getMonth() / 3);
      const firstDay = new Date(now.getFullYear(), currentQuarter * 3, 1).toISOString().split('T')[0];
      const lastDay = new Date(now.getFullYear(), (currentQuarter + 1) * 3, 0).toISOString().split('T')[0];
      setStartDate(firstDay);
      setEndDate(lastDay);
    } else if (preset === 'FY_2025_26') {
      setStartDate('2025-04-01');
      setEndDate('2026-03-31');
    }
  };

  // Helper to map room or bed to building
  const getRoomBuilding = useCallback((roomNumber?: string, roomId?: string): string => {
    if (roomId) {
      const room = rooms.find(r => r.id === roomId);
      if (room?.buildingId) return room.buildingId;
    }
    if (roomNumber) {
      const room = rooms.find(r => r.roomNumber === roomNumber);
      if (room?.buildingId) return room.buildingId;
      // Heuristic if building code is embedded
      if (roomNumber.endsWith('B') || roomNumber.startsWith('B')) return 'bld-02';
    }
    return 'bld-01'; // default to Building A
  }, [rooms]);

  // Helper date checker
  const isDateInRange = useCallback((dateStr?: string) => {
    if (!startDate && !endDate) return true;
    if (!dateStr) return true;
    const target = new Date(dateStr.split('T')[0]).getTime();
    if (startDate && target < new Date(startDate).getTime()) return false;
    if (endDate && target > new Date(endDate + 'T23:59:59').getTime()) return false;
    return true;
  }, [startDate, endDate]);

  // Helper building checker
  const isBuildingMatch = useCallback((bldId: string) => {
    if (selectedBuilding === 'ALL') return true;
    return bldId === selectedBuilding;
  }, [selectedBuilding]);

  // ==========================================
  // DATA FILTERING FOR EACH REPORT
  // ==========================================

  // 1. Revenue & Invoices Report Data
  const revenueReportData = useMemo(() => {
    return invoices
      .filter(inv => {
        const bld = getRoomBuilding(inv.roomNumber);
        if (!isBuildingMatch(bld)) return false;
        if (!isDateInRange(inv.issueDate)) return false;
        if (searchTerm) {
          const q = searchTerm.toLowerCase();
          return (
            inv.invoiceNumber.toLowerCase().includes(q) ||
            inv.residentName.toLowerCase().includes(q) ||
            inv.roomNumber.toLowerCase().includes(q)
          );
        }
        return true;
      })
      .map(inv => {
        const bld = getRoomBuilding(inv.roomNumber);
        return {
          invoiceNumber: inv.invoiceNumber,
          residentName: inv.residentName,
          roomBed: `${inv.roomNumber}-${inv.bedNumber}`,
          building: bld === 'bld-02' ? 'Building B' : 'Building A',
          period: inv.billingPeriod,
          issueDate: inv.issueDate,
          dueDate: inv.dueDate,
          totalAmount: inv.totalAmount,
          paidAmount: inv.paidAmount,
          outstandingBalance: inv.outstandingBalance,
          status: inv.status
        };
      });
  }, [invoices, getRoomBuilding, isBuildingMatch, isDateInRange, searchTerm]);

  // 2. Payments & Collections Report Data
  const paymentsReportData = useMemo(() => {
    return payments
      .filter(pay => {
        const resident = residents.find(r => r.id === pay.residentId);
        const bld = getRoomBuilding(resident?.roomNumber);
        if (!isBuildingMatch(bld)) return false;
        if (!isDateInRange(pay.paymentDate)) return false;
        if (searchTerm) {
          const q = searchTerm.toLowerCase();
          return (
            pay.receiptNumber.toLowerCase().includes(q) ||
            pay.residentName.toLowerCase().includes(q) ||
            pay.paymentMethod.toLowerCase().includes(q) ||
            (pay.referenceNumber && pay.referenceNumber.toLowerCase().includes(q))
          );
        }
        return true;
      })
      .map(pay => {
        const resident = residents.find(r => r.id === pay.residentId);
        const bld = getRoomBuilding(resident?.roomNumber);
        return {
          receiptNumber: pay.receiptNumber,
          invoiceNumber: pay.invoiceNumber,
          residentName: pay.residentName,
          building: bld === 'bld-02' ? 'Building B' : 'Building A',
          paymentDate: pay.paymentDate,
          paymentMethod: pay.paymentMethod,
          referenceNumber: pay.referenceNumber || 'N/A',
          amount: pay.amount,
          collectedBy: pay.collectedBy
        };
      });
  }, [payments, residents, getRoomBuilding, isBuildingMatch, isDateInRange, searchTerm]);

  // 3. Occupancy & Bed Utilization Report Data
  const occupancyReportData = useMemo(() => {
    return rooms
      .filter(rm => {
        if (!isBuildingMatch(rm.buildingId)) return false;
        if (searchTerm) {
          const q = searchTerm.toLowerCase();
          return (
            rm.roomNumber.toLowerCase().includes(q) ||
            rm.roomType.toLowerCase().includes(q) ||
            rm.floorName.toLowerCase().includes(q)
          );
        }
        return true;
      })
      .map(rm => {
        const roomBeds = beds.filter(b => b.roomId === rm.id);
        const totalBeds = roomBeds.length;
        const occupiedBeds = roomBeds.filter(b => b.status === 'OCCUPIED').length;
        const availableBeds = roomBeds.filter(b => b.status === 'AVAILABLE').length;
        const maintenanceBeds = roomBeds.filter(b => b.status === 'MAINTENANCE').length;
        const occupancyRate = totalBeds > 0 ? Math.round((occupiedBeds / totalBeds) * 100) : 0;
        const occupants = roomBeds
          .filter(b => b.currentResidentName)
          .map(b => `${b.bedNumber}: ${b.currentResidentName}`)
          .join(', ') || 'None';

        return {
          roomNumber: rm.roomNumber,
          building: rm.buildingId === 'bld-02' ? 'Building B' : 'Building A',
          floor: rm.floorName,
          sharingType: rm.roomType.replace('_', ' '),
          totalBeds,
          occupiedBeds,
          availableBeds,
          maintenanceBeds,
          occupancyRate: `${occupancyRate}%`,
          occupants
        };
      });
  }, [rooms, beds, isBuildingMatch, searchTerm]);

  // 4. Resident Dues / Defaulters Report Data
  const residentDuesReportData = useMemo(() => {
    return residents
      .filter(r => {
        const bld = getRoomBuilding(r.roomNumber, r.roomId);
        if (!isBuildingMatch(bld)) return false;
        if (r.outstandingBalance <= 0) return false;
        if (searchTerm) {
          const q = searchTerm.toLowerCase();
          return (
            r.fullName.toLowerCase().includes(q) ||
            r.mobile.includes(q) ||
            (r.roomNumber && r.roomNumber.toLowerCase().includes(q))
          );
        }
        return true;
      })
      .map(r => {
        const bld = getRoomBuilding(r.roomNumber, r.roomId);
        return {
          id: r.id,
          name: r.fullName,
          roomBed: `${r.roomNumber || 'N/A'}-${r.bedNumber || 'N/A'}`,
          building: bld === 'bld-02' ? 'Building B' : 'Building A',
          mobile: r.mobile,
          emergencyContact: `${r.emergencyContactName} (${r.emergencyContactPhone})`,
          monthlyRent: r.monthlyRent,
          outstandingBalance: r.outstandingBalance,
          joiningDate: r.joiningDate
        };
      });
  }, [residents, getRoomBuilding, isBuildingMatch, searchTerm]);

  // 5. Operational Expenses Report Data
  const expensesReportData = useMemo(() => {
    return expenses
      .filter(exp => {
        // Expenses filter by date range
        if (!isDateInRange(exp.date)) return false;
        if (searchTerm) {
          const q = searchTerm.toLowerCase();
          return (
            exp.description.toLowerCase().includes(q) ||
            exp.vendor.toLowerCase().includes(q) ||
            exp.category.toLowerCase().includes(q)
          );
        }
        return true;
      })
      .map(exp => ({
        id: exp.id,
        date: exp.date,
        category: exp.category,
        vendor: exp.vendor,
        description: exp.description,
        amount: exp.amount,
        paymentMethod: exp.paymentMethod,
        createdBy: exp.createdBy
      }));
  }, [expenses, isDateInRange, searchTerm]);

  // 6. Checkouts Report Data
  const checkoutsReportData = useMemo(() => {
    return (checkoutRecords || [])
      .filter(chk => {
        const bld = getRoomBuilding(chk.roomNumber);
        if (!isBuildingMatch(bld)) return false;
        if (!isDateInRange(chk.checkoutDate)) return false;
        if (searchTerm) {
          const q = searchTerm.toLowerCase();
          return (
            chk.residentName.toLowerCase().includes(q) ||
            chk.roomNumber.toLowerCase().includes(q)
          );
        }
        return true;
      })
      .map(chk => {
        const bld = getRoomBuilding(chk.roomNumber);
        return {
          id: chk.id,
          residentName: chk.residentName,
          roomBed: `${chk.roomNumber}-${chk.bedNumber}`,
          building: bld === 'bld-02' ? 'Building B' : 'Building A',
          checkoutDate: new Date(chk.checkoutDate).toLocaleDateString('en-IN'),
          depositPaid: chk.depositPaid,
          pendingDues: chk.pendingDues,
          damageCharges: chk.damageCharges,
          refundAmount: chk.refundAmount,
          settlementStatus: chk.settlementStatus,
          processedBy: chk.processedBy
        };
      });
  }, [checkoutRecords, getRoomBuilding, isBuildingMatch, isDateInRange, searchTerm]);

  // 7. Complaints & Maintenance Report Data
  const complaintsReportData = useMemo(() => {
    return complaints
      .filter(cmp => {
        const bld = getRoomBuilding(cmp.roomNumber);
        if (!isBuildingMatch(bld)) return false;
        if (!isDateInRange(cmp.createdAt)) return false;
        if (searchTerm) {
          const q = searchTerm.toLowerCase();
          return (
            cmp.residentName.toLowerCase().includes(q) ||
            cmp.category.toLowerCase().includes(q) ||
            cmp.description.toLowerCase().includes(q) ||
            (cmp.roomNumber && cmp.roomNumber.toLowerCase().includes(q))
          );
        }
        return true;
      })
      .map(cmp => {
        const bld = getRoomBuilding(cmp.roomNumber);
        return {
          id: cmp.id,
          residentName: cmp.residentName,
          roomNumber: cmp.roomNumber,
          building: bld === 'bld-02' ? 'Building B' : 'Building A',
          category: cmp.category,
          priority: cmp.priority,
          status: cmp.status,
          assignedStaff: cmp.assignedStaffName || 'Unassigned',
          repairCost: cmp.repairCost || 0,
          createdAt: new Date(cmp.createdAt).toLocaleDateString('en-IN')
        };
      });
  }, [complaints, getRoomBuilding, isBuildingMatch, isDateInRange, searchTerm]);

  // ==========================================
  // SUMMARY METRICS COMPUTATION
  // ==========================================
  const summaryMetrics = useMemo(() => {
    const totalBilled = revenueReportData.reduce((acc, r) => acc + r.totalAmount, 0);
    const totalCollected = revenueReportData.reduce((acc, r) => acc + r.paidAmount, 0);
    const totalOutstanding = revenueReportData.reduce((acc, r) => acc + r.outstandingBalance, 0);
    const totalExpenses = expensesReportData.reduce((acc, e) => acc + e.amount, 0);
    const netOperatingProfit = totalCollected - totalExpenses;

    const totalRooms = occupancyReportData.length;
    const totalBeds = occupancyReportData.reduce((acc, o) => acc + o.totalBeds, 0);
    const totalOccupiedBeds = occupancyReportData.reduce((acc, o) => acc + o.occupiedBeds, 0);
    const overallOccupancyRate = totalBeds > 0 ? Math.round((totalOccupiedBeds / totalBeds) * 100) : 0;

    return {
      totalBilled,
      totalCollected,
      totalOutstanding,
      totalExpenses,
      netOperatingProfit,
      totalRooms,
      totalBeds,
      totalOccupiedBeds,
      overallOccupancyRate
    };
  }, [revenueReportData, expensesReportData, occupancyReportData]);

  // ==========================================
  // EXPORT HANDLERS: CSV & EXCEL & PRINT
  // ==========================================

  // Get active dataset for currently selected report
  const getCurrentDataset = () => {
    switch (selectedReport) {
      case 'REVENUE_COLLECTION':
        return { title: 'Financial_Revenue_Report', data: revenueReportData };
      case 'OCCUPANCY_UTILIZATION':
        return { title: 'Occupancy_Bed_Matrix_Report', data: occupancyReportData };
      case 'RESIDENT_DUES':
        return { title: 'Resident_Arrears_Dues_Report', data: residentDuesReportData };
      case 'OPERATIONAL_EXPENSES':
        return { title: 'Operational_Expenses_Report', data: expensesReportData };
      case 'CHECKOUTS_SETTLEMENT':
        return { title: 'Checkouts_Settlement_Report', data: checkoutsReportData };
      case 'COMPLAINTS_SLA':
        return { title: 'Maintenance_Complaints_Report', data: complaintsReportData };
      case 'BUILDING_COMPARISON':
        return { title: 'Building_Comparison_Report', data: occupancyReportData };
      default:
        return { title: 'Hostel_Report', data: revenueReportData };
    }
  };

  const handleExportCSV = () => {
    const { title, data } = getCurrentDataset();
    if (data.length === 0) {
      onShowToast('No data available to export for current filters', 'info');
      return;
    }

    const keys = Object.keys(data[0]);
    const headerRow = keys.map(k => `"${k}"`).join(',');
    const rows = data.map(item =>
      keys.map(k => `"${String((item as any)[k] ?? '').replace(/"/g, '""')}"`).join(',')
    );

    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + [headerRow, ...rows].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Sri_Srinivasa_${title}_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    onShowToast(`Exported ${data.length} rows to CSV format`, 'success');
  };

  const handleExportExcel = () => {
    const { title, data } = getCurrentDataset();
    if (data.length === 0) {
      onShowToast('No data available to export for current filters', 'info');
      return;
    }

    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, title.slice(0, 31));

    // Also append summary sheet
    const summarySheetData = [
      { Metric: 'Report Name', Value: title.replace(/_/g, ' ') },
      { Metric: 'Selected Building', Value: selectedBuilding === 'ALL' ? 'All Buildings' : selectedBuilding },
      { Metric: 'Date Range', Value: `${startDate || 'Start'} to ${endDate || 'Current'}` },
      { Metric: 'Generated On', Value: new Date().toLocaleString('en-IN') },
      { Metric: 'Total Revenue Billed', Value: `₹${summaryMetrics.totalBilled.toLocaleString('en-IN')}` },
      { Metric: 'Total Collections', Value: `₹${summaryMetrics.totalCollected.toLocaleString('en-IN')}` },
      { Metric: 'Total Pending Dues', Value: `₹${summaryMetrics.totalOutstanding.toLocaleString('en-IN')}` },
      { Metric: 'Total Operating Expenses', Value: `₹${summaryMetrics.totalExpenses.toLocaleString('en-IN')}` },
      { Metric: 'Net Operating Profit', Value: `₹${summaryMetrics.netOperatingProfit.toLocaleString('en-IN')}` },
      { Metric: 'Total Bed Capacity', Value: summaryMetrics.totalBeds },
      { Metric: 'Active Occupancy', Value: `${summaryMetrics.totalOccupiedBeds} (${summaryMetrics.overallOccupancyRate}%)` }
    ];
    const summarySheet = XLSX.utils.json_to_sheet(summarySheetData);
    XLSX.utils.book_append_sheet(workbook, summarySheet, 'Executive Summary');

    XLSX.writeFile(workbook, `Sri_Srinivasa_${title}_${new Date().toISOString().split('T')[0]}.xlsx`);
    onShowToast(`Generated formatted Excel workbook (${title}.xlsx)`, 'success');
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* ============================================================ */}
      {/* 1. HEADER & EXPORT ACTIONS BAR */}
      {/* ============================================================ */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-700">
              <FileSpreadsheet className="w-5 h-5" />
            </span>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">
              Reports & Operational Analytics
            </h1>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-800 border border-blue-200">
              Multi-Building ERP
            </span>
          </div>
          <p className="text-xs text-slate-500">
            Generate and export financial, occupancy, receivables, and maintenance reports filtered by building and date range.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 print:hidden">
          <button
            onClick={handleExportCSV}
            className="px-3 py-2 rounded-xl text-xs font-semibold bg-white hover:bg-slate-50 text-slate-700 transition flex items-center gap-1.5 border border-slate-300 shadow-xs"
          >
            <Download className="w-3.5 h-3.5 text-slate-500" />
            Export CSV
          </button>

          <button
            onClick={handleExportExcel}
            className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white transition flex items-center gap-1.5 shadow-xs"
          >
            <Download className="w-3.5 h-3.5 text-emerald-100" />
            Export Excel (.xlsx)
          </button>

          <button
            onClick={handlePrint}
            className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-slate-900 hover:bg-slate-800 text-white transition flex items-center gap-1.5 shadow-xs"
          >
            <Printer className="w-3.5 h-3.5" />
            Printable PDF Report
          </button>
        </div>
      </div>

      {/* ============================================================ */}
      {/* 2. ADVANCED FILTERING SUITE (BUILDINGS + DATE RANGES) */}
      {/* ============================================================ */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4 print:hidden">
        {/* Report Type Selector Tabs */}
        <div>
          <label className="block text-slate-500 font-semibold text-[11px] uppercase tracking-wider mb-2">
            Select Report Type
          </label>
          <div className="flex flex-wrap gap-2">
            {[
              { id: 'REVENUE_COLLECTION', label: 'Financial & Collections', icon: DollarSign },
              { id: 'OCCUPANCY_UTILIZATION', label: 'Occupancy & Bed Matrix', icon: BedDouble },
              { id: 'RESIDENT_DUES', label: 'Arrears & Outstanding Dues', icon: AlertCircle },
              { id: 'OPERATIONAL_EXPENSES', label: 'Operational Expenses & P&L', icon: Receipt },
              { id: 'CHECKOUTS_SETTLEMENT', label: 'Checkouts & Refunds', icon: LogOut },
              { id: 'COMPLAINTS_SLA', label: 'Complaints & Maintenance', icon: Wrench },
              { id: 'BUILDING_COMPARISON', label: 'Building A vs B Comparison', icon: Building2 }
            ].map(tab => {
              const Icon = tab.icon;
              const isActive = selectedReport === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setSelectedReport(tab.id as ReportType)}
                  className={`px-3 py-2 rounded-xl text-xs font-semibold transition flex items-center gap-1.5 border ${
                    isActive
                      ? 'bg-amber-600 text-white border-amber-600 shadow-xs'
                      : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Filters Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-3 border-t border-slate-100">
          {/* Specific Building Filter */}
          <div>
            <label className="block text-slate-700 font-bold text-xs mb-1.5 flex items-center gap-1.5">
              <Building2 className="w-3.5 h-3.5 text-amber-600" />
              Filter by Building
            </label>
            <select
              value={selectedBuilding}
              onChange={(e) => setSelectedBuilding(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
            >
              {availableBuildings.map(bld => (
                <option key={bld.id} value={bld.id}>
                  {bld.name}
                </option>
              ))}
            </select>
          </div>

          {/* Date Range Preset */}
          <div>
            <label className="block text-slate-700 font-bold text-xs mb-1.5 flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-blue-600" />
              Date Range Preset
            </label>
            <select
              value={dateRangePreset}
              onChange={(e) => handlePresetChange(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
            >
              <option value="ALL_TIME">All Time (Full History)</option>
              <option value="THIS_MONTH">This Month</option>
              <option value="LAST_MONTH">Last Month</option>
              <option value="THIS_QUARTER">This Financial Quarter</option>
              <option value="FY_2025_26">Financial Year 2025-2026</option>
              <option value="CUSTOM">Custom Date Range</option>
            </select>
          </div>

          {/* Custom Start Date */}
          <div>
            <label className="block text-slate-700 font-bold text-xs mb-1.5">
              From Date
            </label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => {
                setStartDate(e.target.value);
                setDateRangePreset('CUSTOM');
              }}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
            />
          </div>

          {/* Custom End Date */}
          <div>
            <label className="block text-slate-700 font-bold text-xs mb-1.5">
              To Date
            </label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => {
                setEndDate(e.target.value);
                setDateRangePreset('CUSTOM');
              }}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
            />
          </div>
        </div>

        {/* Search within Report Data */}
        <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
          <div className="w-full sm:w-80 relative">
            <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search in generated report records..."
              className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500/20"
            />
          </div>

          <div className="flex items-center gap-2 text-slate-500">
            <span>Current Scope:</span>
            <span className="font-bold text-slate-800">
              {selectedBuilding === 'ALL' ? 'All Buildings' : availableBuildings.find(b => b.id === selectedBuilding)?.name}
            </span>
            <span>•</span>
            <span className="font-bold text-slate-800">
              {startDate && endDate ? `${startDate} to ${endDate}` : 'All Dates'}
            </span>
          </div>
        </div>
      </div>

      {/* ============================================================ */}
      {/* 3. EXECUTIVE KPI CARDS */}
      {/* ============================================================ */}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold mb-1">
            <span>Total Collections</span>
            <span className="p-1 rounded-md bg-emerald-50 text-emerald-700">₹</span>
          </div>
          <p className="text-xl font-bold text-emerald-700">
            ₹{summaryMetrics.totalCollected.toLocaleString('en-IN')}
          </p>
          <span className="text-[11px] text-slate-400 mt-1 block">
            Billed: ₹{summaryMetrics.totalBilled.toLocaleString('en-IN')}
          </span>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold mb-1">
            <span>Outstanding Dues</span>
            <span className="p-1 rounded-md bg-rose-50 text-rose-700">!</span>
          </div>
          <p className="text-xl font-bold text-rose-700">
            ₹{summaryMetrics.totalOutstanding.toLocaleString('en-IN')}
          </p>
          <span className="text-[11px] text-slate-400 mt-1 block">
            Across {residentDuesReportData.length} pending resident accounts
          </span>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold mb-1">
            <span>Bed Occupancy</span>
            <span className="p-1 rounded-md bg-blue-50 text-blue-700">%</span>
          </div>
          <p className="text-xl font-bold text-blue-700">
            {summaryMetrics.overallOccupancyRate}%
          </p>
          <span className="text-[11px] text-slate-400 mt-1 block">
            {summaryMetrics.totalOccupiedBeds} occupied / {summaryMetrics.totalBeds} total beds
          </span>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold mb-1">
            <span>Net Operating Margin</span>
            <span className="p-1 rounded-md bg-purple-50 text-purple-700">₹</span>
          </div>
          <p className="text-xl font-bold text-purple-700">
            ₹{summaryMetrics.netOperatingProfit.toLocaleString('en-IN')}
          </p>
          <span className="text-[11px] text-slate-400 mt-1 block">
            After ₹{summaryMetrics.totalExpenses.toLocaleString('en-IN')} operational expenses
          </span>
        </div>
      </div>

      {/* ============================================================ */}
      {/* 4. PRINTABLE REPORT HEADER (VISIBLE ON PRINT ONLY) */}
      {/* ============================================================ */}
      <div className="hidden print:block mb-6 p-6 border-b-2 border-slate-800">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
              {hostel?.name || 'SRI SRINIVASA LUXURY BOYS HOSTEL'}
            </h1>
            <p className="text-xs text-slate-600 mt-0.5">
              {hostel?.address || 'Plot 42, Silicon Valley, Madhapur, Hyderabad - 500081'}
            </p>
            <p className="text-xs text-slate-500">
              Contact: {hostel?.phone || '+91 98480 22338'} • GSTIN: {hostel?.gstin || '36AAAFS2345M1Z8'}
            </p>
          </div>
          <div className="text-right">
            <span className="inline-block px-3 py-1 bg-slate-900 text-white font-bold text-xs rounded">
              OFFICIAL ERP REPORT
            </span>
            <p className="text-[11px] text-slate-500 mt-1">Generated: {new Date().toLocaleString('en-IN')}</p>
            <p className="text-[11px] text-slate-500 font-semibold">
              Scope: {selectedBuilding === 'ALL' ? 'All Buildings' : selectedBuilding}
            </p>
          </div>
        </div>
      </div>

      {/* ============================================================ */}
      {/* 5. DYNAMIC REPORT CONTENT ACCORDING TO SELECTED TAB */}
      {/* ============================================================ */}

      {/* REPORT 1: FINANCIAL REVENUE & COLLECTIONS */}
      {selectedReport === 'REVENUE_COLLECTION' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="p-4 bg-slate-50/70 border-b border-slate-200 flex items-center justify-between">
            <h3 className="font-bold text-sm text-slate-800">
              Financial Billing & Collections Register ({revenueReportData.length} records)
            </h3>
            <span className="text-xs text-slate-500">
              Total Billed: <strong className="text-slate-900">₹{summaryMetrics.totalBilled.toLocaleString('en-IN')}</strong> •
              Collected: <strong className="text-emerald-700">₹{summaryMetrics.totalCollected.toLocaleString('en-IN')}</strong>
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-100 text-slate-700 font-semibold uppercase text-[10px] tracking-wider border-b border-slate-200">
                <tr>
                  <th className="px-4 py-3">Invoice #</th>
                  <th className="px-4 py-3">Resident</th>
                  <th className="px-4 py-3">Building & Room</th>
                  <th className="px-4 py-3">Billing Period</th>
                  <th className="px-4 py-3 text-right">Total Amount</th>
                  <th className="px-4 py-3 text-right">Paid Amount</th>
                  <th className="px-4 py-3 text-right">Balance Due</th>
                  <th className="px-4 py-3 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {revenueReportData.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-4 py-8 text-center text-slate-400">
                      No invoices found matching selected building and date filters.
                    </td>
                  </tr>
                ) : (
                  revenueReportData.map((inv, idx) => (
                    <tr key={idx} className="hover:bg-slate-50/70">
                      <td className="px-4 py-2.5 font-mono font-bold text-amber-700">{inv.invoiceNumber}</td>
                      <td className="px-4 py-2.5 font-semibold text-slate-900">{inv.residentName}</td>
                      <td className="px-4 py-2.5 text-slate-600">
                        <span className="font-semibold text-slate-800">{inv.building}</span> • {inv.roomBed}
                      </td>
                      <td className="px-4 py-2.5 text-slate-500">{inv.period}</td>
                      <td className="px-4 py-2.5 text-right font-semibold text-slate-900">₹{inv.totalAmount.toLocaleString('en-IN')}</td>
                      <td className="px-4 py-2.5 text-right font-semibold text-emerald-700">₹{inv.paidAmount.toLocaleString('en-IN')}</td>
                      <td className="px-4 py-2.5 text-right font-bold text-rose-600">₹{inv.outstandingBalance.toLocaleString('en-IN')}</td>
                      <td className="px-4 py-2.5 text-center">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                          inv.status === 'PAID' ? 'bg-emerald-100 text-emerald-800' :
                          inv.status === 'PARTIAL' ? 'bg-amber-100 text-amber-800' : 'bg-rose-100 text-rose-800'
                        }`}>
                          {inv.status}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* REPORT 2: OCCUPANCY & BED UTILIZATION */}
      {selectedReport === 'OCCUPANCY_UTILIZATION' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="p-4 bg-slate-50/70 border-b border-slate-200 flex items-center justify-between">
            <h3 className="font-bold text-sm text-slate-800">
              Occupancy Matrix & Bed Utilization By Room ({occupancyReportData.length} rooms)
            </h3>
            <span className="text-xs text-slate-500">
              Occupancy Rate: <strong className="text-blue-700">{summaryMetrics.overallOccupancyRate}%</strong>
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-100 text-slate-700 font-semibold uppercase text-[10px] tracking-wider border-b border-slate-200">
                <tr>
                  <th className="px-4 py-3">Room</th>
                  <th className="px-4 py-3">Building</th>
                  <th className="px-4 py-3">Floor</th>
                  <th className="px-4 py-3">Sharing</th>
                  <th className="px-4 py-3 text-center">Capacity</th>
                  <th className="px-4 py-3 text-center">Occupied</th>
                  <th className="px-4 py-3 text-center">Available</th>
                  <th className="px-4 py-3 text-center">Occupancy Rate</th>
                  <th className="px-4 py-3">Active Residents</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {occupancyReportData.map((rm, idx) => (
                  <tr key={idx} className="hover:bg-slate-50/70">
                    <td className="px-4 py-2.5 font-bold text-slate-900">{rm.roomNumber}</td>
                    <td className="px-4 py-2.5 font-semibold text-slate-700">{rm.building}</td>
                    <td className="px-4 py-2.5 text-slate-500">{rm.floor}</td>
                    <td className="px-4 py-2.5">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-700">
                        {rm.sharingType}
                      </span>
                    </td>
                    <td className="px-4 py-2.5 text-center font-bold text-slate-800">{rm.totalBeds}</td>
                    <td className="px-4 py-2.5 text-center font-bold text-emerald-700">{rm.occupiedBeds}</td>
                    <td className="px-4 py-2.5 text-center font-bold text-blue-700">{rm.availableBeds}</td>
                    <td className="px-4 py-2.5 text-center font-bold text-amber-700">{rm.occupancyRate}</td>
                    <td className="px-4 py-2.5 text-slate-600 max-w-xs truncate">{rm.occupants}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* REPORT 3: RESIDENT ARREARS & DUES */}
      {selectedReport === 'RESIDENT_DUES' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="p-4 bg-slate-50/70 border-b border-slate-200 flex items-center justify-between">
            <h3 className="font-bold text-sm text-rose-900">
              Outstanding Dues & Defaulters Ledger ({residentDuesReportData.length} active residents)
            </h3>
            <span className="text-xs text-rose-800 font-bold">
              Total Arrears: ₹{summaryMetrics.totalOutstanding.toLocaleString('en-IN')}
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-100 text-slate-700 font-semibold uppercase text-[10px] tracking-wider border-b border-slate-200">
                <tr>
                  <th className="px-4 py-3">Resident ID</th>
                  <th className="px-4 py-3">Full Name</th>
                  <th className="px-4 py-3">Room & Bed</th>
                  <th className="px-4 py-3">Building</th>
                  <th className="px-4 py-3">Resident Mobile</th>
                  <th className="px-4 py-3">Guardian Contact</th>
                  <th className="px-4 py-3 text-right">Monthly Rent</th>
                  <th className="px-4 py-3 text-right font-bold text-rose-700">Total Pending Due</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {residentDuesReportData.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-4 py-8 text-center text-emerald-600 font-semibold">
                      All residents in selected building are 100% up to date with zero pending balance!
                    </td>
                  </tr>
                ) : (
                  residentDuesReportData.map((res, idx) => (
                    <tr key={idx} className="hover:bg-rose-50/30">
                      <td className="px-4 py-2.5 font-mono text-slate-500">{res.id}</td>
                      <td className="px-4 py-2.5 font-bold text-slate-900">{res.name}</td>
                      <td className="px-4 py-2.5 font-semibold text-amber-800">{res.roomBed}</td>
                      <td className="px-4 py-2.5 text-slate-600">{res.building}</td>
                      <td className="px-4 py-2.5 font-mono text-slate-700">{res.mobile}</td>
                      <td className="px-4 py-2.5 text-slate-600">{res.emergencyContact}</td>
                      <td className="px-4 py-2.5 text-right text-slate-800">₹{res.monthlyRent.toLocaleString('en-IN')}</td>
                      <td className="px-4 py-2.5 text-right font-bold text-rose-600">₹{res.outstandingBalance.toLocaleString('en-IN')}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* REPORT 4: OPERATIONAL EXPENSES & P&L */}
      {selectedReport === 'OPERATIONAL_EXPENSES' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="p-4 bg-slate-50/70 border-b border-slate-200 flex items-center justify-between">
            <h3 className="font-bold text-sm text-slate-800">
              Hostel Operational Expenditure & Vendors ({expensesReportData.length} expenses)
            </h3>
            <span className="text-xs text-slate-500">
              Total Expenses: <strong className="text-rose-700">₹{summaryMetrics.totalExpenses.toLocaleString('en-IN')}</strong>
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-100 text-slate-700 font-semibold uppercase text-[10px] tracking-wider border-b border-slate-200">
                <tr>
                  <th className="px-4 py-3">Date</th>
                  <th className="px-4 py-3">Category</th>
                  <th className="px-4 py-3">Vendor / Payee</th>
                  <th className="px-4 py-3">Description</th>
                  <th className="px-4 py-3">Method</th>
                  <th className="px-4 py-3 text-right">Amount</th>
                  <th className="px-4 py-3">Recorded By</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {expensesReportData.map((exp, idx) => (
                  <tr key={idx} className="hover:bg-slate-50/70">
                    <td className="px-4 py-2.5 font-mono text-slate-500">{exp.date}</td>
                    <td className="px-4 py-2.5">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-900 uppercase">
                        {exp.category}
                      </span>
                    </td>
                    <td className="px-4 py-2.5 font-bold text-slate-900">{exp.vendor}</td>
                    <td className="px-4 py-2.5 text-slate-600 max-w-sm">{exp.description}</td>
                    <td className="px-4 py-2.5 font-semibold text-slate-700">{exp.paymentMethod}</td>
                    <td className="px-4 py-2.5 text-right font-bold text-rose-600">₹{exp.amount.toLocaleString('en-IN')}</td>
                    <td className="px-4 py-2.5 text-slate-500">{exp.createdBy}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* REPORT 5: CHECKOUTS & DEPOSIT SETTLEMENT */}
      {selectedReport === 'CHECKOUTS_SETTLEMENT' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="p-4 bg-slate-50/70 border-b border-slate-200 flex items-center justify-between">
            <h3 className="font-bold text-sm text-slate-800">
              Resident Vacations & Deposit Settlement Ledger ({checkoutsReportData.length} checkouts)
            </h3>
            <span className="text-xs text-slate-500">All cleared through formal exit inspection</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-100 text-slate-700 font-semibold uppercase text-[10px] tracking-wider border-b border-slate-200">
                <tr>
                  <th className="px-4 py-3">Date</th>
                  <th className="px-4 py-3">Resident</th>
                  <th className="px-4 py-3">Building & Bed</th>
                  <th className="px-4 py-3 text-right">Deposit Held</th>
                  <th className="px-4 py-3 text-right">Pending Dues</th>
                  <th className="px-4 py-3 text-right">Damages Charged</th>
                  <th className="px-4 py-3 text-right font-bold text-emerald-700">Refund Amount</th>
                  <th className="px-4 py-3 text-center">Settlement</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {checkoutsReportData.map((chk, idx) => (
                  <tr key={idx} className="hover:bg-slate-50/70">
                    <td className="px-4 py-2.5 font-mono text-slate-500">{chk.checkoutDate}</td>
                    <td className="px-4 py-2.5 font-bold text-slate-900">{chk.residentName}</td>
                    <td className="px-4 py-2.5 text-slate-600">{chk.building} • {chk.roomBed}</td>
                    <td className="px-4 py-2.5 text-right font-semibold text-slate-800">₹{chk.depositPaid.toLocaleString('en-IN')}</td>
                    <td className="px-4 py-2.5 text-right text-rose-600">₹{chk.pendingDues.toLocaleString('en-IN')}</td>
                    <td className="px-4 py-2.5 text-right text-amber-700">₹{chk.damageCharges.toLocaleString('en-IN')}</td>
                    <td className="px-4 py-2.5 text-right font-bold text-emerald-700">₹{chk.refundAmount.toLocaleString('en-IN')}</td>
                    <td className="px-4 py-2.5 text-center">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800">
                        {chk.settlementStatus}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* REPORT 6: COMPLAINTS & MAINTENANCE SLA */}
      {selectedReport === 'COMPLAINTS_SLA' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="p-4 bg-slate-50/70 border-b border-slate-200 flex items-center justify-between">
            <h3 className="font-bold text-sm text-slate-800">
              Facility Repairs & Maintenance SLA ({complaintsReportData.length} records)
            </h3>
            <span className="text-xs text-slate-500">Track resolution speed and maintenance cost</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-100 text-slate-700 font-semibold uppercase text-[10px] tracking-wider border-b border-slate-200">
                <tr>
                  <th className="px-4 py-3">Logged Date</th>
                  <th className="px-4 py-3">Resident</th>
                  <th className="px-4 py-3">Building & Room</th>
                  <th className="px-4 py-3">Category</th>
                  <th className="px-4 py-3">Priority</th>
                  <th className="px-4 py-3">Assigned Staff</th>
                  <th className="px-4 py-3 text-right">Repair Cost</th>
                  <th className="px-4 py-3 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {complaintsReportData.map((cmp, idx) => (
                  <tr key={idx} className="hover:bg-slate-50/70">
                    <td className="px-4 py-2.5 font-mono text-slate-500">{cmp.createdAt}</td>
                    <td className="px-4 py-2.5 font-bold text-slate-900">{cmp.residentName}</td>
                    <td className="px-4 py-2.5 text-slate-600">{cmp.building} • Room {cmp.roomNumber}</td>
                    <td className="px-4 py-2.5 font-semibold text-slate-800">{cmp.category}</td>
                    <td className="px-4 py-2.5">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        cmp.priority === 'HIGH' || cmp.priority === 'EMERGENCY' ? 'bg-rose-100 text-rose-800' : 'bg-slate-100 text-slate-700'
                      }`}>
                        {cmp.priority}
                      </span>
                    </td>
                    <td className="px-4 py-2.5 text-slate-700">{cmp.assignedStaff}</td>
                    <td className="px-4 py-2.5 text-right font-semibold text-slate-900">
                      {cmp.repairCost ? `₹${cmp.repairCost.toLocaleString('en-IN')}` : '₹0'}
                    </td>
                    <td className="px-4 py-2.5 text-center">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                        cmp.status === 'RESOLVED' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                      }`}>
                        {cmp.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* REPORT 7: BUILDING COMPARISON */}
      {selectedReport === 'BUILDING_COMPARISON' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {['bld-01', 'bld-02'].map((bldId) => {
            const bldName = bldId === 'bld-01' ? 'Building A (Main Block)' : 'Building B (New Annex)';
            const bldRooms = rooms.filter(r => r.buildingId === bldId);
            const bldBeds = beds.filter(b => b.buildingCode === (bldId === 'bld-01' ? 'A' : 'B'));
            const totalB = bldBeds.length;
            const occupiedB = bldBeds.filter(b => b.status === 'OCCUPIED').length;
            const bldResidents = residents.filter(r => getRoomBuilding(r.roomNumber, r.roomId) === bldId);
            const monthlyBilled = bldResidents.reduce((acc, r) => acc + (r.monthlyRent || 0), 0);
            const totalOutstanding = bldResidents.reduce((acc, r) => acc + (r.outstandingBalance || 0), 0);

            return (
              <div key={bldId} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <div>
                    <h3 className="font-bold text-base text-slate-900">{bldName}</h3>
                    <p className="text-xs text-slate-500">Facility ID: {bldId}</p>
                  </div>
                  <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-900">
                    {totalB > 0 ? Math.round((occupiedB / totalB) * 100) : 0}% Occupancy
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div className="p-3 bg-slate-50 rounded-xl">
                    <span className="text-slate-400 block text-[10px]">Total Rooms</span>
                    <strong className="text-base text-slate-800">{bldRooms.length} Rooms</strong>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-xl">
                    <span className="text-slate-400 block text-[10px]">Total Capacity</span>
                    <strong className="text-base text-slate-800">{totalB} Beds</strong>
                  </div>
                  <div className="p-3 bg-emerald-50 rounded-xl">
                    <span className="text-emerald-700 block text-[10px]">Active Occupancy</span>
                    <strong className="text-base text-emerald-800">{occupiedB} Residents</strong>
                  </div>
                  <div className="p-3 bg-blue-50 rounded-xl">
                    <span className="text-blue-700 block text-[10px]">Available Beds</span>
                    <strong className="text-base text-blue-800">{totalB - occupiedB} Vacant</strong>
                  </div>
                </div>

                <div className="p-4 bg-slate-50 rounded-xl space-y-2 text-xs">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Monthly Contracted Rent:</span>
                    <strong className="text-slate-900">₹{monthlyBilled.toLocaleString('en-IN')}/mo</strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Uncollected Arrears:</span>
                    <strong className="text-rose-600">₹{totalOutstanding.toLocaleString('en-IN')}</strong>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ============================================================ */}
      {/* 6. PRINT FOOTER SIGN-OFF (FOR FORMAL AUDIT / PDF PRINT) */}
      {/* ============================================================ */}
      <div className="hidden print:block mt-12 pt-8 border-t border-slate-300 text-xs">
        <div className="grid grid-cols-3 gap-8 text-center pt-8">
          <div>
            <div className="h-10 border-b border-slate-400 mx-auto w-40 mb-2"></div>
            <p className="font-bold text-slate-800">Prepared By</p>
            <p className="text-[10px] text-slate-500">Accountant / ERP Operator</p>
          </div>
          <div>
            <div className="h-10 border-b border-slate-400 mx-auto w-40 mb-2"></div>
            <p className="font-bold text-slate-800">Verified By</p>
            <p className="text-[10px] text-slate-500">Hostel Resident Manager</p>
          </div>
          <div>
            <div className="h-10 border-b border-slate-400 mx-auto w-40 mb-2"></div>
            <p className="font-bold text-slate-800">Authorized Signature</p>
            <p className="text-[10px] text-slate-500">Proprietor / Managing Partner</p>
          </div>
        </div>
        <p className="text-center text-[10px] text-slate-400 mt-8">
          Sri Srinivasa Hostel ERP • Computer generated official record • ISO 9001:2015 Tenancy Compliance
        </p>
      </div>
    </div>
  );
}
